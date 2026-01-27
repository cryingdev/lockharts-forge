import { GameState, InventoryItem, DungeonResult } from '../../types/index';
import { DUNGEONS } from '../../data/dungeons';
import { Expedition } from '../../models/Dungeon';
import { materials } from '../../data/materials';
import { calculateMaxHp, calculateMaxMp, mergePrimaryStats } from '../../models/Stats';
import { SPECIAL_RECRUITS_REGISTRY } from '../../data/mercenaries';
import { MONSTER_DROPS } from '../../data/monster-drops';
import { MONSTERS } from '../../data/monsters';
import { MercenaryStatus } from '../../models/Mercenary';

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

export const handleAbortExpedition = (state: GameState, payload: { expeditionId: string }): GameState => {
    const { expeditionId } = payload;
    const expedition = state.activeExpeditions.find(e => e.id === expeditionId);
    if (!expedition) return state;

    const updatedMercs = state.knownMercenaries.map(m => {
        if (expedition.partyIds.includes(m.id)) {
            return { ...m, status: 'HIRED' as const, assignedExpeditionId: undefined };
        }
        return m;
    });

    return {
        ...state,
        knownMercenaries: updatedMercs,
        activeExpeditions: state.activeExpeditions.filter(e => e.id !== expeditionId),
        logs: [`Mission aborted. The squad has been recalled with no rewards.`, ...state.logs]
    };
};

export const handleClaimExpedition = (state: GameState, payload: { expeditionId: string; rescuedNpcId?: string }): GameState => {
    const { expeditionId, rescuedNpcId } = payload;
    const expedition = state.activeExpeditions.find(e => e.id === expeditionId);
    if (!expedition) return state;

    const dungeon = DUNGEONS.find(d => d.id === expedition.dungeonId);
    if (!dungeon) return state;

    const isManualAssault = expeditionId.startsWith('temp_manual_');

    const partyMembers = state.knownMercenaries.filter(m => expedition.partyIds.includes(m.id));
    const totalLuck = partyMembers.reduce((sum, m) => sum + (m.stats.luk + m.allocatedStats.luk), 0);
    const avgLuck = totalLuck / (partyMembers.length || 1);
    const luckMultiplier = 1 + (avgLuck * 0.02);

    const gainedItems: { id: string, count: number, name: string }[] = [];
    let newInventory = [...state.inventory];

    const processItemGain = (itemId: string, quantity: number) => {
        if (quantity <= 0) return;
        const materialDef = materials[itemId];
        if (materialDef) {
            const existingItem = newInventory.find(i => i.id === itemId);
            if (existingItem) {
                newInventory = newInventory.map(i => i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i);
            } else {
                newInventory.push({ ...materialDef, quantity } as InventoryItem);
            }
            const existingGained = gainedItems.find(g => g.id === itemId);
            if (existingGained) {
                existingGained.count += quantity;
            } else {
                gainedItems.push({ id: itemId, count: quantity, name: materialDef.name });
            }
        }
    };

    // 1. Roll for monster drops (Auto-expedition represents clearing many encounters)
    // Only roll for auto expeditions, as manual assault already collected drops during combat
    if (!isManualAssault) {
        const encounterCount = Math.floor(Math.random() * 5) + 5; // Simulate 5-10 encounters
        const allMobIds = Array.from(new Set(dungeon.monsterPools.flatMap(p => p.monsterIds)));
        
        for (let i = 0; i < encounterCount; i++) {
            const mobId = allMobIds[Math.floor(Math.random() * allMobIds.length)];
            const drops = MONSTER_DROPS[mobId];
            if (drops) {
                drops.forEach(drop => {
                    const adjustedChance = drop.chance * luckMultiplier;
                    if (Math.random() <= adjustedChance) {
                        const quantity = Math.floor(Math.random() * (drop.maxQuantity - drop.minQuantity + 1)) + drop.minQuantity;
                        processItemGain(drop.itemId, quantity);
                    }
                });
            }
        }
    }

    // 2. Gold Reward: Only for Auto-expedition completion
    const goldGained = isManualAssault ? 0 : (dungeon.goldReward || 0);

    const mercenaryResults: DungeonResult['mercenaryResults'] = [];
    let newKnownMercenaries = [...state.knownMercenaries];

    // Calculate dungeon's average monster level for penalty
    const allPoolMobIds = dungeon.monsterPools.flatMap(p => p.monsterIds);
    const avgDungeonMobLevel = allPoolMobIds.length > 0
        ? allPoolMobIds.reduce((sum, id) => sum + (MONSTERS[id]?.level || 1), 0) / allPoolMobIds.length
        : 1;

    // Process XP for party and handle health-based status changes
    newKnownMercenaries = newKnownMercenaries.map(merc => {
        if (expedition.partyIds.includes(merc.id)) {
            const baseXp = dungeon.baseXp || 50;
            
            // Apply level-based penalty
            const levelDiff = Math.max(0, merc.level - Math.floor(avgDungeonMobLevel));
            const penaltyMult = Math.max(0.1, 1 - (levelDiff * 0.1));
            const xpToAdd = Math.floor(baseXp * penaltyMult);

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
            
            let bonusStatPoints = merc.bonusStatPoints || 0;
            if (level > levelBefore) {
                const merged = mergePrimaryStats(merc.stats, merc.allocatedStats);
                maxHp = calculateMaxHp(merged, level);
                maxMp = calculateMaxMp(merged, level);
                currentHp = maxHp;
                bonusStatPoints += (level - levelBefore) * 3;
            }

            let nextStatus: MercenaryStatus = 'HIRED';
            let recoveryUntilDay: number | undefined = undefined;

            if (currentHp < 1) {
                nextStatus = 'INJURED' as const;
                recoveryUntilDay = state.stats.day + Math.floor(Math.random() * 2) + 1;
            }

            mercenaryResults.push({
                id: merc.id,
                name: merc.name,
                job: merc.job,
                levelBefore,
                levelAfter: level,
                xpGained: xpToAdd,
                currentXp: currentXp,
                xpToNext: xpToNext,
                statusChange: currentHp < 1 ? 'INJURED' : 'NONE'
            });

            return {
                ...merc,
                level,
                currentXp,
                xpToNextLevel: xpToNext,
                bonusStatPoints,
                maxHp,
                maxMp,
                currentHp,
                status: nextStatus,
                recoveryUntilDay,
                assignedExpeditionId: undefined
            };
        }
        return merc;
    });

    // Handle Rescued NPC
    let rescuedMercenary = undefined;
    if (rescuedNpcId) {
        const specialMerc = SPECIAL_RECRUITS_REGISTRY[rescuedNpcId];
        if (specialMerc) {
            rescuedMercenary = { ...specialMerc };
            if (!newKnownMercenaries.some(m => m.id === rescuedMercenary!.id)) {
                newKnownMercenaries.push(rescuedMercenary);
            }
        }
    }

    const newClearCounts = { ...state.dungeonClearCounts };
    newClearCounts[dungeon.id] = (newClearCounts[dungeon.id] || 0) + 1;
    const remainingExpeditions = state.activeExpeditions.filter(e => e.id !== expeditionId);

    const resultData: DungeonResult = {
        dungeonName: dungeon.name,
        rewards: gainedItems,
        goldGained,
        mercenaryResults,
        rescuedMercenary
    };

    const luckMsg = luckMultiplier > 1.1 ? ` (Luck Bonus x${luckMultiplier.toFixed(1)})` : '';
    let logStr = gainedItems.length > 0 
        ? `Returned from ${dungeon.name}${luckMsg}. Gained: ${gainedItems.map(i => `${i.name} x${i.count}`).join(', ')}`
        : `Returned from ${dungeon.name}. No loot found.`;
    
    if (goldGained > 0) logStr += ` and ${goldGained} Gold.`;

    return {
        ...state,
        inventory: newInventory,
        knownMercenaries: newKnownMercenaries,
        activeExpeditions: remainingExpeditions,
        dungeonClearCounts: newClearCounts,
        dungeonResult: resultData,
        stats: {
            ...state.stats,
            gold: state.stats.gold + goldGained,
            dailyFinancials: {
                ...state.stats.dailyFinancials,
                incomeDungeon: state.stats.dailyFinancials.incomeDungeon + goldGained
            }
        },
        logs: [logStr, ...state.logs]
    };
};

export const handleDismissDungeonResult = (state: GameState): GameState => {
    return {
        ...state,
        dungeonResult: null
    };
};