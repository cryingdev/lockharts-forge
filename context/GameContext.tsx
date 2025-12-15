
import React, { createContext, useContext, useReducer, ReactNode, useMemo, useEffect } from 'react';
import { GameState, GameContextType, InventoryItem, GameEvent, EquipmentItem, ShopCustomer, DungeonResult } from '../types/index';
import { GAME_CONFIG } from '../config/game-config';
import { MASTERY_THRESHOLDS } from '../config/mastery-config';
import { CONTRACT_CONFIG, calculateDailyWage } from '../config/contract-config';
import { DUNGEON_CONFIG } from '../config/dungeon-config';
import { DUNGEONS } from '../data/dungeons';
import { createInitialGameState } from '../state/initial-game-state';
import { MATERIALS } from '../data/materials';
import { Equipment, EquipmentRarity, EquipmentType, EquipmentStats } from '../models/Equipment';
import { Mercenary } from '../models/Mercenary';
import { Expedition } from '../models/Dungeon';
import { calculateMaxHp, calculateMaxMp } from '../models/Stats';

const GameContext = createContext<GameContextType | undefined>(undefined);

type Action =
  | { type: 'REPAIR_WORK' }
  | { type: 'SLEEP' }        
  | { type: 'CONFIRM_SLEEP' } 
  | { type: 'TRIGGER_EVENT'; payload: GameEvent }
  | { type: 'CLOSE_EVENT' }
  | { type: 'ACQUIRE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'PAY_COST'; payload: { gold?: number; items?: { id: string; count: number }[] } }
  | { type: 'BUY_MARKET_ITEMS'; payload: { items: { id: string; count: number }[]; totalCost: number } }
  | { type: 'INSTALL_FURNACE' }
  | { type: 'START_CRAFTING'; payload: { item: EquipmentItem } }
  | { type: 'CANCEL_CRAFTING'; payload: { item: EquipmentItem } }
  | { type: 'FINISH_CRAFTING'; payload: { item: EquipmentItem; quality: number } }
  | { type: 'SELL_ITEM'; payload: { itemId: string; count: number; price: number; equipmentInstanceId?: string; customer?: Mercenary } }
  | { type: 'TOGGLE_SHOP' }
  | { type: 'ADD_KNOWN_MERCENARY'; payload: Mercenary }
  | { type: 'ENQUEUE_CUSTOMER'; payload: ShopCustomer }
  | { type: 'NEXT_CUSTOMER' }
  | { type: 'DISMISS_CUSTOMER' }
  | { type: 'SET_CRAFTING'; payload: boolean }
  | { type: 'UPDATE_FORGE_STATUS'; payload: { temp: number } }
  | { type: 'TOGGLE_JOURNAL' }
  | { type: 'HIRE_MERCENARY'; payload: { mercenaryId: string; cost: number } }
  | { type: 'FIRE_MERCENARY'; payload: { mercenaryId: string } }
  | { type: 'START_EXPEDITION'; payload: { dungeonId: string; partyIds: string[] } }
  | { type: 'COMPLETE_EXPEDITION'; payload: { expeditionId: string } }
  | { type: 'CLAIM_EXPEDITION'; payload: { expeditionId: string } }
  | { type: 'DISMISS_DUNGEON_RESULT' };

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

const getEnergyCost = (item: EquipmentItem, masteryCount: number) => {
    let energyCost = GAME_CONFIG.ENERGY_COST.CRAFT;
    if (masteryCount >= MASTERY_THRESHOLDS.ARTISAN) {
        energyCost -= MASTERY_THRESHOLDS.ARTISAN_BONUS.energyDiscount;
    }
    return energyCost;
};

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'REPAIR_WORK': {
      if (state.stats.energy < GAME_CONFIG.ENERGY_COST.REPAIR) return state;
      
      const earn = 15;
      return {
        ...state,
        stats: { 
          ...state.stats, 
          energy: state.stats.energy - GAME_CONFIG.ENERGY_COST.REPAIR,
          gold: state.stats.gold + earn,
          incomeToday: state.stats.incomeToday + earn,
        },
        logs: [`Performed cold repairs for a neighbor. Gold +${earn}. Energy -${GAME_CONFIG.ENERGY_COST.REPAIR}.`, ...state.logs],
      };
    }

    case 'SLEEP': {
        return { ...state, showSleepModal: true };
    }

    case 'CONFIRM_SLEEP': {
        const hiredMercs = state.knownMercenaries.filter(m => m.isHired);
        let totalWages = 0;
        hiredMercs.forEach(merc => {
            totalWages += calculateDailyWage(merc.level, merc.job);
        });

        const nextDay = state.stats.day + 1;
        const newGold = state.stats.gold - totalWages;

        // --- Mercenary Energy Recovery ---
        // Mercenaries currently on expedition do NOT recover energy
        const activeMercIds = new Set<string>();
        state.activeExpeditions.forEach(exp => {
            if (exp.status === 'ACTIVE') {
                 exp.partyIds.forEach(id => activeMercIds.add(id));
            }
        });

        const updatedMercenaries = state.knownMercenaries.map(merc => {
            if (merc.isHired && !activeMercIds.has(merc.id)) {
                return {
                    ...merc,
                    expeditionEnergy: Math.min(DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY, (merc.expeditionEnergy || 0) + DUNGEON_CONFIG.DAILY_ENERGY_RECOVERY)
                };
            }
            return merc;
        });

        let logMsg = `Day ${nextDay} begins. You feel refreshed.`;
        if (totalWages > 0) logMsg = `Day ${nextDay} begins. Paid ${totalWages} G in wages. Balance: ${newGold} G.`;
        if (newGold < 0) logMsg = `Day ${nextDay} begins. You are in debt! (${newGold} G).`;

        return {
            ...state,
            stats: {
                ...state.stats,
                day: nextDay,
                gold: newGold,
                energy: state.stats.maxEnergy,
                incomeToday: 0,
            },
            knownMercenaries: updatedMercenaries,
            forge: { ...state.forge, isShopOpen: false },
            visitorsToday: [],
            activeCustomer: null,
            shopQueue: [],
            isCrafting: false,
            showSleepModal: false,
            logs: [logMsg, ...state.logs],
            forgeTemperature: 0,
            lastForgeTime: Date.now(),
        };
    }

    case 'SET_CRAFTING': {
        return { ...state, isCrafting: action.payload };
    }

    case 'UPDATE_FORGE_STATUS': {
        return {
            ...state,
            forgeTemperature: action.payload.temp,
            lastForgeTime: Date.now()
        };
    }

    case 'TOGGLE_JOURNAL': {
        return { ...state, showJournal: !state.showJournal };
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
    
    // --- CRAFTING ACTIONS ---
    case 'START_CRAFTING': {
        const { item } = action.payload;
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
    }

    case 'CANCEL_CRAFTING': {
        const { item } = action.payload;
        // Refund logic
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
    }

    case 'FINISH_CRAFTING': {
        const { item, quality } = action.payload;
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
                    lastVisitDay: state.stats.day,
                    expeditionEnergy: DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
                    currentXp: 0,
                    xpToNextLevel: 100
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
    }

    case 'TOGGLE_SHOP':
        if (state.stats.energy < GAME_CONFIG.ENERGY_COST.OPEN_SHOP && !state.forge.isShopOpen) {
            return { ...state, logs: ['Not enough energy to prepare the shop.', ...state.logs] };
        }
        const willOpen = !state.forge.isShopOpen;
        const shopCost = willOpen ? GAME_CONFIG.ENERGY_COST.OPEN_SHOP : 0;
        return {
            ...state,
            stats: { ...state.stats, energy: state.stats.energy - shopCost },
            forge: { ...state.forge, isShopOpen: willOpen },
            logs: [willOpen ? 'Shop is now OPEN.' : 'Shop is now CLOSED.', ...state.logs]
        };

    case 'ADD_KNOWN_MERCENARY': {
        const merc = action.payload;
        if (state.knownMercenaries.some(m => m.id === merc.id)) return state;
        // Ensure new merc has energy and XP
        const mercWithData = { 
            ...merc, 
            expeditionEnergy: merc.expeditionEnergy ?? DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
            currentXp: merc.currentXp ?? 0,
            xpToNextLevel: merc.xpToNextLevel ?? (merc.level * 100)
        };
        return {
            ...state,
            knownMercenaries: [...state.knownMercenaries, mercWithData],
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
        return { ...state, shopQueue: remaining, activeCustomer: next };
    }

    case 'DISMISS_CUSTOMER': {
        return {
            ...state,
            activeCustomer: null,
            logs: state.activeCustomer ? [`${state.activeCustomer.mercenary.name} left the shop.`] : state.logs
        };
    }

    case 'HIRE_MERCENARY': {
        const { mercenaryId, cost } = action.payload;
        if (state.stats.gold < cost) return state;
        const updatedMercenaries = state.knownMercenaries.map(m => {
            if (m.id === mercenaryId) return { ...m, isHired: true };
            return m;
        });
        const hiredMerc = updatedMercenaries.find(m => m.id === mercenaryId);
        const name = hiredMerc ? hiredMerc.name : 'Mercenary';
        return {
            ...state,
            stats: { ...state.stats, gold: state.stats.gold - cost },
            knownMercenaries: updatedMercenaries,
            logs: [`Contract signed! ${name} has joined your service. -${cost} G`, ...state.logs]
        };
    }

    case 'FIRE_MERCENARY': {
        const { mercenaryId } = action.payload;
        const updatedMercenaries = state.knownMercenaries.map(m => {
            if (m.id === mercenaryId) return { ...m, isHired: false };
            return m;
        });
        const firedMerc = updatedMercenaries.find(m => m.id === mercenaryId);
        const name = firedMerc ? firedMerc.name : 'Mercenary';
        return {
            ...state,
            knownMercenaries: updatedMercenaries,
            logs: [`Contract terminated. ${name} is no longer in your service.`, ...state.logs]
        };
    }

    case 'START_EXPEDITION': {
        const { dungeonId, partyIds } = action.payload;
        const dungeon = DUNGEONS.find(d => d.id === dungeonId);
        if (!dungeon) return state;

        // Deduct Energy from Mercenaries
        const updatedMercenaries = state.knownMercenaries.map(merc => {
            if (partyIds.includes(merc.id)) {
                return {
                    ...merc,
                    expeditionEnergy: Math.max(0, (merc.expeditionEnergy || 0) - dungeon.energyCost)
                };
            }
            return merc;
        });

        // Create Expedition Entry
        const newExpedition: Expedition = {
            id: `exp_${Date.now()}`,
            dungeonId: dungeon.id,
            partyIds: partyIds,
            startTime: Date.now(),
            endTime: Date.now() + (dungeon.durationMinutes * 60 * 1000), // * 60 for minutes
            status: 'ACTIVE'
        };

        return {
            ...state,
            knownMercenaries: updatedMercenaries,
            activeExpeditions: [...state.activeExpeditions, newExpedition],
            logs: [`Expedition sent to ${dungeon.name}.`, ...state.logs]
        };
    }

    case 'COMPLETE_EXPEDITION': {
        const { expeditionId } = action.payload;
        const expedition = state.activeExpeditions.find(e => e.id === expeditionId);
        
        // Safety check: only complete if currently active
        if (!expedition || expedition.status !== 'ACTIVE') return state;

        const dungeon = DUNGEONS.find(d => d.id === expedition.dungeonId);
        const dungeonName = dungeon ? dungeon.name : 'Unknown';

        // Update status to COMPLETED
        const updatedExpeditions = state.activeExpeditions.map(exp => {
            if (exp.id === expeditionId) {
                return { ...exp, status: 'COMPLETED' as const };
            }
            return exp;
        });

        return {
            ...state,
            activeExpeditions: updatedExpeditions,
            logs: [`Expedition to ${dungeonName} is ready for return.`, ...state.logs]
        };
    }

    case 'CLAIM_EXPEDITION': {
        const { expeditionId } = action.payload;
        const expedition = state.activeExpeditions.find(e => e.id === expeditionId);
        if (!expedition) return state;

        const dungeon = DUNGEONS.find(d => d.id === expedition.dungeonId);
        if (!dungeon) return state;

        // 1. Generate Rewards (Items)
        const gainedItems: { id: string, count: number, name: string }[] = [];
        let newInventory = [...state.inventory];

        dungeon.rewards.forEach(reward => {
             if (Math.random() <= reward.chance) {
                 const quantity = Math.floor(Math.random() * (reward.maxQuantity - reward.minQuantity + 1)) + reward.minQuantity;
                 if (quantity > 0) {
                     const materialDef = Object.values(MATERIALS).find(m => m.id === reward.itemId);
                     if (materialDef) {
                         const existingItem = newInventory.find(i => i.id === reward.itemId);
                         if (existingItem) {
                             newInventory = newInventory.map(i => i.id === reward.itemId ? { ...i, quantity: i.quantity + quantity } : i);
                         } else {
                             newInventory.push({ ...materialDef, quantity } as InventoryItem);
                         }
                         gainedItems.push({ id: reward.itemId, count: quantity, name: materialDef.name });
                     }
                 }
             }
        });

        // 2. XP & Level Up
        const mercenaryResults: DungeonResult['mercenaryResults'] = [];
        let newKnownMercenaries = [...state.knownMercenaries];

        newKnownMercenaries = newKnownMercenaries.map(merc => {
            if (expedition.partyIds.includes(merc.id)) {
                let xpToAdd = dungeon.baseXp || 50;
                let currentXp = merc.currentXp || 0;
                let xpToNext = merc.xpToNextLevel || (merc.level * 100);
                let level = merc.level;
                const levelBefore = level;

                currentXp += xpToAdd;

                // Level Up Logic
                while (currentXp >= xpToNext) {
                    currentXp -= xpToNext;
                    level++;
                    xpToNext = level * 100; // Curve: Level * 100
                }

                // Recalculate Stats if Leveled Up
                let stats = { ...merc.stats };
                let maxHp = merc.maxHp;
                let maxMp = merc.maxMp;
                let currentHp = merc.currentHp;
                
                if (level > levelBefore) {
                    maxHp = calculateMaxHp(stats, level);
                    maxMp = calculateMaxMp(stats, level);
                    currentHp = maxHp; // Full heal on level up?
                }

                mercenaryResults.push({
                    id: merc.id,
                    name: merc.name,
                    job: merc.job,
                    levelBefore,
                    levelAfter: level,
                    xpGained: xpToAdd,
                    currentXp: currentXp,
                    xpToNext: xpToNext
                });

                return {
                    ...merc,
                    level,
                    currentXp,
                    xpToNextLevel: xpToNext,
                    maxHp,
                    maxMp,
                    currentHp
                };
            }
            return merc;
        });

        // 3. Update Clear Count & Remove Expedition
        const newClearCounts = { ...state.dungeonClearCounts };
        newClearCounts[dungeon.id] = (newClearCounts[dungeon.id] || 0) + 1;
        const remainingExpeditions = state.activeExpeditions.filter(e => e.id !== expeditionId);

        // 4. Build Result Object for Modal
        const resultData: DungeonResult = {
            dungeonName: dungeon.name,
            rewards: gainedItems,
            mercenaryResults
        };

        const logStr = gainedItems.length > 0 
            ? `Returned from ${dungeon.name}. Gained: ${gainedItems.map(i => `${i.name} x${i.count}`).join(', ')}`
            : `Returned from ${dungeon.name}. No loot found.`;

        return {
            ...state,
            inventory: newInventory,
            knownMercenaries: newKnownMercenaries,
            activeExpeditions: remainingExpeditions,
            dungeonClearCounts: newClearCounts,
            dungeonResult: resultData, // Triggers Modal
            logs: [logStr, ...state.logs]
        };
    }

    case 'DISMISS_DUNGEON_RESULT': {
        return { ...state, dungeonResult: null };
    }

    default:
      return state;
  }
};

const GameProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);

  const actions = useMemo(() => ({
    repairItem: () => dispatch({ type: 'REPAIR_WORK' }),
    rest: () => dispatch({ type: 'SLEEP' }), 
    confirmSleep: () => dispatch({ type: 'CONFIRM_SLEEP' }),
    handleEventOption: (action: () => void) => {
      action();
      dispatch({ type: 'CLOSE_EVENT' });
    },
    closeEvent: () => dispatch({ type: 'CLOSE_EVENT' }),
    
    // New Split Crafting Flow
    startCrafting: (item: EquipmentItem) => dispatch({ type: 'START_CRAFTING', payload: { item } }),
    cancelCrafting: (item: EquipmentItem) => dispatch({ type: 'CANCEL_CRAFTING', payload: { item } }),
    finishCrafting: (item: EquipmentItem, quality: number) => dispatch({ type: 'FINISH_CRAFTING', payload: { item, quality } }),
    craftItem: (item: EquipmentItem, quality: number) => dispatch({ type: 'FINISH_CRAFTING', payload: { item, quality } }), // Backwards compatibility if needed, but better to migrate

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

    hireMercenary: (mercenaryId: string, cost: number) => dispatch({ type: 'HIRE_MERCENARY', payload: { mercenaryId, cost } }),
    fireMercenary: (mercenaryId: string) => dispatch({ type: 'FIRE_MERCENARY', payload: { mercenaryId } }),

    startExpedition: (dungeonId: string, partyIds: string[]) => dispatch({ type: 'START_EXPEDITION', payload: { dungeonId, partyIds } }),
    completeExpedition: (expeditionId: string) => dispatch({ type: 'COMPLETE_EXPEDITION', payload: { expeditionId } }),
    claimExpedition: (expeditionId: string) => dispatch({ type: 'CLAIM_EXPEDITION', payload: { expeditionId } }),
    dismissDungeonResult: () => dispatch({ type: 'DISMISS_DUNGEON_RESULT' }),

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
