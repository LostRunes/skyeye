import { useImageSequence } from './hooks/useImageSequence'
import { CDN } from './cdn'
import Loader from './components/Loader'
import Navbar from './components/Navbar'
import DroneJourney from './components/DroneJourney'
import ProductSection from './components/ProductSection'
import TechnologySection from './components/TechnologySection'
import ApplicationsSection from './components/ApplicationsSection'
import CompanySection from './components/CompanySection'
import FinalCta from './components/FinalCta'
import Footer from './components/Footer'

// The journey is now one continuous two-act sequence: the assembly/zoom
// act (frames2) plays first, then hands off to the fold/unfold act (frames).
const SEQUENCES = [
  { key: 'assembly', folder: `${CDN}/frames2`, count: 90 },
  { key: 'flight', folder: `${CDN}/frames`, count: 57 },
]

export default function App() {
  const { images, progress, ready } = useImageSequence(SEQUENCES)

  return (
    <>
      {!ready && <Loader progress={progress} />}

      <div className="site" id="top" style={{ visibility: ready ? 'visible' : 'hidden' }}>
        <Navbar />

        <DroneJourney
          assemblyImages={images.assembly ?? []}
          flightImages={images.flight ?? []}
          scrollLength={600}
        />

        <ProductSection />
        <TechnologySection />
        <ApplicationsSection />
        <CompanySection />
        <FinalCta />
        <Footer />
      </div>
    </>
  )
}
