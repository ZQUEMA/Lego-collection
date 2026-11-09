import { useSyncExternalStore } from 'react'

export type Route =
  | { name: 'gallery' }
  | { name: 'add'; q?: string }
  | { name: 'search' }
  | { name: 'set'; setNum: string }
  | { name: 'account' }

export function parseHash(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  const params = new URLSearchParams(query)
  switch (parts[0]) {
    case 'add':
      return { name: 'add', q: params.get('q') ?? undefined }
    case 'search':
      return { name: 'search' }
    case 'set':
      return parts[1] ? { name: 'set', setNum: decodeURIComponent(parts[1]) } : { name: 'gallery' }
    case 'account':
      return { name: 'account' }
    default:
      return { name: 'gallery' }
  }
}

export function href(route: Route): string {
  switch (route.name) {
    case 'gallery':
      return '#/'
    case 'add':
      return route.q ? `#/add?q=${encodeURIComponent(route.q)}` : '#/add'
    case 'search':
      return '#/search'
    case 'set':
      return `#/set/${encodeURIComponent(route.setNum)}`
    case 'account':
      return '#/account'
  }
}

export function go(route: Route) {
  location.hash = href(route)
}

const subscribe = (l: () => void) => {
  window.addEventListener('hashchange', l)
  return () => window.removeEventListener('hashchange', l)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash)
  return parseHash(hash)
}
