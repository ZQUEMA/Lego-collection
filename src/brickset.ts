const PROXY = import.meta.env.VITE_BRICKSET_PROXY_URL as string | undefined

export interface BricksetInfo {
  subtheme?: string
  launchDate?: string
}

export function hasBricksetProxy(): boolean {
  return Boolean(PROXY)
}

export async function fetchBricksetInfo(setNum: string): Promise<BricksetInfo | null> {
  if (!PROXY) return null
  const url = new URL(PROXY)
  url.searchParams.set('setNumber', setNum)
  const res = await fetch(url)
  if (!res.ok) return null
  const body = (await res.json()) as { status?: string; sets?: { subtheme?: string; launchDate?: string | null }[] }
  const s = body.sets?.[0]
  if (!s) return null
  return { subtheme: s.subtheme || undefined, launchDate: s.launchDate ? s.launchDate.slice(0, 10) : undefined }
}
