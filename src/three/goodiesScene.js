import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// The KIIT MUN stall prizes on a product turntable. Every goodie is built in
// code (no model files) with its print drawn on canvas textures: the Sky Eye
// mark is loaded once, tinted per surface, and every print is redrawn when it
// (and the brand font) arrive — until then the prints are text only.
//
// One goodie sits on the turntable at a time, idling with a slow spin. Drag to
// throw it around freely; it coasts, then eases back upright onto the idle
// spin. goTo / next / prev swoosh the current goodie out one side (spinning,
// leaning, trailing speed lines) while the next one flies in from the other.

const LOGO_URL = 'https://ik.imagekit.io/hiesc7f4v/skyeye/site/logo-mark.png?tr=h-256'
const FONT = "'Geist', 'Space Grotesk', system-ui, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"
const ORANGE = '#ff5a1f'
const AMBER = '#ffb020'
const INK = '#111214'

const IDLE_SPIN = 0.45 // rad/s
const DRAG_SPEED = 0.0095 // rad per pixel
const SWOOSH = 1.05 // seconds for a full swap

const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt))
const clamp01 = (v) => Math.min(Math.max(v, 0), 1)
const easeInCubic = (t) => t * t * t
const easeOutCubic = (t) => 1 - (1 - t) ** 3
const easeOutBack = (t, s = 1.25) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2

// ---------------------------------------------------------------------------
// Canvas prints

/** A CanvasTexture whose `draw(g, w, h, logo)` is re-run whenever the logo or fonts arrive. */
function makePrint(ctx, w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const redraw = () => {
    g.clearRect(0, 0, w, h)
    draw(g, w, h, ctx.logo)
    tex.needsUpdate = true
  }
  redraw()
  ctx.prints.push(redraw)
  return tex
}

/** The mark recoloured to `color` (cached per colour). */
function tintedLogo(logo, color) {
  if (!logo) return null
  logo.tints ||= {}
  if (logo.tints[color]) return logo.tints[color]
  const c = document.createElement('canvas')
  c.width = logo.img.naturalWidth
  c.height = logo.img.naturalHeight
  const g = c.getContext('2d')
  g.drawImage(logo.img, 0, 0)
  g.globalCompositeOperation = 'source-in'
  g.fillStyle = color
  g.fillRect(0, 0, c.width, c.height)
  logo.tints[color] = c
  return c
}

/** Draw the mark centred on (cx, cy) at height h; returns false if it isn't loaded. */
function drawMark(g, logo, color, cx, cy, h) {
  const img = tintedLogo(logo, color)
  if (!img) return false
  const w = h * (img.width / img.height)
  g.drawImage(img, cx - w / 2, cy - h / 2, w, h)
  return true
}

function spaced(g, text, x, y, spacing, align = 'center') {
  g.letterSpacing = `${spacing}px`
  g.textAlign = align
  g.fillText(text, x, y)
  g.letterSpacing = '0px'
}

function roundRectPath(g, x, y, w, h, r) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}

// A quadcopter seen from above, as line art (card background, sticker icon).
function droneIcon(g, cx, cy, s, color, lw) {
  g.save()
  g.translate(cx, cy)
  g.strokeStyle = color
  g.fillStyle = color
  g.lineWidth = lw
  g.lineCap = 'round'
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4]) {
    g.beginPath()
    g.moveTo(Math.cos(a) * s * 0.62, Math.sin(a) * s * 0.62)
    g.lineTo(-Math.cos(a) * s * 0.62, -Math.sin(a) * s * 0.62)
    g.stroke()
  }
  for (const [x, y] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    g.beginPath()
    g.arc(x * s * 0.62, y * s * 0.62, s * 0.34, 0, Math.PI * 2)
    g.stroke()
    g.beginPath()
    g.arc(x * s * 0.62, y * s * 0.62, s * 0.06, 0, Math.PI * 2)
    g.fill()
  }
  roundRectPath(g, -s * 0.22, -s * 0.28, s * 0.44, s * 0.56, s * 0.12)
  g.fill()
  g.restore()
}

// ---------------------------------------------------------------------------
// Geometry helpers

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

/** ShapeGeometry UVs are raw x/y; remap them to 0..1 over the shape's bounds. */
function fitUVs(geo) {
  geo.computeBoundingBox()
  const { min, max } = geo.boundingBox
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - min.x) / (max.x - min.x), (pos.getY(i) - min.y) / (max.y - min.y))
  }
  uv.needsUpdate = true
  return geo
}

/** A printed band wrapped round a cylinder, centred on the side facing +z (or -z with back). */
function wrapBand(radius, height, arc, y, map, back = false) {
  const geo = new THREE.CylinderGeometry(radius, radius, height, 48, 1, true, (back ? Math.PI : 0) - arc / 2, arc)
  const mat = new THREE.MeshPhysicalMaterial({ map, transparent: true, roughness: 0.25, clearcoat: 0.6, polygonOffset: true, polygonOffsetFactor: -2 })
  const m = new THREE.Mesh(geo, mat)
  m.position.y = y
  return m
}

// ---------------------------------------------------------------------------
// The goodies. Each returns a group with its base on y = 0, about 1.9 tall
// at most, plus how it should sit: `float` items hover above the turntable.

function buildMug(ctx) {
  const group = new THREE.Group()
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf6f4f0, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06 })
  const glaze = new THREE.MeshPhysicalMaterial({ color: 0xff5a1f, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide })

  const R = 0.56
  const H = 1.2
  // Outer wall, rolled lip and foot ring, in one lathe profile
  const outer = [
    new THREE.Vector2(0, 0.012),
    new THREE.Vector2(R - 0.07, 0.012),
    new THREE.Vector2(R - 0.035, 0),
    new THREE.Vector2(R - 0.012, 0.02),
    new THREE.Vector2(R - 0.003, 0.06),
  ]
  for (let i = 0; i <= 12; i++) outer.push(new THREE.Vector2(R + Math.sin((i / 12) * Math.PI) * 0.006, 0.06 + (i / 12) * (H - 0.09)))
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * Math.PI
    outer.push(new THREE.Vector2(R - 0.026 + Math.cos(a) * 0.026, H - 0.03 + Math.sin(a) * 0.03))
  }
  group.add(new THREE.Mesh(new THREE.LatheGeometry(outer, 96), ceramic))
  // Glazed interior: inner wall down to a rounded floor
  const inner = []
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2)
    inner.push(new THREE.Vector2(Math.sin(a) * 0.1 + (R - 0.152) * (i / 10), 0.1 + (1 - Math.cos(a)) * 0.05))
  }
  inner.push(new THREE.Vector2(R - 0.052, 0.3), new THREE.Vector2(R - 0.052, H - 0.03))
  inner[0].x = 0
  group.add(new THREE.Mesh(new THREE.LatheGeometry(inner, 96), glaze))

  // D-shaped handle swept along a curve on the +x side
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(R - 0.03, 0.98, 0),
    new THREE.Vector3(R + 0.22, 0.99, 0),
    new THREE.Vector3(R + 0.36, 0.82, 0),
    new THREE.Vector3(R + 0.36, 0.48, 0),
    new THREE.Vector3(R + 0.2, 0.3, 0),
    new THREE.Vector3(R - 0.03, 0.28, 0),
  ])
  const handle = new THREE.Mesh(new THREE.TubeGeometry(path, 64, 0.058, 20, false), ceramic)
  handle.scale.z = 0.8
  group.add(handle)

  // Prints: the logo lock-up on the front, the big mark on the back, an orange rim stripe
  const front = makePrint(ctx, 1024, 640, (g, w, h, logo) => {
    const has = drawMark(g, logo, INK, w / 2, 190, 230)
    g.fillStyle = INK
    g.font = `800 ${has ? 128 : 170}px ${FONT}`
    spaced(g, 'SKY EYE', w / 2, has ? 450 : 380, -2)
    g.fillStyle = ORANGE
    g.font = `700 56px ${MONO}`
    spaced(g, 'TECHNOLOGY', w / 2, has ? 530 : 470, 20)
  })
  group.add(wrapBand(R + 0.007, 0.66, 1.75, 0.6, front))
  const back = makePrint(ctx, 1024, 640, (g, w, h, logo) => {
    if (!drawMark(g, logo, ORANGE, w / 2, h / 2 - 30, 360)) {
      g.fillStyle = ORANGE
      g.font = `800 150px ${FONT}`
      spaced(g, 'SE', w / 2, h / 2 + 30, 0)
    }
    g.fillStyle = INK
    g.font = `600 40px ${MONO}`
    spaced(g, 'UNFOLDING THE UNFILTERED', w / 2, h - 60, 6)
  })
  group.add(wrapBand(R + 0.007, 0.66, 1.75, 0.6, back, true))
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.008, R + 0.008, 0.05, 96, 1, true), glaze)
  stripe.position.y = H - 0.13
  group.add(stripe)

  group.position.x = -0.12 // centre the mug + handle on the turntable
  return { group, shadow: 1.25 }
}

function buildBottle(ctx) {
  const group = new THREE.Group()
  const coat = new THREE.MeshPhysicalMaterial({ color: 0xff5a1f, roughness: 0.42, metalness: 0.15, clearcoat: 0.5, clearcoatRoughness: 0.3 })
  const steel = new THREE.MeshStandardMaterial({ color: 0xd4d8dc, roughness: 0.18, metalness: 1 })
  const black = new THREE.MeshPhysicalMaterial({ color: 0x141518, roughness: 0.35, metalness: 0.3, clearcoat: 0.6 })

  const R = 0.37
  // Steel base ring, powder-coated body, curved shoulder up to a steel neck
  const base = [new THREE.Vector2(0, 0), new THREE.Vector2(R - 0.04, 0), new THREE.Vector2(R - 0.005, 0.02), new THREE.Vector2(R, 0.06), new THREE.Vector2(R, 0.13)]
  group.add(new THREE.Mesh(new THREE.LatheGeometry(base, 80), steel))
  const body = [new THREE.Vector2(R, 0.13), new THREE.Vector2(R, 1.22)]
  for (let i = 1; i <= 14; i++) {
    const t = i / 14
    body.push(new THREE.Vector2(R - (R - 0.2) * (1 - Math.cos((t * Math.PI) / 2)) ** 0.9, 1.22 + Math.sin((t * Math.PI) / 2) * 0.3))
  }
  group.add(new THREE.Mesh(new THREE.LatheGeometry(body, 80), coat))
  const neck = [new THREE.Vector2(0.2, 1.51), new THREE.Vector2(0.205, 1.53), new THREE.Vector2(0.205, 1.58), new THREE.Vector2(0.19, 1.59)]
  group.add(new THREE.Mesh(new THREE.LatheGeometry(neck, 64), steel))

  // Cap: rounded black cylinder with a steel carry loop
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.22, 64), black)
  cap.position.y = 1.7
  group.add(cap)
  const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.215, 64, 12, 0, Math.PI * 2, 0, Math.PI / 2), black)
  capTop.scale.y = 0.18
  capTop.position.y = 1.81
  group.add(capTop)
  for (let i = 0; i < 24; i++) {
    // knurled grip ridges
    const a = (i / 24) * Math.PI * 2
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.02), black)
    r.position.set(Math.cos(a) * 0.216, 1.7, Math.sin(a) * 0.216)
    r.rotation.y = -a
    group.add(r)
  }
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 14, 48, Math.PI), steel)
  loop.position.y = 1.83
  group.add(loop)

  const print = makePrint(ctx, 512, 720, (g, w, h, logo) => {
    const has = drawMark(g, logo, '#ffffff', w / 2, 150, 130)
    g.fillStyle = '#ffffff'
    g.font = `800 ${has ? 96 : 110}px ${FONT}`
    spaced(g, 'SKY', w / 2, has ? 330 : 280, -1)
    spaced(g, 'EYE', w / 2, has ? 430 : 390, -1)
    g.fillStyle = INK
    g.font = `700 30px ${MONO}`
    spaced(g, 'TECHNOLOGY', w / 2, has ? 500 : 470, 10)
    g.fillStyle = 'rgba(255,255,255,0.85)'
    g.fillRect(w / 2 - 60, 560, 120, 4)
    g.font = `500 22px ${MONO}`
    spaced(g, 'STAY HYDRATED. FLY HIGH.', w / 2, 610, 2)
  })
  group.add(wrapBand(R + 0.004, 0.94, 1.9, 0.68, print))
  return { group, shadow: 0.85 }
}

function buildKeychain(ctx) {
  const group = new THREE.Group()
  const steel = new THREE.MeshStandardMaterial({ color: 0xe0e3e6, roughness: 0.14, metalness: 1 })
  const anodised = new THREE.MeshPhysicalMaterial({ color: 0xff5a1f, roughness: 0.28, metalness: 0.75, clearcoat: 0.6 })

  // Tag: rounded plate with a hole, orange anodised edges, printed black faces
  const TW = 0.78
  const TH = 1.04
  const shape = roundedRectShape(TW, TH, 0.18)
  const hole = new THREE.Path()
  hole.absarc(0, TH / 2 - 0.13, 0.065, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const tagGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 3, curveSegments: 24 })
  tagGeo.translate(0, 0, -0.025)
  const tag = new THREE.Group()
  tag.add(new THREE.Mesh(tagGeo, anodised))
  const frontTex = makePrint(ctx, 600, 800, (g, w, h, logo) => {
    g.fillStyle = '#16171a'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(255,176,32,0.55)'
    g.lineWidth = 4
    roundRectPath(g, 26, 26, w - 52, h - 52, 110)
    g.stroke()
    const has = drawMark(g, logo, ORANGE, w / 2, 340, 150)
    g.fillStyle = '#ffffff'
    g.font = `800 ${has ? 92 : 110}px ${FONT}`
    spaced(g, 'SKY EYE', w / 2, has ? 530 : 430, -1)
    g.fillStyle = AMBER
    g.font = `600 30px ${MONO}`
    spaced(g, 'TECHNOLOGY', w / 2, has ? 600 : 510, 10)
  })
  const backTex = makePrint(ctx, 600, 800, (g, w, h) => {
    g.fillStyle = '#16171a'
    g.fillRect(0, 0, w, h)
    droneIcon(g, w / 2, 420, 150, ORANGE, 14)
    g.fillStyle = 'rgba(255,255,255,0.7)'
    g.font = `600 30px ${MONO}`
    spaced(g, 'BHUBANESWAR · ODISHA', w / 2, 680, 4)
  })
  const faceGeo = fitUVs(new THREE.ShapeGeometry(shape, 24))
  const face = new THREE.Mesh(faceGeo, new THREE.MeshPhysicalMaterial({ map: frontTex, roughness: 0.3, metalness: 0.4, clearcoat: 1 }))
  face.position.z = 0.0395
  tag.add(face)
  const backFace = new THREE.Mesh(faceGeo, new THREE.MeshPhysicalMaterial({ map: backTex, roughness: 0.3, metalness: 0.4, clearcoat: 1 }))
  backFace.position.z = -0.0395
  backFace.rotation.y = Math.PI // turned round, so its print reads the right way from behind
  tag.add(backFace)
  tag.position.y = 0.55
  tag.rotation.z = 0.05
  group.add(tag)

  // Split key ring (two offset turns) facing out, joined to the tag by a jump
  // ring through its hole; the drone charm hangs off the ring's side
  const holeY = tag.position.y + TH / 2 - 0.13
  const link = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.014, 12, 40), steel)
  link.position.set(-0.006, holeY + 0.026, 0)
  link.rotation.y = Math.PI / 2
  group.add(link)
  const RR = 0.25
  const ringY = holeY + 0.1 + RR - 0.02
  const ring = new THREE.Mesh(new THREE.TorusGeometry(RR, 0.024, 16, 80), steel)
  ring.position.set(0, ringY, -0.016)
  group.add(ring)
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(RR, 0.024, 16, 80, Math.PI * 1.7), steel)
  ring2.position.set(0, ringY, 0.03)
  ring2.rotation.z = -1.2
  group.add(ring2)

  const charm = new THREE.Group()
  const add = (geo, x, y, rz = 0) => {
    const m = new THREE.Mesh(geo, anodised)
    m.position.set(x, y, 0)
    m.rotation.z = rz
    charm.add(m)
    return m
  }
  add(new RoundedBoxGeometry(0.15, 0.2, 0.05, 3, 0.02), 0, 0)
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    add(new RoundedBoxGeometry(0.2, 0.035, 0.03, 2, 0.012), sx * 0.08, sy * 0.08, Math.atan2(sy, sx))
    add(new THREE.TorusGeometry(0.07, 0.014, 10, 32), sx * 0.15, sy * 0.15)
    add(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 12), sx * 0.15, sy * 0.15).rotation.x = Math.PI / 2
  }
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 10, 24), steel)
  eye.position.y = 0.2
  charm.add(eye)
  const a = 0.95 // where on the ring it hangs, from the bottom towards +x
  const hang = new THREE.Vector3(Math.sin(a) * RR, ringY - Math.cos(a) * RR, 0)
  const jump = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.011, 10, 28), steel)
  jump.position.set(hang.x + 0.01, hang.y - 0.03, 0.01)
  jump.rotation.set(0, Math.PI / 2, a * 0.6)
  group.add(jump)
  charm.scale.setScalar(1.15)
  charm.position.set(hang.x + 0.12, hang.y - 0.32, 0.08)
  charm.rotation.set(0.05, -0.35, 0.3)
  group.add(charm)

  return { group, float: 0.12, shadow: 0.75 }
}

function buildCard(ctx) {
  const group = new THREE.Group()
  const W = 1.71
  const H = 1.08
  const shape = roundedRectShape(W, H, 0.07)
  const pvc = new THREE.MeshPhysicalMaterial({ color: 0xf2f0eb, roughness: 0.3, clearcoat: 1 })
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.016, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 12 })
  bodyGeo.translate(0, 0, -0.008)
  group.add(new THREE.Mesh(bodyGeo, pvc))

  const CW = 1024
  const CH = 646
  const toLocal = (cx, cy) => [(cx / CW - 0.5) * W, (0.5 - cy / CH) * H]

  const front = makePrint(ctx, CW, CH, (g, w, h, logo) => {
    const bg = g.createLinearGradient(0, 0, w, h)
    bg.addColorStop(0, '#121317')
    bg.addColorStop(1, '#1e1f25')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    // contour lines + a faint drone, then the orange sweep
    g.strokeStyle = 'rgba(255,255,255,0.045)'
    g.lineWidth = 2
    for (let i = 0; i < 9; i++) {
      g.beginPath()
      g.ellipse(w * 0.62, h * 0.55, 120 + i * 48, 70 + i * 30, -0.3, 0, Math.PI * 2)
      g.stroke()
    }
    droneIcon(g, w * 0.55, h * 0.52, 120, 'rgba(255,255,255,0.05)', 8)
    const sweep = g.createLinearGradient(0, h, w, h * 0.6)
    sweep.addColorStop(0, ORANGE)
    sweep.addColorStop(1, AMBER)
    g.fillStyle = sweep
    g.beginPath()
    g.moveTo(0, h)
    g.lineTo(0, h - 46)
    g.bezierCurveTo(w * 0.35, h - 10, w * 0.7, h - 120, w, h - 190)
    g.lineTo(w, h)
    g.fill()
    // header
    const has = drawMark(g, logo, ORANGE, 104, 78, 58)
    g.textAlign = 'left'
    g.fillStyle = '#ffffff'
    g.font = `800 40px ${FONT}`
    spaced(g, 'SKY EYE', has ? 172 : 56, 80, 0, 'left')
    g.fillStyle = 'rgba(255,255,255,0.6)'
    g.font = `600 17px ${MONO}`
    spaced(g, 'TECHNOLOGY', has ? 174 : 58, 106, 7, 'left')
    g.fillStyle = ORANGE
    g.font = `800 44px ${FONT}`
    spaced(g, 'PILOT CARD', w - 56, 86, 1, 'right')
    g.fillStyle = 'rgba(255,255,255,0.5)'
    g.font = `500 16px ${MONO}`
    spaced(g, 'REMOTE PILOT · RPAS', w - 58, 114, 3, 'right')
    // photo
    const pg = g.createLinearGradient(0, 190, 0, 420)
    pg.addColorStop(0, '#3a3c44')
    pg.addColorStop(1, '#25262c')
    g.fillStyle = pg
    roundRectPath(g, 790, 172, 178, 222, 18)
    g.fill()
    g.save()
    g.clip()
    g.fillStyle = '#5b5e68'
    g.beginPath()
    g.arc(879, 262, 44, 0, Math.PI * 2)
    g.fill()
    g.beginPath()
    g.ellipse(879, 400, 82, 74, 0, Math.PI, 0)
    g.fill()
    g.restore()
    // name + details
    g.fillStyle = 'rgba(255,255,255,0.45)'
    g.font = `500 17px ${MONO}`
    spaced(g, 'NAME', 58, 368, 4, 'left')
    g.fillStyle = '#ffffff'
    g.font = `700 54px ${FONT}`
    spaced(g, 'YOUR NAME', 56, 424, 0, 'left')
    g.fillStyle = 'rgba(255,255,255,0.18)'
    g.fillRect(58, 444, 620, 2)
    g.fillStyle = 'rgba(255,255,255,0.45)'
    g.font = `500 17px ${MONO}`
    spaced(g, 'PILOT ID', 58, 488, 4, 'left')
    spaced(g, 'CLASS', 330, 488, 4, 'left')
    g.fillStyle = '#ffffff'
    g.font = `600 24px ${MONO}`
    spaced(g, 'SE-2026-0001', 58, 520, 1, 'left')
    spaced(g, 'SMALL · VLOS', 330, 520, 1, 'left')
  })
  const faceGeo = fitUVs(new THREE.ShapeGeometry(shape, 12))
  const face = new THREE.Mesh(faceGeo, new THREE.MeshPhysicalMaterial({ map: front, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 }))
  face.position.z = 0.0125
  group.add(face)

  const back = makePrint(ctx, CW, CH, (g, w, h, logo) => {
    const bg = g.createLinearGradient(0, 0, w, h)
    bg.addColorStop(0, ORANGE)
    bg.addColorStop(1, '#ff8a1f')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#18191c'
    g.fillRect(0, 54, w, 96) // magnetic stripe
    const has = drawMark(g, logo, '#ffffff', w / 2, 330, 150)
    g.fillStyle = '#ffffff'
    g.font = `800 52px ${FONT}`
    spaced(g, 'SKY EYE TECHNOLOGY', w / 2, has ? 480 : 360, 2)
    g.fillStyle = 'rgba(17,18,20,0.75)'
    g.font = `600 20px ${MONO}`
    spaced(g, 'UNFOLDING THE UNFILTERED', w / 2, has ? 530 : 410, 6)
    g.fillStyle = 'rgba(255,255,255,0.8)'
    g.font = `500 16px ${MONO}`
    spaced(g, 'IF FOUND, RETURN TO SKY EYE TECHNOLOGY · BHUBANESWAR', w / 2, h - 40, 2)
  })
  const backFace = new THREE.Mesh(faceGeo, new THREE.MeshPhysicalMaterial({ map: back, roughness: 0.28, clearcoat: 1 }))
  backFace.position.z = -0.0125
  backFace.rotation.y = Math.PI
  group.add(backFace)

  // EMV-style gold chip, and an iridescent hologram patch that shifts as it turns
  const chipTex = makePrint(ctx, 256, 200, (g, w, h) => {
    const gold = g.createLinearGradient(0, 0, w, h)
    gold.addColorStop(0, '#f3d68a')
    gold.addColorStop(0.5, '#c99a3b')
    gold.addColorStop(1, '#f0cf7c')
    g.fillStyle = gold
    g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(90,60,10,0.55)'
    g.lineWidth = 5
    g.strokeRect(w * 0.36, h * 0.28, w * 0.28, h * 0.44)
    for (const y of [h * 0.28, h * 0.5, h * 0.72]) {
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(w * 0.36, y)
      g.moveTo(w * 0.64, y)
      g.lineTo(w, y)
      g.stroke()
    }
    g.beginPath()
    g.moveTo(w / 2, 0)
    g.lineTo(w / 2, h * 0.28)
    g.moveTo(w / 2, h * 0.72)
    g.lineTo(w / 2, h)
    g.stroke()
  })
  const [chx, chy] = toLocal(118, 250)
  const chipGeo = fitUVs(new THREE.ShapeGeometry(roundedRectShape(0.2, 0.156, 0.03), 6))
  const chip = new THREE.Mesh(chipGeo, new THREE.MeshPhysicalMaterial({ map: chipTex, metalness: 0.85, roughness: 0.28, clearcoat: 0.4 }))
  chip.position.set(chx, chy, 0.0135)
  group.add(chip)
  const [hx, hy] = toLocal(880, 470)
  const holo = new THREE.Mesh(
    fitUVs(new THREE.ShapeGeometry(roundedRectShape(0.27, 0.13, 0.025), 6)),
    new THREE.MeshPhysicalMaterial({ color: 0xdfe6ff, metalness: 1, roughness: 0.18, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [200, 900] })
  )
  holo.position.set(hx, hy, 0.0135)
  group.add(holo)

  group.rotation.set(-0.06, 0, 0.06)
  group.position.y = H / 2 + 0.16
  return { group, float: 0.14, shadow: 0.9 }
}

function buildStickers(ctx) {
  const group = new THREE.Group()
  const paper = new THREE.MeshPhysicalMaterial({ color: 0xfbfaf7, roughness: 0.5, clearcoat: 0.3 })

  // A die-cut sticker: white backing cut with a margin, printed vinyl face on top
  const sticker = (shapeAt, map) => {
    const s = new THREE.Group()
    const geo = new THREE.ExtrudeGeometry(shapeAt(0.045), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1, curveSegments: 32 })
    geo.translate(0, 0, -0.006)
    s.add(new THREE.Mesh(geo, paper))
    const face = new THREE.Mesh(
      fitUVs(new THREE.ShapeGeometry(shapeAt(0), 32)),
      new THREE.MeshPhysicalMaterial({ map, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05 })
    )
    face.position.z = 0.0095
    s.add(face)
    return s
  }
  const circle = (r) => (pad) => {
    const sh = new THREE.Shape()
    sh.absarc(0, 0, r + pad, 0, Math.PI * 2, false)
    return sh
  }
  const rounded = (w, h, r) => (pad) => roundedRectShape(w + pad * 2, h + pad * 2, r + pad)

  // 1. Round badge: orange, mark in the middle, name set round the rim
  const badgeTex = makePrint(ctx, 512, 512, (g, w, h, logo) => {
    const bg = g.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w / 2)
    bg.addColorStop(0, '#ff6a24')
    bg.addColorStop(1, '#ee4a12')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(255,255,255,0.9)'
    g.lineWidth = 5
    g.beginPath()
    g.arc(w / 2, h / 2, 176, 0, Math.PI * 2)
    g.stroke()
    if (!drawMark(g, logo, '#ffffff', w / 2, h / 2, 130)) {
      g.fillStyle = '#ffffff'
      g.font = `800 110px ${FONT}`
      spaced(g, 'SE', w / 2, h / 2 + 38, 0)
    }
    g.fillStyle = '#ffffff'
    g.font = `800 40px ${FONT}`
    g.textAlign = 'center'
    const text = 'SKY EYE TECHNOLOGY • DRONES • '
    const step = (Math.PI * 2) / text.length
    for (let i = 0; i < text.length; i++) {
      g.save()
      g.translate(w / 2, h / 2)
      g.rotate(-Math.PI / 2 + i * step)
      g.fillText(text[i], 0, -200)
      g.restore()
    }
  })
  const badge = sticker(circle(0.5), badgeTex)
  badge.position.set(-0.42, 0.98, -0.08)
  badge.rotation.z = 0.22
  group.add(badge)

  // 2. Wordmark slab: black, white name, orange line
  const slabTex = makePrint(ctx, 1024, 420, (g, w, h, logo) => {
    g.fillStyle = INK
    g.fillRect(0, 0, w, h)
    const has = drawMark(g, logo, ORANGE, 190, h / 2, 150)
    g.fillStyle = '#ffffff'
    g.font = `800 150px ${FONT}`
    spaced(g, 'SKY EYE', has ? 650 : w / 2, 225, -3)
    g.fillStyle = AMBER
    g.font = `600 44px ${MONO}`
    spaced(g, 'TECHNOLOGY', has ? 650 : w / 2, 310, 18)
  })
  const slab = sticker(rounded(1.2, 0.49, 0.1), slabTex)
  slab.position.set(0.18, 0.62, 0.04)
  slab.rotation.z = -0.1
  group.add(slab)

  // 3. Drone pilot square: amber, drone icon
  const pilotTex = makePrint(ctx, 512, 512, (g, w, h) => {
    g.fillStyle = AMBER
    g.fillRect(0, 0, w, h)
    droneIcon(g, w / 2, 220, 110, INK, 16)
    g.fillStyle = INK
    g.font = `800 58px ${FONT}`
    spaced(g, 'DRONE PILOT', w / 2, 430, -1)
  })
  const pilot = sticker(rounded(0.62, 0.62, 0.14), pilotTex)
  pilot.position.set(0.52, 1.18, 0.12)
  pilot.rotation.z = -0.28
  group.add(pilot)

  group.rotation.x = -0.12
  group.position.set(0.02, -0.06, 0)
  return { group, float: 0.16, shadow: 0.95 }
}

function buildToffees(ctx) {
  const group = new THREE.Group()
  const palette = [
    { base: ORANGE, band: '#ffffff', ink: '#ffffff', foil: 0xff5a1f },
    { base: AMBER, band: INK, ink: INK, foil: 0xffb020 },
    { base: '#17181b', band: ORANGE, ink: '#ffffff', foil: 0x2a2b30 },
    { base: '#ece6dc', band: ORANGE, ink: ORANGE, foil: 0xd8d2c8 },
  ]
  const bodyGeo = new THREE.SphereGeometry(0.22, 48, 32)
  bodyGeo.rotateZ(Math.PI / 2) // poles on the x axis, where the wrapper twists
  bodyGeo.scale(1.45, 1, 1)

  // Twisted, fanned-out wrapper end (lathe along +y, then laid along +x)
  const prof = [
    [0.12, 0], [0.07, 0.035], [0.04, 0.07], [0.034, 0.095], [0.05, 0.12], [0.09, 0.16], [0.135, 0.205], [0.165, 0.245], [0.17, 0.26],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const endGeo = new THREE.LatheGeometry(prof, 72)
  const p = endGeo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const fan = THREE.MathUtils.smoothstep(y, 0.08, 0.26)
    const a = Math.atan2(z, x) + y * 4 // twist
    const r = Math.hypot(x, z) * (1 + Math.sin(a * 11) * 0.22 * fan) // crinkled pleats
    p.setXYZ(i, Math.cos(a) * r, y, Math.sin(a) * r)
  }
  endGeo.computeVertexNormals()
  endGeo.rotateZ(-Math.PI / 2)
  endGeo.translate(0.3, 0, 0)

  const looks = palette.map((c) => {
    const map = makePrint(ctx, 512, 256, (g, w, h) => {
      g.fillStyle = c.base
      g.fillRect(0, 0, w, h)
      // diagonal candy stripes and bands near the twists (v runs end to end)
      g.fillStyle = c.band
      g.globalAlpha = 0.22
      for (let x = -h; x < w; x += 46) {
        g.beginPath()
        g.moveTo(x, 0)
        g.lineTo(x + 18, 0)
        g.lineTo(x + 18 + h * 0.5, h)
        g.lineTo(x + h * 0.5, h)
        g.fill()
      }
      g.globalAlpha = 1
      g.fillRect(0, h * 0.2, w, 7)
      g.fillRect(0, h * 0.8 - 7, w, 7)
      // the name, running along the candy, front and back
      g.fillStyle = c.ink
      g.font = `800 34px ${FONT}`
      for (const u of [0.25, 0.75]) {
        g.save()
        g.translate(w * u, h / 2)
        g.rotate(-Math.PI / 2)
        g.scale(-1, -1) // the sphere's uv runs against the text
        spaced(g, 'SKY EYE', 0, 12, 1)
        g.restore()
      }
    })
    return {
      body: new THREE.MeshPhysicalMaterial({ map, roughness: 0.2, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.04 }),
      foil: new THREE.MeshPhysicalMaterial({ color: c.foil, roughness: 0.3, metalness: 0.55, clearcoat: 0.8, side: THREE.DoubleSide }),
    }
  })

  const candy = (look, x, y, z, rx, ry, rz) => {
    const c = new THREE.Group()
    c.add(new THREE.Mesh(bodyGeo, look.body))
    const right = new THREE.Mesh(endGeo, look.foil)
    c.add(right)
    const left = new THREE.Mesh(endGeo, look.foil)
    left.rotation.z = Math.PI
    c.add(left)
    c.position.set(x, y, z)
    c.rotation.set(rx, ry, rz)
    group.add(c)
  }
  // A little pile: four on the turntable, two resting on top
  candy(looks[2], -0.38, 0.22, 0.22, 0, 0.35, 0)
  candy(looks[1], 0.42, 0.22, 0.12, 0, -0.55, 0)
  candy(looks[0], 0.02, 0.22, -0.42, 0, 1.3, 0)
  candy(looks[3], 0.05, 0.22, 0.62, 0, -0.1, 0)
  candy(looks[1], -0.06, 0.6, 0.02, 0.15, -0.15, 0.12)
  candy(looks[0], 0.28, 0.58, -0.22, -0.2, 0.9, -0.1)
  group.scale.setScalar(1.25)
  group.rotation.y = 0.1
  return { group, shadow: 1.25 }
}

const BUILDERS = { mug: buildMug, bottle: buildBottle, keychain: buildKeychain, card: buildCard, stickers: buildStickers, toffees: buildToffees }

// ---------------------------------------------------------------------------
// Stage pieces

function radialTexture(stops) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  for (const [o, col] of stops) grad.addColorStop(o, col)
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Turntable top: brushed dark disc with tick marks and the name round the rim
function tableTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 1024
  const g = c.getContext('2d')
  const m = 512
  const bg = g.createRadialGradient(m, m, 0, m, m, m)
  bg.addColorStop(0, '#26272c')
  bg.addColorStop(0.85, '#18191d')
  bg.addColorStop(1, '#101114')
  g.fillStyle = bg
  g.fillRect(0, 0, 1024, 1024)
  g.strokeStyle = 'rgba(255,255,255,0.05)'
  g.lineWidth = 2
  for (let r = 80; r < 440; r += 36) {
    g.beginPath()
    g.arc(m, m, r, 0, Math.PI * 2)
    g.stroke()
  }
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2
    const long = i % 10 === 0
    g.strokeStyle = long ? 'rgba(255,90,31,0.85)' : 'rgba(255,255,255,0.18)'
    g.lineWidth = long ? 6 : 3
    g.beginPath()
    g.moveTo(m + Math.cos(a) * 470, m + Math.sin(a) * 470)
    g.lineTo(m + Math.cos(a) * (long ? 430 : 452), m + Math.sin(a) * (long ? 430 : 452))
    g.stroke()
  }
  g.fillStyle = 'rgba(255,255,255,0.22)'
  g.font = `600 30px ${MONO}`
  g.textAlign = 'center'
  const text = 'SKY EYE TECHNOLOGY · KIIT MUN · WIN AT THE STALL · '
  const step = (Math.PI * 2) / text.length
  for (let i = 0; i < text.length; i++) {
    g.save()
    g.translate(m, m)
    g.rotate(i * step)
    g.fillText(text[i], 0, -396)
    g.restore()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// Horizontal speed lines that trail a goodie while it swooshes
function streakTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')
  const lines = [[0.18, 0.75, 3], [0.32, 1, 5], [0.45, 0.55, 2], [0.55, 0.9, 6], [0.68, 0.65, 3], [0.8, 0.85, 4]]
  for (const [y, len, th] of lines) {
    const grad = g.createLinearGradient(0, 0, 512 * len, 0)
    grad.addColorStop(0, 'rgba(255,176,32,0)')
    grad.addColorStop(0.7, 'rgba(255,120,40,0.55)')
    grad.addColorStop(1, 'rgba(255,240,220,0.95)')
    g.fillStyle = grad
    g.beginPath()
    g.roundRect(512 * (1 - len), y * 128 - th / 2, 512 * len, th, th / 2)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Soft light cone from above: brightest at the source, fading at its edges
function beamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(0xffb070) }, uStrength: { value: 0.22 } },
    vertexShader: /* glsl */ `
      varying float vEdge;
      varying float vY;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        vEdge = abs(dot(n, normalize(-mv.xyz)));
        vY = uv.y;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying float vEdge;
      varying float vY;
      void main() {
        float a = pow(vEdge, 2.5) * smoothstep(0.0, 0.9, vY) * uStrength;
        gl_FragColor = vec4(uColor * a, a);
      }`,
  })
}

/**
 * Mount the showcase into `container`.
 * opts: { items: ['mug', 'bottle', ...], index = 0, dark = true }
 * Returns { next, prev, goTo(i, dir?), onChange(cb) -> unsubscribe, setTheme, dispose }.
 */
export function mountGoodies(container, { items = Object.keys(BUILDERS), index = 0, dark = true } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const phone = window.matchMedia('(max-width: 640px)').matches
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.7

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
  const target = new THREE.Vector3(0, 0.8, 0)

  // Lights: a warm spot from above, a white key, orange + amber rims from behind
  const spot = new THREE.SpotLight(0xffe6cc, 38, 14, 0.42, 0.6, 1.6)
  spot.position.set(0, 6, 1.2)
  spot.target.position.set(0, 0.5, 0)
  scene.add(spot, spot.target)
  const key = new THREE.DirectionalLight(0xffffff, 1.3)
  key.position.set(3, 4, 5)
  scene.add(key)
  const rimL = new THREE.DirectionalLight(0xff5a1f, 2.6)
  rimL.position.set(-5, 2.5, -3)
  const rimR = new THREE.DirectionalLight(0xffb020, 1.8)
  rimR.position.set(5, 1.5, -3)
  scene.add(rimL, rimR)
  scene.add(new THREE.HemisphereLight(0xfff1e6, 0x1a1210, 0.35))

  // ---- Pedestal: fixed plinth + rotating turntable, glow rings, light cone ----
  const plinthMat = new THREE.MeshPhysicalMaterial({ color: 0x141518, roughness: 0.35, metalness: 0.6, clearcoat: 0.6 })
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.16, 0.3, 96), plinthMat)
  plinth.position.y = -0.22
  scene.add(plinth)
  const glowRing = new THREE.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: 0.9 })
  const ringTop = new THREE.Mesh(new THREE.TorusGeometry(1.105, 0.007, 8, 160), glowRing)
  ringTop.rotation.x = Math.PI / 2
  ringTop.position.y = -0.075
  scene.add(ringTop)
  const ringLow = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.006, 8, 160), new THREE.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.45 }))
  ringLow.rotation.x = Math.PI / 2
  ringLow.position.y = -0.37
  scene.add(ringLow)

  const table = new THREE.Group()
  scene.add(table)
  const tableSide = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.07, 96, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a2c31, roughness: 0.25, metalness: 1 }))
  tableSide.position.y = -0.035
  table.add(tableSide)
  const tableTop = new THREE.Mesh(new THREE.CircleGeometry(0.98, 96), new THREE.MeshPhysicalMaterial({ map: tableTexture(), roughness: 0.22, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.1 }))
  tableTop.rotation.x = -Math.PI / 2
  table.add(tableTop)

  const floorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ map: radialTexture([[0, 'rgba(255,110,40,0.55)'], [0.35, 'rgba(255,90,31,0.18)'], [1, 'rgba(255,90,31,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  )
  floorGlow.rotation.x = -Math.PI / 2
  floorGlow.position.y = -0.38
  scene.add(floorGlow)

  const shadowMat = new THREE.MeshBasicMaterial({ map: radialTexture([[0, 'rgba(0,0,0,0.75)'], [0.55, 'rgba(0,0,0,0.3)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false })
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), shadowMat)
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.004
  scene.add(shadow)

  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 1.05, 5, 64, 1, true), beamMaterial())
  beam.position.y = 2.5
  scene.add(beam)

  // ---- Goodies: wrap (flight path, lean, scale) > swirl (flight spin) > spin (drag/idle) > model ----
  const ctx = { logo: null, prints: [] }
  const streakTex = streakTexture()
  const goodies = items
    .filter((k) => BUILDERS[k])
    .map((kind) => {
      const built = BUILDERS[kind](ctx)
      const wrap = new THREE.Group()
      const swirl = new THREE.Group()
      const spin = new THREE.Group()
      spin.add(built.group)
      swirl.add(spin)
      wrap.add(swirl)
      wrap.visible = false
      scene.add(wrap)
      const streak = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1.4),
        new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })
      )
      streak.visible = false
      scene.add(streak)
      return { kind, wrap, swirl, spin, model: built.group, float: built.float || 0, shadow: built.shadow || 1, streak, lastX: 0, q: new THREE.Quaternion() }
    })
  const n = goodies.length

  // The mark and the brand font arrive async; redraw every print when they do
  let disposed = false
  const redrawAll = () => {
    if (!disposed) for (const r of ctx.prints) r()
  }
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    ctx.logo = { img }
    redrawAll()
  }
  img.src = LOGO_URL
  document.fonts?.load(`800 64px Geist`).then(() => document.fonts.load(`600 32px 'JetBrains Mono'`)).then(redrawAll, () => {})

  // ---- State ----
  let current = THREE.MathUtils.clamp(index, 0, Math.max(n - 1, 0))
  let leaving = null // goodie flying out
  let transit = null // { t, dir }
  const listeners = new Set()
  const vel = { x: 0, y: 0 } // spin velocity, rad/s about world y and x
  const drag = { on: false, id: -1, x: 0, y: 0, t: 0 }
  let pulse = 0
  let exitX = 6
  const mountedAt = performance.now()

  const show = (g) => {
    g.wrap.visible = true
    g.wrap.position.set(0, 0, 0)
    g.wrap.rotation.set(0, 0, 0)
    g.wrap.scale.setScalar(1)
    g.swirl.rotation.set(0, 0, 0)
  }
  if (n) {
    show(goodies[current])
    goodies[current].spin.quaternion.setFromEuler(new THREE.Euler(0, -0.5, 0))
  }

  const goTo = (i, dir) => {
    if (!n) return
    i = ((i % n) + n) % n
    if (i === current && !transit) return
    if (dir === undefined) {
      const fwd = (i - current + n) % n
      dir = fwd <= n / 2 ? 1 : -1
    }
    // Interrupting a swoosh: drop the one already leaving
    if (leaving) {
      leaving.wrap.visible = false
      leaving.streak.visible = false
    }
    leaving = goodies[current]
    current = i
    const next = goodies[current]
    show(next)
    leaving.lastX = leaving.wrap.position.x
    next.lastX = dir * exitX
    // Arrive facing slightly off-front, so it settles into a three-quarter view
    next.spin.quaternion.setFromEuler(new THREE.Euler(0, -0.5 * dir, 0))
    vel.x = IDLE_SPIN
    vel.y = 0
    pulse = 1
    // Instant swap with reduced motion, or before the first frames have drawn (restarts)
    if (reduced || performance.now() - mountedAt < 150) {
      leaving.wrap.visible = false
      leaving = null
      transit = null
    } else {
      transit = { t: 0, dir }
    }
    for (const cb of listeners) cb(current)
  }

  // ---- Drag to spin (mouse: both axes; touch: horizontal, vertical swipes scroll) ----
  const el = renderer.domElement
  el.style.touchAction = 'pan-y'
  const onDown = (e) => {
    if (drag.on || (e.pointerType === 'mouse' && e.button !== 0)) return
    drag.on = true
    drag.id = e.pointerId
    drag.x = e.clientX
    drag.y = e.clientY
    drag.t = performance.now()
    vel.x = 0
    vel.y = 0
    el.setPointerCapture?.(e.pointerId)
    container.classList.add('is-dragging')
  }
  const rotY = new THREE.Quaternion()
  const rotX = new THREE.Quaternion()
  const AXIS_Y = new THREE.Vector3(0, 1, 0)
  const AXIS_X = new THREE.Vector3(1, 0, 0)
  const turn = (q, ax, ay) => {
    rotY.setFromAxisAngle(AXIS_Y, ax)
    rotX.setFromAxisAngle(AXIS_X, ay)
    q.premultiply(rotY).premultiply(rotX)
  }
  const onMove = (e) => {
    if (!drag.on || e.pointerId !== drag.id) return
    const now = performance.now()
    const dt = Math.max((now - drag.t) / 1000, 1 / 240)
    const dx = (e.clientX - drag.x) * DRAG_SPEED
    const dy = (e.clientY - drag.y) * DRAG_SPEED
    drag.x = e.clientX
    drag.y = e.clientY
    drag.t = now
    if (n) turn(goodies[current].spin.quaternion, dx, dy)
    // Smoothed release velocity, capped so a flick can't go wild
    vel.x = THREE.MathUtils.clamp(damp(vel.x, dx / dt, 18, dt), -14, 14)
    vel.y = THREE.MathUtils.clamp(damp(vel.y, dy / dt, 18, dt), -14, 14)
  }
  const onUp = (e) => {
    if (!drag.on || e.pointerId !== drag.id) return
    drag.on = false
    // Held still before letting go: no throw
    if (performance.now() - drag.t > 90) vel.x = vel.y = 0
    container.classList.remove('is-dragging')
  }
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)

  // ---- Theme (the stall section is dark in both themes; light gets a touch more exposure) ----
  const setTheme = (isDark) => {
    renderer.toneMappingExposure = isDark ? 0.95 : 1.05
    beam.material.uniforms.uStrength.value = isDark ? 0.22 : 0.18
  }
  setTheme(dark)

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // Pull back on narrow stages so the plinth still fits across
    const dist = camera.aspect < 1 ? 8.2 / camera.aspect ** 0.5 : camera.aspect < 1.5 ? 7.1 : 6.7
    camera.position.set(0, 1.5, dist)
    camera.lookAt(target)
    camera.updateProjectionMatrix()
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist
    exitX = halfH * camera.aspect + 1.6
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  let visible = true
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
  })
  io.observe(container)

  const upright = new THREE.Quaternion()
  const euler = new THREE.Euler(0, 0, 0, 'YXZ')
  const clock = new THREE.Clock()
  let raf = 0
  let t = 0
  let frameDt = 1 / 60

  const placeStreak = (g) => {
    const x = g.wrap.position.x
    const v = (x - g.lastX) / Math.max(frameDt, 1 / 240)
    g.lastX = x
    const speed = Math.abs(v)
    const s = g.streak
    s.visible = speed > 0.5
    if (!s.visible) return
    const len = Math.min(speed * 0.3, 3.2)
    s.scale.set(len * Math.sign(v), g.wrap.scale.y, 1) // flipped so the bright end leads
    s.position.set(x - Math.sign(v) * len * 0.5, 0.85 * g.wrap.scale.y, 0.1)
    s.material.opacity = Math.min(speed / 14, 0.65)
  }

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(clock.getDelta(), 0.05)
    frameDt = dt
    if (!visible || document.hidden || !n) return
    t += dt
    const g = goodies[current]
    const q = g.spin.quaternion

    // Spin: coast on the throw, settle back into the idle turn and upright
    if (!drag.on) {
      turn(q, vel.x * dt, vel.y * dt)
      vel.x = damp(vel.x, reduced ? 0 : IDLE_SPIN, 1.6, dt)
      vel.y = damp(vel.y, 0, 2.2, dt)
      euler.setFromQuaternion(q)
      upright.setFromEuler(euler.set(0, euler.y, 0))
      q.slerp(upright, 1 - Math.exp(-2.4 * dt))
    }
    euler.setFromQuaternion(q)
    table.rotation.y = euler.y

    // Hover bob for the floating goodies
    for (const k of goodies) {
      if (k.wrap.visible) k.model.parent.position.y = k.float ? k.float + (reduced ? 0 : Math.sin(t * 1.5) * 0.04) : 0
    }

    // Swoosh: the old one accelerates away, the new one flies in and overshoots a touch
    let shadowScale = g.shadow
    if (transit) {
      transit.t += dt
      const dir = transit.dir
      const pOut = clamp01(transit.t / (SWOOSH * 0.6))
      const pIn = clamp01((transit.t - SWOOSH * 0.18) / (SWOOSH * 0.82))
      if (leaving) {
        const e = easeInCubic(pOut)
        leaving.wrap.position.x = -dir * e * exitX
        leaving.wrap.position.y = e * 0.35
        leaving.wrap.rotation.z = dir * 0.35 * e
        leaving.wrap.scale.setScalar(1 - 0.3 * e)
        leaving.swirl.rotation.y = -dir * e * Math.PI * 1.4
        placeStreak(leaving)
        if (pOut >= 1) {
          leaving.wrap.visible = false
          leaving.streak.visible = false
          leaving = null
        }
      }
      const eb = easeOutBack(pIn, 1.1)
      const ec = easeOutCubic(pIn)
      g.wrap.position.x = dir * (1 - eb) * exitX
      g.wrap.position.y = (1 - ec) * 0.5
      g.wrap.rotation.z = -dir * 0.4 * (1 - ec)
      g.wrap.scale.setScalar(0.65 + 0.35 * ec)
      g.swirl.rotation.y = dir * (1 - ec) * Math.PI * 2
      placeStreak(g)
      shadowScale *= clamp01(1 - Math.abs(g.wrap.position.x) / 2.5)
      if (pIn >= 1) {
        transit = null
        g.wrap.position.set(0, 0, 0)
        g.wrap.rotation.set(0, 0, 0)
        g.wrap.scale.setScalar(1)
        g.swirl.rotation.y = 0
        g.streak.visible = false
      }
    }

    // Contact shadow follows the goodie: softer and smaller when it floats or flies
    shadow.scale.setScalar(Math.max(shadowScale, 0.001) * (g.float ? 0.85 : 1))
    shadowMat.opacity = g.float ? 0.55 : 0.95
    shadow.position.x = g.wrap.position.x * 0.6

    // Rim ring flares on each swap
    pulse = damp(pulse, 0, 2.5, dt)
    glowRing.opacity = 0.75 + pulse * 0.25
    ringTop.scale.setScalar(1 + pulse * 0.02)
    beam.material.uniforms.uStrength.value = (renderer.toneMappingExposure > 1 ? 0.18 : 0.22) * (1 + pulse * 0.8)

    renderer.render(scene, camera)
  }
  tick()

  return {
    next: () => goTo(current + 1, 1),
    prev: () => goTo(current - 1, -1),
    goTo,
    onChange: (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    getIndex: () => current,
    setTheme,
    dispose: () => {
      disposed = true
      cancelAnimationFrame(raf)
      img.onload = null
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      container.classList.remove('is-dragging')
      listeners.clear()
      ro.disconnect()
      io.disconnect()
      scene.traverse((o) => {
        o.geometry?.dispose()
        if (o.material) [].concat(o.material).forEach((m) => { m.map?.dispose(); m.dispose() })
      })
      scene.environment?.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss() // free the GPU context now, not at GC
      renderer.domElement.remove()
    },
  }
}
