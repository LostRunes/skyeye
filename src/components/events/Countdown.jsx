import { useEffect, useState } from 'react'

// Live countdown to an event; switches to "happening now" during it and
// "that's a wrap" afterwards.
const pad = (n) => String(n).padStart(2, '0')

export default function Countdown({ start, end, days = 3 }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const s = new Date(start).getTime()
  const e = new Date(end).getTime()

  if (now >= e) return <p className="countdown-state">That’s a wrap — thanks for coming!</p>
  if (now >= s) {
    const day = Math.min(Math.floor((now - s) / 86400000) + 1, days)
    return (
      <p className="countdown-state countdown-state--live">
        <span className="event-dot" aria-hidden="true" /> Happening now · Day {day} of {days}
      </p>
    )
  }

  const left = Math.max(s - now, 0)
  const parts = [
    ['Days', Math.floor(left / 86400000)],
    ['Hours', Math.floor(left / 3600000) % 24],
    ['Mins', Math.floor(left / 60000) % 60],
    ['Secs', Math.floor(left / 1000) % 60],
  ]
  return (
    <div className="countdown" role="timer" aria-label={`Starts in ${parts.map(([l, v]) => `${v} ${l}`).join(', ')}`}>
      {parts.map(([label, v]) => (
        <div key={label} className="countdown-cell">
          <span key={v} className="countdown-num">
            {pad(v)}
          </span>
          <span className="countdown-label">{label}</span>
        </div>
      ))}
    </div>
  )
}
