
import { GameState } from '../../types/index';
import { Mercenary } from '../../models/Mercenary';
import { DUNGEON_CONFIG } from '../../config/dungeon-config';

export const handleAddKnownMercenary = (state: GameState, merc: Mercenary): GameState => {
    if (state.knownMercenaries.some(m => m.id === merc.id)) return state;
    // Ensure new merc has energy and XP
    const mercWithData = { 
        ...merc, 
        expeditionEnergy: merc.expeditionEnergy ?? DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
        currentXp: merc.currentXp ?? 0,
        xpToNextLevel: merc.xpToNextLevel ?? (merc.level * 100),
        status: 'VISITOR' as const
    };
    return {
        ...state,
        knownMercenaries: [...state.knownMercenaries, mercWithData],
        logs: [`${merc.name} is now a regular at the tavern.`, ...state.logs]
    };
};

export const handleHireMercenary = (state: GameState, payload: { mercenaryId: string; cost: number }): GameState => {
    const { mercenaryId, cost } = payload;
    if (state.stats.gold < cost) return state;
    const updatedMercenaries = state.knownMercenaries.map(m => {
        if (m.id === mercenaryId) return { ...m, status: 'HIRED' as const };
        return m;
    });
    const hiredMerc = updatedMercenaries.find(m => m.id === mercenaryId);
    const name = hiredMerc ? hiredMerc.name : 'Mercenary';
    return {
        ...state,
        stats: { ...state.stats, gold: state.stats.gold - cost },
        knownMercenaries: updatedMercenaries,
        logs: [`Contract signed! ${name} has joined your service. -${cost} G`, ...state.logs]
    };
};

export const handleFireMercenary = (state: GameState, payload: { mercenaryId: string }): GameState => {
    const { mercenaryId } = payload;
    const updatedMercenaries = state.knownMercenaries.map(m => {
        if (m.id === mercenaryId) return { ...m, status: 'VISITOR' as const };
        return m;
    });
    const firedMerc = updatedMercenaries.find(m => m.id === mercenaryId);
    const name = firedMerc ? firedMerc.name : 'Mercenary';
    return {
        ...state,
        knownMercenaries: updatedMercenaries,
        logs: [`Contract terminated. ${name} is no longer in your service.`, ...state.logs]
    };
};
