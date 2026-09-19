const LINKS = [
  { href: '#technology', label: 'Technology' },
  { href: '#aircraft', label: 'Aircraft' },
  { href: '#applications', label: 'Applications' },
  { href: '#about', label: 'About' },
]

const SOCIAL = [
  { label: 'YouTube', href: 'https://www.youtube.com/@skyeyetechnology' },
  { label: 'Instagram', href: 'https://www.instagram.com/goset.official/' },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/people/Skyeye-India/pfbid021BZLacsoCbSNdBtmk6pY12bMM5wNoAQjxi1DVP2eNjSAm14mekmuSVg35puBDTxWl/',
  },
  { label: 'WhatsApp', href: 'https://api.whatsapp.com/send?phone=918455041474' },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__row">
        <a className="footer__mark" href="#top">
          SKY&nbsp;EYE
        </a>
        <nav className="footer__links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="footer__social">
          {SOCIAL.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer noopener">
              {s.label}
            </a>
          ))}
        </div>
      </div>
      <div className="footer__row footer__row--meta">
        <span>Bhubaneswar, Odisha, India</span>
        <span>© {new Date().getFullYear()} Sky Eye Technology (SET) Pvt. Ltd.</span>
      </div>
    </footer>
  )
}
