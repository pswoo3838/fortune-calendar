import { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import type { Gender, BirthTimeSlot } from "../types/fortune";
import { TermsPage } from "../pages/TermsPage";
import { PrivacyPage } from "../pages/PrivacyPage";

interface RegistrationFormProps {
  onRegister: (name: string, birthDate: string, birthTime: BirthTimeSlot, gender: Gender) => void;
}

const BIRTH_TIME_OPTIONS: { value: BirthTimeSlot; label: string }[] = [
  { value: "자시", label: "자시 (23:00~01:00)" },
  { value: "축시", label: "축시 (01:00~03:00)" },
  { value: "인시", label: "인시 (03:00~05:00)" },
  { value: "묘시", label: "묘시 (05:00~07:00)" },
  { value: "진시", label: "진시 (07:00~09:00)" },
  { value: "사시", label: "사시 (09:00~11:00)" },
  { value: "오시", label: "오시 (11:00~13:00)" },
  { value: "미시", label: "미시 (13:00~15:00)" },
  { value: "신시", label: "신시 (15:00~17:00)" },
  { value: "유시", label: "유시 (17:00~19:00)" },
  { value: "술시", label: "술시 (19:00~21:00)" },
  { value: "해시", label: "해시 (21:00~23:00)" },
  { value: "모름", label: "모르겠어요" },
];

export function RegistrationForm({ onRegister }: RegistrationFormProps) {
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthTime, setBirthTime] = useState<BirthTimeSlot | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const currentYear = new Date().getFullYear();

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = currentYear; y >= 1920; y--) arr.push(y);
    return arr;
  }, [currentYear]);

  const months = useMemo(() => {
    const arr: number[] = [];
    for (let m = 1; m <= 12; m++) arr.push(m);
    return arr;
  }, []);

  const days = useMemo(() => {
    if (!birthYear || !birthMonth) {
      const arr: number[] = [];
      for (let d = 1; d <= 31; d++) arr.push(d);
      return arr;
    }
    const daysInMonth = new Date(Number(birthYear), Number(birthMonth), 0).getDate();
    const arr: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [birthYear, birthMonth]);

  const handleSubmit = () => {
    setError("");

    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    if (!birthYear || !birthMonth || !birthDay) {
      setError("생년월일을 모두 선택해주세요.");
      return;
    }

    const y = Number(birthYear);
    const m = Number(birthMonth);
    const d = Number(birthDay);

    if (y < 1920 || y > currentYear) {
      setError("올바른 출생연도를 선택해주세요.");
      return;
    }

    if (!birthTime) {
      setError("태어난 시간을 선택해주세요.");
      return;
    }

    if (!gender) {
      setError("성별을 선택해주세요.");
      return;
    }

    if (!consent) {
      setError("이용약관 및 개인정보처리방침에 동의해주세요.");
      return;
    }

    const birthDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    onRegister(name.trim(), birthDate, birthTime, gender);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.iconWrap}>🔮</div>
        <h2 style={styles.title}>운세 캘린더</h2>
        <p style={styles.subtitle}>
          정보를 입력하면
          <br />
          나만의 맞춤 운세를 확인할 수 있어요
        </p>
      </div>

      <div style={styles.form}>
        {/* 이름 */}
        <div style={styles.field}>
          <label style={styles.label}>이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력해주세요"
            style={styles.input}
            maxLength={20}
          />
        </div>

        {/* 생년월일 (드롭다운) */}
        <div style={styles.field}>
          <label style={styles.label}>생년월일</label>
          <div style={styles.dateRow}>
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              style={{ ...styles.select, flex: 1.5 }}
            >
              <option value="">년</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
            <select
              value={birthMonth}
              onChange={(e) => {
                setBirthMonth(e.target.value);
                setBirthDay(""); // 월 변경 시 일 초기화
              }}
              style={styles.select}
            >
              <option value="">월</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
            <select
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              style={styles.select}
            >
              <option value="">일</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}일
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 태어난 시간 */}
        <div style={styles.field}>
          <label style={styles.label}>태어난 시간 (시주)</label>
          <select
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value as BirthTimeSlot)}
            style={styles.selectFull}
          >
            <option value="">시간을 선택해주세요</option>
            {BIRTH_TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 성별 */}
        <div style={styles.field}>
          <label style={styles.label}>성별</label>
          <div style={styles.genderRow}>
            <button
              type="button"
              onClick={() => setGender("남")}
              style={{
                ...styles.genderButton,
                ...(gender === "남" ? styles.genderActive : {}),
              }}
            >
              남성
            </button>
            <button
              type="button"
              onClick={() => setGender("여")}
              style={{
                ...styles.genderButton,
                ...(gender === "여" ? styles.genderActive : {}),
              }}
            >
              여성
            </button>
          </div>
        </div>

        <label style={styles.consentRow}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            style={styles.checkbox}
          />
          <span style={styles.consentText}>
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              style={styles.linkButton}
            >
              이용약관
            </button>
            {" 및 "}
            <button
              type="button"
              onClick={() => setShowPrivacy(true)}
              style={styles.linkButton}
            >
              개인정보처리방침
            </button>
            에 동의합니다.
          </span>
        </label>

        {error && <p style={styles.error}>{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          style={{
            ...styles.submitButton,
            opacity: consent && name && birthYear && birthMonth && birthDay && birthTime && gender ? 1 : 0.5,
          }}
        >
          시작하기
        </button>
      </div>

      {showTerms && <TermsPage onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPage onClose={() => setShowPrivacy(false)} />}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    padding: "24px 20px",
    backgroundColor: "#FAFAFA",
  },
  header: {
    textAlign: "center",
    marginTop: "40px",
    marginBottom: "32px",
  },
  iconWrap: {
    fontSize: "48px",
    marginBottom: "12px",
  },
  title: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#1B1D1F",
    margin: "0 0 10px 0",
  },
  subtitle: {
    fontSize: "15px",
    color: "#6B7684",
    lineHeight: "1.5",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#333D4B",
  },
  input: {
    padding: "14px 16px",
    fontSize: "16px",
    border: "1px solid #E5E8EB",
    borderRadius: "12px",
    backgroundColor: "#FFFFFF",
    outline: "none",
    color: "#1B1D1F",
  },
  dateRow: {
    display: "flex",
    gap: "8px",
  },
  select: {
    flex: 1,
    padding: "14px 8px",
    fontSize: "15px",
    border: "1px solid #E5E8EB",
    borderRadius: "12px",
    backgroundColor: "#FFFFFF",
    outline: "none",
    color: "#1B1D1F",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236B7684' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 5h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    paddingRight: "28px",
  },
  selectFull: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "15px",
    border: "1px solid #E5E8EB",
    borderRadius: "12px",
    backgroundColor: "#FFFFFF",
    outline: "none",
    color: "#1B1D1F",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236B7684' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 5h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "36px",
  },
  genderRow: {
    display: "flex",
    gap: "12px",
  },
  genderButton: {
    flex: 1,
    padding: "14px",
    fontSize: "15px",
    fontWeight: 600,
    border: "1px solid #E5E8EB",
    borderRadius: "12px",
    backgroundColor: "#FFFFFF",
    color: "#6B7684",
    cursor: "pointer",
  },
  genderActive: {
    border: "1px solid #6B4EFF",
    backgroundColor: "#F4F1FF",
    color: "#6B4EFF",
  },
  consentRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    cursor: "pointer",
  },
  checkbox: {
    marginTop: "3px",
    width: "18px",
    height: "18px",
    accentColor: "#6B4EFF",
    flexShrink: 0,
  },
  consentText: {
    fontSize: "13px",
    color: "#6B7684",
    lineHeight: "1.4",
  },
  linkButton: {
    background: "none",
    border: "none",
    padding: 0,
    fontSize: "13px",
    color: "#6B4EFF",
    textDecoration: "underline",
    cursor: "pointer",
    fontWeight: 600,
  },
  error: {
    fontSize: "13px",
    color: "#F04452",
    margin: 0,
  },
  submitButton: {
    padding: "16px",
    fontSize: "16px",
    fontWeight: 700,
    backgroundColor: "#6B4EFF",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    marginTop: "8px",
  },
};
