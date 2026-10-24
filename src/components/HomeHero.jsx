import { useTheme } from '../hooks/useTheme'
import CadHero from './CadHero'
import VideoHero from './VideoHero'
import DarkHero from './DarkHero'

// The live 3D quadcopter hero, in both themes. Set to false to go back to
// the video heroes (Abinash's in light mode, Yogisha's in dark).
const USE_CAD_HERO = true

export default function HomeHero() {
  const { theme } = useTheme()
  return (
    <div className="home-hero">
      {USE_CAD_HERO ? <CadHero /> : theme === 'dark' ? <DarkHero key="dark" /> : <VideoHero key="light" />}
    </div>
  )
}
