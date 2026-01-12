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

    // --- Mercenary Energy Recovery ---
    const updatedMercenaries = state.knownMercenaries.map(merc => {
        if (['HIRED', 'INJURED', 'VISITOR'].includes(merc.status)) { // Only recover if not on expedition
            return {
                ...merc,
                expeditionEnergy: Math.min(DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY, (merc.expeditionEnergy || 0) + DUNGEON_CONFIG.DAILY_ENERGY_RECOVERY)
            };
        }
        return merc;
    });

    // --- Market Restock Logic ---
    const newMarketStock = { ...state.marketStock };
    MARKET_CATALOG.forEach(item => {
        const isOneTime = item.id === 'furnace' || item.id === 'workbench' || item.id.startsWith('scroll_');
        
        if (isOneTime) {
            // 일회성 아이템은 이미 소유했거나 해당 티어보다 높은 경우 리스톡하지 않음 (0 유지)
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
            // 일반 자원 및 소모품은 매일 다시 채움
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
                expenseWages: totalWages, // Track wages spent at end of current day (processed during rest transition)
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
        // showSleepModal: false, // UI 연출을 위해 true 유지
        logs: [logMsg, ...state.logs],
        forgeTemperature: 0,
        lastForgeTime: Date.now(),
    };
};