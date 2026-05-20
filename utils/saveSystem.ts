import { GameState, GameSettings } from '../types/game-state';
import { APP_VERSION } from './appVersion';
import {
    extractLegacyPlayerName,
    getDefaultForgeName,
    getDefaultPlayerName,
    getForgeName,
    getForgeNameFromPlayerName,
    getPlayerName
} from './gameText';

const SAVE_PREFIX = 'lockharts_forge_slot_';
const META_KEY = 'lockharts_forge_save_metadata';
const GLOBAL_SETTINGS_KEY = 'lockharts_forge_global_settings';
/**
 * 마이그레이션 정책:
 * 1. 버전이 다를 경우 필드 추가/삭제 규칙 적용
 * 2. 필수 필드 누락 시 기본값 주입
 * 3. 하위 호환성 실패 시 경고 후 복구 시도
 */
export const migrateSaveData = (loadedData: any, initialState: GameState): GameState => {
    const savedVersion = loadedData.version || '0.0.0';
    
    const loadedCommission = loadedData.commission || {};
    const loadedStats = loadedData.stats || {};
    const loadedSettings = loadedData.settings || {};

    // 1. 기본 구조 병합 (Deep Merge for critical objects)
    const migrated: GameState = {
        ...initialState,
        ...loadedData,
        stats: {
            ...initialState.stats,
            ...loadedStats,
            dailyFinancials: {
                ...initialState.stats.dailyFinancials,
                ...(loadedStats.dailyFinancials || {})
            }
        },
        forge: {
            ...initialState.forge,
            ...(loadedData.forge || {})
        },
        tavern: {
            ...initialState.tavern,
            ...(loadedData.tavern || {})
        },
        arena: {
            ...initialState.arena,
            ...(loadedData.arena || {})
        },
        commission: {
            ...initialState.commission,
            ...loadedCommission,
            namedEncounters: {
                ...initialState.commission.namedEncounters,
                ...(loadedCommission.namedEncounters || {})
            },
            lastEncounterCheckDayByLocation: {
                ...initialState.commission.lastEncounterCheckDayByLocation,
                ...(loadedCommission.lastEncounterCheckDayByLocation || {})
            },
            trackedObjectiveProgress: {
                ...initialState.commission.trackedObjectiveProgress,
                ...(loadedCommission.trackedObjectiveProgress || {})
            },
            issuerAffinity: {
                ...initialState.commission.issuerAffinity,
                ...(loadedCommission.issuerAffinity || {})
            }
        },
        uiEffects: {
            ...initialState.uiEffects,
            ...(loadedData.uiEffects || {})
        },
        settings: {
            ...initialState.settings,
            ...loadedSettings,
            audio: {
                ...initialState.settings.audio,
                ...(loadedSettings.audio || {})
            }
        }
    };

    // 2. 버전별 특수 마이그레이션 로직 (필요 시)
    if (savedVersion < '0.1.44a') {
        // 예: 특정 필드 이름 변경이나 구조 변경 대응
        console.log(`Migrating save from ${savedVersion} to ${APP_VERSION}`);
    }

    if (!migrated.settings.playerName) {
        migrated.settings.playerName =
            extractLegacyPlayerName(loadedSettings.forgeName, migrated.settings.language) ||
            getDefaultPlayerName(migrated.settings.language);
    }

    if (!migrated.settings.forgeName && loadedSettings.forgeName) {
        migrated.settings.forgeName = loadedSettings.forgeName;
    }

    if (!migrated.unlockedTabs.includes('ARENA')) {
        migrated.unlockedTabs = [...migrated.unlockedTabs, 'ARENA'];
    }

    return migrated;
};

export interface SaveMigrationResult {
    success: boolean;
    data: GameState;
    saveVersion: string;
    error?: string;
}

/**
 * Placeholder interface for explicit save-version migrations.
 * Real per-version migration rules should be implemented here later.
 */
export const runVersionMigration = (
    _savedVersion: string,
    _targetVersion: string,
    _migratedState: GameState
): boolean => {
    return true;
};

export const tryMigrateSaveData = (loadedData: any, initialState: GameState): SaveMigrationResult => {
    const saveVersion = loadedData?.version || '0.0.0';

    try {
        const migrated = migrateSaveData(loadedData, initialState);
        const migrationSucceeded = runVersionMigration(saveVersion, APP_VERSION, migrated);

        if (!migrationSucceeded) {
            return {
                success: false,
                data: initialState,
                saveVersion,
                error: 'Version migration failed'
            };
        }

        return {
            success: true,
            data: migrated,
            saveVersion
        };
    } catch (error) {
        console.error('Failed to migrate save data:', error);
        return {
            success: false,
            data: initialState,
            saveVersion,
            error: error instanceof Error ? error.message : 'Unknown migration error'
        };
    }
};

export interface SaveMetadata {
    index: number;
    timestamp: number;
    day: number;
    gold: number;
    label: string;
    version: string;
    playerName?: string;
    forgeName?: string;
}

export interface LoadFromSlotResult {
    success: boolean;
    data: (GameState & { version?: string }) | null;
    version?: string;
    error?: string;
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
            settings: {
                ...state.settings,
                playerName: getPlayerName(state),
                forgeName: getForgeName(state)
            },
            activeEvent: null,
            showSleepModal: false,
            showJournal: false,
            isCrafting: false,
            lastCraftedItem: null,
            unlockedTierPopup: null,
            showTutorialCompleteModal: false,
            toast: null,
            toastQueue: [],
            commissionRewardPreview: null,
            arenaRewardPreview: null,
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
            version: APP_VERSION,
            playerName: getPlayerName(state),
            forgeName: getForgeName(state)
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
    const result = loadFromSlotWithStatus(slotIndex, initialState);
    return result.success ? result.data : null;
};

export const loadFromSlotWithStatus = (slotIndex: number, initialState?: GameState): LoadFromSlotResult => {
    try {
        const data = localStorage.getItem(`${SAVE_PREFIX}${slotIndex}`);
        if (!data) return { success: false, data: null, error: 'Save slot is empty' };
        const parsed = JSON.parse(data);
        if (initialState) {
            const migrationResult = tryMigrateSaveData(parsed, initialState);
            return {
                success: migrationResult.success,
                data: migrationResult.success ? migrationResult.data : null,
                version: migrationResult.saveVersion,
                error: migrationResult.error
            };
        }
        return {
            success: true,
            data: parsed,
            version: parsed.version
        };
    } catch {
        return { success: false, data: null, error: 'Failed to load save data' };
    }
};

export const getLatestSaveInfo = (initialState?: GameState): { data: GameState & { version?: string }, index: number } | null => {
    const info = getLatestSaveInfoWithStatus(initialState);
    return info?.success && info.data ? { data: info.data, index: info.index } : null;
};

export const getLatestSaveInfoWithStatus = (initialState?: GameState): ({ success: boolean; data: (GameState & { version?: string }) | null; index: number; version?: string; error?: string }) | null => {
    const meta = getSaveMetadataList();
    if (meta.length === 0) return null;
    const index = meta[0].index;
    const result = loadFromSlotWithStatus(index, initialState);
    return {
        ...result,
        index
    };
};

export const getDisplayForgeNameFromMetadata = (
    meta: SaveMetadata,
    settings: Pick<GameSettings, 'language'>
): string => {
    if (meta.forgeName?.trim()) return meta.forgeName.trim();
    if (meta.playerName?.trim()) {
        return getForgeNameFromPlayerName(settings.language, meta.playerName.trim());
    }
    return getDefaultForgeName(settings.language);
};

export const deleteSlot = (slotIndex: number) => {
    localStorage.removeItem(`${SAVE_PREFIX}${slotIndex}`);
    const meta = getSaveMetadataList().filter(m => m.index !== slotIndex);
    localStorage.setItem(META_KEY, JSON.stringify(meta));
};
