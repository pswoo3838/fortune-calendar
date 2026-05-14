import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "fortunecalendar",
  brand: {
    displayName: "운세 캘린더", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#6B4EFF", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "", // TODO: 앱인토스 콘솔에서 등록한 앱 아이콘 URL로 교체 필수 (출시 검수 필수 항목)
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
