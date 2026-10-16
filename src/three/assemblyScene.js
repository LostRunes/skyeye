import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildDrone } from './droneScene.js'

// About Us: the Sky Eye drone assembling itself as you scroll — built from
// the same code model as the rest of the site, so no video frames.
// It starts as an exploded blueprint (wireframe parts spread out), then each
// part flies into place in build order, turning solid as it seats:
// airframe → arms → motors & landing gear → propellers → gimbal camera.
// Fully built, the propellers spin up and it lifts off.

const clamp01 = (v) => Math.min(Math.max(v, 0), 1)
const smooth = (t) => t * t * (3 - 2 * t)
const ease = (t) => 1 - Math.pow(1 - t, 3)
const damp = (c, t, l, dt) => c + (t - c) * (1 - Math.exp(-l * dt))

// Build order and the slice of scroll progress each part assembles in
export const PARTS = [
  { key: 'airframe', from: 0.06, to: 0.22 },
  { key: 'arms', from: 0.22, to: 0.38 },
  { key: 'motors', from: 0.38, to: 0.54 },
  { key: 'props', from: 0.54, to: 0.68 },
  { key: 'camera', from: 0.68, to: 0.8 },
]
const LIFT_FROM = 0.84

function classify(obj, propSet, gimbal) {
  if (propSet.has(obj)) return 'props'
  if (obj === gimbal) return 'camera'
  const { x, z } = obj.position
  if (Math.abs(x) < 0.5) return 'airframe'
  return Math.hypot(x, z) > 1.4 ? 'motors' : 'arms'
}

// Where each part waits in the exploded view (added to its built position)
function explodeOffset(part, pos) {
  const out = new THREE.Vector3(pos.x, 0, pos.z)
  if (out.lengthSq() > 1e-6) out.normalize()
  switch (part) {
    case 'airframe':
      return new THREE.Vector3(0, 0.15 + pos.y * 1.6, pos.z * 0.35)
    case 'arms':
      return out.multiplyScalar(1.2).add(new THREE.Vector3(0, 0.15, 0))
    case 'motors':
      return out.multiplyScalar(1.7).add(new THREE.Vector3(0, 0.45 + pos.y * 0.4, 0))
    case 'props':
      return out.multiplyScalar(0.7).add(new THREE.Vector3(0, 1.35, 0))
    case 'camera':
      return new THREE.Vector3(0, -1.15, 0.9)
    default:
      return new THREE.Vector3()
  }
}

export function mountAssembly(container, { dark = false } = {}) {
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
  key.position.set(3, 5, 4)
  scene.add(key)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c2c8, 0.6))

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)

  const rig = new THREE.Group()
  scene.add(rig)
  const { drone, props, gimbalYaw } = buildDrone()
  rig.add(drone)

  const blueprint = new THREE.Color()
  const propSet = new Set(props.map((p) => p.group))

  // Every direct child of the model becomes one movable piece
  const pieces = drone.children.map((obj) => {
    const part = classify(obj, propSet, gimbalYaw)
    const home = obj.position.clone()
    const offset = explodeOffset(part, home)
    const spin = new THREE.Euler((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 0.9)
    const homeRot = obj.rotation.clone()
    // Own copies of materials (they are shared in the model) + blueprint edges
    const meshes = []
    obj.traverse((m) => {
      if (!m.isMesh) return
      m.material = m.material.clone()
      m.userData.baseOpacity = m.material.transparent ? m.material.opacity : 1
      m.material.transparent = true
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(m.geometry, 28),
        new THREE.LineBasicMaterial({ color: blueprint, transparent: true, opacity: 0.9, depthWrite: false })
      )
      m.add(edges)
      meshes.push({ m, edges })
    })
    // Small pieces settle slightly after the big ones of the same part
    const lag = Math.random() * 0.18
    return { obj, part, home, offset, spin, homeRot, meshes, lag }
  })
  const range = Object.fromEntries(PARTS.map((p) => [p.key, p]))

  const setTheme = (isDark) => {
    blueprint.set(isDark ? 0x6fb6ff : 0x2563b8)
    pieces.forEach((pc) => pc.meshes.forEach(({ edges }) => edges.material.color.copy(blueprint)))
    renderer.toneMappingExposure = isDark ? 1.25 : 1.05
  }
  setTheme(dark)

  const pointer = { x: 0, y: 0 }
  const onMove = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('pointermove', onMove, { passive: true })

  let wide = true
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    wide = w / h > 1.15
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  let visible = false
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
  })
  io.observe(container)

  let target = 0
  let p = 0
  const look = { x: 0, y: 0 }
  let spinSpeed = 0
  const clock = new THREE.Clock()
  let raf = 0

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(clock.getDelta(), 0.05)
    if (!visible || document.hidden) return
    const t = clock.elapsedTime
    p = reduced ? target : damp(p, target, 6, dt)

    // Pieces fly home within their part's slice of the scroll
    for (const pc of pieces) {
      const r = range[pc.part]
      const span = r.to - r.from
      const local = clamp01((p - r.from - pc.lag * span) / (span * (1 - pc.lag * 0.5)))
      const k = ease(local)
      const away = 1 - k
      pc.obj.position.copy(pc.home).addScaledVector(pc.offset, away)
      pc.obj.rotation.set(
        pc.homeRot.x + pc.spin.x * away,
        pc.homeRot.y + pc.spin.y * away,
        pc.homeRot.z + pc.spin.z * away
      )
      // Blueprint wireframe → solid as it seats
      const solid = smooth(clamp01((local - 0.55) / 0.45))
      for (const { m, edges } of pc.meshes) {
        const o = m.userData.baseOpacity * (0.06 + 0.94 * solid)
        m.material.opacity = o
        m.material.depthWrite = solid > 0.6
        m.visible = o > 0.01
        edges.material.opacity = 0.85 * (1 - solid) + 0.04
      }
    }

    // Built: props spin up, the drone lifts and banks into a turn
    const lift = smooth(clamp01((p - LIFT_FROM) / (1 - LIFT_FROM)))
    spinSpeed = damp(spinSpeed, (p > 0.7 ? 6 : 0) + lift * 34, 3, dt)
    if (!reduced) for (const pr of props) pr.group.rotation.y += spinSpeed * dt * pr.dir
    const hover = lift * Math.sin(t * 1.4) * 0.06

    // Camera orbits the build: three-quarter view, sweeping round as it assembles
    look.x = damp(look.x, pointer.x, 3, dt)
    look.y = damp(look.y, pointer.y, 3, dt)
    const az = 0.95 - p * 1.25 + look.x * 0.12
    const el = 0.42 - p * 0.18 + lift * 0.05 - look.y * 0.06
    const dist = (wide ? 12 : 15.5) - p * 1.8 - lift * 0.6
    camera.position.set(Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist)
    const lx = wide ? -0.45 : 0
    camera.lookAt(lx * Math.cos(az), 0.1 + lift * 0.5, -lx * Math.sin(az))
    rig.position.y = lift * 0.7 + hover
    rig.rotation.set(lift * 0.06, lift * 0.5, -lift * 0.08)

    renderer.render(scene, camera)
  }
  tick()

  return {
    setProgress: (v) => {
      target = clamp01(v)
    },
    setTheme,
    dispose: () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      ro.disconnect()
      io.disconnect()
      scene.traverse((o) => {
        o.geometry?.dispose()
        if (o.material) [].concat(o.material).forEach((m) => { m.map?.dispose?.(); m.dispose() })
      })
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
