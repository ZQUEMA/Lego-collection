import { describe, expect, it } from 'vitest'
import { classifySubtheme } from './constants'

describe('classifySubtheme', () => {
  it('range un épisode Brickset dans Épisode / film', () => {
    expect(classifySubtheme('Episode VI')).toEqual({ episode: 'Épisode VI – Le Retour du Jedi' })
    expect(classifySubtheme('Episode V')).toEqual({ episode: 'Épisode V – L’Empire contre-attaque' })
  })

  it('range une série connue dans Épisode / film', () => {
    expect(classifySubtheme('The Mandalorian')).toEqual({ episode: 'The Mandalorian' })
    expect(classifySubtheme('Original Trilogy')).toEqual({ episode: 'Trilogie originale' })
  })

  it('range le reste dans Collection', () => {
    expect(classifySubtheme('Starship Collection')).toEqual({ collection: 'Starship Collection' })
    expect(classifySubtheme('Ultimate Collector Series')).toEqual({ collection: 'Ultimate Collector Series' })
  })

  it('ne renvoie rien sans sous-thème', () => {
    expect(classifySubtheme(undefined)).toEqual({})
    expect(classifySubtheme('  ')).toEqual({})
  })
})
