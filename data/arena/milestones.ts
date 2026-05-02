import { materials } from '../materials';
import { EQUIPMENT_ITEMS } from '../equipment';
import type { Language } from '../../types';
import { getLocalizedItemName } from '../../utils/itemText';
import { t } from '../../utils/i18n';

export interface ArenaMilestoneRewardBundle {
    gold?: number;
    items?: { id: string; count: number }[];
    equipment?: {
        recipeId: string;
        quality: number;
        enhancement?: number;
        count?: number;
    }[];
}

export interface ArenaMilestoneDefinition {
    threshold: number;
    rewardLabelKey: string;
    rewards: ArenaMilestoneRewardBundle;
}

export const ARENA_MILESTONE_DEFINITIONS: ArenaMilestoneDefinition[] = [
    {
        threshold: 100,
        rewardLabelKey: 'arena.reward_bronze_purse',
        rewards: { gold: 250 },
    },
    {
        threshold: 250,
        rewardLabelKey: 'arena.reward_copper_stockpile',
        rewards: { items: [{ id: 'copper_ore', count: 6 }] },
    },
    {
        threshold: 500,
        rewardLabelKey: 'arena.reward_fine_supply_crate',
        rewards: {
            items: [
                { id: 'charcoal', count: 12 },
                { id: 'leather_strips', count: 4 },
                { id: 'wool_cloth', count: 4 },
                { id: 'book_bash', count: 1 },
            ],
        },
    },
    {
        threshold: 800,
        rewardLabelKey: 'arena.reward_rare_material_cache',
        rewards: {
            items: [
                { id: 'iron_ore', count: 5 },
                { id: 'hard_leather', count: 3 },
                { id: 'silver_ore', count: 2 },
                { id: 'scroll_skill_holy_light', count: 1 },
            ],
        },
    },
    {
        threshold: 1200,
        rewardLabelKey: 'arena.reward_champion_sigil',
        rewards: {
            items: [{ id: 'ashen_sigil', count: 1 }],
            equipment: [{ recipeId: 'ring_silver_t2', quality: 96, enhancement: 1 }],
        },
    },
    {
        threshold: 1600,
        rewardLabelKey: 'arena.reward_elite_supply_crate',
        rewards: {
            gold: 900,
            items: [
                { id: 'ironwood_log', count: 2 },
                { id: 'fire_essence', count: 2 },
                { id: 'book_fireball', count: 1 },
            ],
        },
    },
    {
        threshold: 2200,
        rewardLabelKey: 'arena.reward_masterwork_ember_cache',
        rewards: {
            gold: 1800,
            items: [
                { id: 'mithril_ore', count: 3 },
                { id: 'sigil_thread', count: 2 },
                { id: 'fire_essence', count: 2 },
                { id: 'book_holy_light', count: 1 },
            ],
            equipment: [{ recipeId: 'ring_sunstone_band_t3_sp', quality: 108, enhancement: 2 }],
        },
    },
];

export const getArenaMilestoneRewardLabel = (
    language: Language,
    milestone: Pick<ArenaMilestoneDefinition, 'rewardLabelKey'>
): string => t(language, milestone.rewardLabelKey);

export const formatArenaMilestoneRewardContents = (
    language: Language,
    rewards: ArenaMilestoneRewardBundle
): string => {
    const segments: string[] = [];

    if (rewards.gold && rewards.gold > 0) {
        segments.push(`${rewards.gold}G`);
    }

    rewards.items?.forEach(({ id, count }) => {
        const item = materials[id];
        if (!item) return;
        segments.push(`${getLocalizedItemName(language, item)} x${count}`);
    });

    rewards.equipment?.forEach(({ recipeId, count = 1 }) => {
        const equipment = EQUIPMENT_ITEMS.find((item) => item.id === recipeId);
        if (!equipment) return;
        segments.push(`${equipment.name} x${count}`);
    });

    return segments.join(', ');
};
