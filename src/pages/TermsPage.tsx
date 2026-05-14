import type { CSSProperties } from "react";

interface TermsPageProps {
  onClose: () => void;
}

export function TermsPage({ onClose }: TermsPageProps) {
  return (
    <div style={styles.overlay}>
      <div style={styles.topBar}>
        <button type="button" onClick={onClose} style={styles.backButton} aria-label="닫기">
          ← 돌아가기
        </button>
      </div>
      <div style={styles.content}>
        <h1 style={styles.title}>이용약관</h1>
        <p style={styles.date}>시행일: 2026년 5월 12일</p>

        <Section heading="제1조 (목적)">
          본 약관은 운세 캘린더(이하 "서비스")를 제공하는 운영자(이하 "회사")와
          이를 이용하는 사용자(이하 "이용자") 간의 권리, 의무 및 책임사항, 기타
          필요한 사항을 규정함을 목적으로 합니다.
        </Section>

        <Section heading="제2조 (정의)">
          {`① "서비스"란 회사가 앱인토스 플랫폼을 통해 제공하는 AI 기반 운세 정보 서비스를 말합니다.
② "이용자"란 본 약관에 따라 서비스를 이용하는 자를 말합니다.
③ "콘텐츠"란 서비스 내에서 제공되는 운세, 길일, 손없는 날 등 일체의 정보를 말합니다.`}
        </Section>

        <Section heading="제3조 (약관의 효력 및 변경)">
          {`① 본 약관은 이용자가 동의함으로써 효력이 발생합니다.
② 회사는 관련 법령에 위배되지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정사유를 명시하여 최소 7일 전 공지합니다.
③ 이용자가 개정약관에 동의하지 않는 경우 서비스 이용을 중단하고 등록 정보를 삭제할 수 있습니다.`}
        </Section>

        <Section heading="제4조 (서비스의 내용)">
          {`회사가 제공하는 서비스는 다음과 같습니다.
① 이용자의 생년월일 및 띠(12지신) 기반 일일/주간/월간 운세 제공
② 길일, 손없는 날 등 전통 달력 정보 제공
③ 행운의 색, 행운의 숫자 등 부가 운세 정보 제공`}
        </Section>

        <Section heading="제5조 (AI 생성 콘텐츠에 대한 고지)">
          {`① 본 서비스에서 제공하는 운세 콘텐츠는 인공지능(AI) 기술을 활용하여 생성됩니다.
② AI가 생성한 운세 정보는 오락 및 참고 목적으로만 제공되며, 과학적·학술적 근거에 기반한 것이 아닙니다.
③ 이용자는 AI 생성 콘텐츠를 중요한 의사결정(의료, 법률, 재정 등)의 근거로 사용해서는 안 됩니다.
④ 회사는 AI가 생성한 운세 콘텐츠의 정확성, 완전성, 유용성에 대해 어떠한 보증도 하지 않습니다.`}
        </Section>

        <Section heading="제6조 (광고)">
          {`① 회사는 서비스 운영을 위해 배너 광고 및 전면형 광고를 게재할 수 있습니다.
② 광고의 내용과 관련하여 발생하는 모든 책임은 해당 광고주에게 있습니다.
③ 이용자가 광고를 통해 제3자의 서비스를 이용하는 경우, 이로 인해 발생하는 문제에 대하여 회사는 책임을 지지 않습니다.`}
        </Section>

        <Section heading="제7조 (이용자의 의무)">
          {`① 이용자는 서비스 이용 시 허위 정보를 제공해서는 안 됩니다.
② 이용자는 서비스를 부정한 목적으로 이용해서는 안 됩니다.
③ 이용자는 서비스를 통해 얻은 정보를 무단으로 복제, 배포, 상업적으로 이용해서는 안 됩니다.`}
        </Section>

        <Section heading="제8조 (지적재산권)">
          {`① 서비스에 포함된 모든 콘텐츠에 대한 지적재산권은 회사에 귀속됩니다.
② 이용자는 회사의 사전 서면 동의 없이 서비스의 콘텐츠를 복제, 전송, 출판, 배포, 방송 등의 방법으로 이용할 수 없습니다.`}
        </Section>

        <Section heading="제9조 (서비스의 변경 및 중단)">
          {`① 회사는 운영상, 기술상의 필요에 따라 서비스를 변경하거나 중단할 수 있습니다.
② 서비스의 중단이 예정된 경우, 회사는 최소 30일 전에 이를 공지합니다.
③ 천재지변, 시스템 장애 등 불가항력적 사유로 서비스가 중단되는 경우 별도 공지 없이 중단될 수 있으며, 이로 인한 손해에 대해 회사는 책임을 지지 않습니다.`}
        </Section>

        <Section heading="제10조 (면책 조항)">
          {`① 회사는 이용자가 서비스를 통하여 얻은 자료로 인한 손해에 대하여 책임을 지지 않습니다.
② 회사는 이용자 간 또는 이용자와 제3자 간에 서비스를 매개로 발생한 분쟁에 대해 개입할 의무가 없습니다.
③ 운세 콘텐츠는 오락적 목적으로 제공되며, 이를 근거로 한 이용자의 행위에 대해 회사는 어떠한 책임도 부담하지 않습니다.`}
        </Section>

        <Section heading="제11조 (개인정보보호)">
          이용자의 개인정보 보호에 관한 사항은 별도의 "개인정보처리방침"에 따릅니다.
        </Section>

        <Section heading="제12조 (분쟁 해결)">
          {`① 본 약관에 관한 분쟁은 대한민국 법률에 따라 해결합니다.
② 서비스 이용과 관련하여 회사와 이용자 간에 발생한 분쟁에 대해서는 민사소송법에 따른 관할 법원에 소를 제기할 수 있습니다.`}
        </Section>

        <Section heading="부칙">
          본 약관은 2026년 5월 12일부터 시행합니다.
        </Section>
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
  date: { fontSize: "13px", color: "#8B95A1", margin: "0 0 24px 0" },
  section: { marginBottom: "24px" },
  heading: { fontSize: "16px", fontWeight: 700, color: "#1B1D1F", margin: "0 0 8px 0" },
  text: { fontSize: "14px", color: "#4E5968", lineHeight: "1.7", margin: 0, whiteSpace: "pre-line" },
};
