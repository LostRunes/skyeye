import { photo } from '../cdn'

// Five live courses: two in AI & data, three in drones.
// Module lists are draft outlines built from the course briefs; replace them
// with the team's confirmed syllabus when it arrives. Add an instructor as
// { name, role, img } to show their photo on the course.
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
    img: photo('course', 36, 'w-1200,q-75'),
    instructor: null,
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
    img: photo('course', 53, 'w-1200,q-75'),
    instructor: null,
  },
  {
    id: 'drone-basic',
    group: 'drone',
    level: 'Basic',
    audience: 'School students',
    title: 'Drone Basics & Assembly',
    desc: 'An introduction to drones for schools: how they fly, what they are made of, and how to build one — ending with supervised first flights.',
    modules: [
      ['How a drone flies', 'Lift and thrust, and the four controls: throttle, yaw, pitch and roll.'],
      ['Parts of a drone', 'Frame, motors, ESCs, propellers, flight controller, battery and radio.'],
      ['Hands-on assembly', 'Building a drone from a kit in small teams.'],
      ['Flying safely', 'Pre-flight checks, safe zones and India’s drone rules made simple.'],
      ['Simulator practice', 'Learning the controls on a simulator before the real thing.'],
      ['First flights', 'Supervised flying on open ground.'],
    ],
    format: ['In school', 'Build kits', 'Supervised flights'],
    img: photo('edu', 356, 'w-1200,q-75'),
    instructor: null,
  },
  {
    id: 'drone-fpv',
    group: 'drone',
    level: 'FPV',
    audience: 'Defence & security training',
    title: 'FPV Drone Operations & R&D',
    desc: 'First-person-view flying for defence and security teams — fast and endurance flying, long-range testing, integrating components and developing new builds.',
    modules: [
      ['FPV systems', 'Goggles, video transmitters, antennas and control links.'],
      ['Fast & endurance flying', 'High-speed control, manoeuvring and managing flight time.'],
      ['Long-range testing', 'Link range, battery endurance and fail-safe behaviour.'],
      ['Component integration', 'Fitting cameras, payloads and power systems into an airframe.'],
      ['Tuning & troubleshooting', 'Configuring firmware and diagnosing faults in the field.'],
      ['R&D', 'Testing, measuring and improving builds through structured trials.'],
    ],
    format: ['Field training', 'Live flying', 'R&D projects'],
    img: photo('fpv', 102, 'w-1200,q-75'),
    instructor: null,
  },
  {
    id: 'drone-advanced',
    group: 'drone',
    level: 'Advanced',
    audience: 'Engineering students & makers',
    title: 'Advanced Drone Engineering',
    desc: 'Designing a drone from the ground up: aerodynamics, 3D CAD in Fusion 360 and PCB design, brought together in a full project.',
    modules: [
      ['Aerodynamics', 'How multirotor and fixed-wing aircraft generate lift and stay stable.'],
      ['3D CAD fundamentals', 'Sketches, constraints, parts and assemblies.'],
      ['Fusion 360', 'Designing frames and components ready for fabrication.'],
      ['PCB design', 'From schematic to board layout for drone electronics.'],
      ['Build & test', 'Turning designs into hardware and testing them.'],
      ['Project work', 'Design, build and test a drone project end to end.'],
    ],
    format: ['Lab-based', 'Software + hardware', 'Project'],
    img: photo('labs', 592, 'w-1200,q-75'),
    instructor: null,
  },
]
