import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

const publicLinks = [['/services', 'Services'], ['/performance', 'Performance'], ['/seo', 'SEO'], ['/accessibility', 'Accessibility'], ['/ai', 'AI'], ['/methodology', 'Methodology'], ['/pricing', 'Pricing'], ['/concepts', 'Concept lab']]
const appLinks = [['/app/dashboard', 'Overview'], ['/app/websites', 'Websites'], ['/app/audits', 'Audits'], ['/app/performance', 'Performance'], ['/app/accessibility', 'Accessibility'], ['/app/seo', 'SEO'], ['/app/usability', 'Usability'], ['/app/technical', 'Technical'], ['/app/ai', 'AI readiness'], ['/app/recommendations', 'Recommendations'], ['/app/reports', 'Reports'], ['/app/history', 'History'], ['/app/settings', 'Settings']]

function MenuToggle({ open, controls, onClick }: { open: boolean; controls: string; onClick: () => void }) {
  return <button className="menu-toggle" type="button" aria-expanded={open} aria-controls={controls} aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={onClick}>
    <span aria-hidden="true" />
    <span aria-hidden="true" />
    <span aria-hidden="true" />
  </button>
}

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  return <><header className={`site-header ${menuOpen ? 'menu-open' : ''}`}><Link className="brand" to="/" onClick={closeMenu}>OTTIMO<span>.</span></Link><MenuToggle open={menuOpen} controls="primary-navigation" onClick={() => setMenuOpen(open => !open)} /><nav id="primary-navigation" aria-label="Primary">{publicLinks.map(([to, label]) => <NavLink key={to} to={to} onClick={closeMenu}>{label}</NavLink>)}</nav><div className="header-actions"><Link className="btn btn-ghost" to="/contact" onClick={closeMenu}>Contact</Link><Link className="btn btn-primary" to="/app/dashboard" onClick={closeMenu}>Open platform</Link></div></header><main id="main"><Outlet /></main><footer><div className="footer-brand">OTTIMO.</div><p>Fast. Accessible. Clear. Useful.</p><p>Ottimo helps digital teams improve the websites that matter.</p><Link className="footer-concepts" to="/concepts">Explore the concept lab →</Link></footer></>
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  return <div className="app-shell"><aside className={`sidebar ${menuOpen ? 'menu-open' : ''}`}><div className="sidebar-top"><Link className="brand" to="/" onClick={closeMenu}>OTTIMO<span>.</span></Link><MenuToggle open={menuOpen} controls="app-navigation" onClick={() => setMenuOpen(open => !open)} /></div><nav id="app-navigation" aria-label="Application">{appLinks.map(([to, label]) => <NavLink key={to} to={to} onClick={closeMenu}>{label}</NavLink>)}</nav><Link className="side-cta" to="/" onClick={closeMenu}>← Public site</Link></aside><div className="app-main"><header className="app-top"><div><span className="eyebrow">Ottimo platform</span><strong>Digital presence, made measurable.</strong></div><div className="demo-chip">Demo mode · local data</div></header><main id="main" className="app-content"><Outlet /></main></div></div>
}
