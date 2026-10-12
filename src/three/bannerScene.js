import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildDrone } from './droneScene.js'

// Skyvertising stage: the Sky Eye drone flies in towing a cloth banner that
// reads SKYVERTISING. The cloth is animated in a vertex shader — a constant
// wind ripple, a lag/swing from the drone's motion, a ripple that spreads from
// wherever the pointer touches it, and a "flip" that rolls along the banner
// like a ribbon turning over in the air. Every motion is a damped chase.

const damp = (c, t, l, dt) => c + (t - c) * (1 - Math.exp(-l * dt))

const W = 5.2 // banner width
const H = 1.35 // banner height

function bannerTexture() {
  const c = document.createElement('canvas')
  c.width = 2048
  c.height = 532
  const g = c.getContext('2d')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const draw = () => {
  // Deep navy cloth with a faint LED-dot grid, like the brochure's LED net
  const bg = g.createLinearGradient(0, 0, 0, c.height)
  bg.addColorStop(0, '#13204a')
  bg.addColorStop(1, '#0a1230')
  g.fillStyle = bg
  g.fillRect(0, 0, c.width, c.height)
  g.fillStyle = 'rgba(120,160,255,0.10)'
  for (let y = 10; y < c.height; y += 16) for (let x = 10; x < c.width; x += 16) g.fillRect(x, y, 3, 3)
  // Edge hem
  g.strokeStyle = 'rgba(255,255,255,0.55)'
  g.lineWidth = 10
  g.strokeRect(14, 14, c.width - 28, c.height - 28)
  // Wordmark
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.shadowColor = 'rgba(90,150,255,0.85)'
  g.shadowBlur = 40
  g.fillStyle = '#ffffff'
  g.font = '800 250px "Geist", "Inter", "Arial Black", sans-serif'
  g.fillText('SKYVERTISING', c.width / 2, c.height / 2 - 20)
  g.shadowBlur = 0
  g.fillStyle = '#ff4f00'
  g.fillRect(c.width / 2 - 260, c.height - 118, 520, 10)
  g.fillStyle = 'rgba(255,255,255,0.75)'
  g.font = '600 46px "JetBrains Mono", "Courier New", monospace'
  g.fillText('SKY EYE TECHNOLOGY', c.width / 2, c.height - 70)
  t.needsUpdate = true
  }
  draw()
  // The wordmark uses the site's web fonts; redraw once they have loaded
  document.fonts?.load('800 250px "Geist"').then(draw).catch(() => {})
  return t
}

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uFlip;      // 0..1 position of the rolling flip
  uniform float uFlipOn;    // 0..1 strength of the flip
  uniform vec2 uHit;        // pointer contact point (uv)
  uniform float uHitAmp;    // ripple strength, decays after contact
  uniform float uHitTime;   // time since contact
  uniform vec2 uSwing;      // drone velocity → cloth lag
  uniform float uAmp;       // base wind amplitude
  varying vec2 vUv;
  varying vec3 vPos;

  void main() {
    vUv = uv;
    vec3 p = position;
    float u = uv.x;
    float fromTop = 1.0 - uv.y;            // 0 at the top hem, 1 at the bottom
    float freedom = 0.35 + 0.65 * fromTop; // the top hangs on cables, so it moves less

    // Wind: two travelling waves across the cloth
    float wave = sin(u * 8.0 - uTime * 3.0) * 0.17 + sin(u * 15.0 - uTime * 4.4 + uv.y * 3.0) * 0.06;
    p.z += wave * uAmp * freedom;
    p.y += sin(u * 6.0 - uTime * 2.4) * 0.03 * uAmp * fromTop;

    // Lag behind the drone: the bottom trails, the cloth bows
    p.x -= uSwing.x * 0.55 * fromTop * fromTop;
    p.z -= uSwing.x * 0.35 * sin(u * 3.14159) * fromTop;
    p.y += abs(uSwing.x) * 0.12 * fromTop;

    // Pointer ripple spreading from the contact point
    vec2 d = (uv - uHit) * vec2(${(W / H).toFixed(3)}, 1.0);
    float dist = length(d);
    float ring = sin(dist * 14.0 - uHitTime * 9.0) * exp(-dist * 2.2) * exp(-uHitTime * 1.2);
    p.z += ring * 0.32 * uHitAmp;
    p.z += exp(-dist * dist * 6.0) * 0.18 * uHitAmp; // push at the touch point

    // Rolling flip: a full turn of the cloth around its horizontal centre
    // line, travelling from left to right. Both ends finish at 0 or 2π, so
    // the hems stay level with the cables.
    float a = 6.28318 * smoothstep(uFlip - 0.28, uFlip, u) * uFlipOn;
    float cy = p.y;
    float cz = p.z;
    p.y = cy * cos(a) - cz * sin(a);
    p.z = cy * sin(a) + cz * cos(a);

    vec4 world = modelMatrix * vec4(p, 1.0);
    vPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uDark;
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    // Mirror the print on the back so it reads correctly from either side
    vec2 uv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
    vec4 tex = texture2D(uMap, uv);
    // Fold shading from the actual displaced surface
    vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
    vec3 L = normalize(vec3(0.3, 0.6, 0.8));
    float diff = abs(dot(n, L));
    float shade = 0.55 + 0.6 * diff;
    float sheen = pow(diff, 24.0) * 0.35;
    vec3 col = tex.rgb * shade + sheen;
    gl_FragColor = vec4(col, 1.0);
  }
`

export function mountBanner(container, { dark = false } = {}) {
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
  camera.position.set(0, 0.2, 13)

  // Drone
  const craft = new THREE.Group()
  const { drone, props } = buildDrone()
  drone.scale.setScalar(0.62)
  craft.add(drone)
  scene.add(craft)

  // Banner hangs below; its anchor chases the drone with extra lag
  const bannerGroup = new THREE.Group()
  scene.add(bannerGroup)
  const tex = bannerTexture()
  const uniforms = {
    uTime: { value: 0 },
    uFlip: { value: 0 },
    uFlipOn: { value: 0 },
    uHit: { value: new THREE.Vector2(0.5, 0.5) },
    uHitAmp: { value: 0 },
    uHitTime: { value: 10 },
    uSwing: { value: new THREE.Vector2() },
    uAmp: { value: reduced ? 0.2 : 1 },
    uMap: { value: tex },
    uDark: { value: dark ? 1 : 0 },
  }
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H, 160, 40),
    new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, side: THREE.DoubleSide })
  )
  bannerGroup.add(banner)
  const DROP = 1.15 // drone → banner top
  banner.position.y = -DROP - H / 2

  // Cables from the drone's belly to the banner's top corners
  // Thin rods rather than 1px lines, so the cables read at any size
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x5b636a, roughness: 0.4, metalness: 0.6 })
  const cableGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 6)
  const cables = [-1, 1].map(() => {
    const m = new THREE.Mesh(cableGeo, cableMat)
    scene.add(m)
    return m
  })
  const up = new THREE.Vector3(0, 1, 0)

  const setTheme = (isDark) => {
    uniforms.uDark.value = isDark ? 1 : 0
    cableMat.color.set(isDark ? 0x9aa3ab : 0x5b636a)
    renderer.toneMappingExposure = isDark ? 1.2 : 1.05
  }
  setTheme(dark)

  // Pointer → hover on the banner (raycast against the flat cloth)
  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2(9, 9)
  const pointer = { x: 0, active: false }
  let hovering = false
  let flipT = 1 // 1 = idle (flip finished)
  let cooldown = 0
  const onMove = (e) => {
    const r = renderer.domElement.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1
    pointer.active = e.clientY >= r.top && e.clientY <= r.bottom
  }
  const onLeave = () => {
    ndc.set(9, 9)
    pointer.active = false
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  renderer.domElement.addEventListener('pointerleave', onLeave)
  // Touch: a tap on the banner counts as a hover
  const onDown = (e) => onMove(e)
  window.addEventListener('pointerdown', onDown, { passive: true })

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // Fit the banner width on narrow screens
    camera.position.z = w / h < 0.8 ? 22 : w / h < 1.2 ? 14 : 9.5
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  let visible = false
  let entered = false
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    if (visible) entered = true
  }, { threshold: 0.15 })
  io.observe(container)

  // Flight: starts off-screen left, flies in when the section shows
  const pos = { x: -16, y: 1.2 }
  const anchor = { x: -16, y: 1.2 - DROP }
  let vx = 0
  const clock = new THREE.Clock()
  const tmp = new THREE.Vector3()
  let raf = 0

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(clock.getDelta(), 0.05)
    if (!visible || document.hidden) return
    const t = clock.elapsedTime
    uniforms.uTime.value = t

    // Target: centre, drifting a little toward the pointer
    const tx = entered ? (pointer.active ? pointer.x * 1.1 : Math.sin(t * 0.35) * 0.6) : -16
    const ty = 1.15 + (reduced ? 0 : Math.sin(t * 1.3) * 0.08)
    const px = pos.x
    pos.x = damp(pos.x, tx, entered && pos.x < -6 ? 1.1 : 1.6, dt)
    pos.y = damp(pos.y, ty, 3, dt)
    vx = damp(vx, (pos.x - px) / Math.max(dt, 1e-3), 5, dt)

    craft.position.set(pos.x, pos.y, 0)
    craft.rotation.set(0.18, 0.25 - vx * 0.05, THREE.MathUtils.clamp(-vx * 0.09, -0.4, 0.4))
    for (const p of props) p.group.rotation.y += (reduced ? 0 : 38) * dt * p.dir

    // Banner trails the drone
    anchor.x = damp(anchor.x, pos.x, 3.2, dt)
    anchor.y = damp(anchor.y, pos.y, 4, dt)
    bannerGroup.position.set(anchor.x, anchor.y, -0.1)
    bannerGroup.rotation.z = THREE.MathUtils.clamp((anchor.x - pos.x) * 0.06, -0.25, 0.25)
    uniforms.uSwing.value.set(THREE.MathUtils.clamp(vx * 0.12, -1.2, 1.2), 0)

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
    renderer.domElement.style.cursor = hit ? 'grab' : ''
    if (flipT < 1) {
      flipT = Math.min(1, flipT + dt / 1.6)
      uniforms.uFlip.value = flipT * 1.3
      uniforms.uFlipOn.value = 1
      if (flipT >= 1) cooldown = 0.6
    } else {
      uniforms.uFlipOn.value = 0
      cooldown -= dt
    }

    // Cables: drone belly → banner top corners (in world space)
    bannerGroup.updateMatrixWorld()
    craft.updateMatrixWorld()
    cables.forEach((line, i) => {
      const a = tmp.set(i ? 0.25 : -0.25, -0.2, 0).applyMatrix4(craft.matrixWorld).clone()
      const b = new THREE.Vector3((i ? 1 : -1) * W * 0.5, -DROP, 0).applyMatrix4(bannerGroup.matrixWorld)
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
    dispose: () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
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
