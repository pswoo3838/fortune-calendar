import type {
  UserProfile,
  WeeklyFortune,
  DailyFortune,
  MonthlySajuReport,
  FortuneGrade,
} from "../types/fortune";
import { fetchWeeklyFortune } from "./api";
import { saveWeeklyFortune, loadWeeklyFortuneSync } from "./storage";
import { getWeekRange } from "./dateUtils";

interface LuckyDayItem {
  date: string;
  grade: FortuneGrade;
  title: string;
  score?: number;
}

/**
 * 이번 달 행운의 날(Best Days) 상위 목록을 조회하는 공통 헬퍼 함수
 * '이번 달 행운의 날 카드'와 '990 월간 운세'에서 공통으로 참조하여 100% 데이터 정합성을 보장합니다.
 */
export async function getOrFetchLuckyDays(
  profile: UserProfile,
  year: number,
  month: number
): Promise<LuckyDayItem[]> {
  const cacheKey = `fortune_lucky_days_${profile.zodiac}_${year}_${month}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached) as LuckyDayItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn("[LuckyDays] 캐시 읽기 에러:", e);
    }
  }

  // 캐시가 없으면 API 호출
  try {
    const daysInMonth = new Date(year, month, 0).getDate();
    const WORKER_URL =
      (import.meta.env.VITE_WORKER_URL as string | undefined) ||
      "https://fortune-worker.siuda3838.workers.dev";

    const res = await fetch(`${WORKER_URL}/api/fortune/monthly`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zodiac: profile.zodiac,
        gender: profile.gender,
        birthDate: profile.birthDate,
        year,
        month,
        daysInMonth,
      }),
    });

    if (!res.ok) throw new Error("월간 운세 API 응답 에러");

    const data = (await res.json()) as { dailySummaries: LuckyDayItem[] };
    const good = data.dailySummaries
      .filter((d) => d.grade === "대길" || d.grade === "길")
      .sort((a, b) => {
        const gradeOrder: Record<string, number> = { 대길: 0, 길: 1 };
        return (gradeOrder[a.grade] ?? 2) - (gradeOrder[b.grade] ?? 2);
      })
      .slice(0, 10);

    try {
      localStorage.setItem(cacheKey, JSON.stringify(good));
    } catch (e) {
      console.warn("[LuckyDays] 캐시 저장 실패:", e);
    }

    return good;
  } catch (err) {
    console.error("[LuckyDays] fetch 에러:", err);
    return [];
  }
}

import { calculateSaju, getMonthGeon } from "./manseryeok";
import { getOhengLucky } from "./oheng";

const MONTHLY_SAJU_VARIATIONS: Record<number, {
  titleSuffix: string;
  descTheme: string;
  scores: { overall: number; wealth: number; love: number; career: number; health: number };
  wealthText: string;
  loveText: string;
  careerText: string;
  healthText: string;
  avoidAction: string;
}> = {
  1: {
    titleSuffix: "소한의 기운 속 내실을 다지고 새 발판을 마련하는 달",
    descTheme: "동토(凍土) 속에서 서서히 싹을 틔울 온기가 감도는 시기입니다. 겉으로 드러나는 과격한 활동보다 깊은 생각과 기본기 점검이 큰 유익을 안겨줍니다.",
    scores: { overall: 76, wealth: 72, love: 80, career: 75, health: 70 },
    wealthText: "비겁과 인성의 자양분 기운으로 재물 낭비가 축소되고 시드머니를 안전하게 수호하기 유리합니다. 성급한 가상자산/주식 단기 투자보다는 장기 예적금이나 자기개발 투자가 효율적입니다.",
    loveText: "은근하고 지속적인 차분한 소통이 빛을 발합니다. 화려한 이벤트보다는 진솔하고 듬직한 모습을 보여줄 때 상대방의 신뢰와 애정이 크게 상승합니다.",
    careerText: "지난 성과를 정돈하고 체계적인 마일스톤을 확립할 직장/학업 기운입니다. 혼자 고군분투하기보다 상사나 베테랑 조력자의 가이드라인에 귀를 기울이세요.",
    healthText: "체온 유지와 관절 관리가 시급한 달입니다. 따뜻한 차나 족욕을 통해 하체의 혈액순환을 돕고 면역력을 챙기시기 바랍니다.",
    avoidAction: "추위에 몸이 움츠러든 상태에서 섣부른 운동이나 늦은 밤 찬 바람 노출은 피하세요."
  },
  2: {
    titleSuffix: "입춘의 생동하는 도약 기운과 희망의 달",
    descTheme: "양목(陽木)의 푸른 생기 기운이 사주 전반에 생기를 불어넣는 훌륭한 계절입니다. 멈춰있던 계획이 움직이고 기분 좋은 추진력이 더해집니다.",
    scores: { overall: 88, wealth: 84, love: 86, career: 90, health: 80 },
    wealthText: "식상 생재(食傷生財)의 이로운 파동이 흘러들어 예상치 못한 부수입이나 상여금 등 물질적 수혜가 예상됩니다. 기획한 아이디어를 현실 자산으로 전환하기에 안성맞춤입니다.",
    loveText: "새로운 인연과의 상생 기운이 화사하게 피어납니다. 싱글이시라면 적극적인 사회활동과 모임 진입 시 매력적인 서포터를 만날 확률이 높습니다.",
    careerText: "목(木)의 도약 기운을 받아 새로운 프로젝트 발탁이나 승진, 신규 과제 수행에 탄력이 붙습니다. 주저하지 말고 의사를 적극 피력하십시오.",
    healthText: "봄 기운의 명랑함과 함께 활동량이 증가합니다. 간과 눈의 피로를 막기 위해 규칙적인 수면 습관을 동반하시기 바랍니다.",
    avoidAction: "의욕이 지나쳐 주위 사람들의 순서를 넘어서는 과욕이나 직언은 경계하십시오."
  },
  3: {
    titleSuffix: "경칩의 왕성한 소통과 성장 에너지가 만발하는 달",
    descTheme: "만물이 기지개를 켜며 본연의 지혜와 재능이 밖으로 표출되는 묘(卯)월의 흐름입니다. 다채로운 인맥과 정보 교류 속에 결실의 싹이 틔워집니다.",
    scores: { overall: 85, wealth: 82, love: 90, career: 84, health: 78 },
    wealthText: "재성의 정교한 운기가 함께하여 합리적인 지출과 유익한 재테크 정보 취득이 용이합니다. 수입과 지출의 균형이 안정적으로 유지됩니다.",
    loveText: "연인 혹은 지인과의 대화에서 매력이 돋보이는 시기입니다. 묵은 갈등이 말끔히 해소되고 오붓하고 뜻깊은 시간을 보낼 기운입니다.",
    careerText: "조직 내 창의적 기획이나 팀워크 작업에서 중추 역할을 맡게 됩니다. 협동 작업 시 협상력을 발휘해 유리한 고지를 점할 수 있습니다.",
    healthText: "심신의 스트레스 지수가 낮아지고 밝은 기운이 감돕니다. 다만 호흡기나 알레르기 질환 방지를 위해 청결에 신경 쓰세요.",
    avoidAction: "주변 소문에 휘둘려 검증되지 않은 소문에 섣부른 재정 주식을 매수하는 행위는 피하세요."
  },
  4: {
    titleSuffix: "청명의 조화로운 기운으로 기반을 단단히 굳히는 달",
    descTheme: "진(辰)토의 풍요로운 영양소가 주도 오행과 조화를 이루어 안정을 선사합니다. 조급함을 덜어내고 차분히 기반을 공고히 하기 아주 좋은 달입니다.",
    scores: { overall: 81, wealth: 86, love: 78, career: 82, health: 80 },
    wealthText: "토(土)의 정착 기운이 재물을 지켜주어 예기치 못한 금전 지출을 방지합니다. 부동산, 펀드 등 자산의 내실을 기지개 켜듯 다지세요.",
    loveText: "화려한 분위기보다 잔잔하고 무게감 있는 인연이 돋보입니다. 겉모습보다 진실성 있는 상대방의 내면을 살피는 혜안이 발휘됩니다.",
    careerText: "수행해 오던 일의 완성도가 대폭 상향되는 달입니다. 꼼꼼한 검수를 거쳐 일을 완결 지으면 상사의 두터운 신뢰를 얻습니다.",
    healthText: "위장과 소화기 계통의 밸런스가 균형을 찾아갑니다. 규칙적인 자극 없는 식단으로 장내 환경을 최적화하세요.",
    avoidAction: "자신의 고집을 유연성 없이 고수하여 주변과의 소통 문을 닫는 고립적 태도는 자제하세요."
  },
  5: {
    titleSuffix: "입하의 정열적인 화(火) 기운과 명예 상승의 달",
    descTheme: "사(巳)월의 화사한 양기(陽氣)가 가득 차 오르며 관성과 명예 운기가 기운을 발산합니다. 세상에 본인의 존재감을 확실히 각인시킬 기회가 올 것입니다.",
    scores: { overall: 89, wealth: 79, love: 85, career: 94, health: 74 },
    wealthText: "명예운의 상승이 재물 수입으로 간접 연계되는 선순환 구조입니다. 눈앞의 소액 이득보다는 본인의 브랜드 가치를 높이는 데 집중하세요.",
    loveText: "당당하고 열정적인 기운이 이성의 시선을 사로잡습니다. 정열적인 교제가 시작되거나 호감 있는 상대와의 관계가 한 단계 진전됩니다.",
    careerText: "직장이나 학업에서 거대한 성과나 승진, 자격증 취득 등 뚜렷한 결과물이 창출되는 길한 운기입니다. 소신 있게 직진하세요.",
    healthText: "화기운의 과잉으로 인한 가슴 답답함이나 혈압, 열감에 유의해야 합니다. 충분한 수분 보충과 쿨다운 자세가 요구됩니다.",
    avoidAction: "감정이 상했을 때 순간의 화를 참지 못하고 격한 언쟁으로 발전시키는 행위는 반드시 삼가세요."
  },
  6: {
    titleSuffix: "망종의 열매 맺기 직전 절정의 에너지 발산의 달",
    descTheme: "오(午)월의 태양이 높이 떠올라 사주의 열매가 결실을 맺을 채비를 가다듬습니다. 집중력과 인내심이 결합될 때 최상의 열매를 수확합니다.",
    scores: { overall: 86, wealth: 85, love: 82, career: 88, health: 72 },
    wealthText: "재성 기운의 왕성함이 금전적 수혜와 실질적 인센티브로 연계됩니다. 추진 중이던 계약이나 거래 건이 원만히 성사될 것입니다.",
    loveText: "밝고 명랑한 태도가 분위기를 리드합니다. 상호 신뢰가 확고해지며 공통의 장기적 목표나 유대감을 형성할 최적의 달입니다.",
    careerText: "과감한 결단과 빠른 결정력이 성과를 촉진합니다. 지체되던 프로젝트를 신속히 처리하여 주변의 인정을 받습니다.",
    healthText: "여름철 신체 에너지 소모가 큽니다. 과로 후에는 충분한 숙면과 냉방병 예방에 각별히 신경 쓰시기 바랍니다.",
    avoidAction: "성급하게 서두르다 중요한 데이터나 계약 조항의 세부사항을 누락하지 않도록 조심하세요."
  },
  7: {
    titleSuffix: "소서의 차분한 결실 준비와 완충의 달",
    descTheme: "미(未)토의 다정하고 포근한 기운이 여름의 열기를 부드럽게 감싸 안습니다. 급변하는 환경 속에서도 흔들리지 않는 내면의 신념이 돋보입니다.",
    scores: { overall: 80, wealth: 83, love: 81, career: 80, health: 79 },
    wealthText: "자산의 이동보다 현재 가치의 보존과 안정적 이자 수입에 유리한 기운입니다. 불확실성이 큰 지출을 최소화하고 내실을 단단히 하세요.",
    loveText: "서로에 대한 이해심과 자상함이 빛을 발하는 따스한 달입니다. 소소한 일상을 공유하며 편안하고 든든한 관계를 유지할 수 있습니다.",
    careerText: "무리한 사세 확장보다는 진행 중인 사안의 내실 검토와 오류 수정이 가치를 발휘합니다. 안정적인 마무리에 주력하세요.",
    healthText: "소화기 및 피부 건조 현상을 방지해야 합니다. 따뜻한 성질의 음식과 습도 조절로 몸의 균형을 사수하세요.",
    avoidAction: "주위 사람들의 평가나 지적에 과도하게 민감하게 반응하여 스스로 스트레스를 자초하지 마십시오."
  },
  8: {
    titleSuffix: "입추의 서늘하고 정교한 금(金) 기운과 수확의 달",
    descTheme: "신(申)금의 예리하고 정확한 결단력이 사주팔자에 작용하는 계절입니다. 사사로운 감정을 배제하고 이성적 판단으로 승부할 때 승리합니다.",
    scores: { overall: 87, wealth: 88, love: 79, career: 89, health: 81 },
    wealthText: "투자금의 회수나 성과급 지급 등 노력에 비례하는 금전적 결실이 명확히 손에 쥐어지는 길운입니다. 재정적 기쁨이 함께합니다.",
    loveText: "맺고 끊음이 명확해지는 쿨한 관계가 형성됩니다. 차분하고 이성적인 대화로 상대방과 현실적인 장래를 도모하기 유리합니다.",
    careerText: "분석력과 일처리 속도가 최고조에 달합니다. 난해했던 복잡한 과제를 명쾌하게 정리해 내어 업무적 명성을 획득합니다.",
    healthText: "호흡기 및 척추 관절의 밸런스 유지가 필요합니다. 바른 자세 유지와 가벼운 스트레칭으로 신체 균형을 잡으세요.",
    avoidAction: "차가운 말투나 너무 냉정한 지적으로 인해 타인의 마음에 상처를 주지 않도록 유의하세요."
  },
  9: {
    titleSuffix: "백로의 풍요로운 결실과 재물 정착의 달",
    descTheme: "유(酉)금의 순수하고 고귀한 결정체가 실질적 결실로 승화되는 9월입니다. 노력이 실체적 보상으로 치환되는 감격이 기다리고 있습니다.",
    scores: { overall: 91, wealth: 93, love: 84, career: 89, health: 80 },
    wealthText: "정재(正財)의 맑은 파동이 재물 저장소를 가득 채웁니다. 뜻밖의 귀한 딜이나 유익한 재정 기회를 포착하여 자산이 크게 불어납니다.",
    loveText: "정성스러운 배려가 결실을 맺는 달입니다. 다정한 말 한마디가 상대방의 깊은 마음을 열어 깊은 애정전선을 구축합니다.",
    careerText: "수행한 결과물이 최고 품질로 완성되어 대내외적 호평을 받습니다. 본인의 능력을 확실히 증명해 보일 골든타임입니다.",
    healthText: "심신이 유쾌하고 안정적입니다. 활발한 신체 활동과 함께 비타민, 미네랄 섭취로 건강을 완벽히 다지십시오.",
    avoidAction: "자신의 완벽주의 기준을 주변 동료에게 무리하게 강요하는 고집은 자제하는 것이 좋습니다."
  },
  10: {
    titleSuffix: "한로의 풍성한 자산 저장과 깊은 지혜의 달",
    descTheme: "술(戌)토의 지혜로운 자산 보관 창고가 열리며 내실을 다지는 시기입니다. 겉보기 화려함보다 실속 있는 이득과 신념이 가치를 높여줍니다.",
    scores: { overall: 83, wealth: 87, love: 80, career: 82, health: 77 },
    wealthText: "재물창고(財庫)의 오행이 발동하여 자금이 차곡차곡 쌓입니다. 무모한 지출이 줄어들고 알짜배기 자산이 형적을 갖춥니다.",
    loveText: "서로의 허물을 감싸 안는 포용력이 커집니다. 차분한 대화 속에서 깊은 정과 안정감을 형성하게 될 정겨운 달입니다.",
    careerText: "드러나지 않는 곳에서 묵묵히 다져온 역량이 빛을 발합니다. 든든한 조력자로서의 존재감이 돋보이며 장기 과제를 수월히 해결합니다.",
    healthText: "하체 및 비뇨기 계통의 신진대사 관리가 유효합니다. 따뜻한 음료 복용과 가벼운 하체 운동으로 훈훈함을 유지하세요.",
    avoidAction: "새로운 사업 확장이나 불확실한 신규 계약 체결을 성급하게 진행하는 일은 연기하십시오."
  },
  11: {
    titleSuffix: "입동의 깊은 생각과 유연한 지혜가 솟구치는 달",
    descTheme: "해(亥)수의 유연하고 도도한 물길처럼 지혜와 통찰력이 깊어지는 달입니다. 복잡하게 얽혔던 문제의 핵심을 꿰뚫는 혜안이 발휘됩니다.",
    scores: { overall: 84, wealth: 79, love: 86, career: 85, health: 78 },
    wealthText: "식상 및 인성의 조화로 아이디어가 창출되어 자산으로 묶여집니다. 배움에 대한 투자나 지식 기반 재테크가 후일 큰 수입이 됩니다.",
    loveText: "깊은 감성적 소통과 연대감이 고조됩니다. 마음속 진솔한 고민을 공유하며 한층 더 가까워지는 인연의 따스함을 경험합니다.",
    careerText: "기획력과 정보 수집 능력이 극대화됩니다. 복잡한 난제를 냉철하게 분석하여 성공적인 해법을 도출해 내는 쾌거를 거둡니다.",
    healthText: "수(水)기운의 유입으로 차가운 기운이 강해지니 방한과 체온 보존에 신경 쓰세요. 혈관계 순환에 주의가 필요합니다.",
    avoidAction: "생각이 너무 많아 실행을 지체하거나 주저하다가 좋은 기회의 타임라인을 놓치지 않도록 하세요."
  },
  12: {
    titleSuffix: "대설의 수(水) 기운 절정과 도약을 위한 충전의 달",
    descTheme: "자(子)월의 맑고 정갈한 수기운이 깃들어 내면의 에너지를 축적하는 희망찬 달입니다. 조용히 내실을 다지고 새해의 도약을 준비하십시오.",
    scores: { overall: 82, wealth: 81, love: 83, career: 80, health: 76 },
    wealthText: "자금의 유출을 막고 알뜰하게 시드머니를 응축하는 시기입니다. 불필요한 사치나 겉치레 비용을 잘 절감하여 통장을 알차게 만듭니다.",
    loveText: "조용하고 정갈한 분위기에서 피어나는 사랑이 길합니다. 아늑한 공간에서 오순도순 담소를 나누며 깊은 유대감을 다지세요.",
    careerText: "한 해를 돌아보고 시스템을 재정비하는 고찰의 시간입니다. 차기 연도의 전략 과제를 수립하고 역량을 충전하면 길합니다.",
    healthText: "신장 및 방광, 허리 부위의 피로를 유의하십시오. 족욕과 온열 패드로 하체를 따뜻하게 유지하는 것이 만약의 예방책입니다.",
    avoidAction: "추운 날씨에 무리한 외출이나 오한을 일으키는 무분별한 과음은 반드시 자제하십시오."
  }
};

const MONTHLY_WEEKLY_FLOW_DATA: Record<number, Array<{ keyword: string; advice: string }>> = {
  1: [
    { keyword: "소한의 기운 및 구상", advice: "새해 첫 주에는 무리한 확장보다 한 해의 기틀을 다지고 차분히 목표를 정립하세요." },
    { keyword: "내실 다지기 및 준비", advice: "주변의 이목에 흔들리지 말고 내실을 기하며 필요한 역량을 조용히 축적하십시오." },
    { keyword: "귀인의 팁 및 정보 취득", advice: "선배나 지인의 조언 속에 귀한 힌트가 들어있으니 대화 시 겸손함을 유지하세요." },
    { keyword: "자금 정돈 및 관리", advice: "지출을 재점검하고 시드머니의 보존에 힘쓰면 금전운의 기반이 굳건해집니다." },
    { keyword: "월말 휴식 및 심신 충전", advice: "한 달을 정돈하며 따뜻한 휴식으로 다음 달의 도약을 위한 체력을 안배하세요." },
  ],
  2: [
    { keyword: "입춘의 생기 및 시동", advice: "봄의 따스한 파동이 감돌기 시작하니 멈춰있던 계획을 차분히 가동해 보세요." },
    { keyword: "인맥 확충 및 소통", advice: "새로운 인연과의 상생 기운이 피어나니 마음의 문을 열고 다정하게 대화하세요." },
    { keyword: "추진력 상승 및 실행", advice: "망설이던 아이디어를 과감하게 행동으로 옮기면 주변의 긍정적 반응이 따릅니다." },
    { keyword: "성과 가시화 및 보상", advice: "작은 결실이 눈앞에 나타나며 의욕이 고취되는 유익하고 희망찬 주간입니다." },
    { keyword: "균형 유지 및 정돈", advice: "의욕이 과해지지 않도록 속도를 조절하며 주변 사람들과 결실을 공유하세요." },
  ],
  3: [
    { keyword: "경칩의 활력 및 탐색", advice: "만물이 도약하는 흐름에 맞춰 다양한 시도와 정보 수집에 집중해 보세요." },
    { keyword: "협동 작업 및 도약", advice: "혼자 처리하기보다 팀원이나 동료와 역할을 나누어 협력할 때 시너지가 납니다." },
    { keyword: "재물 기회 포착", advice: "실속 있는 금전 정보나 유리한 거래 조건이 다가오니 기회를 놓치지 마세요." },
    { keyword: "역량 발휘 및 매력 상승", advice: "본인의 재능과 전문성이 돋보이는 시기이니 당당하게 의견을 피력하세요." },
    { keyword: "환절기 건강 안배", advice: "활동량이 늘어난 만큼 면역력과 수면 밸런스를 꼼꼼히 챙기시기 바랍니다." },
  ],
  4: [
    { keyword: "청명의 정화 및 안착", advice: "주변 환경과 서류, 불필요한 인맥을 정돈하여 마음의 여유공간을 만드세요." },
    { keyword: "신뢰 구축 및 화합", advice: "상대방의 내면을 진솔하게 살필 때 깊은 유대감과 두터운 신뢰가 형성됩니다." },
    { keyword: "과제 완성도 상향", advice: "디테일에 집중하여 일을 마무리 지으면 예상보다 높은 호평을 얻게 됩니다." },
    { keyword: "자산 정착 및 관리", advice: "수입과 지출의 균형이 잡히는 길한 흐름이니 장기 재테크 계획을 세우세요." },
    { keyword: "차분한 마무리", advice: "고집을 피우기보다 주변의 피드백을 유연하게 수용하며 한 달을 정리하세요." },
  ],
  5: [
    { keyword: "입하의 정열 및 발상", advice: "에너지가 샘솟는 시기입니다. 긍정적인 도전을 향해 자신 있게 첫발을 내디딛으세요." },
    { keyword: "명예운 및 인정", advice: "직장이나 모임에서 본인의 존재감이 각인되는 계기가 생기니 솔선수범하세요." },
    { keyword: "애정 기운 상승", advice: "당당하고 매력적인 모습이 상대의 마음을 끌어당기니 호감을 표현해 보세요." },
    { keyword: "성과 창출 및 결실", advice: "노력해 온 분야에서 가시적인 성과나 승진, 자격 취득 등의 기쁨이 따릅니다." },
    { keyword: "감정 조율 및 쿨다운", advice: "순간의 조급함이나 언쟁을 피하고 겸손하고 아량 넓은 태도를 보여주세요." },
  ],
  6: [
    { keyword: "망종의 열매 준비", advice: "결실이 무르익기 직전이니 끝까지 신중함과 인내심을 잃지 않는 것이 핵심입니다." },
    { keyword: "빠른 판단 및 추진", advice: "우유부단함을 버리고 냉철하고 신속한 결정을 내릴 때 이득이 극대화됩니다." },
    { keyword: "인센티브 및 수혜", advice: "금전적인 보상이나 부수입의 기회가 생겨나 통장이 알차게 채워집니다." },
    { keyword: "공통 목표 합의", advice: "연인이나 파트너와 장기적인 가치관을 공유하며 유대를 굳건히 하십시오." },
    { keyword: "체력 안배 및 쉬어가기", advice: "여름철 체력 소모에 유의하여 무리한 일정을 줄이고 숙면을 취하세요." },
  ],
  7: [
    { keyword: "소서의 차분한 완충", advice: "무더위 속에서도 중심을 잃지 말고 현재 지닌 자산과 가치를 안전하게 지키세요." },
    { keyword: "포근한 소통 및 배려", advice: "소소한 일상을 공유하며 주변 인연들에게 따뜻한 위로와 격려를 전달하세요." },
    { keyword: "내실 검토 및 오류 수정", advice: "확장보다 기존 프로젝트의 누락된 부분을 보완하면 실수를 완벽히 방지합니다." },
    { keyword: "안정적 수익 도모", advice: "고위험 투자보다 안정적인 자산 운용에 주력하는 것이 지혜로운 선택입니다." },
    { keyword: "타인 시선 내려놓기", advice: "남들의 평판에 연연하지 말고 본인의 소신과 내면의 평화를 우선시하세요." },
  ],
  8: [
    { keyword: "입추의 예리한 결단", advice: "서늘한 금 기운이 작동하니 감정을 배제하고 이성적인 판단으로 승부하세요." },
    { keyword: "수확 및 결실 손에 쥐기", advice: "공들여온 일의 결실이 손에 잡히는 길운입니다. 마무리를 확실하게 지으세요." },
    { keyword: "분석력 극대화", advice: "복잡하게 꼬였던 난제를 명쾌하고 정교하게 정리해 내어 능력을 증명합니다." },
    { keyword: "쿨한 이성 관계", advice: "현실적이고 건설적인 대화를 통해 상호 간의 관계를 단단하게 다지세요." },
    { keyword: "언행 주의 및 따뜻함", advice: "단호한 표현이 냉정하게 보이지 않도록 부드러운 언사를 곁들여 대화하세요." },
  ],
  9: [
    { keyword: "백로의 풍요 및 기쁨", advice: "노력이 알짜배기 실속으로 환원되는 달의 시작입니다. 기쁜 마음으로 임하세요." },
    { keyword: "재물창고 충전", advice: "뜻밖의 유익한 딜이나 수입 기회가 찾아와 자산이 넉넉해지는 주간입니다." },
    { keyword: "애정전선 화사함", advice: "정성 어린 배려가 상대방의 깊은 마음을 열어 낭만적인 분위기가 피어납니다." },
    { keyword: "최고 품질 완성", advice: "수행 결과물이 대내외적으로 두터운 호평을 받아 명성이 크게 상승합니다." },
    { keyword: "완벽주의 조율", advice: "자신의 높은 기준을 타인에게 강요하지 말고 포용력 있게 품어주세요." },
  ],
  10: [
    { keyword: "한로의 지혜로운 저장", advice: "화려한 겉치레보다 실속 있는 가치를 추구하며 조용히 내실을 다지십시오." },
    { keyword: "귀인의 조력 및 감싸안음", advice: "서로의 허물을 감싸주는 따스한 인연 속에서 든든한 조력자를 만나게 됩니다." },
    { keyword: "묵묵한 역량 발휘", advice: "보이지 않는 곳에서 성실히 쌓아온 내공이 빛을 발해 난제를 극복해 냅니다." },
    { keyword: "알짜 자금 축적", advice: "불필요한 지출이 대폭 줄어들고 차곡차곡 미래를 위한 비상금이 모입니다." },
    { keyword: "성급한 신규 확장 경계", advice: "불확실한 투자나 섣부른 계약은 다음 기회로 미루고 현재를 공고히 하세요." },
  ],
  11: [
    { keyword: "입동의 깊은 통찰", advice: "지혜의 물길이 트이는 시기입니다. 복잡한 문제의 핵심을 꿰뚫는 혜안이 생깁니다." },
    { keyword: "지식 투자 및 자기개발", advice: "배움이나 강의, 지적 자산에 투자하면 향후 커다란 자산으로 돌아옵니다." },
    { keyword: "진솔한 감성 소통", advice: "마음속 깊은 고민과 진심을 터놓고 공유하며 끈끈한 유대감을 형성하세요." },
    { keyword: "성공적 해법 도출", advice: "냉철한 정보 분석을 통해 조직이나 본인의 난제에 명쾌한 답을 제시합니다." },
    { keyword: "과도한 생각 경계 및 실행", advice: "생각이 너무 많아 주저하지 말고 적절한 타이밍에 과감히 행동으로 옮기세요." },
  ],
  12: [
    { keyword: "대설의 충전 및 고찰", advice: "한 해를 차분히 돌아보고 내면의 신념을 응축하며 새 도약을 준비하는 주간입니다." },
    { keyword: "시드머니 수호", advice: "사치와 연말 허례허시 지출을 차단하여 알뜰하게 자금을 수호하시기 바랍니다." },
    { keyword: "정갈하고 아늑한 애정", advice: "조용하고 아늑한 공간에서 오순도순 담소를 나누며 깊은 사랑을 다지세요." },
    { keyword: "차기 연도 전략 수립", advice: "다음 해의 구체적인 목표와 마일스톤을 수립하면 운기의 흐름이 매우 길해집니다." },
    { keyword: "온열 체력 관리", advice: "차가운 기운에 몸이 해를 입지 않도록 따뜻한 성질의 음식과 휴식을 취하세요." },
  ],
};

/**
 * API 호출이 실패하거나 로컬 환경에서 테스트할 때 제공할 고품질 다이내믹 폴백 리포트를 생성합니다.
 * 십신 및 명리 지식을 조립하여 300~500자 이상의 풍성한 내용을 만듭니다.
 */
function buildClientFallbackReport(
  profile: UserProfile,
  year: number,
  month: number,
  bestDays: string[]
): MonthlySajuReport {
  const birthTime = profile.birthTime || "모름";
  const saju = calculateSaju(profile.birthDate, birthTime);
  const monthGeon = getMonthGeon(year, month);
  const ohengLucky = getOhengLucky(saju.weakElement, year, month);

  const mData = MONTHLY_SAJU_VARIATIONS[month] || MONTHLY_SAJU_VARIATIONS[9];
  const monthFlowData = MONTHLY_WEEKLY_FLOW_DATA[month] || MONTHLY_WEEKLY_FLOW_DATA[9];

  // 주차 범위 계산
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const weekCount = Math.ceil((daysInMonth + firstDayOfWeek) / 7);
  const weekRanges: string[] = [];
  for (let w = 0; w < weekCount; w++) {
    const start = w * 7 + 1;
    const end = Math.min((w + 1) * 7, daysInMonth);
    weekRanges.push(`${start}일~${end}일`);
  }

  const weeklyFlow = weekRanges.map((range, i) => {
    const item = monthFlowData[i] || monthFlowData[monthFlowData.length - 1];
    return {
      week: i + 1,
      dateRange: range,
      keyword: item.keyword,
      advice: item.advice,
    };
  });

  const description = `${profile.name}님의 사주(${saju.dayPillar.hanja} 일주)와 ${year}년 ${month}월의 월건(${monthGeon.pillar.hanja})을 대조한 결과, ${mData.descTheme} 부족 오행인 [${saju.weakElement}] 기운이 서서히 보완되며 주위 귀인의 조력이 따를 것입니다.`;

  return {
    year,
    month,
    userProfile: profile,
    sajuPillars: {
      yearPillar: saju.yearPillar.hanja,
      monthPillar: saju.monthPillar.hanja,
      dayPillar: saju.dayPillar.hanja,
      hourPillar: saju.hourPillar?.hanja ?? null,
      dominantElement: saju.dominantElement,
      weakElement: saju.weakElement,
      monthGeon: monthGeon.name,
    },
    monthlyOverview: {
      title: `${profile.zodiac}띠 ${profile.name}님을 위한 ${month}월 - ${mData.titleSuffix}`,
      description,
      scores: mData.scores,
    },
    weeklyFlow,
    categoryFortunes: {
      wealth: `${profile.name}님의 ${month}월 금전운: ${mData.wealthText}`,
      love: `${month}월 애정 및 인간관계: ${mData.loveText}`,
      career: `${profile.zodiac}띠 ${profile.gender}성 ${profile.name}님의 ${month}월 직장/학업 운세: ${mData.careerText}`,
      health: `${month}월 건강 및 심신 관리: ${mData.healthText}`,
    },
    monthlyPrescription: {
      luckyColor: ohengLucky.luckyColor,
      luckyDirection: ohengLucky.luckyDirection,
      luckyNumber: ohengLucky.luckyNumber,
      luckyItem: ohengLucky.luckyItem,
      avoidAction: mData.avoidAction,
      bestDays: bestDays.length > 0 ? bestDays : [`${year}-${String(month).padStart(2, "0")}-07`, `${year}-${String(month).padStart(2, "0")}-18`],
    },
    generatedAt: new Date().toISOString(),
  };
}

// 오래된 캐시 (동일 문장으로 중복 유도된 데이터)를 한 번에 일괄 무시/청소
const CACHE_VERSION = "v3";

if (typeof window !== "undefined" && window.localStorage) {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("fortune_monthly_saju_") && !key.includes(`_v3_`)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
      console.log("[CacheMigration] 제거된 이전 캐시:", key);
    }
  } catch (e) {
    console.error("[CacheMigration] 오래된 캐시 정리 중 에러:", e);
  }
}

/**
 * 990 월간 운세풀이 리포트를 조회/생성합니다.
 * API 서버가 만세력 코드로 확정된 사주팔자를 계산하고,
 * LLM은 그 데이터를 기반으로 해석만 수행합니다.
 */
export async function getMonthlySajuReport(
  profile: UserProfile,
  year: number,
  month: number // 1~12
): Promise<MonthlySajuReport> {
  const cacheKey = `fortune_monthly_saju_v3_${profile.name}_${profile.zodiac}_${year}_${month}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      return JSON.parse(cached) as MonthlySajuReport;
    } catch (e) {
      console.warn("[MonthlySaju] 캐시 파싱 실패:", e);
    }
  }

  // 1) 행운의 날 공통 데이터 조회 (Best Days 정합성 보장)
  const luckyDays = await getOrFetchLuckyDays(profile, year, month);
  const bestDays = luckyDays.slice(0, 3).map((d) => d.date);

  const saju = calculateSaju(profile.birthDate, profile.birthTime || "모름");
  const ohengLucky = getOhengLucky(saju.weakElement, year, month);

  // 2) API 호출 (서버가 만세력 계산 + LLM 해석)
  let aiResult: any = null;
  try {
    const { fetchMonthlySaju } = await import("./api");
    aiResult = await fetchMonthlySaju({
      name: profile.name,
      zodiac: profile.zodiac,
      gender: profile.gender,
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      year,
      month,
    });
  } catch (e) {
    console.warn("[MonthlySaju] API 호출 실패 (폴백 데이터 사용):", e);
  }

  // API 성공 시 결과 처리
  if (aiResult) {
    const report: MonthlySajuReport = {
      year,
      month,
      userProfile: profile,
      sajuPillars: aiResult.sajuPillars ?? undefined,
      monthlyOverview: {
        title: aiResult.monthlyOverview?.title || `${month}월은 기운이 새롭게 전환되는 시기`,
        description: aiResult.monthlyOverview?.description || `${profile.name}님의 이번 달은 전반적으로 안정적인 흐름 속에서 소소한 변화가 예상됩니다.`,
        scores: {
          overall: aiResult.monthlyOverview?.scores?.overall ?? 72,
          wealth: aiResult.monthlyOverview?.scores?.wealth ?? 68,
          love: aiResult.monthlyOverview?.scores?.love ?? 74,
          career: aiResult.monthlyOverview?.scores?.career ?? 70,
          health: aiResult.monthlyOverview?.scores?.health ?? 65,
        },
      },
      weeklyFlow: aiResult.weeklyFlow || [],
      categoryFortunes: aiResult.categoryFortunes || { wealth: "", love: "", career: "", health: "" },
      monthlyPrescription: {
        luckyColor: aiResult.monthlyPrescription?.luckyColor || ohengLucky.luckyColor,
        luckyDirection: aiResult.monthlyPrescription?.luckyDirection || ohengLucky.luckyDirection,
        luckyNumber: aiResult.monthlyPrescription?.luckyNumber ?? ohengLucky.luckyNumber,
        luckyItem: aiResult.monthlyPrescription?.luckyItem || ohengLucky.luckyItem,
        avoidAction: aiResult.monthlyPrescription?.avoidAction || "성급한 결정이나 감정적인 대립은 피하는 것이 좋습니다.",
        bestDays: bestDays.length > 0 ? bestDays : [`${year}-${String(month).padStart(2, "0")}-07`, `${year}-${String(month).padStart(2, "0")}-18`],
      },
      generatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(report));
    } catch (e) {
      console.warn("[MonthlySaju] 캐시 저장 실패:", e);
    }
    return report;
  }

  // API 실패 시 고품질 동적 로컬 폴백 생성
  const fallbackReport = buildClientFallbackReport(profile, year, month, bestDays);
  try {
    localStorage.setItem(cacheKey, JSON.stringify(fallbackReport));
  } catch (e) {
    console.warn("[MonthlySaju] 폴백 캐시 저장 실패:", e);
  }
  return fallbackReport;
}

/**
 * 주간 운세를 가져옵니다 (캐시 → API → 로컬 폴백)
 */
export async function getWeeklyFortune(
  profile: UserProfile,
): Promise<WeeklyFortune> {
  const now = new Date();
  const { start, end } = getWeekRange(now);

  // 1) 캐시 확인
  const cached = loadWeeklyFortuneSync();
  if (cached && cached.weekStart === start && cached.zodiac === profile.zodiac) {
    return cached;
  }

  // 2) API 전송 (폴백 없음)
  const response = await fetchWeeklyFortune({
    zodiac: profile.zodiac,
    gender: profile.gender,
    birthDate: profile.birthDate,
    weekStart: start,
    weekEnd: end,
  });

  const weekly: WeeklyFortune = {
    weekStart: start,
    weekEnd: end,
    zodiac: profile.zodiac,
    dailyFortunes: response.dailyFortunes.map((fortune) => ({
      ...fortune,
      zodiac: profile.zodiac,
    })),
    generatedAt: new Date().toISOString(),
  };

  void saveWeeklyFortune(weekly);
  return weekly;
}

/**
 * 저장된 월간 운세 캐시가 있는지 동기적으로 확인하고 반환합니다.
 */
export function getCachedMonthlySajuReportSync(
  profile: UserProfile | null,
  year: number,
  month: number
): MonthlySajuReport | null {
  if (!profile) return null;
  const cacheKey = `fortune_monthly_saju_v3_${profile.name}_${profile.zodiac}_${year}_${month}`;
  const cached = localStorage.getItem(cacheKey);
  if (!cached) return null;
  try {
    return JSON.parse(cached) as MonthlySajuReport;
  } catch (e) {
    return null;
  }
}

/**
 * 특정 날짜의 운세 (주간 데이터에서 추출, 없으면 개별 API 조회)
 */
export async function getDailyFortune(
  date: string,
  profile: UserProfile,
  weeklyFortune?: WeeklyFortune | null,
): Promise<DailyFortune> {
  if (weeklyFortune) {
    const found = weeklyFortune.dailyFortunes.find((fortune) => fortune.date === date);
    if (found) return found;
  }

  // 주간 데이터에 없으면 daily API 호출
  const { fetchDailyFortune } = await import("./api");
  const { saveDailyFortune } = await import("./storage");
  try {
    const res = await fetchDailyFortune({
      zodiac: profile.zodiac,
      gender: profile.gender,
      birthDate: profile.birthDate,
      targetDate: date,
    });

    const [yStr, mStr] = date.split("-");
    const luckyKey = `fortune_lucky_days_${profile.zodiac}_${Number(yStr)}_${Number(mStr)}`;
    const luckyCached = localStorage.getItem(luckyKey);
    let syncedFortune = { ...res.fortune, zodiac: profile.zodiac };

    if (luckyCached) {
      try {
        const luckyList = JSON.parse(luckyCached) as LuckyDayItem[];
        const match = luckyList.find((item) => item.date === date);
        if (match) {
          syncedFortune.grade = match.grade;
        }
      } catch (e) {}
    }

    await saveDailyFortune(syncedFortune); // 캐시에 저장하여 내일이 되어도 안바뀌게 함
    return syncedFortune;
  } catch (err) {
    console.error("fetchDailyFortune error:", err);
    throw new Error(`해당 날짜(${date})의 운세 데이터를 찾을 수 없습니다.`);
  }
}



