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
      "A small financial visualization prototype where the user enters a stock ticker, views the stock's one-year performance, and sees a basic projection for the next three months. The experiment compares how different AI platforms handle financial data, charting, forecasting, uncertainty, and responsible UX language.",
    summary:
      "This test asks each AI platform to move beyond a working chart and show whether it can communicate financial uncertainty with care.",
    prompt: firstStockPrompt,
    purpose:
      "Build a small web application where a user can enter a stock ticker and view the stock's recent performance, a chart, key metrics, a simple projection, and clear language explaining that the projection is not financial advice.",
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

const landingContent = {
  pageTitle: "AI Design Lab | Van Shea Creative",
  metaDescription:
    "AI Design Lab is a collection of practical application experiments comparing how AI coding platforms approach design, product thinking, data, and responsible UX.",
  eyebrow: "AI Application Experiments",
  title: "AI Design Lab",
  intro:
    "This space collects small application experiments built with different AI platforms. Each test starts with the same prompt and compares how tools like Codex, Claude, Grok, and others interpret the challenge, structure the solution, make interface decisions, and handle ambiguity.",
  secondaryIntro:
    "The goal is not to prove that one AI is best. The goal is to understand how these tools shape design thinking, development workflows, product decisions, and human judgment.",
  whyTitle: "Why This Exists",
  whyBody:
    "AI coding tools are becoming collaborators in design and development, but their output needs to be evaluated beyond whether the code runs. A prototype can be functional and still make poor assumptions, flatten uncertainty, ignore accessibility, or miss the human context around a decision.",
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
    "Each experiment is treated like a small research note: enough product context to understand the challenge, enough implementation detail to see how the prototype works, and enough critique to decide what should be trusted, revised, or rebuilt.",
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
