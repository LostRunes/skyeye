import { useEffect } from 'react'
import { ThemeProvider } from './hooks/useTheme'
import { scrambleOnView } from './utils/scramble'
import Navbar from './components/Navbar'
import HomeHero from './components/HomeHero'
import Hero from './components/Hero'
import DroneJourney from './components/DroneJourney'
import Engineering from './components/Engineering'
import RnD from './components/RnD'
import Recognition from './components/Recognition'
import ServicesIntro from './components/ServicesIntro'
import Skyvertising from './components/Skyvertising'
import Courses from './components/Courses'
import Solutions from './components/Solutions'
import Technology from './components/Technology'
import Product from './components/Product'
import VideoStrip from './components/VideoStrip'
import Gallery from './components/Gallery'
import Contact from './components/Contact'
import Footer from './components/Footer'

// One page, five stops: Home · About Us · Our Services · Gallery · Contact Us.
export default function App() {
  // Section labels decode out of jumbled letters as they scroll in, echoing the menu.
  useEffect(() => scrambleOnView('.section-label, .sky-kicker'), [])

  return (
    <ThemeProvider>
      <Navbar />
      <main className="page-main">
        <div id="home" className="anchor-block">
          <HomeHero />
          <Hero />
        </div>

        <div id="about" className="anchor-block">
          <DroneJourney />
          <Engineering />
          <RnD />
          <Recognition />
        </div>

        <div id="services" className="anchor-block">
          <ServicesIntro />
          <Skyvertising />
          <Courses />
          <Solutions />
          <Technology />
          <Product />
          <VideoStrip />
        </div>

        <Gallery />
        <Contact />
      </main>
      <Footer />
    </ThemeProvider>
  )
}
