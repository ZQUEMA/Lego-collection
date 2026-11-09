import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { rebrickableRelayPath } from './rebrickable'

const script = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8')
const allowedRebrickablePath = new Function(`${/function allowedRebrickablePath[\s\S]*?\n}\n/.exec(script)![0]}; return allowedRebrickablePath`)() as (
  path: string
) => boolean

describe('rebrickableRelayPath', () => {
  const cases = [
    rebrickableRelayPath('/sets/75356-1/'),
    rebrickableRelayPath('/themes/'),
    rebrickableRelayPath('/sets/', { search: 'Millennium Falcon', min_year: 2023, max_year: undefined, page_size: 40 }),
    rebrickableRelayPath('/minifigs/fig-013445/sets/', { page_size: 1000 }),
    rebrickableRelayPath('https://rebrickable.com/api/v3/lego/sets/75356-1/parts/?page=2&page_size=1000')
  ]

  it('produit des chemins acceptés par le relais, avec ou sans paramètres', () => {
    for (const path of cases) expect(allowedRebrickablePath(path), path).toBe(true)
  })

  it('garde le chemin de la page suivante et ignore les paramètres vides', () => {
    expect(cases[0]).toBe('/api/v3/lego/sets/75356-1/')
    expect(cases[4]).toBe('/api/v3/lego/sets/75356-1/parts/?page=2&page_size=1000')
    expect(cases[2]).toBe('/api/v3/lego/sets/?search=Millennium+Falcon&min_year=2023&page_size=40')
  })

  it('refuse un chemin hors de l’API LEGO', () => {
    expect(allowedRebrickablePath('/api/v3/users/abc/')).toBe(false)
    expect(allowedRebrickablePath('https://evil.example/api/v3/lego/sets/')).toBe(false)
    expect(allowedRebrickablePath('/api/v3/lego/../users/')).toBe(false)
    expect(allowedRebrickablePath('/api/v3/lego/sets/#x')).toBe(false)
  })
})
