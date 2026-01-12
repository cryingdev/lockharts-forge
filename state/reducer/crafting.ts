
import { GameState, InventoryItem } from '../../types/index';
import { EquipmentItem } from '../../types/inventory';
import { getEnergyCost, generateEquipment, calcCraftExp, getSmithingLevel, getUnlockedTier } from '../../utils/craftingLogic';
import { MATERIALS } from '../../data/materials';

const getQualityLabel = (q: number): string => {
    if (q >= 110) return "MASTERWORK";
    if (q >= 100) return "PRISTINE";
    if (q >= 90) return "SUPERIOR";
    if (q >= 80) return "FINE";
    if (q >= 70) return "STANDARD";
    if (q >= 60) return "RUSTIC";
    return "CRUDE";
};

export const handleStartCrafting = (state: GameState, payload: { item: EquipmentItem }): GameState => {
    const { item } = payload;
    const masteryCount = state.craftingMastery[item.id] || 0;
    const energyCost = getEnergyCost(item, masteryCount);

    if (state.stats.energy < energyCost) return state;

    const hasResources = item.requirements.every(req => {
        const invItem = state.inventory.find(i => i.id === req.id);
        return invItem && invItem.quantity >= req.count;
    });
    if (!hasResources) return state;

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

export const handleFinishCrafting = (state: GameState, payload: { item: EquipmentItem; quality: number; bonus?: number; masteryGain?: number }): GameState => {
    const { item, quality, bonus = 0, masteryGain = 1 } = payload;
    const masteryCount = state.craftingMastery[item.id] || 0;
    const isFirstCraft = masteryCount === 0;

    // Calculate EXP - 퀄리티 수치를 직접 전달
    const expGain = calcCraftExp({
        tier: item.tier,
        quality01: quality / 100,
        isQuickCraft: masteryGain < 1.0,
        isFirstCraft,
        quality: quality
    });

    const isForge = item.craftingType === 'FORGE';
    const oldExp = isForge ? state.stats.smithingExp : state.stats.workbenchExp;
    const newExp = oldExp + expGain;
    
    const oldLevel = getSmithingLevel(oldExp);
    const newLevel = getSmithingLevel(newExp);
    const oldTier = getUnlockedTier(oldLevel);
    const newTier = getUnlockedTier(newLevel);

    const equipment = generateEquipment(item, quality, masteryCount, bonus);
    
    const newItem: InventoryItem = {
        id: equipment.id, 
        name: equipment.name,
        type: 'EQUIPMENT',
        description: item.description,
        baseValue: equipment.price,
        icon: item.icon,
        quantity: 1,
        equipmentData: equipment
    };

    const newInventory = [...state.inventory, newItem];

    const newMastery = { ...state.craftingMastery };
    newMastery[item.id] = (masteryCount || 0) + masteryGain;

    const label = getQualityLabel(quality);
    let logMsg = `Successfully crafted ${label.toLowerCase()} quality ${item.name}! (+${expGain} XP)`;
    if (bonus > 0) logMsg += ` Pinned technique applied +${bonus} enhancements.`;
    if (newLevel > oldLevel) logMsg += ` Level Up! (Lv.${newLevel})`;

    let newUnlockedTabs = [...state.unlockedTabs];
    if (!newUnlockedTabs.includes('INVENTORY')) {
        newUnlockedTabs.push('INVENTORY');
        logMsg = "Facility restored: Inventory tracking is now active. " + logMsg;
    }

    return {
        ...state,
        isCrafting: false,
        inventory: newInventory,
        unlockedTabs: newUnlockedTabs,
        craftingMastery: newMastery,
        lastCraftedItem: newItem, 
        stats: {
            ...state.stats,
            smithingExp: isForge ? newExp : state.stats.smithingExp,
            workbenchExp: !isForge ? newExp : state.stats.workbenchExp
        },
        unlockedTierPopup: newTier > oldTier ? { type: item.craftingType, tier: newTier } : state.unlockedTierPopup,
        logs: [logMsg, ...state.logs]
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
