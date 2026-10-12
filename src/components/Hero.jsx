import { photo } from '../cdn'

const HERO_IMG = photo('agri', 134, 'w-1400,q-75')

export default function Hero() {
  return (
    <section className="section-hero" id="overview">
      <div className="container hero-inner">
        <div className="hero-grid">
          {/* Left Column */}
          <div className="hero-left">
            <div>
              <div className="hero-eyebrow">
                <span className="hero-eyebrow-dot" />
                <span>SKY EYE TECHNOLOGY · BHUBANESWAR · INDIA</span>
              </div>

              <h2 className="hero-h1">
                UNFOLDING<br />THE UNFILTERED.
              </h2>

              <p className="hero-desc">
                We put drones, robotics and intelligent technology to work — advertising in the sky, drone services on the ground, and hands-on courses that teach people to build it themselves.
              </p>
            </div>

            {/* CTAs */}
            <div className="hero-ctas">
              <a className="btn-primary" href="#/services/drone-as-a-service">[ Drone as a Service ]</a>
              <a className="btn-request btn-request--sm" href="#/contact">Request a service</a>
            </div>

            {/* Quick Metrics */}
            <div className="hero-metrics">
              <div>
                <p className="metric-label">CORE LAB</p>
                <p className="metric-value">BHUBANESWAR</p>
              </div>
              <div>
                <p className="metric-label">SERVICES</p>
                <p className="metric-value">SKYVERTISING · DaaS</p>
              </div>
              <div>
                <p className="metric-label">LIVE COURSES</p>
                <p className="metric-value">AI · DATA · DRONES</p>
              </div>
            </div>
          </div>

          {/* Right Column — Video Frame */}
          <div className="hero-right">
            <div className="hero-video-frame">
              <div className="hero-video-canvas">
                <img
                  src={HERO_IMG}
                  alt="Sky Eye spraying drone flying low over a flowering mustard field"
                />

                {/* HUD Overlay */}
                <div className="hud-overlay">
                  <div className="hud-top">
                    <span className="hud-rec">REC ● [LIVE FEED 01]</span>
                  </div>
                  <div className="hud-bottom">
                    <span className="hud-fps">FPS: 59.94 · 4K RAW</span>
                    <div className="hud-corner" />
                  </div>
                </div>

                {/* Crosshair */}
                <div className="hud-crosshair">
                  <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>
                    filter_center_focus
                  </span>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="hero-video-bar">
                <div className="hero-video-bar-left">
                  <span className="bar-dot" />
                  <span className="bar-title">AERIAL SYSTEM · FIELD TEST</span>
                </div>
                <span className="bar-coords">[LAT 20.2961° N, LON 85.8245° E]</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
