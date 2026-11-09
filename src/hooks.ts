import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { ownedEntries, type OwnedEntry } from './search'

export function useOwned(): OwnedEntry[] | undefined {
  return useLiveQuery(async () => {
    const [sets, copies] = await Promise.all([db.sets.toArray(), db.copies.toArray()])
    return ownedEntries(sets, copies)
  }, [])
}

export function useOwnedCounts(): Map<string, number> {
  const owned = useOwned()
  return new Map((owned ?? []).map((e) => [e.set.setNum, e.copies.length]))
}
