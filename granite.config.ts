import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "fortunecalendar",
  brand: {
    displayName: "운세 캘린더", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#6B4EFF", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "https://static.toss.im/appsintoss/37061/2d8c7b49-800b-42ee-a658-59baef89b41b.png",
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
