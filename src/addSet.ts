import { blankCopy, db, saveCopy, saveSet } from './db'
import { fetchBricksetInfo } from './brickset'
import { fetchSetRecord } from './rebrickable'
import type { SetRecord } from './types'

export async function enrichFromSources(setNum: string, existing?: SetRecord): Promise<SetRecord> {
  const fresh = await fetchSetRecord(setNum)
  const bs = await fetchBricksetInfo(setNum).catch(() => null)
  return {
    ...fresh,
    collection: existing?.collection || bs?.subtheme || fresh.collection,
    launchDate: existing?.launchDate || bs?.launchDate,
    nameFr: existing?.nameFr,
    episode: existing?.episode,
    charactersOverride: existing?.charactersOverride
  }
}

export async function addCopyOf(setNum: string): Promise<void> {
  const existing = await db.sets.get(setNum)
  if (!existing || existing.deleted) await saveSet({ ...(await enrichFromSources(setNum, existing)), deleted: false })
  await saveCopy(blankCopy(setNum))
}
