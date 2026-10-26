import * as THREE from 'three'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js'

// A mountain range generated from noise (no model file), shaded like a survey
// render: soft relief, glowing contour lines and a scanning band that sweeps
// across it — after the closing terrain on drone.riotters.com. The camera
// drifts with scroll and leans toward the pointer, all damped.

const damp = (c, t, l, dt) => c + (t - c) * (1 - Math.exp(-l * dt))

const VERT = /* glsl */ `
  varying float vH;
  varying vec3 vN;
  varying vec3 vW;
  void main() {
    vH = position.z;
    vN = normalize(normalMatrix * normal);
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

const FRAG = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uShade;
  uniform vec3 uLine;
  uniform vec3 uFog;
  uniform float uTime;
  uniform float uScan;
  varying float vH;
  varying vec3 vN;
  varying vec3 vW;
  void main() {
    vec3 L = normalize(vec3(-0.4, 0.8, 0.5));
    float diff = clamp(dot(normalize(vN), L), 0.0, 1.0);
    vec3 col = mix(uShade, uBase, 0.35 + 0.65 * diff);

    // Contour lines every fixed height step, anti-aliased with fwidth
    float h = vH * 9.0;
    float f = abs(fract(h) - 0.5);
    float line = smoothstep(0.5 - fwidth(h) * 1.4, 0.5, f);
    float h5 = h * 0.2;
    float major = smoothstep(0.5 - fwidth(h5) * 1.6, 0.5, abs(fract(h5) - 0.5));
    col = mix(col, uLine, clamp(line * 0.4 + major * 0.55, 0.0, 1.0));

    // Scanning band sweeping across the range
    float band = exp(-pow((vW.x - uScan) * 2.2, 2.0));
    col = mix(col, uLine, band * 0.18);
    col += uLine * band * line * 0.8;

    // Fade the edges into the page background
    float r = length(vW.xz) / 7.5;
    float fog = smoothstep(0.38, 0.78, r);
    gl_FragColor = vec4(mix(col, uFog, fog), 1.0);
  }
`

export function mountTerrain(container, { dark = false, pins = [] } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const small = window.innerWidth < 768
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75))
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)

  // Heightfield: ridged fractal noise shaped into a central massif
  const SEG = small ? 140 : 220
  const SIZE = 14
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG)
  const noise = new ImprovedNoise()
  const pos = geo.attributes.position
  const heightAt = (x, y) => {
    let h = 0
    let amp = 1
    let freq = 0.18
    for (let o = 0; o < 5; o++) {
      const n = 1 - Math.abs(noise.noise(x * freq, y * freq, 1.7))
      h += n * n * amp
      amp *= 0.5
      freq *= 2.05
    }
    const r = Math.hypot(x * 0.9, y + 1) / 6
    const mask = Math.max(0, 1 - r * r)
    return h * 1.55 * mask
  }
  for (let i = 0; i < pos.count; i++) pos.setZ(i, heightAt(pos.getX(i), pos.getY(i)))
  geo.computeVertexNormals()

  const uniforms = {
    uBase: { value: new THREE.Color() },
    uShade: { value: new THREE.Color() },
    uLine: { value: new THREE.Color() },
    uFog: { value: new THREE.Color() },
    uTime: { value: 0 },
    uScan: { value: -6 },
  }
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  scene.add(mesh)

  const setTheme = (isDark) => {
    uniforms.uBase.value.set(isDark ? 0x3a3f45 : 0xf4f6f7)
    uniforms.uShade.value.set(isDark ? 0x111316 : 0xb9c3ca)
    uniforms.uLine.value.set(isDark ? 0x6fd3ff : 0x3fb6ef)
    uniforms.uFog.value.set(isDark ? 0x0b0b0c : 0xfaf9f7)
  }
  setTheme(dark)

  // Pins: world positions on the surface, projected to HTML each frame
  const pinWorld = pins.map((p) => {
    const y = heightAt(p.x, -p.z)
    return new THREE.Vector3(p.x, y, p.z)
  })

  const pointer = { x: 0, y: 0 }
  const onMove = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('pointermove', onMove, { passive: true })

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  let visible = false
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
  })
  io.observe(container)

  let progress = 0
  let onPins = () => {}
  const cam = { az: 0, el: 0, dist: 0, lx: 0, ly: 0 }
  const tmp = new THREE.Vector3()
  const clock = new THREE.Clock()
  let raf = 0
  const tick = () => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(clock.getDelta(), 0.05)
    if (!visible || document.hidden) return
    const t = clock.elapsedTime

    // Scroll swings the camera around and down toward the peaks
    cam.az = damp(cam.az, -0.6 + progress * 0.9 + (reduced ? 0 : t * 0.015), 2.5, dt)
    cam.el = damp(cam.el, 0.62 - progress * 0.22, 2.5, dt)
    cam.dist = damp(cam.dist, (small ? 13 : 11) - progress * 2.2, 2.5, dt)
    cam.lx = damp(cam.lx, pointer.x * 0.35, 3, dt)
    cam.ly = damp(cam.ly, pointer.y * 0.15, 3, dt)
    const az = cam.az + cam.lx
    const el = cam.el - cam.ly
    camera.position.set(Math.sin(az) * Math.cos(el) * cam.dist, Math.sin(el) * cam.dist, Math.cos(az) * Math.cos(el) * cam.dist)
    camera.lookAt(0, 0.7, 0)

    uniforms.uTime.value = t
    uniforms.uScan.value = reduced ? 1 : ((t * 1.1) % 16) - 8

    const { clientWidth: w, clientHeight: h } = container
    onPins(
      pinWorld.map((p) => {
        tmp.copy(p).project(camera)
        return { x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h, hidden: tmp.z > 1 }
      })
    )
    renderer.render(scene, camera)
  }
  tick()

  return {
    setProgress: (p) => {
      progress = p
    },
    setTheme,
    onPins: (fn) => {
      onPins = fn
    },
    dispose: () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      ro.disconnect()
      io.disconnect()
      geo.dispose()
      mat.dispose()
      renderer.dispose()
      renderer.forceContextLoss() // free the GPU context now, not at GC
      renderer.domElement.remove()
    },
  }
}
