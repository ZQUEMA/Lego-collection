import { describe, expect, it } from 'vitest'
import { mergeSnapshots, sameSnapshot } from './merge'
import type { CollectionSnapshot, CopyRecord, SetRecord } from './types'

const set = (setNum: string, updatedAt: number, extra: Partial<SetRecord> = {}): SetRecord => ({
  setNum,
  name: setNum,
  year: 2023,
  minifigs: [],
  updatedAt,
  ...extra
})

const copy = (id: string, setNum: string, updatedAt: number, extra: Partial<CopyRecord> = {}): CopyRecord => ({
  id,
  setNum,
  hasBox: true,
  hasInstructions: true,
  hasSpareParts: true,
  missingParts: [],
  built: true,
  createdAt: 1,
  updatedAt,
  ...extra
})

const snap = (sets: SetRecord[], copies: CopyRecord[]): CollectionSnapshot => ({ version: 1, sets, copies })

describe('mergeSnapshots', () => {
  it('garde la version la plus récente de chaque fiche', () => {
    const local = snap([set('75356-1', 10, { nameFr: 'local' })], [copy('a', '75356-1', 5, { hasBox: false })])
    const remote = snap([set('75356-1', 20, { nameFr: 'remote' })], [copy('a', '75356-1', 3, { hasBox: true })])
    const merged = mergeSnapshots(local, remote)
    expect(merged.sets[0].nameFr).toBe('remote')
    expect(merged.copies[0].hasBox).toBe(false)
  })

  it('réunit les exemplaires des deux côtés, y compris deux fois le même set', () => {
    const local = snap([set('75347-1', 1)], [copy('a', '75347-1', 1)])
    const remote = snap([set('75347-1', 1)], [copy('b', '75347-1', 2)])
    const merged = mergeSnapshots(local, remote)
    expect(merged.copies.map((c) => c.id).sort()).toEqual(['a', 'b'])
    expect(merged.sets).toHaveLength(1)
  })

  it('propage une suppression plus récente', () => {
    const local = snap([], [copy('a', 'x', 9, { deleted: true })])
    const remote = snap([], [copy('a', 'x', 4)])
    expect(mergeSnapshots(local, remote).copies[0].deleted).toBe(true)
  })

  it('détecte un instantané identique', () => {
    const a = snap([set('1-1', 1)], [copy('a', '1-1', 2)])
    const b = snap([set('1-1', 1)], [copy('a', '1-1', 2)])
    expect(sameSnapshot(a, b)).toBe(true)
    expect(sameSnapshot(a, snap([set('1-1', 2)], [copy('a', '1-1', 2)]))).toBe(false)
  })
})
