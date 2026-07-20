import { NextResponse } from "next/server";
import {
  getAiSettings,
  toAiSettingsResponse,
  updateAiSettings,
} from "@/lib/ai/getAiSettings";
import { aiSettingsSchema } from "@/lib/validation";

export const GET = async () => {
  try {
    const settings = await getAiSettings();
    return NextResponse.json(toAiSettingsResponse(settings));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load AI settings" },
      { status: 500 },
    );
  }
};

export const PATCH = async (request: Request) => {
  try {
    const body = await request.json();
    const parsed = aiSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const current = await getAiSettings();
    if (!parsed.data.openrouterApiKey && !current.openrouterApiKey) {
      return NextResponse.json(
        { message: "OpenRouter API key is required" },
        { status: 400 },
      );
    }

    const updated = await updateAiSettings({
      openrouterApiKey: parsed.data.openrouterApiKey,
      model: parsed.data.model,
    });

    return NextResponse.json(toAiSettingsResponse(updated));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update AI settings" },
      { status: 500 },
    );
  }
};
