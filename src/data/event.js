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
    // MUN's own registration page, run by the organisers. Leave empty until the
    // link is shared; the button then shows "link coming soon".
    registerUrl: '',
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
      // What players can win at the stall (also the segments of the demo wheel)
      prizes: [
        { icon: 'badge', name: 'Pilot card', note: 'PVC Sky Eye pilot card' },
        { icon: 'key', name: 'Keychain' },
        { icon: 'coffee', name: 'Mug' },
        { icon: 'water_bottle', name: 'Bottle' },
        { icon: 'sell', name: 'Stickers' },
        { icon: 'cookie', name: 'Toffees', note: 'free for everyone who stops by' },
      ],
      shop: {
        title: 'Drones on display — and for sale',
        text: 'See working drones up close at the stall, ask the team anything, and take one home: selected drones will be available to buy right there.',
      },
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
