import { useEffect, useRef, useState } from 'react'

/**
 * Streams a numbered sequence of images (frame_0001.ext ... frame_NNNN.ext)
 * once `enabled` turns true, and reports aggregate progress. Nothing waits on
 * it: the arrays fill in place, and the consumer draws whatever has arrived.
 * Frames are requested in a coarse-to-fine order, so a usable spread of the
 * sequence exists long before every frame has landed.
 */
export function useImageSequence(sequences, enabled = true) {
  const [progress, setProgress] = useState(0)
  const imagesRef = useRef(null)
  if (!imagesRef.current) {
    imagesRef.current = Object.fromEntries(sequences.map((s) => [s.key, new Array(s.count).fill(null)]))
  }

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const total = sequences.reduce((sum, s) => sum + s.count, 0)
    let settled = 0
    const pad = (n) => String(n).padStart(4, '0')

    const order = (count) => {
      const seen = new Set()
      const out = []
      for (let step = 16; step >= 1; step = step >> 1) {
        for (let i = 0; i < count; i += step) {
          if (!seen.has(i)) {
            seen.add(i)
            out.push(i)
          }
        }
      }
      return out
    }

    sequences.forEach((s) => {
      order(s.count).forEach((i) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          if (cancelled) return
          imagesRef.current[s.key][i] = img
          settled += 1
          setProgress(settled / total)
        }
        img.onerror = () => {
          if (cancelled) return
          settled += 1
          setProgress(settled / total)
        }
        img.src = `${s.folder}/frame_${pad(i + 1)}.${s.ext ?? 'webp'}`
      })
    })

    return () => {
      cancelled = true
    }
    // sequences is a static config — intentionally not in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return { images: imagesRef.current, progress }
}
