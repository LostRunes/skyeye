import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildDrone } from './droneScene.js'

// Two Sky Eye drones for the announcement pop-up. The page tells them, every
// frame, where the card's two top corners are (CSS px); each drone hovers
// above its corner with a cable down to it, tilting with its own motion.

const damp = (c, t, l, dt) => c + (t - c) * (1 - Math.exp(-l * dt))

export function mountPopupDrones(container) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  const key = new THREE.DirectionalLight(0xffffff, 1.4)
  key.position.set(3, 5, 6)
  scene.add(key)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xaab4bb, 0.6))

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0, 10)

  const cableMat = new THREE.MeshStandardMaterial({ color: 0x4a5258, roughness: 0.4, metalness: 0.6 })
  const cableGeo = new THREE.CylinderGeometry(0.008, 0.008, 1, 6)
  const up = new THREE.Vector3(0, 1, 0)

  const craft = [0, 1].map((i) => {
    const holder = new THREE.Group()
    const { drone, props } = buildDrone()
    drone.rotation.set(0.28, i ? -0.45 : 0.45, 0)
    holder.add(drone)
    scene.add(holder)
    const cable = new THREE.Mesh(cableGeo, cableMat)
    scene.add(cable)
    return { holder, props, cable, pos: null, vx: 0, vy: 0 }
  })

  let worldPerPx = 0.01
  let W = 1
  let H = 1
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

  let corners = null // [{x,y},{x,y}] card top corners in px
  let lift = 1 // cable length as a multiple of the drone size
  const clock = new THREE.Clock()
  let raf = 0
  const a = new THREE.Vector3()

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime
    if (!corners) return
    // Drone size follows the card: ~38% of its width, within limits
    const cardW = Math.abs(corners[1].x - corners[0].x)
    const sizePx = THREE.MathUtils.clamp(cardW * 0.42, W < 560 ? 96 : 110, 210)
    const scale = (sizePx * worldPerPx) / 2.7
    const rise = sizePx * 0.62 * lift // drone height above the corner (px)

    craft.forEach((c, i) => {
      const corner = corners[i]
      // A little outside the corner when there's room; inward on narrow screens
      const room = THREE.MathUtils.clamp((W - cardW) / (sizePx * 1.1), 0, 1)
      const sideOut = (i ? 1 : -1) * sizePx * (0.18 * room - 0.22 * (1 - room))
      const bob = reduced ? 0 : Math.sin(t * 1.6 + i * 1.3) * 3
      const target = toWorld(corner.x + sideOut, corner.y - rise + bob)
      if (!c.pos) c.pos = target.clone()
      const px = c.pos.x
      const py = c.pos.y
      c.pos.x = damp(c.pos.x, target.x, 14, dt)
      c.pos.y = damp(c.pos.y, target.y, 14, dt)
      c.vx = damp(c.vx, (c.pos.x - px) / Math.max(dt, 1e-3), 6, dt)
      c.vy = damp(c.vy, (c.pos.y - py) / Math.max(dt, 1e-3), 6, dt)
      c.holder.position.copy(c.pos)
      c.holder.scale.setScalar(scale)
      // Lean into motion: nose down when descending, bank when sliding
      c.holder.rotation.set(
        THREE.MathUtils.clamp(-c.vy * 0.06, -0.3, 0.3),
        0,
        THREE.MathUtils.clamp(-c.vx * 0.08, -0.35, 0.35)
      )
      for (const p of c.props) p.group.rotation.y += (reduced ? 0 : 40) * dt * p.dir

      // Cable: drone belly → card corner
      a.set(0, -0.3, 0).multiplyScalar(scale).add(c.pos)
      const b = toWorld(corner.x, corner.y)
      const d = b.clone().sub(a)
      c.cable.position.copy(a).addScaledVector(d, 0.5)
      c.cable.scale.set(1, Math.max(d.length(), 1e-3), 1)
      c.cable.quaternion.setFromUnitVectors(up, d.normalize())
    })

    renderer.render(scene, camera)
  }
  tick()

  // Compile every shader up front (in the background where supported) and
  // render once, so the first frames of the fly-in have nothing left to do.
  const ready = renderer
    .compileAsync(scene, camera)
    .catch(() => {})
    .then(() => renderer.render(scene, camera))

  return {
    ready,
    setCorners: (c, l = 1) => {
      corners = c
      lift = l
    },
    dispose: () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      scene.traverse((o) => {
        o.geometry?.dispose()
        if (o.material) [].concat(o.material).forEach((m) => { m.map?.dispose?.(); m.dispose() })
      })
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss() // free the GPU context now, not at GC
      renderer.domElement.remove()
    },
  }
}
