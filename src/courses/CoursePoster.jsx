// Course posters for the carousel cards and the course detail. The AI & Data
// courses get illustrated, animated posters; the drone courses get their
// photo set into a poster with a solid colour panel. Everything is sized in
// container units (cqw), so one poster scales from a carousel card up to the
// detail column. Layers drift with --px / --py (the pointer, -1..1), set by
// whatever holds the poster.

const pad = (n) => String(n).padStart(2, '0')

// Generative AI: a small neural network with signals running through it
const NET = [
  [40, 4],
  [115, 5],
  [190, 4],
  [262, 2],
].map(([x, k]) => Array.from({ length: k }, (_, i) => [x, 20 + (160 / (k - 1)) * i]))
const EDGES = NET.slice(0, -1).flatMap((layer, l) => layer.flatMap((a) => NET[l + 1].map((b) => [a, b])))
const SIGNALS = [
  [0, 1, 2, 0],
  [1, 3, 1, 1],
  [2, 0, 3, 0],
  [3, 4, 2, 1],
  [1, 2, 0, 1],
].map((route) => 'M' + route.map((n, l) => NET[l][n].join(' ')).join(' L'))

function GenAiPoster({ c, i, total }) {
  return (
    <div className="cp cp-genai">
      <div className="cp-top">
        <span>Sky Eye · Live</span>
        <span>
          {pad(i + 1)}/{pad(total)}
        </span>
      </div>
      <div className="cp-title">
        Generative
        <br />
        <em>AI</em>
      </div>
      <svg className="cp-net" viewBox="0 0 300 200" aria-hidden="true">
        {EDGES.map(([a, b], k) => (
          <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
        ))}
        {SIGNALS.map((d, k) => (
          <circle key={k} r="3.4" className="sig">
            <animateMotion dur={`${2.6 + k * 0.7}s`} begin={`${-k * 0.9}s`} repeatCount="indefinite" path={d} />
          </circle>
        ))}
        {NET.flat().map(([x, y], k) => (
          <circle key={k} cx={x} cy={y} r="6.5" className="n" style={{ animationDelay: `${-k * 0.3}s` }} />
        ))}
      </svg>
      <div className="cp-chat">
        <span className="cp-type cp-type--1">› build an AI agent</span>
        <span className="cp-type cp-type--2">✓ plan · ✓ tools · ✓ done</span>
      </div>
      <div className="cp-foot">
        <span>LLMs → AI agents</span>
        <span>{c.level}</span>
      </div>
    </div>
  )
}

// Data Analytics: bars breathing, a trend line drawing itself, cells lighting up
const BARS = [60, 95, 72, 120, 88, 135, 110]
const POINTS = [100, 70, 86, 48, 64, 30, 44].map((y, k) => [32 + k * 38, y])

function DataPoster({ c, i, total }) {
  return (
    <div className="cp cp-data">
      <div className="cp-top">
        <span>Sky Eye · Live</span>
        <span>
          {pad(i + 1)}/{pad(total)}
        </span>
      </div>
      <div className="cp-title">
        Data
        <br />
        <em>Analytics</em>
      </div>
      <span className="cp-kpi">▲ +38%</span>
      <svg className="cp-chart" viewBox="0 0 300 160" aria-hidden="true">
        <g className="grid">
          {[30, 70, 110, 150].map((y) => (
            <line key={y} x1="10" x2="290" y1={y} y2={y} />
          ))}
        </g>
        <g>
          {BARS.map((h, k) => (
            <rect
              key={k}
              className="bar"
              x={20 + k * 38}
              y={150 - h}
              width="24"
              height={h}
              rx="3"
              style={{ animationDelay: `${-k * 0.45}s`, animationDuration: `${2.6 + (k % 3) * 0.5}s` }}
            />
          ))}
        </g>
        <polyline className="line" points={POINTS.map((p) => p.join(',')).join(' ')} />
        {POINTS.map(([x, y]) => (
          <circle key={x} className="dot" cx={x} cy={y} r="3.6" />
        ))}
      </svg>
      <div className="cp-cells" aria-hidden="true">
        {Array.from({ length: 10 }, (_, k) => (
          <span key={k} style={{ '--i': k }} />
        ))}
      </div>
      <div className="cp-foot">
        <span>Raw data → decisions</span>
        <span>{c.level}</span>
      </div>
    </div>
  )
}

// Drone courses: their photo with a flight HUD, over a solid colour panel
const PANEL = { 'drone-basic': '#b9653f', 'drone-advanced': '#2a2420', 'drone-fpv': '#9c7350' }

function DronePoster({ c, i, total }) {
  return (
    <div className="cp cp-drone" style={{ '--cp-panel': PANEL[c.id] || '#b9653f' }}>
      <div className="cp-photo">
        <img src={c.img} alt="" loading="lazy" draggable={false} />
        <svg className="cp-hud" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M4 16 V4 H16 M84 4 H96 V16 M96 84 V96 H84 M16 96 H4 V84" />
          <path d="M46 50 H54 M50 46 V54" />
        </svg>
        <svg className="cp-rotor" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="16" className="cp-spin" />
          <circle cx="20" cy="20" r="2.6" className="cp-hub" />
        </svg>
      </div>
      <div className="cp-top cp-top--chip">
        <span>Sky Eye · Drones</span>
        <span>
          {pad(i + 1)}/{pad(total)}
        </span>
      </div>
      <span className="cp-level">{c.level}</span>
      <div className="cp-panel">
        <strong>{c.short || c.title}</strong>
        <span>{c.audience}</span>
      </div>
      <span className="cp-num">{pad(i + 1)}</span>
    </div>
  )
}

export default function CoursePoster({ c, i, total }) {
  if (c.id === 'genai') return <GenAiPoster c={c} i={i} total={total} />
  if (c.id === 'data') return <DataPoster c={c} i={i} total={total} />
  return <DronePoster c={c} i={i} total={total} />
}
