const firstStockPrompt =
  "Build a small web application where a user enters a stock ticker and sees the stock’s one-year historical performance, a simple chart, and a transparent three-month projection. The application should communicate uncertainty clearly, avoid financial advice, and help compare how different AI platforms approach data, forecasting, interface design, and responsible UX.";

const comparisonFields = [
  "Prompt used",
  "Strengths",
  "Weaknesses",
  "UX observations",
  "Code observations",
  "Design judgment",
  "Final notes"
];

const comparisonPlatforms = ["Codex", "Claude", "Grok", "Other"].map((name) => ({
  name,
  fields: comparisonFields.map((label) => ({
    label,
    value:
      label === "Prompt used"
        ? "Use the shared test prompt above, then note any platform-specific changes."
        : "Document observations after reviewing this platform's output."
  }))
}));

const experiments = [
  {
    slug: "stock-performance-test",
    routePath: "/aidesign/experiments/stock-performance-test",
    title: "Stock Performance Projection Test",
    eyebrow: "Financial visualization prototype",
    status: "Demo prototype",
    description:
      "A financial visualization prototype that compares how AI platforms handle market data, charts, projections, uncertainty, and responsible UX language.",
    summary:
      "This test asks each AI platform to move beyond a working chart and show whether it can communicate financial uncertainty with care.",
    prompt: firstStockPrompt,
    purpose:
      "Let users enter a stock ticker and review recent performance, key metrics, a chart, a simple projection, and a clear financial-advice disclaimer.",
    requirements: [
      "The stock's one-year historical performance.",
      "A chart of the price movement.",
      "Key performance metrics.",
      "A simple three-month projection.",
      "Clear language explaining that the projection is not financial advice."
    ],
    critiqueQuestions: [
      "What does the AI assume when data access is ambiguous?",
      "Does it explain uncertainty or hide it behind confident interface language?",
      "Does the UI help a person reason, or only decorate a calculation?",
      "Where does human judgment still need to challenge the generated output?"
    ],
    comparisonPlatforms
  }
];

const standaloneIdeas = [
  {
    slug: "self-care",
    eyebrow: "Featured Claude HTML idea",
    sectionTitle: "Standalone HTML Gallery",
    title: "Self Care (Beta) V1.0",
    meta: "Claude standalone HTML · Self Care prototype",
    description:
      "A lock-screen self-care snack bar for quick mood check-ins. Name how you feel, note the small daily factors around you, and log a tiny check-in without opening a full app.",
    shortDescription:
      "A bundled mobile self-care concept with mood check-ins, daily factor tracking, theme controls, and lock-screen style interactions.",
    href: "/aidesign/self_care.html",
    thumbnail: "/assets/aidesign/self-care-mobile-thumbnail.png?v=20260713-2",
    thumbnailWidth: 361,
    thumbnailHeight: 678
  },
  {
    slug: "meeting-coach",
    eyebrow: "Claude standalone HTML idea",
    sectionTitle: "Standalone HTML Gallery",
    title: "Meeting Coach",
    meta: "Claude standalone HTML · Meeting Coach prototype",
    description:
      "A live lock-screen meeting coach that scrolls the conversation, tracks predetermined talking points and expertise, scores communication clarity, and separately signals whether the room is going well, mixed, or poorly.",
    shortDescription:
      "A mobile meeting companion showing that strong delivery and complete talking-point coverage can coexist with a meeting that is still going poorly.",
    href: "/aidesign/meeting_coach.html",
    thumbnail: "/assets/aidesign/meeting-coach-mobile-thumbnail.png?v=20260713-2",
    thumbnailWidth: 360,
    thumbnailHeight: 678,
    wideThumbnail: "/assets/aidesign/meeting-coach-thumbnail.png"
  },
  {
    slug: "contacts",
    eyebrow: "Claude standalone HTML idea",
    sectionTitle: "Standalone HTML Gallery",
    title: "Contact",
    meta: "Claude standalone HTML · Contact prototype",
    description:
      "A people-first contact hub that brings conversations across channels into one prioritized view, surfaces who is waiting on you, and helps you prepare for the people in your next meeting.",
    shortDescription:
      "A relationship-centered contact hub that prioritizes people and pending conversations across communication channels.",
    href: "/aidesign/Contact%20Prototype%20(standalone).html",
    thumbnail: "/assets/aidesign/contact-mobile-thumbnail.png?v=20260713-2",
    thumbnailWidth: 361,
    thumbnailHeight: 678
  },
  {
    slug: "partner",
    eyebrow: "Claude standalone HTML idea",
    sectionTitle: "Standalone HTML Gallery",
    title: "Partner",
    meta: "Claude standalone HTML · Partner prototype",
    description:
      "A consent-first proximity sharing concept that lets two people choose specific Apple system data, approve the connection on both watches, and pause or stop the sync at any time.",
    shortDescription:
      "A paired iPhone and Apple Watch concept for selective, mutually approved proximity data-sharing.",
    problemStatement:
      "Sharing personal information with someone close should feel simple, intentional, and mutual. Partner reframes sharing as a temporary, visible agreement that both people approve and can revisit at any time.",
    href: "/aidesign/partner.html",
    thumbnail: "/assets/aidesign/partner-mobile-thumbnail.png?v=20260713-2",
    thumbnailWidth: 361,
    thumbnailHeight: 678
  }
];

const landingContent = {
  pageTitle: "AI Design Lab | Van Shea Creative",
  metaDescription:
    "Practical experiments comparing how AI coding platforms approach design, product thinking, data, and responsible UX.",
  eyebrow: "AI Application Experiments",
  title: "AI Design Lab",
  intro: "AI Design Lab:",
  introDetail:
    "Prototypes to test ideas I've been brewing on for years.",
  secondaryIntro:
    "The goal is to understand how these tools shape design, development, product decisions, and human judgment, not to declare one tool the best.",
  standaloneIdea: standaloneIdeas[0],
  standaloneIdeas,
  whyTitle: "Why This Exists",
  whyBody:
    "Working code is not enough. A functional prototype can still make poor assumptions, hide uncertainty, ignore accessibility, or miss the human context.",
  evaluationCriteria: [
    "quality of UX thinking",
    "clarity of interface",
    "usefulness of the product concept",
    "handling of data and uncertainty",
    "accessibility",
    "visual polish",
    "code maintainability",
    "honesty around limitations",
    "ability to support human decision-making"
  ],
  formatTitle: "Experiment Format",
  formatBody:
    "Each experiment provides enough context, implementation detail, and critique to decide what to trust, revise, or rebuild.",
  experimentFormat: [
    "the original prompt",
    "the AI platform used",
    "generated concept summary",
    "working prototype",
    "screenshots or embedded app",
    "what worked well",
    "what failed or felt weak",
    "design critique",
    "code critique",
    "final human reflection"
  ],
  currentTitle: "Current Experiments",
  experiments
};

function getAiDesignLandingContent() {
  return landingContent;
}

function listAiDesignExperiments() {
  return experiments;
}

function getAiDesignExperimentBySlug(slug) {
  const normalizedSlug = String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return experiments.find((experiment) => experiment.slug === normalizedSlug) || null;
}

module.exports = {
  getAiDesignLandingContent,
  listAiDesignExperiments,
  getAiDesignExperimentBySlug
};
