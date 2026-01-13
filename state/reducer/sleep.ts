import { GameState } from '../../types/index';
import { calculateDailyWage } from '../../config/contract-config';
import { DUNGEON_CONFIG } from '../../config/dungeon-config';
import { MARKET_CATALOG } from '../../data/market/index';

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

    // --- Mercenary Recovery & Energy Recovery ---
    let recoveryLogs: string[] = [];
    const updatedMercenaries = state.knownMercenaries.map(merc => {
        let status = merc.status;
        let recoveryUntilDay = merc.recoveryUntilDay;
        
        // Base Vitals Recovery: All mercenaries not on expedition recover 50% of Max HP/MP
        let nextHp = merc.currentHp;
        let nextMp = merc.currentMp;
        
        if (['HIRED', 'INJURED', 'VISITOR'].includes(status)) {
            nextHp = Math.min(merc.maxHp, nextHp + Math.floor(merc.maxHp * 0.5));
            nextMp = Math.min(merc.maxMp, nextMp + Math.floor(merc.maxMp * 0.5));
        }

        // Progress recovery for injured mercenaries
        // They return to HIRED status only if the recovery day has passed AND they have health
        if (status === 'INJURED' && recoveryUntilDay && nextDay >= recoveryUntilDay) {
            if (nextHp > 0) {
                status = 'HIRED';
                recoveryUntilDay = undefined;
                recoveryLogs.push(`${merc.name} has fully recovered from their injuries.`);
            } else {
                // If they still have 0 HP for some reason, they stay injured but recovery time is cleared
                // or we extend it. For now, we assume 50% recovery ensures > 0 HP.
                status = 'HIRED';
                recoveryUntilDay = undefined;
            }
        }

        // Recover energy for mercenaries not on expedition
        if (['HIRED', 'INJURED', 'VISITOR'].includes(status)) {
            return {
                ...merc,
                status,
                currentHp: nextHp,
                currentMp: nextMp,
                recoveryUntilDay,
                expeditionEnergy: Math.min(DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY, (merc.expeditionEnergy || 0) + DUNGEON_CONFIG.DAILY_ENERGY_RECOVERY)
            };
        }
        
        return { ...merc, status, currentHp: nextHp, currentMp: nextMp, recoveryUntilDay };
    });

    // --- Market Restock Logic ---
    const newMarketStock = { ...state.marketStock };
    MARKET_CATALOG.forEach(item => {
        const isOneTime = item.id === 'furnace' || item.id === 'workbench' || item.id.startsWith('scroll_');
        
        if (isOneTime) {
            const isOwnedOrUnlocked = 
                (item.id === 'furnace' && state.forge.hasFurnace) || 
                (item.id === 'workbench' && state.forge.hasWorkbench) ||
                (item.id === 'scroll_t2' && state.stats.tierLevel >= 2) ||
                (item.id === 'scroll_t3' && state.stats.tierLevel >= 3);
            
            if (isOwnedOrUnlocked) {
                newMarketStock[item.id] = 0;
            } else {
                newMarketStock[item.id] = item.maxStock;
            }
        } else {
            newMarketStock[item.id] = item.maxStock;
        }
    });

    let newUnlockedTabs = [...state.unlockedTabs];
    let logMsg = `Day ${nextDay} begins. Market supplies restocked. (Auto-saved)`;
    
    if (nextDay === 2 && !newUnlockedTabs.includes('TAVERN')) {
        newUnlockedTabs.push('TAVERN');
        logMsg = `Day 2 begins. Travelers are gathering at the Tavern. Facility Unlocked! (Auto-saved)`;
    }

    if (totalWages > 0) logMsg = `Day ${nextDay} begins. Paid ${totalWages} G in wages. (Auto-saved)`;
    if (newGold < 0) logMsg = `Day ${nextDay} begins. You are in debt! (${newGold} G). (Auto-saved)`;

    return {
        ...state,
        stats: {
            ...state.stats,
            day: nextDay,
            gold: newGold,
            energy: state.stats.maxEnergy,
            dailyFinancials: {
                incomeShop: 0,
                incomeInventory: 0,
                incomeDungeon: 0,
                incomeRepair: 0,
                expenseMarket: 0,
                expenseWages: totalWages,
                expenseScout: 0
            },
        },
        knownMercenaries: updatedMercenaries,
        marketStock: newMarketStock,
        unlockedTabs: newUnlockedTabs,
        forge: { ...state.forge, isShopOpen: false },
        visitorsToday: [],
        talkedToToday: [],
        talkedToGarrickToday: false,
        activeCustomer: null,
        shopQueue: [],
        isCrafting: false,
        logs: [logMsg, ...recoveryLogs, ...state.logs],
        forgeTemperature: 0,
        lastForgeTime: Date.now(),
    };
};