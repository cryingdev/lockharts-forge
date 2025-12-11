
import React, { createContext, useContext, useReducer, ReactNode, useMemo, useEffect } from 'react';
import { GameState, GameContextType, InventoryItem, GameEvent, EquipmentItem, ShopCustomer } from '../types';
import { INITIAL_STATE, GAME_CONFIG, MASTERY_THRESHOLDS } from '../constants';
import { MATERIALS } from '../data/materials';
import { Equipment, EquipmentRarity, EquipmentType, EquipmentStats } from '../models/Equipment';
import { Mercenary } from '../models/Mercenary';

const GameContext = createContext<GameContextType | undefined>(undefined);

type Action =
  | { type: 'REPAIR_WORK' }
  | { type: 'SLEEP' }        // Trigger Sleep Modal (Manual)
  | { type: 'CONFIRM_SLEEP' } // Actually proceed (From Modal)
  | { type: 'TRIGGER_EVENT'; payload: GameEvent }
  | { type: 'CLOSE_EVENT' }
  | { type: 'ACQUIRE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'PAY_COST'; payload: { gold?: number; items?: { id: string; count: number }[] } }
  | { type: 'BUY_MARKET_ITEMS'; payload: { items: { id: string; count: number }[]; totalCost: number } }
  | { type: 'INSTALL_FURNACE' }
  | { type: 'CRAFT_ITEM'; payload: { item: EquipmentItem; quality: number } }
  | { type: 'SELL_ITEM'; payload: { itemId: string; count: number; price: number; equipmentInstanceId?: string; customer?: Mercenary } }
  | { type: 'TOGGLE_SHOP' }
  | { type: 'ADD_KNOWN_MERCENARY'; payload: Mercenary }
  | { type: 'ENQUEUE_CUSTOMER'; payload: ShopCustomer }
  | { type: 'NEXT_CUSTOMER' }
  | { type: 'DISMISS_CUSTOMER' }
  | { type: 'SET_CRAFTING'; payload: boolean }
  | { type: 'UPDATE_FORGE_STATUS'; payload: { temp: number } }
  | { type: 'TOGGLE_JOURNAL' };

const generateEquipment = (recipe: EquipmentItem, quality: number, masteryCount: number): Equipment => {
    // 1. Determine Mastery Bonus
    let statMultiplier = 1.0;
    let priceMultiplier = 1.0;
    let namePrefix = '';

    if (masteryCount >= MASTERY_THRESHOLDS.ARTISAN) {
        statMultiplier = MASTERY_THRESHOLDS.ARTISAN_BONUS.stats;
        priceMultiplier = MASTERY_THRESHOLDS.ARTISAN_BONUS.price;
        namePrefix = MASTERY_THRESHOLDS.ARTISAN_BONUS.prefix;
    } else if (masteryCount >= MASTERY_THRESHOLDS.ADEPT) {
        statMultiplier = MASTERY_THRESHOLDS.ADEPT_BONUS.stats;
        priceMultiplier = MASTERY_THRESHOLDS.ADEPT_BONUS.price;
        namePrefix = MASTERY_THRESHOLDS.ADEPT_BONUS.prefix;
    }

    // 2. Determine Rarity
    let rarity = EquipmentRarity.COMMON;
    if (quality >= 100) rarity = EquipmentRarity.LEGENDARY;
    else if (quality >= 90) rarity = EquipmentRarity.EPIC;
    else if (quality >= 75) rarity = EquipmentRarity.RARE;
    else if (quality >= 50) rarity = EquipmentRarity.UNCOMMON;

    // 3. Determine Stats Multiplier based on quality AND mastery
    const qualityMultiplier = 0.5 + (quality / 100) * 0.7; // Range: 0.5 to 1.2
    const finalMultiplier = qualityMultiplier * statMultiplier;

    const base = recipe.baseStats || { physicalAttack: 0, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 };
    const stats: EquipmentStats = {
        physicalAttack: Math.round(base.physicalAttack * finalMultiplier),
        physicalDefense: Math.round(base.physicalDefense * finalMultiplier),
        magicalAttack: Math.round(base.magicalAttack * finalMultiplier),
        magicalDefense: Math.round(base.magicalDefense * finalMultiplier),
    };

    // 4. Determine Type (Mapping)
    let type = EquipmentType.SWORD;
    if (recipe.subCategoryId === 'SWORD') type = EquipmentType.SWORD;
    else if (recipe.subCategoryId === 'AXE') type = EquipmentType.AXE;
    else if (recipe.subCategoryId === 'HELMET') type = EquipmentType.HELMET;
    else if (recipe.subCategoryId === 'CHESTPLATE') type = EquipmentType.CHESTPLATE;

    // 5. Price Calculation
    const price = Math.round((recipe.baseValue * qualityMultiplier) * priceMultiplier);
    
    // 6. Final Name
    const finalName = namePrefix ? `${namePrefix} ${recipe.name}` : recipe.name;

    return {
        id: `${recipe.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: finalName,
        type: type,
        quality: quality,
        rarity: rarity,
        price: price,
        stats: stats,
        specialAbilities: [], 
        craftedDate: Date.now(),
        crafterName: 'Lockhart'
    };
};

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'REPAIR_WORK': {
      if (state.stats.energy < GAME_CONFIG.ENERGY_COST.REPAIR) return state;
      
      return {
        ...state,
        stats: { 
          ...state.stats, 
          energy: state.stats.energy - GAME_CONFIG.ENERGY_COST.REPAIR,
          gold: state.stats.gold + 15
        },
        logs: [`Performed cold repairs for a neighbor. Gold +15. Energy -${GAME_CONFIG.ENERGY_COST.REPAIR}.`, ...state.logs],
      };
    }

    case 'SLEEP': {
        // User clicked "Rest" manually.
        // Triggers the confirmation modal instead of instantly resting.
        return {
            ...state,
            showSleepModal: true
        };
    }

    case 'CONFIRM_SLEEP': {
        // Triggered by the End of Day Modal
        const nextDay = state.stats.day + 1;
        return {
            ...state,
            stats: {
                ...state.stats,
                day: nextDay,
                energy: state.stats.maxEnergy,
            },
            forge: { ...state.forge, isShopOpen: false },
            visitorsToday: [],
            activeCustomer: null,
            shopQueue: [],
            isCrafting: false,
            showSleepModal: false, // Close modal
            logs: [`Day ${nextDay} begins. You feel refreshed.`, ...state.logs],
            // Reset forge temp overnight
            forgeTemperature: 0,
            lastForgeTime: Date.now(),
        };
    }

    case 'SET_CRAFTING': {
        const isCrafting = action.payload;
        return {
            ...state,
            isCrafting
        };
    }

    case 'UPDATE_FORGE_STATUS': {
        return {
            ...state,
            forgeTemperature: action.payload.temp,
            lastForgeTime: Date.now()
        };
    }

    case 'TOGGLE_JOURNAL': {
        return {
            ...state,
            showJournal: !state.showJournal
        };
    }

    case 'TRIGGER_EVENT':
      return { ...state, activeEvent: action.payload };

    case 'CLOSE_EVENT':
      return { ...state, activeEvent: null };

    case 'ACQUIRE_ITEM': {
      const { id, quantity } = action.payload;
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
    }

    case 'PAY_COST': {
        const { gold, items } = action.payload;
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
        }
    }

    case 'BUY_MARKET_ITEMS': {
        const { items, totalCost } = action.payload;
        
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
                 logUpdates.unshift('Furnace acquired! You can now start forging.');
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
    }

    case 'INSTALL_FURNACE':
      return {
        ...state,
        forge: { ...state.forge, hasFurnace: true },
        logs: ['The Furnace has been installed! The forge comes alive.', ...state.logs]
      };
    
    case 'CRAFT_ITEM': {
        const { item, quality } = action.payload;
        
        // Calculate Energy Cost with Mastery Discount
        const masteryCount = state.craftingMastery[item.id] || 0;
        let energyCost = GAME_CONFIG.ENERGY_COST.CRAFT;
        
        if (masteryCount >= MASTERY_THRESHOLDS.ARTISAN) {
            energyCost -= MASTERY_THRESHOLDS.ARTISAN_BONUS.energyDiscount;
        }

        if (state.stats.energy < energyCost) {
             return {
                ...state,
                logs: [`Too exhausted to craft. Need ${energyCost} energy.`, ...state.logs]
            };
        }

        const hasResources = item.requirements.every(req => {
            const invItem = state.inventory.find(i => i.id === req.id);
            return invItem && invItem.quantity >= req.count;
        });

        if (!hasResources) {
            return {
                ...state,
                logs: [`Failed to craft ${item.name}. Missing resources.`, ...state.logs]
            };
        }

        let newInventory = [...state.inventory];
        item.requirements.forEach(req => {
            newInventory = newInventory.map(invItem => {
                if (invItem.id === req.id) {
                    return { ...invItem, quantity: invItem.quantity - req.count };
                }
                return invItem;
            }).filter(i => i.quantity > 0);
        });

        const equipment = generateEquipment(item, quality, masteryCount);

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
            stats: {
                ...state.stats,
                energy: state.stats.energy - energyCost
            },
            inventory: newInventory,
            craftingMastery: newMastery,
            logs: [`Successfully crafted ${equipment.rarity} ${item.name} (Quality: ${quality})! Energy -${energyCost}`, ...state.logs]
        };
    }

    case 'SELL_ITEM': {
        const { itemId, count, price, equipmentInstanceId, customer } = action.payload;
        
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
                    lastVisitDay: state.stats.day
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
            stats: { ...state.stats, gold: state.stats.gold + price },
            knownMercenaries: newKnownMercenaries,
            activeCustomer: newActiveCustomer,
            logs: [logMessage, ...state.logs]
        };
    }

    case 'TOGGLE_SHOP':
        if (state.stats.energy < GAME_CONFIG.ENERGY_COST.OPEN_SHOP && !state.forge.isShopOpen) {
            return {
                ...state,
                logs: ['Not enough energy to prepare the shop.', ...state.logs]
            };
        }

        const willOpen = !state.forge.isShopOpen;
        const energyCost = willOpen ? GAME_CONFIG.ENERGY_COST.OPEN_SHOP : 0;

        return {
            ...state,
            stats: { ...state.stats, energy: state.stats.energy - energyCost },
            forge: { ...state.forge, isShopOpen: willOpen },
            logs: [willOpen ? 'Shop is now OPEN.' : 'Shop is now CLOSED.', ...state.logs]
        };

    case 'ADD_KNOWN_MERCENARY': {
        const merc = action.payload;
        if (state.knownMercenaries.some(m => m.id === merc.id)) return state;

        return {
            ...state,
            knownMercenaries: [...state.knownMercenaries, merc],
            logs: [`${merc.name} is now a regular at the tavern.`, ...state.logs]
        };
    }

    case 'ENQUEUE_CUSTOMER': {
        const customer = action.payload;
        return {
            ...state,
            shopQueue: [...state.shopQueue, customer],
            visitorsToday: [...state.visitorsToday, customer.mercenary.id], 
            logs: [`${customer.mercenary.name} has entered the shop.`, ...state.logs]
        };
    }

    case 'NEXT_CUSTOMER': {
        if (state.shopQueue.length === 0) return state;
        const [next, ...remaining] = state.shopQueue;
        return {
            ...state,
            shopQueue: remaining,
            activeCustomer: next
        };
    }

    case 'DISMISS_CUSTOMER': {
        return {
            ...state,
            activeCustomer: null,
            logs: state.activeCustomer ? [`${state.activeCustomer.mercenary.name} left the shop.`] : state.logs
        };
    }

    default:
      return state;
  }
};

const GameProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  // Removed automatic time progression useEffect

  const actions = useMemo(() => ({
    repairItem: () => dispatch({ type: 'REPAIR_WORK' }),
    rest: () => dispatch({ type: 'SLEEP' }), 
    confirmSleep: () => dispatch({ type: 'CONFIRM_SLEEP' }),
    handleEventOption: (action: () => void) => {
      action();
      dispatch({ type: 'CLOSE_EVENT' });
    },
    closeEvent: () => dispatch({ type: 'CLOSE_EVENT' }),
    craftItem: (item: EquipmentItem, quality: number) => dispatch({ type: 'CRAFT_ITEM', payload: { item, quality } }),
    buyItems: (items: { id: string; count: number }[], totalCost: number) => dispatch({ type: 'BUY_MARKET_ITEMS', payload: { items, totalCost } }),
    sellItem: (itemId: string, count: number, price: number, equipmentInstanceId?: string, customer?: Mercenary) => 
        dispatch({ type: 'SELL_ITEM', payload: { itemId, count, price, equipmentInstanceId, customer } }),
    toggleShop: () => dispatch({ type: 'TOGGLE_SHOP' }),
    addMercenary: (merc: Mercenary) => dispatch({ type: 'ADD_KNOWN_MERCENARY', payload: merc }),
    
    consumeItem: (id: string, count: number) => dispatch({ type: 'PAY_COST', payload: { items: [{ id, count }] } }),

    enqueueCustomer: (customer: ShopCustomer) => dispatch({ type: 'ENQUEUE_CUSTOMER', payload: customer }),
    nextCustomer: () => dispatch({ type: 'NEXT_CUSTOMER' }),
    dismissCustomer: () => dispatch({ type: 'DISMISS_CUSTOMER' }),

    setCrafting: (isCrafting: boolean) => dispatch({ type: 'SET_CRAFTING', payload: isCrafting }),
    updateForgeStatus: (temp: number) => dispatch({ type: 'UPDATE_FORGE_STATUS', payload: { temp } }),
    toggleJournal: () => dispatch({ type: 'TOGGLE_JOURNAL' }),
  }), []);

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export { GameProvider };
