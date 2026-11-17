import type { AuctionResult } from '../types/auctionResult';

export default function FulfillmentSteps({ result }: { result: AuctionResult }) {
  return (
    <section className="nx-ar-card nx-ar-fulfillment" aria-labelledby="fulfillment-title">
      <div className="nx-ar-card-heading">
        <h2 id="fulfillment-title">
          <i className="bi bi-signpost-split" aria-hidden="true" /> Các bước tiếp theo</h2>
        <span>Thông tin từ máy chủ</span>
      </div>
      <ol className="nx-ar-steps">{result.steps.map((step) =>
        <li className={`nx-ar-step is-${step.style}`} key={step.title}>
          <div className="nx-ar-step-top">
            <span className="nx-ar-step-icon">
              <i className={`bi bi-${step.icon}`} aria-hidden="true" />
            </span>
            <span className="nx-ar-step-state">{step.state}</span>
          </div>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
          <div className="nx-ar-step-time">{step.time}
          </div>
        </li>)}
      </ol>
    </section>
  );
}
