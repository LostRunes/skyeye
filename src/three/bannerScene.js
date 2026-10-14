import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildDrone } from './droneScene.js'

// Skyvertising: the Sky Eye drone towing a vertical cloth banner with the
// company logo and name. The banner is a real cloth simulation (see below):
// it hangs, catches the wind, swings behind the drone and is stirred by the
// pointer; a first touch twists it so it flips and settles on its own.
//
// mode 'overlay': a fixed full-viewport layer; the page steers the drone with
//   setPose({ x, y, size, show }) in CSS pixels (banner centre, banner width).
// mode 'inline': the scene sits in its container, centred, drifting gently.

const damp = (c, t, l, dt) => c + (t - c) * (1 - Math.exp(-l * dt))

const BW = 1.1 // banner width (world, before scaling)
const BH = 3.3 // banner height
const DROP = 0.75 // drone belly → banner top

function bannerTexture(logoUrl) {
  const c = document.createElement('canvas')
  c.width = 600
  c.height = 1800
  const g = c.getContext('2d')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  let logo = null

  const draw = () => {
    const bg = g.createLinearGradient(0, 0, 0, c.height)
    bg.addColorStop(0, '#13204a')
    bg.addColorStop(1, '#070d24')
    g.fillStyle = bg
    g.fillRect(0, 0, c.width, c.height)
    // LED-dot grid, like the brochure's LED net
    g.fillStyle = 'rgba(120,160,255,0.11)'
    for (let y = 12; y < c.height; y += 18) for (let x = 12; x < c.width; x += 18) g.fillRect(x, y, 3, 3)
    g.strokeStyle = 'rgba(255,255,255,0.5)'
    g.lineWidth = 8
    g.strokeRect(18, 18, c.width - 36, c.height - 36)

    // Logo mark at the top
    if (logo) {
      const w = 380
      const h = (logo.height / logo.width) * w
      g.shadowColor = 'rgba(110,160,255,0.9)'
      g.shadowBlur = 36
      g.drawImage(logo, (c.width - w) / 2, 110, w, h)
      g.shadowBlur = 0
    }

    // "SKY EYE" running up the banner, "TECHNOLOGY" spelled down beside it,
    // as on the brochure's vertical banner
    g.save()
    g.translate(c.width / 2 - 40, 1420)
    g.rotate(-Math.PI / 2)
    g.textBaseline = 'middle'
    g.textAlign = 'left'
    g.fillStyle = '#ffffff'
    g.shadowColor = 'rgba(90,150,255,0.85)'
    g.shadowBlur = 30
    g.font = '800 230px "Geist", "Inter", "Arial Black", sans-serif'
    g.fillText('SKY EYE', 0, 0)
    g.restore()

    g.fillStyle = 'rgba(255,255,255,0.92)'
    g.font = '600 58px "JetBrains Mono", "Courier New", monospace'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    'TECHNOLOGY'.split('').forEach((ch, i) => g.fillText(ch, c.width / 2 + 175, 680 + i * 74))

    // Brand underline + service name
    g.fillStyle = '#ff4f00'
    g.fillRect(c.width / 2 - 150, c.height - 200, 300, 12)
    g.fillStyle = 'rgba(255,255,255,0.7)'
    g.font = '600 40px "JetBrains Mono", "Courier New", monospace'
    g.fillText('SKYVERTISING', c.width / 2, c.height - 130)
    t.needsUpdate = true
  }

  draw()
  if (logoUrl) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      logo = img
      draw()
    }
    img.src = logoUrl
  }
  // The wordmark uses the site's web fonts; redraw once they have loaded
  document.fonts?.load('800 230px "Geist"').then(draw).catch(() => {})
  return t
}

// ── Cloth simulation ──────────────────────────────────────────────
// Adapted from the "drape, set free" silk in VAYANA (SareeCloth): Verlet
// integration over a particle sheet with structural and bend constraints,
// one edge pinned, wind gusts, and a pointer that stirs the cloth it passes.
// Here the pinned edge is the top hem under the drone, and the sheet lives in
// a frame that travels with the drone — when the drone moves, the frame moves
// and the cloth genuinely lags and swings behind it.
const GX = 14
const GY = 42
const SIM_DT = 1 / 60
const DAMP = 0.982
const GRAVITY = -2.4
const ITERATIONS = 6

export function mountBanner(container, { dark = false, mode = 'inline', logoUrl } = {}) {
  const overlay = mode === 'overlay'
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  const key = new THREE.DirectionalLight(0xffffff, 1.4)
  key.position.set(-3, 4, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x9fc4ff, 0.8)
  rim.position.set(4, -1, 2.5)
  scene.add(rim)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xaab4bb, 0.55))

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0, 10)

  // Rig = drone + banner; placed and scaled as one
  const rig = new THREE.Group()
  scene.add(rig)
  const { drone, props } = buildDrone()
  drone.scale.setScalar(0.6)
  drone.rotation.set(0.22, 0.35, 0)
  rig.add(drone)

  // The cloth: its top hem hangs DROP below the drone's belly
  const TOP = -0.29 - DROP
  const geometry = new THREE.PlaneGeometry(BW, BH, GX, GY)
  geometry.translate(0, TOP - BH / 2, 0)
  const tex = bannerTexture(logoUrl)
  // Front shows the print; the back gets a mirrored copy so it reads correctly
  const texBack = tex.clone()
  texBack.wrapS = THREE.RepeatWrapping
  texBack.repeat.x = -1
  texBack.offset.x = 1
  const clothMat = (map, side) =>
    new THREE.MeshPhysicalMaterial({
      map,
      side,
      roughness: 0.62,
      metalness: 0,
      sheen: 0.22,
      sheenColor: new THREE.Color(0x8fb2ff),
      sheenRoughness: 0.5,
      envMapIntensity: 0.32,
    })
  const front = new THREE.Mesh(geometry, clothMat(tex, THREE.FrontSide))
  const back = new THREE.Mesh(geometry, clothMat(texBack, THREE.BackSide))
  // (The clone shares the canvas source, so redraws reach both sides.)
  rig.add(front, back)

  // Particles, in rig-local units
  const pos = geometry.attributes.position
  const N = (GX + 1) * (GY + 1)
  const cur = new Float32Array(N * 3)
  const prev = new Float32Array(N * 3)
  const rest = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    cur[i * 3] = prev[i * 3] = rest[i * 3] = pos.getX(i)
    cur[i * 3 + 1] = prev[i * 3 + 1] = rest[i * 3 + 1] = pos.getY(i)
  }
  const idx = (ix, iy) => ix + iy * (GX + 1)
  const restH = BW / GX
  const restV = BH / GY
  const cons = [] // a, b, restLength, stiffness
  for (let iy = 0; iy <= GY; iy++)
    for (let ix = 0; ix <= GX; ix++) {
      if (ix < GX) cons.push(idx(ix, iy), idx(ix + 1, iy), restH, 1)
      if (iy < GY) cons.push(idx(ix, iy), idx(ix, iy + 1), restV, 1)
      if (ix < GX && iy < GY) cons.push(idx(ix, iy), idx(ix + 1, iy + 1), Math.hypot(restH, restV), 0.5)
      if (ix < GX - 1) cons.push(idx(ix, iy), idx(ix + 2, iy), restH * 2, 0.2)
      if (iy < GY - 1) cons.push(idx(ix, iy), idx(ix, iy + 2), restV * 2, 0.15)
    }
  const pinned = (p) => p < GX + 1 // the top row

  // The top hem: held by the cables, swaying slightly
  const pinAt = (ix, t, o) => {
    const r = idx(ix, 0) * 3
    cur[o] = rest[r]
    cur[o + 1] = rest[r + 1] + 0.015 * Math.sin(t * 1.3)
    cur[o + 2] = 0.03 * Math.sin(t * 0.9 + ix * 0.3)
  }

  const pointer = { x: 0, y: 0, strength: 0 }
  let twist = 0 // hover "flip": a twisting push that the cloth works out itself
  let gustBoost = 0

  const step = (t) => {
    const gust = 0.55 + 0.3 * Math.sin(t * 0.55) + 0.15 * Math.sin(t * 1.7 + 1.1) + gustBoost
    for (let iy = 1; iy <= GY; iy++) {
      const cy = iy / GY // 0 at the top hem, 1 at the tail
      const reach = Math.pow(cy, 1.1)
      for (let ix = 0; ix <= GX; ix++) {
        const cx = ix / GX
        const i = idx(ix, iy) * 3
        let fx = (0.35 * Math.sin(t * 0.8 + cy * 2) + 0.08) * gust * reach
        const fy = GRAVITY
        let fz =
          (Math.sin(t * 2.6 - cy * 6.5 + cx * 1.6) + 0.45 * Math.sin(t * 4.4 - cy * 11 + cx * 4)) *
          1.6 * reach * gust
        if (pointer.strength > 0.01) {
          const dx = cur[i] - pointer.x
          const dy = cur[i + 1] - pointer.y
          const d2 = dx * dx + dy * dy
          if (d2 < 0.35) {
            const f = (1 - d2 / 0.35) * pointer.strength
            fz += f * 18
            fx += dx * f * 8
          }
        }
        if (twist > 0.01) fz += (cx - 0.5) * 2 * twist * 34 * reach
        const v0 = (cur[i] - prev[i]) * DAMP
        const v1 = (cur[i + 1] - prev[i + 1]) * DAMP
        const v2 = (cur[i + 2] - prev[i + 2]) * DAMP
        prev[i] = cur[i]
        prev[i + 1] = cur[i + 1]
        prev[i + 2] = cur[i + 2]
        cur[i] += v0 + fx * SIM_DT * SIM_DT
        cur[i + 1] += v1 + fy * SIM_DT * SIM_DT
        cur[i + 2] += v2 + fz * SIM_DT * SIM_DT
      }
    }
    for (let it = 0; it < ITERATIONS; it++) {
      for (let ix = 0; ix <= GX; ix++) pinAt(ix, t, idx(ix, 0) * 3)
      for (let c = 0; c < cons.length; c += 4) {
        const ia = cons[c]
        const ib = cons[c + 1]
        const aP = pinned(ia)
        const bP = pinned(ib)
        if (aP && bP) continue
        const a = ia * 3
        const b = ib * 3
        const dx = cur[b] - cur[a]
        const dy = cur[b + 1] - cur[a + 1]
        const dz = cur[b + 2] - cur[a + 2]
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6
        const diff = ((d - cons[c + 2]) / d) * 0.5 * cons[c + 3]
        const wA = aP ? 0 : bP ? 2 : 1
        const wB = bP ? 0 : aP ? 2 : 1
        cur[a] += dx * diff * wA
        cur[a + 1] += dy * diff * wA
        cur[a + 2] += dz * diff * wA
        cur[b] -= dx * diff * wB
        cur[b + 1] -= dy * diff * wB
        cur[b + 2] -= dz * diff * wB
      }
    }
    for (let ix = 0; ix <= GX; ix++) {
      const o = idx(ix, 0) * 3
      pinAt(ix, t, o)
      prev[o] = cur[o]
      prev[o + 1] = cur[o + 1]
      prev[o + 2] = cur[o + 2]
    }
    pointer.strength *= 0.9
    twist *= 0.93
    gustBoost *= 0.97
  }

  // When the drone moves, the cloth's frame moves with it: shift every free
  // particle (now and previous) the other way, so in the world it stays put
  // for that instant and then gets dragged along by the hem.
  const shiftFrame = (dx, dy) => {
    for (let i = GX + 1; i < N; i++) {
      const o = i * 3
      cur[o] -= dx
      prev[o] -= dx
      cur[o + 1] -= dy
      prev[o + 1] -= dy
    }
  }

  const commit = () => {
    pos.array.set(cur)
    pos.needsUpdate = true
    geometry.computeVertexNormals()
  }

  // Cables: thin rods from the drone's belly to the banner's top corners
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x5b636a, roughness: 0.4, metalness: 0.6 })
  const cableGeo = new THREE.CylinderGeometry(0.01, 0.01, 1, 6)
  const cables = [-1, 1].map(() => {
    const m = new THREE.Mesh(cableGeo, cableMat)
    rig.add(m)
    return m
  })
  const up = new THREE.Vector3(0, 1, 0)

  const setTheme = (isDark) => {
    cableMat.color.set(isDark ? 0x9aa3ab : 0x5b636a)
    renderer.toneMappingExposure = isDark ? 1.2 : 1.05
  }
  setTheme(dark)

  // Pointer: tracked on window so the overlay layer can stay click-through
  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2(9, 9)
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const hitPt = new THREE.Vector3()
  const view = { x: 0, active: false }
  let hovering = false
  const onMove = (e) => {
    const r = renderer.domElement.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    view.x = ((e.clientX - r.left) / r.width) * 2 - 1
    view.active = e.clientY >= r.top && e.clientY <= r.bottom
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerdown', onMove, { passive: true })

  let worldPerPx = 0.01
  let viewW = 1
  let viewH = 1
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container
    if (!w || !h) return
    viewW = w
    viewH = h
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    worldPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / h
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  let visible = !overlay
  let entered = false
  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting
      if (visible) entered = true
    },
    { threshold: 0.1 }
  )
  io.observe(container)

  // Pose target (CSS px, banner centre). Overlay mode gets it from the page.
  const pose = { x: -300, y: 300, size: 110, show: 0 }
  const cur2 = { x: -300, y: 300, size: 110 }
  let vx = 0
  let lastRig = null
  const clock = new THREE.Clock()
  let simT = 0
  let acc = 0
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  let raf = 0

  // Settle into a hanging pose before the first frame
  for (let s = 0; s < 120; s++) step((simT += SIM_DT))
  commit()

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(clock.getDelta(), 0.1)
    if (document.hidden) return
    if (overlay ? !pose.show && Math.abs(cur2.x - pose.x) < 1 : !visible) return
    const t = clock.elapsedTime

    if (!overlay) {
      // Inline: fly in from the left, then hover centre and drift to the pointer
      pose.x = entered ? viewW / 2 + (view.active ? view.x * viewW * 0.12 : Math.sin(t * 0.35) * viewW * 0.08) : -300
      pose.y = viewH * 0.55
      pose.size = Math.min(viewW * 0.3, viewH * 0.17)
    }

    const px = cur2.x
    cur2.x = damp(cur2.x, pose.x, 1.8, dt)
    cur2.y = damp(cur2.y, pose.y, 2.2, dt)
    cur2.size = damp(cur2.size, pose.size, 2.5, dt)
    vx = damp(vx, (cur2.x - px) / Math.max(dt, 1e-3), 5, dt)

    // Pixel pose → world. The pose is the banner's centre.
    const scale = (cur2.size * worldPerPx) / BW
    const bob = reduced ? 0 : Math.sin(t * 1.3) * 0.06
    const wx = (cur2.x - viewW / 2) * worldPerPx
    const wy = -(cur2.y - viewH / 2) * worldPerPx + (0.29 + DROP + BH / 2) * scale + bob * scale
    // Hand the drone's movement to the cloth (in its own units)
    if (lastRig) shiftFrame((wx - lastRig.x) / scale, (wy - lastRig.y) / scale)
    lastRig = { x: wx, y: wy }
    rig.position.set(wx, wy, 0)
    rig.scale.setScalar(scale)
    rig.rotation.z = THREE.MathUtils.clamp(-vx * 0.0004, -0.18, 0.18)
    for (const p of props) p.group.rotation.y += (reduced ? 0 : 38) * dt * p.dir

    // Hover: the pointer stirs the cloth; the first touch gives it a twist
    raycaster.setFromCamera(ndc, camera)
    const onCloth = raycaster.intersectObject(front, false)[0] || raycaster.intersectObject(back, false)[0]
    if (onCloth && raycaster.ray.intersectPlane(plane, hitPt)) {
      rig.worldToLocal(hitPt)
      pointer.x = hitPt.x
      pointer.y = hitPt.y
      pointer.strength = Math.min(1, pointer.strength + 0.3)
      if (!hovering && !reduced) {
        twist = 1
        gustBoost = 0.6
      }
      hovering = true
    } else hovering = false

    // Fixed-step simulation
    acc += dt
    let n = 0
    while (acc >= SIM_DT && n < 6) {
      simT += SIM_DT
      if (!reduced || n === 0) step(simT)
      acc -= SIM_DT
      n++
    }
    if (n === 6) acc = 0
    commit()

    // Cables: drone belly → the banner's top corners
    cables.forEach((line, i) => {
      a.set(i ? 0.17 : -0.17, -0.17, 0.07)
      const o = idx(i ? GX : 0, 0) * 3
      b.set(cur[o], cur[o + 1], cur[o + 2])
      const d = b.clone().sub(a)
      line.position.copy(a).addScaledVector(d, 0.5)
      line.scale.set(1, d.length(), 1)
      line.quaternion.setFromUnitVectors(up, d.normalize())
    })

    renderer.render(scene, camera)
  }
  tick()

  return {
    setTheme,
    setPose: (p) => Object.assign(pose, p),
    dispose: () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
      ro.disconnect()
      io.disconnect()
      scene.traverse((o) => {
        o.geometry?.dispose()
        if (o.material) [].concat(o.material).forEach((m) => m.dispose())
      })
      tex.dispose()
      texBack.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
