// Every image, clip and drone frame on the site is served from ImageKit —
// nothing heavier than a favicon ships in the repo.
export const CDN = 'https://ik.imagekit.io/hiesc7f4v'

const withTr = (url, tr) => (tr ? `${url}?tr=${tr}` : url)

/** Site asset under /skyeye, optionally with an ImageKit transform string. */
export const ik = (path, tr) => withTr(`${CDN}/skyeye/${path}`, tr)

/** Field photo picked from the company Drive, e.g. photo('agri', 131). */
export const photo = (cat, n, tr = 'w-1200,q-75') =>
  ik(`photos/${cat}/${cat}-${String(n).padStart(3, '0')}.jpg`, tr)

/** Photo supplied directly by the team, under /skyeye/photos/new. */
export const newPhoto = (name, tr = 'w-1200,q-78') => ik(`photos/new/${name}.png`, tr)

/**
 * Clip under /skyeye/video, served as the original upload. The ImageKit plan's
 * video-transformation quota is used up, so resized variants and generated
 * thumbnails return 403; `orig-true` bypasses processing entirely. Only clips
 * light enough to stream as-is (a few MB to ~20 MB, all H.264) are used.
 */
export const clip = (name) => ik(`video/${name}.mp4`, 'orig-true')

/** Poster still for a clip — a plain image under /skyeye/stills. */
export const poster = (name) => ik(`stills/${name}.jpg`, 'q-80')

// Photographs cut out of the brochure pages and stored as their own images
// (the PDF itself is not published).
export const brochureCrop = (name, tr = 'w-900,q-80') => ik(`skyvertising/${name}.jpg`, tr)

export const CONTACTS = {
  address: 'Qtr No. SE 3/7, Satyanagar, Bhubaneswar, Odisha',
  email: 'skyeyetechnology111@gmail.com',
  people: [
    { name: 'Jagannath Tripathy', phone: '+91 84550 41474', tel: '+918455041474' },
    { name: 'Shreyas Mishra', phone: '+91 94374 71920', tel: '+919437471920' },
  ],
  whatsapp: 'https://api.whatsapp.com/send?phone=918455041474',
  social: [
    { label: 'YouTube', href: 'https://www.youtube.com/@skyeyetechnology' },
    { label: 'Instagram', href: 'https://www.instagram.com/goset.official/' },
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/people/Skyeye-India/pfbid021BZLacsoCbSNdBtmk6pY12bMM5wNoAQjxi1DVP2eNjSAm14mekmuSVg35puBDTxWl/',
    },
    { label: 'Linktree', href: 'https://linktr.ee/skyeyetechnology111' },
  ],
}
