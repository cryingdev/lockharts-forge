
import { GameState, InventoryItem, DungeonResult } from '../../types/index';
import { DUNGEONS } from '../../data/dungeons';
import { Expedition } from '../../models/Dungeon';
import { MATERIALS } from '../../data/materials';
import { calculateMaxHp, calculateMaxMp, mergePrimaryStats } from '../../models/Stats';

export const handleStartExpedition = (state: GameState, payload: { dungeonId: string; partyIds: string[] }): GameState => {
    const { dungeonId, partyIds } = payload;
    const dungeon = DUNGEONS.find(d => d.id === dungeonId);
    if (!dungeon) return state;

    const newExpeditionId = `exp_${Date.now()}`;

    const updatedMercenaries = state.knownMercenaries.map(merc => {
        if (partyIds.includes(merc.id)) {
            return {
                ...merc,
                expeditionEnergy: Math.max(0, (merc.expeditionEnergy || 0) - dungeon.energyCost),
                status: 'ON_EXPEDITION' as const,
                assignedExpeditionId: newExpeditionId
            };
        }
        return merc;
    });

    const newExpedition: Expedition = {
        id: newExpeditionId,
        dungeonId: dungeon.id,
        partyIds: partyIds,
        startTime: Date.now(),
        endTime: Date.now() + (dungeon.durationMinutes * 60 * 1000),
        status: 'ACTIVE'
    };

    return {
        ...state,
        knownMercenaries: updatedMercenaries,
        activeExpeditions: [...state.activeExpeditions, newExpedition],
        logs: [`Expedition sent to ${dungeon.name}.`, ...state.logs]
    };
};

export const handleCompleteExpedition = (state: GameState, payload: { expeditionId: string }): GameState => {
    const { expeditionId } = payload;
    const expedition = state.activeExpeditions.find(e => e.id === expeditionId);
    
    if (!expedition || expedition.status !== 'ACTIVE') return state;

    const dungeon = DUNGEONS.find(d => d.id === expedition.dungeonId);
    const dungeonName = dungeon ? dungeon.name : 'Unknown';

    const updatedExpeditions = state.activeExpeditions.map(exp => {
        if (exp.id === expeditionId) {
            return { ...exp, status: 'COMPLETED' as const };
        }
        return exp;
    });

    return {
        ...state,
        activeExpeditions: updatedExpeditions,
        logs: [`Expedition to ${dungeonName} is ready for return.`, ...state.logs]
    };
};

export const handleClaimExpedition = (state: GameState, payload: { expeditionId: string }): GameState => {
    const { expeditionId } = payload;
    const expedition = state.activeExpeditions.find(e => e.id === expeditionId);
    if (!expedition) return state;

    const dungeon = DUNGEONS.find(d => d.id === expedition.dungeonId);
    if (!dungeon) return state;

    const partyMembers = state.knownMercenaries.filter(m => expedition.partyIds.includes(m.id));
    const totalLuck = partyMembers.reduce((sum, m) => sum + (m.stats.luk + m.allocatedStats.luk), 0);
    const avgLuck = totalLuck / (partyMembers.length || 1);
    const luckMultiplier = 1 + (avgLuck * 0.02);

    const gainedItems: { id: string, count: number, name: string }[] = [];
    let newInventory = [...state.inventory];

    dungeon.rewards.forEach(reward => {
            const adjustedChance = reward.chance * luckMultiplier;
            if (Math.random() <= adjustedChance) {
                const quantity = Math.floor(Math.random() * (reward.maxQuantity - reward.minQuantity + 1)) + reward.minQuantity;
                if (quantity > 0) {
                    const materialDef = Object.values(MATERIALS).find(m => m.id === reward.itemId);
                    if (materialDef) {
                        const existingItem = newInventory.find(i => i.id === reward.itemId);
                        if (existingItem) {
                            newInventory = newInventory.map(i => i.id === reward.itemId ? { ...i, quantity: i.quantity + quantity } : i);
                        } else {
                            newInventory.push({ ...materialDef, quantity } as InventoryItem);
                        }
                        gainedItems.push({ id: reward.itemId, count: quantity, name: materialDef.name });
                    }
                }
            }
    });

    const mercenaryResults: DungeonResult['mercenaryResults'] = [];
    let newKnownMercenaries = [...state.knownMercenaries];

    newKnownMercenaries = newKnownMercenaries.map(merc => {
        if (expedition.partyIds.includes(merc.id)) {
            let xpToAdd = dungeon.baseXp || 50;
            let currentXp = merc.currentXp || 0;
            let xpToNext = merc.xpToNextLevel || (merc.level * 100);
            let level = merc.level;
            const levelBefore = level;

            currentXp += xpToAdd;

            while (currentXp >= xpToNext) {
                currentXp -= xpToNext;
                level++;
                xpToNext = level * 100;
            }

            let maxHp = merc.maxHp;
            let maxMp = merc.maxMp;
            let currentHp = merc.currentHp;
            
            if (level > levelBefore) {
                const merged = mergePrimaryStats(merc.stats, merc.allocatedStats);
                maxHp = calculateMaxHp(merged, level);
                maxMp = calculateMaxMp(merged, level);
                currentHp = maxHp;
            }

            mercenaryResults.push({
                id: merc.id,
                name: merc.name,
                job: merc.job,
                levelBefore,
                levelAfter: level,
                xpGained: xpToAdd,
                currentXp: currentXp,
                xpToNext: xpToNext
            });

            return {
                ...merc,
                level,
                currentXp,
                xpToNextLevel: xpToNext,
                maxHp,
                maxMp,
                currentHp,
                status: 'HIRED' as const,
                assignedExpeditionId: undefined
            };
        }
        return merc;
    });

    const newClearCounts = { ...state.dungeonClearCounts };
    newClearCounts[dungeon.id] = (newClearCounts[dungeon.id] || 0) + 1;
    const remainingExpeditions = state.activeExpeditions.filter(e => e.id !== expeditionId);

    const resultData: DungeonResult = {
        dungeonName: dungeon.name,
        rewards: gainedItems,
        mercenaryResults
    };

    const luckMsg = luckMultiplier > 1.1 ? ` (Luck Bonus x${luckMultiplier.toFixed(1)})` : '';
    const logStr = gainedItems.length > 0 
        ? `Returned from ${dungeon.name}${luckMsg}. Gained: ${gainedItems.map(i => `${i.name} x${i.count}`).join(', ')}`
        : `Returned from ${dungeon.name}. No loot found.`;

    return {
        ...state,
        inventory: newInventory,
        knownMercenaries: newKnownMercenaries,
        activeExpeditions: remainingExpeditions,
        dungeonClearCounts: newClearCounts,
        dungeonResult: resultData,
        logs: [logStr, ...state.logs]
    };
};

export const handleDismissDungeonResult = (state: GameState): GameState => {
    return { ...state, dungeonResult: null };
};
