import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { deleteSetFromCollection, enrichFromSources } from '../addSet'
import { minifigNameFr } from '../i18n'
import { replaceWith } from '../router'
import { CopyEditor } from '../components/CopyEditor'
import { COLLECTIONS, EPISODES, legoInstructionsUrl } from '../constants'
import { blankCopy, db, saveCopy, saveSet } from '../db'
import { characterNames, displayName, shortNumber } from '../search'
import type { SetRecord } from '../types'

export function SetPage({ setNum }: { setNum: string }) {
  const set = useLiveQuery(() => db.sets.get(setNum), [setNum])
  const copies = useLiveQuery(
    async () => (await db.copies.where('setNum').equals(setNum).toArray()).filter((c) => !c.deleted).sort((a, b) => a.createdAt - b.createdAt),
    [setNum]
  )
  const [editChars, setEditChars] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  if (set === undefined || copies === undefined) return null
  if (!set || set.deleted) return <p className="muted">Ce set n'est pas dans ta collection.</p>

  const patch = (p: Partial<SetRecord>) => saveSet({ ...set, ...p })
  const chars = characterNames(set)

  async function refresh() {
    setRefreshing(true)
    try {
      await saveSet(await enrichFromSources(set!.setNum, set!))
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <section className="setpage">
      <div className="hero">
        {set.imageUrl ? <img src={set.imageUrl} alt="" /> : null}
        <div>
          <div className="num">
            {shortNumber(set.setNum)} · {set.year}
            {set.numParts ? ` · ${set.numParts} pièces` : ''}
          </div>
          <h1>{displayName(set)}</h1>
          {set.nameFr ? <div className="muted">{set.name}</div> : null}
          <div className="muted small">
            {[set.parentThemeName, set.themeName].filter(Boolean).join(' › ')}
          </div>
          <div className="actions">
            <a className="btn" href={legoInstructionsUrl(set.setNum)} target="_blank" rel="noreferrer">
              Notice LEGO
            </a>
            <button className="btn" onClick={() => void refresh()} disabled={refreshing}>
              {refreshing ? 'Mise à jour…' : 'Rafraîchir'}
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Le set</h2>
        <label>
          Nom en français
          <input value={set.nameFr ?? ''} placeholder={displayName(set)} onChange={(e) => void patch({ nameFr: e.target.value })} />
        </label>
        <label>
          Collection
          <input list="collections" value={set.collection ?? ''} placeholder="ex. Starship Collection" onChange={(e) => void patch({ collection: e.target.value })} />
        </label>
        <label>
          Épisode / film
          <input list="episodes" value={set.episode ?? ''} placeholder="ex. L’Empire contre-attaque" onChange={(e) => void patch({ episode: e.target.value })} />
        </label>
        <label>
          Sortie
          <input type="month" value={set.launchDate?.slice(0, 7) ?? ''} onChange={(e) => void patch({ launchDate: e.target.value || undefined })} />
        </label>
        <datalist id="collections">
          {COLLECTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <datalist id="episodes">
          {EPISODES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <div className="chars">
          <div className="row">
            <h3>Personnages ({chars.length})</h3>
            <button className="btn small" onClick={() => setEditChars(!editChars)}>
              {editChars ? 'Fermer' : 'Modifier'}
            </button>
          </div>
          {editChars ? (
            <>
              <textarea
                rows={Math.max(4, chars.length + 1)}
                defaultValue={(set.charactersOverride ?? chars.map((c) => minifigNameFr(c).main)).join('\n')}
                onBlur={(e) => {
                  const list = e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean)
                  void patch({ charactersOverride: list.length ? list : undefined })
                }}
              />
              <p className="muted small">Un personnage par ligne. Vide la liste pour revenir à celle de Rebrickable.</p>
            </>
          ) : set.charactersOverride?.length ? (
            <ul className="charlist">
              {set.charactersOverride.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : set.minifigs.length ? (
            <ul className="figs">
              {set.minifigs.map((m) => (
                <li key={m.figNum}>
                  {m.imageUrl ? <img src={m.imageUrl} alt="" loading="lazy" /> : null}
                  <span className="pname">
                    {m.quantity > 1 ? `${m.quantity} × ` : ''}
                    {minifigNameFr(m.name).main}
                    {minifigNameFr(m.name).detail ? <small>{minifigNameFr(m.name).detail}</small> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Aucun personnage.</p>
          )}
        </div>
      </div>

      <div className="row">
        <h2>Mes exemplaires ({copies.length})</h2>
        <button className="btn" onClick={() => void saveCopy(blankCopy(set.setNum))}>
          + Exemplaire
        </button>
      </div>
      {copies.map((c, i) => (
        <CopyEditor key={c.id} copy={c} index={i + 1} setNum={set.setNum} />
      ))}
      {copies.length === 0 ? <p className="muted">Tu ne possèdes plus ce set.</p> : null}
      <div className="danger-zone">
        <button
          className="btn danger"
          onClick={() => {
            const n = copies!.length
            if (!confirm(`Supprimer « ${displayName(set)} » de ta collection${n > 1 ? ` avec ses ${n} exemplaires` : ''} ?`)) return
            void deleteSetFromCollection(set).then(() => replaceWith({ name: 'gallery' }))
          }}
        >
          Supprimer ce set de ma collection
        </button>
      </div>
    </section>
  )
}
