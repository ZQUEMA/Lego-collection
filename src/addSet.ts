import { blankCopy, db, notifyLocalChange, now, saveCopy, saveSet } from './db'
import { classifySubtheme } from './constants'
import { fetchRelayInfo } from './relay'
import { fetchSetRecord } from './rebrickable'
import type { SetRecord } from './types'

const sameName = (a: string, b: string) => a.replace(/[™®]/g, '').trim().toLowerCase() === b.replace(/[™®]/g, '').trim().toLowerCase()

export async function enrichFromSources(setNum: string, existing?: SetRecord): Promise<SetRecord> {
  const fresh = await fetchSetRecord(setNum)
  const relay = await fetchRelayInfo(setNum).catch(() => null)
  const officialFr = relay?.nameFr && !sameName(relay.nameFr, fresh.name) ? relay.nameFr : undefined
  const fromSubtheme = classifySubtheme(relay?.subtheme)
  return {
    ...fresh,
    collection: existing?.collection || fromSubtheme.collection || fresh.collection,
    launchDate: existing?.launchDate || relay?.launchDate,
    nameFr: existing?.nameFr || officialFr,
    episode: existing?.episode || fromSubtheme.episode,
    charactersOverride: existing?.charactersOverride
  }
}

export async function addCopyOf(setNum: string): Promise<void> {
  const existing = await db.sets.get(setNum)
  if (!existing || existing.deleted) await saveSet({ ...(await enrichFromSources(setNum, existing?.deleted ? undefined : existing)), deleted: false })
  await saveCopy(blankCopy(setNum))
}

export async function deleteSetFromCollection(set: SetRecord): Promise<void> {
  const copies = await db.copies.where('setNum').equals(set.setNum).toArray()
  const t = now()
  await db.transaction('rw', db.sets, db.copies, async () => {
    await db.copies.bulkPut(copies.filter((c) => !c.deleted).map((c) => ({ ...c, deleted: true, updatedAt: t })))
    await db.sets.put({ ...set, deleted: true, updatedAt: t })
  })
  notifyLocalChange()
}
