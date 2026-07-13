import { describe, expect, it } from "vitest";
import { appendCompletedSlot, formatSlotKey, parseCompletedSlots } from "./slots";

describe("slot helpers", () => {
  it("formats a slot key in the schedule timezone", () => {
    const date = new Date("2026-07-13T03:00:00.000Z"); // 10:00 Bangkok
    expect(formatSlotKey(date, "Asia/Bangkok")).toBe("2026-07-13T10:00");
  });

  it("parses legacy single slot keys", () => {
    expect(parseCompletedSlots("2026-07-12T10:00")).toEqual(["2026-07-12T10:00"]);
  });

  it("parses JSON arrays of slot keys", () => {
    expect(
      parseCompletedSlots(JSON.stringify(["2026-07-12T10:00", "2026-07-12T16:00"])),
    ).toEqual(["2026-07-12T10:00", "2026-07-12T16:00"]);
  });

  it("appends slots and drops previous-day entries", () => {
    const next = appendCompletedSlot(
      JSON.stringify(["2026-07-11T10:00", "2026-07-12T10:00"]),
      "2026-07-12T16:00",
    );
    expect(JSON.parse(next)).toEqual(["2026-07-12T10:00", "2026-07-12T16:00"]);
  });
});
