import { describe, expect, it } from 'vitest'
import { colorFr, englishToFrench, frenchQueryToEnglish, minifigNameFr } from './i18n'

describe('frenchQueryToEnglish', () => {
  it('traduit les termes français, accents et casse ignorés', () => {
    expect(frenchQueryToEnglish('Dark Vador')).toBe('Darth Vader')
    expect(frenchQueryToEnglish('faucon millenium')).toBe('Millennium Falcon')
    expect(frenchQueryToEnglish('etoile de la mort')).toBe('Death Star')
  })

  it('préfère le terme le plus long', () => {
    expect(frenchQueryToEnglish('super destroyer stellaire')).toBe('Super Star Destroyer')
    expect(frenchQueryToEnglish('destroyer stellaire')).toBe('Star Destroyer')
  })

  it('ne retraduit pas un terme déjà traduit', () => {
    expect(frenchQueryToEnglish('pilote tie')).toBe('TIE Pilot')
  })

  it('laisse un numéro ou un mot inconnu tel quel', () => {
    expect(frenchQueryToEnglish('75356')).toBe('75356')
    expect(frenchQueryToEnglish('boba fett')).toBe('boba fett')
  })

  it('ne coupe pas un mot en plein milieu', () => {
    expect(frenchQueryToEnglish('axel')).toBe('axel')
  })
})

describe('englishToFrench', () => {
  it('traduit les noms connus', () => {
    expect(englishToFrench('TIE Bomber')).toBe('Bombardier TIE')
    expect(englishToFrench('Vice Admiral Sloane')).toBe('Vice-Amiral Sloane')
    expect(englishToFrench('Executor Super Star Destroyer')).toBe('Executor Super Destroyer Stellaire')
  })
})

describe('minifigNameFr', () => {
  it('sépare le personnage de la variante', () => {
    expect(minifigNameFr('Darth Vader, White Skin, 19888 Cape')).toEqual({ main: 'Dark Vador', detail: 'White Skin, 19888 Cape' })
    expect(minifigNameFr('Vice Admiral Sloane')).toEqual({ main: 'Vice-Amiral Sloane', detail: undefined })
  })
})

describe('colorFr', () => {
  it('traduit les couleurs connues et garde les autres', () => {
    expect(colorFr('Light Bluish Gray')).toBe('Gris clair')
    expect(colorFr('Unknown Teal')).toBe('Unknown Teal')
  })
})
