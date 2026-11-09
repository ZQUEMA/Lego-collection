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

export const COLLECTIONS = ['Ultimate Collector Series', 'Starship Collection', 'Helmet Collection', 'Diorama Collection']

export function legoInstructionsUrl(setNum: string): string {
  return `https://www.lego.com/fr-fr/service/building-instructions/${setNum.replace(/-\d+$/, '')}`
}
