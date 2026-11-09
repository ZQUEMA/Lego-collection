import { goBack, href, useRoute } from './router'
import { useSync } from './sync'
import { Gallery } from './pages/Gallery'
import { AddSet } from './pages/AddSet'
import { SearchPage } from './pages/SearchPage'
import { SetPage } from './pages/SetPage'
import { AccountPage } from './pages/AccountPage'

function SyncBadge() {
  const s = useSync()
  const label: Record<typeof s.phase, string> = {
    disabled: 'Local',
    'signed-out': 'Se connecter',
    idle: 'Synchronisé',
    syncing: 'Synchro…',
    error: 'Erreur de synchro',
    'needs-login': 'Reconnexion requise'
  }
  return (
    <a className={`sync sync-${s.phase}`} href={href({ name: 'account' })} title={s.error ?? s.session?.email}>
      {s.session?.picture ? <img src={s.session.picture} alt="" referrerPolicy="no-referrer" /> : null}
      <span>{label[s.phase]}</span>
    </a>
  )
}

export function App() {
  const route = useRoute()
  const tab = route.name === 'set' ? 'gallery' : route.name
  return (
    <div className="app">
      <header className="top">
        {route.name === 'set' || route.name === 'account' ? (
          <button type="button" className="back" onClick={goBack}>
            <span aria-hidden>‹</span> Retour
          </button>
        ) : (
          <a className="brand" href={href({ name: 'gallery' })}>
            <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
            <span>Ma collection</span>
          </a>
        )}
        <SyncBadge />
      </header>
      <main>
        {route.name === 'gallery' && <Gallery />}
        {route.name === 'add' && <AddSet initialQuery={route.q} />}
        {route.name === 'search' && <SearchPage />}
        {route.name === 'set' && <SetPage setNum={route.setNum} />}
        {route.name === 'account' && <AccountPage />}
      </main>
      <nav className="tabs">
        <a className={tab === 'gallery' ? 'on' : ''} href={href({ name: 'gallery' })}>
          <span aria-hidden>▦</span>Galerie
        </a>
        <a className={tab === 'add' ? 'on' : ''} href={href({ name: 'add' })}>
          <span aria-hidden>＋</span>Ajouter
        </a>
        <a className={tab === 'search' ? 'on' : ''} href={href({ name: 'search' })}>
          <span aria-hidden>⌕</span>Recherche
        </a>
      </nav>
    </div>
  )
}
