import ImageMorphGallery from './ImageMorphGallery'
import PhotoGrid from './PhotoGrid'
import GalleryDrone from './GalleryDrone'

export default function Gallery() {
  return (
    <section id="gallery" className="gallery" aria-labelledby="gallery-title">
      <h1 id="gallery-title" className="visually-hidden">Gallery</h1>
      <ImageMorphGallery />
      <PhotoGrid />
      <GalleryDrone />
    </section>
  )
}
