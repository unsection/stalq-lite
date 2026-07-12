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

  it("matches primary slot once its time has passed", () => {
    const now = new Date("2026-07-11T02:03:00.000Z"); // 09:03 Bangkok
    const result = shouldRunNow(baseConfig, now);
    expect(result.shouldRun).toBe(true);
    expect(result.slotKey).toBe("2026-07-11T09:00");
  });

  it("catches up when cron fires hours after the slot", () => {
    const now = new Date("2026-07-12T05:51:00.000Z"); // 12:51 Bangkok, slot was 10:00
    const result = shouldRunNow(
      {
        ...baseConfig,
        primaryTime: "10:00",
        secondaryTime: "16:00",
        frequency: 2,
      },
      now,
    );
    expect(result.shouldRun).toBe(true);
    expect(result.reason).toBe("matched");
    expect(result.slotKey).toBe("2026-07-12T10:00");
  });

  it("skips slots that have not started yet", () => {
    const now = new Date("2026-07-12T02:08:00.000Z"); // 09:08 Bangkok
    const result = shouldRunNow(
      {
        ...baseConfig,
        primaryTime: "10:00",
        secondaryTime: "16:00",
        frequency: 2,
      },
      now,
    );
    expect(result.shouldRun).toBe(false);
    expect(result.reason).toBe("no_slot");
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

  it("matches secondary slot when frequency is 2 and primary already ran", () => {
    const now = new Date("2026-07-11T14:02:00.000Z"); // 21:02 Bangkok
    const result = shouldRunNow(
      {
        ...baseConfig,
        frequency: 2,
        lastRunSlot: "2026-07-11T09:00",
      },
      now,
    );
    expect(result.shouldRun).toBe(true);
    expect(result.slotKey).toBe("2026-07-11T21:00");
  });

  it("runs earliest due slot first when both are overdue", () => {
    const now = new Date("2026-07-12T10:30:00.000Z"); // 17:30 Bangkok
    const result = shouldRunNow(
      {
        ...baseConfig,
        primaryTime: "10:00",
        secondaryTime: "16:00",
        frequency: 2,
        lastRunSlot: null,
      },
      now,
    );
    expect(result.shouldRun).toBe(true);
    expect(result.slotKey).toBe("2026-07-12T10:00");
  });
});
