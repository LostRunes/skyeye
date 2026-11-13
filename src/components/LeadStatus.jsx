import './LeadStatus.css'

// What a lead form shows after submitting: a little drone flies in carrying a
// "Thank you" banner once the lead reached Zoho CRM, or a nudge towards
// WhatsApp if it couldn't be sent.

// Round-bodied drone with a smiley face, spinning rotors and a banner on two
// strings. Pure SVG + CSS animation (see LeadStatus.css).
export function CuteDrone({ text = 'THANK YOU!' }) {
  return (
    <svg className="cute-drone" viewBox="0 0 320 250" role="img" aria-label={`A smiling drone holding a “${text}” banner`}>
      <g className="cd-fly">
        {/* arms + rotors */}
        <g className="cd-arms">
          <rect x="62" y="58" width="196" height="9" rx="4.5" fill="#2b2b2b" />
          <rect x="66" y="42" width="8" height="22" rx="4" fill="#2b2b2b" />
          <rect x="246" y="42" width="8" height="22" rx="4" fill="#2b2b2b" />
          <g className="cd-rotor" style={{ transformOrigin: '70px 40px' }}>
            <ellipse cx="70" cy="40" rx="38" ry="5" fill="#cfd8dc" opacity="0.85" />
          </g>
          <g className="cd-rotor cd-rotor--b" style={{ transformOrigin: '250px 40px' }}>
            <ellipse cx="250" cy="40" rx="38" ry="5" fill="#cfd8dc" opacity="0.85" />
          </g>
          <circle cx="70" cy="40" r="5" fill="#ff4f00" />
          <circle cx="250" cy="40" r="5" fill="#ff4f00" />
        </g>

        {/* body */}
        <ellipse cx="160" cy="146" rx="48" ry="7" fill="#000" opacity="0.08" className="cd-shadow" />
        <rect x="104" y="48" width="112" height="84" rx="42" fill="#ff4f00" />
        <rect x="114" y="56" width="92" height="66" rx="33" fill="#fff4ec" />
        {/* antenna */}
        <line x1="160" y1="48" x2="160" y2="30" stroke="#2b2b2b" strokeWidth="4" strokeLinecap="round" />
        <circle cx="160" cy="27" r="6" fill="#ffd166" className="cd-blink-light" />

        {/* face */}
        <g className="cd-eyes">
          <ellipse cx="141" cy="84" rx="7" ry="9" fill="#2b2b2b" />
          <ellipse cx="179" cy="84" rx="7" ry="9" fill="#2b2b2b" />
          <circle cx="143.5" cy="80.5" r="2.6" fill="#fff" />
          <circle cx="181.5" cy="80.5" r="2.6" fill="#fff" />
        </g>
        <ellipse cx="128" cy="100" rx="7" ry="4.5" fill="#ff8fa3" opacity="0.7" />
        <ellipse cx="192" cy="100" rx="7" ry="4.5" fill="#ff8fa3" opacity="0.7" />
        <path d="M146 99 Q160 114 174 99" fill="none" stroke="#2b2b2b" strokeWidth="4" strokeLinecap="round" />

        {/* little legs */}
        <path d="M128 128 L120 142 M192 128 L200 142" stroke="#2b2b2b" strokeWidth="5" strokeLinecap="round" />

        {/* banner on strings */}
        <g className="cd-banner">
          <path d="M126 132 L88 176 M194 132 L232 176" stroke="#6b6b6b" strokeWidth="2" />
          <path d="M62 176 H258 L248 196 L258 216 H62 L72 196 Z" fill="#fff" stroke="#ff4f00" strokeWidth="3" strokeLinejoin="round" />
          <text x="160" y="203" textAnchor="middle" className="cd-banner-text">
            {text}
          </text>
        </g>
      </g>
    </svg>
  )
}

export function LeadSent({ title = 'Thank you — request received.', text, onReset, className = '', banner }) {
  return (
    <div className={`lead-sent ${className}`} role="status">
      <CuteDrone text={banner} />
      <strong className="lead-sent-title">{title}</strong>
      <p className="lead-sent-text">{text || 'The Sky Eye team will get back to you within a day.'}</p>
      {onReset && (
        <button type="button" className="lead-sent-again" onClick={onReset}>
          Send another
        </button>
      )}
    </div>
  )
}

export function LeadError({ whatsappHref }) {
  return (
    <p className="lead-error" role="alert">
      Couldn’t send that just now. Please try again, or{' '}
      <a href={whatsappHref} target="_blank" rel="noreferrer noopener">
        send it on WhatsApp
      </a>
      .
    </p>
  )
}
