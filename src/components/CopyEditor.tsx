import { useState } from 'react'
import { englishToFrench } from '../i18n'
import { deleteCopy, saveCopy } from '../db'
import type { CopyRecord } from '../types'
import { MissingPartsDialog } from './MissingPartsDialog'

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className={`toggle ${value ? 'yes' : 'no'}`} aria-pressed={value} onClick={() => onChange(!value)}>
      <span>{value ? '✓' : '✗'}</span>
      {label}
    </button>
  )
}

export function CopyEditor({ copy, index, setNum }: { copy: CopyRecord; index: number; setNum: string }) {
  const [picking, setPicking] = useState(false)
  const patch = (p: Partial<CopyRecord>) => saveCopy({ ...copy, ...p })
  const missingTotal = copy.missingParts.reduce((n, p) => n + p.quantity, 0)

  return (
    <div className="panel copy">
      <div className="row">
        <h3>Exemplaire {index}</h3>
        <button
          className="btn small danger"
          onClick={() => {
            if (confirm(`Supprimer l'exemplaire ${index} ?`)) void deleteCopy(copy)
          }}
        >
          Supprimer l'exemplaire
        </button>
      </div>
      <div className="toggles">
        <Toggle label="Boîte" value={copy.hasBox} onChange={(v) => void patch({ hasBox: v })} />
        <Toggle label="Notice" value={copy.hasInstructions} onChange={(v) => void patch({ hasInstructions: v })} />
        <Toggle label="Pièces supp." value={copy.hasSpareParts} onChange={(v) => void patch({ hasSpareParts: v })} />
        <Toggle label="Monté" value={copy.built} onChange={(v) => void patch({ built: v })} />
      </div>
      <div className="two">
        <label>
          Prix d'achat (€)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={copy.purchasePrice ?? ''}
            onChange={(e) => void patch({ purchasePrice: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
        </label>
        <label>
          Date d'achat
          <input type="date" value={copy.purchaseDate ?? ''} onChange={(e) => void patch({ purchaseDate: e.target.value || undefined })} />
        </label>
      </div>
      <label>
        Notes
        <textarea rows={2} value={copy.notes ?? ''} onChange={(e) => void patch({ notes: e.target.value || undefined })} />
      </label>

      <div className="row">
        <h4>{missingTotal ? `Pièces manquantes (${missingTotal})` : 'Aucune pièce manquante'}</h4>
        <button className="btn small" onClick={() => setPicking(true)}>
          + Pièce manquante
        </button>
      </div>
      {copy.missingParts.length ? (
        <ul className="parts">
          {copy.missingParts.map((p) => (
            <li key={p.id}>
              {p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" /> : <span className="noimg">✎</span>}
              <span className="pname">
                {englishToFrench(p.name)}
                <small>{[p.partNum, p.colorName].filter(Boolean).join(' · ')}</small>
              </span>
              <input
                type="number"
                min="1"
                className="qty"
                value={p.quantity}
                onChange={(e) =>
                  void patch({
                    missingParts: copy.missingParts.map((x) => (x.id === p.id ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x))
                  })
                }
              />
              <button
                className="btn small"
                aria-label="Supprimer"
                onClick={() => void patch({ missingParts: copy.missingParts.filter((x) => x.id !== p.id) })}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {picking ? (
        <MissingPartsDialog
          setNum={setNum}
          onClose={() => setPicking(false)}
          onPick={(part) => {
            void patch({ missingParts: [...copy.missingParts, part] })
            setPicking(false)
          }}
        />
      ) : null}
    </div>
  )
}
