import { GameState, ContractDefinition, ContractSource, BoardIssuerProfile, GeneralContractKind } from '../../types/game-state';
import { InventoryItem } from '../../types/inventory';
import { ShopCustomer } from '../../types/shop';
import { NAMED_CONTRACT_REGISTRY } from '../../data/contracts/namedContracts';
import { NAMED_MERCENARIES } from '../../data/mercenaries';
import { EQUIPMENT_ITEMS } from '../../data/equipment';
import { BOARD_ISSUER_PROFILES } from '../../data/contracts/boardIssuers';
import { materials } from '../../data/materials';
import { DUNGEONS } from '../../data/dungeons';
import { rng } from '../../utils/random';

export const isNamedMercenaryEligible = (state: GameState, entry: any): boolean => {
    const stateInfo = state.commission.namedEncounters[entry.mercenaryId];
    if (!stateInfo || stateInfo.unlocked || stateInfo.recruitUnlocked) return false;

    if ((stateInfo.declinedUntilDay || 0) > state.stats.day) return false;

    const hasActiveContract = state.commission.activeContracts.some(c => c.mercenaryId === entry.mercenaryId);
    if (hasActiveContract) return false;
    
    // Check unlock conditions
    const rule = entry.unlockRule;
    
    // Tutorial check: If rule says tutorialCompleted, check if tutorial is finished
    if (rule.tutorialCompleted && state.tutorialStep !== null) return false;
    
    if (rule.minDay && state.stats.day < rule.minDay) return false;
    if (rule.minTier && state.stats.tierLevel < rule.minTier) return false;
    
    if (rule.requiredItemIds) {
        const hasItems = rule.requiredItemIds.every((id: string) => 
            state.inventory.some(inv => inv.id === id && inv.quantity > 0)
        );
        if (!hasItems) return false;
    }
    
    if (rule.requiredRecipeIds) {
        const hasRecipes = rule.requiredRecipeIds.every((id: string) => 
            state.unlockedRecipes.includes(id)
        );
        if (!hasRecipes) return false;
    }

    if (rule.requireInjuredMercenary && !state.commission.hasHadInjuredMercenary) {
        return false;
    }

    if (rule.requireRecoveryFlowSeen && !state.commission.hasSeenRecoveryFlow) {
        return false;
    }

    if (stateInfo.daysEligible !== undefined && entry.encounterRule.encounterWindowDays) {
        const maxEligibleDays = Math.max(
            entry.encounterRule.encounterWindowDays,
            entry.encounterRule.guaranteeAfterDays || 0
        );

        if (stateInfo.daysEligible > maxEligibleDays) {
            return false;
        }
    }
    
    if (rule.requiredSalesCount && state.stats.totalSalesCount < rule.requiredSalesCount) {
        return false;
    }

    if (rule.requiredDungeonIds && rule.requiredDungeonIds.length > 0) {
        const allCleared = rule.requiredDungeonIds.every((id: string) => (state.dungeonClearCounts[id] || 0) > 0);
        if (!allCleared) return false;
    }

    return true;
};

const getContractMatchingItems = (inventory: InventoryItem[], itemId: string, acceptedTags?: string[], minQuality?: number) => {
    return inventory.filter(inv => {
        const recipeId = inv.equipmentData?.recipeId;
        const inventoryTags = inv.tags || [];
        const quality = inv.equipmentData?.quality ?? inv.quality ?? 0;

        const idMatch = inv.id === itemId || recipeId === itemId;
        const tagMatch = !!acceptedTags && acceptedTags.some(tag => inventoryTags.includes(tag));
        const qualityMatch = minQuality === undefined || quality >= minQuality;

        return (idMatch || tagMatch) && qualityMatch;
    });
};

export const handleTriggerNamedEncounterCheck = (state: GameState, location: string): GameState => {
    // Prevent shop encounters if the shop is not open
    if (location === 'SHOP' && !state.forge.isShopOpen) {
        return state;
    }

    const pipRegistryEntry = NAMED_CONTRACT_REGISTRY.find(entry => entry.mercenaryId === 'pip_green');

    // 0. Day 3 Formal Contract Dialogue for Pip (Special Progression)
    if (state.stats.day >= 3 && (location === 'SHOP' || location === 'TAVERN')) {
        const pipState = state.commission.namedEncounters['pip_green'];
        const hasPipContract = state.commission.activeContracts.some(c => c.mercenaryId === 'pip_green');
        const isPipHired = state.knownMercenaries.some(m => m.id === 'pip_green' && ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(m.status));
        
        if (pipRegistryEntry && pipState && pipState.hasAppeared && !pipState.recruitUnlocked && !hasPipContract && !isPipHired && !state.activeDialogue) {
            const pipMerc = state.knownMercenaries.find(m => m.id === 'pip_green');
            if (pipMerc) {
                return {
                    ...state,
                    activeDialogue: {
                        speaker: 'Pip the Green',
                        text: "I've been watching you work, and I'm impressed. I'd like to offer a formal contract. If you can provide me with a high-quality Bronze Shortsword, I'll join your squad permanently.",
                        options: [
                            { 
                                label: "I accept.", 
                                action: { type: 'ACCEPT_CONTRACT', payload: { contractId: pipRegistryEntry.contractId } },
                                variant: 'primary',
                                targetTab: 'FORGE'
                            },
                            { 
                                label: "Maybe later.", 
                                action: { type: 'SET_DIALOGUE', payload: null },
                                variant: 'neutral'
                            }
                        ]
                    }
                };
            }
        }
    }

    if (state.commission.activeContracts.some(c => c.type === 'SPECIAL')) {
        return state;
    }

    if (state.commission.lastEncounterCheckDayByLocation?.[location as ContractSource] === state.stats.day) {
        return state;
    }

    // 1. Find eligible named mercenaries for this location
    const eligibleEntries = NAMED_CONTRACT_REGISTRY.filter(entry => {
        if (entry.encounterRule.location !== location) return false;
        return isNamedMercenaryEligible(state, entry);
    });

    if (eligibleEntries.length === 0) {
        return {
            ...state,
            commission: {
                ...state.commission,
                lastEncounterCheckDayByLocation: {
                    ...state.commission.lastEncounterCheckDayByLocation,
                    [location]: state.stats.day
                }
            }
        };
    }

    // 2. Roll for appearance or check guarantee
    let triggeredEntry = null;
    const newNamedEncounters = { ...state.commission.namedEncounters };

    for (const entry of eligibleEntries) {
        const stateInfo = state.commission.namedEncounters[entry.mercenaryId];
        const daysSinceEligible = stateInfo.daysEligible || 0;
        
        const isGuaranteed = entry.encounterRule.guaranteeAfterDays && daysSinceEligible >= entry.encounterRule.guaranteeAfterDays;
        const roll = rng.next();
        
        if (isGuaranteed || roll < entry.encounterRule.appearanceChance) {
            triggeredEntry = entry;
            break;
        }
    }

    if (!triggeredEntry) {
        return state;
    }

    // 3. Trigger the encounter
    newNamedEncounters[triggeredEntry.mercenaryId] = {
        ...newNamedEncounters[triggeredEntry.mercenaryId],
        hasAppeared: true,
    };

    const mercenaryData = NAMED_MERCENARIES.find(m => m.id === triggeredEntry.mercenaryId);
    let newKnownMercenaries = [...state.knownMercenaries];
    let newShopQueue = [...state.shopQueue];
    let newVisitorsToday = [...state.visitorsToday];

    if (mercenaryData) {
        if (!newKnownMercenaries.some(m => m.id === triggeredEntry.mercenaryId)) {
            newKnownMercenaries.push({
                ...mercenaryData,
                status: 'ENCOUNTERED'
            });
        }

        // Special case for SHOP encounter: add to queue as customer
        if (location === 'SHOP') {
            const customer: ShopCustomer = {
                id: `customer_named_${triggeredEntry.mercenaryId}_${state.stats.day}`,
                mercenary: mercenaryData,
                request: {
                    type: 'EQUIPMENT',
                    requestedId: triggeredEntry.requirements[0].itemId,
                    price: 100, // Placeholder price
                    markup: 1.25,
                    dialogue: triggeredEntry.encounterDialogue.text
                },
                entryTime: Date.now()
            };
            newShopQueue.push(customer);
            newVisitorsToday.push(mercenaryData.id);
        }
    }

    // On Day 1-2, Pip doesn't offer a contract yet, just visits.
    if (triggeredEntry.mercenaryId === 'pip_green' && state.stats.day < 3) {
        return {
            ...state,
            knownMercenaries: newKnownMercenaries,
            shopQueue: newShopQueue,
            visitorsToday: newVisitorsToday,
            commission: {
                ...state.commission,
                namedEncounters: newNamedEncounters,
                lastEncounterCheckDayByLocation: {
                    ...state.commission.lastEncounterCheckDayByLocation,
                    [location]: state.stats.day
                }
            },
            logs: [...state.logs, `A special visitor has appeared: ${triggeredEntry.displayName}!`]
        };
    }

    return {
        ...state,
        knownMercenaries: newKnownMercenaries,
        shopQueue: newShopQueue,
        visitorsToday: newVisitorsToday,
        commission: {
            ...state.commission,
            namedEncounters: newNamedEncounters,
            lastEncounterCheckDayByLocation: {
                ...state.commission.lastEncounterCheckDayByLocation,
                [location]: state.stats.day
            }
        },
        activeDialogue: {
            speaker: triggeredEntry.encounterDialogue.speaker,
            text: triggeredEntry.encounterDialogue.text,
            options: [
                { 
                    label: "I'll see what I can do.", 
                    variant: 'primary',
                    action: { type: 'ACCEPT_CONTRACT', payload: { contractId: triggeredEntry.contractId } },
                    targetTab: 'FORGE'
                },
                {
                    label: "Maybe later.",
                    variant: 'neutral',
                    action: { type: 'DECLINE_CONTRACT', payload: { mercenaryId: triggeredEntry.mercenaryId } }
                }
            ]
        },
        logs: [...state.logs, `A special visitor has appeared: ${triggeredEntry.displayName}!`]
    };
};

export const handleAcceptContract = (state: GameState, payload: { contractId: string }): GameState => {
    const { contractId } = payload;
    
    // 1. Check if it's a Special Contract from registry (Legacy/Special flow)
    const registryEntry = NAMED_CONTRACT_REGISTRY.find(r => r.contractId === contractId);
    
    if (registryEntry) {
        // Check if already active
        if (state.commission.activeContracts.some(c => c.id === contractId && c.status === 'ACTIVE')) return state;

        const contract: ContractDefinition = {
            id: registryEntry.contractId,
            mercenaryId: registryEntry.mercenaryId,
            title: `Special Request: ${registryEntry.displayName}`,
            clientName: registryEntry.displayName,
            description: `A special request from ${registryEntry.displayName}. Complete it to earn their trust.`,
            type: 'SPECIAL',
            status: 'ACTIVE',
            source: registryEntry.encounterRule.location as any, 
            requirements: registryEntry.requirements,
            rewards: registryEntry.rewards,
            deadlineDay: state.stats.day + 7,
            daysRemaining: 7, 
        };

        const newNamedEncounters = { ...state.commission.namedEncounters };
        newNamedEncounters[registryEntry.mercenaryId] = {
            ...newNamedEncounters[registryEntry.mercenaryId],
            unlocked: true,
            recruitUnlocked: newNamedEncounters[registryEntry.mercenaryId].recruitUnlocked,
        };

        const newKnownMercenaries = state.knownMercenaries.map(m => 
            m.id === registryEntry.mercenaryId ? { ...m, status: 'CONTRACT_ACTIVE' as const } : m
        );

        return {
            ...state,
            knownMercenaries: newKnownMercenaries,
            commission: {
                ...state.commission,
                activeContracts: [...state.commission.activeContracts.filter(c => c.id !== contractId), contract],
                namedEncounters: {
                    ...newNamedEncounters,
                    [registryEntry.mercenaryId]: {
                        ...newNamedEncounters[registryEntry.mercenaryId],
                        specialContractId: registryEntry.contractId,
                        declinedUntilDay: 0
                    }
                }
            },
            logs: [...state.logs, `Accepted special contract: ${contract.title}.`]
        };
    }

    // 2. Check if it's a General Contract already in activeContracts as OFFERED
    const offeredContract = state.commission.activeContracts.find(c => c.id === contractId && c.status === 'OFFERED');
    if (!offeredContract) return state;

    // Check slot limit for general contracts
    const activeGeneralCount = state.commission.activeContracts.filter(c => c.type === 'GENERAL' && c.status === 'ACTIVE').length;
    if (activeGeneralCount >= 3) {
        return {
            ...state,
            logs: [...state.logs, "You cannot accept more than 3 general contracts at once."]
        };
    }

    const newActiveContracts = state.commission.activeContracts.map(c => 
        c.id === contractId ? { ...c, status: 'ACTIVE' as const } : c
    );

    return {
        ...state,
        commission: {
            ...state.commission,
            activeContracts: newActiveContracts
        },
        logs: [...state.logs, `Accepted contract: ${offeredContract.title}.`]
    };
};

export const handleDeclineContract = (state: GameState, payload: { contractId?: string; mercenaryId?: string }): GameState => {
    let mercenaryId = payload.mercenaryId;
    const contractId = payload.contractId;

    // 1. Handle General Contract Decline (from Board)
    if (contractId && !mercenaryId) {
        const contract = state.commission.activeContracts.find(c => c.id === contractId);
        if (contract && contract.type === 'GENERAL') {
            return {
                ...state,
                commission: {
                    ...state.commission,
                    activeContracts: state.commission.activeContracts.filter(c => c.id !== contractId)
                },
                logs: [...state.logs, `Declined contract: ${contract.title}.`]
            };
        }
    }

    // 2. Handle Named Mercenary Decline (Dialogue)
    if (!mercenaryId && contractId) {
        mercenaryId = NAMED_CONTRACT_REGISTRY.find(entry => entry.contractId === contractId)?.mercenaryId;
    }

    if (!mercenaryId) return state;

    const currentEncounter = state.commission.namedEncounters[mercenaryId];
    if (!currentEncounter) return state;

    const mercenary = state.knownMercenaries.find(m => m.id === mercenaryId);
    const newKnownMercenaries = state.knownMercenaries.filter(m => m.id !== mercenaryId);

    return {
        ...state,
        knownMercenaries: newKnownMercenaries,
        commission: {
            ...state.commission,
            namedEncounters: {
                ...state.commission.namedEncounters,
                [mercenaryId]: {
                    ...currentEncounter,
                    hasAppeared: false,
                    declinedUntilDay: state.stats.day + 2
                }
            }
        },
        logs: [
            `${mercenary?.name || mercenaryId} decided to wait. They may return in a few days.`,
            ...state.logs
        ]
    };
};

export const handleSubmitContract = (state: GameState, contractId: string): GameState => {
    const contract = state.commission.activeContracts.find(c => c.id === contractId);
    if (!contract) return state;

    // Check requirements
    const missingItems = contract.requirements.filter(req => {
        const matchingItems = getContractMatchingItems(state.inventory, req.itemId, req.acceptedTags, req.minQuality);
        const totalQty = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
        
        if (totalQty < req.quantity) return true;

        return false;
    });

    if (missingItems.length > 0) {
        return {
            ...state,
            logs: [...state.logs, `You don't have the required items for this contract.`]
        };
    }

    // Deduct items
    let newInventory = [...state.inventory];
    contract.requirements.forEach(req => {
        let remaining = req.quantity;
        newInventory = newInventory.map(inv => {
            if (remaining <= 0) return inv;

            const recipeId = inv.equipmentData?.recipeId;
            const inventoryTags = inv.tags || [];
            const quality = inv.equipmentData?.quality ?? inv.quality ?? 0;
            const idMatch = inv.id === req.itemId || recipeId === req.itemId;
            const tagMatch = !!req.acceptedTags && req.acceptedTags.some(tag => inventoryTags.includes(tag));
            const qualityMatch = !req.minQuality || quality >= req.minQuality;

            if ((idMatch || tagMatch) && qualityMatch) {
                const take = Math.min(inv.quantity, remaining);
                remaining -= take;
                return { ...inv, quantity: inv.quantity - take };
            }
            return inv;
        }).filter(inv => inv.quantity > 0);
    });

    // Apply rewards
    let newGold = state.stats.gold;
    let newKnownMercenaries = [...state.knownMercenaries];
    let newNamedEncounters = { ...state.commission.namedEncounters };

    contract.rewards.forEach(reward => {
        if (reward.type === 'GOLD' && reward.gold) {
            newGold += reward.gold;
        } else if (reward.type === 'UNLOCK_RECRUIT' && reward.mercenaryId) {
            newNamedEncounters[reward.mercenaryId] = {
                ...newNamedEncounters[reward.mercenaryId],
                recruitUnlocked: true
            };
            
            const exists = newKnownMercenaries.some(m => m.id === reward.mercenaryId);
            if (exists) {
                newKnownMercenaries = newKnownMercenaries.map(m => 
                    m.id === reward.mercenaryId ? { ...m, status: 'VISITOR' as const } : m
                );
            } else {
                const mercenaryData = NAMED_MERCENARIES.find(m => m.id === reward.mercenaryId);
                if (mercenaryData) {
                    newKnownMercenaries.push({
                        ...mercenaryData,
                        status: 'VISITOR'
                    });
                }
            }
        } else if (reward.type === 'AFFINITY' && reward.mercenaryId && reward.affinity) {
            newKnownMercenaries = newKnownMercenaries.map(m => 
                m.id === reward.mercenaryId ? { ...m, affinity: (m.affinity || 0) + reward.affinity! } : m
            );
        }
    });

    const newActiveContracts = state.commission.activeContracts.filter(c => c.id !== contractId);
    const newCompletedContractIds = [...state.commission.completedContractIds, contractId];

    let dialogue = null;
    if (contract.rewards.some(r => r.type === 'UNLOCK_RECRUIT')) {
        dialogue = {
            speaker: contract.clientName || 'Mercenary',
            text: "Thank you! I can see you're a smith of your word. I'd be honored to work with you. You can find me in the Tavern whenever you need my blade.",
            options: [{ label: "Welcome to the Forge!", variant: 'primary' as const }]
        };
    }

    return {
        ...state,
        stats: {
            ...state.stats,
            gold: newGold
        },
        inventory: newInventory,
        knownMercenaries: newKnownMercenaries,
        commission: {
            ...state.commission,
            activeContracts: newActiveContracts,
            completedContractIds: newCompletedContractIds,
            namedEncounters: newNamedEncounters
        },
        activeDialogue: dialogue,
        logs: [...state.logs, `Contract completed: ${contract.title}!`]
    };
};

export const handleFailContract = (state: GameState, contractId: string): GameState => {
    const contract = state.commission.activeContracts.find(c => c.id === contractId);
    const newActiveContracts = state.commission.activeContracts.filter(c => c.id !== contractId);
    const newFailedContractIds = [...state.commission.failedContractIds, contractId];
    const newExpiredContracts = contract ? [...state.commission.expiredContracts, { ...contract, status: 'FAILED' as const }] : state.commission.expiredContracts;

    return {
        ...state,
        commission: {
            ...state.commission,
            activeContracts: newActiveContracts,
            failedContractIds: newFailedContractIds,
            expiredContracts: newExpiredContracts
        },
        logs: [...state.logs, `Contract failed: ${contract?.title || contractId}`]
    };
};

export const handleUpdateContractObjectiveProgress = (
    state: GameState, 
    payload: { contractId: string; objectiveId: string; amount: number }
): GameState => {
    const { contractId, objectiveId, amount } = payload;
    const contract = state.commission.activeContracts.find(c => c.id === contractId && c.status === 'ACTIVE');
    if (!contract || !contract.objectives) return state;

    const objective = contract.objectives.find(o => o.objectiveId === objectiveId);
    if (!objective) return state;

    const currentProgress = state.commission.trackedObjectiveProgress[contractId]?.[objectiveId] || 0;
    const newProgress = Math.min(objective.targetCount, currentProgress + amount);

    return {
        ...state,
        commission: {
            ...state.commission,
            trackedObjectiveProgress: {
                ...state.commission.trackedObjectiveProgress,
                [contractId]: {
                    ...(state.commission.trackedObjectiveProgress[contractId] || {}),
                    [objectiveId]: newProgress
                }
            }
        }
    };
};

export const handleClaimObjectiveContract = (state: GameState, contractId: string): GameState => {
    const contract = state.commission.activeContracts.find(c => c.id === contractId && c.status === 'ACTIVE');
    if (!contract || !contract.objectives) return state;

    // Check if all objectives are met
    const allMet = contract.objectives.every(obj => {
        const progress = state.commission.trackedObjectiveProgress[contractId]?.[obj.objectiveId] || 0;
        return progress >= obj.targetCount;
    });

    if (!allMet) {
        return {
            ...state,
            logs: [...state.logs, "Objectives are not yet complete."]
        };
    }

    // Apply rewards (similar to handleSubmitContract)
    let newGold = state.stats.gold;
    let newKnownMercenaries = [...state.knownMercenaries];
    let newNamedEncounters = { ...state.commission.namedEncounters };
    let newIssuerAffinity = { ...state.commission.issuerAffinity };

    contract.rewards.forEach(reward => {
        if (reward.type === 'GOLD' && reward.gold) {
            newGold += reward.gold;
        }
        if (reward.type === 'AFFINITY' && reward.affinity && contract.issuerId) {
            const currentAffinity = newIssuerAffinity[contract.issuerId] || 0;
            newIssuerAffinity[contract.issuerId] = currentAffinity + reward.affinity;
        }
        if (reward.type === 'UNLOCK_RECRUIT' && reward.mercenaryId) {
            newNamedEncounters[reward.mercenaryId] = {
                ...(newNamedEncounters[reward.mercenaryId] || {
                    mercenaryId: reward.mercenaryId,
                    unlocked: true,
                    hasAppeared: true,
                    daysEligible: 0,
                    declinedUntilDay: 0,
                }),
                recruitUnlocked: true
            };
        }
    });

    const newActiveContracts = state.commission.activeContracts.filter(c => c.id !== contractId);
    const newCompletedContractIds = [...state.commission.completedContractIds, contractId];

    // Cleanup progress tracking
    const newTrackedProgress = { ...state.commission.trackedObjectiveProgress };
    delete newTrackedProgress[contractId];

    return {
        ...state,
        stats: {
            ...state.stats,
            gold: newGold
        },
        knownMercenaries: newKnownMercenaries,
        commission: {
            ...state.commission,
            activeContracts: newActiveContracts,
            completedContractIds: newCompletedContractIds,
            namedEncounters: newNamedEncounters,
            trackedObjectiveProgress: newTrackedProgress,
            issuerAffinity: newIssuerAffinity
        },
        logs: [...state.logs, `Contract claimed: ${contract.title}!`]
    };
};

// --- Board Contract Generation Helpers ---

const pickBoardIssuer = (): BoardIssuerProfile => {
    return rng.pick(BOARD_ISSUER_PROFILES);
};

const pickBoardContractKind = (
    issuer: BoardIssuerProfile,
    tierLevel: number
): GeneralContractKind => {
    // 1. Determine base weights for kinds
    // Early game (tier 0-1) favors CRAFT and TURN_IN
    // Later game increases HUNT and EXPLORE
    const isEarlyGame = tierLevel <= 1;
    
    const kindWeights: Record<GeneralContractKind, number> = {
        CRAFT: isEarlyGame ? 45 : 30,
        TURN_IN: isEarlyGame ? 45 : 30,
        HUNT: isEarlyGame ? 10 : 30,
        BOSS: isEarlyGame ? 0 : 10, // BOSS contracts are rare and late game
    };

    // 2. Filter to only favoredKinds to strengthen issuer identity
    const favoredWeights: Partial<Record<GeneralContractKind, number>> = {};
    issuer.favoredKinds.forEach(kind => {
        favoredWeights[kind] = kindWeights[kind];
    });

    // 3. Weighted random selection from favored kinds
    const totalWeight = Object.values(favoredWeights).reduce((a, b) => a + b, 0);
    let roll = rng.next() * totalWeight;
    
    for (const [kind, weight] of Object.entries(favoredWeights)) {
        roll -= weight;
        if (roll <= 0) return kind as GeneralContractKind;
    }

    return issuer.favoredKinds[0] || 'CRAFT'; // Fallback to first favored or CRAFT
};

const getUrgencyFromBias = (bias: 'LOW' | 'MEDIUM' | 'HIGH'): 'NORMAL' | 'HIGH' | 'URGENT' => {
    const roll = rng.next();
    if (bias === 'HIGH') {
        if (roll > 0.85) return 'URGENT';
        return roll > 0.4 ? 'HIGH' : 'NORMAL';
    }
    if (bias === 'MEDIUM') {
        if (roll > 0.95) return 'URGENT';
        return roll > 0.7 ? 'HIGH' : 'NORMAL';
    }
    return roll > 0.9 ? 'HIGH' : 'NORMAL';
};

const createCraftBoardContract = (
    state: GameState,
    issuer: BoardIssuerProfile,
    index: number,
    usedRecipeIds: Set<string>
): ContractDefinition | null => {
    const availableRecipes = EQUIPMENT_ITEMS.filter(item => {
        const isUnlocked = item.unlockedByDefault !== false || state.unlockedRecipes.includes(item.id);
        const withinTier = item.tier <= Math.max(1, state.stats.tierLevel + 1);
        
        // Strengthen issuer identity:
        if (issuer.id === 'TOWN_GUARD') {
             // Town Guard prefers weapons and shields
             const isGuardItem = ['SWORD', 'AXE', 'MACE', 'SPEAR', 'SHIELD', 'HEAVY_ARMOR'].includes(item.subCategoryId || '');
             return isUnlocked && !usedRecipeIds.has(item.id) && withinTier && isGuardItem;
        }
        if (issuer.id === 'ASHFIELD_TRADERS') {
             // Traders prefer tools, accessories, and light armor
             const isTraderItem = ['TOOL', 'ACCESSORY', 'LIGHT_ARMOR', 'DAGGER'].includes(item.subCategoryId || '');
             return isUnlocked && !usedRecipeIds.has(item.id) && withinTier && isTraderItem;
        }
        if (issuer.id === 'CHAPEL_OF_EMBER') {
             // Chapel prefers staves, robes, and holy items
             const isChapelItem = ['STAFF', 'WAND', 'ROBE', 'ACCESSORY'].includes(item.subCategoryId || '');
             return isUnlocked && !usedRecipeIds.has(item.id) && withinTier && isChapelItem;
        }
        
        return isUnlocked && !usedRecipeIds.has(item.id) && withinTier;
    });

    if (availableRecipes.length === 0) {
        // If no thematic recipes are available, fallback to any available recipe
        const fallbackRecipes = EQUIPMENT_ITEMS.filter(item => {
            const isUnlocked = item.unlockedByDefault !== false || state.unlockedRecipes.includes(item.id);
            const withinTier = item.tier <= Math.max(1, state.stats.tierLevel + 1);
            return isUnlocked && !usedRecipeIds.has(item.id) && withinTier;
        });
        if (fallbackRecipes.length === 0) return null;
        availableRecipes.push(...fallbackRecipes);
    }

    const recipe = rng.pick(availableRecipes);
    usedRecipeIds.add(recipe.id);

    const urgency = getUrgencyFromBias(issuer.urgencyBias);
    const payout = Math.max(80, Math.floor(recipe.baseValue * rng.range(1.1, 1.3)));
    const minQuality = recipe.tier <= 1 ? 70 : 80;
    
    // High urgency reduces deadline
    let daysRemaining = rng.rangeInt(2, 4);
    if (urgency === 'HIGH') daysRemaining = Math.max(1, daysRemaining - 1);
    if (urgency === 'URGENT') daysRemaining = 1;

    return {
        id: `contract_board_${state.stats.day}_${index}_${recipe.id}`,
        type: 'GENERAL',
        kind: 'CRAFT',
        status: 'OFFERED',
        source: 'BOARD',
        issuerId: issuer.id,
        issuerName: issuer.displayName,
        title: `${issuer.displayName} Request: ${recipe.name}`,
        clientName: issuer.displayName,
        urgency,
        description: `The ${issuer.displayName} requires a high-quality ${recipe.name}. ${issuer.flavorTone}.`,
        requirements: [
            {
                itemId: recipe.id,
                quantity: 1,
                minQuality
            }
        ],
        rewards: [
            { type: 'GOLD', gold: payout }
        ],
        deadlineDay: state.stats.day + daysRemaining,
        daysRemaining,
    };
};

// Placeholder for other kinds - for now they fallback to CRAFT or simple versions
const createTurnInBoardContract = (
    state: GameState,
    issuer: BoardIssuerProfile,
    index: number
): ContractDefinition => {
    let materialOptions: string[] = ['copper_ore', 'tin_ore'];
    
    // Thematic selection based on issuer
    if (issuer.id === 'TOWN_GUARD') {
        materialOptions = ['vermin_fang', 'slime_gel', 'hide_patch'];
    } else if (issuer.id === 'ASHFIELD_TRADERS') {
        materialOptions = ['copper_ore', 'tin_ore', 'leather_strips', 'oak_log'];
    } else if (issuer.id === 'CHAPEL_OF_EMBER') {
        materialOptions = ['cave_moss_pad', 'slime_gel', 'charcoal'];
        if (state.stats.tierLevel >= 2) materialOptions.push('fire_essence');
    } else if (issuer.id === 'ADVENTURERS_GUILD') {
        materialOptions = ['bat_sonar_gland', 'mold_spore_sac', 'ember_beetle_gland'];
    }

    const selectedMaterialId = rng.pick(materialOptions);
    const material = materials[selectedMaterialId];
    
    // Quantity based on tier
    let quantity = rng.rangeInt(3, 8);
    if (material) {
        if (material.tier === 2) quantity = rng.rangeInt(2, 5);
        if (material.tier && material.tier >= 3) quantity = rng.rangeInt(1, 3);
    }
    
    const urgency = getUrgencyFromBias(issuer.urgencyBias);
    let daysRemaining = rng.rangeInt(2, 4);
    if (urgency === 'HIGH') daysRemaining = Math.max(1, daysRemaining - 1);
    if (urgency === 'URGENT') daysRemaining = 1;

    const baseValue = material?.baseValue || 100;
    const goldReward = Math.floor(baseValue * quantity * rng.range(1.1, 1.3));

    return {
        id: `contract_board_${state.stats.day}_${index}_turnin`,
        type: 'GENERAL',
        kind: 'TURN_IN',
        status: 'OFFERED',
        source: 'BOARD',
        issuerId: issuer.id,
        issuerName: issuer.displayName,
        title: `${issuer.displayName} Supply Order`,
        clientName: issuer.displayName,
        urgency,
        description: `A request for basic supplies from ${issuer.displayName}. ${issuer.flavorTone}.`,
        requirements: [
            { itemId: selectedMaterialId, quantity }
        ],
        rewards: [
            { type: 'GOLD', gold: goldReward }
        ],
        deadlineDay: state.stats.day + daysRemaining,
        daysRemaining,
    };
};

const createHuntBoardContract = (
    state: GameState,
    issuer: BoardIssuerProfile,
    index: number
): ContractDefinition => {
    let monsterOptions = [
        { id: 'giant_rat', name: 'Giant Rats' },
        { id: 'sewer_slime', name: 'Sewer Slimes' }
    ];

    // Thematic selection based on issuer
    if (issuer.id === 'TOWN_GUARD') {
        monsterOptions = [
            { id: 'giant_rat', name: 'Giant Rats' },
            { id: 'sewer_slime', name: 'Sewer Slimes' },
            { id: 'cave_bat', name: 'Cave Bats' }
        ];
    } else if (issuer.id === 'ADVENTURERS_GUILD') {
        monsterOptions = [
            { id: 'cave_bat', name: 'Cave Bats' },
            { id: 'mold_sporeling', name: 'Mold Sporelings' },
            { id: 'ember_beetle', name: 'Ember Beetles' }
        ];
    }
    
    const selectedMonster = rng.pick(monsterOptions);
    const count = rng.rangeInt(3, 6);

    const urgency = getUrgencyFromBias(issuer.urgencyBias);
    let daysRemaining = rng.rangeInt(3, 5);
    if (urgency === 'HIGH') daysRemaining = Math.max(1, daysRemaining - 1);
    if (urgency === 'URGENT') daysRemaining = 1;

    return {
        id: `contract_board_${state.stats.day}_${index}_hunt`,
        type: 'GENERAL',
        kind: 'HUNT',
        status: 'OFFERED',
        source: 'BOARD',
        issuerId: issuer.id,
        issuerName: issuer.displayName,
        title: `${issuer.displayName} Hunt Order`,
        clientName: issuer.displayName,
        urgency,
        description: `Eliminate threats in the outskirts for ${issuer.displayName}. ${issuer.flavorTone}.`,
        requirements: [],
        objectives: [
            {
                objectiveId: `hunt_${selectedMonster.id}`,
                targetType: 'KILL',
                targetId: selectedMonster.id,
                targetCount: count,
                label: `Hunt ${selectedMonster.name}`
            }
        ],
        rewards: [
            { type: 'GOLD', gold: 100 + (count * 30) }
        ],
        deadlineDay: state.stats.day + daysRemaining,
        daysRemaining,
    };
};

const BOSS_TROPHY_MAP: Record<string, { itemId: string; name: string; tier: number }> = {
    'plague_rat_king': { itemId: 'trophy_rat_king', name: "Rat King's Tail", tier: 1 },
    'goblin_king': { itemId: 'trophy_goblin_king', name: "Goblin King's Scepter", tier: 2 },
    'brood_mother': { itemId: 'trophy_brood_mother', name: "Brood Mother's Eye", tier: 2 },
    'werewolf': { itemId: 'trophy_werewolf', name: "Werewolf's Alpha Pelt", tier: 2 },
    'kobold_foreman': { itemId: 'trophy_kobold_foreman', name: "Foreman's Golden Pickaxe", tier: 2 },
};

const createBossTurnInContract = (
    state: GameState,
    issuer: BoardIssuerProfile,
    index: number
): ContractDefinition => {
    // Pick a boss trophy based on tier
    const bossIds = Object.keys(BOSS_TROPHY_MAP);
    const availableBosses = bossIds.filter(id => BOSS_TROPHY_MAP[id].tier <= Math.max(1, state.stats.tierLevel + 1));
    const selectedBossId = rng.pick(availableBosses) || 'plague_rat_king';
    const trophy = BOSS_TROPHY_MAP[selectedBossId];

    const urgency = 'URGENT'; // Boss trophies are always urgent
    const daysRemaining = 2; // Short deadline for high reward

    const goldReward = 800 + (trophy.tier * 500);

    return {
        id: `contract_board_${state.stats.day}_${index}_boss`,
        type: 'GENERAL',
        kind: 'TURN_IN',
        status: 'OFFERED',
        source: 'BOARD',
        issuerId: issuer.id,
        issuerName: issuer.displayName,
        title: `URGENT: ${trophy.name} Required`,
        clientName: issuer.displayName,
        urgency,
        description: `We require proof of the ${selectedBossId.replace(/_/g, ' ')}'s defeat. Bring us the ${trophy.name}. ${issuer.flavorTone}.`,
        requirements: [],
        objectives: [
            {
                objectiveId: `turn_in_${trophy.itemId}`,
                targetType: 'TURN_IN',
                targetId: trophy.itemId,
                targetCount: 1,
                label: `Turn in ${trophy.name}`
            }
        ],
        rewards: [
            { type: 'GOLD', gold: goldReward },
            { type: 'AFFINITY', affinity: 15 } // Higher affinity for boss trophies
        ],
        deadlineDay: state.stats.day + daysRemaining,
        daysRemaining,
    };
};

export const handleRefreshCommissions = (state: GameState): GameState => {
    if (state.commission.lastDailyCommissionRefreshDay === state.stats.day) {
        return state;
    }

    const activeSpecialContracts = state.commission.activeContracts.filter(c => c.type === 'SPECIAL');
    const activeGeneralContracts = state.commission.activeContracts.filter(c => c.type === 'GENERAL');

    // Keep non-board general contracts (from Pip, etc.)
    const activeNonBoardGeneral = activeGeneralContracts.filter(c => c.source !== 'BOARD');

    const newBoardContracts: ContractDefinition[] = [];
    const usedRecipeIds = new Set<string>();
    const usedIssuerIds = new Set<string>();
    const usedKinds = new Set<string>();

    const boardCount = 4;
    for (let i = 0; i < boardCount; i++) {
        // Try to pick a unique issuer if possible
        let issuer = pickBoardIssuer();
        let attempts = 0;
        while (usedIssuerIds.has(issuer.id) && attempts < 5) {
            issuer = pickBoardIssuer();
            attempts++;
        }
        usedIssuerIds.add(issuer.id);

        // Try to pick a unique kind if possible
        let kind = pickBoardContractKind(issuer, state.stats.tierLevel);
        
        // 10% chance to force a BOSS contract if it's not already used
        const isBossAttempt = rng.chance(0.1);
        if (isBossAttempt && !usedKinds.has('BOSS')) {
            kind = 'BOSS' as any;
        }

        attempts = 0;
        while (usedKinds.has(kind) && attempts < 5) {
            kind = pickBoardContractKind(issuer, state.stats.tierLevel);
            attempts++;
        }
        usedKinds.add(kind);

        let contract: ContractDefinition | null = null;
        switch (kind as string) {
            case 'CRAFT':
                contract = createCraftBoardContract(state, issuer, i, usedRecipeIds);
                break;
            case 'TURN_IN':
                contract = createTurnInBoardContract(state, issuer, i);
                break;
            case 'HUNT':
                contract = createHuntBoardContract(state, issuer, i);
                break;
            case 'BOSS':
                contract = createBossTurnInContract(state, issuer, i);
                break;
            default:
                contract = createCraftBoardContract(state, issuer, i, usedRecipeIds);
        }

        if (contract) {
            // Assign differentiated rewards based on issuer bias
            if (issuer.rewardBias === 'REPUTATION') {
                contract.rewards.push({ type: 'AFFINITY', affinity: 5 });
            } else if (issuer.rewardBias === 'DUNGEON') {
                contract.rewards.push({ type: 'GOLD', gold: 50 });
            } else if (issuer.rewardBias === 'UTILITY') {
                contract.rewards.push({ type: 'GOLD', gold: 30 });
            }

            newBoardContracts.push(contract);
        }
    }

    return {
        ...state,
        commission: {
            ...state.commission,
            activeContracts: [...activeSpecialContracts, ...activeNonBoardGeneral, ...newBoardContracts],
            lastDailyCommissionRefreshDay: state.stats.day
        },
        logs: ['The Commission Board has been updated with new requests.', ...state.logs]
    };
};
