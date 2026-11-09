import { useEffect, useMemo, useState } from 'react'
import { englishToFrench, fold } from '../i18n'
import { newId } from '../db'
import { fetchSetParts, searchParts, type PartHit } from '../rebrickable'
import type { MissingPart, MissingPartSource } from '../types'

interface Props {
  setNum: string
  onPick: (p: MissingPart) => void
  onClose: () => void
}

function PartGrid({ parts, onPick }: { parts: PartHit[]; onPick: (p: PartHit) => void }) {
  return (
    <ul className="partgrid">
      {parts.map((p, i) => (
        <li key={`${p.partNum}-${p.colorName}-${i}`}>
          <button type="button" onClick={() => onPick(p)}>
            {p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" /> : <span className="noimg">?</span>}
            <span className="pname">{englishToFrench(p.name)}</span>
            <small>
              {[p.partNum, p.colorName, p.quantity ? `×${p.quantity}` : null, p.isSpare ? 'rechange' : null].filter(Boolean).join(' · ')}
            </small>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function MissingPartsDialog({ setNum, onPick, onClose }: Props) {
  const [tab, setTab] = useState<MissingPartSource>('inventory')
  const [inventory, setInventory] = useState<PartHit[] | null>(null)
  const [filter, setFilter] = useState('')
  const [catalogQ, setCatalogQ] = useState('')
  const [catalog, setCatalog] = useState<PartHit[] | null>(null)
  const [text, setText] = useState('')
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSetParts(setNum)
      .then(setInventory)
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e))
        setInventory([])
      })
  }, [setNum])

  const shown = useMemo(() => {
    if (!inventory) return []
    const q = fold(filter.trim())
    return q ? inventory.filter((p) => fold(`${p.name} ${englishToFrench(p.name)} ${p.partNum} ${p.colorName ?? ''}`).includes(q)) : inventory
  }, [inventory, filter])

  const pick = (source: MissingPartSource, p: PartHit) =>
    onPick({ id: newId(), source, name: p.name, partNum: p.partNum, colorName: p.colorName, imageUrl: p.imageUrl, quantity: qty })

  return (
    <div className="dialog" role="dialog" aria-modal onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="row">
          <h3>Pièce manquante</h3>
          <button className="btn small" onClick={onClose}>
            Fermer
          </button>
        </div>
        <div className="seg">
          <button className={tab === 'inventory' ? 'on' : ''} onClick={() => setTab('inventory')}>
            Inventaire du set
          </button>
          <button className={tab === 'catalog' ? 'on' : ''} onClick={() => setTab('catalog')}>
            Toutes les pièces
          </button>
          <button className={tab === 'text' ? 'on' : ''} onClick={() => setTab('text')}>
            Texte libre
          </button>
        </div>
        <label className="inline">
          Quantité manquante
          <input type="number" min="1" className="qty" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
        </label>
        {error ? <p className="error">{error}</p> : null}

        {tab === 'inventory' ? (
          <>
            <input type="search" placeholder="Filtrer (ex. tile, 3004, black)…" value={filter} onChange={(e) => setFilter(e.target.value)} />
            {inventory === null ? <p className="muted">Chargement de l'inventaire…</p> : <p className="muted small">{shown.length} pièces</p>}
            <PartGrid parts={shown} onPick={(p) => pick('inventory', p)} />
          </>
        ) : null}

        {tab === 'catalog' ? (
          <>
            <form
              className="toolbar"
              onSubmit={(e) => {
                e.preventDefault()
                setCatalog(null)
                searchParts(catalogQ)
                  .then(setCatalog)
                  .catch((err) => setError(String(err)))
              }}
            >
              <input type="search" placeholder="Nom ou référence (ex. plaque 2 x 4, 3004)" value={catalogQ} onChange={(e) => setCatalogQ(e.target.value)} />
              <button className="btn primary">Chercher</button>
            </form>
            {catalog ? <PartGrid parts={catalog} onPick={(p) => pick('catalog', p)} /> : null}
          </>
        ) : null}

        {tab === 'text' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (text.trim()) onPick({ id: newId(), source: 'text', name: text.trim(), quantity: qty })
            }}
          >
            <textarea rows={3} placeholder="ex. 2 tuiles grises 1x2" value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn primary">Ajouter</button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
