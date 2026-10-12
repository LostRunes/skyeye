import { useTheme } from '../hooks/useTheme'
import VideoHero from './VideoHero'
import DarkHero from './DarkHero'

// Light mode keeps Abinash's video hero; dark mode swaps in Yogisha's.
export default function HomeHero() {
  const { theme } = useTheme()
  return (
    <div className="home-hero">
      {theme === 'dark' ? <DarkHero key="dark" /> : <VideoHero key="light" />}
    </div>
  )
}
