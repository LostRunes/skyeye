import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { buildDrone } from './droneScene.js'
import { loadWithRetry } from './resilient.js'

// Home hero: the quadcopter CAD model, live. It arrives as a blueprint —
// edges drawing in part by part — then a scanner frame sweeps down through
// it and everything above the scan line turns solid. Built, the props spin
// up and it lifts into a hover. It banks towards the pointer, its gimbal
// camera follows the cursor, and it can be dragged round. Scrolling away
// lifts it out of frame. Every few seconds it is re-scanned: it dissolves
// back into blueprint from the top down, hangs as wireframe, then turns solid
// again. Callout labels (DOM, passed in) track 3D anchors.

const clamp01 = (v) => Math.min(Math.max(v, 0), 1)
const smooth = (t) => t * t * (3 - 2 * t)
const damp = (c, t, l, dt) => c + (t - c) * (1 - Math.exp(-l * dt))

const ORDER = ['airframe', 'arms', 'motors', 'props', 'camera']
const SPAN = 2.5 // world units across the propeller tips
// Timeline (seconds from model load)
const DRAW = [0.1, 1.1] // edges draw in, staggered by part
const SCAN = [1.0, 2.6] // scanner sweeps top → bottom
const SPIN = [2.4, 3.4] // props spin up, drone lifts
const CALLOUTS_AT = 3.0
// Re-scan cycle, after the intro: dissolve to blueprint, hold, rebuild
const CYCLE_FROM = 9 // first re-scan this long after load
const CYCLE = 12
const OUT = 1.3 // sweep: solid → blueprint
const HOLD = 0.8
const BACK = 1.4 // sweep: blueprint → solid

export function mountHero(container, { dark = false, labels = [], modelUrl = '/models/quad-assembly.glb' } = {}) {
  let disposed = false
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.localClippingEnabled = true
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
  const accent = new THREE.Color(0xff5a1f)
  const scanPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const edges = [] // { line, part }
  const solids = [] // materials clipped by the scan
  const props = []
  let gimbal = null
  let bounds = { top: 1, bottom: -1 }
  const anchors = {} // label key → rig-local point
  let loadedAt = -1

  // Scanner frame: a square outline and faint fill riding the scan line
  const scanner = new THREE.Group()
  const sq = SPAN * 0.4
  const outline = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-sq, 0, -sq),
      new THREE.Vector3(sq, 0, -sq),
      new THREE.Vector3(sq, 0, sq),
      new THREE.Vector3(-sq, 0, sq),
    ]),
    new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0 })
  )
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(sq * 2, sq * 2).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
  )
  scanner.add(outline, fill)
  scene.add(scanner)

  const prepare = (root, partOf) => {
    root.traverse((m) => {
      if (!m.isMesh) return
      m.material = m.material.clone()
      m.material.clippingPlanes = [scanPlane]
      solids.push(m.material)
      const line = new THREE.LineSegments(
        new THREE.EdgesGeometry(m.geometry, 28),
        new THREE.LineBasicMaterial({ color: blueprint, transparent: true, opacity: 0, depthWrite: false })
      )
      m.add(line)
      edges.push({ line, part: partOf(m) })
    })
  }

  const useModel = (gltf) => {
    const root = gltf.scene
    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    const unit = SPAN / Math.max(size.x, size.z)
    const model = new THREE.Group()
    model.scale.setScalar(unit)
    model.rotation.y = Math.PI / 2 // gimbal camera towards the viewer
    root.position.sub(box.getCenter(new THREE.Vector3()))
    model.add(root)
    rig.add(model)
    // Same light restyle as the About page: white arms
    root.traverse((m) => {
      if (!m.isMesh || !m.material?.color) return
      const c = m.material.color
      if (Math.abs(c.r - 0.31) < 0.06 && Math.abs(c.g - 0.4) < 0.06) c.set(0xe9ecef)
    })
    const groups = Object.fromEntries(root.children.map((g) => [g.name, g]))
    const partOf = (m) => {
      for (let o = m; o; o = o.parent) if (groups[o.name] === o) return o.name
      return 'airframe'
    }
    prepare(root, partOf)
    groups.props?.children.forEach((obj, i) => props.push({ group: obj, dir: i % 2 ? -1 : 1 }))

    // Gimbal head on a pivot so it can pan and tilt (camera looks along -x)
    if (groups.camera) {
      const pivot = new THREE.Group()
      pivot.position.set(-0.08, -0.02, 0)
      groups.camera.add(pivot)
      groups.camera.children
        .filter((o) => /Zenmuse|GoPro/i.test(o.name))
        .forEach((o) => {
          o.position.sub(pivot.position)
          pivot.add(o)
        })
      gimbal = { pivot, yaw: 0, pitch: 0 }
    }

    // Callout anchors, in rig space (the rig is still at rest here)
    rig.updateMatrixWorld(true)
    const all = new THREE.Box3().setFromObject(model)
    bounds = { top: all.max.y + 0.05, bottom: all.min.y - 0.05 }
    const local = (v) => rig.worldToLocal(v)
    if (groups.airframe) {
      const b = new THREE.Box3().setFromObject(groups.airframe)
      anchors.fc = local(new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2))
    }
    if (groups.motors) {
      // The motor nearest the viewer on the right-hand side
      let best = null
      let score = -Infinity
      for (const m of groups.motors.children) {
        const c = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3())
        const s = c.x + c.z * 0.6
        if (s > score) {
          score = s
          best = c
        }
      }
      if (best) anchors.motor = local(best)
    }
    if (gimbal) {
      const b = new THREE.Box3().setFromObject(gimbal.pivot)
      anchors.gimbal = local(b.getCenter(new THREE.Vector3()))
    }
    loadedAt = clock.elapsedTime
  }

  // Fallback: the site's code-built drone, no scan or callouts
  const useProcedural = () => {
    const { drone, props: pr } = buildDrone()
    rig.add(drone)
    prepare(drone, () => 'airframe')
    props.push(...pr)
    bounds = { top: 1, bottom: -1 }
    loadedAt = clock.elapsedTime
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

  let currentDark = dark
  const setTheme = (isDark) => {
    currentDark = isDark
    blueprint.set(isDark ? 0x6fb6ff : 0x2563b8)
    edges.forEach(({ line }) => line.material.color.copy(blueprint))
    renderer.toneMappingExposure = isDark ? 1.25 : 1.05
  }
  setTheme(dark)

  // Pointer: tilt + gimbal aim; drag to spin (with inertia)
  const pointer = { x: 0, y: 0 }
  const drag = { on: false, x: 0, yaw: 0, vel: 0 }
  const onMove = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    if (drag.on) {
      const dx = (e.clientX - drag.x) / window.innerWidth
      drag.x = e.clientX
      drag.yaw += dx * 5
      drag.vel = dx * 5 * 60
    }
  }
  const onDown = (e) => {
    drag.on = true
    drag.x = e.clientX
    drag.vel = 0
    container.classList.add('is-dragging')
  }
  const onUp = () => {
    drag.on = false
    container.classList.remove('is-dragging')
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  container.addEventListener('pointerdown', onDown)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)

  let wide = true
  let W = 1
  let H = 1
  const resize = () => {
    W = container.clientWidth
    H = container.clientHeight
    if (!W || !H) return
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    camera.updateProjectionMatrix()
    wide = W / H > 1.15
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  let visible = true
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
  })
  io.observe(container)

  let scroll = 0
  let spinSpeed = 0
  const clock = new THREE.Clock()
  const look = { x: 0, y: 0 }
  const aim = new THREE.Vector3()
  const aimDir = new THREE.Vector3()
  const p = new THREE.Vector3()
  let raf = 0

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(clock.getDelta(), 0.05)
    if (!visible || document.hidden) return
    const t = clock.elapsedTime
    const since = loadedAt < 0 ? -1 : reduced ? 99 : t - loadedAt

    // Framing: drone to the right of the copy on wide screens, above it on tall ones
    const dist = wide ? 6.3 : 11.5
    camera.position.set(0, wide ? 1.35 : 1.9, dist)
    camera.lookAt(wide ? -1.35 : 0, wide ? 0.05 : -1.55, 0)

    // 1. Edges draw in, part by part
    const drawK = (part) => {
      const i = Math.max(ORDER.indexOf(part), 0)
      const span = (DRAW[1] - DRAW[0]) / ORDER.length
      return smooth(clamp01((since - DRAW[0] - i * span * 0.7) / (span * 1.6)))
    }
    // 2. Scan line. `keepAbove`: solid above the line (building) or below it
    // (dissolving); `wire` is how much of the model is blueprint (edge weight);
    // `sweep` is the scanner's progress while one is running, else -1.
    const lineAt = (k) => bounds.top + (bounds.bottom - bounds.top) * k
    let scanY = 99
    let keepAbove = true
    let wire = 1
    let sweep = -1
    if (since >= 0 && since < SCAN[1] + 0.1) {
      const k = smooth(clamp01((since - SCAN[0]) / (SCAN[1] - SCAN[0])))
      scanY = lineAt(k)
      wire = 1 - k
      if (since >= SCAN[0] && k < 1) sweep = k
    } else if (since >= 0) {
      scanY = lineAt(1)
      wire = 0
      const c = reduced ? -1 : (since - CYCLE_FROM) % CYCLE
      if (since >= CYCLE_FROM && c < OUT) {
        const k = smooth(c / OUT)
        keepAbove = false
        scanY = lineAt(k)
        wire = k
        sweep = k
      } else if (since >= CYCLE_FROM && c < OUT + HOLD) {
        keepAbove = false
        scanY = lineAt(1)
        wire = 1
      } else if (since >= CYCLE_FROM && c < OUT + HOLD + BACK) {
        const k = smooth((c - OUT - HOLD) / BACK)
        scanY = lineAt(k)
        wire = 1 - k
        sweep = k
      }
    }
    const lift = smooth(clamp01((since - SPIN[0]) / (SPIN[1] - SPIN[0])))

    // Rig motion: hover, idle sway, drag, pointer bank, scroll exit
    look.x = damp(look.x, pointer.x, 3, dt)
    look.y = damp(look.y, pointer.y, 3, dt)
    if (!drag.on) {
      drag.yaw += drag.vel * dt
      drag.vel = damp(drag.vel, 0, 2.5, dt)
    }
    const idle = reduced ? 0 : Math.sin(t * 0.32) * 0.32
    const hover = reduced ? 0 : lift * Math.sin(t * 1.4) * 0.05
    const exit = smooth(clamp01(scroll * 1.15))
    rig.position.set(exit * (wide ? 1.4 : 0.6), lift * 0.25 + hover + exit * 3.2, 0)
    rig.rotation.set(
      lift * (look.y * 0.08) + exit * 0.35,
      -0.35 + idle * lift + drag.yaw + look.x * 0.15 * lift,
      -look.x * 0.1 * lift - exit * 0.2,
      'YXZ'
    )
    rig.updateMatrixWorld()

    // The scan plane rides in the rig's frame so it cuts straight across the model
    p.set(0, scanY, 0)
    rig.localToWorld(p)
    // and keeps the solid side of it
    scanPlane.normal.set(0, keepAbove ? 1 : -1, 0).applyQuaternion(rig.quaternion)
    scanPlane.constant = -scanPlane.normal.dot(p)

    for (const e of edges) {
      const drawn = drawK(e.part)
      const base = 0.85 * drawn
      e.line.material.opacity = since < 0 ? 0 : 0.05 + (base - 0.05) * wire
    }

    scanner.visible = sweep >= 0
    if (sweep >= 0) {
      scanner.position.copy(p)
      scanner.quaternion.copy(rig.quaternion)
      const fade = Math.sin(sweep * Math.PI)
      outline.material.opacity = 0.9 * fade
      fill.material.opacity = 0.07 * fade
    }

    spinSpeed = damp(spinSpeed, reduced ? 0 : lift * 38 + exit * 14, 3, dt)
    for (const pr of props) pr.group.rotation.y += spinSpeed * dt * pr.dir

    // Gimbal camera follows the cursor once it's built
    if (gimbal) {
      let yaw = 0
      let pitch = 0
      if (lift > 0) {
        camera.updateMatrixWorld()
        const pivotWorld = gimbal.pivot.getWorldPosition(aim)
        const d = camera.position.distanceTo(pivotWorld)
        aimDir.set(look.x, -look.y, 0.5).unproject(camera).sub(camera.position).normalize()
        aim.copy(camera.position).addScaledVector(aimDir, d * 0.55)
        gimbal.pivot.parent.worldToLocal(aim).sub(gimbal.pivot.position)
        yaw = Math.max(-1.3, Math.min(1.3, Math.atan2(aim.z, -aim.x))) * lift
        pitch = Math.max(-0.9, Math.min(0.45, -Math.atan2(aim.y, Math.hypot(aim.x, aim.z)))) * lift
      }
      gimbal.yaw = damp(gimbal.yaw, yaw, 5, dt)
      gimbal.pitch = damp(gimbal.pitch, pitch, 5, dt)
      gimbal.pivot.rotation.set(0, gimbal.yaw, gimbal.pitch, 'YZX')
    }

    // Callouts: project each anchor to the canvas and place its label there,
    // on the side facing away from the drone's centre so labels don't collide
    camera.updateMatrixWorld()
    p.setFromMatrixPosition(rig.matrixWorld).project(camera)
    const cx = (p.x * 0.5 + 0.5) * W
    const cy = (-p.y * 0.5 + 0.5) * H
    const placed = [] // label boxes so far, to stack any that would overlap
    labels.forEach((el, i) => {
      const a = anchors[el.dataset.anchor]
      if (!a) {
        el.style.opacity = '0'
        return
      }
      p.copy(a).applyMatrix4(rig.matrixWorld).project(camera)
      const x = (p.x * 0.5 + 0.5) * W
      const y = (-p.y * 0.5 + 0.5) * H
      const show = clamp01((since - CALLOUTS_AT - i * 0.25) / 0.5) * (1 - clamp01(scroll * 4))
      // Flip sides when the label would run off-screen or into the copy
      // (the left ~55% on wide screens)
      const lw = (el.lastChild.offsetWidth || 160) + 58
      let side = x < cx - 8 ? 'l' : x > cx + 8 ? 'r' : el.dataset.dir?.[0] || 'r'
      if (side === 'l' && x - lw < (wide ? W * 0.45 : 8)) side = 'r'
      else if (side === 'r' && x + lw > W - 8) side = 'l'
      const up = y < cy
      const dir = `${side}${up ? 'u' : 'd'}`
      if (el.dataset.dir !== dir) el.dataset.dir = dir
      const left = side === 'r' ? x + 54 : x - lw
      let top = y + (up ? -52 : 26)
      let dy = 0
      for (let guard = 0; guard < 4; guard++) {
        const hit = placed.find((b) => left < b.r && left + lw > b.l && top < b.b && top + 30 > b.t)
        if (!hit) break
        const step = up ? hit.t - 34 - top : hit.b + 4 - top
        dy += step
        top += step
      }
      placed.push({ l: left, r: left + lw, t: top, b: top + 30 })
      el.style.setProperty('--dy', `${dy}px`)
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      el.style.opacity = show.toFixed(3)
    })

    renderer.render(scene, camera)
  }
  tick()

  return {
    setScroll: (v) => {
      scroll = clamp01(v)
    },
    setTheme,
    dispose: () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      scene.traverse((o) => {
        o.geometry?.dispose()
        if (o.material) [].concat(o.material).forEach((m) => m.dispose())
      })
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss() // free the GPU context now, not at GC
      renderer.domElement.remove()
    },
  }
}
