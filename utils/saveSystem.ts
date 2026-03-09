import { GameState, GameSettings } from '../types/game-state';

const SAVE_PREFIX = 'lockharts_forge_slot_';
const META_KEY = 'lockharts_forge_save_metadata';
const GLOBAL_SETTINGS_KEY = 'lockharts_forge_global_settings';
const APP_VERSION = '0.1.45a';

/**
 * 마이그레이션 정책:
 * 1. 버전이 다를 경우 필드 추가/삭제 규칙 적용
 * 2. 필수 필드 누락 시 기본값 주입
 * 3. 하위 호환성 실패 시 경고 후 복구 시도
 */
export const migrateSaveData = (loadedData: any, initialState: GameState): GameState => {
    const savedVersion = loadedData.version || '0.0.0';
    
    // 1. 기본 구조 병합 (Deep Merge for critical objects)
    const migrated: GameState = {
        ...initialState,
        ...loadedData,
        stats: {
            ...initialState.stats,
            ...(loadedData.stats || {}),
            dailyFinancials: {
                ...initialState.stats.dailyFinancials,
                ...(loadedData.stats?.dailyFinancials || {})
            }
        },
        forge: {
            ...initialState.forge,
            ...(loadedData.forge || {})
        },
        settings: {
            ...initialState.settings,
            ...(loadedData.settings || {})
        }
    };

    // 2. 버전별 특수 마이그레이션 로직 (필요 시)
    if (savedVersion < '0.1.44a') {
        // 예: 특정 필드 이름 변경이나 구조 변경 대응
        console.log(`Migrating save from ${savedVersion} to ${APP_VERSION}`);
    }

    return migrated;
};

export interface SaveMetadata {
    index: number;
    timestamp: number;
    day: number;
    gold: number;
    label: string;
    version: string;
}

/**
 * 전역 설정(오디오, UI 취향 등)을 별도로 저장합니다.
 */
export const saveGlobalSettings = (settings: GameSettings) => {
    try {
        localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
        console.error('Failed to save global settings:', err);
    }
};

/**
 * 전역 설정을 로드합니다.
 */
export const loadGlobalSettings = (): GameSettings | null => {
    try {
        const data = localStorage.getItem(GLOBAL_SETTINGS_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

export const getSaveMetadataList = (): SaveMetadata[] => {
    try {
        const metaData = localStorage.getItem(META_KEY);
        if (!metaData) return [];
        const parsed = JSON.parse(metaData);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [] as SaveMetadata[];
    }
};

export const getNextAvailableSlot = (): number => {
    const metaList = getSaveMetadataList();
    const usedIndices = metaList.map(m => m.index);
    for (let i = 0; i < 3; i++) {
        if (!usedIndices.includes(i)) return i;
    }
    return 0;
};

export const saveToSlot = (slotIndex: number, state: GameState) => {
    try {
        // 저장 시 UI의 일시적인 상태들을 제거하여 데이터 오염 방지
        const dataToSave = {
            ...state,
            version: APP_VERSION,
            activeEvent: null,
            showSleepModal: false,
            showJournal: false,
            isCrafting: false,
            lastCraftedItem: null,
            unlockedTierPopup: null,
            showTutorialCompleteModal: false,
            toast: null,
            toastQueue: [],
            // 수동 던전 진행 중이라면 상태 보존 (필요 시)
            // 단, 오버레이는 꺼진 상태로 로드되게 유도
            showManualDungeonOverlay: false 
        };
        
        localStorage.setItem(`${SAVE_PREFIX}${slotIndex}`, JSON.stringify(dataToSave));
        
        const currentMeta = getSaveMetadataList();
        const newMeta: SaveMetadata = {
            index: slotIndex,
            timestamp: Date.now(),
            day: state.stats.day,
            gold: state.stats.gold,
            label: `Slot ${slotIndex + 1}`,
            version: APP_VERSION
        };
        
        const filteredMeta = currentMeta.filter(m => m.index !== slotIndex);
        filteredMeta.push(newMeta);
        filteredMeta.sort((a, b) => b.timestamp - a.timestamp);
        
        localStorage.setItem(META_KEY, JSON.stringify(filteredMeta));
        return true;
    } catch (err) {
        console.error('Failed to save to slot:', err);
        return false;
    }
};

export const loadFromSlot = (slotIndex: number, initialState?: GameState): (GameState & { version?: string }) | null => {
    try {
        const data = localStorage.getItem(`${SAVE_PREFIX}${slotIndex}`);
        if (!data) return null;
        const parsed = JSON.parse(data);
        if (initialState) {
            return migrateSaveData(parsed, initialState);
        }
        return parsed;
    } catch {
        return null;
    }
};

export const getLatestSaveInfo = (): { data: GameState & { version?: string }, index: number } | null => {
    const meta = getSaveMetadataList();
    if (meta.length === 0) return null;
    const index = meta[0].index;
    const data = loadFromSlot(index);
    return data ? { data, index } : null;
};

export const deleteSlot = (slotIndex: number) => {
    localStorage.removeItem(`${SAVE_PREFIX}${slotIndex}`);
    const meta = getSaveMetadataList().filter(m => m.index !== slotIndex);
    localStorage.setItem(META_KEY, JSON.stringify(meta));
};