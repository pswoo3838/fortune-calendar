import { useState, useEffect } from "react";
import type { CSSProperties } from "react";

interface CircularProgressLoaderProps {
  isLoading: boolean;
  message?: string;
  onComplete?: () => void;
}

export function CircularProgressLoader({
  isLoading,
  message,
  onComplete,
}: CircularProgressLoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      // 로딩이 완료되면 즉시 100%로 채움
      setProgress(100);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 300);
      return () => clearTimeout(timer);
    }

    // 로딩 중일 때 0%에서 98%까지 부드럽게 상승
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(interval);
          return 98;
        }
        // 초반엔 조금 빠르게, 후반엔 차분하게 증가
        const increment = prev < 50 ? 2 : prev < 80 ? 1.5 : 0.8;
        return Math.min(98, Math.round((prev + increment) * 10) / 10);
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isLoading, onComplete]);

  // 진행률에 따른 다이내믹 메시지
  const getDynamicStatusText = (p: number) => {
    if (message) return message;
    if (p < 25) return "사주팔자와 생년월일 기운을 읽고 있어요...";
    if (p < 65) return "gpt-4o-mini AI가 이달의 월건 기운을 분석하는 중...";
    if (p < 90) return "주차별 운세와 4대 테마 사주를 가공하고 있어요...";
    if (p < 100) return "거의 다 되었어요! 사주풀이 리포트를 정돈 중...";
    return "사주풀이가 완료되었습니다!";
  };

  const displayPercent = Math.min(100, Math.floor(progress));
  const radius = 46;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius; // 약 289.02
  const strokeDashoffset = circumference - (displayPercent / 100) * circumference;

  return (
    <div style={styles.container}>
      <div style={styles.ringWrapper}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={styles.svg}>
          <defs>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
          </defs>
          {/* 배경 트랙 원 */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#F2F4F6"
            strokeWidth={strokeWidth}
          />
          {/* 채워지는 프로그레스 원 */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#purpleGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={styles.progressCircle}
          />
        </svg>

        {/* 중앙 퍼센트 숫자 */}
        <div style={styles.percentTextWrap}>
          <span style={styles.percentNumber}>{displayPercent}</span>
          <span style={styles.percentSymbol}>%</span>
        </div>
      </div>

      {/* 상태 문구 */}
      <p style={styles.statusText}>{getDynamicStatusText(displayPercent)}</p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 16px",
  },
  ringWrapper: {
    position: "relative",
    width: "120px",
    height: "120px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  svg: {
    transform: "rotate(-90deg)", // 12시 방향부터 채워지도록 회전
  },
  progressCircle: {
    transition: "stroke-dashoffset 0.15s ease-out",
  },
  percentTextWrap: {
    position: "absolute",
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
  },
  percentNumber: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#6B4EFF",
    lineHeight: 1,
  },
  percentSymbol: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#6B4EFF",
    marginLeft: "2px",
  },
  statusText: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#4E5968",
    textAlign: "center",
    margin: 0,
    lineHeight: "1.5",
  },
};
