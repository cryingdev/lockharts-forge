
const VERSION_MARKER_KEY = 'lockharts_forge_version_marker';
const SAVE_PREFIX = 'lockharts_forge_slot_';

/**
 * 웹 환경의 캐시와 로컬 저장소를 관리하고 초기화합니다.
 * 세이브 데이터를 보존하면서 오래된 에셋이나 잘못된 상태값을 정리합니다.
 * 프리뷰 환경에서의 안정성을 위해 metadata.json을 fetch로 로드합니다.
 */
export const initializeWebCache = async (): Promise<void> => {
    let currentVersion = '0.1.43a'; // 기본값

    try {
        // 프리뷰 환경 도메인 문제를 피하기 위해 런타임에 상대 경로로 가져옵니다.
        const response = await fetch('./metadata.json');
        if (response.ok) {
            const metadata = await response.json();
            currentVersion = metadata.version;
        }
    } catch (e) {
        console.warn("[System] Could not fetch metadata.json, using default version.");
    }

    console.group(`[System] Initializing Web Cache (v${currentVersion})`);
    
    try {
        // 1. 브라우저 Cache API 정리 (Service Worker 에셋 등)
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            if (cacheNames.length > 0) {
                console.log(`- Cleared ${cacheNames.length} cache containers.`);
            }
        }

        // 2. 로컬 저장소 버전 체크 및 클린업
        const rawMarker = localStorage.getItem(VERSION_MARKER_KEY);
        let needsCleanup = false;

        if (!rawMarker) {
            needsCleanup = true;
        } else {
            try {
                const marker = JSON.parse(rawMarker);
                if (marker.version !== currentVersion) {
                    needsCleanup = true;
                }
            } catch (e) {
                needsCleanup = true;
            }
        }

        if (needsCleanup) {
            console.log("- Version mismatch or first run. Performing storage maintenance...");
            
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;

                // 세이브 데이터 슬롯과 버전 마커, D-pad 설정은 보존
                // lockharts_forge_meta (구버전 키)는 정리 대상에 포함시켜 충돌 제거
                const isSaveSlot = key.startsWith(SAVE_PREFIX);
                const isVersionMarker = key === VERSION_MARKER_KEY;
                const isDpadConfig = key.startsWith('dpad_');
                const isSaveMetadata = key === 'lockharts_forge_save_metadata';

                if (!isSaveSlot && !isVersionMarker && !isDpadConfig && !isSaveMetadata) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));
            if (keysToRemove.length > 0) {
                console.log(`- Removed ${keysToRemove.length} obsolete storage keys.`);
            }

            // 새로운 버전 마커 기록
            localStorage.setItem(VERSION_MARKER_KEY, JSON.stringify({ version: currentVersion, timestamp: Date.now() }));
        }

        console.log("- Web environment is now clean.");
    } catch (error) {
        console.warn("- Cache initialization encountered issues:", error);
    } finally {
        console.groupEnd();
    }
};
