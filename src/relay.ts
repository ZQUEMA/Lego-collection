const RELAY = import.meta.env.VITE_RELAY_URL as string | undefined

export interface RelayInfo {
  nameFr?: string
  subtheme?: string
  launchDate?: string
}

export function hasRelay(): boolean {
  return Boolean(RELAY)
}

interface RelayBody {
  status?: string
  nameFr?: string | null
  brickset?: { subtheme?: string; launchDate?: string | null } | null
}

export async function fetchRelayInfo(setNum: string): Promise<RelayInfo | null> {
  if (!RELAY) return null
  const url = new URL(RELAY)
  url.searchParams.set('setNumber', setNum)
  const res = await fetch(url)
  if (!res.ok) return null
  const body = (await res.json()) as RelayBody
  if (body.status !== 'success') return null
  return {
    nameFr: body.nameFr || undefined,
    subtheme: body.brickset?.subtheme || undefined,
    launchDate: body.brickset?.launchDate ? body.brickset.launchDate.slice(0, 10) : undefined
  }
}
