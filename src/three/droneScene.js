import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// A quadcopter built entirely in code (no third-party model), after the feel
// of drone.riotters.com: it hovers with a slow bob, the props spin under soft
// motion-blur discs, the whole airframe leans gently toward the pointer and
// the gimbal camera turns to look at it. Every motion is a damped chase toward
// a target, which is what makes it read as smooth rather than twitchy.

const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt))

function blurDiscTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(128, 128, 18, 128, 128, 128)
  grad.addColorStop(0, 'rgba(255,255,255,0)')
  grad.addColorStop(0.35, 'rgba(225,236,242,0.55)')
  grad.addColorStop(0.85, 'rgba(210,226,235,0.35)')
  grad.addColorStop(1, 'rgba(210,226,235,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function shadowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, 'rgba(0,0,0,0.35)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

function buildDrone() {
  const shell = new THREE.MeshPhysicalMaterial({ color: 0xe8ebee, roughness: 0.32, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.25 })
  const shellDark = new THREE.MeshPhysicalMaterial({ color: 0xd4d9dd, roughness: 0.4, metalness: 0.1, clearcoat: 0.4 })
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9ced3, roughness: 0.22, metalness: 0.9 })
  const black = new THREE.MeshPhysicalMaterial({ color: 0x14171a, roughness: 0.18, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 })
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0b1a24, roughness: 0.05, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, emissive: 0x0a3a52, emissiveIntensity: 0.35 })
  const blade = new THREE.MeshStandardMaterial({ color: 0xdfe6ea, roughness: 0.45, transparent: true, opacity: 0.35 })

  const drone = new THREE.Group()

  // Fuselage: rounded main body, raised top shell, rear battery
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.34, 1.7, 6, 0.16), shell)
  drone.add(body)
  const top = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.14, 1.15, 5, 0.07), shellDark)
  top.position.set(0, 0.2, -0.05)
  drone.add(top)
  const battery = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.1, 0.5, 4, 0.05), shellDark)
  battery.position.set(0, 0.26, -0.45)
  drone.add(battery)
  // Forward obstacle sensors
  for (const x of [-0.2, 0.2]) {
    const s = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.08, 0.04, 3, 0.02), black)
    s.position.set(x, 0.06, 0.85)
    drone.add(s)
  }
  // Vents
  for (let i = 0; i < 3; i++) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.16), black)
    v.position.set(0.48, -0.02, -0.15 - i * 0.07)
    drone.add(v)
    const v2 = v.clone()
    v2.position.x = -0.48
    drone.add(v2)
  }

  // Arms, motors, props
  const props = []
  const corners = [
    { x: 1, z: 1, cw: true },
    { x: -1, z: 1, cw: false },
    { x: 1, z: -1, cw: false },
    { x: -1, z: -1, cw: true },
  ]
  const discTex = blurDiscTexture()
  for (const c of corners) {
    const from = new THREE.Vector3(0.38 * c.x, 0.02, 0.55 * c.z)
    const to = new THREE.Vector3(1.2 * c.x, c.z > 0 ? 0.12 : 0.02, 1.0 * c.z)
    const len = from.distanceTo(to)
    const arm = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.1, len, 3, 0.045), shell)
    arm.position.copy(from).add(to).multiplyScalar(0.5)
    arm.lookAt(to)
    drone.add(arm)

    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.2, 32), metal)
    motor.position.copy(to).add(new THREE.Vector3(0, 0.06, 0))
    drone.add(motor)
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.06, 24), black)
    cap.position.copy(motor.position).add(new THREE.Vector3(0, 0.12, 0))
    drone.add(cap)
    // Landing leg under each motor
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.34, 12), shell)
    leg.position.copy(to).add(new THREE.Vector3(0, -0.2, 0))
    drone.add(leg)

    const prop = new THREE.Group()
    prop.position.copy(cap.position).add(new THREE.Vector3(0, 0.03, 0))
    for (const r of [0, Math.PI]) {
      const b = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.012, 0.09, 2, 0.006), blade)
      b.position.x = 0.31
      const holder = new THREE.Group()
      holder.rotation.y = r
      b.rotation.x = c.cw ? 0.18 : -0.18
      holder.add(b)
      prop.add(holder)
    }
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.66, 48),
      new THREE.MeshBasicMaterial({ map: discTex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    )
    disc.rotation.x = -Math.PI / 2
    prop.add(disc)
    drone.add(prop)
    props.push({ group: prop, dir: c.cw ? 1 : -1 })

    // Status light on the rear arms
    if (c.z < 0) {
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), new THREE.MeshBasicMaterial({ color: c.x > 0 ? 0x3cff7a : 0xff3b3b }))
      led.position.copy(to).add(new THREE.Vector3(0, -0.04, -0.12))
      drone.add(led)
    }
  }

  // Gimbal: a yaw yoke under the nose holding a pitching camera head
  const gimbalYaw = new THREE.Group()
  gimbalYaw.position.set(0, -0.26, 0.72)
  drone.add(gimbalYaw)
  const yoke = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.08, 0.12, 3, 0.03), metal)
  yoke.position.y = 0.02
  gimbalYaw.add(yoke)
  for (const x of [-0.2, 0.2]) {
    const side = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.24, 0.12, 3, 0.02), metal)
    side.position.set(x, -0.1, 0)
    gimbalYaw.add(side)
  }
  const gimbalPitch = new THREE.Group()
  gimbalPitch.position.y = -0.14
  gimbalYaw.add(gimbalPitch)
  const head = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.26, 0.3, 5, 0.07), shell)
  gimbalPitch.add(head)
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 40), black)
  bezel.rotation.x = Math.PI / 2
  bezel.position.z = 0.16
  gimbalPitch.add(bezel)
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.075, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), glass)
  lens.rotation.x = Math.PI / 2
  lens.position.z = 0.185
  gimbalPitch.add(lens)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.008, 8, 48), metal)
  ring.position.z = 0.19
  gimbalPitch.add(ring)

  return { drone, props, gimbalYaw, gimbalPitch }
}

/**
 * Mount the scene into `container`. Returns { setProgress, setTheme, dispose }.
 * `progress` (0..1) is the scroll position through the section.
 */
export function mountDrone(container, { dark = false } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
  camera.position.set(0, 0.9, 8)
  camera.lookAt(0, 0, 0)

  const key = new THREE.DirectionalLight(0xffffff, 1.4)
  key.position.set(3, 5, 4)
  scene.add(key)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c2c8, 0.6))

  const rig = new THREE.Group() // scroll-driven placement
  scene.add(rig)
  const tilt = new THREE.Group() // pointer lean + hover bob
  rig.add(tilt)
  const { drone, props, gimbalYaw, gimbalPitch } = buildDrone()
  tilt.add(drone)

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -1.35
  rig.add(shadow)

  const setTheme = (isDark) => {
    shadow.material.opacity = isDark ? 0.35 : 0.55
    renderer.toneMappingExposure = isDark ? 1.25 : 1.05
  }
  setTheme(dark)

  // Pointer, normalised to -1..1 across the viewport. With no pointer
  // (touch, or idle) the gimbal sweeps slowly on its own.
  const pointer = { x: 0, y: 0, active: false, last: 0 }
  const onMove = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    pointer.active = true
    pointer.last = performance.now()
  }
  window.addEventListener('pointermove', onMove, { passive: true })

  let progress = 0
  let baseX = 0
  const state = { yaw: 0, pitch: 0, gYaw: 0, gPitch: 0, rigYaw: 0, rigX: 0, rigScale: 1 }

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // Keep the whole drone in frame on narrow screens
    camera.position.z = w / h < 0.8 ? 11.5 : w / h < 1.2 ? 9.5 : 8
    // Wide screens: the copy sits on the left, so the drone flies on the right
    baseX = w / h > 1.2 ? 1.25 : 0
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  let visible = true
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
  })
  io.observe(container)

  const clock = new THREE.Clock()
  let raf = 0
  const tick = () => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(clock.getDelta(), 0.05)
    if (!visible || document.hidden) return
    const t = clock.elapsedTime

    const idle = !pointer.active || performance.now() - pointer.last > 4000
    const px = idle ? Math.sin(t * 0.45) * 0.7 : pointer.x
    const py = idle ? Math.sin(t * 0.31) * 0.25 : pointer.y

    // Gimbal looks where the pointer is (fast), airframe leans after it (slow)
    state.gYaw = damp(state.gYaw, px * 0.75, 5, dt)
    state.gPitch = damp(state.gPitch, -0.15 + py * 0.45, 5, dt)
    state.yaw = damp(state.yaw, px * 0.28, 2.2, dt)
    state.pitch = damp(state.pitch, py * 0.1, 2.2, dt)

    // Scroll: turn the drone through a three-quarter view and drift sideways
    const sx = Math.sin(progress * Math.PI * 2) * 0.6
    state.rigYaw = damp(state.rigYaw, -0.5 + progress * 1.1, 3, dt)
    state.rigX = damp(state.rigX, baseX + sx * (baseX ? 0.5 : 1), 3, dt)

    gimbalYaw.rotation.y = state.gYaw - state.yaw * 0.6
    gimbalPitch.rotation.x = state.gPitch
    tilt.rotation.set(state.pitch + 0.12, state.yaw, -state.yaw * 0.45)
    tilt.position.y = reduced ? 0 : Math.sin(t * 1.4) * 0.07 + Math.sin(t * 0.7) * 0.03
    rig.rotation.y = state.rigYaw
    rig.position.x = state.rigX
    shadow.scale.setScalar(1 - tilt.position.y * 0.6)

    const spin = reduced ? 0 : 38 * dt
    for (const p of props) p.group.rotation.y += spin * p.dir

    renderer.render(scene, camera)
  }
  tick()

  return {
    setProgress: (p) => {
      progress = p
    },
    setTheme,
    dispose: () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      ro.disconnect()
      io.disconnect()
      scene.traverse((o) => {
        o.geometry?.dispose()
        if (o.material) [].concat(o.material).forEach((m) => { m.map?.dispose(); m.dispose() })
      })
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
