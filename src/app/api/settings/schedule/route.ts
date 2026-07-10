import { NextResponse } from "next/server";
import {
  getScheduleSettings,
  updateScheduleSettings,
} from "@/lib/schedule/getScheduleSettings";
import { scheduleSettingsSchema } from "@/lib/validation";

export const GET = async () => {
  try {
    const settings = await getScheduleSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load settings" },
      { status: 500 },
    );
  }
};

export const PATCH = async (request: Request) => {
  try {
    const body = await request.json();
    const parsed = scheduleSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const updated = await updateScheduleSettings({
      enabled: input.enabled,
      frequency: input.frequency,
      primaryTime: input.primaryTime,
      secondaryTime: input.frequency === 2 ? input.secondaryTime ?? null : null,
      timezone: input.timezone,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 },
    );
  }
};
