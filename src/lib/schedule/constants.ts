export const TIMEZONE_OPTIONS = [
  { label: "Bangkok (ICT)", value: "Asia/Bangkok" },
  { label: "UTC", value: "UTC" },
  { label: "New York (ET)", value: "America/New_York" },
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "Singapore (SGT)", value: "Asia/Singapore" },
  { label: "Sydney (AEST)", value: "Australia/Sydney" },
] as const;

export const FREQUENCY_OPTIONS = [
  { label: "Once a day", value: 1 },
  { label: "Twice a day", value: 2 },
] as const;
