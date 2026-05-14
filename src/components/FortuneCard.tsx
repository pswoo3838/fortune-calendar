import type { CSSProperties } from "react";
import type { DailyFortune, FortuneScores } from "../types/fortune";
import { getZodiacEmoji } from "../lib/zodiac";

interface FortuneCardProps {
  fortune: DailyFortune;
  label: string; // "오늘의 운세" 또는 "내일의 운세"
}

const GRADE_COLOR: Record<string, string> = {
  대길: "#FF3B30",
  길: "#FF9500",
  보통: "#8E8E93",
  흉: "#007AFF",
  대흉: "#5856D6",
};

const GRADE_BG: Record<string, string> = {
  대길: "#FFF5F5",
  길: "#FFF8F0",
  보통: "#F9FAFB",
  흉: "#F0F7FF",
  대흉: "#F5F3FF",
};

const SCORE_CATEGORIES: { key: keyof Omit<FortuneScores, "overall">; label: string; emoji: string }[] = [
  { key: "wealth", label: "재물운", emoji: "💰" },
  { key: "love", label: "애정운", emoji: "💕" },
  { key: "health", label: "건강운", emoji: "💪" },
  { key: "career", label: "직장·학업", emoji: "📈" },
  { key: "luck", label: "행운지수", emoji: "🍀" },
];

function getScoreColor(score: number): string {
  if (score >= 80) return "#FF3B30";
  if (score >= 60) return "#FF9500";
  if (score >= 40) return "#8E8E93";
  if (score >= 20) return "#007AFF";
  return "#5856D6";
}

function getScoreGrade(score: number): string {
  if (score >= 85) return "대길";
  if (score >= 65) return "길";
  if (score >= 40) return "보통";
  if (score >= 20) return "흉";
  return "대흉";
}

export function FortuneCard({ fortune, label }: FortuneCardProps) {
  const emoji = getZodiacEmoji(fortune.zodiac);
  const gradeColor = GRADE_COLOR[fortune.grade] ?? "#8E8E93";
  const gradeBg = GRADE_BG[fortune.grade] ?? "#F9FAFB";

  const dateParts = fortune.date.split("-");
  const displayDate = `${Number.parseInt(dateParts[1], 10)}월 ${Number.parseInt(
    dateParts[2],
    10,
  )}일`;

  const adviceLabel = label === "내일의 운세" ? "내일의 조언" : "오늘의 조언";

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.headerEmoji} role="img" aria-label={`${fortune.zodiac}띠`}>
          {emoji}
        </span>
        <div>
          <p style={styles.label}>{label}</p>
          <p style={styles.date}>{displayDate}</p>
        </div>
      </div>

      {/* 등급 배지 */}
      <div style={{ ...styles.gradeBadge, backgroundColor: gradeBg }}>
        <span style={{ ...styles.gradeText, color: gradeColor }}>{fortune.grade}</span>
        <span style={styles.gradeTitle}>{fortune.title}</span>
      </div>

      {/* 종합 점수 (원형 게이지) */}
      {fortune.scores && (
        <div style={styles.overallContainer}>
          <div style={styles.circularGauge}>
            <svg viewBox="0 0 100 100" style={styles.circularSvg}>
              <circle cx="50" cy="50" r="45" style={styles.circularBg} />
              <circle
                cx="50"
                cy="50"
                r="45"
                style={{
                  ...styles.circularProgress,
                  strokeDasharray: `${2 * Math.PI * 45}`,
                  strokeDashoffset: `${2 * Math.PI * 45 * (1 - fortune.scores.overall / 100)}`,
                  stroke: getScoreColor(fortune.scores.overall),
                }}
              />
            </svg>
            <div style={styles.overallTextContainer}>
              <span style={{ ...styles.overallScore, color: getScoreColor(fortune.scores.overall) }}>
                {fortune.scores.overall}
              </span>
              <span style={styles.overallLabel}>종합 점수</span>
            </div>
          </div>
        </div>
      )}

      <p style={styles.description}>{fortune.description}</p>

      {/* 운세 점수 */}
      {fortune.scores && (
        <div style={styles.scoresSection}>
          <h4 style={styles.scoresTitle}>카테고리별 점수</h4>
          <div style={styles.scoresGrid}>
            {SCORE_CATEGORIES.map(({ key, label: catLabel, emoji: catEmoji }) => {
              const rawScore = fortune.scores[key] as number;
              const score = rawScore > 10 ? Math.round(rawScore / 10) : rawScore; // 하위 호환성 (기존 100점 만점 캐시 처리)
              const score100 = score * 10;
              const scoreColor = getScoreColor(score100);
              const scoreGrade = getScoreGrade(score100);
              return (
                <div key={key} style={styles.scoreItem}>
                  <div style={styles.scoreHeader}>
                    <span style={styles.scoreEmoji}>{catEmoji}</span>
                    <span style={styles.scoreCatLabel}>{catLabel}</span>
                  </div>
                  <div style={styles.scoreBarBg}>
                    <div
                      style={{
                        ...styles.scoreBarFill,
                        width: `${score100}%`,
                        backgroundColor: scoreColor,
                      }}
                    />
                  </div>
                  <div style={styles.scoreValueRow}>
                    <span style={{ ...styles.scoreGrade, color: scoreColor }}>{scoreGrade}</span>
                    <span style={{ ...styles.scoreValue, color: scoreColor }}>{score}/10</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 행운 정보 */}
      <div style={styles.extras}>
        <div style={styles.extraItem}>
          <span style={styles.extraLabel}>행운의 색</span>
          <span style={styles.extraValue}>{fortune.luckyColor}</span>
        </div>
        <div style={styles.extraItem}>
          <span style={styles.extraLabel}>행운의 숫자</span>
          <span style={styles.extraValue}>{fortune.luckyNumber}</span>
        </div>
      </div>

      {/* 시간대별 흐름 */}
      {fortune.timeFlow && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>시간대별 운기 흐름</h4>
          <div style={styles.timeFlowContainer}>
            {[
              { label: "오전", val: fortune.timeFlow.morning },
              { label: "오후", val: fortune.timeFlow.afternoon },
              { label: "저녁", val: fortune.timeFlow.evening },
              { label: "밤", val: fortune.timeFlow.night },
            ].map((t) => (
              <div key={t.label} style={styles.timeFlowItem}>
                <span style={styles.timeFlowLabel}>{t.label}</span>
                <div style={styles.timeFlowBarBg}>
                  <div style={{ ...styles.timeFlowBarFill, height: `${t.val}%`, backgroundColor: getScoreColor(t.val) }} />
                </div>
                <span style={styles.timeFlowVal}>{t.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 럭키 아이템 및 주의 행동 */}
      <div style={styles.section}>
        <div style={styles.luckyAvoidContainer}>
          <div style={styles.luckyBox}>
            <span style={styles.luckyBoxTitle}>🍀 행운의 아이템</span>
            <span style={styles.luckyBoxText}>{fortune.luckyItem || "없음"}</span>
          </div>
          <div style={styles.avoidBox}>
            <span style={styles.avoidBoxTitle}>⚠️ 주의할 행동</span>
            <span style={styles.avoidBoxText}>{fortune.avoidAction || "없음"}</span>
          </div>
        </div>
      </div>

      <div style={styles.adviceBox}>
        <p style={styles.adviceLabel}>{adviceLabel}</p>
        <p style={styles.adviceText}>{fortune.advice}</p>
      </div>

      <p style={styles.aiLabel}>AI가 생성한 운세입니다</p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px 20px",
    marginTop: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    animation: "fadeIn 0.3s ease-out",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  headerEmoji: {
    fontSize: "40px",
  },
  label: {
    fontSize: "13px",
    color: "#6B7684",
    margin: "0 0 2px 0",
  },
  date: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#1B1D1F",
    margin: 0,
  },
  gradeBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "16px",
  },
  gradeText: {
    fontSize: "20px",
    fontWeight: 800,
  },
  gradeTitle: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#333D4B",
  },
  description: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#4E5968",
    margin: "0 0 20px 0",
  },
  // 종합 점수 게이지
  overallContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "24px",
  },
  circularGauge: {
    position: "relative",
    width: "120px",
    height: "120px",
  },
  circularSvg: {
    width: "100%",
    height: "100%",
    transform: "rotate(-90deg)",
  },
  circularBg: {
    fill: "none",
    stroke: "#F2F4F6",
    strokeWidth: "8",
  },
  circularProgress: {
    fill: "none",
    strokeWidth: "8",
    strokeLinecap: "round",
    transition: "stroke-dashoffset 1s ease-out",
  },
  overallTextContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  overallScore: {
    fontSize: "28px",
    fontWeight: 800,
    lineHeight: "1",
    marginBottom: "4px",
  },
  overallLabel: {
    fontSize: "12px",
    color: "#8B95A1",
    fontWeight: 500,
  },
  // 점수 섹션
  scoresSection: {
    marginBottom: "20px",
  },
  scoresTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#1B1D1F",
    margin: "0 0 14px 0",
  },
  scoresGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  scoreItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  scoreHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  scoreEmoji: {
    fontSize: "14px",
  },
  scoreCatLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#333D4B",
  },
  scoreBarBg: {
    height: "8px",
    backgroundColor: "#F2F4F6",
    borderRadius: "4px",
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.6s ease-out",
  },
  scoreValueRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreGrade: {
    fontSize: "11px",
    fontWeight: 700,
  },
  scoreValue: {
    fontSize: "13px",
    fontWeight: 700,
  },
  // 행운 정보
  extras: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  extraItem: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: "10px",
    padding: "12px",
    textAlign: "center",
  },
  extraLabel: {
    display: "block",
    fontSize: "11px",
    color: "#8B95A1",
    marginBottom: "4px",
  },
  extraValue: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1B1D1F",
  },
  section: {
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#1B1D1F",
    margin: "0 0 14px 0",
  },
  timeFlowContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: "100px",
    padding: "0 10px",
  },
  timeFlowItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    width: "40px",
  },
  timeFlowLabel: {
    fontSize: "12px",
    color: "#6B7684",
  },
  timeFlowBarBg: {
    width: "8px",
    height: "60px",
    backgroundColor: "#F2F4F6",
    borderRadius: "4px",
    position: "relative",
  },
  timeFlowBarFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    borderRadius: "4px",
    transition: "height 0.6s ease-out",
  },
  timeFlowVal: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#4E5968",
  },
  luckyAvoidContainer: {
    display: "flex",
    gap: "12px",
  },
  luckyBox: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    borderRadius: "12px",
    padding: "14px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  avoidBox: {
    flex: 1,
    backgroundColor: "#FFEBEE",
    borderRadius: "12px",
    padding: "14px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  luckyBoxTitle: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#2E7D32",
  },
  luckyBoxText: {
    fontSize: "13px",
    color: "#1B1D1F",
  },
  avoidBoxTitle: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#C62828",
  },
  avoidBoxText: {
    fontSize: "13px",
    color: "#1B1D1F",
  },
  adviceBox: {
    backgroundColor: "#F4F1FF",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "16px",
  },
  adviceLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6B4EFF",
    margin: "0 0 6px 0",
  },
  adviceText: {
    fontSize: "14px",
    color: "#333D4B",
    margin: 0,
    lineHeight: "1.5",
  },
  aiLabel: {
    fontSize: "11px",
    color: "#AEB5BC",
    textAlign: "center",
    margin: 0,
  },
};
