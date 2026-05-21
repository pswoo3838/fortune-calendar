import { useState, useEffect, useRef } from "react";
import { attachBannerAd } from "../lib/adManager";

export function BannerAd() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let destroy: (() => void) | null = null;

    const attach = async () => {
      if (containerRef.current) {
        const cleanup = await attachBannerAd(containerRef.current);
        if (cleanup) {
          destroy = cleanup;
          setIsLoaded(true);
        }
      }
    };

    void attach();

    return () => {
      destroy?.();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* 광고가 로드되지 않았을 때만 placeholder 표시 */}
      {!isLoaded && (
        <div
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
      )}
      {/* 실제 광고가 장착되는 컨테이너 */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          display: isLoaded ? "block" : "none",
        }}
      />
    </div>
  );
}
