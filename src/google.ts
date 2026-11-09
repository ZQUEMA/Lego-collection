import type { CollectionSnapshot } from './types'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const SCOPES = `${DRIVE_SCOPE} openid email profile`

export const DRIVE_NOT_GRANTED =
  'Google ne donne pas accès au Drive : sur l’écran de connexion, coche la case « Voir, créer et supprimer ses propres données de configuration dans votre Google Drive », puis reconnecte-toi.'

export function hasDriveScope(scope?: string): boolean {
  return (scope ?? '').split(/\s+/).includes(DRIVE_SCOPE)
}
const FILE_NAME = 'collection.json'
const TOKEN_KEY = 'google-token-v1'

interface TokenResponse {
  access_token?: string
  expires_in?: number
  scope?: string
  error?: string
  error_description?: string
}

interface TokenClient {
  requestAccessToken(opts?: { prompt?: string; login_hint?: string }): void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(cfg: {
            client_id: string
            scope: string
            callback: (r: TokenResponse) => void
            error_callback?: (e: { type: string; message?: string }) => void
          }): TokenClient
          revoke(token: string, done?: () => void): void
        }
      }
    }
  }
}

export interface GoogleSession {
  accessToken: string
  expiresAt: number
  email: string
  name?: string
  picture?: string
}

export function hasGoogleClientId(): boolean {
  return Boolean(CLIENT_ID)
}

export function storedSession(): GoogleSession | null {
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  return JSON.parse(raw) as GoogleSession
}

export function sessionValid(s: GoogleSession | null): boolean {
  return Boolean(s && s.expiresAt - 60_000 > Date.now())
}

function waitForGis(): Promise<NonNullable<Window['google']>> {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const tick = () => {
      if (window.google?.accounts?.oauth2) return resolve(window.google)
      if (Date.now() - started > 10_000) return reject(new Error('Script Google Identity non chargé'))
      setTimeout(tick, 100)
    }
    tick()
  })
}

export async function signIn(opts: { silent?: boolean; hint?: string } = {}): Promise<GoogleSession> {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID absent')
  const google = await waitForGis()
  const token = await new Promise<TokenResponse>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (r) => (r.error ? reject(new Error(r.error_description || r.error)) : resolve(r)),
      error_callback: (e) => reject(new Error(e.message || e.type))
    })
    client.requestAccessToken({ prompt: opts.silent ? '' : 'consent', login_hint: opts.hint })
  })
  const accessToken = token.access_token!
  if (!hasDriveScope(token.scope)) {
    google.accounts.oauth2.revoke(accessToken)
    throw new DriveNotGrantedError()
  }
  const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  }).then((r) => r.json() as Promise<{ email: string; name?: string; picture?: string }>)
  const session: GoogleSession = {
    accessToken,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
    email: info.email,
    name: info.name,
    picture: info.picture
  }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(session))
  return session
}

export async function signOut(session: GoogleSession | null) {
  localStorage.removeItem(TOKEN_KEY)
  if (session && window.google) window.google.accounts.oauth2.revoke(session.accessToken)
}

async function drive(session: GoogleSession, url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${session.accessToken}` }
  })
  if (res.status === 401) throw new AuthExpiredError()
  const body = res.ok ? '' : await res.text()
  if (res.status === 403 && body.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) throw new DriveNotGrantedError()
  if (!res.ok) throw new Error(`Google Drive ${res.status} : ${body}`)
  return res
}

export class AuthExpiredError extends Error {
  constructor() {
    super('Session Google expirée')
  }
}

export class DriveNotGrantedError extends Error {
  constructor() {
    super(DRIVE_NOT_GRANTED)
  }
}

async function findFileId(session: GoogleSession): Promise<string | null> {
  const url = new URL('https://www.googleapis.com/drive/v3/files')
  url.searchParams.set('spaces', 'appDataFolder')
  url.searchParams.set('q', `name='${FILE_NAME}' and trashed=false`)
  url.searchParams.set('fields', 'files(id,modifiedTime)')
  const body = (await (await drive(session, url.toString())).json()) as { files: { id: string }[] }
  return body.files[0]?.id ?? null
}

export async function downloadSnapshot(session: GoogleSession): Promise<{ fileId: string | null; snapshot: CollectionSnapshot | null }> {
  const fileId = await findFileId(session)
  if (!fileId) return { fileId: null, snapshot: null }
  const res = await drive(session, `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`)
  return { fileId, snapshot: (await res.json()) as CollectionSnapshot }
}

export async function uploadSnapshot(session: GoogleSession, fileId: string | null, snapshot: CollectionSnapshot): Promise<string> {
  const body = JSON.stringify(snapshot)
  if (fileId) {
    await drive(session, `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body
    })
    return fileId
  }
  const boundary = `lego${Math.random().toString(36).slice(2)}`
  const multipart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] }) +
    `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`
  const res = await drive(session, 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart
  })
  return ((await res.json()) as { id: string }).id
}
