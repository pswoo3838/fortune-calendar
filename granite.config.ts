import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "fortunecalendar",
  brand: {
    displayName: "운세 캘린더",
    primaryColor: "#6B4EFF",
    icon: "https://static.toss.im/appsintoss/37061/2d8c7b49-800b-42ee-a658-59baef89b41b.png",
  },
  web: {
    host: "172.30.1.44",
    port: 5173,
    commands: {
      dev: "vite dev --host 0.0.0.0",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
