import { useEffect, useState } from 'react'
import { addCopyOf } from '../addSet'
import { SetCard } from '../components/SetCard'
import { useOwnedCounts } from '../hooks'
import { hasRebrickableKey, searchSets, type SetSummary } from '../rebrickable'
import { go } from '../router'

export function AddSet({ initialQuery }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery ?? '')
  const [results, setResults] = useState<SetSummary[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const counts = useOwnedCounts()

  async function run(query: string) {
    if (!query.trim()) return
    setBusy('search')
    setError(null)
    try {
      setResults((await searchSets(query)).results)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  useEffect(() => {
    if (initialQuery) void run(initialQuery)
  }, [initialQuery])

  async function pick(s: SetSummary) {
    const n = counts.get(s.setNum)
    if (n && !confirm(`Tu as déjà ${n} exemplaire${n > 1 ? 's' : ''} de ${s.name}. En ajouter un autre ?`)) return
    setBusy(s.setNum)
    setError(null)
    try {
      await addCopyOf(s.setNum)
      go({ name: 'set', setNum: s.setNum })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(null)
    }
  }

  if (!hasRebrickableKey()) return <p className="error">Clé Rebrickable absente : renseigne VITE_REBRICKABLE_API_KEY.</p>

  return (
    <section>
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault()
          void run(q)
        }}
      >
        <input
          type="search"
          inputMode="search"
          autoFocus
          placeholder="Numéro ou nom du set (ex. 75356, TIE Bomber)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn primary" disabled={busy !== null}>
          Chercher
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {busy === 'search' ? <p className="muted">Recherche…</p> : null}
      {results && results.length === 0 ? <p className="muted">Aucun set trouvé.</p> : null}
      <div className="grid">
        {results?.map((s) => (
          <SetCard
            key={s.setNum}
            setNum={s.setNum}
            name={s.name}
            year={s.year}
            imageUrl={s.imageUrl}
            subtitle={busy === s.setNum ? 'Ajout…' : `${s.numParts} pièces`}
            count={counts.get(s.setNum)}
            onClick={() => void pick(s)}
          />
        ))}
      </div>
      {results ? <p className="muted small">Touche un set pour l'ajouter à ta galerie. S'il y est déjà, un exemplaire de plus est créé.</p> : null}
    </section>
  )
}
