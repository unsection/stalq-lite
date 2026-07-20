import { eq } from "drizzle-orm";
import { db } from "@/db";
import { aiSettings, type AiSettings } from "@/db/schema";
import { DEFAULT_AI_MODEL } from "@/lib/ai/constants";

export { DEFAULT_AI_MODEL };

export const getAiSettings = async (): Promise<AiSettings> => {
  const [existing] = await db.select().from(aiSettings).limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(aiSettings)
    .values({
      openrouterApiKey: null,
      model: DEFAULT_AI_MODEL,
    })
    .returning();

  return created;
};

export const updateAiSettings = async (values: {
  openrouterApiKey?: string | null;
  model: string;
}) => {
  const current = await getAiSettings();
  const nextKey =
    values.openrouterApiKey === undefined || values.openrouterApiKey === ""
      ? current.openrouterApiKey
      : values.openrouterApiKey;

  const [updated] = await db
    .update(aiSettings)
    .set({
      openrouterApiKey: nextKey,
      model: values.model,
      updatedAt: new Date(),
    })
    .where(eq(aiSettings.id, current.id))
    .returning();

  return updated;
};

export const toAiSettingsResponse = (settings: AiSettings) => ({
  id: settings.id,
  model: settings.model,
  hasApiKey: Boolean(settings.openrouterApiKey),
  updatedAt: settings.updatedAt,
});
