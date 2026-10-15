import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import aitDevtools from "@apps-in-toss/devtools/unplugin";
import { MONTHLY_SAJU_PRODUCT, ANNUAL_SAJU_PRODUCT } from "./src/lib/products";

export default defineConfig({
  plugins: [aitDevtools.vite({
    initialState: {
      iap: {
        products: [MONTHLY_SAJU_PRODUCT, ANNUAL_SAJU_PRODUCT].map((product) => ({
          ...product,
          type: "CONSUMABLE" as const,
          iconUrl: "",
          description: product.displayName,
        })),
      },
    },
  }), react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
