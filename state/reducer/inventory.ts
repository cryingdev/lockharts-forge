import { GameState, InventoryItem } from '../../types/index';
import { MATERIALS } from '../../data/materials';
import { Mercenary } from '../../models/Mercenary';
import { DUNGEON_CONFIG } from '../../config/dungeon-config';

export const handleAcquireItem = (state: GameState, payload: { id: string; quantity: number }): GameState => {
    const { id, quantity } = payload;
    const itemDef = Object.values(MATERIALS).find(i => i.id === id);
    if (!itemDef) return state;

    const existingItem = state.inventory.find(i => i.id === id);
    const newInventory = existingItem
    ? state.inventory.map(i => i.id === id ? { ...i, quantity: i.quantity + quantity } : i)
    : [...state.inventory, { ...itemDef, quantity } as InventoryItem];

    return {
    ...state,
    inventory: newInventory,
    logs: [`Acquired ${itemDef.name} x${quantity}.`, ...state.logs],
    };
};

export const handlePayCost = (state: GameState, payload: { gold?: number; items?: { id: string; count: number }[] }): GameState => {
    const { gold, items } = payload;
    let newGold = state.stats.gold;
    let newInventory = [...state.inventory];

    if (gold) newGold -= gold;
    if (items) {
        items.forEach(costItem => {
            newInventory = newInventory.map(invItem => {
                if (invItem.id === costItem.id) {
                    return { ...invItem, quantity: invItem.quantity - costItem.count };
                }
                return invItem;
            }).filter(i => i.quantity > 0);
        });
    }
    return {
        ...state,
        stats: { ...state.stats, gold: newGold },
        inventory: newInventory
    };
};

export const handleBuyMarketItems = (state: GameState, payload: { items: { id: string; count: number }[]; totalCost: number }): GameState => {
    const { items, totalCost } = payload;
    
    const newGold = state.stats.gold - totalCost;
    if (newGold < 0) return state; 

    let newInventory = [...state.inventory];
    let newTierLevel = state.stats.tierLevel;
    let newForgeState = { ...state.forge };
    let logUpdates: string[] = [`Bought supplies for ${totalCost} Gold.`];

    items.forEach(buyItem => {
            if (buyItem.id === 'scroll_t2') {
                newTierLevel = Math.max(newTierLevel, 2);
                logUpdates.unshift('Upgrade Complete: Market Tier 2 Unlocked!');
                return; 
            }
            if (buyItem.id === 'scroll_t3') {
                newTierLevel = Math.max(newTierLevel, 3);
                logUpdates.unshift('Upgrade Complete: Market Tier 3 Unlocked!');
                return; 
            }
            if (buyItem.id === 'furnace') {
                newForgeState.hasFurnace = true;
                if (newTierLevel === 0) newTierLevel = 1; 
                logUpdates.unshift('Furnace acquired! You can now start forging metal.');
                return; 
            }
            if (buyItem.id === 'workbench') {
                newForgeState.hasWorkbench = true;
                logUpdates.unshift('Workbench installed! You can now craft leather and wood equipment.');
                return;
            }
            const itemDef = Object.values(MATERIALS).find(i => i.id === buyItem.id);
            if (itemDef) {
                const existingItem = newInventory.find(i => i.id === buyItem.id);
                if (existingItem) {
                    newInventory = newInventory.map(i => i.id === buyItem.id ? { ...i, quantity: i.quantity + buyItem.count } : i);
                } else {
                    newInventory.push({ ...itemDef, quantity: buyItem.count } as InventoryItem);
                }
            }
    });

    return {
        ...state,
        stats: { ...state.stats, gold: newGold, tierLevel: newTierLevel },
        forge: newForgeState,
        inventory: newInventory,
        logs: [...logUpdates, ...state.logs]
    };
};

export const handleInstallFurnace = (state: GameState): GameState => {
    return {
    ...state,
    forge: { ...state.forge, hasFurnace: true },
    logs: ['The Furnace has been installed! The forge comes alive.', ...state.logs]
    };
};

export const handleSellItem = (state: GameState, payload: { itemId: string; count: number; price: number; equipmentInstanceId?: string; customer?: Mercenary }): GameState => {
    const { itemId, count, price, equipmentInstanceId, customer } = payload;
    
    let newInventory = [...state.inventory];
    let itemName = 'Item';
    let newKnownMercenaries = [...state.knownMercenaries];
    let logMessage = '';
    let newActiveCustomer = state.activeCustomer;

    if (equipmentInstanceId) {
        const itemIndex = newInventory.findIndex(i => i.id === equipmentInstanceId);
        if (itemIndex > -1) {
            itemName = newInventory[itemIndex].name;
            newInventory.splice(itemIndex, 1);
        }
    } else {
        newInventory = newInventory.map(item => {
            if (item.id === itemId) {
                itemName = item.name;
                return { ...item, quantity: item.quantity - count };
            }
            return item;
        }).filter(i => i.quantity > 0);
    }

    if (customer) {
        const existingMercIdx = newKnownMercenaries.findIndex(m => m.id === customer.id);
        
        if (existingMercIdx > -1) {
            const merc = { ...newKnownMercenaries[existingMercIdx] };
            merc.affinity = Math.min(100, (merc.affinity || 0) + 2); 
            merc.visitCount = (merc.visitCount || 0) + 1;
            merc.lastVisitDay = state.stats.day;
            newKnownMercenaries[existingMercIdx] = merc;
            logMessage = `Sold ${itemName} to ${customer.name}. Affinity rose to ${merc.affinity}.`;
        } else {
            const newMerc: Mercenary = {
                ...customer,
                affinity: 2,
                visitCount: 1,
                lastVisitDay: state.stats.day,
                expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
                currentXp: 0,
                xpToNextLevel: 100,
                status: 'VISITOR' // Explicitly set status to VISITOR for new contacts
            };
            newKnownMercenaries.push(newMerc);
            logMessage = `Sold ${itemName} to ${customer.name}. (New Contact)`;
        }

        if (state.activeCustomer && state.activeCustomer.mercenary.id === customer.id) {
            newActiveCustomer = null; 
        }
    } else {
        logMessage = `Sold ${itemName} for ${price} Gold.`;
    }

    return {
        ...state,
        inventory: newInventory,
        stats: { 
            ...state.stats, 
            gold: state.stats.gold + price,
            incomeToday: state.stats.incomeToday + price,
        },
        knownMercenaries: newKnownMercenaries,
        activeCustomer: newActiveCustomer,
        logs: [logMessage, ...state.logs]
    };
};

export const handleUseItem = (state: GameState, payload: { itemId: string }): GameState => {
    const { itemId } = payload;
    const inventoryItem = state.inventory.find(i => i.id === itemId);

    if (!inventoryItem || inventoryItem.quantity <= 0) return state;

    let newStats = { ...state.stats };
    let newUnlockedRecipes = [...(state.unlockedRecipes || [])];
    let logMsg = '';
    let itemUsed = false;

    // Logic per Item ID
    if (itemId === 'energy_potion') {
        const recoverAmount = 25;
        if (newStats.energy >= newStats.maxEnergy) {
            return {
                ...state,
                logs: [`Energy is already full!`, ...state.logs]
            };
        }
        newStats.energy = Math.min(newStats.maxEnergy, newStats.energy + recoverAmount);
        logMsg = `Consumed Energy Potion. +${recoverAmount} Energy.`;
        itemUsed = true;
    } 
    else if (itemId === 'recipe_scroll_bronze_longsword') {
        const targetRecipeId = 'sword_bronze_long_t1';
        if (newUnlockedRecipes.includes(targetRecipeId)) {
            return {
                ...state,
                logs: [`You already know the techniques in this scroll.`, ...state.logs]
            };
        }
        newUnlockedRecipes.push(targetRecipeId);
        logMsg = `Studied the scroll. Bronze Longsword recipe unlocked!`;
        itemUsed = true;
    }

    if (!itemUsed) return state;

    // Deduct Item
    const newInventory = state.inventory.map(item => {
        if (item.id === itemId) {
            return { ...item, quantity: item.quantity - 1 };
        }
        return item;
    }).filter(i => i.quantity > 0);

    return {
        ...state,
        stats: newStats,
        inventory: newInventory,
        unlockedRecipes: newUnlockedRecipes,
        logs: [logMsg, ...state.logs]
    };
};