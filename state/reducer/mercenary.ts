import { GameState } from '../../types/index';
import { Mercenary } from '../../models/Mercenary';
import { DUNGEON_CONFIG } from '../../config/dungeon-config';
import { PrimaryStats, mergePrimaryStats, calculateMaxHp, calculateMaxMp } from '../../models/Stats';
import { EquipmentRarity } from '../../models/Equipment';

export const handleAddKnownMercenary = (state: GameState, merc: Mercenary): GameState => {
    if (state.knownMercenaries.some(m => m.id === merc.id)) return state;
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

export const handleScoutMercenary = (state: GameState, payload: { mercenary: Mercenary; cost: number }): GameState => {
    const { mercenary, cost } = payload;
    if (state.stats.gold < cost) return state;

    const mercWithData = { 
        ...mercenary, 
        expeditionEnergy: mercenary.expeditionEnergy ?? DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
        currentXp: mercenary.currentXp ?? 0,
        xpToNextLevel: mercenary.xpToNextLevel ?? (mercenary.level * 100),
        status: 'VISITOR' as const
    };

    return {
        ...state,
        stats: {
            ...state.stats,
            gold: state.stats.gold - cost,
            dailyFinancials: {
                ...state.stats.dailyFinancials,
                expenseScout: state.stats.dailyFinancials.expenseScout + cost
            }
        },
        knownMercenaries: [...state.knownMercenaries, mercWithData],
        logs: [`Paid ${cost} G to find new talent. ${mercenary.name} arrived at the tavern.`, ...state.logs]
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
        stats: { 
            ...state.stats, 
            gold: state.stats.gold - cost,
            dailyFinancials: {
                ...state.stats.dailyFinancials,
                expenseScout: state.stats.dailyFinancials.expenseScout + cost
            }
        },
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

export const handleGiveGift = (state: GameState, payload: { mercenaryId: string; itemId: string }): GameState => {
    const { mercenaryId, itemId } = payload;
    const mercIndex = state.knownMercenaries.findIndex(m => m.id === mercenaryId);
    if (mercIndex === -1) return state;

    const inventoryItem = state.inventory.find(i => i.id === itemId);
    if (!inventoryItem || inventoryItem.quantity <= 0) return state;

    const mercenary = { ...state.knownMercenaries[mercIndex] };
    let affinityGain = 3; // Default for resources/consumables
    let staminaGain = 0;

    // Special handling for consumables
    if (itemId === 'stamina_potion') {
        staminaGain = 50;
        affinityGain = 5;
    } else if (itemId === 'affinity_debug_gift') {
        affinityGain = 50;
    } else if (inventoryItem.type === 'EQUIPMENT' && inventoryItem.equipmentData) {
        affinityGain = 5; // Base for gear
        // Rarity bonus
        switch (inventoryItem.equipmentData.rarity) {
            case EquipmentRarity.UNCOMMON: affinityGain += 2; break;
            case EquipmentRarity.RARE: affinityGain += 4; break;
            case EquipmentRarity.EPIC: affinityGain += 7; break;
            case EquipmentRarity.LEGENDARY: affinityGain += 12; break;
        }
    }

    mercenary.affinity = Math.min(100, (mercenary.affinity || 0) + affinityGain);
    if (staminaGain > 0) {
        mercenary.expeditionEnergy = Math.min(DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY, (mercenary.expeditionEnergy || 0) + staminaGain);
    }

    const newInventory = state.inventory.map(item => {
        if (item.id === itemId) {
            return { ...item, quantity: item.quantity - 1 };
        }
        return item;
    }).filter(i => i.quantity > 0);

    const newMercenaries = [...state.knownMercenaries];
    newMercenaries[mercIndex] = mercenary;

    let logMsg = `Gifted ${inventoryItem.name} to ${mercenary.name}. Affinity +${affinityGain}.`;
    if (staminaGain > 0) logMsg += ` Stamina +${staminaGain}.`;

    return {
        ...state,
        inventory: newInventory,
        knownMercenaries: newMercenaries,
        logs: [logMsg, ...state.logs]
    };
};

export const handleTalkMercenary = (state: GameState, payload: { mercenaryId: string }): GameState => {
    const { mercenaryId } = payload;
    if (state.talkedToToday.includes(mercenaryId)) return state;

    const mercIndex = state.knownMercenaries.findIndex(m => m.id === mercenaryId);
    if (mercIndex === -1) return state;

    const newMercenaries = [...state.knownMercenaries];
    const merc = { ...newMercenaries[mercIndex] };
    merc.affinity = Math.min(100, (merc.affinity || 0) + 1);
    newMercenaries[mercIndex] = merc;

    return {
        ...state,
        knownMercenaries: newMercenaries,
        talkedToToday: [...state.talkedToToday, mercenaryId],
        logs: [`Talked with ${merc.name}. Affinity +1.`, ...state.logs]
    };
};

export const handleAllocateStat = (state: GameState, payload: { mercenaryId: string; stat: keyof PrimaryStats }): GameState => {
    const { mercenaryId, stat } = payload;
    const mercIndex = state.knownMercenaries.findIndex(m => m.id === mercenaryId);
    if (mercIndex === -1) return state;

    const merc = state.knownMercenaries[mercIndex];
    const totalAllocated = merc.allocatedStats.str + merc.allocatedStats.vit + merc.allocatedStats.dex + merc.allocatedStats.int + merc.allocatedStats.luk;
    const totalPossible = (merc.level - 1) * 3;

    if (totalAllocated >= totalPossible) return state;

    const newAllocated = { ...merc.allocatedStats, [stat]: merc.allocatedStats[stat] + 1 };
    const merged = mergePrimaryStats(merc.stats, newAllocated);
    
    // Vitals update
    const newMaxHp = calculateMaxHp(merged, merc.level);
    const newMaxMp = calculateMaxMp(merged, merc.level);
    // Heal proportional to hp increase
    const hpGain = newMaxHp - merc.maxHp;
    const mpGain = newMaxMp - merc.maxMp;

    const updatedMerc: Mercenary = {
        ...merc,
        allocatedStats: newAllocated,
        maxHp: newMaxHp,
        currentHp: merc.currentHp + (hpGain > 0 ? hpGain : 0),
        maxMp: newMaxMp,
        currentMp: merc.currentMp + (mpGain > 0 ? mpGain : 0)
    };

    const newKnownMercenaries = [...state.knownMercenaries];
    newKnownMercenaries[mercIndex] = updatedMerc;

    return {
        ...state,
        knownMercenaries: newKnownMercenaries
    };
};

export const handleUpdateMercenaryStats = (state: GameState, payload: { mercenaryId: string; stats: PrimaryStats }): GameState => {
    const { mercenaryId, stats } = payload;
    const mercIndex = state.knownMercenaries.findIndex(m => m.id === mercenaryId);
    if (mercIndex === -1) return state;

    const merc = state.knownMercenaries[mercIndex];
    
    const merged = mergePrimaryStats(merc.stats, stats);
    const newMaxHp = calculateMaxHp(merged, merc.level);
    const newMaxMp = calculateMaxMp(merged, merc.level);

    // Maintain current health percentage if possible, or just add the flat difference
    const hpDiff = newMaxHp - merc.maxHp;
    const mpDiff = newMaxMp - merc.maxMp;

    const updatedMerc: Mercenary = {
        ...merc,
        allocatedStats: stats,
        maxHp: newMaxHp,
        maxMp: newMaxMp,
        currentHp: merc.currentHp + (hpDiff > 0 ? hpDiff : 0),
        currentMp: merc.currentMp + (mpDiff > 0 ? mpDiff : 0)
    };

    const newKnownMercenaries = [...state.knownMercenaries];
    newKnownMercenaries[mercIndex] = updatedMerc;

    return {
        ...state,
        knownMercenaries: newKnownMercenaries,
        logs: [`Updated attributes for ${merc.name}.`, ...state.logs]
    };
};