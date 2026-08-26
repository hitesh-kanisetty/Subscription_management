import {
  BarChart3,
  BellRing,
  CreditCard,
  Package,
  RefreshCw,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Subscription & Plan Management",
    description:
      "Create and manage the subscription plans your company offers from one clear workspace.",
  },
  {
    icon: Users,
    title: "Customer Management",
    description:
      "Keep customer profiles, subscription details, and account history connected.",
  },
  {
    icon: CreditCard,
    title: "Billing & Payments",
    description:
      "Bring billing and payment activity into a single, dependable flow.",
  },
  {
    icon: RefreshCw,
    title: "Automated Renewals",
    description:
      "Keep renewals moving smoothly with less manual follow-up.",
  },
  {
    icon: BellRing,
    title: "Notifications & Alerts",
    description:
      "Stay ahead of important events with timely, useful alerts.",
  },
  {
    icon: BarChart3,
    title: "Revenue Analytics",
    description:
      "Turn subscription activity into a clearer view of business performance.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="features-section section"
    >
      <div className="container">

        <div className="section-intro">

          <div>
            <p className="eyebrow-text">
              Core capabilities
            </p>

            <h2>
              The infrastructure behind recurring growth.
            </h2>
          </div>

          <p>
            SubFlow brings the essential pieces of
            subscription management together, so your
            team can focus on the business—not the busywork.
          </p>

        </div>

        <div className="feature-grid">

          {features.map(
            ({ icon: Icon, title, description }) => (
              <article
                className="feature"
                key={title}
              >
                <Icon
                  className="feature-icon"
                  size={22}
                  strokeWidth={1.5}
                />

                <h3>{title}</h3>

                <p>{description}</p>
              </article>
            )
          )}

        </div>

      </div>
    </section>
  );
}