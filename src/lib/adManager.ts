/**
 * Apps-in-Toss 광고 매니저 (인앱 광고 2.0 ver2)
 *
 * 공식 API: loadFullScreenAd / showFullScreenAd / TossAds
 * @see https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd.md
 * @see https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/BannerAd.md
 *
 * 광고 그룹 ID:
 *   - 전면형: ait.v2.live.0f9946169c834168
 *   - 하단 배너: ait.v2.live.f300e65722924e6d
 */

// ──────────────────────────────────────────────
// 광고 그룹 ID
// ──────────────────────────────────────────────
// [운영 환경 광고 ID]
const AD_GROUP = {
  INTERSTITIAL: "ait.v2.live.0f9946169c834168", // 전면형 광고
  BANNER: "ait.v2.live.f300e65722924e6d",       // 하단 배너 광고
} as const;

// [테스트/샌드박스 광고 ID - 필요 시 위의 AD_GROUP을 주석 처리하고 아래 주석을 해제하여 사용하세요]
/*
const AD_GROUP = {
  INTERSTITIAL: "ait-ad-test-interstitial-id", // 테스트 전면형 광고
  BANNER: "ait-ad-test-banner-id",             // 테스트 하단 배너 광고
} as const;
*/


// ──────────────────────────────────────────────
// 프레임워크 모듈 로딩 (lazy, 토스 앱 외 환경 graceful fallback)
// ──────────────────────────────────────────────
type FrameworkModule = typeof import("@apps-in-toss/web-framework");
let _fw: FrameworkModule | null = null;

async function getFramework(): Promise<FrameworkModule | null> {
  if (_fw) return _fw;
  try {
    _fw = await import("@apps-in-toss/web-framework");
    return _fw;
  } catch {
    console.log("[Ad] 광고 SDK를 불러올 수 없습니다 (개발 환경)");
    return null;
  }
}

// ──────────────────────────────────────────────
// 안전한 SDK 지원 판단 헬퍼 (Toss Web Bridge 오류 방어)
// ──────────────────────────────────────────────
function safeIsAdSupported(fw: FrameworkModule | null): fw is FrameworkModule {
  try {
    if (typeof fw?.showFullScreenAd?.isSupported === "function") {
      return !!fw.showFullScreenAd.isSupported();
    }
  } catch (e) {
    console.warn("[Ad] showFullScreenAd.isSupported 체크 실패 (미지원 간주):", e);
  }
  return false;
}

function safeIsLoadAdSupported(fw: FrameworkModule | null): fw is FrameworkModule {
  try {
    if (typeof fw?.loadFullScreenAd?.isSupported === "function") {
      return !!fw.loadFullScreenAd.isSupported();
    }
  } catch (e) {
    console.warn("[Ad] loadFullScreenAd.isSupported 체크 실패 (미지원 간주):", e);
  }
  return false;
}

// ──────────────────────────────────────────────
// 전면형 광고 (Interstitial)
// ──────────────────────────────────────────────
let _adLoaded = false;
let _loadUnregister: (() => void) | null = null;
let _loadGeneration = 0;
let _cancelShow: (() => void) | null = null;

/**
 * 전면 광고를 미리 로드합니다.
 * - 페이지 마운트 시 또는 이전 광고 dismissed 후 호출
 * - load → show → load → show 순서를 준수
 */
export async function preloadFullScreenAd(): Promise<void> {
  const generation = ++_loadGeneration;
  const fw = await getFramework();
  if (generation !== _loadGeneration) return;
  if (!safeIsLoadAdSupported(fw)) {
    console.log("[Ad] 전면 광고 미지원 환경");
    return;
  }

  // 이전 리스너 해제
  _loadUnregister?.();
  _adLoaded = false;

  _loadUnregister = fw.loadFullScreenAd({
    options: { adGroupId: AD_GROUP.INTERSTITIAL },
    onEvent: (event) => {
      if (generation !== _loadGeneration) return;
      if (event.type === "loaded") {
        _adLoaded = true;
        console.log("[Ad] 전면 광고 로드 완료");
      }
    },
    onError: (err) => {
      if (generation !== _loadGeneration) return;
      console.warn("[Ad] 전면 광고 로드 실패:", err);
      _adLoaded = false;
    },
  });
}

const AD_SHOW_TIMEOUT_MS = 15_000;

/**
 * 전면 광고를 표시합니다.
 * - 광고가 닫히면 true, 실패/타임아웃이면 false를 반환
 * - 서비스 흐름을 블록하지 않도록 타임아웃 포함
 * - dismissed 후 자동으로 다음 광고를 preload
 */
export async function showFullScreenAd(): Promise<boolean> {
  if (!_adLoaded || _cancelShow) {
    console.log("[Ad] 전면 광고 미로드 상태, 스킵");
    return false;
  }

  const fw = await getFramework();
  if (!safeIsAdSupported(fw) || !_adLoaded || _cancelShow) return false;
  _adLoaded = false;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    let unregister: (() => void) | null = null;

    const settle = (value: boolean) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        unregister?.();
        _cancelShow = null;
        resolve(value);
      }
    };

    // 타임아웃 — 광고가 응답하지 않을 때 서비스 블록 방지
    const timer = setTimeout(() => {
      console.warn("[Ad] 전면 광고 타임아웃");
      settle(false);
    }, AD_SHOW_TIMEOUT_MS);

    _cancelShow = () => settle(false);

    try {
      unregister = fw.showFullScreenAd({
        options: { adGroupId: AD_GROUP.INTERSTITIAL },
        onEvent: (event) => {
          if (settled) return;
          switch (event.type) {
            case "dismissed":
              _adLoaded = false;
              void preloadFullScreenAd();
              settle(true);
              break;
            case "failedToShow":
              _adLoaded = false;
              void preloadFullScreenAd();
              settle(false);
              break;
            // impression, clicked 등은 로깅만
            default:
              console.log("[Ad] 전면 광고 이벤트:", event.type);
          }
        },
        onError: (err) => {
          if (settled) return;
          console.warn("[Ad] 전면 광고 표시 실패:", err);
          _adLoaded = false;
          void preloadFullScreenAd();
          settle(false);
        },
      });
      if (settled) unregister();
    } catch (err) {
      console.warn("[Ad] 전면 광고 호출 실패:", err);
      settle(false);
    }
  });
}

/**
 * 운세 보기 전용 전면 광고 호출 함수 (새 운세 조회 시 매번 호출)
 */
export async function showFortuneInterstitial(): Promise<boolean> {
  const fw = await getFramework();
  const isAdSupported = safeIsAdSupported(fw);

  console.log("[Ad] 운세 조회 전면 광고 노출 시도...");
  const shown = await showFullScreenAd();

  if (isAdSupported) {
    return shown;
  } else {
    // 광고 SDK 미지원 개발 환경인 경우 성공 시뮬레이션
    console.log("[Ad] 개발 환경 시뮬레이션: 광고 성공 처리");
    return true;
  }
}

/**
 * 행운의 날 전용 전면 광고 호출 함수
 */
export async function showLuckyDaysAd(): Promise<boolean> {
  const fw = await getFramework();
  const isAdSupported = safeIsAdSupported(fw);

  console.log("[Ad] 행운의 날 전면 광고 노출 시도...");
  const shown = await showFullScreenAd();

  if (isAdSupported) {
    return shown;
  } else {
    // 광고 SDK 미지원 개발 환경인 경우 테스트 편의상 완시로 시뮬레이션
    console.log("[Ad] 개발 환경 시뮬레이션: 행운의 날 광고 성공 처리");
    return true;
  }
}

/**
 * 전면 광고 로드 리스너를 해제합니다 (컴포넌트 언마운트 시)
 */
export function cleanupFullScreenAd(): void {
  _loadGeneration++;
  _adLoaded = false;
  _cancelShow?.();
  _loadUnregister?.();
  _loadUnregister = null;
}

// ──────────────────────────────────────────────
// 배너 광고 (TossAds)
// ──────────────────────────────────────────────
let _bannerInitialized = false;
let _bannerInitialization: Promise<void> | null = null;

/**
 * TossAds SDK를 초기화합니다.
 * - 앱 시작 시 1회 호출
 */
export async function initializeTossAds(): Promise<void> {
  if (_bannerInitialized) return;
  if (!_bannerInitialization) {
    _bannerInitialization = initializeBannerSdk();
  }
  try {
    await _bannerInitialization;
  } finally {
    _bannerInitialization = null;
  }
}

async function initializeBannerSdk(): Promise<void> {
  const fw = await getFramework();
  try {
    if (!fw?.TossAds?.initialize?.isSupported?.()) {
      console.log("[Ad] TossAds 미지원 환경");
      return;
    }
  } catch {
    console.log("[Ad] 배너 광고 SDK 환경 아님 (개발 환경)");
    return;
  }

  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 10_000);
    const finish = () => {
      clearTimeout(timer);
      resolve();
    };
    try {
      fw.TossAds.initialize({
        callbacks: {
          onInitialized: () => {
            _bannerInitialized = true;
            console.log("[Ad] TossAds 초기화 완료");
            finish();
          },
          onInitializationFailed: (err: Error) => {
            console.warn("[Ad] TossAds 초기화 실패:", err);
            finish();
          },
        },
      });
    } catch (err) {
      console.warn("[Ad] 배너 광고 초기화 호출 실패:", err);
      finish();
    }
  });
}

/**
 * 배너 광고를 DOM 요소에 부착합니다.
 * @returns destroy 함수 (cleanup용)
 */
export async function attachBannerAd(
  targetElement: HTMLElement,
): Promise<(() => void) | null> {
  await initializeTossAds();
  if (!_bannerInitialized) {
    console.log("[Ad] TossAds 미초기화, 배너 부착 스킵");
    return null;
  }

  const fw = await getFramework();
  if (!fw?.TossAds?.attachBanner?.isSupported?.()) return null;

  try {
    const result = fw.TossAds.attachBanner(AD_GROUP.BANNER, targetElement, {
      theme: "auto",
      tone: "grey",
      variant: "expanded",
      callbacks: {
        onAdRendered: () => console.log("[Ad] 배너 렌더링 완료"),
        onAdFailedToRender: (err: unknown) =>
          console.warn("[Ad] 배너 렌더링 실패:", err),
      },
    }) as { destroy?: () => void };

    return () => result?.destroy?.();
  } catch (err) {
    console.warn("[Ad] 배너 부착 실패:", err);
    return null;
  }
}
