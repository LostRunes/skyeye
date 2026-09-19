import { useEffect, useState } from 'react'

const LINKS = [
  { href: '#technology', label: 'Technology' },
  { href: '#aircraft', label: 'Aircraft' },
  { href: '#applications', label: 'Applications' },
  { href: '#about', label: 'About' },
]

export default function Navbar() {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          ticking = false
          setSolid(window.scrollY > 48)
        })
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`navbar ${solid ? 'navbar--solid' : ''}`}>
      <a className="navbar__mark" href="#top">
        SKY&nbsp;EYE
      </a>
      <nav className="navbar__links">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
      <a className="navbar__contact" href="#contact">
        Explore
      </a>
    </header>
  )
}
