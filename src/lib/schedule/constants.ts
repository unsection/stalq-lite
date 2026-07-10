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

export const verifyCronSecret = (request: Request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { ok: false as const, status: 500, message: "CRON_SECRET is not configured" };
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }

  return { ok: true as const };
};
