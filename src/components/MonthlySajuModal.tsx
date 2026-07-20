import type { CSSProperties } from "react";
import type { MonthlySajuReport } from "../types/fortune";

interface MonthlySajuModalProps {
  report: MonthlySajuReport | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export function MonthlySajuModal({
  report,
  isLoading,
  error,
  onClose,
}: MonthlySajuModalProps) {
  if (!report && !isLoading && !error) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={styles.header}>
          <div>
            <span style={styles.badge}>🔮 990 월간 사주</span>
            <h2 style={styles.title}>
              {report ? `${report.month}월 명리 사주풀이` : "월간 사주 분석 중"}
            </h2>
          </div>
          <button type="button" style={styles.closeBtn} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>
              사주 명리와 별자리의 기운을 꼼꼼히 분석하고 있어요...
            </p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {/* 결과 리포트 */}
        {report && !isLoading && (
          <div style={styles.content}>
            {/* 1. 프로필 요약 카드 */}
            <div style={styles.profileCard}>
              <div style={styles.profileRow}>
                <span style={styles.profileName}>{report.userProfile.name} 님</span>
                <span style={styles.profileMeta}>
                  {report.userProfile.zodiac}띠 · {report.userProfile.gender}성 · {report.userProfile.birthDate} ({report.userProfile.birthTime || "시간모름"})
                </span>
              </div>
            </div>

            {/* 2. 사주 총평 및 핵심 헤드라인 */}
            <div style={styles.sectionCard}>
              <p style={styles.overviewTitle}>✨ {report.monthlyOverview.title}</p>
              <p style={styles.overviewDesc}>{report.monthlyOverview.description}</p>
            </div>

            {/* 3. 월간 운세 점수 */}
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>📊 {report.month}월 분야별 기운 지수</h3>
              <div style={styles.scoreGrid}>
                <div style={styles.scoreItem}>
                  <span style={styles.scoreLabel}>종합운</span>
                  <span style={styles.scoreValue}>{report.monthlyOverview.scores.overall}점</span>
                </div>
                <div style={styles.scoreItem}>
                  <span style={styles.scoreLabel}>💰 재물운</span>
                  <span style={styles.scoreValue}>{report.monthlyOverview.scores.wealth}점</span>
                </div>
                <div style={styles.scoreItem}>
                  <span style={styles.scoreLabel}>❤️ 애정운</span>
                  <span style={styles.scoreValue}>{report.monthlyOverview.scores.love}점</span>
                </div>
                <div style={styles.scoreItem}>
                  <span style={styles.scoreLabel}>💼 직장운</span>
                  <span style={styles.scoreValue}>{report.monthlyOverview.scores.career}점</span>
                </div>
                <div style={styles.scoreItem}>
                  <span style={styles.scoreLabel}>🌿 건강운</span>
                  <span style={styles.scoreValue}>{report.monthlyOverview.scores.health}점</span>
                </div>
              </div>
            </div>

            {/* 4. 주차별 흐름 타임라인 */}
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>📅 주차별 운기 흐름</h3>
              <div style={styles.weeklyList}>
                {report.weeklyFlow.map((w) => (
                  <div key={w.week} style={styles.weeklyItem}>
                    <div style={styles.weeklyBadge}>{w.week}주차</div>
                    <div style={styles.weeklyContent}>
                      <span style={styles.weeklyKeyword}>{w.keyword}</span>
                      <p style={styles.weeklyAdvice}>{w.advice}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. 4대 테마 상세 풀이 */}
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>📜 테마별 명리 풀이</h3>
              <div style={styles.themeGroup}>
                <div style={styles.themeBox}>
                  <span style={styles.themeTitle}>💰 재물 & 금전 기운</span>
                  <p style={styles.themeDesc}>{report.categoryFortunes.wealth}</p>
                </div>
                <div style={styles.themeBox}>
                  <span style={styles.themeTitle}>❤️ 애정 & 인간관계</span>
                  <p style={styles.themeDesc}>{report.categoryFortunes.love}</p>
                </div>
                <div style={styles.themeBox}>
                  <span style={styles.themeTitle}>💼 직장 & 사업/학업</span>
                  <p style={styles.themeDesc}>{report.categoryFortunes.career}</p>
                </div>
                <div style={styles.themeBox}>
                  <span style={styles.themeTitle}>🌿 건강 & 심신 관리</span>
                  <p style={styles.themeDesc}>{report.categoryFortunes.health}</p>
                </div>
              </div>
            </div>

            {/* 6. 월간 처방전 & 이달의 대길일 (Best Days) */}
            <div style={{ ...styles.sectionCard, border: "1px solid #6B4EFF", backgroundColor: "#F9F8FF" }}>
              <h3 style={{ ...styles.sectionTitle, color: "#6B4EFF" }}>🍀 이달의 행운 처방전 & 대길일</h3>
              <div style={styles.prescriptionGrid}>
                <div style={styles.prescItem}>
                  <span style={styles.prescLabel}>🎨 행운의 색상</span>
                  <span style={styles.prescVal}>{report.monthlyPrescription.luckyColor}</span>
                </div>
                <div style={styles.prescItem}>
                  <span style={styles.prescLabel}>🧭 행운의 방향</span>
                  <span style={styles.prescVal}>{report.monthlyPrescription.luckyDirection}</span>
                </div>
                <div style={styles.prescItem}>
                  <span style={styles.prescLabel}>🔢 행운의 숫자</span>
                  <span style={styles.prescVal}>{report.monthlyPrescription.luckyNumber}</span>
                </div>
                <div style={styles.prescItem}>
                  <span style={styles.prescLabel}>🎁 행운의 아이템</span>
                  <span style={styles.prescVal}>{report.monthlyPrescription.luckyItem}</span>
                </div>
              </div>

              <div style={styles.avoidBox}>
                <span style={styles.avoidLabel}>⚠️ 이달의 주의사항</span>
                <p style={styles.avoidText}>{report.monthlyPrescription.avoidAction}</p>
              </div>

              {/* 이달의 대길일 (Best Days - '행운의 날'과 100% 동일) */}
              <div style={styles.bestDaysBox}>
                <span style={styles.bestDaysLabel}>🔴 이달의 최고 대길일 (Best Days)</span>
                <div style={styles.bestDaysPills}>
                  {report.monthlyPrescription.bestDays.map((d) => {
                    const [, m, day] = d.split("-");
                    return (
                      <span key={d} style={styles.bestDayPill}>
                        ✨ {Number(m)}월 {Number(day)}일
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 확인 버튼 */}
        <div style={styles.footer}>
          <button type="button" style={styles.confirmBtn} onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "16px",
  },
  modal: {
    width: "100%",
    maxWidth: "480px",
    maxHeight: "85vh",
    backgroundColor: "#fff",
    borderRadius: "24px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  header: {
    padding: "20px 24px 16px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottom: "1px solid #F2F4F6",
  },
  badge: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#6B4EFF",
    backgroundColor: "#EDE9FF",
    padding: "3px 8px",
    borderRadius: "6px",
  },
  title: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#1B1D1F",
    margin: "6px 0 0",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#8B95A1",
    cursor: "pointer",
    padding: "4px",
  },
  content: {
    padding: "20px 24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  loadingBox: {
    padding: "40px 24px",
    textAlign: "center",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "4px solid #EDE9FF",
    borderTopColor: "#6B4EFF",
    borderRadius: "50%",
    margin: "0 auto 16px",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: "14px",
    color: "#6B7684",
    margin: 0,
  },
  errorBox: {
    padding: "30px 24px",
    textAlign: "center",
  },
  errorText: {
    fontSize: "14px",
    color: "#F04452",
    margin: 0,
  },
  profileCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: "14px",
    padding: "14px 16px",
  },
  profileRow: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  profileName: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#1B1D1F",
  },
  profileMeta: {
    fontSize: "12px",
    color: "#8B95A1",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    border: "1px solid #F2F4F6",
    padding: "18px",
  },
  overviewTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#6B4EFF",
    margin: "0 0 8px",
  },
  overviewDesc: {
    fontSize: "13px",
    color: "#4E5968",
    lineHeight: "1.6",
    margin: 0,
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#1B1D1F",
    margin: "0 0 12px",
  },
  scoreGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },
  scoreItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: "10px",
    padding: "10px",
    textAlign: "center",
  },
  scoreLabel: {
    fontSize: "11px",
    color: "#8B95A1",
    display: "block",
    marginBottom: "4px",
  },
  scoreValue: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#1B1D1F",
  },
  weeklyList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  weeklyItem: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  weeklyBadge: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#6B4EFF",
    backgroundColor: "#EDE9FF",
    padding: "4px 8px",
    borderRadius: "8px",
    flexShrink: 0,
  },
  weeklyContent: {
    flex: 1,
  },
  weeklyKeyword: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1B1D1F",
    display: "block",
    marginBottom: "2px",
  },
  weeklyAdvice: {
    fontSize: "12px",
    color: "#6B7684",
    margin: 0,
    lineHeight: "1.4",
  },
  themeGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  themeBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: "12px",
    padding: "12px 14px",
  },
  themeTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1B1D1F",
    display: "block",
    marginBottom: "4px",
  },
  themeDesc: {
    fontSize: "12px",
    color: "#4E5968",
    lineHeight: "1.5",
    margin: 0,
  },
  prescriptionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
    marginBottom: "14px",
  },
  prescItem: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "10px 12px",
    border: "1px solid #EDE9FF",
  },
  prescLabel: {
    fontSize: "11px",
    color: "#8B95A1",
    display: "block",
    marginBottom: "2px",
  },
  prescVal: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1B1D1F",
  },
  avoidBox: {
    backgroundColor: "#FFF5F5",
    borderRadius: "10px",
    padding: "10px 12px",
    marginBottom: "14px",
  },
  avoidLabel: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#F04452",
    display: "block",
    marginBottom: "2px",
  },
  avoidText: {
    fontSize: "12px",
    color: "#4E5968",
    margin: 0,
  },
  bestDaysBox: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "12px",
    border: "1px solid #EDE9FF",
  },
  bestDaysLabel: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#FF3B30",
    display: "block",
    marginBottom: "8px",
  },
  bestDaysPills: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  bestDayPill: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#6B4EFF",
    backgroundColor: "#EDE9FF",
    padding: "6px 12px",
    borderRadius: "20px",
  },
  footer: {
    padding: "16px 24px",
    borderTop: "1px solid #F2F4F6",
  },
  confirmBtn: {
    width: "100%",
    height: "48px",
    backgroundColor: "#6B4EFF",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 700,
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
  },
};
