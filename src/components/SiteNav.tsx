import { Link, NavLink } from 'react-router-dom'
import { useProgress } from '../data/progress'
import { meta } from '../data'
import './SiteNav.css'

export function SiteNav() {
  const { readCount } = useProgress()
  return (
    <header className="nav">
      <Link to="/" className="nav-brand">
        <span className="nav-brand-mark">✦</span>
        大问题<span className="nav-brand-sub">· 纸上星图</span>
      </Link>
      <nav className="nav-links">
        <NavLink to="/" end>
          天球
        </NavLink>
        <NavLink to="/minimum">一等星表</NavLink>
        <NavLink to="/library">观测手册</NavLink>
      </nav>
      <div className="nav-progress" title={`已点亮 ${readCount} / ${meta.thinkerCount} 颗星`}>
        <span className="nav-progress-star">✦</span>
        {readCount}
      </div>
    </header>
  )
}
