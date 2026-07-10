export const WAIT_FOR_OPTIONS = [
  { label: "Default", value: null },
  { label: "500ms", value: 500 },
  { label: "1s", value: 1000 },
  { label: "3s", value: 3000 },
  { label: "5s", value: 5000 },
  { label: "30s", value: 30000 },
] as const;

export const TIMEOUT_AFTER_OPTIONS = [
  { label: "30s", value: 30000 },
  { label: "1 min", value: 60000 },
  { label: "2 min", value: 120000 },
] as const;

export const DATE_RANGE_OPTIONS = [
  { label: "Past 7 Days", value: "7d" },
  { label: "Past 1 Month", value: "30d" },
  { label: "Past 3 Months", value: "90d" },
] as const;

export type DateRange = (typeof DATE_RANGE_OPTIONS)[number]["value"];

export const COUNTRY_OPTIONS = [
  { label: "Default", value: "" },
  { label: "United States", value: "us" },
  { label: "United Kingdom", value: "gb" },
  { label: "Canada", value: "ca" },
  { label: "Australia", value: "au" },
  { label: "Germany", value: "de" },
  { label: "France", value: "fr" },
  { label: "Japan", value: "jp" },
  { label: "India", value: "in" },
  { label: "Singapore", value: "sg" },
  { label: "Netherlands", value: "nl" },
  { label: "Brazil", value: "br" },
] as const;

export const ACCENT_BLUE = "#0080FF";
