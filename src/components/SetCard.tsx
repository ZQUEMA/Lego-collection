import { href } from '../router'
import { shortNumber } from '../search'

interface Props {
  setNum: string
  name: string
  year?: number
  imageUrl?: string
  subtitle?: string
  badge?: string
  onClick?: () => void
  action?: React.ReactNode
}

export function SetCard({ setNum, name, year, imageUrl, subtitle, badge, onClick, action }: Props) {
  const body = (
    <>
      <div className="thumb">
        {imageUrl ? <img src={imageUrl} alt="" loading="lazy" /> : <div className="noimg">?</div>}
        {badge ? <span className="count">{badge}</span> : null}
      </div>
      <div className="meta">
        <div className="num">
          {shortNumber(setNum)}{year ? ` · ${year}` : ""}
        </div>
        <div className="name">{name}</div>
        {subtitle ? <div className="sub">{subtitle}</div> : null}
      </div>
    </>
  )
  return (
    <div className="card">
      {onClick ? (
        <button type="button" className="cardbody" onClick={onClick}>
          {body}
        </button>
      ) : (
        <a className="cardbody" href={href({ name: 'set', setNum })}>
          {body}
        </a>
      )}
      {action}
    </div>
  )
}

export function copiesBadge(count: number): string | undefined {
  return count > 1 ? `×${count}` : undefined
}

export function ownedBadge(count?: number): string | undefined {
  if (!count) return undefined
  return count > 1 ? `Possédé ×${count}` : 'Possédé'
}
