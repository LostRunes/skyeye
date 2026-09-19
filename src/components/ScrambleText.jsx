import { useCallback, useEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const randomChar = () => CHARS[(Math.random() * CHARS.length) | 0]

/**
 * Reveals `text` character-by-character out of scrambled noise — each
 * position resolves on its own staggered delay rather than all at once, so
 * it reads left-to-right like a decode.
 *
 * trigger="view" (default) plays once, the first time it scrolls into view.
 * trigger="hover" starts plain and replays the scramble on every hover.
 */
export default function ScrambleText({
  text,
  as: Tag = 'span',
  className = '',
  duration = 500,
  stagger = 14,
  trigger = 'view',
}) {
  const { ref: viewRef, inView } = useInView(0.4)
  const [display, setDisplay] = useState(text)
  const startedRef = useRef(false)
  const rafRef = useRef(0)

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const play = useCallback(() => {
    if (reducedMotion()) {
      setDisplay(text)
      return
    }

    cancelAnimationFrame(rafRef.current)
    const start = performance.now()
    const total = text.length
    const runFor = total * stagger + duration

    const tick = (now) => {
      const elapsed = now - start
      let out = ''
      for (let i = 0; i < total; i++) {
        const ch = text[i]
        if (ch === ' ') {
          out += ' '
          continue
        }
        out += elapsed >= i * stagger + duration ? ch : randomChar()
      }
      setDisplay(out)

      if (elapsed < runFor) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(text)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [text, duration, stagger])

  useEffect(() => {
    if (trigger !== 'view' || !inView || startedRef.current) return
    startedRef.current = true
    play()
  }, [trigger, inView, play])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const hoverProps =
    trigger === 'hover'
      ? { onMouseEnter: play, onFocus: play }
      : {}

  return (
    <Tag ref={viewRef} className={className} aria-label={text} {...hoverProps}>
      {display}
    </Tag>
  )
}
