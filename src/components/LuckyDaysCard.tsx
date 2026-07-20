import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import type { UserProfile, FortuneGrade } from "../types/fortune";

interface LuckyDay {
  date: string;
  grade: FortuneGrade;
  title: string;
  score?: number;
}

interface LuckyDaysCardProps {
  profile: UserProfile;
  year: number;
  month: number;
  onClose: () => void;
}

const GRADE_COLOR: Record<string, string> = {
  대길: "#FF3B30",
  길: "#FF9500",
  보통: "#8E8E93",
  흉: "#007AFF",
  대흉: "#5856D6",
};

const GRADE_EMOJI: Record<string, string> = {
  대길: "🔴",
  길: "🟠",
  보통: "⚪",
  흉: "🔵",
  대흉: "🟣",
};

export function LuckyDaysCard({ profile, year, month, onClose }: LuckyDaysCardProps) {
  const [luckyDays, setLuckyDays] = useState<LuckyDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLuckyDays = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { getOrFetchLuckyDays } = await import("../lib/fortuneService");
        const good = await getOrFetchLuckyDays(profile, year, month);

        if (good.length === 0) {
          setError("행운의 날을 불러오지 못했습니다.");
        } else {
          setLuckyDays(good);
        }
      } catch (err) {
        console.error("LuckyDays fetch error:", err);
        setError("행운의 날을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLuckyDays();
  }, [profile, year, month]);

  const monthLabel = `${year}년 ${month}월`;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <p style={styles.headerSub}>이번 달 행운의 날</p>
          <p style={styles.headerTitle}>✨ {monthLabel} 길일 분석</p>
        </div>
        <button
          type="button"
          id="lucky-days-close-btn"
          style={styles.closeBtn}
          onClick={onClose}
          aria-label="행운의 날 카드 닫기"
        >
          ✕
        </button>
      </div>

      {isLoading && (
        <p style={styles.loadingText}>AI가 이번 달 운기를 분석 중이에요...</p>
      )}

      {error && <p style={styles.errorText}>{error}</p>}

      {!isLoading && !error && luckyDays.length === 0 && (
        <p style={styles.emptyText}>이번 달엔 특별히 좋은 날이 없어요.</p>
      )}

      {!isLoading && luckyDays.length > 0 && (
        <>
          <p style={styles.desc}>
            {profile.zodiac}띠에게 이번 달 특별히 운기가 좋은 날이에요 🍀
          </p>
          <div style={styles.list}>
            {luckyDays.map((day) => {
              const [, m, d] = day.date.split("-");
              const dateLabel = `${Number(m)}월 ${Number(d)}일`;
              return (
                <div key={day.date} style={styles.item}>
                  <span style={styles.itemDate}>{dateLabel}</span>
                  <span
                    style={{
                      ...styles.itemGrade,
                      color: GRADE_COLOR[day.grade] ?? "#8E8E93",
                    }}
                  >
                    {GRADE_EMOJI[day.grade]} {day.grade}
                  </span>
                  <span style={styles.itemTitle}>{day.title}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    margin: "0 16px 16px",
    backgroundColor: "#fff",
    borderRadius: "20px",
    padding: "22px 20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
    animation: "fadeIn 0.3s ease-out",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "14px",
  },
  headerSub: {
    fontSize: "12px",
    color: "#8B95A1",
    margin: "0 0 2px",
  },
  headerTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#1B1D1F",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    color: "#AEB5BC",
    cursor: "pointer",
    padding: "4px",
  },
  desc: {
    fontSize: "13px",
    color: "#4E5968",
    margin: "0 0 16px",
    lineHeight: "1.5",
  },
  loadingText: {
    fontSize: "13px",
    color: "#8B95A1",
    textAlign: "center",
    padding: "20px 0",
  },
  errorText: {
    fontSize: "13px",
    color: "#F04452",
    textAlign: "center",
    padding: "16px 0",
  },
  emptyText: {
    fontSize: "13px",
    color: "#8B95A1",
    textAlign: "center",
    padding: "20px 0",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#F9FAFB",
    borderRadius: "12px",
    padding: "12px 14px",
  },
  itemDate: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#1B1D1F",
    minWidth: "56px",
  },
  itemGrade: {
    fontSize: "13px",
    fontWeight: 700,
    minWidth: "50px",
  },
  itemTitle: {
    fontSize: "13px",
    color: "#4E5968",
    flex: 1,
  },
};
