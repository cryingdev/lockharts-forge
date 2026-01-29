import { GameState } from '../types/game-state';

const SAVE_PREFIX = 'lockharts_forge_slot_';
const META_KEY = 'lockharts_forge_save_metadata';
const APP_VERSION = '0.1.42b';

export interface SaveMetadata {
    index: number;
    timestamp: number;
    day: number;
    gold: number;
    label: string;
    version: string;
}

export const getSaveMetadataList = (): SaveMetadata[] => {
    try {
        const metaData = localStorage.getItem(META_KEY);
        if (!metaData) return [];
        const parsed = JSON.parse(metaData);
        // CRITICAL: metaList.map is not a function 에러 방지를 위해 배열인지 확인
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const getNextAvailableSlot = (): number => {
    const metaList = getSaveMetadataList();
    const usedIndices = metaList.map(m => m.index);
    for (let i = 0; i < 3; i++) {
        if (!usedIndices.includes(i)) return i;
    }
    return 0; // 모두 차있으면 첫 번째 슬롯 리턴
};

export const saveToSlot = (slotIndex: number, state: GameState) => {
    try {
        const dataToSave = {
            ...state,
            version: APP_VERSION, // 데이터 본체에 버전 정보 추가
            activeEvent: null,
            showSleepModal: false,
            showJournal: false,
            isCrafting: false,
            lastCraftedItem: null
        };
        
        // 1. Save main data
        localStorage.setItem(`${SAVE_PREFIX}${slotIndex}`, JSON.stringify(dataToSave));
        
        // 2. Update metadata
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
        filteredMeta.sort((a, b) => b.timestamp - a.timestamp); // 최근순 정렬
        
        localStorage.setItem(META_KEY, JSON.stringify(filteredMeta));
        return true;
    } catch (err) {
        console.error('Failed to save to slot:', err);
        return false;
    }
};

// 특정 슬롯을 지정하지 않았을 때 사용하는 기본 저장 (이제 context에서 관리됨)
export const saveToStorage = (state: GameState) => {
    return saveToSlot(0, state);
};

export const loadFromSlot = (slotIndex: number): (GameState & { version?: string }) | null => {
    try {
        const data = localStorage.getItem(`${SAVE_PREFIX}${slotIndex}`);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

// 불러올 때 마지막 저장된 데이터와 그 인덱스를 함께 리턴하는 헬퍼
export const getLatestSaveInfo = (): { data: GameState & { version?: string }, index: number } | null => {
    const meta = getSaveMetadataList();
    if (meta.length === 0) return null;
    const index = meta[0].index;
    const data = loadFromSlot(index);
    return data ? { data, index } : null;
};

export const loadFromStorage = (): GameState | null => {
    const info = getLatestSaveInfo();
    return info ? info.data : null;
};

export const deleteSlot = (slotIndex: number) => {
    localStorage.removeItem(`${SAVE_PREFIX}${slotIndex}`);
    const meta = getSaveMetadataList().filter(m => m.index !== slotIndex);
    localStorage.setItem(META_KEY, JSON.stringify(meta));
};