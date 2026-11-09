import { useState } from 'react'
import { hasRelay } from '../relay'
import { exportSnapshot } from '../db'
import { hasGoogleClientId } from '../google'
import { login, logout, syncNow, useSync } from '../sync'

export function AccountPage() {
  const s = useSync()
  const [error, setError] = useState<string | null>(null)

  const run = (fn: () => Promise<void>) => fn().catch((e) => setError(e instanceof Error ? e.message : String(e)))

  async function download() {
    const blob = new Blob([JSON.stringify(await exportSnapshot(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `collection-lego-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <section className="panel">
      <h2>Compte et sauvegarde</h2>
      {!hasGoogleClientId() ? (
        <p className="muted">Connexion Google non configurée (VITE_GOOGLE_CLIENT_ID). La collection reste sur cet appareil.</p>
      ) : s.session ? (
        <>
          <p>
            Connecté : <strong>{s.session.name ?? s.session.email}</strong> ({s.session.email})
          </p>
          <p className="muted small">
            Sauvegarde dans le dossier caché de l'app sur ton Google Drive.
            {s.lastSyncAt ? ` Dernière synchro : ${new Date(s.lastSyncAt).toLocaleString('fr-FR')}.` : ''}
          </p>
          {s.error ? <p className="error">{s.error}</p> : null}
          <div className="actions">
            {s.phase === 'needs-login' ? (
              <button className="btn primary" onClick={() => void run(login)}>
                Se reconnecter
              </button>
            ) : (
              <button className="btn primary" disabled={s.phase === 'syncing'} onClick={() => void run(syncNow)}>
                Synchroniser maintenant
              </button>
            )}
            <button
              className="btn danger"
              onClick={() => {
                if (confirm('Se déconnecter ? La collection est sauvegardée sur ton Drive puis effacée de cet appareil.')) void run(logout)
              }}
            >
              Se déconnecter
            </button>
          </div>
        </>
      ) : (
        <>
          <p>Connecte-toi avec Google pour sauvegarder ta collection sur ton Drive et la retrouver sur tous tes appareils.</p>
          <button className="btn primary" onClick={() => void run(login)}>
            Se connecter avec Google
          </button>
        </>
      )}
      {error ? <p className="error">{error}</p> : null}
      <hr />
      <button className="btn" onClick={() => void download()}>
        Exporter ma collection (JSON)
      </button>
      <p className="muted small">Relais (nom français officiel, collection, mois de sortie) : {hasRelay() ? 'branché' : 'pas encore branché'}.</p>
    </section>
  )
}
