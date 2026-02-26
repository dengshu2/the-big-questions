import { Link } from 'react-router-dom'
import './SiteNav.css'

export function SiteNav() {
  return (
    <nav className="site-nav">
      <Link to="/" className="site-nav-logo">
        大问题
        <span>The Big Questions</span>
      </Link>
      <div className="site-nav-links">
        <Link to="/thinkers" className="site-nav-link">
          思想家
        </Link>
        <Link to="/minimum" className="site-nav-link">
          必读书单
        </Link>
      </div>
    </nav>
  )
}
