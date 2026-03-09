
import { MONSTER_DROPS, MonsterDropEntry } from '../data/monster-drops';
import { rng } from './random';

export interface LootResult {
    itemId: string;
    quantity: number;
}

/**
 * calculateDrops
 * Calculates loot for a given monster based on its drop table.
 * Uses standardized RNG for reproducibility.
 */
export const calculateDrops = (monsterId: string): LootResult[] => {
    const dropTable = MONSTER_DROPS[monsterId];
    if (!dropTable) return [];

    const results: LootResult[] = [];

    for (const entry of dropTable) {
        if (rng.chance(entry.chance)) {
            const quantity = Math.floor(rng.standard(entry.minQuantity, entry.maxQuantity, 0));
            if (quantity > 0) {
                results.push({
                    itemId: entry.itemId,
                    quantity
                });
            }
        }
    }

    return results;
};

/**
 * calculateExpeditionLoot
 * Calculates total loot for multiple monster kills.
 */
export const calculateExpeditionLoot = (monsterCounts: Record<string, number>): LootResult[] => {
    const totalLoot: Record<string, number> = {};

    for (const [monsterId, count] of Object.entries(monsterCounts)) {
        for (let i = 0; i < count; i++) {
            const drops = calculateDrops(monsterId);
            for (const drop of drops) {
                totalLoot[drop.itemId] = (totalLoot[drop.itemId] || 0) + drop.quantity;
            }
        }
    }

    return Object.entries(totalLoot).map(([itemId, quantity]) => ({
        itemId,
        quantity
    }));
};
