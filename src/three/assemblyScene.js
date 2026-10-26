import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { buildDrone } from './droneScene.js'
import { loadWithRetry } from './resilient.js'

// About Us: the Sky Eye drone assembling itself as you scroll — built from
// the same code model as the rest of the site, so no video frames.
// It starts as an exploded blueprint (wireframe parts spread out), then each
// part flies into place in build order, turning solid as it seats:
// airframe → arms → motors & landing gear → propellers → gimbal camera.
// Fully built, the propellers spin up, it lifts off and hovers, then flies
// out of frame. Once fitted, the gimbal camera turns to follow the cursor.

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
const OUT_FROM = 0.92

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
      return out.multiplyScalar(0.95).add(new THREE.Vector3(0, 0.15, 0))
    case 'motors':
      return out.multiplyScalar(1.3).add(new THREE.Vector3(0, 0.45 + pos.y * 0.4, 0))
    case 'props':
      return out.multiplyScalar(0.7).add(new THREE.Vector3(0, 1.35, 0))
    case 'camera':
      return new THREE.Vector3(0, -1.15, 0.9)
    default:
      return new THREE.Vector3()
  }
}

export function mountAssembly(container, { dark = false, modelUrl = '/models/quad-assembly.glb' } = {}) {
  let disposed = false
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
  const blueprint = new THREE.Color()
  const pieces = []
  const props = []
  let gimbal = null // { pivot, rest } — the camera head, aimed at the cursor

  // Each movable piece: home position, where it waits when exploded, and a
  // blueprint-edge overlay that fades as it turns solid.
  const addPiece = (obj, part, unit = 1) => {
    const home = obj.position.clone()
    const offset = explodeOffset(part, home.clone().multiplyScalar(unit)).divideScalar(unit)
    const spin = new THREE.Euler((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 0.9)
    const homeRot = obj.rotation.clone()
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
    pieces.push({ obj, part, home, offset, spin, homeRot, meshes, lag: Math.random() * 0.18 })
  }

  // The code-built drone, used only if the CAD model can't be loaded
  const useProcedural = () => {
    const { drone, props: pr, gimbalYaw } = buildDrone()
    rig.add(drone)
    const propSet = new Set(pr.map((x) => x.group))
    drone.children.slice().forEach((obj) => addPiece(obj, classify(obj, propSet, gimbalYaw)))
    props.push(...pr)
  }

  // The quadcopter CAD model (converted from STEP): its nodes come grouped as
  // airframe / arms / motors / props / camera, in metres.
  const SPAN = 2.5 // world units across the propeller tips
  const useModel = (gltf) => {
    const root = gltf.scene
    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    const unit = SPAN / Math.max(size.x, size.z)
    const model = new THREE.Group()
    model.scale.setScalar(unit)
    model.rotation.y = Math.PI / 2 // gimbal camera towards the viewer
    const centre = box.getCenter(new THREE.Vector3())
    root.position.sub(centre)
    model.add(root)
    rig.add(model)
    // Light restyle: white arms to match the site, darker props
    root.traverse((m) => {
      if (!m.isMesh || !m.material?.color) return
      const c = m.material.color
      if (Math.abs(c.r - 0.31) < 0.06 && Math.abs(c.g - 0.4) < 0.06) c.set(0xe9ecef)
    })
    const keys = new Set(PARTS.map((x) => x.key))
    root.children.forEach((group) => {
      if (!keys.has(group.name)) return
      group.children.slice().forEach((obj) => {
        addPiece(obj, group.name, unit)
        if (group.name === 'props') props.push({ group: obj, dir: props.length % 2 ? -1 : 1 })
      })
      // Hang the gimbal head (everything below the fixed mount) on a pivot
      // so it can pan and tilt; the camera looks out along the model's -x.
      if (group.name === 'camera') {
        const pivot = new THREE.Group()
        pivot.position.set(-0.08, -0.02, 0)
        group.add(pivot)
        for (const pc of pieces) {
          if (pc.part !== 'camera' || !/Zenmuse|GoPro/i.test(pc.obj.name)) continue
          pivot.add(pc.obj)
          pc.home.sub(pivot.position)
        }
        gimbal = { pivot, yaw: 0, pitch: 0 }
      }
    })
  }

  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  loadWithRetry(
    loader,
    modelUrl,
    (gltf) => {
      if (disposed) return
      useModel(gltf)
      setTheme(currentDark)
    },
    () => {
      if (disposed) return
      useProcedural()
      setTheme(currentDark)
    }
  )
  const range = Object.fromEntries(PARTS.map((p) => [p.key, p]))

  let currentDark = dark
  const setTheme = (isDark) => {
    currentDark = isDark
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
  const flyRight = new THREE.Vector3()
  const flyBack = new THREE.Vector3()
  const aim = new THREE.Vector3()
  const aimDir = new THREE.Vector3()
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

    // Built: props spin up, the drone lifts and banks into a turn, hovers,
    // then noses down and accelerates out of frame (up and to the right)
    const lift = smooth(clamp01((p - LIFT_FROM) / (OUT_FROM - LIFT_FROM)))
    const outT = clamp01((p - OUT_FROM) / (1 - OUT_FROM))
    const out = outT * outT
    spinSpeed = damp(spinSpeed, (p > 0.7 ? 6 : 0) + lift * 34 + outT * 16, 3, dt)
    if (!reduced) for (const pr of props) pr.group.rotation.y += spinSpeed * dt * pr.dir
    const hover = lift * Math.sin(t * 1.4) * 0.06

    // Camera orbits the build: three-quarter view, sweeping round as it assembles
    look.x = damp(look.x, pointer.x, 3, dt)
    look.y = damp(look.y, pointer.y, 3, dt)
    const az = 0.95 - p * 1.25 + look.x * 0.12
    const el = 0.42 - p * 0.18 + lift * 0.05 - look.y * 0.06
    const dist = (wide ? 12 : 15.5) - p * 1.8 - lift * 0.6
    camera.position.set(Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist)
    const lx = wide ? -1.05 : 0
    camera.lookAt(lx * Math.cos(az), 0.1 + lift * 0.5, -lx * Math.sin(az))
    rig.position.set(0, lift * 0.7 + hover, 0)
    rig.rotation.set(lift * 0.06, lift * 0.5, -lift * 0.08)
    if (out > 0) {
      // Fly-out direction in screen terms: right, up and away from the camera
      camera.updateMatrixWorld()
      const right = flyRight.setFromMatrixColumn(camera.matrixWorld, 0)
      const back = flyBack.setFromMatrixColumn(camera.matrixWorld, 2)
      rig.position.addScaledVector(right, out * (wide ? 9 : 6)).addScaledVector(back, -out * 6)
      rig.position.y += out * 7
      // Pitch into the direction of travel, banking as it goes
      rig.rotation.x += Math.min(outT * 2, 1) * 0.32
      rig.rotation.z -= Math.min(outT * 2, 1) * 0.28
    }

    // Gimbal camera follows the cursor: aim at a point between the viewer
    // and the drone along the cursor's ray, so it seems to look at you.
    if (gimbal) {
      const seated = clamp01((p - range.camera.to) / 0.03)
      let yaw = 0
      let pitch = 0
      if (seated > 0) {
        camera.updateMatrixWorld()
        rig.updateMatrixWorld()
        const pivotWorld = gimbal.pivot.getWorldPosition(aim)
        const d = camera.position.distanceTo(pivotWorld)
        aimDir.set(pointer.x, -pointer.y, 0.5).unproject(camera).sub(camera.position).normalize()
        aim.copy(camera.position).addScaledVector(aimDir, d * 0.55)
        gimbal.pivot.parent.worldToLocal(aim).sub(gimbal.pivot.position)
        yaw = Math.max(-1.3, Math.min(1.3, Math.atan2(aim.z, -aim.x))) * seated
        pitch = Math.max(-0.9, Math.min(0.45, -Math.atan2(aim.y, Math.hypot(aim.x, aim.z)))) * seated
      }
      gimbal.yaw = damp(gimbal.yaw, yaw, 5, dt)
      gimbal.pitch = damp(gimbal.pitch, pitch, 5, dt)
      gimbal.pivot.rotation.set(0, gimbal.yaw, gimbal.pitch, 'YZX')
    }

    renderer.render(scene, camera)
  }
  tick()

  return {
    setProgress: (v) => {
      target = clamp01(v)
    },
    setTheme,
    dispose: () => {
      disposed = true
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
      renderer.forceContextLoss() // free the GPU context now, not at GC
      renderer.domElement.remove()
    },
  }
}
