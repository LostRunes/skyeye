// The closing call to action on every page: a solid black box with one bold
// button, so "Request a service" is never a small link buried in the copy.
export default function RequestBand({
  service,
  title = 'Have a job for a drone?',
  text = 'Tell us what you need — an aerial ad show, a course for your institution or a drone on your site — and the team will come back to you.',
  label = 'Request a service',
}) {
  return (
    <section className="request-band" aria-label="Request a service">
      <div className="container">
        <div className="request-box">
          <div className="request-copy">
            <span className="request-kicker">SKY EYE TECHNOLOGY · BHUBANESWAR</span>
            <h2 className="request-title">{title}</h2>
            <p className="request-text">{text}</p>
          </div>
          <a className="btn-request btn-request--invert" href="#/contact" data-service={service}>
            {label}
            <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>
  )
}
