import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { seedAudits } from '../data/mock'
import { storage } from '../services/storage'
import { useAuth } from '../features/auth/AuthBoundary'

const publicLinks = [
  ['/services', 'Services'],
  ['/methodology', 'Methodology'],
  ['/pricing', 'Plans'],
  ['/about', 'About'],
] as const

const navigationGroups = [
  { label: 'Workspace', links: [['/app/dashboard', 'Overview'], ['/app/websites', 'Websites'], ['/app/audits', 'Audits'], ['/app/recommendations', 'Actions']] },
  { label: 'Understand', links: [['/app/insights', 'Insights']] },
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

function WebsiteContextNav({ closeMenu }: { closeMenu: () => void }) {
  const location = useLocation()
  const { id: auditId } = useParams()
  const websiteRouteMatch = location.pathname.match(/^\/app\/websites\/([^/]+)$/)
  const websiteIdFromQuery = new URLSearchParams(location.search).get('website')
  const audit = auditId ? [...storage.audits(), ...seedAudits].find(item => item.id === auditId) : undefined
  const id = websiteRouteMatch?.[1] ?? websiteIdFromQuery ?? audit?.websiteId

  if (!id || location.pathname.endsWith('/new') || location.pathname.endsWith('/run')) return null

  const encodedId = encodeURIComponent(id)
  const links = [
    [`/app/websites/${encodedId}`, 'Health'],
    [`/app/insights?website=${encodedId}`, 'Insights'],
    [`/app/audits?website=${encodedId}`, 'Audits'],
    [`/app/performance?website=${encodedId}`, 'Performance'],
    [`/app/seo?website=${encodedId}`, 'Search'],
    [`/app/accessibility?website=${encodedId}`, 'Accessibility'],
    [`/app/usability?website=${encodedId}`, 'Experience'],
    [`/app/technical?website=${encodedId}`, 'Technical'],
    [`/app/ai?website=${encodedId}`, 'AI readiness'],
    [`/app/recommendations?website=${encodedId}`, 'Actions'],
  ] as const

  return <div className="website-context">
    <div className="website-context-heading">
      <span className="audit-context-label">Website</span>
      <strong className="audit-context-title">{id}</strong>
    </div>
    <nav aria-label="Website navigation">
      {links.map(([to, label]) => <NavLink key={to} to={to} end={label === 'Health'} onClick={closeMenu}>{label}</NavLink>)}
    </nav>
  </div>
}

function AuditContextNav({ closeMenu }: { closeMenu: () => void }) {
  const { id } = useParams()
  const location = useLocation()
  if (!id || location.pathname.endsWith('/new') || location.pathname.endsWith('/run')) return null

  return <div className="audit-context">
    <div className="audit-context-back"><Link to="/app/audits" onClick={closeMenu}>← All audits</Link></div>
    <span className="audit-context-label">Audit</span>
    <strong className="audit-context-title">Command centre</strong>
    <nav aria-label="Audit workflow">
      <NavLink end to={`/app/audits/${id}`} onClick={closeMenu}>Overview</NavLink>
      <a href={`/app/audits/${id}#findings`} onClick={closeMenu}>Findings</a>
      <Link to="/app/recommendations" onClick={closeMenu}>Actions</Link>
      <Link to={`/app/audits/new/run?audit=${encodeURIComponent(id)}`} onClick={closeMenu}>Run again</Link>
    </nav>
  </div>
}

function SkipLink() {
  return <a className="skip-link" href="#main">Skip to main content</a>
}

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useMenuFocus(menuOpen, closeMenu, toggleRef, 'primary-navigation')
  return <><SkipLink /><header className={`site-header ${menuOpen ? 'menu-open' : ''}`}><Link className="brand" to="/" onClick={closeMenu}>OTTIMO<span aria-hidden="true">.</span></Link><MenuToggle buttonRef={toggleRef} open={menuOpen} controls="primary-navigation" onClick={() => setMenuOpen(open => !open)} /><nav id="primary-navigation" aria-label="Primary">{publicLinks.map(([to, label]) => <NavLink key={to} to={to} end onClick={closeMenu}>{label}</NavLink>)}</nav><div className="header-actions"><Link className="btn btn-ghost" to="/contact" onClick={closeMenu}>Contact</Link><Link className="btn btn-primary" to="/#start" onClick={closeMenu}>Analyse website</Link></div></header><main id="main" tabIndex={-1}><Outlet /></main><footer><div className="footer-brand">OTTIMO.</div><p>Fast. Accessible. Clear. Useful.</p><p>Website performance, visibility and experience — connected by evidence.</p><div className="footer-links"><Link to="/services">Services</Link><Link to="/methodology">Methodology</Link><Link to="/case-studies">Evidence</Link><Link to="/contact">Contact</Link><Link to="/concepts">Concept lab</Link></div></footer></>
}

function AuthAccountControl() {
  const { session, signOut } = useAuth()
  return <div className="auth-account" aria-label="Account controls"><span>{session.tenantId === 'demo-tenant' ? 'Demo workspace' : 'Workspace'}</span><button type="button" onClick={() => void signOut()}>Sign out</button></div>
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useMenuFocus(menuOpen, closeMenu, toggleRef, 'app-navigation')
  return <div className={`app-shell`}><SkipLink /><aside className={`sidebar ${menuOpen ? 'menu-open' : ''}`}><div className="sidebar-top"><Link className="brand" to="/" onClick={closeMenu}>OTTIMO<span aria-hidden="true">.</span></Link><MenuToggle buttonRef={toggleRef} open={menuOpen} controls="app-navigation" onClick={() => setMenuOpen(open => !open)} /></div><nav id="app-navigation" aria-label="Application">
    {navigationGroups.map(group => <div className="nav-group" key={group.label}><span className="nav-group-label">{group.label}</span>{group.links.map(([to, label]) => <NavLink key={to} to={to} end onClick={closeMenu}>{label}</NavLink>)}</div>)}
    <div className="nav-group nav-group-settings"><span className="nav-group-label">Settings</span><NavLink to="/app/settings" end onClick={closeMenu}>Settings</NavLink></div>
  </nav><WebsiteContextNav closeMenu={closeMenu} /><AuditContextNav closeMenu={closeMenu} /><Link className="side-cta" to="/" onClick={closeMenu}>← Public site</Link></aside><div className="app-main"><header className="app-top"><div><span className="eyebrow">Ottimo platform</span><strong>Digital presence, made measurable.</strong></div><AuthAccountControl /></header><main id="main" tabIndex={-1} className="app-content"><Outlet /></main></div></div>
}
