import { useEffect, useRef, useState } from 'react'

// A still image that turns into its video: on hover over the surrounding
// card (`trigger`, a selector for the closest ancestor; defaults to the
// media box itself) the clip fades in over the still and plays, and pauses
// when the pointer leaves. The video isn't downloaded until the first hover.
// On touch screens it plays while the card is mostly on screen instead.
// Reduced-motion visitors only ever see the still.
export default function HoverVideo({ img, video, alt, trigger, loading = 'lazy' }) {
  const boxRef = useRef(null)
  const videoRef = useRef(null)
  const [armed, setArmed] = useState(false) // src attached
  const [on, setOn] = useState(false)

  useEffect(() => {
    const box = boxRef.current
    if (!box || !video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const target = (trigger && box.closest(trigger)) || box

    const play = () => {
      setArmed(true)
      setOn(true)
    }
    const stop = () => setOn(false)

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      target.addEventListener('pointerenter', play)
      target.addEventListener('pointerleave', stop)
      target.addEventListener('focusin', play)
      target.addEventListener('focusout', stop)
      return () => {
        target.removeEventListener('pointerenter', play)
        target.removeEventListener('pointerleave', stop)
        target.removeEventListener('focusin', play)
        target.removeEventListener('focusout', stop)
      }
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : stop()), { threshold: 0.6 })
    io.observe(box)
    return () => io.disconnect()
  }, [video, trigger])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !armed) return
    if (on) v.play().catch(() => {})
    else v.pause()
  }, [on, armed])

  return (
    <span className={`hover-video${on ? ' is-playing' : ''}`} ref={boxRef}>
      <img src={img} alt={alt} loading={loading} />
      {video && (
        <video
          ref={videoRef}
          src={armed ? video : undefined}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
    </span>
  )
}
