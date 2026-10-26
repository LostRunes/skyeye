// Keeps the site's 3D scenes from silently going blank.
//
// - importScene: retries a scene's code download; if it still fails (usually
//   because a new deploy replaced the file this tab was built against), the
//   page reloads once to pick up the new build.
// - resilient: mounts a scene and, if the browser drops its WebGL context
//   (phones run out of contexts or GPU memory; drivers reset), tears it down
//   and mounts a fresh one, replaying the latest setter calls (theme,
//   progress...) so it picks up where it was.

const RELOAD_FLAG = 'skyeye-reloaded-for-chunk'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export async function importScene(load, tries = 3) {
  for (let i = 0; ; i++) {
    try {
      const mod = await load()
      try {
        sessionStorage.removeItem(RELOAD_FLAG)
      } catch {
        /* storage blocked */
      }
      return mod
    } catch (err) {
      if (i < tries - 1) {
        await wait(600 * (i + 1))
        continue
      }
      let reloaded = true
      try {
        reloaded = sessionStorage.getItem(RELOAD_FLAG) === '1'
        if (!reloaded) sessionStorage.setItem(RELOAD_FLAG, '1')
      } catch {
        /* storage blocked: don't risk a reload loop */
      }
      if (!reloaded) window.location.reload()
      throw err
    }
  }
}

export function resilient(mount, container, opts) {
  let inst = null
  let dead = false
  let restarts = 0
  const calls = new Map() // latest arguments per setter, replayed after a restart

  const start = () => {
    inst = mount(container, opts)
    for (const [k, args] of calls) inst[k]?.(...args)
    const canvas = [...container.querySelectorAll('canvas')].pop()
    canvas?.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault()
        if (dead || restarts++ >= 4) return
        setTimeout(() => {
          if (dead) return
          inst.dispose()
          start()
        }, 400)
      },
      { once: true }
    )
  }
  start()

  return new Proxy(
    {},
    {
      get(_, key) {
        if (key === 'dispose')
          return () => {
            dead = true
            inst.dispose()
          }
        const v = inst[key]
        if (typeof v !== 'function') return v
        return (...args) => {
          calls.set(key, args)
          return inst[key](...args)
        }
      },
    }
  )
}

/** loader.load with a couple of retries before giving up (flaky networks). */
export function loadWithRetry(loader, url, onLoad, onFail, tries = 3) {
  const attempt = (i) =>
    loader.load(url, onLoad, undefined, (err) => (i < tries - 1 ? setTimeout(() => attempt(i + 1), 700 * (i + 1)) : onFail(err)))
  attempt(0)
}
