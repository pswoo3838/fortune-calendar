import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// 브라우저 및 토스 시뮬레이터 환경에서 getSafeAreaInsets 등의 브릿지 에러 방지용 Stub 설정
if (typeof window !== "undefined") {
  const win = window as any;
  if (!win.toss) {
    win.toss = {};
  }
  // 에러: getSafeAreaInsets is not a constant handler 해결을 위해
  // 함수가 올바른 구조로 존재할 수 있도록 주입
  win.toss.getSafeAreaInsets = () => {
    return Promise.resolve({ top: 0, bottom: 0, left: 0, right: 0 });
  };
}

import config from "../granite.config";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <TDSMobileAITProvider brandPrimaryColor={config.brand.primaryColor}>
      <App />
    </TDSMobileAITProvider>
  </StrictMode>,
);
