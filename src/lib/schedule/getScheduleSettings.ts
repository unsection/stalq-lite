import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scheduleSettings, type ScheduleSettings } from "@/db/schema";
import { appendCompletedSlot } from "@/lib/schedule/slots";

export const DEFAULT_SCHEDULE = {
  enabled: false,
  frequency: 1,
  primaryTime: "09:00",
  secondaryTime: "21:00",
  timezone: "Asia/Bangkok",
} as const;

export const getScheduleSettings = async (): Promise<ScheduleSettings> => {
  const [existing] = await db.select().from(scheduleSettings).limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(scheduleSettings)
    .values({
      enabled: DEFAULT_SCHEDULE.enabled,
      frequency: DEFAULT_SCHEDULE.frequency,
      primaryTime: DEFAULT_SCHEDULE.primaryTime,
      secondaryTime: DEFAULT_SCHEDULE.secondaryTime,
      timezone: DEFAULT_SCHEDULE.timezone,
    })
    .returning();

  return created;
};

export const updateScheduleSettings = async (
  values: Partial<{
    enabled: boolean;
    frequency: number;
    primaryTime: string;
    secondaryTime: string | null;
    timezone: string;
  }>,
) => {
  const current = await getScheduleSettings();

  const [updated] = await db
    .update(scheduleSettings)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(scheduleSettings.id, current.id))
    .returning();

  return updated;
};

export const markScheduleRun = async (slotKey: string) => {
  const current = await getScheduleSettings();

  const [updated] = await db
    .update(scheduleSettings)
    .set({
      lastRunAt: new Date(),
      lastRunSlot: appendCompletedSlot(current.lastRunSlot, slotKey),
      updatedAt: new Date(),
    })
    .where(eq(scheduleSettings.id, current.id))
    .returning();

  return updated;
};
