import Reveal from './Reveal'
import { CDN } from '../cdn'

export default function FinalCta() {
  return (
    <section className="final-cta" id="contact">
      <div className="final-cta__image">
        {/* <img src={`${CDN}/frames/frame_0045.webp`} alt="SkyEye aircraft, flight-ready" loading="lazy" /> */}
        <img src={`${CDN}/frames2/frame_0070.webp`} alt="SkyEye aircraft, flight-ready" loading="lazy" />
      </div>

      <Reveal as="h2" className="display-xl final-cta__headline">
        READY TO
        <br />
        TAKE FLIGHT?
      </Reveal>
      <Reveal as="p" className="final-cta__sub" delay={80}>
        Manufacturing locally, training nationally, innovating globally — from Bhubaneswar,
        Odisha.
      </Reveal>

      <Reveal className="final-cta__actions" delay={140}>
        <a className="btn btn--primary" href="#aircraft">
          Explore the aircraft
        </a>
        <a
          className="btn btn--ghost"
          href="https://linktr.ee/skyeyetechnology111"
          target="_blank"
          rel="noreferrer noopener"
        >
          Contact us
        </a>
      </Reveal>
    </section>
  )
}
