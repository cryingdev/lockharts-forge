
import { GameState } from '../../types/index';
import { calculateDailyWage } from '../../config/contract-config';
import { DUNGEON_CONFIG } from '../../config/dungeon-config';

export const handleSleep = (state: GameState): GameState => {
    return { ...state, showSleepModal: true };
};

export const handleConfirmSleep = (state: GameState): GameState => {
    // Calculate wages for HIRED, ON_EXPEDITION, INJURED mercenaries
    const hiredMercs = state.knownMercenaries.filter(m => 
        ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(m.status)
    );
    let totalWages = 0;
    hiredMercs.forEach(merc => {
        totalWages += calculateDailyWage(merc.level, merc.job);
    });

    const nextDay = state.stats.day + 1;
    const newGold = state.stats.gold - totalWages;

    // --- Mercenary Energy Recovery ---
    // Mercenaries currently on expedition do NOT recover energy
    const activeMercIds = new Set<string>();
    state.activeExpeditions.forEach(exp => {
        if (exp.status === 'ACTIVE') {
                exp.partyIds.forEach(id => activeMercIds.add(id));
        }
    });

    const updatedMercenaries = state.knownMercenaries.map(merc => {
        if (['HIRED', 'INJURED'].includes(merc.status)) { // Only recover if not on expedition
            return {
                ...merc,
                expeditionEnergy: Math.min(DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY, (merc.expeditionEnergy || 0) + DUNGEON_CONFIG.DAILY_ENERGY_RECOVERY)
            };
        }
        return merc;
    });

    let logMsg = `Day ${nextDay} begins. You feel refreshed.`;
    if (totalWages > 0) logMsg = `Day ${nextDay} begins. Paid ${totalWages} G in wages. Balance: ${newGold} G.`;
    if (newGold < 0) logMsg = `Day ${nextDay} begins. You are in debt! (${newGold} G).`;

    return {
        ...state,
        stats: {
            ...state.stats,
            day: nextDay,
            gold: newGold,
            energy: state.stats.maxEnergy,
            incomeToday: 0,
        },
        knownMercenaries: updatedMercenaries,
        forge: { ...state.forge, isShopOpen: false },
        visitorsToday: [],
        activeCustomer: null,
        shopQueue: [],
        isCrafting: false,
        showSleepModal: false,
        logs: [logMsg, ...state.logs],
        forgeTemperature: 0,
        lastForgeTime: Date.now(),
    };
};
