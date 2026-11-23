import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildDrone } from './droneScene.js'

// The Sky Eye drones for the spin-the-wheel pages, dressed for the carnival:
// each one is wrapped in strings of fairy lights (one draped arm-tip to
// arm-tip, one wound round the body) that twinkle in warm whites and ambers.
//
// `fleet` describes each drone, in viewport terms:
//   { y, size, speed, dir, wave, offset }  flies across the screen and loops
//   { hover: true, x, y, size }            hovers in place (admin login etc.)
// x/y are 0..1 of the container; size is px (or 0..1 of the shorter side).

const BULB_COLORS = ['#fff1c9', '#ffd38a', '#ffb38a', '#ffc2cc', '#fff7e0', '#ffc46b'].map((c) => new THREE.Color(c))

function fairyLights() {
  const group = new THREE.Group()
  const strands = []

  // Strand 1: draped between the four arm tips, sagging in between
  const tips = [
    new THREE.Vector3(1.16, 0.2, 0.98),
    new THREE.Vector3(-1.16, 0.2, 0.98),
    new THREE.Vector3(-1.16, 0.1, -0.98),
    new THREE.Vector3(1.16, 0.1, -0.98),
  ]
  const outer = []
  for (let k = 0; k < 4; k++) {
    const a = tips[k]
    const b = tips[(k + 1) % 4]
    for (let i = 0; i < 12; i++) {
      const f = i / 12
      const p = a.clone().lerp(b, f)
      p.y -= 0.24 * Math.sin(Math.PI * f) // the sag
      p.multiplyScalar(1 + 0.04 * Math.sin(Math.PI * f)) // bow outwards a touch
      outer.push(p)
    }
  }
  strands.push({ points: outer, bulbs: 44 })

  // Strand 2: wound twice round the body
  const inner = []
  for (let i = 0; i < 64; i++) {
    const th = (i / 64) * Math.PI * 2
    inner.push(new THREE.Vector3(0.5 * Math.cos(th), 0.08 + 0.07 * Math.sin(th * 3), 0.8 * Math.sin(th)))
  }
  strands.push({ points: inner, bulbs: 22 })

  const wireMat = new THREE.MeshStandardMaterial({ color: 0x3b3a2c, roughness: 0.7 })
  const bulbGeo = new THREE.SphereGeometry(0.062, 12, 10)
  const bulbMat = new THREE.MeshBasicMaterial({ toneMapped: false })
  const total = strands.reduce((n, s) => n + s.bulbs, 0)
  const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, total)
  const base = []
  const phase = []
  const m = new THREE.Matrix4()
  let n = 0
  for (const s of strands) {
    const curve = new THREE.CatmullRomCurve3(s.points, true)
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.011, 5, true), wireMat))
    for (let i = 0; i < s.bulbs; i++) {
      const p = curve.getPointAt(i / s.bulbs)
      m.makeTranslation(p.x, p.y - 0.02, p.z)
      bulbs.setMatrixAt(n, m)
      base.push(BULB_COLORS[n % BULB_COLORS.length])
      phase.push(Math.random() * Math.PI * 2)
      bulbs.setColorAt(n, base[n])
      n++
    }
  }
  group.add(bulbs)

  const c = new THREE.Color()
  const twinkle = (t) => {
    for (let i = 0; i < total; i++) {
      const k = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * (1.6 + (i % 5) * 0.35) + phase[i]))
      bulbs.setColorAt(i, c.copy(base[i]).multiplyScalar(k * 1.45))
    }
    bulbs.instanceColor.needsUpdate = true
  }
  return { group, twinkle }
}

export function mountSpinSky(container, { fleet = [] } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  // Warm sunset key light, cool fill from the sky
  const key = new THREE.DirectionalLight(0xffd6b8, 1.5)
  key.position.set(-4, 5, 6)
  scene.add(key)
  scene.add(new THREE.HemisphereLight(0xd9c6e6, 0x8a6f7a, 0.7))

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0, 10)

  const craft = fleet.map((f, i) => {
    const holder = new THREE.Group()
    const { drone, props } = buildDrone()
    const lights = fairyLights()
    drone.add(lights.group)
    holder.add(drone)
    scene.add(holder)
    return { ...f, holder, drone, props, lights, seed: i * 1.7, pos: null, vx: 0, vy: 0 }
  })

  let W = 1
  let H = 1
  let worldPerPx = 0.01
  const resize = () => {
    W = container.clientWidth
    H = container.clientHeight
    if (!W || !H) return
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    camera.updateProjectionMatrix()
    worldPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / H
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  const toWorld = (x, y) => new THREE.Vector3((x - W / 2) * worldPerPx, -(y - H / 2) * worldPerPx, 0)
  const clock = new THREE.Clock()
  let raf = 0

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime

    for (const c of craft) {
      const sizePx = c.size <= 1 ? c.size * Math.min(W, H) : c.size
      const scale = (sizePx * worldPerPx) / 2.7
      let x
      let y
      if (c.hover) {
        x = c.x * W + (reduced ? 0 : Math.sin(t * 0.5 + c.seed) * 8)
        y = c.y * H + (reduced ? 0 : Math.sin(t * 1.3 + c.seed) * 7)
      } else {
        const p = (((reduced ? 0.3 : t * c.speed) + (c.offset || 0)) % 1 + 1) % 1
        const from = -sizePx
        const to = W + sizePx
        x = c.dir < 0 ? to - (to - from) * p : from + (to - from) * p
        y = c.y * H + Math.sin(p * Math.PI * 3 + c.seed) * (c.wave || 0.03) * H
      }
      const target = toWorld(x, y)
      const px = c.pos ? c.pos.x : target.x
      const py = c.pos ? c.pos.y : target.y
      const jumped = c.pos && Math.abs(target.x - px) > (W * worldPerPx) / 2 // wrapped round
      c.pos = target
      if (!jumped) {
        c.vx += ((target.x - px) / Math.max(dt, 1e-3) - c.vx) * Math.min(1, dt * 4)
        c.vy += ((target.y - py) / Math.max(dt, 1e-3) - c.vy) * Math.min(1, dt * 4)
      }
      c.holder.position.copy(c.pos)
      c.holder.scale.setScalar(scale)
      // Show the top a little, face the direction of travel, bank into it
      const face = c.hover ? Math.sin(t * 0.3 + c.seed) * 0.5 : c.dir < 0 ? 0.9 : -0.9
      c.drone.rotation.set(0.32, face, 0)
      c.holder.rotation.set(THREE.MathUtils.clamp(-c.vy * 0.05, -0.25, 0.25), 0, THREE.MathUtils.clamp(-c.vx * 0.05, -0.3, 0.3))
      for (const p of c.props) p.group.rotation.y += (reduced ? 0 : 38) * dt * p.dir
      if (!reduced || !c.lit) {
        c.lights.twinkle(t + c.seed)
        c.lit = true
      }
    }
    renderer.render(scene, camera)
  }
  tick()

  return {
    dispose: () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      scene.traverse((o) => {
        o.geometry?.dispose()
        if (o.material) [].concat(o.material).forEach((m) => { m.map?.dispose?.(); m.dispose() })
      })
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    },
  }
}
