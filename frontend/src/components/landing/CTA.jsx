import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section
      id="get-started"
      className="container section"
    >
      <div className="cta">

        <div className="cta-content">

          <p className="mono-label">
            START WITH SUBFLOW
          </p>

          <h2>
            Ready to simplify your subscription business?
          </h2>

          <p>
            Manage your entire subscription lifecycle in one place.
          </p>

        </div>

        <div className="cta-side">

          <div className="cta-cycle">
            <span />

            <label>Plan</label>

            <i />

            <label>Subscribe</label>

            <i />

            <label>Manage</label>

            <i />

            <label>Renew</label>
          </div>
            <Link to="/login" className="button cta-button">
            Get Started
            <ArrowRight size={16} />
            </Link>
        </div>

      </div>
    </section>
  );
}