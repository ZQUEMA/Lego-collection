import Dexie, { type EntityTable } from 'dexie'
import type { CollectionSnapshot, CopyRecord, SetRecord } from './types'

export class CollectionDb extends Dexie {
  sets!: EntityTable<SetRecord, 'setNum'>
  copies!: EntityTable<CopyRecord, 'id'>

  constructor(name = 'lego-collection') {
    super(name)
    this.version(1).stores({
      sets: 'setNum, year, updatedAt',
      copies: 'id, setNum, updatedAt'
    })
  }
}

export const db = new CollectionDb()

export const now = () => Date.now()

export function newId(): string {
  return crypto.randomUUID()
}

export async function exportSnapshot(target: CollectionDb = db): Promise<CollectionSnapshot> {
  const [sets, copies] = await Promise.all([target.sets.toArray(), target.copies.toArray()])
  return { version: 1, sets, copies }
}

export async function replaceWithSnapshot(snapshot: CollectionSnapshot, target: CollectionDb = db) {
  await target.transaction('rw', target.sets, target.copies, async () => {
    await target.sets.clear()
    await target.copies.clear()
    await target.sets.bulkPut(snapshot.sets)
    await target.copies.bulkPut(snapshot.copies)
  })
}

const changeListeners = new Set<() => void>()

export function onLocalChange(fn: () => void): () => void {
  changeListeners.add(fn)
  return () => changeListeners.delete(fn)
}

export const notifyLocalChange = () => changeListeners.forEach((fn) => fn())

export async function saveSet(set: SetRecord) {
  await db.sets.put({ ...set, updatedAt: now() })
  notifyLocalChange()
}

export async function saveCopy(copy: CopyRecord) {
  await db.copies.put({ ...copy, updatedAt: now() })
  notifyLocalChange()
}

export async function deleteCopy(copy: CopyRecord) {
  await db.copies.put({ ...copy, deleted: true, updatedAt: now() })
  notifyLocalChange()
}

export async function clearLocal(target: CollectionDb = db) {
  await target.transaction('rw', target.sets, target.copies, async () => {
    await target.sets.clear()
    await target.copies.clear()
  })
}

export function blankCopy(setNum: string): CopyRecord {
  const t = now()
  return {
    id: newId(),
    setNum,
    hasBox: true,
    hasInstructions: true,
    hasSpareParts: true,
    missingParts: [],
    built: true,
    createdAt: t,
    updatedAt: t
  }
}
