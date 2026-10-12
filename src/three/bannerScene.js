import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildDrone } from './droneScene.js'

// Skyvertising: the Sky Eye drone towing a vertical cloth banner with the
// company logo and name. The cloth is animated in a vertex shader — wind
// ripple, swing from the drone's motion, a ripple from wherever the pointer
// touches it, and a flip that rolls down its length on hover.
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

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uFlip;
  uniform float uFlipOn;
  uniform vec2 uHit;
  uniform float uHitAmp;
  uniform float uHitTime;
  uniform float uSwing;
  uniform float uAmp;
  varying vec2 vUv;
  varying vec3 vPos;

  void main() {
    vUv = uv;
    vec3 p = position;
    float down = 1.0 - uv.y;                 // 0 at the top hem, 1 at the bottom
    float free = down * (0.6 + 0.4 * down);  // the top is held by the cables

    // Wind: waves travelling down the cloth, rippling across it
    float wave = sin(down * 7.0 - uTime * 3.0 + uv.x * 2.0) * 0.16
               + sin(down * 13.0 - uTime * 4.3 + uv.x * 5.0) * 0.05;
    p.z += wave * uAmp * free;
    p.x += sin(down * 5.0 - uTime * 2.2) * 0.05 * uAmp * free;

    // Swing from the drone's motion: the tail trails and the cloth bows
    p.x -= uSwing * 0.7 * free * down;
    p.z -= abs(uSwing) * 0.35 * sin(down * 3.14159);

    // Pointer ripple spreading from the contact point
    vec2 d = (uv - uHit) * vec2(${(BW / BH).toFixed(3)}, 1.0);
    float dist = length(d);
    float ring = sin(dist * 18.0 - uHitTime * 9.0) * exp(-dist * 2.6) * exp(-uHitTime * 1.1);
    p.z += ring * 0.28 * uHitAmp * (0.3 + free);
    p.z += exp(-dist * dist * 16.0) * 0.16 * uHitAmp;

    // Rolling flip: a full turn of the cloth around its vertical centre line,
    // travelling from the top hem to the bottom. The top stays put.
    float a = 6.28318 * smoothstep(uFlip - 0.3, uFlip, down) * uFlipOn;
    float cx = p.x;
    float cz = p.z;
    p.x = cx * cos(a) - cz * sin(a);
    p.z = cx * sin(a) + cz * cos(a);

    vec4 world = modelMatrix * vec4(p, 1.0);
    vPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    // Mirror the print on the back so it reads correctly from either side
    vec2 uv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
    vec4 tex = texture2D(uMap, uv);
    vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
    vec3 L = normalize(vec3(0.35, 0.5, 0.8));
    float diff = abs(dot(n, L));
    vec3 col = tex.rgb * (0.55 + 0.6 * diff) + pow(diff, 24.0) * 0.3;
    gl_FragColor = vec4(col, 1.0);
  }
`

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
  const key = new THREE.DirectionalLight(0xffffff, 1.3)
  key.position.set(3, 6, 5)
  scene.add(key)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xaab4bb, 0.6))

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0, 10)

  // Rig = drone + banner; placed and scaled as one
  const rig = new THREE.Group()
  scene.add(rig)
  const { drone, props } = buildDrone()
  drone.scale.setScalar(0.6)
  drone.rotation.set(0.22, 0.35, 0)
  rig.add(drone)

  const bannerPivot = new THREE.Group() // hangs from the drone, swings
  bannerPivot.position.y = -0.29
  rig.add(bannerPivot)
  const tex = bannerTexture(logoUrl)
  const uniforms = {
    uTime: { value: 0 },
    uFlip: { value: 0 },
    uFlipOn: { value: 0 },
    uHit: { value: new THREE.Vector2(0.5, 0.5) },
    uHitAmp: { value: 0 },
    uHitTime: { value: 10 },
    uSwing: { value: 0 },
    uAmp: { value: reduced ? 0.2 : 1 },
    uMap: { value: tex },
  }
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(BW, BH, 36, 120),
    new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, side: THREE.DoubleSide })
  )
  banner.position.y = -DROP - BH / 2
  bannerPivot.add(banner)

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

  // Pointer: tracked on window so the overlay can stay click-through
  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2(9, 9)
  const pointer = { x: 0, active: false }
  const onMove = (e) => {
    const r = renderer.domElement.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1
    pointer.active = e.clientY >= r.top && e.clientY <= r.bottom
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
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    if (visible) entered = true
  }, { threshold: 0.1 })
  io.observe(container)

  // Pose target (CSS px, banner centre). Overlay mode gets it from the page.
  const pose = { x: -300, y: 300, size: 110, show: 0 }
  const cur = { x: -300, y: 300, size: 110 }
  let vx = 0
  let swing = 0
  let hovering = false
  let flipT = 1
  let cooldown = 0
  const clock = new THREE.Clock()
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  let raf = 0

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(clock.getDelta(), 0.05)
    if (document.hidden) return
    if (overlay ? !pose.show && Math.abs(cur.x - pose.x) < 1 : !visible) return
    const t = clock.elapsedTime
    uniforms.uTime.value = t

    if (!overlay) {
      // Inline: fly in from the left, then hover centre and drift to the pointer
      pose.x = entered ? viewW / 2 + (pointer.active ? pointer.x * viewW * 0.12 : Math.sin(t * 0.35) * viewW * 0.08) : -300
      pose.y = viewH * 0.55
      pose.size = Math.min(viewW * 0.3, viewH * 0.17)
    }

    const px = cur.x
    cur.x = damp(cur.x, pose.x, 1.8, dt)
    cur.y = damp(cur.y, pose.y, 2.2, dt)
    cur.size = damp(cur.size, pose.size, 2.5, dt)
    vx = damp(vx, (cur.x - px) / Math.max(dt, 1e-3), 5, dt)

    // Pixel pose → world. The pose is the banner's centre.
    const scale = (cur.size * worldPerPx) / BW
    const bob = reduced ? 0 : Math.sin(t * 1.3) * 0.06
    const wx = (cur.x - viewW / 2) * worldPerPx
    const wy = -(cur.y - viewH / 2) * worldPerPx + (0.29 + DROP + BH / 2) * scale
    rig.position.set(wx, wy + bob * scale, 0)
    rig.scale.setScalar(scale)
    rig.rotation.z = THREE.MathUtils.clamp(-vx * 0.0004, -0.18, 0.18)
    for (const p of props) p.group.rotation.y += (reduced ? 0 : 38) * dt * p.dir

    // The banner swings behind the drone's motion
    swing = damp(swing, THREE.MathUtils.clamp(vx * 0.0012, -1, 1), 3, dt)
    bannerPivot.rotation.z = -swing * 0.25
    uniforms.uSwing.value = swing

    // Hover: ripple from the contact point, and a flip on first touch
    raycaster.setFromCamera(ndc, camera)
    const hit = raycaster.intersectObject(banner, false)[0]
    if (hit && hit.uv) {
      uniforms.uHit.value.lerp(hit.uv, 1 - Math.exp(-12 * dt))
      uniforms.uHitAmp.value = damp(uniforms.uHitAmp.value, 1, 6, dt)
      uniforms.uHitTime.value = hovering ? uniforms.uHitTime.value + dt : 0
      if (!hovering && flipT >= 1 && cooldown <= 0 && !reduced) flipT = 0
      hovering = true
    } else {
      uniforms.uHitAmp.value = damp(uniforms.uHitAmp.value, 0, 2.5, dt)
      uniforms.uHitTime.value += dt
      hovering = false
    }
    if (flipT < 1) {
      flipT = Math.min(1, flipT + dt / 1.5)
      uniforms.uFlip.value = flipT * 1.35
      uniforms.uFlipOn.value = 1
      if (flipT >= 1) cooldown = 0.6
    } else {
      uniforms.uFlipOn.value = 0
      cooldown -= dt
    }

    // Cables, in rig space: drone belly → banner top corners
    bannerPivot.updateMatrix()
    cables.forEach((line, i) => {
      a.set(i ? 0.17 : -0.17, -0.17, 0.07)
      b.set((i ? 1 : -1) * BW * 0.5, -DROP, 0).applyMatrix4(bannerPivot.matrix)
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
        if (o.material) [].concat(o.material).forEach((m) => { m.map?.dispose?.(); m.dispose() })
      })
      tex.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
