import { GameState } from '../../types/game-state';
import { EQUIPMENT_ITEMS } from '../../data/equipment';
import { t } from '../../utils/i18n';
import { getLocalizedItemName } from '../../utils/itemText';

export const handleResearchCombination = (state: GameState, payload: { items: { id: string; count: number }[] }): GameState => {
    const { items } = payload;
    const { unlockedRecipes } = state;
    const language = state.settings.language;

    // 1. Consume the materials
    let newInventory = [...state.inventory];
    items.forEach(req => {
        newInventory = newInventory.map(invItem => {
            if (invItem.id === req.id) {
                return { ...invItem, quantity: Math.max(0, invItem.quantity - req.count) };
            }
            return invItem;
        }).filter(i => i.quantity > 0);
    });

    // 2. Find potential matches in locked recipes
    const lockedRecipes = EQUIPMENT_ITEMS.filter(item => !unlockedRecipes.includes(item.id) && item.unlockedByDefault === false);

    // Sort input items for comparison
    const sortedInput = [...items].sort((a, b) => a.id.localeCompare(b.id));
    const inputIds = sortedInput.map(i => i.id);

    let discoveredRecipeId: string | null = null;
    let resonating = false;

    for (const recipe of lockedRecipes) {
        const sortedReqs = [...recipe.requirements].sort((a, b) => a.id.localeCompare(b.id));
        const reqIds = sortedReqs.map(r => r.id);

        // Check if IDs match exactly
        const idsMatch = JSON.stringify(inputIds) === JSON.stringify(reqIds);

        if (idsMatch) {
            // Check if counts match exactly
            const countsMatch = sortedReqs.every((req, idx) => req.count === sortedInput[idx].count);
            
            if (countsMatch) {
                discoveredRecipeId = recipe.id;
                break;
            } else {
                resonating = true;
            }
        }
    }

    let logMsg = "";
    let newUnlockedRecipes = [...unlockedRecipes];

    if (discoveredRecipeId) {
        const recipe = EQUIPMENT_ITEMS.find(r => r.id === discoveredRecipeId)!;
        newUnlockedRecipes.push(discoveredRecipeId);
        logMsg = t(language, 'research.log_eureka', {
            item: getLocalizedItemName(language, { id: recipe.id, name: recipe.name })
        });
    } else if (resonating) {
        logMsg = t(language, 'research.log_resonate');
    } else {
        logMsg = t(language, 'research.log_fail');
    }

    return {
        ...state,
        inventory: newInventory,
        unlockedRecipes: newUnlockedRecipes,
        logs: [logMsg, ...state.logs]
    };
};
