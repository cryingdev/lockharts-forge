
import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import { GameState, GameContextType, TimeOfDay, InventoryItem, GameEvent, EquipmentItem, ShopCustomer } from '../types';
import { INITIAL_STATE, GAME_CONFIG, ITEMS } from '../constants';
import { Equipment, EquipmentRarity, EquipmentType, EquipmentStats } from '../models/Equipment';
import { Mercenary } from '../models/Mercenary';

const GameContext = createContext<GameContextType | undefined>(undefined);

type Action =
  | { type: 'CLEAN_RUBBLE' }
  | { type: 'REPAIR_WORK' }
  | { type: 'ADVANCE_TIME' }
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
  | { type: 'DISMISS_CUSTOMER' };

const generateEquipment = (recipe: EquipmentItem, quality: number): Equipment => {
    // 1. Determine Rarity
    let rarity = EquipmentRarity.COMMON;
    if (quality >= 100) rarity = EquipmentRarity.LEGENDARY;
    else if (quality >= 90) rarity = EquipmentRarity.EPIC;
    else if (quality >= 75) rarity = EquipmentRarity.RARE;
    else if (quality >= 50) rarity = EquipmentRarity.UNCOMMON;

    // 2. Determine Stats Multiplier based on quality
    const multiplier = 0.5 + (quality / 100) * 0.7; // Range: 0.5 to 1.2

    const base = recipe.baseStats || { physicalAttack: 0, physicalDefense: 0, magicalAttack: 0, magicalDefense: 0 };
    const stats: EquipmentStats = {
        physicalAttack: Math.round(base.physicalAttack * multiplier),
        physicalDefense: Math.round(base.physicalDefense * multiplier),
        magicalAttack: Math.round(base.magicalAttack * multiplier),
        magicalDefense: Math.round(base.magicalDefense * multiplier),
    };

    // 3. Determine Type (Mapping)
    let type = EquipmentType.SWORD;
    if (recipe.subCategoryId === 'SWORD') type = EquipmentType.SWORD;
    else if (recipe.subCategoryId === 'AXE') type = EquipmentType.AXE;
    else if (recipe.subCategoryId === 'HELMET') type = EquipmentType.HELMET;
    else if (recipe.subCategoryId === 'CHESTPLATE') type = EquipmentType.CHESTPLATE;

    // 4. Price Calculation
    const price = Math.round(recipe.baseValue * multiplier);

    return {
        id: `${recipe.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: recipe.name,
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
    case 'CLEAN_RUBBLE': {
      if (state.stats.energy < GAME_CONFIG.ENERGY_COST.CLEAN) return state;
      if (state.forge.rubbleCleared >= GAME_CONFIG.RUBBLE_MAX) return state;

      const existingScrap = state.inventory.find(i => i.id === ITEMS.SCRAP_METAL.id);
      const newInventory = existingScrap
        ? state.inventory.map(i => i.id === ITEMS.SCRAP_METAL.id ? { ...i, quantity: i.quantity + 2 } : i)
        : [...state.inventory, { ...ITEMS.SCRAP_METAL, type: 'RESOURCE', quantity: 2 } as InventoryItem];

      return {
        ...state,
        stats: { ...state.stats, energy: state.stats.energy - GAME_CONFIG.ENERGY_COST.CLEAN },
        inventory: newInventory,
        forge: { ...state.forge, rubbleCleared: state.forge.rubbleCleared + 1 },
        logs: [`Cleared some rubble. Found Scrap Metal x2. Energy -${GAME_CONFIG.ENERGY_COST.CLEAN}.`, ...state.logs],
      };
    }

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

    case 'ADVANCE_TIME': {
      let nextTime = state.stats.time;
      let nextDay = state.stats.day;
      let energyRefill = 0;
      let resetDailyShop = false;

      if (state.stats.time === TimeOfDay.MORNING) nextTime = TimeOfDay.AFTERNOON;
      else if (state.stats.time === TimeOfDay.AFTERNOON) nextTime = TimeOfDay.EVENING;
      else {
        nextTime = TimeOfDay.MORNING;
        nextDay += 1;
        energyRefill = state.stats.maxEnergy; // Full restore on sleep
        resetDailyShop = true;
      }

      return {
        ...state,
        stats: {
          ...state.stats,
          time: nextTime,
          day: nextDay,
          energy: energyRefill > 0 ? energyRefill : state.stats.energy,
        },
        // Reset shop visitors on a new day. 
        // Also clear queue/active customer if it's night (shop closes effectively)
        visitorsToday: resetDailyShop ? [] : state.visitorsToday,
        activeCustomer: resetDailyShop ? null : state.activeCustomer,
        shopQueue: resetDailyShop ? [] : state.shopQueue,
        logs: energyRefill > 0 
          ? [`You slept through the night. Day ${nextDay} begins.`, ...state.logs]
          : [`Time passes... It is now ${nextTime}.`, ...state.logs]
      };
    }

    case 'TRIGGER_EVENT':
      return { ...state, activeEvent: action.payload };

    case 'CLOSE_EVENT':
      return { ...state, activeEvent: null };

    case 'ACQUIRE_ITEM': {
      const { id, quantity } = action.payload;
      const itemDef = Object.values(ITEMS).find(i => i.id === id);
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
        items.forEach(buyItem => {
             const itemDef = Object.values(ITEMS).find(i => i.id === buyItem.id);
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
            stats: { ...state.stats, gold: newGold },
            inventory: newInventory,
            logs: [`Bought supplies from the market for ${totalCost} Gold.`, ...state.logs]
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

        const equipment = generateEquipment(item, quality);

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

        return {
            ...state,
            inventory: newInventory,
            logs: [`Successfully crafted ${equipment.rarity} ${item.name} (Quality: ${quality})!`, ...state.logs]
        };
    }

    case 'SELL_ITEM': {
        const { itemId, count, price, equipmentInstanceId, customer } = action.payload;
        
        let newInventory = [...state.inventory];
        let itemName = 'Item';
        let newKnownMercenaries = [...state.knownMercenaries];
        let logMessage = '';
        let newActiveCustomer = state.activeCustomer;

        // 1. Handle Inventory Removal
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

        // 2. Handle Customer Affinity & Known List
        if (customer) {
            const existingMercIdx = newKnownMercenaries.findIndex(m => m.id === customer.id);
            
            if (existingMercIdx > -1) {
                // Known mercenary: Increase affinity
                const merc = { ...newKnownMercenaries[existingMercIdx] };
                merc.affinity = Math.min(100, (merc.affinity || 0) + 2); // Gain 2 affinity
                merc.visitCount = (merc.visitCount || 0) + 1;
                merc.lastVisitDay = state.stats.day;
                newKnownMercenaries[existingMercIdx] = merc;
                logMessage = `Sold ${itemName} to ${customer.name}. Affinity rose to ${merc.affinity}.`;
            } else {
                // New mercenary: Add to list
                const newMerc: Mercenary = {
                    ...customer,
                    affinity: 2,
                    visitCount: 1,
                    lastVisitDay: state.stats.day
                };
                newKnownMercenaries.push(newMerc);
                logMessage = `Sold ${itemName} to ${customer.name}. (New Contact)`;
            }

            // 3. Clear Active Customer if this sale was for them
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
        // REMOVED FURNACE CHECK FOR TESTING
        // if (!state.forge.hasFurnace) {
        //     return {
        //         ...state,
        //         logs: ['You need a working furnace to open the shop!', ...state.logs]
        //     };
        // }
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

    // --- SHOP QUEUE ACTIONS ---
    case 'ENQUEUE_CUSTOMER': {
        const customer = action.payload;
        return {
            ...state,
            shopQueue: [...state.shopQueue, customer],
            visitorsToday: [...state.visitorsToday, customer.mercenary.id], // Mark as visited immediately
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

const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  // Use useMemo to ensure actions object reference remains stable unless necessary
  const actions = useMemo(() => ({
    cleanRubble: () => dispatch({ type: 'CLEAN_RUBBLE' }),
    repairItem: () => dispatch({ type: 'REPAIR_WORK' }),
    rest: () => dispatch({ type: 'ADVANCE_TIME' }),
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
    
    // Generic Item Consumption Helper
    consumeItem: (id: string, count: number) => dispatch({ type: 'PAY_COST', payload: { items: [{ id, count }] } }),

    // Shop Actions
    enqueueCustomer: (customer: ShopCustomer) => dispatch({ type: 'ENQUEUE_CUSTOMER', payload: customer }),
    nextCustomer: () => dispatch({ type: 'NEXT_CUSTOMER' }),
    dismissCustomer: () => dispatch({ type: 'DISMISS_CUSTOMER' }),
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
