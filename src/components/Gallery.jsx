import ImageMorphGallery from './ImageMorphGallery'
import PhotoGrid from './PhotoGrid'
import GalleryDrone from './GalleryDrone'

export default function Gallery() {
  return (
    <section id="gallery" className="gallery">
      <ImageMorphGallery />
      <PhotoGrid />
      <GalleryDrone />
    </section>
  )
}
