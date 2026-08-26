const journeySteps = [
  [
    "Choose a Plan",
    "View the subscription plans available from our company.",
  ],
  [
    "Subscribe",
    "Select the plan that suits your needs.",
  ],
  [
    "Payment",
    "Complete the subscription payment.",
  ],
  [
    "Manage Subscription",
    "View and manage your active subscription.",
  ],
  [
    "Renewal",
    "Continue your subscription through the renewal cycle.",
  ],
  [
    "Notifications",
    "Receive important subscription and renewal updates.",
  ],
];

export default function HowItWorks() {
  return (
    <section
      id="journey"
      className="journey-section section"
    >
      <div className="container">

        <div className="section-intro journey-intro">

          <div>
            <p className="eyebrow-text">
              How it works
            </p>

            <h2>
              From choosing a plan to managing your
              subscription.
            </h2>
          </div>

        </div>

        <div className="journey-grid">

          {journeySteps.map(
            ([title, description], index) => (
              <div
                className="journey-step"
                key={title}
              >
                <span className="step-number">
                  0{index + 1}
                </span>

                <h3>{title}</h3>

                <p>{description}</p>
              </div>
            )
          )}

        </div>

      </div>
    </section>
  );
}