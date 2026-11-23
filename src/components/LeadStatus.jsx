import { useId } from 'react'
import './LeadStatus.css'

// What a lead form shows after submitting: a little drone flies in carrying a
// "Thank you" banner once the lead reached Zoho CRM, or a nudge towards
// WhatsApp if it couldn't be sent.

// A glossy white pod drone: dark visor with glowing happy eyes, cat-ear fins,
// swept wings with spinning rotors, a black stripe and a glowing thruster,
// carrying a banner on two strings. Pure SVG + CSS animation (LeadStatus.css).
export function CuteDrone({ text = 'THANK YOU!', glow = '#5ef2ff', accent = '#22d3ee', className = '' }) {
  const banner = text !== false && text !== null
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = (name) => `cd-${name}-${uid}`
  const url = (name) => `url(#${id(name)})`

  // One wing + rotor, drawn on the left; the right one is its mirror image
  const wing = (
    <>
      <path d="M110 104 C86 88 58 84 40 92 C32 96 34 106 44 108 C66 112 88 116 110 124 Z" fill={url('wing')} stroke="#a9b4bf" strokeWidth="1.5" />
      <path d="M100 104 C82 96 64 94 50 98" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <rect x="38" y="80" width="8" height="18" rx="4" fill="#c9d1d9" />
      <circle cx="42" cy="80" r="7" fill={url('shell')} stroke="#a9b4bf" strokeWidth="1.5" />
      <g className="cd-rotor" style={{ transformOrigin: '42px 74px' }}>
        <ellipse cx="42" cy="74" rx="30" ry="4" fill="#cfe9f1" opacity="0.75" />
      </g>
      <circle cx="42" cy="74" r="3" fill="#0f1b27" />
    </>
  )

  return (
    <svg
      className={`cute-drone ${className}`}
      viewBox={banner ? '0 0 320 262' : '0 0 320 172'}
      role="img"
      aria-label={banner ? `A smiling drone holding a “${text}” banner` : 'A smiling drone'}
    >
      <defs>
        <radialGradient id={id('shell')} cx="38%" cy="28%" r="78%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#eef2f6" />
          <stop offset="1" stopColor="#b8c3ce" />
        </radialGradient>
        <linearGradient id={id('wing')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c8d1da" />
        </linearGradient>
        <linearGradient id={id('visor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24364a" />
          <stop offset="1" stopColor="#0a121c" />
        </linearGradient>
        <filter id={id('glow')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={id('soft')} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <g className="cd-fly">
        {/* wings */}
        {wing}
        <g transform="translate(320 0) scale(-1 1)">{wing}</g>

        {/* cat-ear fins */}
        <path d="M122 70 C112 50 108 32 112 18 C126 30 140 44 146 58 Z" fill={url('shell')} stroke="#a9b4bf" strokeWidth="1.5" />
        <path d="M198 70 C208 50 212 32 208 18 C194 30 180 44 174 58 Z" fill={url('shell')} stroke="#a9b4bf" strokeWidth="1.5" />
        <circle cx="113" cy="22" r="3.5" fill={glow} className="cd-blink-light" />
        <circle cx="207" cy="22" r="3.5" fill={glow} className="cd-blink-light cd-blink-light--b" />

        {/* thruster glow */}
        <ellipse cx="160" cy="160" rx="13" ry="6" fill={glow} filter={url('soft')} className="cd-thrust" />
        <ellipse cx="160" cy="152" rx="15" ry="6" fill="#c9d1d9" stroke="#a9b4bf" strokeWidth="1.5" />

        {/* shell */}
        <ellipse cx="160" cy="104" rx="60" ry="52" fill={url('shell')} stroke="#a9b4bf" strokeWidth="1.5" />
        <path d="M104 122 Q160 150 216 122" fill="none" stroke="#0f1b27" strokeWidth="4" strokeLinecap="round" />
        <path d="M122 70 Q140 58 162 57" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.9" />

        {/* visor + face */}
        <rect x="116" y="80" width="88" height="46" rx="23" fill={url('visor')} />
        <path d="M128 88 Q160 80 192 88" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.18" />
        <g className="cd-eyes" filter={url('glow')}>
          <path d="M136 106 Q143 95 150 106" fill="none" stroke={glow} strokeWidth="5" strokeLinecap="round" />
          <path d="M170 106 Q177 95 184 106" fill="none" stroke={glow} strokeWidth="5" strokeLinecap="round" />
          <path d="M154 114 Q160 119 166 114" fill="none" stroke={glow} strokeWidth="2.6" strokeLinecap="round" opacity="0.85" />
        </g>
        <ellipse cx="124" cy="120" rx="6" ry="3.5" fill="#ff8fa3" opacity="0.55" />
        <ellipse cx="196" cy="120" rx="6" ry="3.5" fill="#ff8fa3" opacity="0.55" />

        {/* banner on strings */}
        {banner && (
        <g className="cd-banner">
          <path d="M140 150 L88 190 M180 150 L232 190" stroke="#8a96a2" strokeWidth="2" />
          <path d="M62 190 H258 L248 210 L258 230 H62 L72 210 Z" fill="#fff" stroke={accent} strokeWidth="3" strokeLinejoin="round" />
          <text x="160" y="217" textAnchor="middle" className="cd-banner-text">
            {text}
          </text>
        </g>
        )}
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
