
import { GameState, InventoryItem } from '../../types/index';
import { EquipmentItem } from '../../types/inventory';
import { getEnergyCost, generateEquipment } from '../../utils/craftingLogic';
import { MATERIALS } from '../../data/materials';

export const handleStartCrafting = (state: GameState, payload: { item: EquipmentItem }): GameState => {
    const { item } = payload;
    const masteryCount = state.craftingMastery[item.id] || 0;
    const energyCost = getEnergyCost(item, masteryCount);

    if (state.stats.energy < energyCost) return state;

    // Check Resources
    const hasResources = item.requirements.every(req => {
        const invItem = state.inventory.find(i => i.id === req.id);
        return invItem && invItem.quantity >= req.count;
    });
    if (!hasResources) return state;

    // Deduct Resources
    let newInventory = [...state.inventory];
    item.requirements.forEach(req => {
        newInventory = newInventory.map(invItem => {
            if (invItem.id === req.id) {
                return { ...invItem, quantity: invItem.quantity - req.count };
            }
            return invItem;
        }).filter(i => i.quantity > 0);
    });

    return {
        ...state,
        isCrafting: true,
        stats: { ...state.stats, energy: state.stats.energy - energyCost },
        inventory: newInventory,
    };
};

export const handleCancelCrafting = (state: GameState, payload: { item: EquipmentItem }): GameState => {
    const { item } = payload;
    const masteryCount = state.craftingMastery[item.id] || 0;
    const energyCost = getEnergyCost(item, masteryCount);

    // Refund Resources
    let newInventory = [...state.inventory];
    item.requirements.forEach(req => {
        const existing = newInventory.find(i => i.id === req.id);
        if (existing) {
            newInventory = newInventory.map(i => i.id === req.id ? { ...i, quantity: i.quantity + req.count } : i);
        } else {
            const itemDef = Object.values(MATERIALS).find(m => m.id === req.id);
            if (itemDef) {
                newInventory.push({ ...itemDef, quantity: req.count } as InventoryItem);
            }
        }
    });

    return {
        ...state,
        isCrafting: false,
        stats: { ...state.stats, energy: state.stats.energy + energyCost },
        inventory: newInventory,
        logs: [`Cancelled work on ${item.name}. Materials restored.`, ...state.logs]
    };
};

export const handleFinishCrafting = (state: GameState, payload: { item: EquipmentItem; quality: number }): GameState => {
    const { item, quality } = payload;
    const masteryCount = state.craftingMastery[item.id] || 0;

    const equipment = generateEquipment(item, quality, masteryCount);
    const newInventory = [...state.inventory];
    
    newInventory.push({
        id: equipment.id, 
        name: equipment.name,
        type: 'EQUIPMENT',
        description: item.description,
        baseValue: equipment.price,
        icon: item.icon,
        quantity: 1,
        equipmentData: equipment
    });

    const newMastery = { ...state.craftingMastery };
    newMastery[item.id] = (masteryCount || 0) + 1;

    return {
        ...state,
        isCrafting: false,
        inventory: newInventory,
        craftingMastery: newMastery,
        logs: [`Successfully crafted ${equipment.rarity} ${item.name} (Quality: ${quality})!`, ...state.logs]
    };
};

export const handleSetCrafting = (state: GameState, isCrafting: boolean): GameState => {
    return { ...state, isCrafting };
};

export const handleUpdateForgeStatus = (state: GameState, payload: { temp: number }): GameState => {
    return {
        ...state,
        forgeTemperature: payload.temp,
        lastForgeTime: Date.now()
    };
};
