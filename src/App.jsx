import { useEffect } from 'react'
import { ThemeProvider } from './hooks/useTheme'
import { useRoute } from './router'
import useSmoothScroll from './hooks/useSmoothScroll'
import { scrambleOnView } from './utils/scramble'
import Navbar from './components/Navbar'
import HomeHero from './components/HomeHero'
import Hero from './components/Hero'
import DroneAssembly from './components/DroneAssembly'
import Terrain3D from './components/Terrain3D'
import FlyingDrone from './components/FlyingDrone'
import Engineering from './components/Engineering'
import RnD from './components/RnD'
import Recognition from './components/Recognition'
import ServicesIntro from './components/ServicesIntro'
import HomeServices from './components/HomeServices'
import HomeTraining from './components/HomeTraining'
import Skyvertising from './components/Skyvertising'
import SkyBanner3D from './components/SkyBanner3D'
import Courses from './components/Courses'
import TrainingEnquiry from './components/TrainingEnquiry'
import DroneService from './components/DroneService'
import VideoStrip from './components/VideoStrip'
import { SKYLINE } from './data/footage'
import Gallery from './components/Gallery'
import ImageMorphGallery from './components/ImageMorphGallery'
import Contact from './components/Contact'
import RequestBand from './components/RequestBand'
import Footer from './components/Footer'
import EventPopup from './components/EventPopup'

// Separate pages behind one navbar: Home · About Us · Our Services
// (Skyvertising, Drone as a Service) · Training · Gallery · Contact Us.
const PAGES = {
  '/': {
    title: 'Sky Eye Technology — Unfolding The Unfiltered',
    render: () => (
      <>
        <FlyingDrone />
        <HomeHero />
        <Hero />
        <div id="home-about" className="anchor-block">
          <DroneAssembly more="#/about" />
        </div>
        <HomeServices />
        <HomeTraining />
        <div id="home-gallery" className="anchor-block">
          <ImageMorphGallery label="GALLERY" more="#/gallery" />
        </div>
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
        <DroneAssembly />
        <VideoStrip clip={SKYLINE} />
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
  '/training': {
    title: 'Education & Training — Sky Eye Technology',
    render: () => (
      <>
        <Courses />
        <TrainingEnquiry />
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
  '/404': {
    title: 'Page not found — Sky Eye Technology',
    render: () => (
      <section className="not-found">
        <div className="container py-2xl">
          <span className="not-found-code">ERROR 404</span>
          <h1 className="section-h2">THIS PAGE FLEW OFF.</h1>
          <p className="section-desc">The link may be old or mistyped. Try one of these instead.</p>
          <div className="hs-actions">
            <a className="btn-request btn-request--sm" href="#/">Go to home</a>
            <a className="hs-more" href="#/contact">Contact us →</a>
          </div>
        </div>
      </section>
    ),
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
      <EventPopup />
    </ThemeProvider>
  )
}
