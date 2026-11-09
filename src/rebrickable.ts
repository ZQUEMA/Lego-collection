import type { Minifig, SetRecord } from './types'

const BASE = 'https://rebrickable.com/api/v3/lego'
const KEY = import.meta.env.VITE_REBRICKABLE_API_KEY as string | undefined

export interface SetSummary {
  setNum: string
  name: string
  year?: number
  themeId: number
  numParts: number
  imageUrl?: string
}

export interface PartHit {
  partNum: string
  name: string
  colorName?: string
  imageUrl?: string
  quantity?: number
  isSpare?: boolean
}

export interface MinifigHit {
  figNum: string
  name: string
  imageUrl?: string
}

interface Theme {
  id: number
  parent_id: number | null
  name: string
}

export function hasRebrickableKey(): boolean {
  return Boolean(KEY)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function get<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  if (!KEY) throw new Error('Clé Rebrickable absente (VITE_REBRICKABLE_API_KEY)')
  const url = new URL(path.startsWith('http') ? path : `${BASE}${path}`)
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `key ${KEY}` } })
    if (res.status === 429 && attempt < 3) {
      await sleep(1100 * (attempt + 1))
      continue
    }
    if (res.status === 404) throw new NotFoundError(path)
    if (!res.ok) throw new Error(`Rebrickable ${res.status} sur ${path}`)
    return res.json() as Promise<T>
  }
}

export class NotFoundError extends Error {}

interface Page<T> {
  count: number
  next: string | null
  results: T[]
}

async function getAll<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T[]> {
  const out: T[] = []
  let page = await get<Page<T>>(path, { ...params, page_size: 1000 })
  out.push(...page.results)
  while (page.next) {
    page = await get<Page<T>>(page.next)
    out.push(...page.results)
  }
  return out
}

export function normalizeSetNum(input: string): string {
  const s = input.trim()
  return /^\d+$/.test(s) ? `${s}-1` : s
}

interface RbSet {
  set_num: string
  name: string
  year?: number
  theme_id: number
  num_parts: number
  set_img_url: string | null
}

const toSummary = (s: RbSet): SetSummary => ({
  setNum: s.set_num,
  name: s.name,
  year: s.year,
  themeId: s.theme_id,
  numParts: s.num_parts,
  imageUrl: s.set_img_url ?? undefined
})

export async function searchSets(query: string, opts: { year?: number; page?: number } = {}): Promise<{ count: number; results: SetSummary[] }> {
  const q = query.trim()
  if (/^\d{3,}(-\d+)?$/.test(q)) {
    try {
      const exact = await get<RbSet>(`/sets/${normalizeSetNum(q)}/`)
      return { count: 1, results: [toSummary(exact)] }
    } catch (e) {
      if (!(e instanceof NotFoundError)) throw e
    }
  }
  const page = await get<Page<RbSet>>('/sets/', {
    search: q,
    min_year: opts.year,
    max_year: opts.year,
    page: opts.page,
    page_size: 40,
    ordering: '-year'
  })
  return { count: page.count, results: page.results.map(toSummary) }
}

let themesCache: Map<number, Theme> | null = null
const THEMES_KEY = 'rb-themes-v1'

async function themes(): Promise<Map<number, Theme>> {
  if (themesCache) return themesCache
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(THEMES_KEY) : null
  if (raw) {
    const parsed = JSON.parse(raw) as { at: number; list: Theme[] }
    if (Date.now() - parsed.at < 30 * 24 * 3600 * 1000) {
      themesCache = new Map(parsed.list.map((t) => [t.id, t]))
      return themesCache
    }
  }
  const list = await getAll<Theme>('/themes/')
  if (typeof localStorage !== 'undefined') localStorage.setItem(THEMES_KEY, JSON.stringify({ at: Date.now(), list }))
  themesCache = new Map(list.map((t) => [t.id, t]))
  return themesCache
}

export async function themeNames(themeId: number): Promise<{ themeName?: string; parentThemeName?: string }> {
  const all = await themes()
  const t = all.get(themeId)
  if (!t) return {}
  const parent = t.parent_id ? all.get(t.parent_id) : undefined
  return { themeName: t.name, parentThemeName: parent?.name }
}

interface RbSetMinifig {
  set_num: string
  set_name: string
  quantity: number
  set_img_url: string | null
}

export async function fetchSetRecord(setNum: string): Promise<SetRecord> {
  const s = await get<RbSet>(`/sets/${setNum}/`)
  const [names, figs] = await Promise.all([themeNames(s.theme_id), getAll<RbSetMinifig>(`/sets/${setNum}/minifigs/`)])
  const minifigs: Minifig[] = figs.map((f) => ({
    figNum: f.set_num,
    name: f.set_name,
    quantity: f.quantity,
    imageUrl: f.set_img_url ?? undefined
  }))
  return {
    setNum: s.set_num,
    name: s.name,
    year: s.year ?? 0,
    numParts: s.num_parts,
    imageUrl: s.set_img_url ?? undefined,
    themeName: names.themeName,
    parentThemeName: names.parentThemeName,
    collection: names.parentThemeName ? names.themeName : undefined,
    minifigs,
    updatedAt: Date.now()
  }
}

interface RbInvPart {
  part: { part_num: string; name: string; part_img_url: string | null }
  color: { name: string }
  quantity: number
  is_spare: boolean
}

export async function fetchSetParts(setNum: string): Promise<PartHit[]> {
  const parts = await getAll<RbInvPart>(`/sets/${setNum}/parts/`, { inc_minifig_parts: 1 })
  return parts.map((p) => ({
    partNum: p.part.part_num,
    name: p.part.name,
    colorName: p.color.name,
    imageUrl: p.part.part_img_url ?? undefined,
    quantity: p.quantity,
    isSpare: p.is_spare
  }))
}

interface RbPart {
  part_num: string
  name: string
  part_img_url: string | null
}

export async function searchParts(query: string): Promise<PartHit[]> {
  const page = await get<Page<RbPart>>('/parts/', { search: query, page_size: 30 })
  return page.results.map((p) => ({ partNum: p.part_num, name: p.name, imageUrl: p.part_img_url ?? undefined }))
}

interface RbMinifig {
  set_num: string
  name: string
  set_img_url: string | null
}

export async function searchMinifigs(query: string): Promise<MinifigHit[]> {
  const page = await get<Page<RbMinifig>>('/minifigs/', { search: query, page_size: 40 })
  return page.results.map((m) => ({ figNum: m.set_num, name: m.name, imageUrl: m.set_img_url ?? undefined }))
}

export async function setsWithMinifig(figNum: string): Promise<SetSummary[]> {
  const sets = await getAll<RbSet>(`/minifigs/${figNum}/sets/`)
  return sets.map(toSummary)
}
