import { GameState, ContractDefinition } from '../../types/game-state';
import { NAMED_CONTRACT_REGISTRY } from '../../data/contracts/namedContracts';
import { NAMED_MERCENARIES } from '../../data/mercenaries';

export const isNamedMercenaryEligible = (state: GameState, entry: any): boolean => {
    const stateInfo = state.commission.namedEncounters[entry.mercenaryId];
    // If already unlocked (contract accepted/completed) or appeared, skip
    if (!stateInfo || stateInfo.unlocked || stateInfo.hasAppeared) return false; 
    
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

    // Check if we are past the encounter window
    if (stateInfo.daysEligible !== undefined && entry.encounterRule.encounterWindowDays) {
        // If we've been eligible for longer than the window, and it's not guaranteed anymore
        if (stateInfo.daysEligible > entry.encounterRule.encounterWindowDays) {
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

export const handleTriggerNamedEncounterCheck = (state: GameState, location: string): GameState => {
    // 1. Find eligible named mercenaries for this location
    const eligibleEntries = NAMED_CONTRACT_REGISTRY.filter(entry => {
        if (entry.encounterRule.location !== location) return false;
        return isNamedMercenaryEligible(state, entry);
    });

    if (eligibleEntries.length === 0) return state;

    // 2. Roll for appearance or check guarantee
    let triggeredEntry = null;
    const newNamedEncounters = { ...state.commission.namedEncounters };

    for (const entry of eligibleEntries) {
        const stateInfo = state.commission.namedEncounters[entry.mercenaryId];
        const daysSinceEligible = stateInfo.daysEligible || 0;
        
        const isGuaranteed = entry.encounterRule.guaranteeAfterDays && daysSinceEligible >= entry.encounterRule.guaranteeAfterDays;
        const roll = Math.random();
        
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
    if (mercenaryData && !newKnownMercenaries.some(m => m.id === triggeredEntry.mercenaryId)) {
        newKnownMercenaries.push({
            ...mercenaryData,
            status: 'ENCOUNTERED'
        });
    }

    return {
        ...state,
        knownMercenaries: newKnownMercenaries,
        commission: {
            ...state.commission,
            namedEncounters: newNamedEncounters
        },
        activeDialogue: {
            speaker: triggeredEntry.encounterDialogue.speaker,
            text: triggeredEntry.encounterDialogue.text,
            options: [
                { 
                    label: "I'll see what I can do.", 
                    variant: 'primary',
                    action: { type: 'ACCEPT_CONTRACT', payload: { contractId: triggeredEntry.contractId } }
                },
                { label: "Maybe later.", variant: 'neutral' }
            ]
        },
        logs: [...state.logs, `A special visitor has appeared: ${triggeredEntry.displayName}!`]
    };
};

export const handleAcceptContract = (state: GameState, payload: { contractId: string }): GameState => {
    const { contractId } = payload;
    const registryEntry = NAMED_CONTRACT_REGISTRY.find(r => r.contractId === contractId);
    if (!registryEntry) return state;

    // Check if already active
    if (state.commission.activeContracts.some(c => c.id === contractId)) return state;

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
    };

    const newKnownMercenaries = state.knownMercenaries.map(m => 
        m.id === registryEntry.mercenaryId ? { ...m, status: 'CONTRACT_ACTIVE' as const } : m
    );

    return {
        ...state,
        knownMercenaries: newKnownMercenaries,
        commission: {
            ...state.commission,
            activeContracts: [...state.commission.activeContracts, contract],
            namedEncounters: newNamedEncounters
        },
        logs: [...state.logs, `Accepted contract: ${contract.title}. Check the Commission Board.`]
    };
};

export const handleSubmitContract = (state: GameState, contractId: string): GameState => {
    const contract = state.commission.activeContracts.find(c => c.id === contractId);
    if (!contract) return state;

    // Check requirements
    const missingItems = contract.requirements.filter(req => {
        // Find all items in inventory that match either ID or Tags
        const matchingItems = state.inventory.filter(inv => {
            const idMatch = inv.id === req.itemId;
            const tagMatch = req.acceptedTags && inv.tags && req.acceptedTags.some(tag => inv.tags!.includes(tag));
            return idMatch || tagMatch;
        });

        const totalQty = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
        
        if (totalQty < req.quantity) return true;
        
        if (req.minQuality) {
            const qualityItems = matchingItems.filter(inv => (inv.quality || 0) >= req.minQuality!);
            const qualityQty = qualityItems.reduce((sum, item) => sum + item.quantity, 0);
            if (qualityQty < req.quantity) return true;
        }
        
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

            const idMatch = inv.id === req.itemId;
            const tagMatch = req.acceptedTags && inv.tags && req.acceptedTags.some(tag => inv.tags!.includes(tag));
            const qualityMatch = !req.minQuality || (inv.quality || 0) >= req.minQuality;

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
    const newActiveContracts = state.commission.activeContracts.filter(c => c.id !== contractId);
    const newFailedContractIds = [...state.commission.failedContractIds, contractId];

    return {
        ...state,
        commission: {
            ...state.commission,
            activeContracts: newActiveContracts,
            failedContractIds: newFailedContractIds
        },
        logs: [...state.logs, `Contract failed: ${contractId}`]
    };
};

export const handleRefreshCommissions = (state: GameState): GameState => {
    // Implementation for daily random contracts (Phase 4)
    return state;
};
