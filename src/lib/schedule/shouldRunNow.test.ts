import { describe, expect, it } from "vitest";
import { shouldRunNow } from "./shouldRunNow";

describe("shouldRunNow", () => {
  const baseConfig = {
    enabled: true,
    frequency: 1,
    primaryTime: "09:00",
    secondaryTime: "21:00",
    timezone: "Asia/Bangkok",
    lastRunSlot: null,
  };

  it("skips when disabled", () => {
    const result = shouldRunNow({ ...baseConfig, enabled: false });
    expect(result.shouldRun).toBe(false);
    expect(result.reason).toBe("disabled");
  });

  it("matches primary slot within window", () => {
    const now = new Date("2026-07-11T02:03:00.000Z"); // 09:03 Bangkok
    const result = shouldRunNow(baseConfig, now);
    expect(result.shouldRun).toBe(true);
    expect(result.slotKey).toBe("2026-07-11T09:00");
  });

  it("skips when slot already ran", () => {
    const now = new Date("2026-07-11T02:03:00.000Z");
    const result = shouldRunNow(
      { ...baseConfig, lastRunSlot: "2026-07-11T09:00" },
      now,
    );
    expect(result.shouldRun).toBe(false);
    expect(result.reason).toBe("already_ran");
  });

  it("matches secondary slot when frequency is 2", () => {
    const now = new Date("2026-07-11T14:02:00.000Z"); // 21:02 Bangkok
    const result = shouldRunNow({ ...baseConfig, frequency: 2 }, now);
    expect(result.shouldRun).toBe(true);
    expect(result.slotKey).toBe("2026-07-11T21:00");
  });
});
