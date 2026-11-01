# Sky Eye Technology Website — Full Audit

> Reviewed: all 33 components, router, hooks, CDN helper, CSS, and HTML entry point.

---

## 🔴 Critical Bugs / Broken Functionality

### 1. Contact Form — No Validation, No Feedback
**File:** [`Contact.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/components/Contact.jsx)

- The email `<input>` is labelled "Phone or email" but has `autoComplete="email"` — a phone number would never autofill. Change to `autoComplete="tel email"` or split into two fields.
- `sendMail` opens `mailto:` which completely depends on the user having a mail client configured. On most phones/corporate laptops this silently fails. The form has no success/error feedback at all — the user never knows if anything happened.
- `sendWhatsApp` in `Contact.jsx` has no validation — it fires even on an empty form. Compare with `TrainingEnquiry.jsx` which correctly calls `f.reportValidity()` first. Fix: call `e.currentTarget.form.reportValidity()` before opening WhatsApp.
- The `message` `<textarea>` has no `required` attribute, so a completely empty enquiry can be submitted.

### 2. Dark-Mode Toggle Silently Navigates Away
**File:** [`useTheme.js`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/hooks/useTheme.js#L32-L46)

Toggling to dark mode forcibly redirects to `#/` (home). This is undocumented behaviour — a user on `/training` clicks the moon icon and is thrown back to the homepage with no warning. The comment says "Dark mode shows off the Yogisha hero" but that is a designer preference, not a user expectation. This will confuse visitors.

### 3. Gallery Page is Effectively Empty
**File:** [`Gallery.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/components/Gallery.jsx)

`Gallery.jsx` is 14 lines and just renders three sub-components. There is no page heading, no `section-label`, no `<h2>` or `aria-label` on the outer `<section>`. It is the only page missing a `RequestBand` CTA at the bottom — the `RequestBand` is added in `App.jsx` but the gallery section itself has no identity.

### 4. `ODISHA_WORK` is an Empty Array (Dead Code)
**File:** [`Skyvertising.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/components/Skyvertising.jsx#L57)

```js
const ODISHA_WORK = []
```
The conditional block that renders "Flown in Odisha" will never appear. Either populate it with real images or remove the dead conditional — it adds dead weight to the bundle and is confusing for future maintainers.

### 5. `DroneService.jsx` — DaaS Image Cards Have Empty `alt`
**File:** [`DroneService.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/components/DroneService.jsx#L135)

```jsx
<img src={o.img} alt="" loading="lazy" />
```
Every service card image has `alt=""`. The card has a `<h4>` with the offering title, but the image itself is purely decorative only if it adds no visual context beyond the heading. For a service like "Aerial photography & video" or "Agricultural spraying" the image *is* meaningful content. Add descriptive alt text to the `OFFERINGS` array (like the alt fields in `Skyvertising.jsx` or `HomeServices.jsx`).

---

## 🟠 UX / Logic Issues

### 6. Router — Unknown Paths Silently Default to Home
**File:** [`router.js`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/router.js#L50)

```js
const path = PAGES.includes(p.replace(/\/$/, '') || '/') ? ... : '/'
```
A 404-type route (e.g. `#/nonexistent`) silently redirects to home with no feedback. Consider adding a dedicated `PAGES['*']` 404 state that shows a brief "Page not found — return home" message, especially as the site grows.

### 7. Navbar — Mobile Services Submenu is Hardcoded to Slice First 3 Links
**File:** [`Navbar.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/components/Navbar.jsx#L455)

```jsx
{p.links.slice(0, 3).map(...)}
```
The Services panel in mobile only shows 3 links regardless of how many are in `p.links`. If a third service is ever added, it will silently not appear in mobile. Remove the `.slice(0, 3)` or make it data-driven.

### 8. Navbar — `menuCount` increments are Off by One
**File:** [`Navbar.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/components/Navbar.jsx#L313-L315)

```js
const toggleMenu = () => {
  if (!menuOpen) setMenuCount((c) => c + 1)
  setMenuOpen(!menuOpen)
}
```
`menuCount` is used as the `replay` prop for the Scramble animation. It is incremented only when opening, but `menuOpen` state updates are async — the increment reads a stale value before `setMenuOpen` has fired. This can cause scramble replay to miss on rapid toggling. Batch both into one `setState` or use `useReducer`.

### 9. `scrollToSection` — Hardcoded Navbar Offset
**File:** [`router.js`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/router.js#L79)

```js
const y = el.getBoundingClientRect().top + window.scrollY - 64
```
The `64` is hardcoded as the navbar height. If the navbar height ever changes (e.g. on different breakpoints), scroll targets will be off. Use `document.querySelector('.nav')?.offsetHeight ?? 64` instead.

### 10. `Services` Page is Too Thin
**File:** [`App.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/App.jsx#L65-L73) — `/services` route

The `/services` route renders only `<ServicesIntro />` + `<RequestBand />`. `ServicesIntro` itself is minimal. A user who lands on `/services` directly (e.g. from a Google result) sees an intro page with just two cards and nothing else. Either enrich this page or redirect it directly to the most visited sub-service.

### 11. Training Enquiry — "Participants" Field Accepts Non-Numeric Text
**File:** [`TrainingEnquiry.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/components/TrainingEnquiry.jsx#L134)

```jsx
<input inputMode="numeric" value={form.size} onChange={set('size')} placeholder="e.g. 40" />
```
`inputMode="numeric"` hints the keyboard on mobile but does not prevent typing letters on desktop. Add `type="number" min="1" max="5000"` or at least validate before composing the email body.

---

## 🟡 SEO & Metadata Gaps

### 12. Missing Open Graph / Social Preview Tags
**File:** [`index.html`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/index.html)

There are no `og:title`, `og:description`, `og:image`, `og:url`, or `twitter:card` meta tags. When a user shares a link to the site on WhatsApp, LinkedIn, or Twitter, there will be no preview card — just a bare URL. This is critical for a company that markets itself for events and social reach.

**Add to `<head>`:**
```html
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Sky Eye Technology" />
<meta property="og:title" content="Sky Eye Technology — Unfolding The Unfiltered" />
<meta property="og:description" content="Drone advertisement shows (Skyvertising), live drone, robotics and AI courses, and drone services from Bhubaneswar, Odisha." />
<meta property="og:image" content="https://ik.imagekit.io/hiesc7f4v/skyeye/skyvertising/led-net-city.jpg?tr=w-1200,h-630,fo-auto" />
<meta property="og:url" content="https://skyeyetechnology.in/" />
<meta name="twitter:card" content="summary_large_image" />
```

### 13. Missing Canonical URL + `robots.txt` / `sitemap.xml`
The site has no `<link rel="canonical">`, no `robots.txt`, and no `sitemap.xml` in the `public/` folder. Google cannot determine the primary URL for indexing, and bots have no guidance on which pages to crawl.

### 14. Page Titles Are Set in JS — Not SSR-friendly
All `document.title` updates happen in React's `useEffect`. This means a crawler (even Googlebot) that doesn't execute JS fully will see every page as "Sky Eye Technology — Unfolding The Unfiltered". With a hash-based router, SSR isn't straightforward, but at minimum the `<title>` in `index.html` should include the base brand name and a relevant description for the crawl fallback.

### 15. Hash Router and Google Indexing
The entire site uses `#`-based routing (`#/about`, `#/services/skyvertising`). Hash fragments are **not** sent to the server and historically poorly indexed by Google. Consider migrating to history-mode routing (Vite supports it with a `vite.config.js` `base` + server rewrite rules). Cloudflare Pages, Netlify, and Vercel all support this trivially with a `_redirects` file.

---

## 🔵 Design & Consistency Issues

### 16. Inconsistent Raw Style in JSX
**Files:** [`Footer.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/components/Footer.jsx#L18-L22)

```jsx
<p className="footer-sub" style={{ marginTop: 'var(--space-md)' }}>
<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
```
Inline styles bypass the design system. These should be CSS class rules. This is the only component doing this and it's inconsistent with the rest of the codebase which uses only CSS class names.

### 17. `DroneService.jsx` — Service Label Says "03" But There Are Only Two
**File:** [`DroneService.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/components/DroneService.jsx#L93)

```jsx
<span className="section-label">SERVICES / 03 · DRONE AS A SERVICE</span>
```
In the navbar and site structure there are only two services. Skyvertising is `01`, and DaaS is presumably `02`. Using `03` is either a mistake or suggests a missing third service that was removed. The `Skyvertising.jsx` uses `SERVICES / 01` correctly.

### 18. `DarkHero.jsx` vs `HomeHero.jsx` — Unclear Intent
**File:** [`App.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/App.jsx#L37-L39), [`DarkHero.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/components/DarkHero.jsx)

`FlyingDrone` is rendered before `HomeHero`, which renders either `DarkHero` or a light hero depending on theme. `DarkHero.jsx` is its own file but apparently not currently in the render tree for the home page. Verify that the dark hero is actually being used — if it's rendered inside `HomeHero.jsx` conditionally, the file name makes it hard to find.

### 19. Hero.jsx Is a Separate Component Just for Text
**File:** [`Hero.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/components/Hero.jsx)

On the home page, `HomeHero` renders a visual hero and `Hero` renders what appears to be a text/copy section. Both are mounted at the root level of the home page render tree. Unless they're visually merged into one viewport-height section, this is confusing and the `Hero` component is misnamed — consider `HomeIntro` or `HomeLeadCopy`.

### 20. Footer Uses Hardcoded Logo URL for Dark Only
**File:** [`Footer.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/components/Footer.jsx#L3)

```js
const logoMarkLight = ik('site/logo-mark-light.png', 'h-96')
```
The footer always shows the light-variant logo mark regardless of dark/light mode. The navbar handles this correctly with two images (`nav-logo-mark--light` / `nav-logo-mark--dark`) and CSS visibility. The footer should do the same.

### 21. Mobile Menu Numbers Go Beyond `09` Pattern
**File:** [`Navbar.jsx`](file:///c:/Users/KIIT/OneDrive/Desktop/skyeye/src/components/Navbar.jsx#L449)

```jsx
<span className="nav-sheet-num">0{i + 1}</span>
```
This produces `01`, `02` … up to `06`. When there are 6+ panels, it's fine, but the pattern `0{i+1}` will produce `07`, `08`, `09`, `010` on a 10th item. Use `String(i + 1).padStart(2, '0')` (already done correctly in Courses and other components, just not here).

---

## 🟢 Positive Observations (Things Done Right)

- **Performance:** All images go through ImageKit CDN with transform strings — excellent.
- **Reduced motion:** `Skyvertising.jsx` and other video components check `prefers-reduced-motion` before autoplay.
- **Accessibility baseline:** `aria-label`, `aria-hidden`, `aria-expanded`, `aria-controls`, `role="tablist/tab/tabpanel"` are used consistently.
- **Lenis smooth scroll:** Exposed as `window.__lenis` and used throughout scroll utilities — clean pattern.
- **Theme flash prevention:** The inline script in `index.html` that reads `localStorage` before first paint is correct.
- **Tab indices on hidden panels:** `tabIndex={tabbable ? 0 : -1}` on nav panel links is correct for keyboard navigation.
- **`rel="noreferrer noopener"`** on all external links — security best practice followed.

---

## 📋 Quick-Fix Priority List

| Priority | Issue | File |
|---|---|---|
| 🔴 | WhatsApp sends without validation | `Contact.jsx` |
| 🔴 | OG / social tags missing | `index.html` |
| 🔴 | `alt=""` on all DaaS images | `DroneService.jsx` |
| 🟠 | Dark-mode toggle navigates away silently | `useTheme.js` |
| 🟠 | Service label says `03` for DaaS | `DroneService.jsx` |
| 🟠 | Mobile services nav hard-sliced at 3 | `Navbar.jsx` |
| 🟠 | No 404 page | `router.js` / `App.jsx` |
| 🟡 | Hash router hurts SEO | `vite.config.js` / router |
| 🟡 | Inline styles in Footer | `Footer.jsx` |
| 🟡 | Footer logo ignores dark mode | `Footer.jsx` |
| 🟡 | Dead `ODISHA_WORK` array | `Skyvertising.jsx` |
| 🟡 | Hardcoded `64px` scroll offset | `router.js` |
