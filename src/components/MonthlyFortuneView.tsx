import { useState } from "react";
import type { CSSProperties } from "react";
import type { DailyFortune, Zodiac, FortuneScores } from "../types/fortune";
import { getZodiacEmoji } from "../lib/zodiac";

interface MonthlyFortuneViewProps {
  year: number;
  month: number; // 0-indexed
  zodiac: Zodiac;
  dailyFortunes: DailyFortune[];
  onClose: () => void;
}

const GRADE_COLOR: Record<string, string> = {
  대길: "#FF3B30",
  길: "#FF9500",
  보통: "#8E8E93",
  흉: "#007AFF",
  대흉: "#5856D6",
};

const SCORE_CATEGORIES: { key: keyof Omit<FortuneScores, "overall">; label: string; emoji: string }[] = [
  { key: "wealth", label: "재물", emoji: "💰" },
  { key: "love", label: "애정", emoji: "💕" },
  { key: "health", label: "건강", emoji: "💪" },
  { key: "career", label: "직장", emoji: "📈" },
  { key: "luck", label: "행운", emoji: "🍀" },
];

export function MonthlyFortuneView({
  year,
  month,
  zodiac,
  dailyFortunes,
  onClose,
}: MonthlyFortuneViewProps) {
  const emoji = getZodiacEmoji(zodiac);
  const monthDisplay = `${year}년 ${month + 1}월`;
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button type="button" onClick={onClose} style={styles.backButton}>
          ← 돌아가기
        </button>
      </div>

      <div style={styles.header}>
        <span style={styles.emoji}>{emoji}</span>
        <h2 style={styles.title}>{monthDisplay} 한달 운세</h2>
        <p style={styles.subtitle}>{zodiac}띠의 이번 달 운세입니다</p>
      </div>

      <div style={styles.fortuneList}>
        <h3 style={styles.sectionTitle}>일별 운세</h3>
        {dailyFortunes.map((fortune) => {
          const dayNum = Number.parseInt(fortune.date.split("-")[2], 10);
          const gradeColor = GRADE_COLOR[fortune.grade] ?? "#8E8E93";
          const isExpanded = expandedDate === fortune.date;

          return (
            <div key={fortune.date}>
              <button
                type="button"
                onClick={() => setExpandedDate(isExpanded ? null : fortune.date)}
                style={styles.fortuneItem}
              >
                <div style={styles.fortuneItemHeader}>
                  <span style={styles.fortuneDay}>{dayNum}일</span>
                  <span style={{ ...styles.fortuneGrade, color: gradeColor }}>{fortune.grade}</span>
                  {fortune.scores && (
                    <span style={styles.fortuneScore}>{fortune.scores.overall}점</span>
                  )}

                  <span style={styles.expandArrow}>{isExpanded ? "▲" : "▼"}</span>
                </div>
                <p style={styles.fortuneTitle}>{fortune.title}</p>
              </button>

              {/* 확장된 상세 점수 */}
              {isExpanded && fortune.scores && (
                <div style={styles.expandedScores}>
                  <div style={styles.miniScoreGrid}>
                    {SCORE_CATEGORIES.map(({ key, label, emoji: catEmoji }) => {
                      const rawScore = fortune.scores[key] as number;
                      const score = rawScore > 10 ? Math.round(rawScore / 10) : rawScore;
                      return (
                        <div key={key} style={styles.miniScoreItem}>
                          <span style={styles.miniScoreLabel}>{catEmoji} {label}</span>
                          <div style={styles.miniScoreBarBg}>
                            <div
                              style={{
                                ...styles.miniScoreBarFill,
                                width: `${score * 10}%`,
                                backgroundColor: gradeColor,
                              }}
                            />
                          </div>
                          <span style={styles.miniScoreValue}>{score}/10</span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={styles.expandedAdvice}>💡 {fortune.advice}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={styles.aiLabel}>AI가 생성한 운세입니다</p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#FAFAFA",
    paddingBottom: "40px",
  },
  topBar: {
    position: "sticky",
    top: 0,
    backgroundColor: "#FAFAFA",
    padding: "12px 16px",
    zIndex: 10,
  },
  backButton: {
    background: "none",
    border: "none",
    fontSize: "15px",
    color: "#6B4EFF",
    fontWeight: 600,
    cursor: "pointer",
    padding: "8px 0",
  },
  header: {
    textAlign: "center",
    padding: "8px 20px 24px",
  },
  emoji: {
    fontSize: "48px",
    display: "block",
    marginBottom: "8px",
  },
  title: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#1B1D1F",
    margin: "0 0 6px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6B7684",
    margin: 0,
  },
  auspiciousSection: {
    margin: "0 16px 20px",
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "16px",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#1B1D1F",
    margin: "0 0 12px 0",
  },
  auspiciousList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  auspiciousChip: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 600,
  },
  chipDate: {
    fontWeight: 700,
  },
  chipLabel: {
    fontWeight: 500,
  },
  fortuneList: {
    margin: "0 16px",
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "16px",
  },
  fortuneItem: {
    width: "100%",
    background: "none",
    border: "none",
    borderBottom: "1px solid #F2F4F6",
    padding: "12px 0",
    cursor: "pointer",
    textAlign: "left",
  },
  fortuneItemHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },
  fortuneDay: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#1B1D1F",
    minWidth: "32px",
  },
  fortuneGrade: {
    fontSize: "13px",
    fontWeight: 700,
  },
  fortuneScore: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6B7684",
    backgroundColor: "#F2F4F6",
    borderRadius: "10px",
    padding: "2px 8px",
  },
  fortuneTag: {
    fontSize: "9px",
    fontWeight: 700,
    color: "#FFFFFF",
    borderRadius: "4px",
    padding: "2px 5px",
  },
  expandArrow: {
    marginLeft: "auto",
    fontSize: "10px",
    color: "#AEB5BC",
  },
  fortuneTitle: {
    fontSize: "13px",
    color: "#4E5968",
    margin: 0,
    paddingLeft: "32px",
  },
  expandedScores: {
    padding: "12px 12px 12px 32px",
    backgroundColor: "#F9FAFB",
    borderRadius: "8px",
    marginBottom: "8px",
  },
  miniScoreGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  miniScoreItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  miniScoreLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#6B7684",
    minWidth: "56px",
  },
  miniScoreBarBg: {
    flex: 1,
    height: "6px",
    backgroundColor: "#E5E8EB",
    borderRadius: "3px",
    overflow: "hidden",
  },
  miniScoreBarFill: {
    height: "100%",
    borderRadius: "3px",
  },
  miniScoreValue: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#333D4B",
    minWidth: "30px",
    textAlign: "right",
  },
  expandedAdvice: {
    fontSize: "12px",
    color: "#6B4EFF",
    margin: "10px 0 0 0",
    lineHeight: "1.4",
  },
  aiLabel: {
    fontSize: "11px",
    color: "#AEB5BC",
    textAlign: "center",
    marginTop: "24px",
  },
};
