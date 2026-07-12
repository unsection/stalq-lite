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
    version: "0.0.1",
    postedAt: "2026-07-12",
    title: "Initial release",
    summary:
      "Stalq Lite is live — track competitor product prices, scrape on demand or on a schedule, and review movement from a dark dashboard.",
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
