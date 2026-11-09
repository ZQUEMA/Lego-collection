import { useMemo, useState } from 'react'
import { SetCard, copiesBadge } from '../components/SetCard'
import { useOwned } from '../hooks'
import { href } from '../router'
import { displayName, filterOwned, sortEntries } from '../search'

export function Gallery() {
  const owned = useOwned()
  const [text, setText] = useState('')
  const list = useMemo(() => sortEntries(filterOwned(owned ?? [], { text: text || undefined })), [owned, text])
  if (!owned) return null
  const copies = owned.reduce((n, e) => n + e.copies.length, 0)
  if (owned.length === 0)
    return (
      <section className="empty">
        <p>Ta galerie est vide.</p>
        <a className="btn primary" href={href({ name: 'add' })}>
          Ajouter un premier set
        </a>
      </section>
    )
  return (
    <section>
      <div className="toolbar">
        <input type="search" placeholder="Filtrer ma galerie…" value={text} onChange={(e) => setText(e.target.value)} />
        <span className="muted">
          {owned.length} set{owned.length > 1 ? "s" : ""} · {copies} exemplaire{copies > 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid">
        {list.map(({ set, copies }) => (
          <SetCard
            key={set.setNum}
            setNum={set.setNum}
            name={displayName(set)}
            year={set.year}
            imageUrl={set.imageUrl}
            subtitle={set.collection ?? set.themeName}
            badge={copiesBadge(copies.length)}
          />
        ))}
      </div>
    </section>
  )
}
