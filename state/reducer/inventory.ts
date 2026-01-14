import { GameState, InventoryItem } from '../../types/index';
import { materials } from '../../data/materials';
import { Mercenary } from '../../models/Mercenary';
import { DUNGEON_CONFIG } from '../../config/dungeon-config';

export const handleAcquireItem = (state: GameState, payload: { id: string; quantity: number }): GameState => {
    const { id, quantity } = payload;
    const itemDef = materials[id];
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
    let newMarketStock = { ...state.marketStock };
    let newUnlockedTabs = [...state.unlockedTabs];

    if (!newUnlockedTabs.includes('INVENTORY')) {
        newUnlockedTabs.push('INVENTORY');
        logUpdates.unshift("Access granted: Inventory facility is now operational.");
    }

    items.forEach(buyItem => {
            // Update stock
            newMarketStock[buyItem.id] = Math.max(0, (newMarketStock[buyItem.id] || 0) - buyItem.count);

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
                logUpdates.unshift('Furnace acquired! The restoration process has begun.');
                return; 
            }
            if (buyItem.id === 'workbench') {
                newForgeState.hasWorkbench = true;
                logUpdates.unshift('Workbench installed! You can now craft leather and wood equipment.');
                return;
            }
            const itemDef = materials[buyItem.id];
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
        stats: { 
            ...state.stats, 
            gold: newGold, 
            tierLevel: newTierLevel,
            dailyFinancials: {
                ...state.stats.dailyFinancials,
                expenseMarket: state.stats.dailyFinancials.expenseMarket + totalCost
            }
        },
        forge: newForgeState,
        inventory: newInventory,
        marketStock: newMarketStock,
        unlockedTabs: newUnlockedTabs,
        garrickAffinity: Math.min(100, state.garrickAffinity + 1), // 감사의 호감도 +1
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
    let newTutorialStep = state.tutorialStep;
    let newActiveCustomer = state.activeCustomer;
    let qualityBonus = 0;

    const isShopSale = !!customer;

    if (equipmentInstanceId) {
        const itemIndex = newInventory.findIndex(i => i.id === equipmentInstanceId);
        if (itemIndex > -1) {
            if (newInventory[itemIndex].isLocked) return state;

            const targetItem = newInventory[itemIndex];
            itemName = targetItem.name;
            
            // 품질 보너스 계산
            if (targetItem.equipmentData) {
                const q = targetItem.equipmentData.quality;
                if (q > 100) qualityBonus = 2; // 명품 보너스
                else if (q < 80) qualityBonus = -1; // 하급품 패널티
            }

            newInventory.splice(itemIndex, 1);
        }
    } else {
        const itemIndex = newInventory.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
            if (newInventory[itemIndex].isLocked) return state;
        }

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
        const isPipTutorial = newTutorialStep === 'SELL_ITEM_GUIDE' && customer.id === 'pip_green';
        
        // 최종 호감도 상승량 결정 (기본 2 + 품질 보너스)
        const baseAffinityGain = isPipTutorial ? 10 : 2;
        const finalAffinityGain = Math.max(1, baseAffinityGain + qualityBonus);
        
        if (existingMercIdx > -1) {
            const merc = { ...newKnownMercenaries[existingMercIdx] };
            merc.affinity = Math.min(100, (merc.affinity || 0) + finalAffinityGain); 
            merc.visitCount = (merc.visitCount || 0) + 1;
            merc.lastVisitDay = state.stats.day;
            newKnownMercenaries[existingMercIdx] = merc;
            
            const qualityNote = qualityBonus > 0 ? " (Masterwork Bonus!)" : qualityBonus < 0 ? " (Poor Quality Penalty)" : "";
            logMessage = `Sold ${itemName} to ${customer.name}. Affinity rose by ${finalAffinityGain}${qualityNote}.`;
        } else {
            const newMerc: Mercenary = {
                ...customer,
                affinity: finalAffinityGain,
                visitCount: 1,
                lastVisitDay: state.stats.day,
                expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
                currentXp: 0,
                xpToNextLevel: 100,
                status: 'VISITOR'
            };
            newKnownMercenaries.push(newMerc);
            logMessage = `Sold ${itemName} to ${customer.name}. (New Contact, Affinity +${finalAffinityGain})`;
        }

        if (newActiveCustomer && newActiveCustomer.mercenary.id === customer.id) {
            newActiveCustomer = {
                ...newActiveCustomer,
                mercenary: {
                    ...newActiveCustomer.mercenary,
                    affinity: Math.min(100, (newActiveCustomer.mercenary.affinity || 0) + finalAffinityGain)
                }
            };
        }

        if (isPipTutorial) {
            newTutorialStep = 'PIP_PRAISE';
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
            dailyFinancials: {
                ...state.stats.dailyFinancials,
                incomeShop: state.stats.dailyFinancials.incomeShop + (isShopSale ? price : 0),
                incomeInventory: state.stats.dailyFinancials.incomeInventory + (!isShopSale ? price : 0)
            }
        },
        knownMercenaries: newKnownMercenaries,
        activeCustomer: newActiveCustomer,
        tutorialStep: newTutorialStep,
        logs: [logMessage, ...state.logs]
    };
};

export const handleUseItem = (state: GameState, payload: { itemId: string; mercenaryId?: string }): GameState => {
    const { itemId, mercenaryId } = payload;
    const inventoryItem = state.inventory.find(i => i.id === itemId);

    if (!inventoryItem || inventoryItem.quantity <= 0) return state;

    let newStats = { ...state.stats };
    let newUnlockedRecipes = [...(state.unlockedRecipes || [])];
    let newKnownMercenaries = [...state.knownMercenaries];
    let logMsg = '';
    let itemUsed = false;

    if (itemId === 'energy_potion') {
        const recoverAmount = 25;
        if (newStats.energy >= newStats.maxEnergy) {
            return {
                ...state,
                toastQueue: [...state.toastQueue, `Blacksmith energy is already at maximum.`],
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
    else if (mercenaryId) {
        const mercIdx = newKnownMercenaries.findIndex(m => m.id === mercenaryId);
        if (mercIdx > -1) {
            const merc = { ...newKnownMercenaries[mercIdx] };
            if (itemId === 'hp_potion') {
                const heal = 50;
                if (merc.currentHp >= merc.maxHp) {
                    return { 
                        ...state, 
                        toastQueue: [...state.toastQueue, `${merc.name} is already at full health.`],
                        logs: [`${merc.name} is already at full health.`, ...state.logs] 
                    };
                }
                merc.currentHp = Math.min(merc.maxHp, merc.currentHp + heal);
                logMsg = `${merc.name} consumed HP Potion. Recovered ${heal} HP.`;
                itemUsed = true;
            } 
            else if (itemId === 'mp_potion') {
                const restore = 30;
                if (merc.currentMp >= merc.maxMp) {
                    return { 
                        ...state, 
                        toastQueue: [...state.toastQueue, `${merc.name} is already at full mana.`],
                        logs: [`${merc.name} is already at full MP.`, ...state.logs] 
                    };
                }
                merc.currentMp = Math.min(merc.maxMp, merc.currentMp + restore);
                logMsg = `${merc.name} consumed MP Potion. Recovered ${restore} MP.`;
                itemUsed = true;
            }
            else if (itemId === 'stamina_potion') {
                const stamina = 50;
                if ((merc.expeditionEnergy || 0) >= DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY) {
                    return { 
                        ...state, 
                        toastQueue: [...state.toastQueue, `${merc.name} is already at full stamina.`],
                        logs: [`${merc.name} is already at full stamina.`, ...state.logs] 
                    };
                }
                merc.expeditionEnergy = Math.min(DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY, (merc.expeditionEnergy || 0) + stamina);
                logMsg = `${merc.name} consumed Stamina Potion. Recovered ${stamina} Stamina.`;
                itemUsed = true;
            }
            newKnownMercenaries[mercIdx] = merc;
        }
    }

    if (!itemUsed) return state;

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
        knownMercenaries: newKnownMercenaries,
        logs: [logMsg, ...state.logs]
    };
};

export const handleToggleLockItem = (state: GameState, payload: { itemId: string }): GameState => {
    const newInventory = state.inventory.map(item => {
        if (item.id === payload.itemId) {
            return { ...item, isLocked: !item.isLocked };
        }
        return item;
    });

    return {
        ...state,
        inventory: newInventory
    };
};