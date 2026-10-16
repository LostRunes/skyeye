import Drone3D from './Drone3D'

// Gallery: the live, pointer-following 3D drone as an interactive exhibit.
const BEATS = [
  {
    kicker: '03 / IN 3D',
    title: ['THE SKY EYE', 'DRONE, LIVE.'],
    text: 'Move your cursor and the gimbal camera follows it. Scroll to turn the aircraft and see it from every side.',
  },
  {
    kicker: 'UP CLOSE',
    title: ['EVERY ANGLE.', 'EVERY DETAIL.'],
    text: 'Folding arms, finned brushless motors, counter-rotating propellers and a stabilised camera — modelled in full.',
    stats: [
      ['4', 'Motors'],
      ['8', 'Propeller blades'],
      ['2-axis', 'Gimbal'],
    ],
  },
  {
    kicker: 'BUILT IN ODISHA',
    title: ['DESIGNED, BUILT', 'AND FLOWN HERE.'],
    text: 'See how it comes together, part by part, on the About Us page.',
  },
]

export default function GalleryDrone() {
  return <Drone3D beats={BEATS} more="#/about" label="Interactive 3D model of the Sky Eye drone" />
}
