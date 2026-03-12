import { GameState, ContractDefinition } from '../../types/game-state';
import { InventoryItem } from '../../types/inventory';

const getContractMatchingItems = (inventory: InventoryItem[], itemId: string, acceptedTags?: string[], minQuality?: number) => {
    return inventory.filter(inv => {
        const recipeId = inv.equipmentData?.recipeId;
        const inventoryTags = inv.tags || [];
        const quality = inv.equipmentData?.quality ?? inv.quality ?? 0;

        const idMatch = inv.id === itemId || recipeId === itemId;
        const tagMatch = !!acceptedTags && acceptedTags.some(tag => inventoryTags.includes(tag));
        const qualityMatch = minQuality === undefined || quality >= minQuality;

        return (idMatch || tagMatch) && qualityMatch;
    });
};

export const selectAvailableContracts = (state: GameState): ContractDefinition[] => {
    return state.commission.activeContracts.filter(c => c.status === 'OFFERED');
};

export const selectAcceptedContracts = (state: GameState): ContractDefinition[] => {
    return state.commission.activeContracts.filter(c => c.status === 'ACTIVE');
};

export const isContractReady = (state: GameState, contract: ContractDefinition): boolean => {
    if (contract.status !== 'ACTIVE') return false;

    // 1. Check Progress-based (HUNT, EXPLORE)
    if (contract.objectives && contract.objectives.length > 0) {
        return contract.objectives.every(obj => {
            const progress = state.commission.trackedObjectiveProgress[contract.id]?.[obj.id] || 0;
            return progress >= obj.target;
        });
    }

    // 2. Check Submission-based (CRAFT, TURN_IN)
    if (contract.requirements && contract.requirements.length > 0) {
        return contract.requirements.every(req => {
            const matchingItems = getContractMatchingItems(state.inventory, req.itemId, req.acceptedTags, req.minQuality);
            const totalQty = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
            return totalQty >= req.quantity;
        });
    }

    return false;
};

export const selectReadyContracts = (state: GameState): ContractDefinition[] => {
    return selectAcceptedContracts(state).filter(c => isContractReady(state, c));
};

export const selectExpiredContracts = (state: GameState): ContractDefinition[] => {
    // This assumes we keep expired contracts in activeContracts with a flag or just check deadline
    // For now, let's just check if deadlineDay < currentDay
    return state.commission.activeContracts.filter(c => c.deadlineDay < state.stats.day);
};

export const selectContractProgressSummary = (state: GameState, contractId: string) => {
    const contract = state.commission.activeContracts.find(c => c.id === contractId);
    if (!contract) return null;

    if (contract.objectives) {
        return contract.objectives.map(obj => ({
            id: obj.id,
            label: obj.label,
            current: state.commission.trackedObjectiveProgress[contractId]?.[obj.id] || 0,
            target: obj.target
        }));
    }

    if (contract.requirements) {
        return contract.requirements.map(req => {
            const matchingItems = getContractMatchingItems(state.inventory, req.itemId, req.acceptedTags, req.minQuality);
            const current = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
            return {
                id: req.itemId,
                label: req.itemId, // Should ideally be a name
                current,
                target: req.quantity
            };
        });
    }

    return [];
};
