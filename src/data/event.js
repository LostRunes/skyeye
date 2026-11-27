// Events Sky Eye is part of. The first entry with `popup: true` that hasn't
// ended is also the announcement pop-up. Change `id` when the event changes,
// so returning visitors see the new pop-up. Each event hides its pop-up and
// shows as "past" on the Events page after `endsOn`.
export const EVENTS = [
  {
    id: 'mun-2026-10',
    popup: true,
    kicker: 'Upcoming event',
    title: 'Model United Nations',
    short: 'KIIT MUN',
    kind: 'MUN', // what the event is, for 'What is a MUN?'
    days: ['27', '28', '29'],
    month: 'November 2026', // TODO: confirm the month with the client
    endsOn: '2026-11-29', // last day
    startsAt: '2026-11-27T09:00:00+05:30', // TODO: confirm the start time (drives the countdown)
    venue: 'Campus 6',
    about:
      'Three days of debate and diplomacy. Delegates represent countries across UN committees, negotiate with each other and draft resolutions on real global issues.',
    whatIs: [
      'A Model United Nations is a simulation of the United Nations. Each delegate is assigned a country and a committee, researches its position, and argues for it in formal debate.',
      'Over the sessions, delegates give speeches, lobby, build alliances and work together to draft and vote on resolutions — the same way real UN bodies do.',
    ],
    // MUN's own registration page, run by the organisers. Leave empty to show
    // "link coming soon" instead of the button.
    registerUrl: 'https://kiitmun.org/',
    stall: {
      title: 'Visit the Sky Eye stall',
      where: 'Campus 6 · all three days',
      text: 'Spin the wheel, play the stall games and win Sky Eye goodies, see real drones up close, and find out about drone training and opportunities with Sky Eye.',
      games: [
        { icon: 'casino', title: 'Spin the wheel', text: 'Spin the Sky Eye wheel and win goodies.' },
        { icon: 'sports_esports', title: 'Stall games', text: 'Quick games at the stall, with goodies for the winners.' },
        { icon: 'flight', title: 'Drone display', text: 'Real drones on show — and some you can buy at the stall.' },
        { icon: 'flight_takeoff', title: 'Opportunities', text: 'Find out about drone training, courses and openings at Sky Eye.' },
      ],
      // What players can win at the stall (shown on the Events page)
      prizes: [
        { icon: 'coffee', name: 'Mug' },
        { icon: 'key', name: 'Keychain' },
        { icon: 'sell', name: 'Stickers' },
        { icon: 'videocam', name: 'Drone video shot' },
        { icon: 'photo_camera', name: 'Drone photo print' },
        { icon: 'cookie', name: 'Chocolate' },
        { icon: 'sports_soccer', name: 'Fly the soccer drone' },
      ],
      shop: {
        title: 'Drones on display and for sale',
        text: 'See working drones up close at the stall, ask the team anything, and take one home: selected drones will be available to buy right there.',
      },
    },
    // The reel challenge leaderboard (entries and views: admin panel → Reels)
    reels: {
      hashtag: '#skyeyetechnology',
      text: 'Post a reel on Instagram with #skyeyetechnology — the stall, the drones, the games, your MUN moments. The reels with the most views win Sky Eye prizes.',
      facts: [
        { icon: 'tag', text: 'Use #skyeyetechnology' },
        { icon: 'visibility', text: 'Most views wins' },
        { icon: 'emoji_events', text: 'Top reels win prizes' },
      ],
      steps: [
        'Post a public reel on Instagram with #skyeyetechnology in the caption.',
        'Submit the reel’s link here.',
        'We check it and keep the view counts on the board up to date. Highest views at the end wins.',
      ],
    },
  },
]

const ended = (e) => {
  const end = new Date(`${e.endsOn}T23:59:59`)
  return Number.isFinite(end.getTime()) && Date.now() > end.getTime()
}
export const isPast = ended

/** 'Happening now' while it runs, else the event's own kicker. */
export const statusLabel = (e) => (e.startsAt && Date.now() >= new Date(e.startsAt).getTime() && !ended(e) ? 'Happening now' : e.kicker)

/** The event the announcement pop-up shows, or null. */
export const EVENT = EVENTS.find((e) => e.popup && !ended(e)) || null
