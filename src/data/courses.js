import { ik, photo } from '../cdn'

// Five live courses: two in AI & data, three in drones.
// Module lists are draft outlines built from the course briefs; replace them
// with the team's confirmed syllabus when it arrives. Add an instructor as
// { name, role, img } to show their photo on the course.
// Generative AI instructor. Add `name` once confirmed.
const AI_INSTRUCTOR = {
  img: ik('photos/new/instructor.jpg', 'w-320,h-320,fo-face,q-85'),
  role: 'Course instructor',
  quals: [
    'B.Tech in CSE, IIIT Ranchi',
    'M.Tech in CSE, NIT Raipur (pursuing)',
    'Ex-Data Scientist at wiZe',
    'Ex-AI Engineer at Gistr',
  ],
}

export const GROUPS = [
  { key: 'ai', label: 'AI & Data' },
  { key: 'drone', label: 'Drones' },
]

export const COURSES = [
  {
    id: 'genai',
    group: 'ai',
    level: 'All levels',
    audience: 'College students & professionals',
    title: 'Generative AI — from LLMs to AI agents',
    short: 'Generative AI', // label in menus
    desc: 'How generative AI actually works, and how to put it to work. Participants follow along on their own laptops, from the basics of machine learning to building a simple AI agent.',
    modules: [
      ['AI foundations', 'Machine learning, deep learning and where generative AI fits in.'],
      ['Inside a large language model', 'Tokens, training and why models sometimes get things confidently wrong.'],
      ['Prompting well', 'Giving models context, examples and constraints to get reliable answers.'],
      ['From chatbot to agent', 'Models that plan, use tools and loop until a task is done.'],
      ['Hands-on build', 'Building a small AI workflow, step by step, in the session.'],
      ['Using AI responsibly', 'Accuracy, privacy, bias and knowing when not to use it.'],
    ],
    format: ['Live workshop', 'Bring a laptop', 'Hands-on'],
    img: ik('photos/new/genai-course.jpg', 'q-88'),
    imgFit: 'contain', // a projected slide: show it whole rather than cropping it
    instructor: AI_INSTRUCTOR,
  },
  {
    id: 'data',
    group: 'ai',
    level: 'Beginner',
    audience: 'College students & early professionals',
    title: 'Data Analytics',
    desc: 'Turning raw data into decisions. A practical course that goes from cleaning a spreadsheet to presenting findings from a real dataset.',
    modules: [
      ['Thinking with data', 'Framing the right question before touching the numbers.'],
      ['Spreadsheets for analysis', 'Cleaning data, formulas, lookups and pivot tables.'],
      ['Python for data', 'Loading, cleaning and summarising data with pandas.'],
      ['Statistics that matter', 'Averages, spread, correlation and common traps.'],
      ['Visualisation & dashboards', 'Charts that explain, and dashboards people actually use.'],
      ['Capstone project', 'Analyse a real dataset and present the findings.'],
    ],
    format: ['Live sessions', 'Bring a laptop', 'Project-based'],
    img: ik('photos/new/data-course.jpg', 'q-90'),
    imgFit: 'contain', // small portrait shot: show it whole over a blurred backdrop
    instructor: null,
  },
  {
    id: 'drone-basic',
    group: 'drone',
    level: 'Basic',
    program: 'Basic Drone Course',
    audience: 'School Students & Beginners',
    title: 'Drone Explorer',
    desc: 'A first step into drones for school students and beginners: how they fly, what they are made of and how to build one — ending with supervised first flights.',
    modules: [
      ['How a drone flies', 'Lift and thrust, and the four controls: throttle, yaw, pitch and roll.'],
      ['Parts of a drone', 'Frame, motors, ESCs, propellers, flight controller, battery and radio.'],
      ['Hands-on assembly', 'Building a drone from a kit in small teams.'],
      ['Flying safely', 'Pre-flight checks, safe zones and India’s drone rules made simple.'],
      ['Simulator practice', 'Learning the controls on a simulator before the real thing.'],
      ['First flights', 'Supervised flying on open ground.'],
    ],
    format: ['Beginner-friendly', 'Build kits', 'Supervised flights'],
    img: photo('edu', 356, 'w-1200,q-75'),
    instructor: null,
  },
  {
    id: 'drone-advanced',
    group: 'drone',
    level: 'Advanced',
    program: 'Advanced Drone Building Program',
    audience: 'Undergraduate Students',
    title: 'UAV Masterclass',
    desc: 'Designing and building a drone from the ground up: aerodynamics, 3D CAD in Fusion 360 and PCB design, brought together in a full build project.',
    modules: [
      ['Aerodynamics', 'How multirotor and fixed-wing aircraft generate lift and stay stable.'],
      ['3D CAD fundamentals', 'Sketches, constraints, parts and assemblies.'],
      ['Fusion 360', 'Designing frames and components ready for fabrication.'],
      ['PCB design', 'From schematic to board layout for drone electronics.'],
      ['Build & test', 'Turning designs into hardware and testing them.'],
      ['Project work', 'Design, build and test a drone project end to end.'],
    ],
    format: ['Lab-based', 'Software + hardware', 'Build project'],
    img: photo('labs', 592, 'w-1200,q-75'),
    instructor: null,
  },
  {
    id: 'drone-fpv',
    group: 'drone',
    level: 'FPV',
    program: 'FPV Drone Course',
    audience: 'Beginners to Enthusiasts',
    title: 'FPV Flight Academy',
    desc: 'Learn to fly first-person view — from your first hover in the simulator to fast, flowing flights — and understand, set up and tune your own FPV drone.',
    modules: [
      ['How FPV works', 'Goggles, cameras, video transmitters, antennas and radios.'],
      ['Simulator training', 'Building control and confidence before flying the real drone.'],
      ['Setup & configuration', 'Binding radios, flight modes and configuring the flight controller.'],
      ['First FPV flights', 'Hovering, orientation and smooth turns, with an instructor.'],
      ['Speed & control', 'Faster lines, gaps and cinematic movements as skills grow.'],
      ['Build, tune & repair', 'Assembling, tuning and fixing an FPV drone yourself.'],
    ],
    format: ['Beginners welcome', 'Simulator + live flying', 'Hands-on'],
    img: ik('photos/new/fpv-academy.jpg', 'w-1200,q-78'),
    instructor: null,
  },
]
