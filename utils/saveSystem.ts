
import { GameState } from '../types/game-state';

const SAVE_PREFIX = 'lockharts_forge_slot_';
const META_KEY = 'lockharts_forge_meta';

export interface SaveMetadata {
    index: number;
    timestamp: number;
    day: number;
    gold: number;
    label: string;
}

export const getSaveMetadataList = (): SaveMetadata[] => {
    try {
        const meta = localStorage.getItem(META_KEY);
        return meta ? JSON.parse(meta) : [];
    } catch {
        return [];
    }
};

export const saveToSlot = (slotIndex: number, state: GameState) => {
    try {
        const dataToSave = {
            ...state,
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
            label: `Slot ${slotIndex + 1}`
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

// Added saveToStorage as an alias for saveToSlot(0) for generic saving
export const saveToStorage = (state: GameState) => {
    return saveToSlot(0, state);
};

export const loadFromSlot = (slotIndex: number): GameState | null => {
    try {
        const data = localStorage.getItem(`${SAVE_PREFIX}${slotIndex}`);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

// Added loadFromStorage to return the latest available save
export const loadFromStorage = (): GameState | null => {
    return getLatestSave();
};

export const getLatestSave = (): GameState | null => {
    const meta = getSaveMetadataList();
    if (meta.length === 0) return null;
    // 메타데이터가 이미 timestamp 기준 내림차순 정렬되어 있음
    return loadFromSlot(meta[0].index);
};

export const deleteSlot = (slotIndex: number) => {
    localStorage.removeItem(`${SAVE_PREFIX}${slotIndex}`);
    const meta = getSaveMetadataList().filter(m => m.index !== slotIndex);
    localStorage.setItem(META_KEY, JSON.stringify(meta));
};
