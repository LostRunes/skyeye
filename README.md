# Sky Eye Technology — website

Single-page site for Sky Eye Technology (SET) Pvt. Ltd., Bhubaneswar. It merges two earlier builds: Abinash's light, technical design (the base) and Yogisha's dark hero and scroll-driven drone sequence.

```bash
npm install
npm run dev      # local preview
npm run build    # production build in dist/
```

## Page

Home · About Us · Our Services (Skyvertising, Courses, Drone Services) · Gallery · Contact Us

- **Navbar** — modelled on anduril.com: translucent drop panels, page blur, and labels that decode out of jumbled letters (`src/utils/scramble.js`).
- **Dark mode** — toggle in the navbar; swaps the colour tokens and replaces the home hero with the Yogisha hero.
- **About Us** — the scroll-driven drone assembly/flight (`DroneJourney.jsx`).
- **Gallery** — category accordion + shared-element masonry (`PhotoGrid.jsx`).

## Assets

All images, clips and drone frames are served from ImageKit (`src/cdn.js`); nothing heavy is committed.

- The ImageKit plan's video-transformation quota is used up, so clips are served as originals (`tr=orig-true`) and posters are plain stills under `/skyeye/stills`.
- The contact form has no backend — it opens the visitor's mail app or WhatsApp.
