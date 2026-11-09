import { href } from '../router'
import { shortNumber } from '../search'

interface Props {
  setNum: string
  name: string
  year?: number
  imageUrl?: string
  subtitle?: string
  count?: number
  onClick?: () => void
  action?: React.ReactNode
}

export function SetCard({ setNum, name, year, imageUrl, subtitle, count, onClick, action }: Props) {
  const body = (
    <>
      <div className="thumb">
        {imageUrl ? <img src={imageUrl} alt="" loading="lazy" /> : <div className="noimg">?</div>}
        {count && count > 0 ? <span className="count">{count > 1 ? `×${count}` : '✓'}</span> : null}
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
