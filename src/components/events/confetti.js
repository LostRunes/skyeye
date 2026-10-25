// A one-shot confetti burst on a full-screen canvas, removed when done.
// Skipped for visitors who prefer reduced motion.
const COLORS = ['#ff5a1f', '#ffb020', '#2563b8', '#6fb6ff', '#f2f0eb', '#111111']

export function confetti({ x = 0.5, y = 0.4, count = 140 } = {}) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const canvas = document.createElement('canvas')
  canvas.className = 'confetti-canvas'
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = innerWidth * dpr
  canvas.height = innerHeight * dpr
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const ox = innerWidth * x
  const oy = innerHeight * y
  const bits = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2
    const v = 6 + Math.random() * 9
    return {
      x: ox,
      y: oy,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 6,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      c: COLORS[(Math.random() * COLORS.length) | 0],
    }
  })

  const t0 = performance.now()
  const step = (now) => {
    const t = (now - t0) / 1000
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    for (const b of bits) {
      b.vy += 0.32
      b.vx *= 0.985
      b.x += b.vx
      b.y += b.vy
      b.r += b.vr
      ctx.save()
      ctx.globalAlpha = Math.max(1 - t / 2.6, 0)
      ctx.translate(b.x, b.y)
      ctx.rotate(b.r)
      ctx.fillStyle = b.c
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.r * 2)))
      ctx.restore()
    }
    if (t < 2.6) requestAnimationFrame(step)
    else canvas.remove()
  }
  requestAnimationFrame(step)
}
