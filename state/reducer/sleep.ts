import { GameState } from '../../types/index';
import { calculateDailyWage } from '../../config/contract-config';
import { DUNGEON_CONFIG } from '../../config/dungeon-config';
import { MARKET_CATALOG } from '../../data/market/index';
import { NAMED_CONTRACT_REGISTRY } from '../../data/contracts/namedContracts';
import { handleRefreshCommissions, isNamedMercenaryEligible } from './commission';
import { SHOP_CONFIG } from '../../config/shop-config';
import { rng } from '../../utils/random';

const clampChance = (value: number) => Math.max(0, Math.min(1, value));

const getAffinityWeightedTavernDepartureChance = (affinity: number) => {
    const affinityRatio = Math.max(0, Math.min(100, affinity || 0)) / 100;
    return clampChance(
        SHOP_CONFIG.TAVERN_DEPARTURE_CHANCE -
        SHOP_CONFIG.TAVERN_AFFINITY_DEPARTURE_REDUCTION_MAX * affinityRatio
    );
};

const getAffinityWeightedTavernReturnChance = (affinity: number) => {
    const affinityRatio = Math.max(0, Math.min(100, affinity || 0)) / 100;
    return clampChance(
        SHOP_CONFIG.TAVERN_RETURN_CHANCE +
        SHOP_CONFIG.TAVERN_AFFINITY_RETURN_BONUS_MAX * affinityRatio
    );
};

export const handleSleep = (state: GameState): GameState => {
    if (state.activeManualDungeon) {
        return { ...state, logs: ["You cannot sleep while exploring a dungeon!", ...state.logs] };
    }
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

    // --- Mercenary Recovery & Energy Recovery & Tavern Departure/Return ---
    let recoveryLogs: string[] = [];
    let departedCount = 0;
    let returnedCount = 0;

    const updatedMercenaries = state.knownMercenaries.map(merc => {
        let status = merc.status;
        let recoveryUntilDay = merc.recoveryUntilDay;
        let injurySeverity = merc.injurySeverity;
        let injuryPenaltyPercent = merc.injuryPenaltyPercent;

        // Tavern Departure Logic: Unhired visitors have a chance to leave
        if (status === 'VISITOR') {
            const leaves = rng.chance(getAffinityWeightedTavernDepartureChance(merc.affinity || 0));
            if (leaves) {
                departedCount++;
                status = 'DEPARTED';
            }
        } else if (status === 'DEPARTED') {
            // Tavern Return Logic: Departed visitors have a chance to return
            const returns = rng.chance(getAffinityWeightedTavernReturnChance(merc.affinity || 0));
            if (returns) {
                returnedCount++;
                status = 'VISITOR';
            }
        }
        
        // Base Vitals Recovery: All mercenaries not on expedition recover 50% of Max HP/MP
        let nextHp = merc.currentHp;
        let nextMp = merc.currentMp;
        
        if (['HIRED', 'INJURED', 'VISITOR', 'DEPARTED'].includes(status)) {
            nextHp = Math.min(merc.maxHp, nextHp + Math.floor(merc.maxHp * 0.5));
            nextMp = Math.min(merc.maxMp, nextMp + Math.floor(merc.maxMp * 0.5));
        }

        // Progress recovery for injured mercenaries
        if (status === 'INJURED' && recoveryUntilDay && nextDay >= recoveryUntilDay) {
            if (nextHp > 0) {
                status = 'HIRED';
                recoveryUntilDay = undefined;
                injurySeverity = undefined;
                injuryPenaltyPercent = undefined;
                recoveryLogs.push(`${merc.name} has fully recovered from their injuries.`);
            } else {
                status = 'HIRED';
                recoveryUntilDay = undefined;
                injurySeverity = undefined;
                injuryPenaltyPercent = undefined;
            }
        } else if (status !== 'INJURED') {
            injurySeverity = undefined;
            injuryPenaltyPercent = undefined;
        }

        // Recover energy for mercenaries not on expedition
        if (['HIRED', 'INJURED', 'VISITOR', 'DEPARTED'].includes(status)) {
            return {
                ...merc,
                status,
                currentHp: nextHp,
                currentMp: nextMp,
                recoveryUntilDay,
                injurySeverity,
                injuryPenaltyPercent,
                expeditionEnergy: Math.min(DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY, (merc.expeditionEnergy || 0) + DUNGEON_CONFIG.DAILY_ENERGY_RECOVERY)
            };
        }
        
        return { ...merc, status, currentHp: nextHp, currentMp: nextMp, recoveryUntilDay, injurySeverity, injuryPenaltyPercent };
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
    if (departedCount > 0) recoveryLogs.push(`${departedCount} traveler(s) have left the Tavern.`);
    if (returnedCount > 0) recoveryLogs.push(`${returnedCount} traveler(s) have returned to the Tavern.`);

    // --- Commission System Updates ---
    const decrementedContracts = state.commission.activeContracts
        .map(c => ({ ...c, daysRemaining: (c.daysRemaining || 0) - 1 }));
    const expiredAcceptedContracts = decrementedContracts
        .filter(c => c.status === 'ACTIVE' && (c.daysRemaining || 0) <= 0)
        .map(c => ({ ...c, status: 'FAILED' as const }));
    const updatedActiveContracts = decrementedContracts
        .filter(c => (c.daysRemaining || 0) > 0);
    
    const expiredCount = expiredAcceptedContracts.length;
    if (expiredCount > 0) {
        recoveryLogs.push(`${expiredCount} accepted commission(s) expired before completion.`);
    }

    const updatedNamedEncounters = { ...state.commission.namedEncounters };
    Object.keys(updatedNamedEncounters).forEach(id => {
        const encounter = updatedNamedEncounters[id];
        const registry = NAMED_CONTRACT_REGISTRY.find(r => r.mercenaryId === id);
        
        if (registry && isNamedMercenaryEligible(state, registry)) {
            // Increment daysEligible if eligible but not appeared yet
            updatedNamedEncounters[id] = {
                ...encounter,
                daysEligible: (encounter.daysEligible || 0) + 1
            };
        }
    });

    const nextState: GameState = {
        ...state,
        stats: {
            ...state.stats,
            day: nextDay,
            gold: newGold,
            energy: state.stats.maxEnergy,
            inviteCount: 0,
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
        commission: {
            ...state.commission,
            activeContracts: updatedActiveContracts,
            expiredContracts: [...expiredAcceptedContracts, ...state.commission.expiredContracts],
            namedEncounters: updatedNamedEncounters
        },
        knownMercenaries: updatedMercenaries,
        marketStock: newMarketStock,
        unlockedTabs: newUnlockedTabs,
        forge: { ...state.forge, isShopOpen: false },
        visitorsToday: [],
        talkedToToday: [],
        boughtDrinkToday: [],
        tavern: {
            ...state.tavern,
            inviteCountToday: 0,
        },
        talkedToGarrickToday: false,
        activeCustomer: null,
        shopQueue: [],
        isCrafting: false,
        logs: [logMsg, ...recoveryLogs, ...state.logs],
        forgeTemperature: 0,
        lastForgeTime: Date.now(),
    };

    return handleRefreshCommissions(nextState);
};
