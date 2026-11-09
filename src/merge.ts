import type { CollectionSnapshot } from './types'

function mergeBy<T extends { updatedAt: number }>(a: T[], b: T[], key: (x: T) => string): T[] {
  const out = new Map<string, T>()
  for (const item of [...a, ...b]) {
    const k = key(item)
    const prev = out.get(k)
    if (!prev || item.updatedAt > prev.updatedAt) out.set(k, item)
  }
  return [...out.values()]
}

export function mergeSnapshots(local: CollectionSnapshot, remote: CollectionSnapshot): CollectionSnapshot {
  return {
    version: 1,
    sets: mergeBy(local.sets, remote.sets, (s) => s.setNum),
    copies: mergeBy(local.copies, remote.copies, (c) => c.id)
  }
}

export function sameSnapshot(a: CollectionSnapshot, b: CollectionSnapshot): boolean {
  const sig = (s: CollectionSnapshot) =>
    [
      ...s.sets.map((x) => `s:${x.setNum}:${x.updatedAt}`),
      ...s.copies.map((x) => `c:${x.id}:${x.updatedAt}`)
    ]
      .sort()
      .join('|')
  return sig(a) === sig(b)
}
