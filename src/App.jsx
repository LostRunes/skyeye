import { useEffect } from 'react'
import { ThemeProvider } from './hooks/useTheme'
import { useRoute } from './router'
import useSmoothScroll from './hooks/useSmoothScroll'
import { scrambleOnView } from './utils/scramble'
import Navbar from './components/Navbar'
import HomeHero from './components/HomeHero'
import Hero from './components/Hero'
import Drone3D from './components/Drone3D'
import Terrain3D from './components/Terrain3D'
import FlyingDrone from './components/FlyingDrone'
import Engineering from './components/Engineering'
import RnD from './components/RnD'
import Recognition from './components/Recognition'
import ServicesIntro from './components/ServicesIntro'
import HomeServices from './components/HomeServices'
import Skyvertising from './components/Skyvertising'
import SkyBanner3D from './components/SkyBanner3D'
import Courses from './components/Courses'
import DroneService from './components/DroneService'
import VideoStrip from './components/VideoStrip'
import Gallery from './components/Gallery'
import Contact from './components/Contact'
import RequestBand from './components/RequestBand'
import Footer from './components/Footer'

// Separate pages behind one navbar: Home · About Us · Our Services
// (Skyvertising, Courses, Drone as a Service) · Gallery · Contact Us.
const PAGES = {
  '/': {
    title: 'Sky Eye Technology — Unfolding The Unfiltered',
    render: () => (
      <>
        <FlyingDrone />
        <HomeHero />
        <Hero />
        <div id="home-about" className="anchor-block">
          <Drone3D more="#/about" bare />
        </div>
        <HomeServices />
        <VideoStrip />
        <Terrain3D />
        <div id="home-contact" className="anchor-block">
          <Contact />
        </div>
      </>
    ),
  },
  '/about': {
    title: 'About Us — Sky Eye Technology',
    render: () => (
      <>
        <Drone3D />
        <Engineering />
        <RnD />
        <Recognition />
        <RequestBand />
      </>
    ),
  },
  '/services': {
    title: 'Our Services — Sky Eye Technology',
    render: () => (
      <>
        <ServicesIntro />
        <RequestBand />
      </>
    ),
  },
  '/services/skyvertising': {
    title: 'Skyvertising — Sky Eye Technology',
    render: () => (
      <>
        <SkyBanner3D />
        <Skyvertising />
        <RequestBand
          service="Skyvertising"
          title="Put your brand in the sky."
          text="Tell us about your event, launch or campaign — date, place and what you want flown — and we'll plan the show."
          label="Request Skyvertising"
        />
      </>
    ),
  },
  '/services/courses': {
    title: 'Courses — Sky Eye Technology',
    render: () => (
      <>
        <Courses />
        <RequestBand
          service="Courses"
          title="Bring a course to your institution."
          text="Schools, colleges and training units — tell us the course, the group size and the dates."
          label="Enquire about a course"
        />
      </>
    ),
  },
  '/services/drone-as-a-service': {
    title: 'Drone as a Service — Sky Eye Technology',
    render: () => (
      <>
        <DroneService />
        <RequestBand
          service="Drone as a Service"
          title="Need a drone on the job?"
          text="Tell us what needs doing, where and when. We bring the aircraft, the crew and the permissions."
        />
      </>
    ),
  },
  '/gallery': {
    title: 'Gallery — Sky Eye Technology',
    render: () => (
      <>
        <Gallery />
        <RequestBand />
      </>
    ),
  },
  '/contact': {
    title: 'Contact Us — Sky Eye Technology',
    render: () => <Contact />,
  },
}

export default function App() {
  const route = useRoute()
  useSmoothScroll()
  const page = PAGES[route.path] || PAGES['/']

  useEffect(() => {
    document.title = page.title
    // Section labels decode out of jumbled letters as they scroll in, echoing the menu.
    return scrambleOnView('.section-label, .sky-kicker')
  }, [page])

  return (
    <ThemeProvider>
      <Navbar path={route.path} />
      <main className="page-main" key={route.path} data-page={route.path}>
        {page.render()}
      </main>
      <Footer />
    </ThemeProvider>
  )
}
