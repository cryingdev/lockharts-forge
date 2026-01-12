import { GameState } from '../../types/game-state';
import { EquipmentRarity } from '../../models/Equipment';

export const handleTalkGarrick = (state: GameState): GameState => {
    if (state.talkedToGarrickToday) return state;

    return {
        ...state,
        garrickAffinity: Math.min(100, state.garrickAffinity + 2),
        talkedToGarrickToday: true,
        logs: ["Talked with Garrick. Affinity +2.", ...state.logs]
    };
};

export const handleGiftGarrick = (state: GameState, payload: { itemId: string }): GameState => {
    const { itemId } = payload;
    const invItemIndex = state.inventory.findIndex(i => i.id === itemId);
    if (invItemIndex === -1) return state;

    const item = state.inventory[invItemIndex];
    let affinityGain = 3; // Materials & Consumables

    if (item.type === 'EQUIPMENT' && item.equipmentData) {
        affinityGain = 5;
        switch (item.equipmentData.rarity) {
            case EquipmentRarity.UNCOMMON: affinityGain = 7; break;
            case EquipmentRarity.RARE: affinityGain = 9; break;
            case EquipmentRarity.EPIC: affinityGain = 12; break;
            case EquipmentRarity.LEGENDARY: affinityGain = 15; break;
        }
    }

    const newInventory = [...state.inventory];
    if (item.quantity > 1) {
        newInventory[invItemIndex] = { ...item, quantity: item.quantity - 1 };
    } else {
        newInventory.splice(invItemIndex, 1);
    }

    return {
        ...state,
        inventory: newInventory,
        garrickAffinity: Math.min(100, state.garrickAffinity + affinityGain),
        logs: [`Gifted ${item.name} to Garrick. Affinity +${affinityGain}.`, ...state.logs]
    };
};