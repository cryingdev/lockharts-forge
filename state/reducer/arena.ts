import { materials } from '../../data/materials';
import { ARENA_MILESTONE_DEFINITIONS, formatArenaMilestoneRewardContents } from '../../data/arena/milestones';
import { EQUIPMENT_ITEMS } from '../../data/equipment';
import { GameState, InventoryItem } from '../../types';
import { t } from '../../utils/i18n';
import { generateEquipment } from '../../utils/craftingLogic';
import { getPlayerName } from '../../utils/gameText';
import { getLocalizedItemName } from '../../utils/itemText';

const EQUIPMENT_RECIPE_MAP = new Map(EQUIPMENT_ITEMS.map((item) => [item.id, item]));

export const handleArenaSetSelectedParty = (
    state: GameState,
    payload: { partyIds: string[] }
): GameState => ({
    ...state,
    arena: {
        ...state.arena,
        selectedPartyIds: payload.partyIds.slice(0, 4),
    },
});

export const handleArenaApplyBattleResult = (
    state: GameState,
    payload: { pointsDelta: number }
): GameState => {
    const nextRating = Math.max(0, state.arena.rating + payload.pointsDelta);

    return {
        ...state,
        arena: {
            ...state.arena,
            rating: nextRating,
            peakRating: Math.max(state.arena.peakRating, nextRating),
        },
    };
};

export const handleArenaClaimMilestone = (
    state: GameState,
    payload: { threshold: number }
): GameState => {
    const language = state.settings.language;
    const milestone = ARENA_MILESTONE_DEFINITIONS.find((entry) => entry.threshold === payload.threshold);

    if (!milestone) {
        return state;
    }

    if (state.arena.rating < payload.threshold) {
        return state;
    }

    if (state.arena.claimedMilestoneThresholds.includes(payload.threshold)) {
        return state;
    }

    const nextInventory = [...state.inventory];
    const previewLines: NonNullable<GameState['arenaRewardPreview']>['lines'] = [];

    if (milestone.rewards.gold && milestone.rewards.gold > 0) {
        previewLines.push({
            type: 'GOLD',
            label: t(language, 'arena.reward_gold'),
            quantityText: `+${milestone.rewards.gold}G`,
            icon: 'coins',
        });
    }

    milestone.rewards.items?.forEach(({ id, count }) => {
        if (count <= 0) return;

        const itemDef = materials[id];
        if (!itemDef) return;

        const existingIndex = nextInventory.findIndex((item) => item.id === id);
        if (existingIndex >= 0) {
            nextInventory[existingIndex] = {
                ...nextInventory[existingIndex],
                quantity: nextInventory[existingIndex].quantity + count,
            };
        } else {
            nextInventory.push({ ...itemDef, quantity: count } as InventoryItem);
        }

        previewLines.push({
            type: 'ITEM',
            label: getLocalizedItemName(language, itemDef),
            quantityText: `x${count}`,
            image: itemDef.image,
            assetFolder: 'materials',
            icon: itemDef.icon,
        });
    });

    milestone.rewards.equipment?.forEach(({ recipeId, quality, enhancement = 0, count = 1 }) => {
        const recipe = EQUIPMENT_RECIPE_MAP.get(recipeId);
        if (!recipe) return;

        for (let index = 0; index < count; index += 1) {
            const equipment = generateEquipment(recipe, quality, 0, enhancement, getPlayerName(state));
            const equipmentInventoryItem: InventoryItem = {
                id: equipment.id,
                name: equipment.name,
                type: 'EQUIPMENT',
                description: recipe.description,
                baseValue: equipment.price,
                icon: recipe.icon,
                image: recipe.image,
                tags: recipe.tags,
                quantity: 1,
                equipmentData: equipment,
            };

            nextInventory.push(equipmentInventoryItem);
            previewLines.push({
                type: 'EQUIPMENT',
                label: equipment.name,
                quantityText: `Q${quality}${enhancement > 0 ? ` • +${enhancement}` : ''}`,
                image: recipe.image,
                assetFolder: 'equipment',
                icon: recipe.icon,
            });
        }
    });

    const rewardSummary = formatArenaMilestoneRewardContents(language, milestone.rewards);

    return {
        ...state,
        inventory: nextInventory,
        stats: {
            ...state.stats,
            gold: state.stats.gold + (milestone.rewards.gold || 0),
        },
        arena: {
            ...state.arena,
            claimedMilestoneThresholds: [...state.arena.claimedMilestoneThresholds, payload.threshold].sort((a, b) => a - b),
        },
        logs: [
            t(language, 'arena.reward_claimed_log', {
                threshold: payload.threshold.toLocaleString(),
                reward: rewardSummary,
            }),
            ...state.logs,
        ],
        arenaRewardPreview: {
            threshold: payload.threshold,
            rewardLabel: t(language, milestone.rewardLabelKey),
            lines: previewLines,
        },
        toastQueue: [
            ...state.toastQueue,
            t(language, 'arena.reward_claimed_toast', { reward: rewardSummary }),
        ],
    };
};
