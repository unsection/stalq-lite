import { ScheduleSettingsForm } from "@/components/ScheduleSettingsForm";

export const dynamic = "force-dynamic";

const SettingsPage = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure global scheduled price checks for all tracked products.
        </p>
      </div>
      <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
        <ScheduleSettingsForm />
      </div>
    </div>
  );
};

export default SettingsPage;
