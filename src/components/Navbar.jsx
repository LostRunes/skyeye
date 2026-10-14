import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { brochureCrop, CONTACTS, ik, newPhoto, photo } from '../cdn'
import { useTheme } from '../hooks/useTheme'
import Scramble from './Scramble'
import { COURSES } from '../data/courses'
import { scrollToSection, scrollToTop } from '../router'

// Modelled on anduril.com: hovering any item drops one translucent sheet out
// of the bar, the page behind blurs, and moving between items cross-fades the
// panel while its labels decode out of jumbled letters. The panel height
// glides between items, and the bar tucks away on the way down the page.
const PANELS = [
  {
    key: 'home',
    homeTo: 'top',
    path: '/',
    href: '#/',
    label: 'Home',
    kicker: 'Sky Eye Technology',
    desc: 'Drones, robotics and intelligent technology for real-world work — from Bhubaneswar, Odisha.',
    listLabel: 'Home',
    links: [
      { href: '#/', label: 'Home' },
      { href: '#/?to=overview', label: 'Overview' },
    ],
    cardsLabel: 'Featured',
    cards: [
      { href: '#/services/skyvertising', label: 'Skyvertising', img: brochureCrop('led-net-city', 'w-560,h-350,fo-auto') },
      { href: '#/training', label: 'Live training', img: newPhoto('genai-speaker', 'w-560,h-350,fo-auto') },
    ],
  },
  {
    key: 'about',
    homeTo: 'home-about',
    path: '/about',
    href: '#/about',
    label: 'About Us',
    kicker: 'About Us',
    desc: 'Sky Eye Technology (SET) Pvt. Ltd. — drones, robotics and AI, working across research, training and real-world deployment.',
    listLabel: 'About',
    links: [
      { href: '#/about', label: 'Who we are' },
      { href: '#/about?to=engineering', label: 'Engineering' },
      { href: '#/about?to=rnd', label: 'Research & development' },
      { href: '#/about?to=track-record', label: 'Track record' },
    ],
    cardsLabel: 'Inside',
    cards: [
      { href: '#/about?to=rnd', label: 'R&D bench', img: photo('rnd', 264, 'w-560,h-350,fo-auto') },
      { href: '#/about?to=track-record', label: 'Track record', img: photo('govt', 569, 'w-560,h-350,fo-auto') },
    ],
  },
  {
    key: 'services',
    homeTo: 'home-services',
    path: '/services',
    href: '#/services',
    label: 'Our Services',
    kicker: 'Our Services',
    desc: 'Two ways we put drones to work — on your brand and on your site.',
    listLabel: 'Services',
    links: [
      { href: '#/services/skyvertising', label: 'Skyvertising' },
      { href: '#/services/drone-as-a-service', label: 'Drone as a Service' },
    ],
    cardsLabel: 'Services',
    cards: [
      { href: '#/services/skyvertising', label: 'Skyvertising', img: brochureCrop('sky-is-live', 'w-560,h-350,fo-auto') },
      { href: '#/services/drone-as-a-service', label: 'Drone as a Service', img: photo('agri', 141, 'w-560,h-350,fo-auto') },
    ],
  },
  {
    key: 'training',
    homeTo: 'home-training',
    path: '/training',
    href: '#/training',
    label: 'Training',
    kicker: 'Education & Training',
    desc: 'Live, hands-on training in drones and AI for schools, colleges, professionals and defence training units.',
    listLabel: 'Courses',
    links: COURSES.map((c) => ({ href: `#/training?to=course-tab-${c.id}`, label: c.title })),
    cardsLabel: 'In session',
    cards: [
      { href: '#/training', label: 'Generative AI', img: newPhoto('genai-speaker', 'w-560,h-350,fo-auto') },
      { href: '#/training?to=course-tab-drone-basic', label: 'Drone training', img: photo('edu', 356, 'w-560,h-350,fo-auto') },
    ],
  },
  {
    key: 'gallery',
    path: '/gallery',
    href: '#/gallery',
    label: 'Gallery',
    kicker: 'Gallery',
    desc: 'The field, the lab and the classroom — photographs from the company’s own archive.',
    listLabel: 'Gallery',
    links: [
      { href: '#/gallery', label: 'On the ground' },
      { href: '#/gallery?to=photos', label: 'All photos' },
    ],
    cardsLabel: 'Recent',
    cards: [
      { href: '#/gallery?to=photos', label: 'Field operations', img: photo('agri', 139, 'w-560,h-350,fo-auto') },
      { href: '#/gallery?to=photos', label: 'Training', img: photo('edu', 344, 'w-560,h-350,fo-auto') },
    ],
  },
  {
    key: 'contact',
    homeTo: 'home-contact',
    path: '/contact',
    href: '#/contact',
    label: 'Contact Us',
    kicker: 'Contact Us',
    desc: 'A drone ad show, a course for your institution or a drone on your site. Bhubaneswar, Odisha · India.',
    listLabel: 'Reach us',
    links: [
      ...CONTACTS.people.map((p) => ({ href: `tel:${p.tel}`, label: `${p.name} · ${p.phone}` })),
      { href: `mailto:${CONTACTS.email}`, label: CONTACTS.email },
      { href: CONTACTS.whatsapp, label: 'WhatsApp', external: true },
      { href: '#/contact', label: 'Enquiry form' },
    ],
    cardsLabel: 'Request',
    cards: [{ href: '#/contact', label: 'Request a service', img: brochureCrop('led-net-city', 'w-560,h-350,fo-auto') }],
  },
]

// On the home page, items with a homeTo scroll to that summary section
// instead of leaving the page (Gallery always opens its own page).
const goHomeSection = (panel) => (e) => {
  e.preventDefault()
  if (panel.homeTo === 'top') scrollToTop(true)
  else scrollToSection(panel.homeTo)
}

// A page belongs to the top-level item whose path it starts with.
const keyForPath = (path) =>
  (PANELS.slice(1).find((p) => path === p.path || path.startsWith(p.path + '/')) || PANELS[0]).key

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      className="nav-theme"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      <span className="material-symbols-outlined" aria-hidden="true">
        {dark ? 'light_mode' : 'dark_mode'}
      </span>
      <span className="nav-theme-label">{dark ? 'Light' : 'Dark'}</span>
    </button>
  )
}

function NavLink({ panel, href, isOpen, isActive, onEnter, onClick }) {
  const ref = useRef(null)
  return (
    <a
      ref={ref}
      href={href}
      className={`nav-link${isOpen ? ' is-open' : ''}${isActive ? ' is-active' : ''}`}
      onMouseEnter={onEnter}
      onFocus={onEnter}
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls="nav-panel"
    >
      <Scramble text={panel.label} hover hoverRef={ref} duration={420} />
    </a>
  )
}

function PanelLink({ link, onClick, tabbable }) {
  const ref = useRef(null)
  const ext = link.external ? { target: '_blank', rel: 'noreferrer noopener' } : {}
  return (
    <a ref={ref} href={link.href} className="nav-panel-link" onClick={onClick} tabIndex={tabbable ? 0 : -1} {...ext}>
      <span className="nav-panel-plus" aria-hidden="true">+</span>
      <Scramble text={link.label} hover hoverRef={ref} duration={420} />
    </a>
  )
}

function PanelCard({ card, onClick, tabbable }) {
  const ref = useRef(null)
  return (
    <a ref={ref} href={card.href} className="nav-panel-card" onClick={onClick} tabIndex={tabbable ? 0 : -1}>
      <span className="nav-panel-card-img">
        <img src={card.img} alt="" loading="lazy" />
      </span>
      <Scramble text={card.label} hover hoverRef={ref} duration={420} className="nav-panel-card-label" />
    </a>
  )
}

export default function Navbar({ path = '/' }) {
  const onHome = path === '/'
  const [homeActive, setHomeActive] = useState('home')
  const [hidden, setHidden] = useState(false)
  const [openKey, setOpenKey] = useState(null)
  const [switches, setSwitches] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuCount, setMenuCount] = useState(0)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [panelH, setPanelH] = useState(0)
  const closeTimer = useRef(0)
  const panelRefs = useRef({})

  const open = openKey !== null

  // Tuck away scrolling down, come back scrolling up — never while open.
  useEffect(() => {
    let last = window.scrollY
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = window.scrollY
        if (Math.abs(y - last) > 6) {
          setHidden(y > last && y > 160)
          last = y
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('menu-locked', menuOpen)
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setOpenKey(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // The sheet's height follows whichever panel is showing.
  useLayoutEffect(() => {
    if (!openKey) return
    const measure = () => setPanelH(panelRefs.current[openKey]?.offsetHeight || 0)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [openKey])

  const openKeyRef = useRef(null)
  const enter = (key) => {
    clearTimeout(closeTimer.current)
    if (openKeyRef.current !== key) setSwitches((s) => s + 1)
    openKeyRef.current = key
    setOpenKey(key)
  }
  const leaveSoon = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      openKeyRef.current = null
      setOpenKey(null)
    }, 160)
  }
  const stay = () => clearTimeout(closeTimer.current)
  const closeAll = () => {
    clearTimeout(closeTimer.current)
    openKeyRef.current = null
    setOpenKey(null)
    setMenuOpen(false)
  }
  // On the home page, mark whichever summary section is mid-screen.
  useEffect(() => {
    if (!onHome) return
    const ids = PANELS.filter((p) => p.homeTo && p.homeTo !== 'top').map((p) => [p.homeTo, p.key])
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const hit = ids.find(([id]) => id === e.target.id)
          if (hit) setHomeActive(hit[1])
        }),
      { rootMargin: '-45% 0px -50% 0px' }
    )
    ids.forEach(([id]) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    const onScroll = () => {
      if (window.scrollY < window.innerHeight * 0.6) setHomeActive('home')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [onHome])

  const toggleMenu = () => {
    if (!menuOpen) setMenuCount((c) => c + 1)
    setMenuOpen(!menuOpen)
  }

  const isHidden = hidden && !open && !menuOpen

  return (
    <>
      <div className={`nav-scrim${open ? ' is-on' : ''}`} onMouseEnter={leaveSoon} onClick={closeAll} aria-hidden="true" />

      <header
        className={`nav${isHidden ? ' is-hidden' : ''}${open ? ' is-open' : ''}${menuOpen ? ' is-menu' : ''}`}
        onMouseLeave={leaveSoon}
        onMouseEnter={stay}
      >
        <div className="nav-sheet-bg" style={{ '--panel-h': open ? `${panelH}px` : '0px' }} aria-hidden="true" />

        <div className="nav-bar">
          <a className="nav-logo" href="#/" onClick={closeAll} onMouseEnter={leaveSoon} aria-label="Sky Eye Technology, home">
            <img className="nav-logo-mark nav-logo-mark--light" src={ik('site/logo-mark.png', 'h-64')} alt="" />
            <img className="nav-logo-mark nav-logo-mark--dark" src={ik('site/logo-mark-light.png', 'h-64')} alt="" />
            <span className="nav-logo-text">
              <span>SKY EYE</span>
              <span>TECHNOLOGY</span>
            </span>
          </a>

          <nav className="nav-links" aria-label="Primary">
            {PANELS.map((p) => (
              <NavLink
                key={p.key}
                panel={p}
                href={onHome && p.homeTo ? `#/?to=${p.homeTo}` : p.href}
                isOpen={openKey === p.key}
                isActive={onHome ? homeActive === p.key : keyForPath(path) === p.key}
                onEnter={() => enter(p.key)}
                onClick={(e) => {
                  closeAll()
                  if (onHome && p.homeTo) goHomeSection(p)(e)
                }}
              />
            ))}
          </nav>

          <div className="nav-actions" onMouseEnter={leaveSoon}>
            <ThemeToggle />
            <a className="nav-cta btn-request" href="#/contact" onClick={closeAll}>
              <Scramble text="Request a service" hover duration={420} />
            </a>
            <button
              type="button"
              className="nav-burger"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="nav-sheet"
              onClick={toggleMenu}
            >
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Desktop drop panel — every panel is mounted so they can cross-fade */}
        <div
          id="nav-panel"
          className="nav-panel"
          style={{ height: open ? panelH : 0 }}
          aria-hidden={!open}
        >
          {PANELS.map((p) => {
            const shown = openKey === p.key
            return (
              <div
                key={p.key}
                ref={(el) => (panelRefs.current[p.key] = el)}
                className={`nav-panel-page${shown ? ' is-shown' : ''}`}
              >
                <div className="nav-panel-col nav-panel-col--intro">
                  <h3 className="nav-panel-label">
                    <Scramble text={p.kicker} replay={switches} />
                  </h3>
                  <p className="nav-panel-desc">{p.desc}</p>
                </div>
                <div className="nav-panel-col">
                  <h3 className="nav-panel-label">
                    <Scramble text={p.listLabel} replay={switches} />
                  </h3>
                  <div className="nav-panel-links">
                    {p.links.map((l) => (
                      <PanelLink key={l.label} link={l} onClick={closeAll} tabbable={shown} />
                    ))}
                  </div>
                </div>
                <div className="nav-panel-col nav-panel-col--cards">
                  <h3 className="nav-panel-label">
                    <Scramble text={p.cardsLabel} replay={switches} />
                  </h3>
                  <div className={`nav-panel-cards nav-panel-cards--${p.cards.length}`}>
                    {p.cards.map((c) => (
                      <PanelCard key={c.label} card={c} onClick={closeAll} tabbable={shown} />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile full-screen sheet */}
        <div id="nav-sheet" className="nav-sheet" aria-hidden={!menuOpen}>
          <nav className="nav-sheet-links" aria-label="Mobile">
            {PANELS.map((p, i) => (
              <div key={p.key} className="nav-sheet-item">
                {p.key === 'services' ? (
                  <>
                    <button
                      type="button"
                      className="nav-sheet-link"
                      aria-expanded={servicesOpen}
                      onClick={() => setServicesOpen((o) => !o)}
                      tabIndex={menuOpen ? 0 : -1}
                    >
                      <span className="nav-sheet-num">0{i + 1}</span>
                      <Scramble text={p.label} replay={menuCount} duration={560} />
                      <span className={`nav-sheet-plus${servicesOpen ? ' is-open' : ''}`} aria-hidden="true" />
                    </button>
                    <div className={`nav-sheet-sub${servicesOpen ? ' is-open' : ''}`}>
                      <div>
                        {p.links.slice(0, 3).map((c) => (
                          <a key={c.href} href={c.href} onClick={closeAll} tabIndex={menuOpen && servicesOpen ? 0 : -1}>
                            <span>+</span>
                            {c.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <a
                    className="nav-sheet-link"
                    href={onHome && p.homeTo ? `#/?to=${p.homeTo}` : p.href}
                    onClick={(e) => {
                      closeAll()
                      if (onHome && p.homeTo) goHomeSection(p)(e)
                    }}
                    tabIndex={menuOpen ? 0 : -1}
                  >
                    <span className="nav-sheet-num">0{i + 1}</span>
                    <Scramble text={p.label} replay={menuCount} duration={560} />
                  </a>
                )}
              </div>
            ))}
          </nav>
          <a className="btn-request nav-sheet-request" href="#/contact" onClick={closeAll} tabIndex={menuOpen ? 0 : -1}>
            Request a service
            <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
          </a>
          <div className="nav-sheet-foot">
            <ThemeToggle />
            <span>Bhubaneswar · Odisha · India</span>
          </div>
        </div>
      </header>
    </>
  )
}
