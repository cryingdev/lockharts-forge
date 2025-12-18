import { GameState } from '../../types/index';
import { EquipmentSlotType } from '../../types/inventory';
import { Equipment } from '../../models/Equipment';

export const handleEquipItem = (state: GameState, payload: { mercenaryId: string; inventoryItemId: string }): GameState => {
    const { mercenaryId, inventoryItemId } = payload;
    
    const mercIndex = state.knownMercenaries.findIndex(m => m.id === mercenaryId);
    if (mercIndex === -1) return state;
    const mercenary = { ...state.knownMercenaries[mercIndex] };
    const newEquipment = { ...mercenary.equipment };

    const invItemIndex = state.inventory.findIndex(i => i.id === inventoryItemId);
    if (invItemIndex === -1) return state;
    const invItem = state.inventory[invItemIndex];

    if (invItem.type !== 'EQUIPMENT' || !invItem.equipmentData) return state;
    
    const equipData: Equipment = { ...invItem.equipmentData };
    const targetSlot: EquipmentSlotType = equipData.slotType;
    
    let newInventory = [...state.inventory];
    let itemsReturnedToInventory: Equipment[] = [];

    // 장착 슬롯 스왑 로직
    if (targetSlot === 'MAIN_HAND') {
        if (equipData.isTwoHanded) {
            if (newEquipment.OFF_HAND) {
                itemsReturnedToInventory.push(newEquipment.OFF_HAND);
                newEquipment.OFF_HAND = null;
            }
        }
        if (newEquipment.MAIN_HAND) {
            itemsReturnedToInventory.push(newEquipment.MAIN_HAND);
        }
        newEquipment.MAIN_HAND = equipData;
    }
    else if (targetSlot === 'OFF_HAND') {
        if (newEquipment.MAIN_HAND && newEquipment.MAIN_HAND.isTwoHanded) {
             itemsReturnedToInventory.push(newEquipment.MAIN_HAND);
             newEquipment.MAIN_HAND = null;
        }
        if (newEquipment.OFF_HAND) {
            itemsReturnedToInventory.push(newEquipment.OFF_HAND);
        }
        newEquipment.OFF_HAND = equipData;
    }
    else {
        if (newEquipment[targetSlot]) {
            itemsReturnedToInventory.push(newEquipment[targetSlot]!);
        }
        newEquipment[targetSlot] = equipData;
    }

    newInventory.splice(invItemIndex, 1);

    itemsReturnedToInventory.forEach(returnedItem => {
        newInventory.push({
            id: returnedItem.id,
            name: returnedItem.name,
            type: 'EQUIPMENT',
            description: returnedItem.description || 'Returned equipment',
            baseValue: returnedItem.price,
            icon: returnedItem.icon || '📦',
            quantity: 1,
            equipmentData: returnedItem
        });
    });

    // 호감도 상승 로직 (최초 소유 시에만 적용)
    const previousOwners = equipData.previousOwners || [];
    let affinityGain = 0;
    let logMessage = `Equipped ${equipData.name} to ${mercenary.name}.`;

    if (!previousOwners.includes(mercenaryId)) {
        switch (equipData.rarity) {
            case 'Legendary': affinityGain = 5; break;
            case 'Epic': affinityGain = 4; break;
            case 'Rare': affinityGain = 3; break;
            case 'Uncommon': affinityGain = 2; break;
            case 'Common': affinityGain = 1; break;
            default: affinityGain = 1;
        }
        
        mercenary.affinity = Math.min(100, (mercenary.affinity || 0) + affinityGain);
        equipData.previousOwners = [...previousOwners, mercenaryId];
        logMessage += ` Affinity +${affinityGain}.`;
    }

    const newMercenaries = [...state.knownMercenaries];
    newMercenaries[mercIndex] = { ...mercenary, equipment: newEquipment };

    return {
        ...state,
        inventory: newInventory,
        knownMercenaries: newMercenaries,
        logs: [logMessage, ...state.logs]
    };
};

export const handleUnequipItem = (state: GameState, payload: { mercenaryId: string; slot: EquipmentSlotType }): GameState => {
    const { mercenaryId, slot } = payload;

    const mercIndex = state.knownMercenaries.findIndex(m => m.id === mercenaryId);
    if (mercIndex === -1) return state;
    const mercenary = { ...state.knownMercenaries[mercIndex] };
    const newEquipment = { ...mercenary.equipment };

    const itemToUnequip = newEquipment[slot];
    if (!itemToUnequip) return state;

    const newInventory = [...state.inventory];
    newInventory.push({
        id: itemToUnequip.id,
        name: itemToUnequip.name,
        type: 'EQUIPMENT',
        description: itemToUnequip.description || 'Unequipped item',
        baseValue: itemToUnequip.price,
        icon: itemToUnequip.icon || '📦',
        quantity: 1,
        equipmentData: itemToUnequip
    });

    newEquipment[slot] = null;

    const newMercenaries = [...state.knownMercenaries];
    newMercenaries[mercIndex] = { ...mercenary, equipment: newEquipment };

    return {
        ...state,
        inventory: newInventory,
        knownMercenaries: newMercenaries,
        logs: [`Unequipped ${itemToUnequip.name} from ${mercenary.name}.`, ...state.logs]
    };
};