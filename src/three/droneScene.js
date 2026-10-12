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

// Tapered, slightly twisted propeller blade, extruded from a 2D outline.
function bladeGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, -0.035)
  s.bezierCurveTo(0.18, -0.06, 0.42, -0.055, 0.6, -0.022)
  s.quadraticCurveTo(0.645, 0, 0.6, 0.02)
  s.bezierCurveTo(0.42, 0.04, 0.18, 0.05, 0, 0.03)
  s.lineTo(0, -0.035)
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 16 })
  g.rotateX(Math.PI / 2)
  return g
}

function buildDrone() {
  const shell = new THREE.MeshPhysicalMaterial({ color: 0xeef0f2, roughness: 0.3, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.2 })
  const shellDark = new THREE.MeshPhysicalMaterial({ color: 0xc9cfd4, roughness: 0.38, metalness: 0.12, clearcoat: 0.5 })
  const graphite = new THREE.MeshPhysicalMaterial({ color: 0x2a2f34, roughness: 0.42, metalness: 0.3, clearcoat: 0.4 })
  const metal = new THREE.MeshStandardMaterial({ color: 0xb8bfc5, roughness: 0.2, metalness: 0.95 })
  const black = new THREE.MeshPhysicalMaterial({ color: 0x101316, roughness: 0.18, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 })
  const seam = new THREE.MeshBasicMaterial({ color: 0x5b636a })
  const accent = new THREE.MeshStandardMaterial({ color: 0xff4f00, roughness: 0.35, emissive: 0xff4f00, emissiveIntensity: 0.25 })
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0b1a24, roughness: 0.04, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, emissive: 0x0a3a52, emissiveIntensity: 0.4 })
  const blade = new THREE.MeshPhysicalMaterial({ color: 0x2b3136, roughness: 0.35, metalness: 0.1, clearcoat: 0.6, transparent: true, opacity: 0.55 })

  const drone = new THREE.Group()
  const add = (geo, mat, x, y, z, parent = drone) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    parent.add(m)
    return m
  }

  // ---- Fuselage ----
  // Lower hull (graphite) + upper shell (white) with a seam between them
  add(new RoundedBoxGeometry(0.9, 0.16, 1.62, 6, 0.08), graphite, 0, -0.1, 0)
  add(new RoundedBoxGeometry(0.96, 0.26, 1.7, 6, 0.13), shell, 0, 0.06, 0)
  add(new THREE.BoxGeometry(0.965, 0.008, 1.66), seam, 0, -0.05, 0)
  // Raised spine, battery and the orange brand stripe
  const top = add(new RoundedBoxGeometry(0.66, 0.12, 1.12, 5, 0.06), shellDark, 0, 0.22, -0.06)
  top.scale.set(1, 1, 1)
  add(new RoundedBoxGeometry(0.62, 0.08, 0.46, 4, 0.04), shell, 0, 0.3, -0.48)
  add(new THREE.BoxGeometry(0.05, 0.012, 0.95), accent, 0, 0.285, 0.02)
  for (const z of [-0.62, -0.5, -0.38]) add(new THREE.BoxGeometry(0.5, 0.01, 0.02), seam, 0, 0.345, z) // battery grip
  // Nose cowl tapering forward
  const nose = add(new RoundedBoxGeometry(0.7, 0.2, 0.3, 5, 0.09), shell, 0, 0.02, 0.86)
  nose.rotation.x = 0.18
  // Forward and downward vision sensors
  for (const x of [-0.19, 0.19]) {
    add(new RoundedBoxGeometry(0.15, 0.08, 0.03, 3, 0.015), black, x, 0.08, 1.0)
    add(new THREE.CircleGeometry(0.022, 20), glass, x, 0.08, 1.017)
    const down = add(new THREE.CircleGeometry(0.045, 24), glass, x * 0.8, -0.181, -0.25)
    down.rotation.x = Math.PI / 2
  }
  // Side vents and panel seams
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.012, 0.07, 0.11), black, side * 0.482, 0.02, -0.12 - i * 0.075)
    add(new THREE.BoxGeometry(0.004, 0.2, 0.004), seam, side * 0.482, 0.04, 0.42)
  }

  // ---- Arms, motors, props ----
  const props = []
  const corners = [
    { x: 1, z: 1, cw: true },
    { x: -1, z: 1, cw: false },
    { x: 1, z: -1, cw: false },
    { x: -1, z: -1, cw: true },
  ]
  const discTex = blurDiscTexture()
  const bladeGeo = bladeGeometry()
  for (const c of corners) {
    const from = new THREE.Vector3(0.36 * c.x, 0.02, 0.55 * c.z)
    const to = new THREE.Vector3(1.22 * c.x, c.z > 0 ? 0.12 : 0.02, 1.02 * c.z)
    const len = from.distanceTo(to)
    // Hinge where the arm folds
    const hinge = add(new THREE.CylinderGeometry(0.075, 0.075, 0.16, 24), graphite, from.x, from.y, from.z)
    hinge.rotation.set(0, 0, 0)
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.17, 12), metal, from.x, from.y, from.z)
    // Arm: white upper, graphite underside
    const arm = add(new RoundedBoxGeometry(0.13, 0.09, len, 3, 0.04), shell, 0, 0, 0)
    arm.position.copy(from).add(to).multiplyScalar(0.5)
    arm.lookAt(to)
    const under = arm.clone()
    under.material = graphite
    under.scale.set(0.9, 0.5, 0.96)
    under.position.y -= 0.035
    drone.add(under)

    // Motor bell with cooling fins and a metal cap
    const mp = to.clone().add(new THREE.Vector3(0, 0.06, 0))
    add(new THREE.CylinderGeometry(0.115, 0.125, 0.06, 32), graphite, mp.x, mp.y - 0.08, mp.z) // mount
    add(new THREE.CylinderGeometry(0.105, 0.11, 0.16, 32), metal, mp.x, mp.y, mp.z)
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2
      const fin = add(new THREE.BoxGeometry(0.012, 0.13, 0.03), black, mp.x + Math.cos(a) * 0.108, mp.y, mp.z + Math.sin(a) * 0.108)
      fin.rotation.y = -a
    }
    add(new THREE.CylinderGeometry(0.06, 0.085, 0.05, 24), black, mp.x, mp.y + 0.105, mp.z)
    // Landing leg + antenna on the rear legs
    const leg = add(new THREE.CylinderGeometry(0.028, 0.02, 0.36, 12), shell, to.x, to.y - 0.21, to.z)
    leg.rotation.z = c.x * 0.08
    add(new THREE.SphereGeometry(0.03, 12, 8), black, to.x + c.x * 0.015, to.y - 0.39, to.z)
    if (c.z < 0) add(new THREE.BoxGeometry(0.014, 0.14, 0.035), graphite, to.x, to.y - 0.18, to.z - 0.04)

    // Propeller: hub, two airfoil blades, and a blur disc
    const prop = new THREE.Group()
    prop.position.set(mp.x, mp.y + 0.14, mp.z)
    add(new THREE.CylinderGeometry(0.035, 0.045, 0.04, 16), metal, 0, 0, 0, prop)
    for (const r of [0, Math.PI]) {
      const holder = new THREE.Group()
      holder.rotation.y = r
      const b = new THREE.Mesh(bladeGeo, blade)
      b.position.x = 0.03
      b.rotation.x = c.cw ? 0.16 : -0.16
      holder.add(b)
      prop.add(holder)
    }
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.68, 48),
      new THREE.MeshBasicMaterial({ map: discTex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    )
    disc.rotation.x = -Math.PI / 2
    prop.add(disc)
    drone.add(prop)
    props.push({ group: prop, dir: c.cw ? 1 : -1 })

    // Navigation lights: green/red at the rear, white at the front
    const ledColor = c.z < 0 ? (c.x > 0 ? 0x3cff7a : 0xff3b3b) : 0xffffff
    add(new THREE.SphereGeometry(0.022, 12, 8), new THREE.MeshBasicMaterial({ color: ledColor }), to.x, to.y - 0.03, to.z + 0.12 * c.z)
  }

  // ---- Gimbal: yaw yoke under the nose holding a pitching camera head ----
  const gimbalYaw = new THREE.Group()
  gimbalYaw.position.set(0, -0.24, 0.74)
  drone.add(gimbalYaw)
  add(new THREE.CylinderGeometry(0.06, 0.07, 0.07, 24), graphite, 0, 0.04, 0, gimbalYaw) // yaw motor
  add(new RoundedBoxGeometry(0.44, 0.06, 0.1, 3, 0.025), metal, 0, -0.01, 0, gimbalYaw)
  for (const x of [-0.21, 0.21]) {
    add(new RoundedBoxGeometry(0.045, 0.24, 0.1, 3, 0.02), metal, x, -0.12, 0, gimbalYaw)
    const pm = add(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 20), graphite, x * 0.93, -0.16, 0, gimbalYaw) // pitch motor
    pm.rotation.z = Math.PI / 2
  }
  const gimbalPitch = new THREE.Group()
  gimbalPitch.position.y = -0.16
  gimbalYaw.add(gimbalPitch)
  add(new RoundedBoxGeometry(0.34, 0.27, 0.32, 5, 0.07), shell, 0, 0, 0, gimbalPitch)
  add(new THREE.BoxGeometry(0.345, 0.006, 0.325), seam, 0, -0.03, 0, gimbalPitch)
  const bezel = add(new THREE.CylinderGeometry(0.12, 0.125, 0.06, 40), black, 0, 0, 0.17, gimbalPitch)
  bezel.rotation.x = Math.PI / 2
  const ring = add(new THREE.TorusGeometry(0.105, 0.01, 10, 48), metal, 0, 0, 0.2, gimbalPitch)
  ring.rotation.set(0, 0, 0)
  const lens = add(new THREE.SphereGeometry(0.085, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, 0, 0.19, gimbalPitch)
  lens.rotation.x = Math.PI / 2
  const inner = add(new THREE.CircleGeometry(0.035, 24), new THREE.MeshBasicMaterial({ color: 0x38c8ff, transparent: true, opacity: 0.35 }), 0, 0, 0.276, gimbalPitch)
  inner.renderOrder = 2

  return { drone, props, gimbalYaw, gimbalPitch }
}

/**
 * Mount the scene into `container`. Returns { setProgress, setTheme, dispose }.
 * `progress` (0..1) is the scroll position through the section.
 */
export function mountDrone(container, { dark = false, flight = false } = {}) {
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
  // Flight mode: the page steers the drone across the whole viewport.
  // pose.x / pose.y are in viewport units (-1..1 edge to edge), scale is size.
  const pose = { x: 0, y: 1.6, scale: 1, yaw: -0.4 }
  const fly = { x: 0, y: 1.6, scale: 1, yaw: -0.4, vx: 0, vy: 0 }
  if (flight) shadow.visible = false
  const state = { yaw: 0, pitch: 0, gYaw: 0, gPitch: 0, rigYaw: 0, rigX: 0, rigScale: 1 }

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // Keep the whole drone in frame on narrow screens
    camera.position.z = flight ? 10 : w / h < 0.8 ? 11.5 : w / h < 1.2 ? 9.5 : 8
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
    // Off-screen and settled: skip the draw
    if (flight && Math.abs(fly.y) > 1.45 && Math.abs(pose.y - fly.y) < 0.01) return
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
    if (flight) {
      // Chase the pose; the chase velocity tips the airframe like real flight:
      // bank into sideways moves, nose down going forward/down.
      const px0 = fly.x
      const py0 = fly.y
      fly.x = damp(fly.x, pose.x, 2.4, dt)
      fly.y = damp(fly.y, pose.y, 2.4, dt)
      fly.scale = damp(fly.scale, pose.scale, 2.4, dt)
      fly.yaw = damp(fly.yaw, pose.yaw, 2, dt)
      fly.vx = damp(fly.vx, (fly.x - px0) / Math.max(dt, 1e-3), 6, dt)
      fly.vy = damp(fly.vy, (fly.y - py0) / Math.max(dt, 1e-3), 6, dt)
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z
      const halfW = halfH * camera.aspect
      rig.position.set(fly.x * halfW, fly.y * halfH, 0)
      rig.scale.setScalar(fly.scale)
      rig.rotation.set(
        THREE.MathUtils.clamp(-fly.vy * 0.35, -0.35, 0.35),
        fly.yaw,
        THREE.MathUtils.clamp(-fly.vx * 0.45, -0.45, 0.45)
      )
    } else {
      rig.rotation.y = state.rigYaw
      rig.position.x = state.rigX
    }
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
    setPose: (p) => Object.assign(pose, p),
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
