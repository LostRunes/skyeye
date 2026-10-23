import { CONTACTS, ik } from '../cdn'

const logoMarkLight = ik('site/logo-mark-light.png', 'h-96')

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div>
              <div className="footer-logo">
                <img className="footer-logo-mark" src={logoMarkLight} alt="" />
                <span className="footer-brand-name">SKY EYE TECHNOLOGY PVT. LTD.</span>
              </div>
              <p className="footer-tagline">"UNFOLDING THE UNFILTERED."</p>
              <p className="footer-sub" style={{ marginTop: 'var(--space-md)' }}>
                Manufacturing locally. Training nationally. Innovating globally.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <p className="footer-address">{CONTACTS.address} • India</p>
              <p className="footer-cert">{CONTACTS.email}</p>
            </div>
          </div>

          {/* Links */}
          <div className="footer-links">
            <div className="footer-links-group">
              <span className="footer-links-heading">COMPANY</span>
              <a className="footer-link" href="#/">Home</a>
              <a className="footer-link" href="#/about">About Us</a>
              <a className="footer-link" href="#/training">Training</a>
              <a className="footer-link" href="#/gallery">Gallery</a>
            </div>
            <div className="footer-links-group">
              <span className="footer-links-heading">SERVICES</span>
              <a className="footer-link" href="#/services/skyvertising">Skyvertising</a>
              <a className="footer-link" href="#/services/drone-as-a-service">Drone as a Service</a>
            </div>
            <div className="footer-links-group">
              <span className="footer-links-heading">CONNECT</span>
              {CONTACTS.people.map((p) => (
                <a key={p.tel} className="footer-link" href={`tel:${p.tel}`}>{p.phone}</a>
              ))}
              <div style={{ paddingTop: 'var(--space-xs)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                {CONTACTS.social.map((s) => (
                  <a key={s.label} className="footer-social-link" href={s.href} target="_blank" rel="noreferrer noopener">
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span className="footer-bottom-dot" />
            <span>© {new Date().getFullYear()} SKY EYE TECHNOLOGY (SET) PVT. LTD. ALL RIGHTS RESERVED.</span>
          </div>
          <div className="footer-bottom-right">
            <span>GEO-LOC: 20.2961° N, 85.8245° E</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
