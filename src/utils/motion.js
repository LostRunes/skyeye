export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v))

export const lerp = (a, b, t) => a + (b - a) * t

export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/**
 * Evaluates a piecewise-linear curve through `keyframes` ([{ p, v }, ...],
 * sorted by p) at position `p`, easing each segment with smoothstep so
 * motion accelerates/decelerates instead of moving at constant speed.
 */
export function piecewise(p, keyframes) {
  if (p <= keyframes[0].p) return keyframes[0].v
  const last = keyframes[keyframes.length - 1]
  if (p >= last.p) return last.v

  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i]
    const b = keyframes[i + 1]
    if (p >= a.p && p <= b.p) {
      if (a.p === b.p) return b.v
      const t = smoothstep(a.p, b.p, p)
      return lerp(a.v, b.v, t)
    }
  }
  return last.v
}

/**
 * Visibility + motion for a text beat tied to a progress range: fades/slides
 * in over `fade` at the start, holds, then fades/slides out over `fade` at
 * the end.
 */
export function beatVisibility(progress, [start, end], fade = 0.06) {
  const inT = smoothstep(start, start + fade, progress)
  const outT = smoothstep(end - fade, end, progress)
  const opacity = inT * (1 - outT)
  const translate = (1 - inT) * 18 + outT * -18
  return { opacity, translate }
}
