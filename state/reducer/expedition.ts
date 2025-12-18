
import { GameState, InventoryItem, DungeonResult } from '../../types/index';
import { DUNGEONS } from '../../data/dungeons';
import { Expedition } from '../../models/Dungeon';
import { MATERIALS } from '../../data/materials';
import { calculateMaxHp, calculateMaxMp } from '../../models/Stats';

export const handleStartExpedition = (state: GameState, payload: { dungeonId: string; partyIds: string[] }): GameState => {
    const { dungeonId, partyIds } = payload;
    const dungeon = DUNGEONS.find(d => d.id === dungeonId);
    if (!dungeon) return state;

    // Generate Expedition ID first
    const newExpeditionId = `exp_${Date.now()}`;

    // Deduct Energy from Mercenaries and Update Status + assignedExpeditionId
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

    // Create Expedition Entry
    const newExpedition: Expedition = {
        id: newExpeditionId,
        dungeonId: dungeon.id,
        partyIds: partyIds,
        startTime: Date.now(),
        endTime: Date.now() + (dungeon.durationMinutes * 60 * 1000), // * 60 for minutes
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
    
    // Safety check: only complete if currently active
    if (!expedition || expedition.status !== 'ACTIVE') return state;

    const dungeon = DUNGEONS.find(d => d.id === expedition.dungeonId);
    const dungeonName = dungeon ? dungeon.name : 'Unknown';

    // Update status to COMPLETED
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

    // --- NEW: Calculate Party Luck Bonus ---
    const partyMembers = state.knownMercenaries.filter(m => expedition.partyIds.includes(m.id));
    const totalLuck = partyMembers.reduce((sum, m) => sum + m.stats.luck, 0);
    const avgLuck = totalLuck / (partyMembers.length || 1);
    
    // Luck Multiplier: Base 1.0 + (AvgLuck * 0.02)
    // Example: Avg Luck 10 => 1.2x chance (+20%)
    // Example: Avg Luck 50 => 2.0x chance (+100%)
    const luckMultiplier = 1 + (avgLuck * 0.02);

    // 1. Generate Rewards (Items) with Luck Bonus
    const gainedItems: { id: string, count: number, name: string }[] = [];
    let newInventory = [...state.inventory];

    dungeon.rewards.forEach(reward => {
            // Apply luck multiplier to the base chance
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

    // 2. XP & Level Up & Return Status to HIRED
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

            // Level Up Logic
            while (currentXp >= xpToNext) {
                currentXp -= xpToNext;
                level++;
                xpToNext = level * 100; // Curve: Level * 100
            }

            // Recalculate Stats if Leveled Up
            let stats = { ...merc.stats };
            let maxHp = merc.maxHp;
            let maxMp = merc.maxMp;
            let currentHp = merc.currentHp;
            
            if (level > levelBefore) {
                maxHp = calculateMaxHp(stats, level);
                maxMp = calculateMaxMp(stats, level);
                currentHp = maxHp; // Full heal on level up?
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
                status: 'HIRED' as const, // Reset status from ON_EXPEDITION to HIRED
                assignedExpeditionId: undefined // Clear the assignment
            };
        }
        return merc;
    });

    // 3. Update Clear Count & Remove Expedition
    const newClearCounts = { ...state.dungeonClearCounts };
    newClearCounts[dungeon.id] = (newClearCounts[dungeon.id] || 0) + 1;
    const remainingExpeditions = state.activeExpeditions.filter(e => e.id !== expeditionId);

    // 4. Build Result Object for Modal
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
        dungeonResult: resultData, // Triggers Modal
        logs: [logStr, ...state.logs]
    };
};

export const handleDismissDungeonResult = (state: GameState): GameState => {
    return { ...state, dungeonResult: null };
};
