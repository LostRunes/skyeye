import { photo } from '../cdn'

const PRODUCT_IMG = photo('agri', 133, 'w-1400,q-80')

const specs = [
  { key: 'LIQUID PAYLOAD TANK', val: '10 LITER QUICK-SWAP' },
  { key: 'SPRAY SPAN', val: '4.0 METERS EFFECTIVE' },
  { key: 'ATOMIZATION NOZZLES', val: '4× HIGH-PRECISION PRESSURE' },
  { key: 'LOADED FLIGHT TIME', val: '20 MINUTES CONTINUOUS' },
  { key: 'MAX OPERATIONAL SPEED', val: '10.0 M/S (36 KM/H)' },
  { key: 'COMMUNICATION LINK', val: '1,000 M ENCRYPTED RF' },
]

export default function Product() {
  return (
    <section className="section-product" id="products">
      <div className="container py-2xl">
        <div className="section-header">
          <span className="section-label">06.5 / PRODUCT</span>
          <h2 className="section-h2">A1 SERIES AGRICULTURE UAV</h2>
          <p className="section-desc">
            Precision from above. A professional agricultural unmanned aerial platform engineered from aerospace-grade carbon composite for demanding daily field cycles.
          </p>
        </div>

        <div className="product-grid">
          {/* Image */}
          <div className="product-img-col">
            <div className="product-img-frame">
              <div className="product-img-canvas">
                <img
                  src={PRODUCT_IMG}
                  alt="Sky Eye agricultural hexacopter with a blue canopy standing on dry soil"
                />
                <div className="product-fig-label">FIG 4.1: AIRFRAME IN THE FIELD</div>
              </div>
              <div className="product-dims">
                <span>SPAN: 1,840 MM</span>
                <span>FOLDED: 680 MM × 650 MM</span>
                <span>WEIGHT: 13.8 KG (DRY)</span>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="product-spec-col">
            <div>
              <span className="product-spec-label">PRECISION DISPERSAL SYSTEM</span>
              <h3 className="product-spec-h3">ENGINEERED METRICS</h3>
            </div>

            <div className="spec-table">
              {specs.map((s) => (
                <div key={s.key} className="spec-row">
                  <span className="spec-key">{s.key}</span>
                  <span className="spec-val">{s.val}</span>
                </div>
              ))}
            </div>

            <div>
              <a className="btn-primary" href="#contact" data-service="Drone Services" style={{ padding: '12px 16px', width: '100%', maxWidth: '360px' }}>
                [ View Product Specifications → ]
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
