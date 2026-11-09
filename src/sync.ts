import { useSyncExternalStore } from 'react'
import { clearLocal, exportSnapshot, onLocalChange, replaceWithSnapshot } from './db'
import {
  AuthExpiredError,
  DriveNotGrantedError,
  downloadSnapshot,
  hasGoogleClientId,
  sessionValid,
  signIn,
  signOut,
  storedSession,
  uploadSnapshot,
  type GoogleSession
} from './google'
import { mergeSnapshots, sameSnapshot } from './merge'
import type { CollectionSnapshot } from './types'

const OWNER_KEY = 'local-owner-v1'

export type SyncPhase = 'disabled' | 'signed-out' | 'idle' | 'syncing' | 'error' | 'needs-login'

export interface SyncState {
  phase: SyncPhase
  session: GoogleSession | null
  lastSyncAt?: number
  error?: string
}

let state: SyncState = {
  phase: hasGoogleClientId() ? (storedSession() ? 'idle' : 'signed-out') : 'disabled',
  session: storedSession()
}
const listeners = new Set<() => void>()

function set(patch: Partial<SyncState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function useSync(): SyncState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state
  )
}

async function ensureSession(): Promise<GoogleSession | null> {
  if (state.session && sessionValid(state.session)) return state.session
  if (!state.session) return null
  try {
    const s = await signIn({ silent: true, hint: state.session.email })
    set({ session: s })
    return s
  } catch (e) {
    set({ phase: 'needs-login', error: e instanceof DriveNotGrantedError ? e.message : undefined })
    return null
  }
}

let fileId: string | null = null
let running: Promise<void> | null = null
let again = false

export function syncNow(): Promise<void> {
  if (running) {
    again = true
    return running
  }
  running = (async () => {
    do {
      again = false
      await syncOnce()
    } while (again)
  })().finally(() => {
    running = null
  })
  return running
}

async function syncOnce() {
  const session = await ensureSession()
  if (!session) return
  set({ phase: 'syncing', error: undefined })
  try {
    const remote = await downloadSnapshot(session)
    fileId = remote.fileId
    const local = await exportSnapshot()
    const remoteSnap: CollectionSnapshot = remote.snapshot ?? { version: 1, sets: [], copies: [] }
    const merged = mergeSnapshots(local, remoteSnap)
    if (!sameSnapshot(merged, local)) await replaceWithSnapshot(merged)
    if (!remote.snapshot || !sameSnapshot(merged, remoteSnap)) fileId = await uploadSnapshot(session, fileId, merged)
    set({ phase: 'idle', lastSyncAt: Date.now() })
  } catch (e) {
    if (e instanceof AuthExpiredError) {
      set({ phase: 'needs-login', session: { ...session, expiresAt: 0 } })
      return
    }
    if (e instanceof DriveNotGrantedError) {
      set({ phase: 'needs-login', error: e.message, session: { ...session, expiresAt: 0 } })
      return
    }
    set({ phase: 'error', error: e instanceof Error ? e.message : String(e) })
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
function scheduleSync() {
  if (state.phase === 'disabled' || state.phase === 'signed-out') return
  clearTimeout(timer)
  timer = setTimeout(() => void syncNow(), 1500)
}

onLocalChange(scheduleSync)

export async function login() {
  const s = await signIn()
  const owner = localStorage.getItem(OWNER_KEY)
  if (owner && owner !== s.email) await clearLocal()
  localStorage.setItem(OWNER_KEY, s.email)
  fileId = null
  set({ session: s, phase: 'idle' })
  await syncNow()
}

export async function logout() {
  await syncNow()
  await signOut(state.session)
  await clearLocal()
  localStorage.removeItem(OWNER_KEY)
  fileId = null
  set({ session: null, phase: 'signed-out', lastSyncAt: undefined })
}

export function startAutoSync() {
  if (state.session) void syncNow()
  window.addEventListener('online', scheduleSync)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleSync()
  })
}
