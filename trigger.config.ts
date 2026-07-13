import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  // Find your project ref on the Trigger.dev dashboard → Project settings.
  project: process.env.TRIGGER_PROJECT_REF ?? "proj_REPLACE_ME",
  dirs: ["./src/trigger"],
  maxDuration: 300,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 2,
      minTimeoutInMs: 5000,
      maxTimeoutInMs: 30000,
      factor: 2,
      randomize: true,
    },
  },
});
