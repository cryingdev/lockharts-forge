import { GameState, InventoryItem } from '../../types/index';
import { materials } from '../../data/materials';
import { Mercenary } from '../../models/Mercenary';
import { DUNGEON_CONFIG } from '../../config/dungeon-config';
import { SKILLS } from '../../data/skills';
import { JobClass } from '../../models/JobClass';
import { t } from '../../utils/i18n';
import { getLocalizedItemName } from '../../utils/itemText';

export const handleAcquireItem = (state: GameState, payload: { id: string; quantity: number }): GameState => {
    const { id, quantity } = payload;
    const language = state.settings.language;
    const itemDef = (materials as any)[id];
    if (!itemDef) return state;
    const localizedItemName = getLocalizedItemName(language, { id: itemDef.id, name: itemDef.name });

    const existingItem = state.inventory.find(i => i.id === id);
    const newInventory = existingItem
    ? state.inventory.map(i => i.id === id ? { ...i, quantity: i.quantity + quantity } : i)
    : [...state.inventory, { ...itemDef, quantity } as InventoryItem];

    return {
    ...state,
    inventory: newInventory,
    logs: [t(language, 'logs.acquired_item', { item: localizedItemName, quantity }), ...state.logs],
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
    const language = state.settings.language;
    
    const newGold = state.stats.gold - totalCost;
    if (newGold < 0) return state; 

    let newInventory = [...state.inventory];
    let newTierLevel = state.stats.tierLevel;
    let newForgeState = { ...state.forge };
    let logUpdates: string[] = [t(language, 'logs.bought_supplies', { gold: totalCost })];
    let newMarketStock = { ...state.marketStock };
    let newUnlockedTabs = [...state.unlockedTabs];

    if (!newUnlockedTabs.includes('INVENTORY')) {
        newUnlockedTabs.push('INVENTORY');
        logUpdates.unshift(t(language, 'logs.inventory_operational'));
    }

    items.forEach(buyItem => {
            // Update stock
            newMarketStock[buyItem.id] = Math.max(0, (newMarketStock[buyItem.id] || 0) - buyItem.count);

            if (buyItem.id === 'scroll_t2') {
                newTierLevel = Math.max(newTierLevel, 2);
                logUpdates.unshift(t(language, 'logs.market_tier_unlocked', { tier: 2 }));
                return; 
            }
            if (buyItem.id === 'scroll_t3') {
                newTierLevel = Math.max(newTierLevel, 3);
                logUpdates.unshift(t(language, 'logs.market_tier_unlocked', { tier: 3 }));
                return; 
            }
            if (buyItem.id === 'furnace') {
                newForgeState.hasFurnace = true;
                if (newTierLevel === 0) newTierLevel = 1; 
                logUpdates.unshift(t(language, 'logs.furnace_acquired'));
                return; 
            }
            if (buyItem.id === 'workbench') {
                newForgeState.hasWorkbench = true;
                logUpdates.unshift(t(language, 'logs.workbench_installed'));
                return;
            }
            if (buyItem.id === 'research_table') {
                newForgeState.hasResearchTable = true;
                if (!newUnlockedTabs.includes('RESEARCH')) {
                    newUnlockedTabs.push('RESEARCH');
                }
                logUpdates.unshift(t(language, 'logs.research_table_installed'));
                return;
            }
            const itemDef = (materials as any)[buyItem.id];
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
        logs: [...logUpdates, ...state.logs]
    };
};

/**
 * handleInstallFurnace
 * Sets the forge status to indicate a furnace is installed.
 */
export const handleInstallFurnace = (state: GameState): GameState => {
    const language = state.settings.language;
    return {
        ...state,
        forge: {
            ...state.forge,
            hasFurnace: true
        },
        logs: [t(language, 'logs.furnace_ready'), ...state.logs]
    };
};

export const handleSellItem = (state: GameState, payload: { itemId: string; count: number; price: number; equipmentInstanceId?: string; customer?: Mercenary }): GameState => {
    const { itemId, count, price, equipmentInstanceId, customer } = payload;
    const language = state.settings.language;
    
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
            itemName = getLocalizedItemName(language, {
                id: targetItem.equipmentData?.recipeId || targetItem.id,
                name: targetItem.name
            });
            
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
                itemName = getLocalizedItemName(language, {
                    id: item.equipmentData?.recipeId || item.id,
                    name: item.name
                });
                return { ...item, quantity: item.quantity - count };
            }
            return item;
        }).filter(i => i.quantity > 0);
    }

    if (customer) {
        const existingMercIdx = newKnownMercenaries.findIndex(m => m.id === customer.id);
        const isPipTutorial = (newTutorialStep === 'SELL_ITEM_GUIDE' || newTutorialStep === 'PIP_RETURN_GUIDE') && customer.id === 'pip_green';
        
        // 최종 호감도 상승량 결정 (기본 2 + 품질 보너스)
        const baseAffinityGain = isPipTutorial ? 10 : 2;
        const finalAffinityGain = Math.max(1, baseAffinityGain + qualityBonus);
        
        if (existingMercIdx > -1) {
            const merc = { ...newKnownMercenaries[existingMercIdx] };
            merc.affinity = Math.min(100, (merc.affinity || 0) + finalAffinityGain); 
            merc.visitCount = (merc.visitCount || 0) + 1;
            merc.lastVisitDay = state.stats.day;
            newKnownMercenaries[existingMercIdx] = merc;
            
            const qualityNote = qualityBonus > 0
                ? ` ${t(language, 'logs.sale_quality_bonus')}`
                : qualityBonus < 0
                    ? ` ${t(language, 'logs.sale_quality_penalty')}`
                    : '';
            logMessage = t(language, 'logs.sold_to_customer', { item: itemName, customer: customer.name, amount: finalAffinityGain }) + qualityNote;
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
            logMessage = t(language, 'logs.sold_to_customer_new', { item: itemName, customer: customer.name, amount: finalAffinityGain });
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
            newTutorialStep = 'PIP_PRAISE_DIALOG_GUIDE';
        }
    } else {
        logMessage = t(language, 'logs.sold_item_gold', { item: itemName, gold: price });
    }

    return {
        ...state,
        inventory: newInventory,
        stats: { 
            ...state.stats, 
            gold: state.stats.gold + price,
            totalSalesCount: state.stats.totalSalesCount + (isShopSale ? count : 0),
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

const POTION_EFFECTS: Record<string, Record<string, number | 'FULL'>> = {
    health: { small: 50, medium: 150, large: 400, huge: 'FULL' },
    mana: { small: 30, medium: 100, large: 250, huge: 'FULL' },
    stamina: { small: 25, medium: 50, large: 75, huge: 100 },
    energy: { small: 20, medium: 45, large: 75, huge: 100 }
};

export const handleUseItem = (state: GameState, payload: { itemId: string; mercenaryId?: string }): GameState => {
    const { itemId, mercenaryId } = payload;
    const inventoryItem = state.inventory.find(i => i.id === itemId);
    const language = state.settings.language;

    if (!inventoryItem || inventoryItem.quantity <= 0) return state;

    let newStats = { ...state.stats };
    let newUnlockedRecipes = [...(state.unlockedRecipes || [])];
    let newKnownMercenaries = [...state.knownMercenaries];
    let logMsg = '';
    let itemUsed = false;

    // --- Skill Scroll System ---
    if (inventoryItem.type === 'SKILL_SCROLL') {
        // UI에서 인챈트 모드를 트리거하기 위해 리듀서에서는 아무 동작도 하지 않습니다.
        return state;
    }

    // --- Skill Book System ---
    if (inventoryItem.type === 'SKILL_BOOK' && inventoryItem.skillId && mercenaryId) {
        const mercIdx = newKnownMercenaries.findIndex(m => m.id === mercenaryId);
        if (mercIdx > -1) {
            const merc = { ...newKnownMercenaries[mercIdx] };
            const skill = SKILLS[inventoryItem.skillId];
            if (!skill) return state;

            // Check if already learned
            if (merc.skillIds?.includes(inventoryItem.skillId)) {
                return { ...state, toastQueue: [...state.toastQueue, t(language, 'inventory.skill_known', { name: merc.name, skill: skill.name })] };
            }

            // Check job compatibility (empty job list means universal, NOVICE in job list means any job can learn)
            const isCompatible = skill.job.length === 0 || skill.job.includes(merc.job) || skill.job.includes(JobClass.NOVICE);
            if (!isCompatible) {
                return { ...state, toastQueue: [...state.toastQueue, t(language, 'inventory.skill_incompatible', { name: merc.name })] };
            }

            merc.skillIds = [...(merc.skillIds || []), inventoryItem.skillId];
            logMsg = t(language, 'logs.learned_skill', {
                name: merc.name,
                item: getLocalizedItemName(language, { id: inventoryItem.id, name: inventoryItem.name }),
                skill: skill.name
            });
            itemUsed = true;
            newKnownMercenaries[mercIdx] = merc;
        }
    }

    // --- Unified Potion System ---
    if (!itemUsed && itemId.startsWith('potion_')) {
        const parts = itemId.split('_'); // potion, type, size
        const type = parts[1];
        const size = parts[2];
        const recoverValue = POTION_EFFECTS[type]?.[size];

        if (recoverValue === undefined) return state;

        if (type === 'energy') {
            if (mercenaryId) {
                const mercIdx = newKnownMercenaries.findIndex(m => m.id === mercenaryId);
                if (mercIdx > -1) {
                    const merc = { ...newKnownMercenaries[mercIdx] };
                    if (merc.currentHp >= merc.maxHp && merc.currentMp >= merc.maxMp) {
                        return { ...state, toastQueue: [...state.toastQueue, t(language, 'inventory.full_vitals', { name: merc.name })] };
                    }
                    const amount = recoverValue === 'FULL' ? Math.max(merc.maxHp, merc.maxMp) : (recoverValue as number);
                    merc.currentHp = Math.min(merc.maxHp, merc.currentHp + amount);
                    merc.currentMp = Math.min(merc.maxMp, merc.currentMp + amount);
                    logMsg = t(language, 'logs.recovered_hp_mp', {
                        name: merc.name,
                        item: getLocalizedItemName(language, { id: inventoryItem.id, name: inventoryItem.name }),
                        amount
                    });
                    itemUsed = true;
                    newKnownMercenaries[mercIdx] = merc;
                }
            } else {
                return { ...state, toastQueue: [...state.toastQueue, t(language, 'inventory.potion_target_required')] };
            }
        } else if (mercenaryId) {
            const mercIdx = newKnownMercenaries.findIndex(m => m.id === mercenaryId);
            if (mercIdx > -1) {
                const merc = { ...newKnownMercenaries[mercIdx] };
                if (type === 'health') {
                    if (merc.currentHp >= merc.maxHp) {
                        return { ...state, toastQueue: [...state.toastQueue, t(language, 'inventory.full_health', { name: merc.name })] };
                    }
                    const amount = recoverValue === 'FULL' ? merc.maxHp : (recoverValue as number);
                    merc.currentHp = Math.min(merc.maxHp, merc.currentHp + amount);
                    logMsg = t(language, 'logs.recovered_hp', {
                        name: merc.name,
                        item: getLocalizedItemName(language, { id: inventoryItem.id, name: inventoryItem.name }),
                        amount
                    });
                    itemUsed = true;
                } else if (type === 'mana') {
                    if (merc.currentMp >= merc.maxMp) {
                        return { ...state, toastQueue: [...state.toastQueue, t(language, 'inventory.full_mana', { name: merc.name })] };
                    }
                    const amount = recoverValue === 'FULL' ? merc.maxMp : (recoverValue as number);
                    merc.currentMp = Math.min(merc.maxMp, merc.currentMp + amount);
                    logMsg = t(language, 'logs.recovered_mp', {
                        name: merc.name,
                        item: getLocalizedItemName(language, { id: inventoryItem.id, name: inventoryItem.name }),
                        amount
                    });
                    itemUsed = true;
                } else if (type === 'stamina') {
                    if ((merc.expeditionEnergy || 0) >= DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY) {
                        return { ...state, toastQueue: [...state.toastQueue, t(language, 'inventory.full_stamina', { name: merc.name })] };
                    }
                    const amount = typeof recoverValue === 'number' ? recoverValue : 100;
                    merc.expeditionEnergy = Math.min(DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY, (merc.expeditionEnergy || 0) + amount);
                    logMsg = t(language, 'logs.recovered_stamina', {
                        name: merc.name,
                        item: getLocalizedItemName(language, { id: inventoryItem.id, name: inventoryItem.name }),
                        amount
                    });
                    itemUsed = true;
                }
                newKnownMercenaries[mercIdx] = merc;
            }
        }
    }

    if (!itemUsed) return state;

    const newInventory = state.inventory.map(item => {
        if (item.id === itemId) {
            return { ...item, quantity: item.quantity - 1 };
        }
        return item;
    }).filter(i => i.quantity > 0);

    const mercBefore = mercenaryId ? state.knownMercenaries.find(m => m.id === mercenaryId) : null;
    const wasInjured = mercBefore?.status === 'INJURED';

    return {
        ...state,
        stats: newStats,
        inventory: newInventory,
        unlockedRecipes: newUnlockedRecipes,
        knownMercenaries: newKnownMercenaries,
        commission: {
            ...state.commission,
            hasSeenRecoveryFlow: state.commission.hasSeenRecoveryFlow || (itemUsed && wasInjured)
        },
        logs: [logMsg, ...state.logs]
    };
};

export const handleApplySkillScroll = (state: GameState, payload: { scrollItemId: string; targetEquipmentId: string }): GameState => {
    const { scrollItemId, targetEquipmentId } = payload;
    const language = state.settings.language;
    const scroll = state.inventory.find(i => i.id === scrollItemId);
    const target = state.inventory.find(i => i.id === targetEquipmentId);

    if (!scroll || !target || !scroll.skillId || target.type !== 'EQUIPMENT' || !target.equipmentData) {
        return state;
    }

    const skill = SKILLS[scroll.skillId];
    if (!skill) return state;

    // 1. 소모 및 적용 처리
    const newInventory = state.inventory.map(item => {
        if (item.id === scrollItemId) {
            return { ...item, quantity: item.quantity - 1 };
        }
        if (item.id === targetEquipmentId) {
            return { 
                ...item, 
                equipmentData: { 
                    ...item.equipmentData!, 
                    socketedSkillId: scroll.skillId 
                } 
            };
        }
        return item;
    }).filter(i => i.quantity > 0);

    return {
        ...state,
        inventory: newInventory,
        logs: [t(language, 'logs.imbued_skill', {
            item: getLocalizedItemName(language, { id: target.equipmentData?.recipeId || target.id, name: target.name }),
            skill: skill.name
        }), ...state.logs]
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
