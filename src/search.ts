import { englishToFrench, fold } from './i18n'
import type { CopyRecord, SetRecord } from './types'

export interface OwnedFilter {
  text?: string
  year?: number
  character?: string
  characterCount?: number
}

export interface OwnedEntry {
  set: SetRecord
  copies: CopyRecord[]
}

export function characterNames(set: SetRecord): string[] {
  if (set.charactersOverride && set.charactersOverride.length > 0) return set.charactersOverride
  return set.minifigs.flatMap((m) => Array.from({ length: m.quantity }, () => m.name))
}

export function displayName(set: SetRecord): string {
  return set.nameFr?.trim() || englishToFrench(set.name)
}

export function shortNumber(setNum: string): string {
  return setNum.replace(/-1$/, '')
}

export function ownedEntries(sets: SetRecord[], copies: CopyRecord[]): OwnedEntry[] {
  const bySet = new Map<string, CopyRecord[]>()
  for (const c of copies) {
    if (c.deleted) continue
    const list = bySet.get(c.setNum) ?? []
    list.push(c)
    bySet.set(c.setNum, list)
  }
  return sets
    .filter((s) => !s.deleted && bySet.has(s.setNum))
    .map((set) => ({ set, copies: bySet.get(set.setNum)!.sort((a, b) => a.createdAt - b.createdAt) }))
}

export function matchesFilter(set: SetRecord, f: OwnedFilter): boolean {
  if (f.text) {
    const q = fold(f.text)
    const hay = [set.setNum, shortNumber(set.setNum), set.name, displayName(set), set.collection ?? '', set.episode ?? '']
      .map(fold)
      .join(' ')
    if (!q.split(/\s+/).every((w) => hay.includes(w))) return false
  }
  if (f.year && set.year !== f.year) return false
  const chars = characterNames(set)
  if (f.character) {
    const q = fold(f.character)
    if (!chars.some((c) => fold(c).includes(q) || fold(englishToFrench(c)).includes(q))) return false
  }
  if (f.characterCount !== undefined && chars.length !== f.characterCount) return false
  return true
}

export function filterOwned(entries: OwnedEntry[], f: OwnedFilter): OwnedEntry[] {
  return entries.filter((e) => matchesFilter(e.set, f))
}

export function sortEntries(entries: OwnedEntry[]): OwnedEntry[] {
  return [...entries].sort((a, b) => b.set.year - a.set.year || a.set.setNum.localeCompare(b.set.setNum, 'fr', { numeric: true }))
}
