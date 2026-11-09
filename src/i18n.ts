const TERMS: [string, string][] = [
  ['Super Destroyer Stellaire', 'Super Star Destroyer'],
  ['Destroyer Stellaire', 'Star Destroyer'],
  ['Faucon Millenium', 'Millennium Falcon'],
  ['Faucon Millennium', 'Millennium Falcon'],
  ['Étoile de la Mort', 'Death Star'],
  ['Dark Vador', 'Darth Vader'],
  ['Dark Maul', 'Darth Maul'],
  ['Dark Sidious', 'Darth Sidious'],
  ['Empereur Palpatine', 'Emperor Palpatine'],
  ['Princesse Leia', 'Princess Leia'],
  ['Chasseur TIE', 'TIE Fighter'],
  ['Bombardier TIE', 'TIE Bomber'],
  ['Intercepteur TIE', 'TIE Interceptor'],
  ['Pilote TIE', 'TIE Pilot'],
  ['Chasseur Jedi', 'Jedi Starfighter'],
  ['Chasseur stellaire', 'Starfighter'],
  ['Aile-X', 'X-wing'],
  ['Aile-Y', 'Y-wing'],
  ['Aile-A', 'A-wing'],
  ['Aile-B', 'B-wing'],
  ['Aile-U', 'U-wing'],
  ['Navette impériale', 'Imperial Shuttle'],
  ['Navette', 'Shuttle'],
  ['Speeder des neiges', 'Snowspeeder'],
  ['Moto speeder', 'Speeder Bike'],
  ['Soldat clone', 'Clone Trooper'],
  ['Soldats clones', 'Clone Troopers'],
  ['Garde royal', 'Royal Guard'],
  ['Salle du trône', 'Throne Room'],
  ['Vice-Amiral', 'Vice Admiral'],
  ['Amiral', 'Admiral'],
  ['Général', 'General'],
  ['Capitaine', 'Captain'],
  ['Officier', 'Officer'],
  ['Droïde', 'Droid'],
  ['Pilote', 'Pilot'],
  ['Marcheur', 'Walker'],
  ['Vaisseau', 'Ship'],
  ['Casque', 'Helmet'],
  ['Sabre laser', 'Lightsaber'],
  ['Rebelle', 'Rebel'],
  ['Impérial', 'Imperial'],
  ['Nouvelle République', 'New Republic'],
  ['Premier Ordre', 'First Order'],
  ['Résistance', 'Resistance'],
  ['Palais de Jabba', "Jabba's Palace"],
  ['Esclave I', 'Slave I'],
  ['Brique', 'Brick'],
  ['Plaque lisse', 'Tile'],
  ['Plaque', 'Plate'],
  ['Pente', 'Slope'],
  ['Équerre', 'Bracket'],
  ['Axe', 'Axle'],
  ['Ronde', 'Round'],
  ['Rond', 'Round'],
  ['Figurine', 'Minifig']
]

const COLORS: Record<string, string> = {
  Black: 'Noir',
  White: 'Blanc',
  'Light Bluish Gray': 'Gris clair',
  'Dark Bluish Gray': 'Gris foncé',
  'Light Gray': 'Gris clair (ancien)',
  'Dark Gray': 'Gris foncé (ancien)',
  Red: 'Rouge',
  'Dark Red': 'Rouge foncé',
  Blue: 'Bleu',
  'Dark Blue': 'Bleu foncé',
  'Medium Blue': 'Bleu moyen',
  'Medium Azure': 'Azur moyen',
  'Dark Azure': 'Azur foncé',
  Yellow: 'Jaune',
  'Bright Light Yellow': 'Jaune clair',
  Green: 'Vert',
  'Dark Green': 'Vert foncé',
  'Bright Green': 'Vert vif',
  'Sand Green': 'Vert sable',
  'Olive Green': 'Vert olive',
  Lime: 'Vert citron',
  Tan: 'Beige',
  'Dark Tan': 'Beige foncé',
  'Reddish Brown': 'Brun rougeâtre',
  'Dark Brown': 'Brun foncé',
  Brown: 'Marron',
  Orange: 'Orange',
  'Dark Orange': 'Orange foncé',
  Nougat: 'Nougat',
  'Medium Nougat': 'Nougat moyen',
  'Light Nougat': 'Nougat clair',
  'Pearl Gold': 'Or perle',
  'Flat Silver': 'Argent mat',
  'Metallic Silver': 'Argent métallisé',
  'Pearl Dark Gray': 'Gris foncé perle',
  'Chrome Gold': 'Or chromé',
  'Chrome Silver': 'Argent chromé',
  Pink: 'Rose',
  'Dark Pink': 'Rose foncé',
  Magenta: 'Magenta',
  Purple: 'Violet',
  'Dark Purple': 'Violet foncé',
  Lavender: 'Lavande',
  Clear: 'Transparent',
  'Trans-Clear': 'Transparent',
  'Trans-Black': 'Fumé transparent',
  'Trans-Red': 'Rouge transparent',
  'Trans-Dark Blue': 'Bleu foncé transparent',
  'Trans-Light Blue': 'Bleu clair transparent',
  'Trans-Green': 'Vert transparent',
  'Trans-Bright Green': 'Vert vif transparent',
  'Trans-Yellow': 'Jaune transparent',
  'Trans-Orange': 'Orange transparent',
  'Trans-Neon Orange': 'Orange fluo transparent',
  'Trans-Neon Green': 'Vert fluo transparent',
  'Trans-Purple': 'Violet transparent',
  'Trans-Pink': 'Rose transparent'
}

export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const byLength = (pairs: [string, string][]) => [...pairs].sort((a, b) => b[0].length - a[0].length)
const FR_TO_EN = byLength(TERMS)
const EN_TO_FR = byLength(
  TERMS.filter(([fr]) => !['Faucon Millennium', 'Soldats clones', 'Ronde'].includes(fr)).map(([fr, en]) => [en, fr] as [string, string])
)

function substitute(text: string, pairs: [string, string][], boundary: string): string {
  let parts: string[] = [text]
  for (const [from, to] of pairs) {
    const re = new RegExp(`(^|${boundary})${escape(from)}(?=$|${boundary})`, 'gi')
    parts = parts.flatMap((part, i) => (i % 2 === 1 ? [part] : split(part, re, to)))
  }
  return parts.join('')
}

function split(text: string, re: RegExp, to: string): string[] {
  const out: string[] = []
  let last = 0
  for (const m of text.matchAll(re)) {
    const start = m.index! + m[1].length
    out.push(text.slice(last, start), to)
    last = m.index! + m[0].length
  }
  out.push(text.slice(last))
  return out
}

export function frenchQueryToEnglish(query: string): string {
  return substitute(fold(query), FR_TO_EN.map(([fr, en]) => [fold(fr), en]), '[^a-z0-9]')
}

export function englishToFrench(text: string): string {
  return substitute(text, EN_TO_FR, '[^A-Za-z0-9]')
}

export function colorFr(color?: string): string | undefined {
  if (!color) return color
  return COLORS[color] ?? color
}

export function minifigNameFr(name: string): { main: string; detail?: string } {
  const [main, ...rest] = name.split(',')
  return { main: englishToFrench(main.trim()), detail: rest.length ? rest.join(',').trim() : undefined }
}
