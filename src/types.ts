export interface Minifig {
  figNum: string
  name: string
  quantity: number
  imageUrl?: string
}

export interface SetRecord {
  setNum: string
  name: string
  year: number
  themeName?: string
  parentThemeName?: string
  numParts?: number
  imageUrl?: string
  minifigs: Minifig[]
  launchDate?: string
  nameFr?: string
  collection?: string
  episode?: string
  charactersOverride?: string[]
  updatedAt: number
  deleted?: boolean
}

export type MissingPartSource = 'inventory' | 'catalog' | 'text'

export interface MissingPart {
  id: string
  source: MissingPartSource
  name: string
  quantity: number
  partNum?: string
  colorName?: string
  imageUrl?: string
}

export interface CopyRecord {
  id: string
  setNum: string
  hasBox: boolean
  hasInstructions: boolean
  hasSpareParts: boolean
  missingParts: MissingPart[]
  built: boolean
  purchasePrice?: number
  purchaseDate?: string
  notes?: string
  createdAt: number
  updatedAt: number
  deleted?: boolean
}

export interface CollectionSnapshot {
  version: 1
  sets: SetRecord[]
  copies: CopyRecord[]
}
