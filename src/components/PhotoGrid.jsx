import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { brochureCrop, photo } from '../cdn'
import Scramble from './Scramble'

// Two 21st.dev patterns, joined:
// · "Tailwind Image Accordion" (ui layout) — the categories are tall photo
//   panels; the hovered one widens and reveals its title, clicking selects it.
// · "Shared Element Gallery" (Hossain Jahed) — a masonry that keeps every
//   photo's own proportions, where a tapped photo grows out of its tile into
//   a full-screen view over a frosted backdrop and can be dragged away.
const P = (cat, n, ratio, alt) => ({ id: `${cat}-${n}`, src: (tr) => photo(cat, n, tr), ratio, alt })
const B = (name, ratio, alt) => ({ id: `b-${name}`, src: (tr) => brochureCrop(name, tr), ratio, alt })

const CATEGORIES = [
  {
    key: 'field',
    num: '01',
    title: 'In the field',
    sub: 'Spraying, mapping, survey and inspection',
    cover: photo('agri', 131, 'w-900,h-1100,fo-auto,q-75'),
    photos: [
      P('agri', 141, 1.778, 'Spraying drone flying low over a wheat field'),
      P('agri', 131, 0.75, 'Spraying drone over a flowering mustard field'),
      P('survey', 237, 2.014, 'Aerial survey map with a colour overlay'),
      P('agri', 139, 1.333, 'Farmers gathered around a spraying drone in Sonipat'),
      P('survey', 189, 1.512, 'VTOL survey aircraft beside its ground station'),
      P('survey', 231, 0.883, 'Heavy-lift drone carrying an orange life buoy'),
      P('agri', 166, 1.333, 'Farmers and the Sky Eye team in a mustard field'),
      P('survey', 184, 1.778, 'Fixed-wing survey drone with its controller'),
      P('survey', 475, 1.25, 'Thermal image of a rooftop solar array'),
      P('agri', 133, 1.41, 'Blue-canopy agricultural hexacopter on dry soil'),
      P('survey', 236, 1.758, '3D model generated from a drone survey'),
      P('agri', 140, 1.333, 'Farmers with a spraying drone on a field road'),
      P('survey', 192, 1.778, 'Aerial view of apartment blocks and greenery'),
      P('survey', 243, 0.75, 'Hand-launching a fixed-wing survey drone'),
    ],
  },
  {
    key: 'lab',
    num: '02',
    title: 'In the lab',
    sub: 'R&D benches, airframes and drone labs',
    cover: photo('labs', 590, 'w-900,h-1100,fo-auto,q-75'),
    photos: [
      P('rnd', 264, 2.058, 'Custom multirotor with the Indian flag on the build bench'),
      P('labs', 590, 1.193, 'Drone frames, motors and props laid out in a lab'),
      P('rnd', 285, 1.333, 'Aeromodelling lab with suspended aircraft models'),
      P('labs', 588, 1.333, 'Large hexacopter on a lab bench'),
      P('rnd', 279, 0.75, 'Aeromodelling classroom with wall lettering'),
      P('rnd', 292, 1.844, 'Team presenting a VTOL airframe at an exhibition'),
      P('labs', 596, 1.778, 'Controllers, frames and propellers in a drone lab'),
      P('rnd', 256, 2.116, 'Heavy multirotor on a landing pad'),
      P('fpv', 97, 1.333, 'FPV racing quad on a wooden table'),
      P('rnd', 270, 1.336, 'Foam-wing trainer aircraft on a bench'),
      P('labs', 592, 1.193, 'Training benches with drone kits'),
      P('rnd', 283, 0.75, 'Lit quadcopter mounted on a wall'),
    ],
  },
  {
    key: 'classroom',
    num: '03',
    title: 'In the classroom',
    sub: 'Schools, universities, police and forces',
    cover: photo('course', 24, 'w-900,h-1100,fo-auto,q-75'),
    photos: [
      P('course', 24, 1.778, 'Speaker at the KIIT University podium during the AI workshop'),
      P('edu', 356, 1.333, 'School students holding drones they assembled'),
      P('govt', 569, 1.333, 'Police officers watching a live drone demonstration'),
      P('edu', 335, 0.75, 'Student soldering a drone frame on the bench'),
      P('edu', 344, 1.369, 'Students lined up outdoors for a flight demonstration'),
      P('edu', 325, 1.25, 'Army personnel at a "What is a drone" session'),
      P('course', 66, 1.778, 'Sky Eye team at KIIT University'),
      P('edu', 371, 1.501, 'Sky Eye team on stage with certificates at a startup awards ceremony'),
      P('edu', 330, 0.75, 'Student assembling a drone kit'),
      P('edu', 365, 1.337, 'Students at International Delhi Public School'),
      P('govt', 580, 1.333, 'Drone airborne during a police demonstration'),
      P('edu', 416, 1.775, 'Children with lit drones in a space-themed lab'),
      P('edu', 422, 1.333, 'Startup event delegation photo on a red carpet'),
    ],
  },
  {
    key: 'sky',
    num: '04',
    title: 'Skyvertising',
    sub: 'Banners and LED displays in the sky',
    cover: brochureCrop('led-net-logo', 'w-900,h-1100,fo-auto,q-75'),
    photos: [
      B('led-net-logo', 0.626, 'Drone flying an LED net with the Sky Eye logo at night'),
      B('sky-is-live', 0.922, 'LED "Sky is live" banner flown above a crowd'),
      B('flag-flight', 0.966, 'Drone flying the Indian national flag'),
      B('awareness', 0.833, 'Lit awareness banner flown at sunset'),
      B('your-ad-here', 0.816, 'Drone carrying a "Your ad here" banner'),
      B('phone-promo', 0.909, 'Illuminated phone-shaped promotional banner at night'),
      B('led-tower', 0.811, 'LED banner flown beside a lit residential tower'),
      B('banner-tow', 0.952, 'Hexacopter carrying a printed vertical banner'),
    ],
  },
  {
    key: 'aerial',
    num: '05',
    title: 'From the air',
    sub: 'Events, weddings, cities and FPV',
    cover: photo('aerial', 625, 'w-900,h-1100,fo-auto,q-75'),
    photos: [
      P('aerial', 625, 1.778, 'Aerial view of a decorated wedding stage at night'),
      P('aerial', 641, 1.778, 'City at night seen from a drone'),
      P('aerial', 434, 1.778, 'Forest waterfall from a drone during a pre-wedding shoot'),
      P('aerial', 648, 1.778, 'Construction site and highway from above'),
      P('fpv', 106, 1.333, 'FPV frame with yellow motor guards'),
      P('aerial', 620, 1.778, 'Bride walking under a floral arch, filmed from a drone'),
      P('aerial', 432, 1.778, 'Couple on a misty beach, filmed from above'),
      P('aerial', 665, 1.778, 'Hockey stadium from the air'),
    ],
  },
]

const ALL = CATEGORIES.flatMap((c) => c.photos)

const SPRING = { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 }
const EASE = [0.215, 0.61, 0.355, 1]

function Accordion({ active, onSelect }) {
  const [hover, setHover] = useState(null)
  const open = hover ?? active ?? CATEGORIES[0].key
  return (
    <div className="fg-accordion" role="tablist" aria-label="Photo categories" onMouseLeave={() => setHover(null)}>
      {CATEGORIES.map((c) => {
        const isOpen = open === c.key
        const isActive = active === c.key
        return (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`fg-panel${isOpen ? ' is-open' : ''}${isActive ? ' is-active' : ''}`}
            onMouseEnter={() => setHover(c.key)}
            onFocus={() => setHover(c.key)}
            onClick={() => onSelect(c.key)}
          >
            <img src={c.cover} alt="" loading="lazy" />
            <span className="fg-panel-shade" aria-hidden="true" />
            <span className="fg-panel-num">{c.num}</span>
            <span className="fg-panel-vertical" aria-hidden="true">{c.title}</span>
            <span className="fg-panel-body">
              <span className="fg-panel-title">
                <Scramble text={c.title} replay={isOpen ? 1 : 0} duration={460} />
              </span>
              <span className="fg-panel-sub">{c.sub}</span>
              <span className="fg-panel-count">
                {c.photos.length} photos {isActive ? '· showing' : '· view →'}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Viewer({ items, index, originId, onClose, onStep }) {
  const item = items[index]
  const reduce = useReducedMotion()

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onStep(1)
      if (e.key === 'ArrowLeft') onStep(-1)
    }
    document.documentElement.classList.add('menu-locked')
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.classList.remove('menu-locked')
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, onStep])

  return (
    <motion.div
      className="fg-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={item.alt}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      onClick={onClose}
    >
      <motion.figure
        key={item.id}
        className="fg-viewer-figure"
        // Only the photo that was tapped grows out of its tile; stepping
        // through the rest cross-fades instead of flying in from the grid.
        layoutId={!reduce && item.id === originId ? `fg-${item.id}` : undefined}
        initial={item.id === originId ? undefined : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={item.id === originId ? undefined : { opacity: 0 }}
        transition={SPRING}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.6}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.y) > 120 || Math.abs(info.velocity.y) > 700) onClose()
        }}
        onClick={(e) => e.stopPropagation()}
        style={{ aspectRatio: item.ratio }}
      >
        <img src={item.src('w-1800,q-80')} alt={item.alt} draggable={false} />
      </motion.figure>
      <div className="fg-viewer-bar" onClick={(e) => e.stopPropagation()}>
        <span>{item.alt}</span>
        <span>
          {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')} · drag to close
        </span>
      </div>
      <button type="button" className="fg-viewer-btn fg-viewer-prev" onClick={(e) => { e.stopPropagation(); onStep(-1) }} aria-label="Previous photo">
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
      <button type="button" className="fg-viewer-btn fg-viewer-next" onClick={(e) => { e.stopPropagation(); onStep(1) }} aria-label="Next photo">
        <span className="material-symbols-outlined">arrow_forward</span>
      </button>
      <button type="button" className="fg-viewer-btn fg-viewer-close" onClick={onClose} aria-label="Close">
        <span className="material-symbols-outlined">close</span>
      </button>
    </motion.div>
  )
}

export default function PhotoGrid() {
  const [active, setActive] = useState('field')
  const [showAll, setShowAll] = useState(false)
  const [open, setOpen] = useState(-1)
  const [originId, setOriginId] = useState(null)
  const reduce = useReducedMotion()

  const items = useMemo(() => (showAll ? ALL : CATEGORIES.find((c) => c.key === active).photos), [active, showAll])
  const current = CATEGORIES.find((c) => c.key === active)

  const select = (key) => {
    setActive(key)
    setShowAll(false)
  }
  const close = useCallback(() => setOpen(-1), [])
  const step = useCallback((d) => setOpen((i) => (i + d + items.length) % items.length), [items.length])

  return (
    <section className="section-grid" id="photos" aria-label="Photo gallery">
      <div className="container py-2xl">
        <div className="fg-head">
          <div>
            <span className="section-label">07.1 / PHOTOGRAPHS</span>
            <h3 className="sky-h3 fg-title">From the field, the lab and the classroom.</h3>
          </div>
          <button type="button" className={`fg-all${showAll ? ' is-on' : ''}`} onClick={() => setShowAll((s) => !s)} aria-pressed={showAll}>
            {showAll ? `Showing all ${ALL.length}` : `View all ${ALL.length} photos`}
          </button>
        </div>

        <Accordion active={showAll ? null : active} onSelect={select} />

        <div className="fg-caption">
          <span>{showAll ? 'ALL PHOTOGRAPHS' : `${current.num} / ${current.title.toUpperCase()}`}</span>
          <span>{items.length} PHOTOS · TAP TO OPEN</span>
        </div>

        <LayoutGroup>
          <div className="fg-masonry">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((p, i) => (
                <motion.button
                  key={p.id}
                  type="button"
                  className="fg-tile"
                  layoutId={reduce ? undefined : `fg-${p.id}`}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(i, 12) * 0.03, duration: 0.45, ease: EASE } }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                  transition={SPRING}
                  style={{ aspectRatio: p.ratio }}
                  onClick={() => {
                    setOriginId(p.id)
                    setOpen(i)
                  }}
                  aria-label={`Open photo: ${p.alt}`}
                >
                  <img src={p.src(`w-${p.ratio < 1 ? 520 : 760},q-72`)} alt={p.alt} loading="lazy" draggable={false} />
                  <span className="fg-tile-cap" aria-hidden="true">{p.alt}</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {open >= 0 && items[open] && <Viewer key="viewer" items={items} index={open} originId={originId} onClose={close} onStep={step} />}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
  )
}
