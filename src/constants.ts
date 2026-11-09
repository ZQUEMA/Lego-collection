export const EPISODES = [
  'Épisode I – La Menace fantôme',
  'Épisode II – L’Attaque des clones',
  'Épisode III – La Revanche des Sith',
  'Épisode IV – Un nouvel espoir',
  'Épisode V – L’Empire contre-attaque',
  'Épisode VI – Le Retour du Jedi',
  'Épisode VII – Le Réveil de la Force',
  'Épisode VIII – Les Derniers Jedi',
  'Épisode IX – L’Ascension de Skywalker',
  'Prélogie',
  'Trilogie originale',
  'Postlogie',
  'Rogue One',
  'Solo',
  'The Clone Wars',
  'Rebels',
  'The Mandalorian',
  'The Book of Boba Fett',
  'Andor',
  'Ahsoka',
  'Obi-Wan Kenobi',
  'The Bad Batch',
  'Skeleton Crew'
]

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

export function classifySubtheme(subtheme?: string): { collection?: string; episode?: string } {
  const s = subtheme?.trim()
  if (!s) return {}
  const ep = /^episode\s+([ivx]+)$/i.exec(s)
  if (ep) {
    const i = ROMAN.indexOf(ep[1].toUpperCase())
    return i >= 0 ? { episode: EPISODES[i] } : { episode: s }
  }
  const named = EPISODES.find((e) => e.toLowerCase() === s.toLowerCase())
  if (named) return { episode: named }
  if (/^(original|prequel|sequel) trilogy$/i.test(s)) {
    const map: Record<string, string> = { original: 'Trilogie originale', prequel: 'Prélogie', sequel: 'Postlogie' }
    return { episode: map[s.split(' ')[0].toLowerCase()] }
  }
  return { collection: s }
}

export const COLLECTIONS = ['Ultimate Collector Series', 'Starship Collection', 'Helmet Collection', 'Diorama Collection']

export function legoInstructionsUrl(setNum: string): string {
  return `https://www.lego.com/fr-fr/service/building-instructions/${setNum.replace(/-\d+$/, '')}`
}
