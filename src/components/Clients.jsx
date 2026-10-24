import { CLIENTS } from '../data/clients'

// Our clients — on the About page (#clients) and, compact, on the home page.
// Names and logos live in src/data/clients.js; until it is filled in, the
// grid shows placeholder tiles.
const PLACEHOLDERS = 8

export default function Clients({ id = 'clients', label = 'OUR CLIENTS', more }) {
  const empty = CLIENTS.length === 0
  return (
    <section className="clients" id={id} aria-labelledby={`${id}-title`}>
      <div className="container py-2xl">
        <div className="clients-head">
          <div>
            <span className="section-label">{label}</span>
            <h2 className="section-h2" id={`${id}-title`}>
              WHO WE WORK WITH.
            </h2>
          </div>
          <p className="section-desc">
            Government departments, institutions and businesses that have trusted Sky Eye with their
            training, events and operations.
          </p>
        </div>

        <ul className={`clients-grid${empty ? ' is-empty' : ''}`}>
          {empty
            ? Array.from({ length: PLACEHOLDERS }, (_, i) => (
                <li key={i} className="client-tile client-tile--placeholder" aria-hidden="true">
                  <span>CLIENT {String(i + 1).padStart(2, '0')}</span>
                </li>
              ))
            : CLIENTS.map((c) => (
                <li key={c.name} className="client-tile">
                  {c.logo ? <img src={c.logo} alt={c.name} loading="lazy" /> : <span className="client-name">{c.name}</span>}
                  {c.sector && <span className="client-sector">{c.sector}</span>}
                </li>
              ))}
        </ul>
        {empty && <p className="clients-soon">Client list coming soon.</p>}
        {more && (
          <a className="hs-more clients-more" href={more}>
            More about us →
          </a>
        )}
      </div>
    </section>
  )
}
