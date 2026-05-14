import { useEffect, useRef } from "react";
import { attachBannerAd } from "../lib/adManager";

export function BannerAd() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let destroy: (() => void) | null = null;

    const attach = async () => {
      if (containerRef.current) {
        destroy = await attachBannerAd(containerRef.current);
      }
    };

    void attach();

    return () => {
      destroy?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "96px",
        backgroundColor: "#F2F4F6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontSize: "12px", color: "#AEB5BC" }}>광고</span>
    </div>
  );
}
