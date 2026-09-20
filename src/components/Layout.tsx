import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'

const publicLinks = [['/services', 'Services'], ['/performance', 'Performance'], ['/seo', 'SEO'], ['/accessibility', 'Accessibility'], ['/ai', 'AI'], ['/methodology', 'Methodology'], ['/pricing', 'Pricing'], ['/concepts', 'Concept lab']]

const navigationGroups = [
  { label: 'Workspace', links: [['/app/dashboard', 'Overview'], ['/app/websites', 'Websites'], ['/app/audits', 'Audits'], ['/app/recommendations', 'Actions']] },
  { label: 'Insights', links: [['/app/performance', 'Performance'], ['/app/seo', 'Search'], ['/app/accessibility', 'Accessibility'], ['/app/usability', 'Experience'], ['/app/technical', 'Technical'], ['/app/ai', 'AI readiness']] },
  { label: 'Reporting', links: [['/app/reports', 'Reports'], ['/app/history', 'History']] },
]

function MenuToggle({ open, controls, onClick, buttonRef }: { open: boolean; controls: string; onClick: () => void; buttonRef?: RefObject<HTMLButtonElement | null> }) {
  return <button ref={buttonRef} className="menu-toggle" type="button" aria-expanded={open} aria-controls={controls} aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={onClick}>
    <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
  </button>
}

function useMenuFocus(open: boolean, closeMenu: () => void, toggleRef: React.RefObject<HTMLButtonElement | null>, menuId: string) {
  useEffect(() => {
    if (!open) return
    const menu = document.getElementById(menuId)
    const focusable = menu?.querySelector<HTMLElement>('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])')
    focusable?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, closeMenu, toggleRef, menuId])
}

function AuditContextNav({ closeMenu }: { closeMenu: () => void }) {
  const { id } = useParams()
  const location = useLocation()
  if (!id || location.pathname.endsWith('/new') || location.pathname.endsWith('/run')) return null

  return <div className="audit-context">
    <div className="audit-context-back"><Link to="/app/audits" onClick={closeMenu}>← All audits</Link></div>
    <span className="audit-context-label">Audit</span>
    <strong className="audit-context-title">Command centre</strong>
    <nav aria-label="Audit navigation">
      <NavLink end to={`/app/audits/${id}`} onClick={closeMenu}>Overview</NavLink>
      <a href={`/app/audits/${id}#findings`} onClick={closeMenu}>Findings</a>
      <Link to="/app/recommendations" onClick={closeMenu}>Actions</Link>
      <Link to={`/app/audits/new/run?audit=${encodeURIComponent(id)}`} onClick={closeMenu}>Run again</Link>
    </nav>
  </div>
}

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const closeMenu = () => setMenuOpen(false)
  useMenuFocus(menuOpen, closeMenu, toggleRef, 'primary-navigation')
  return <><header className={`site-header ${menuOpen ? 'menu-open' : ''}`}><Link className="brand" to="/" onClick={closeMenu}>OTTIMO<span aria-hidden="true">.</span></Link><MenuToggle buttonRef={toggleRef} open={menuOpen} controls="primary-navigation" onClick={() => setMenuOpen(open => !open)} /><nav id="primary-navigation" aria-label="Primary">{publicLinks.map(([to, label]) => <NavLink key={to} to={to} end onClick={closeMenu}>{label}</NavLink>)}</nav><div className="header-actions"><Link className="btn btn-ghost" to="/contact" onClick={closeMenu}>Contact</Link><Link className="btn btn-primary" to="/app/dashboard" onClick={closeMenu}>Open platform</Link></div></header><main id="main"><Outlet /></main><footer><div className="footer-brand">OTTIMO.</div><p>Fast. Accessible. Clear. Useful.</p><p>Ottimo helps digital teams improve the websites that matter.</p><Link className="footer-concepts" to="/concepts">Explore the concept lab →</Link></footer></>
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const closeMenu = () => setMenuOpen(false)
  useMenuFocus(menuOpen, closeMenu, toggleRef, 'app-navigation')
  return <div className="app-shell"><aside className={`sidebar ${menuOpen ? 'menu-open' : ''}`}><div className="sidebar-top"><Link className="brand" to="/" onClick={closeMenu}>OTTIMO<span aria-hidden="true">.</span></Link><MenuToggle buttonRef={toggleRef} open={menuOpen} controls="app-navigation" onClick={() => setMenuOpen(open => !open)} /></div><nav id="app-navigation" aria-label="Application">
    {navigationGroups.map(group => <div className="nav-group" key={group.label}><span className="nav-group-label">{group.label}</span>{group.links.map(([to, label]) => <NavLink key={to} to={to} end onClick={closeMenu}>{label}</NavLink>)}</div>)}
    <div className="nav-group nav-group-settings"><span className="nav-group-label">Settings</span><NavLink to="/app/settings" end onClick={closeMenu}>Settings</NavLink></div>
  </nav><AuditContextNav closeMenu={closeMenu} /><Link className="side-cta" to="/" onClick={closeMenu}>← Public site</Link></aside><div className="app-main"><header className="app-top"><div><span className="eyebrow">Ottimo platform</span><strong>Digital presence, made measurable.</strong></div><div className="demo-chip">Demo mode · local data</div></header><main id="main" className="app-content"><Outlet /></main></div></div>
}
