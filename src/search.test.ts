import { describe, expect, it } from 'vitest'
import { characterNames, filterOwned, ownedEntries } from './search'
import type { CopyRecord, SetRecord } from './types'

const executor: SetRecord = {
  setNum: '75356-1',
  name: 'Executor Super Star Destroyer',
  nameFr: 'Super Destroyer Stellaire de classe Exécuteur',
  year: 2023,
  collection: 'Starship Collection',
  minifigs: [],
  updatedAt: 1
}

const bomber: SetRecord = {
  setNum: '75347-1',
  name: 'TIE Bomber',
  year: 2023,
  minifigs: [
    { figNum: 'f1', name: 'Darth Vader', quantity: 1 },
    { figNum: 'f2', name: 'Vice Admiral Sloane', quantity: 1 },
    { figNum: 'f3', name: 'TIE Pilot', quantity: 1 },
    { figNum: 'f4', name: 'GNK Power Droid (Gonk)', quantity: 1 }
  ],
  updatedAt: 1
}

const oldSet: SetRecord = { setNum: '7140-1', name: 'X-wing Fighter', year: 1999, minifigs: [], updatedAt: 1 }

const copy = (id: string, setNum: string, deleted = false): CopyRecord => ({
  id,
  setNum,
  hasBox: true,
  hasInstructions: true,
  hasSpareParts: true,
  missingParts: [],
  built: true,
  createdAt: 1,
  updatedAt: 1,
  deleted
})

const entries = ownedEntries(
  [executor, bomber, oldSet],
  [copy('a', '75356-1'), copy('b', '75347-1'), copy('c', '75347-1'), copy('d', '7140-1', true)]
)

describe('ownedEntries', () => {
  it('regroupe les exemplaires par set et ignore les supprimés', () => {
    expect(entries.map((e) => [e.set.setNum, e.copies.length])).toEqual([
      ['75356-1', 1],
      ['75347-1', 2]
    ])
  })
})

describe('filterOwned', () => {
  const nums = (f: Parameters<typeof filterOwned>[1]) => filterOwned(entries, f).map((e) => e.set.setNum)

  it('trouve par numéro court', () => expect(nums({ text: '75356' })).toEqual(['75356-1']))
  it('trouve par nom français sans accents', () => expect(nums({ text: 'executeur' })).toEqual(['75356-1']))
  it('trouve par nom anglais', () => expect(nums({ text: 'tie bomber' })).toEqual(['75347-1']))
  it('filtre par année', () => expect(nums({ year: 2023 })).toHaveLength(2))
  it('filtre par personnage', () => expect(nums({ character: 'vader' })).toEqual(['75347-1']))
  it('filtre par nombre de personnages', () => {
    expect(nums({ characterCount: 4 })).toEqual(['75347-1'])
    expect(nums({ characterCount: 0 })).toEqual(['75356-1'])
  })
})

describe('characterNames', () => {
  it('préfère la liste saisie à la main', () => {
    expect(characterNames({ ...bomber, charactersOverride: ['Dark Vador'] })).toEqual(['Dark Vador'])
  })
})
