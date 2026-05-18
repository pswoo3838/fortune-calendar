/**
 * Apps-in-Toss 광고 매니저 (인앱 광고 2.0 ver2)
 *
 * 공식 API: loadFullScreenAd / showFullScreenAd / TossAds
 * @see https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd.md
 * @see https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/BannerAd.md
 *
 * 광고 그룹 ID:
 *   - 테스트 전면: ait-ad-test-interstitial-id
 *   - 테스트 배너: ait-ad-test-banner-id
 *   - 프로덕션 ID는 앱인토스 콘솔에서 발급 후 교체
 */

// ──────────────────────────────────────────────
// 광고 그룹 ID (출시 시 콘솔에서 발급받은 ID로 교체)
// ──────────────────────────────────────────────
const AD_GROUP = {
  INTERSTITIAL: "ait-ad-test-interstitial-id", // TODO: 프로덕션 전면 광고 ID
  BANNER: "ait-ad-test-banner-id", // TODO: 프로덕션 배너 광고 ID
} as const;

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
// 전면형 광고 (Interstitial)
// ──────────────────────────────────────────────
let _adLoaded = false;
let _loadUnregister: (() => void) | null = null;

/**
 * 전면 광고를 미리 로드합니다.
 * - 페이지 마운트 시 또는 이전 광고 dismissed 후 호출
 * - load → show → load → show 순서를 준수
 */
export async function preloadFullScreenAd(): Promise<void> {
  const fw = await getFramework();
  try {
    if (!fw?.loadFullScreenAd?.isSupported?.()) {
      console.log("[Ad] 전면 광고 미지원 환경");
      return;
    }
  } catch {
    console.log("[Ad] 전면 광고 SDK 환경 아님 (개발 환경)");
    return;
  }

  // 이전 리스너 해제
  _loadUnregister?.();

  _loadUnregister = fw.loadFullScreenAd({
    options: { adGroupId: AD_GROUP.INTERSTITIAL },
    onEvent: (event) => {
      if (event.type === "loaded") {
        _adLoaded = true;
        console.log("[Ad] 전면 광고 로드 완료");
      }
    },
    onError: (err) => {
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
  if (!_adLoaded) {
    console.log("[Ad] 전면 광고 미로드 상태, 스킵");
    return false;
  }

  const fw = await getFramework();
  if (!fw?.showFullScreenAd?.isSupported?.()) return false;

  return new Promise<boolean>((resolve) => {
    let settled = false;

    const settle = (value: boolean) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(value);
      }
    };

    // 타임아웃 — 광고가 응답하지 않을 때 서비스 블록 방지
    const timer = setTimeout(() => {
      console.warn("[Ad] 전면 광고 타임아웃");
      settle(false);
    }, AD_SHOW_TIMEOUT_MS);

    fw.showFullScreenAd({
      options: { adGroupId: AD_GROUP.INTERSTITIAL },
      onEvent: (event) => {
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
        console.warn("[Ad] 전면 광고 표시 실패:", err);
        _adLoaded = false;
        void preloadFullScreenAd();
        settle(false);
      },
    });
  });
}

// 무료 운세 카운터 (처음엔 바로 광고를 볼지, 1번은 무료로 할지 결정)
// 앱 진입 시 최초 1회는 무료로 보게 해주고, 그 다음부터 광고를 띄우려면 초기값을 1 이상으로 설정합니다.
// 대표님 요청에 따라 "한 번 보면 3~4개 패스"이므로, 
// 초기값을 0으로 두면 첫 운세 클릭 시 광고 노출 -> 이후 3번 패스
// 초기값을 3으로 두면 첫 3번 패스 -> 4번째에 광고 노출 -> 이후 3번 패스
let _freeFortunesLeft = 0;

/**
 * 운세 보기 전용 전면 광고 호출 함수 (빈도 조절 적용)
 */
export async function showFortuneInterstitial(): Promise<boolean> {
  if (_freeFortunesLeft > 0) {
    console.log(`[Ad] 전면 광고 스킵 (무료 패스 ${_freeFortunesLeft}회 남음)`);
    _freeFortunesLeft--;
    return true;
  }

  console.log("[Ad] 전면 광고 노출 시도...");
  const shown = await showFullScreenAd();
  
  // 광고 노출을 시도했다면 (성공/실패/개발환경 무관) 다음 3회는 무료 패스
  _freeFortunesLeft = 3;
  return shown;
}

/**
 * 전면 광고 로드 리스너를 해제합니다 (컴포넌트 언마운트 시)
 */
export function cleanupFullScreenAd(): void {
  _loadUnregister?.();
  _loadUnregister = null;
}

// ──────────────────────────────────────────────
// 배너 광고 (TossAds)
// ──────────────────────────────────────────────
let _bannerInitialized = false;

/**
 * TossAds SDK를 초기화합니다.
 * - 앱 시작 시 1회 호출
 */
export async function initializeTossAds(): Promise<void> {
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

  fw.TossAds.initialize({
    callbacks: {
      onInitialized: () => {
        _bannerInitialized = true;
        console.log("[Ad] TossAds 초기화 완료");
      },
      onInitializationFailed: (err: Error) => {
        console.warn("[Ad] TossAds 초기화 실패:", err);
      },
    },
  });
}

/**
 * 배너 광고를 DOM 요소에 부착합니다.
 * @returns destroy 함수 (cleanup용)
 */
export async function attachBannerAd(
  targetElement: HTMLElement,
): Promise<(() => void) | null> {
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
