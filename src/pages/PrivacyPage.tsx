import type { CSSProperties } from "react";

interface PrivacyPageProps {
  onClose: () => void;
}

export function PrivacyPage({ onClose }: PrivacyPageProps) {
  return (
    <div style={styles.overlay}>
      <div style={styles.topBar}>
        <button type="button" onClick={onClose} style={styles.backButton} aria-label="닫기">
          ← 돌아가기
        </button>
      </div>
      <div style={styles.content}>
        <h1 style={styles.title}>개인정보처리방침</h1>
        <p style={styles.date}>시행일: 2026년 5월 12일</p>

        <div style={styles.bizBox}>
          <p style={styles.bizTitle}>개인정보 처리 사업자</p>
          <p style={styles.bizRow}>상호명: 풍수와모지리</p>
          <p style={styles.bizRow}>대표자: 박시우</p>
          <p style={styles.bizRow}>사업자등록번호: 643-05-03610</p>
          <p style={styles.bizRow}>개인정보 보호 문의: siuda3838@naver.com</p>
        </div>

        <p style={styles.intro}>
          풍수와모지리(이하 "회사")는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고
          이와 관련한 고충을 원활하게 처리할 수 있도록 아래와 같이 개인정보처리방침을 수립·공개합니다.
        </p>

        <Section heading="제1조 (처리하는 개인정보 항목)">
          {`서비스는 다음의 개인정보 항목을 처리합니다.

[이용자가 직접 입력하는 항목 — 기기 내 저장]
• 이름(별명): 서비스 내 인사말 표시 목적
• 생년월일: 띠(12지신) 계산 및 맞춤 운세 생성
• 성별: 맞춤 운세 생성
• 태어난 시간(시주): 심층 운세 분석 (모름 선택 가능)

[AI 운세 생성 시 외부 서버로 전송되는 항목]
• 생년월일, 성별, 띠 (이름은 전송되지 않음)
• 전송 후 즉시 파기되며 서버에 보관되지 않음

[자동 수집 항목 — 앱인토스 플랫폼에서 수집]
• 서비스 이용 기록, 접속 로그 (앱인토스 개인정보처리방침 적용)`}
        </Section>

        <Section heading="제2조 (개인정보의 처리 목적)">
          {`서비스는 다음의 목적을 위하여 개인정보를 처리합니다.

① 맞춤형 운세 콘텐츠(일일/주간/월간 운세, 행운의 날) 생성 및 제공
② 캘린더 일정 관리 기능 제공
③ 서비스 내 개인화 경험 제공 (사용자 이름 표시 등)
④ 서비스 품질 개선 및 통계 분석

처리하는 개인정보는 상기 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우 별도의 동의를 받겠습니다.`}
        </Section>

        <Section heading="제3조 (개인정보의 처리 및 보유 기간)">
          {`① 이용자의 프로필 정보 및 캘린더 일정은 기기(단말기) 내에 저장되며, 별도 서버에 보관되지 않습니다.
② AI 운세 생성을 위해 외부 서버에 전송되는 정보(생년월일, 성별, 띠)는 운세 생성 완료 즉시 파기됩니다.
③ 이용자가 서비스 내 "초기화" 기능을 사용하면 기기에 저장된 모든 개인정보가 즉시 삭제됩니다.
④ 미니앱 삭제 또는 기기 초기화 시 저장된 데이터는 복구되지 않을 수 있습니다.`}
        </Section>

        <Section heading="제4조 (개인정보의 제3자 제공)">
          {`회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다.

다만, 다음의 경우에는 예외로 합니다.
• 이용자가 사전에 동의한 경우
• 법령의 규정에 의하거나 수사기관의 적법한 요청이 있는 경우`}
        </Section>

        <Section heading="제5조 (개인정보 처리 위탁)">
          {`서비스는 맞춤형 운세 콘텐츠 생성을 위해 아래와 같이 업무를 위탁합니다.

• 위탁 수탁자: OpenAI (ChatGPT API)
• 위탁 업무: 생년월일, 성별, 띠 정보 기반 운세 텍스트 생성
• 전송 정보: 생년월일, 성별, 띠 (이름 미포함)
• 보유 기간: 생성 즉시 파기, 서버 미보관

위탁 계약 시 개인정보 보호 관련 법규 준수, 개인정보 목적 외 이용 금지 등을 규정하고 있습니다.`}
        </Section>

        <Section heading="제6조 (정보주체의 권리·의무 및 행사 방법)">
          {`① 이용자는 언제든지 서비스 내 저장된 자신의 개인정보에 대해 열람, 수정, 삭제를 요청할 수 있습니다.
② 개인정보 삭제는 서비스 내 "초기화" 버튼을 통해 직접 처리할 수 있습니다.
③ 개인정보 관련 기타 문의사항은 아래 개인정보 보호책임자에게 이메일로 연락해 주세요.`}
        </Section>

        <Section heading="제7조 (개인정보의 파기 절차 및 방법)">
          {`① 파기 절차: 이용자가 "초기화"를 선택하거나 미니앱을 삭제하는 경우, 기기 내 저장된 개인정보는 즉시 파기됩니다.
② 파기 방법: 기기 내 전자적 파일 형태의 정보는 재생 불가능한 기술적 방법으로 삭제됩니다.`}
        </Section>

        <Section heading="제8조 (개인정보의 안전성 확보 조치)">
          {`① 개인정보는 이용자의 기기 내에만 저장되며 외부 서버에 상시 보관되지 않습니다.
② AI 운세 생성을 위해 외부로 전송되는 데이터는 HTTPS 암호화 통신을 사용합니다.
③ 앱인토스 플랫폼의 보안 정책 및 앱인토스 네이티브 스토리지 보안을 준수합니다.`}
        </Section>

        <Section heading="제9조 (쿠키 및 자동 수집)">
          서비스는 자체적으로 쿠키를 사용하지 않습니다. 앱인토스 플랫폼에서 자동 수집하는 이용 기록(접속 로그 등)은 앱인토스의 개인정보처리방침에 따라 처리됩니다.
        </Section>

        <Section heading="제10조 (개인정보 보호책임자)">
          {`서비스의 개인정보 처리에 관한 업무를 총괄하는 개인정보 보호책임자는 다음과 같습니다.

• 책임자: 박시우 (대표)
• 이메일: siuda3838@naver.com
• 운영시간: 평일 10:00 ~ 18:00 (공휴일 제외)

이용자는 서비스를 이용하면서 발생한 모든 개인정보 보호 관련 문의, 불만, 피해 구제 등에 관한 사항을 위 담당자에게 문의하실 수 있습니다.`}
        </Section>

        <Section heading="제11조 (개인정보 처리방침 변경)">
          {`본 개인정보처리방침은 시행일로부터 적용됩니다. 법령 및 서비스 정책에 따른 변경 사항이 있는 경우, 변경 시행 7일 전부터 서비스 내 공지를 통해 안내드립니다.`}
        </Section>

        <p style={styles.footer}>본 개인정보처리방침은 2026년 5월 12일부터 적용됩니다.</p>
      </div>
    </div>
  );
}

function Section({ heading, children }: { heading: string; children: string }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.heading}>{heading}</h2>
      <p style={styles.text}>{children}</p>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: { position: "fixed", inset: 0, zIndex: 2000, backgroundColor: "#FFFFFF", overflowY: "auto" },
  topBar: { position: "sticky", top: 0, backgroundColor: "#FFFFFF", padding: "12px 16px", zIndex: 10, borderBottom: "1px solid #F2F4F6" },
  backButton: { background: "none", border: "none", fontSize: "15px", color: "#6B4EFF", fontWeight: 600, cursor: "pointer", padding: "8px 0" },
  content: { padding: "24px 20px 60px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#1B1D1F", margin: "0 0 4px 0" },
  date: { fontSize: "13px", color: "#8B95A1", margin: "0 0 16px 0" },
  bizBox: { backgroundColor: "#F8F9FA", borderRadius: "12px", padding: "16px", marginBottom: "24px" },
  bizTitle: { fontSize: "13px", fontWeight: 700, color: "#6B4EFF", margin: "0 0 8px 0" },
  bizRow: { fontSize: "13px", color: "#4E5968", margin: "0 0 4px 0", lineHeight: "1.6" },
  intro: { fontSize: "14px", color: "#4E5968", lineHeight: "1.7", margin: "0 0 24px 0" },
  section: { marginBottom: "24px" },
  heading: { fontSize: "15px", fontWeight: 700, color: "#1B1D1F", margin: "0 0 8px 0" },
  text: { fontSize: "14px", color: "#4E5968", lineHeight: "1.8", margin: 0, whiteSpace: "pre-line" },
  footer: { fontSize: "14px", color: "#8B95A1", textAlign: "center", marginTop: "32px" },
};
