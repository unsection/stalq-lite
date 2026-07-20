import { Suspense } from "react";
import { SettingsPageClient } from "@/components/SettingsPageClient";

export const dynamic = "force-dynamic";

const SettingsPage = () => {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-zinc-500">Loading settings...</p>
        </div>
      }
    >
      <SettingsPageClient />
    </Suspense>
  );
};

export default SettingsPage;
