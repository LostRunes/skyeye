// The announcement pop-up. Edit this one file to change the event; set
// `enabled: false` to switch the pop-up off. It also stops showing on its own
// after `endsOn`.
export const EVENT = {
  enabled: true,
  id: 'mun-2026-10', // change when the event changes, so returning visitors see the new one
  kicker: 'Upcoming event',
  title: 'Model United Nations',
  short: 'MUN',
  days: ['26', '27', '28'],
  month: 'October 2026', // TODO: confirm the month with the client
  endsOn: '2026-10-28', // last day; the pop-up hides after this date
  about:
    'Three days of debate and diplomacy. Delegates represent countries across UN committees, negotiate with each other and draft resolutions on real global issues.',
  stall: {
    title: 'Visit the Sky Eye stall',
    where: 'Campus 6 · all three days',
    text: 'Spin the wheel, play games and win goodies, and find out about drone training and opportunities with Sky Eye.',
  },
  cta: { label: 'Register interest', href: '#/contact', service: 'MUN registration' },
}
