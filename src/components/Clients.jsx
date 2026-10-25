import { CLIENT_GROUPS, CLIENTS } from '../data/clients'

// Our clients. On the About page (#clients): a grid per group. On the home
// page (`strip`): two rows scrolling in opposite directions. Names and logos
// live in src/data/clients.js; a client without a logo is set in type.
function Tile({ c }) {
  return (
    <li className={`client-tile${c.logo ? '' : ' client-tile--name'}`}>
      {c.logo ? <img src={c.logo} alt={c.name} loading="lazy" /> : <span className="client-name">{c.name}</span>}
      <span className="client-sector">{c.logo ? c.name : c.sector}</span>
    </li>
  )
}

function Strip({ items, reverse }) {
  return (
    <div className={`clients-strip${reverse ? ' is-reverse' : ''}`} aria-hidden="true">
      <ul className="clients-strip-track">
        {[...items, ...items].map((c, i) => (
          <Tile key={`${c.name}-${i}`} c={c} />
        ))}
      </ul>
    </div>
  )
}

export default function Clients({ id = 'clients', label = 'OUR CLIENTS', more, strip = false }) {
  const half = Math.ceil(CLIENTS.length / 2)
  return (
    <section className={`clients${strip ? ' clients--strip' : ''}`} id={id} aria-labelledby={`${id}-title`}>
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

        {strip ? (
          <>
            <Strip items={CLIENTS.slice(0, half)} />
            <Strip items={CLIENTS.slice(half)} reverse />
            {/* Screen readers get the plain list */}
            <ul className="visually-hidden">
              {CLIENTS.map((c) => (
                <li key={c.name}>{c.name}</li>
              ))}
            </ul>
          </>
        ) : (
          CLIENT_GROUPS.map((g) => (
            <div key={g.key} className="clients-group">
              <h3 className="clients-group-label">{g.label}</h3>
              <ul className="clients-grid">
                {CLIENTS.filter((c) => c.group === g.key).map((c) => (
                  <Tile key={c.name} c={c} />
                ))}
              </ul>
            </div>
          ))
        )}

        {more && (
          <a className="hs-more clients-more" href={more}>
            All clients →
          </a>
        )}
      </div>
    </section>
  )
}
