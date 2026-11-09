import { useMemo, useState } from 'react'
import { addCopyOf } from '../addSet'
import { SetCard } from '../components/SetCard'
import { useOwned, useOwnedCounts } from '../hooks'
import { searchMinifigs, searchSets, setsWithMinifig, type MinifigHit, type SetSummary } from '../rebrickable'
import { go } from '../router'
import { characterNames, displayName, filterOwned, sortEntries, type OwnedFilter } from '../search'

type Scope = 'mine' | 'catalog'

const toNumber = (s: string) => (s.trim() === '' ? undefined : Number(s))

export function SearchPage() {
  const [scope, setScope] = useState<Scope>('mine')
  const [text, setText] = useState('')
  const [year, setYear] = useState('')
  const [character, setCharacter] = useState('')
  const [count, setCount] = useState('')

  return (
    <section>
      <div className="seg">
        <button className={scope === 'mine' ? 'on' : ''} onClick={() => setScope('mine')}>
          Ma collection
        </button>
        <button className={scope === 'catalog' ? 'on' : ''} onClick={() => setScope('catalog')}>
          Tous les sets
        </button>
      </div>
      <div className="filters">
        <input type="search" placeholder="Numéro ou nom" value={text} onChange={(e) => setText(e.target.value)} />
        <input type="number" inputMode="numeric" placeholder="Année" value={year} onChange={(e) => setYear(e.target.value)} />
        <input type="search" placeholder="Personnage" value={character} onChange={(e) => setCharacter(e.target.value)} />
        {scope === 'mine' ? (
          <input type="number" inputMode="numeric" min="0" placeholder="Nb de persos" value={count} onChange={(e) => setCount(e.target.value)} />
        ) : null}
      </div>
      {scope === 'mine' ? (
        <MineResults filter={{ text: text || undefined, year: toNumber(year), character: character || undefined, characterCount: toNumber(count) }} />
      ) : (
        <CatalogResults text={text} year={toNumber(year)} character={character} />
      )}
    </section>
  )
}

function MineResults({ filter }: { filter: OwnedFilter }) {
  const owned = useOwned()
  const list = useMemo(() => sortEntries(filterOwned(owned ?? [], filter)), [owned, filter.text, filter.year, filter.character, filter.characterCount])
  if (!owned) return null
  return (
    <>
      <p className="muted small">{list.length} résultat(s)</p>
      <div className="grid">
        {list.map(({ set, copies }) => (
          <SetCard
            key={set.setNum}
            setNum={set.setNum}
            name={displayName(set)}
            year={set.year}
            imageUrl={set.imageUrl}
            subtitle={`${characterNames(set).length} perso(s)${set.episode ? ` · ${set.episode}` : ''}`}
            count={copies.length}
          />
        ))}
      </div>
    </>
  )
}

function CatalogResults({ text, year, character }: { text: string; year?: number; character: string }) {
  const counts = useOwnedCounts()
  const [results, setResults] = useState<SetSummary[] | null>(null)
  const [figs, setFigs] = useState<MinifigHit[] | null>(null)
  const [fig, setFig] = useState<MinifigHit | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guard(fn: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const runSets = () =>
    guard(async () => {
      setFig(null)
      setFigs(null)
      setResults((await searchSets(text, { year })).results)
    })

  const runFigs = () =>
    guard(async () => {
      setResults(null)
      setFig(null)
      setFigs(await searchMinifigs(character))
    })

  const pickFig = (f: MinifigHit) =>
    guard(async () => {
      setFig(f)
      setFigs(null)
      const sets = await setsWithMinifig(f.figNum)
      setResults(sets.sort((a, b) => b.setNum.localeCompare(a.setNum, 'fr', { numeric: true })))
    })

  const add = (s: SetSummary) =>
    guard(async () => {
      const n = counts.get(s.setNum)
      if (n && !confirm(`Tu as déjà ${n} exemplaire(s) de ${s.name}. En ajouter un autre ?`)) return
      await addCopyOf(s.setNum)
      go({ name: 'set', setNum: s.setNum })
    })

  return (
    <>
      <div className="actions">
        <button className="btn primary" disabled={busy || (!text.trim() && !year)} onClick={() => void runSets()}>
          Chercher par numéro / nom / année
        </button>
        <button className="btn" disabled={busy || !character.trim()} onClick={() => void runFigs()}>
          Chercher par personnage
        </button>
      </div>
      <p className="muted small">Catalogue Rebrickable : noms des sets et personnages en anglais (ex. « Darth Vader »).</p>
      {error ? <p className="error">{error}</p> : null}
      {busy ? <p className="muted">Recherche…</p> : null}
      {figs ? (
        <>
          <p className="muted small">Choisis la figurine :</p>
          <ul className="partgrid">
            {figs.map((f) => (
              <li key={f.figNum}>
                <button type="button" onClick={() => void pickFig(f)}>
                  {f.imageUrl ? <img src={f.imageUrl} alt="" loading="lazy" /> : <span className="noimg">?</span>}
                  <span className="pname">{f.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {fig ? <p className="muted small">Sets contenant : {fig.name} (le filtre par année ne s’applique pas ici)</p> : null}
      {results ? (
        <>
          <p className="muted small">{results.length} résultat(s)</p>
          <div className="grid">
            {results.map((s) => (
              <SetCard
                key={s.setNum}
                setNum={s.setNum}
                name={s.name}
                year={s.year}
                imageUrl={s.imageUrl}
                subtitle={counts.get(s.setNum) ? 'Dans ma collection' : 'Je ne l’ai pas'}
                count={counts.get(s.setNum)}
                onClick={counts.get(s.setNum) ? () => go({ name: 'set', setNum: s.setNum }) : undefined}
                action={
                  <button className="btn small" onClick={() => void add(s)}>
                    + Ajouter
                  </button>
                }
              />
            ))}
          </div>
        </>
      ) : null}
    </>
  )
}
