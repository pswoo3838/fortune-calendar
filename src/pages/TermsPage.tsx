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

        <div style={styles.bizBox}>
          <p style={styles.bizTitle}>사업자 정보</p>
          <p style={styles.bizRow}>상호명: 풍수와모지리</p>
          <p style={styles.bizRow}>대표자: 박시우</p>
          <p style={styles.bizRow}>사업자등록번호: 643-05-03610</p>
          <p style={styles.bizRow}>고객문의: siuda3838@naver.com</p>
        </div>

        <Section heading="제1조 (목적)">
          {`본 약관은 풍수와모지리(이하 "회사")가 앱인토스 플랫폼을 통해 제공하는 운세 캘린더 서비스(이하 "서비스")를 이용함에 있어 회사와 이용자(이하 "이용자") 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.`}
        </Section>

        <Section heading="제2조 (정의)">
          {`① "서비스"란 회사가 제공하는 AI 기반 운세 정보 및 캘린더 일정 관리 서비스를 말합니다.
② "이용자"란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.
③ "콘텐츠"란 서비스 내에서 제공되는 운세, 길일, 손없는 날, 일정 정보 등 일체의 정보를 말합니다.`}
        </Section>

        <Section heading="제3조 (약관의 효력 및 변경)">
          {`① 본 약관은 이용자가 서비스 최초 이용 시 동의함으로써 효력이 발생합니다.
② 회사는 관련 법령에 위배되지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정사유를 명시하여 최소 7일 전 서비스 내 공지를 통해 안내합니다.
③ 이용자가 개정 약관에 동의하지 않는 경우 서비스 이용을 중단하고 기기 내 등록 정보를 직접 삭제할 수 있습니다.`}
        </Section>

        <Section heading="제4조 (서비스의 내용)">
          {`회사가 제공하는 서비스는 다음과 같습니다.
① 이용자의 생년월일, 띠(12지신), 성별, 태어난 시간을 기반으로 한 일일·주간 맞춤 운세 제공
② 재물운, 애정운, 건강운, 직업운 등 카테고리별 운세 점수 및 조언 제공
③ 시간대별 기운 흐름(타임플로우) 및 행운 아이템 정보 제공
④ 길일, 손없는 날 등 전통 달력 정보 및 공휴일 정보 제공
⑤ 개인 일정(캘린더) 추가·수정·삭제 및 D-Day 관리 기능
⑥ 이달의 행운의 날 분석 기능`}
        </Section>

        <Section heading="제5조 (AI 생성 콘텐츠에 대한 필수 고지)">
          {`① 본 서비스에서 제공하는 운세 콘텐츠는 인공지능(AI) 기술을 활용하여 생성됩니다.
② AI가 생성한 운세 정보는 오락 및 참고 목적으로만 제공되며, 과학적·학술적 근거에 기반한 정보가 아닙니다.
③ 이용자는 AI 생성 콘텐츠를 의료, 법률, 재정 등 중요한 의사결정의 근거로 사용해서는 안 됩니다.
④ 회사는 AI가 생성한 운세 콘텐츠의 정확성, 완전성, 특정 목적 적합성에 대해 어떠한 보증도 하지 않으며, 이를 근거로 한 이용자의 행동에 대해 책임을 지지 않습니다.`}
        </Section>

        <Section heading="제6조 (광고)">
          {`① 회사는 서비스의 무료 제공 및 운영을 위해 전면형 광고(인터스티셜) 및 배너 광고를 서비스 내에 게재할 수 있습니다.
② 운세 조회 기능은 광고 시청과 연계되어 일정 횟수 이후 광고가 노출될 수 있으며, 이는 서비스 품질 유지를 위한 정책입니다.
③ 광고 내용 및 이를 통해 연결된 제3자 서비스에서 발생하는 문제에 대해 회사는 책임을 지지 않습니다.`}
        </Section>

        <Section heading="제7조 (데이터 저장 및 관리)">
          {`① 이용자가 등록한 프로필 정보(이름, 생년월일, 성별, 띠, 태어난 시간)와 캘린더 일정은 이용자의 기기(단말기) 내에 저장됩니다.
② 서비스 내 "초기화" 기능을 통해 기기에 저장된 모든 데이터를 직접 삭제할 수 있습니다.
③ 이용자가 미니앱을 삭제하거나 기기를 초기화하는 경우 저장된 데이터가 복구되지 않을 수 있으며, 이에 대해 회사는 책임을 지지 않습니다.`}
        </Section>

        <Section heading="제8조 (이용자의 의무)">
          {`① 이용자는 서비스 이용 시 허위 또는 타인의 정보를 입력해서는 안 됩니다.
② 이용자는 서비스를 영리 목적, 자동화된 방법, 또는 부정한 방법으로 이용해서는 안 됩니다.
③ 이용자는 서비스를 통해 얻은 콘텐츠를 회사의 사전 동의 없이 무단으로 복제, 배포, 상업적으로 이용해서는 안 됩니다.`}
        </Section>

        <Section heading="제9조 (지적재산권)">
          {`① 서비스 및 서비스 내 콘텐츠(운세 텍스트, 디자인, 로직 등)에 대한 지적재산권은 회사에 귀속됩니다.
② 이용자는 회사의 사전 서면 동의 없이 서비스 콘텐츠를 외부에 복제, 전송, 출판, 배포할 수 없습니다.`}
        </Section>

        <Section heading="제10조 (서비스의 변경 및 중단)">
          {`① 회사는 운영상·기술상의 필요에 따라 서비스 내용을 변경하거나 일시 중단할 수 있습니다.
② 서비스의 종료가 예정된 경우, 회사는 최소 30일 전에 서비스 내 또는 이메일을 통해 공지합니다.
③ 천재지변, 시스템 장애, 앱인토스 플랫폼 정책 변경 등 불가항력적 사유로 서비스가 중단되는 경우, 이로 인한 손해에 대해 회사는 책임을 지지 않습니다.`}
        </Section>

        <Section heading="제11조 (면책 조항)">
          {`① 운세 콘텐츠는 오락적 목적으로 AI에 의해 생성되며, 이를 근거로 한 이용자의 판단 및 행동에 대해 회사는 어떠한 법적 책임도 부담하지 않습니다.
② 회사는 이용자의 귀책 사유로 발생한 서비스 이용 장애에 대해 책임을 지지 않습니다.
③ 회사는 이용자 간 또는 이용자와 제3자 간에 발생한 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임이 없습니다.`}
        </Section>

        <Section heading="제12조 (개인정보보호)">
          이용자의 개인정보 보호에 관한 사항은 별도의 "개인정보처리방침"에 따릅니다.
        </Section>

        <Section heading="제13조 (분쟁 해결 및 준거법)">
          {`① 서비스 이용과 관련하여 분쟁이 발생한 경우, 회사는 이용자와 협의하여 신속히 해결하기 위해 노력합니다.
② 분쟁이 해결되지 않는 경우, 대한민국 민사소송법에 따른 관할 법원에 소를 제기할 수 있습니다.
③ 본 약관은 대한민국 법률에 따라 해석되고 적용됩니다.`}
        </Section>

        <Section heading="제14조 (고객 문의)">
          {`서비스 이용 중 문의사항이 있는 경우 아래 연락처로 문의해 주세요.

• 이메일: siuda3838@naver.com
• 운영시간: 평일 10:00 ~ 18:00 (공휴일 제외)
• 처리 기간: 문의 접수 후 영업일 기준 3일 이내 회신`}
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
  date: { fontSize: "13px", color: "#8B95A1", margin: "0 0 20px 0" },
  bizBox: { backgroundColor: "#F8F9FA", borderRadius: "12px", padding: "16px", marginBottom: "28px" },
  bizTitle: { fontSize: "13px", fontWeight: 700, color: "#6B4EFF", margin: "0 0 8px 0" },
  bizRow: { fontSize: "13px", color: "#4E5968", margin: "0 0 4px 0", lineHeight: "1.6" },
  section: { marginBottom: "24px" },
  heading: { fontSize: "15px", fontWeight: 700, color: "#1B1D1F", margin: "0 0 8px 0" },
  text: { fontSize: "14px", color: "#4E5968", lineHeight: "1.8", margin: 0, whiteSpace: "pre-line" },
};
