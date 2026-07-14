export type ChangelogSection = {
  heading: string;
  items: string[];
};

export type ChangelogEntry = {
  version: string;
  postedAt: string; // ISO date YYYY-MM-DD
  title: string;
  summary: string;
  sections: ChangelogSection[];
};

export const changelogEntries: ChangelogEntry[] = [
  {
    version: "0.1.0",
    postedAt: "2026-07-14",
    title: "Product-based price tracking",
    summary:
      "Track each of your products separately, connect the right competitors to it, and see real margin calculations directly in the dashboard.",
    sections: [
      {
        heading: "Your products and competitors",
        items: [
          "Create and switch between your own products from the tracker.",
          "Link every competitor to a specific product, so each dashboard view stays focused.",
          "Add competitor links from the final card in each product's competitor list.",
        ],
      },
      {
        heading: "Margin and costs",
        items: [
          "Save cost per unit, marketplace fees, shipping cost, and a target healthy margin for each product.",
          "Calculate current margin, profit per unit, break-even price, and the price needed to reach your target margin.",
          "Show the real margin at every competitor's price, with a warning for margins below 5%.",
        ],
      },
      {
        heading: "Tracker improvements",
        items: [
          "Show the live competitor count, lowest competitor price, and your rank for the selected product.",
          "Simplify the dashboard header so the next action is always clear in the product workspace.",
        ],
      },
    ],
  },
  {
    version: "0.0.1",
    postedAt: "2026-07-12",
    title: "Initial release",
    summary:
      "Stalq is live — track competitor product prices, scrape on demand or on a schedule, and review movement from a dark dashboard.",
    sections: [
      {
        heading: "Price tracker",
        items: [
          "Add product URLs with per-product scrape settings (selectors, country, timeouts).",
          "Card-style dashboard with favicons, price, change, mocked margin, and stock badges.",
          "Sort products by change, price, name, or last checked.",
          "Quick actions from each card: view details, visit source, refresh scrape, or delete.",
        ],
      },
      {
        heading: "Scraping",
        items: [
          "On-demand HTML scrapes via Context.dev.",
          "Price extraction from JSON-LD, meta tags, and common price selectors.",
          "Scheduled checks via GitHub Actions with catch-up when a run is delayed.",
        ],
      },
      {
        heading: "Logs and settings",
        items: [
          "Logs page with activity chart and dense scrape history.",
          "Global schedule settings for once or twice daily checks.",
          "Product detail page with price history and scrape controls.",
        ],
      },
    ],
  },
];

export const formatChangelogDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};
