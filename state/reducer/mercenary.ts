
import { GameState } from '../../types/index';
import { Mercenary } from '../../models/Mercenary';
import { DUNGEON_CONFIG } from '../../config/dungeon-config';
import { PrimaryStats, mergePrimaryStats, calculateMaxHp, calculateMaxMp } from '../../models/Stats';
import { EquipmentRarity } from '../../models/Equipment';
import { NAMED_CONVERSATION_PROMPTS } from '../../data/dialogue/namedConversationPrompts';
import { TAVERN_MINOR_CONTRACT_TEMPLATES } from '../../data/contracts/tavernMinorContracts';
import { ContractDefinition } from '../../types/game-state';
import { t } from '../../utils/i18n';
import { getLocalizedItemName } from '../../utils/itemText';
import { rng } from '../../utils/random';
import { JobClass } from '../../models/JobClass';
import { getTavernLodgingCapacity } from '../../config/tavern-config';

const getNamedConversationRewardTemplateId = (mercenary: Mercenary): string => {
    switch (mercenary.id) {
        case 'pip_green':
        case 'tilly_footloose':
            return 'tavern_gloves_request_t1';
        case 'adeline_shield':
        case 'sister_aria':
            return 'tavern_shield_request_t1';
        case 'garret_shield':
        case 'ylva_ironvein':
        case 'skeld_stormblood':
            return 'tavern_sword_request_t1';
        case 'elara_flame':
        case 'lucian_ravenscar':
            return 'tavern_ring_request_t1';
        case 'sly_vargo':
        case 'jade_nightbinder':
            return 'tavern_boots_request_t1';
        default:
            switch (mercenary.job) {
                case JobClass.FIGHTER:
                    return 'tavern_sword_request_t1';
                case JobClass.MAGE:
                    return 'tavern_ring_request_t1';
                case JobClass.ROGUE:
                    return 'tavern_boots_request_t1';
                case JobClass.CLERIC:
                    return 'tavern_shield_request_t1';
                default:
                    return 'tavern_gloves_request_t1';
            }
    }
};

export const handleAddKnownMercenary = (state: GameState, merc: Mercenary): GameState => {
    if (state.knownMercenaries.some(m => m.id === merc.id)) return state;
    const language = state.settings.language;
    const mercWithData = { 
        ...merc, 
        expeditionEnergy: merc.expeditionEnergy ?? DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
        currentXp: merc.currentXp ?? 0,
        xpToNextLevel: merc.xpToNextLevel ?? (merc.level * 100),
        status: 'VISITOR' as const,
        bonusStatPoints: merc.bonusStatPoints ?? 0
    };
    return {
        ...state,
        knownMercenaries: [...state.knownMercenaries, mercWithData],
        logs: [t(language, 'mercenary.log_regular', { name: merc.name }), ...state.logs]
    };
};

export const handleScoutMercenary = (state: GameState, payload: { mercenary: Mercenary; cost: number }): GameState => {
    const { mercenary, cost } = payload;
    if (state.stats.gold < cost) return state;
    const language = state.settings.language;

    const existingIndex = state.knownMercenaries.findIndex(m => m.id === mercenary.id);
    let updatedKnownMercenaries = [...state.knownMercenaries];

    const mercWithData = { 
        ...mercenary, 
        expeditionEnergy: mercenary.expeditionEnergy ?? DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY,
        currentXp: mercenary.currentXp ?? 0,
        xpToNextLevel: mercenary.xpToNextLevel ?? (mercenary.level * 100),
        status: 'VISITOR' as const,
        bonusStatPoints: mercenary.bonusStatPoints ?? 0
    };

    if (existingIndex !== -1) {
        updatedKnownMercenaries[existingIndex] = mercWithData;
    } else {
        updatedKnownMercenaries.push(mercWithData);
    }

    let newNamedEncounters = { ...state.commission.namedEncounters };
    if (mercenary.isUnique) {
        const current = newNamedEncounters[mercenary.id] || {
            mercenaryId: mercenary.id,
            unlocked: false,
            hasAppeared: false,
            recruitUnlocked: false
        };
        newNamedEncounters[mercenary.id] = {
            ...current,
            hasAppeared: true
        };
    }

    return {
        ...state,
        stats: {
            ...state.stats,
            gold: state.stats.gold - cost,
            inviteCount: state.stats.inviteCount + 1,
            dailyFinancials: {
                ...state.stats.dailyFinancials,
                expenseScout: state.stats.dailyFinancials.expenseScout + cost
            }
        },
        commission: {
            ...state.commission,
            namedEncounters: newNamedEncounters
        },
        tavern: {
            ...state.tavern,
            reputation: Math.min(100, state.tavern.reputation + 3),
            lastInviteDay: state.stats.day,
            inviteCountToday: state.tavern.inviteCountToday + 1,
        },
        knownMercenaries: updatedKnownMercenaries,
        logs: [t(language, 'mercenary.log_scouted', { cost, name: mercenary.name }), ...state.logs]
    };
};

export const handleHireMercenary = (state: GameState, payload: { mercenaryId: string; cost: number }): GameState => {
    const { mercenaryId, cost } = payload;
    if (state.stats.gold < cost) return state;
    const language = state.settings.language;
    const hiredCount = state.knownMercenaries.filter(m => ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(m.status)).length;
    const lodgingCapacity = getTavernLodgingCapacity(state.tavern.lodgingLevel);

    if (hiredCount >= lodgingCapacity) {
        return {
            ...state,
            logs: [t(language, 'tavern.lodging_full_log', { capacity: lodgingCapacity }), ...state.logs]
        };
    }

    const targetMercenary = state.knownMercenaries.find(m => m.id === mercenaryId);
    if (!targetMercenary) return state;

    if (targetMercenary.isUnique) {
        const namedState = state.commission.namedEncounters[mercenaryId];
        if (!namedState?.recruitUnlocked) {
            return {
                ...state,
                logs: [t(language, 'mercenary.log_special_contract_required', { name: targetMercenary.name }), ...state.logs]
            };
        }
    }
    
    let newUnlockedTabs = [...state.unlockedTabs];
    let logUpdates: string[] = [];

    const updatedMercenaries = state.knownMercenaries.map(m => {
        if (m.id === mercenaryId) return { ...m, status: 'HIRED' as const };
        return m;
    });
    
    const hiredMerc = updatedMercenaries.find(m => m.id === mercenaryId);
    const name = hiredMerc ? hiredMerc.name : 'Mercenary';
    logUpdates.push(t(language, 'mercenary.log_hired', { name, cost }));

    if (!newUnlockedTabs.includes('DUNGEON')) {
        newUnlockedTabs.push('DUNGEON');
        logUpdates.unshift(t(language, 'mercenary.log_dungeon_unlocked'));
    }

    return {
        ...state,
        stats: { 
            ...state.stats, 
            gold: state.stats.gold - cost,
            dailyFinancials: {
                ...state.stats.dailyFinancials,
                expenseScout: state.stats.dailyFinancials.expenseScout + cost
            }
        },
        knownMercenaries: updatedMercenaries,
        unlockedTabs: newUnlockedTabs,
        logs: [...logUpdates, ...state.logs]
    };
};

export const handleFireMercenary = (state: GameState, payload: { mercenaryId: string }): GameState => {
    const { mercenaryId } = payload;
    const language = state.settings.language;
    const updatedMercenaries = state.knownMercenaries.map(m => {
        if (m.id === mercenaryId) return { ...m, status: 'VISITOR' as const };
        return m;
    });
    const firedMerc = updatedMercenaries.find(m => m.id === mercenaryId);
    const name = firedMerc ? firedMerc.name : 'Mercenary';
    return {
        ...state,
        knownMercenaries: updatedMercenaries,
        logs: [t(language, 'mercenary.log_fired', { name }), ...state.logs]
    };
};

export const handleGiveGift = (state: GameState, payload: { mercenaryId: string; itemId: string }): GameState => {
    const { mercenaryId, itemId } = payload;
    const language = state.settings.language;
    const mercIndex = state.knownMercenaries.findIndex(m => m.id === mercenaryId);
    if (mercIndex === -1) return state;

    const inventoryItem = state.inventory.find(i => i.id === itemId);
    if (!inventoryItem || inventoryItem.quantity <= 0) return state;

    const mercenary = { ...state.knownMercenaries[mercIndex] };
    let affinityGain = 3; 
    let staminaGain = 0;
    let qualityNoteKey = "";

    // Special handling for consumables
    if (itemId === 'stamina_potion') {
        staminaGain = 50;
        affinityGain = 5;
    } else if (itemId === 'affinity_debug_gift') {
        affinityGain = 50;
    } else if (inventoryItem.type === 'EQUIPMENT' && inventoryItem.equipmentData) {
        affinityGain = 5; // Base for gear
        // Rarity bonus
        switch (inventoryItem.equipmentData.rarity) {
            case EquipmentRarity.UNCOMMON: affinityGain += 2; break;
            case EquipmentRarity.RARE: affinityGain += 4; break;
            case EquipmentRarity.EPIC: affinityGain += 7; break;
            case EquipmentRarity.LEGENDARY: affinityGain += 12; break;
        }

        // Quality bonus/penalty
        const q = inventoryItem.equipmentData.quality;
        if (q > 100) {
            affinityGain += 5;
            qualityNoteKey = 'mercenary.gift_quality_bonus';
        } else if (q < 80) {
            affinityGain = Math.max(1, Math.floor(affinityGain * 0.4));
            qualityNoteKey = 'mercenary.gift_quality_penalty';
        }
    }

    mercenary.affinity = Math.min(100, (mercenary.affinity || 0) + affinityGain);
    if (staminaGain > 0) {
        mercenary.expeditionEnergy = Math.min(DUNGEON_CONFIG.MAX_EXPEDITION_ENERGY, (mercenary.expeditionEnergy || 0) + staminaGain);
    }

    const newInventory = state.inventory.map(item => {
        if (item.id === itemId) {
            return { ...item, quantity: item.quantity - 1 };
        }
        return item;
    }).filter(i => i.quantity > 0);

    const newMercenaries = [...state.knownMercenaries];
    newMercenaries[mercIndex] = mercenary;

    const itemName = getLocalizedItemName(language, {
        id: inventoryItem.equipmentData?.recipeId || inventoryItem.id,
        name: inventoryItem.name
    });
    const qualityNote = qualityNoteKey ? ` ${t(language, qualityNoteKey)}` : '';
    const staminaNote = staminaGain > 0 ? ` ${t(language, 'mercenary.gift_stamina_bonus', { stamina: staminaGain })}` : '';
    const logMsg = `${t(language, 'mercenary.log_gifted', {
        item: itemName,
        name: mercenary.name,
        affinity: affinityGain
    })}${qualityNote}${staminaNote}`;

    return {
        ...state,
        inventory: newInventory,
        knownMercenaries: newMercenaries,
        logs: [logMsg, ...state.logs]
    };
};

export const handleTalkMercenary = (state: GameState, payload: { mercenaryId: string }): GameState => {
    const { mercenaryId } = payload;
    if (state.talkedToToday.includes(mercenaryId)) return state;
    const language = state.settings.language;

    const mercIndex = state.knownMercenaries.findIndex(m => m.id === mercenaryId);
    if (mercIndex === -1) return state;

    const newMercenaries = [...state.knownMercenaries];
    const merc = { ...newMercenaries[mercIndex] };
    merc.affinity = Math.min(100, (merc.affinity || 0) + 1);
    newMercenaries[mercIndex] = merc;

    return {
        ...state,
        knownMercenaries: newMercenaries,
        talkedToToday: [...state.talkedToToday, mercenaryId],
        tavern: {
            ...state.tavern,
            reputation: Math.min(100, state.tavern.reputation + 1),
        },
        logs: [t(language, 'mercenary.log_talked', { name: merc.name }), ...state.logs]
    };
};

export const handleAnswerNamedConversationPrompt = (
    state: GameState,
    payload: { mercenaryId: string; promptId: string; optionId: string }
): GameState => {
    const { mercenaryId, promptId, optionId } = payload;
    const mercIndex = state.knownMercenaries.findIndex(m => m.id === mercenaryId);
    if (mercIndex === -1) return state;

    const prompt = NAMED_CONVERSATION_PROMPTS.find(entry => entry.id === promptId && entry.mercenaryId === mercenaryId);
    if (!prompt) return state;

    const option = prompt.options.find(entry => entry.id === optionId);
    if (!option) return state;

    const updatedMercenaries = [...state.knownMercenaries];
    const mercenary = { ...updatedMercenaries[mercIndex] };
    mercenary.affinity = Math.max(0, Math.min(100, (mercenary.affinity || 0) + option.affinityDelta));
    updatedMercenaries[mercIndex] = mercenary;
    const reputationDelta = option.tavernReputationDelta ?? (option.affinityDelta > 0 ? 1 : option.affinityDelta < 0 ? -1 : 0);
    const alignmentDelta = option.affinityDelta >= 3 ? 1 : option.affinityDelta <= -2 ? -1 : 0;

    const language = state.settings.language;
    const history = state.namedConversationHistory[mercenaryId] || [];
    const deltaLabel = option.affinityDelta >= 0 ? `+${option.affinityDelta}` : `${option.affinityDelta}`;
    const reputationLabel = reputationDelta >= 0 ? `+${reputationDelta}` : `${reputationDelta}`;
    const currentAlignment = state.namedConversationAlignment[mercenaryId] || 0;
    const nextAlignment = Math.max(0, currentAlignment + alignmentDelta);
    const alreadyRewarded = !!state.namedConversationRewarded[mercenaryId];

    let newActiveContracts = state.commission.activeContracts;
    let activeDialogue = state.activeDialogue;
    let rewardUnlocked = false;

    if (!alreadyRewarded && nextAlignment >= 2) {
        const existingTavernContract = state.commission.activeContracts.find(
            c => c.mercenaryId === mercenaryId && c.source === 'TAVERN'
        );
        const totalTavernContracts = state.commission.activeContracts.filter(c => c.source === 'TAVERN').length;
        const templateId = getNamedConversationRewardTemplateId(mercenary);
        const template = TAVERN_MINOR_CONTRACT_TEMPLATES.find(entry => entry.id === templateId);

        if (!existingTavernContract && totalTavernContracts < 3 && template) {
            const newContract: ContractDefinition = {
                id: `tavern_named_${mercenaryId}_${state.stats.day}_${rng.next().toString(36).slice(2, 7)}`,
                type: 'GENERAL',
                kind: template.kind,
                title: template.titleKey ? t(language, template.titleKey) : (template.title || template.id),
                clientName: mercenary.name,
                mercenaryId: mercenary.id,
                source: 'TAVERN',
                description: template.descriptionKey ? t(language, template.descriptionKey) : (template.description || template.id),
                requirements: template.requirements,
                rewards: [
                    { type: 'GOLD', gold: template.rewardGold },
                    { type: 'AFFINITY', affinity: template.rewardAffinity, mercenaryId: mercenary.id }
                ],
                deadlineDay: state.stats.day + template.deadlineDays,
                status: 'ACTIVE',
                unique: true
            };
            newActiveContracts = [newContract, ...state.commission.activeContracts];
            rewardUnlocked = true;
        }

        activeDialogue = {
            speaker: mercenary.name,
            text: t(language, rewardUnlocked ? 'namedConversations.special_request_unlocked' : 'namedConversations.special_dialogue_unlocked', { name: mercenary.name }),
            options: [
                { label: t(language, 'namedConversations.special_continue'), variant: 'primary' }
            ]
        };
    }

    return {
        ...state,
        knownMercenaries: updatedMercenaries,
        namedConversationHistory: {
            ...state.namedConversationHistory,
            [mercenaryId]: history.includes(promptId) ? history : [...history, promptId]
        },
        namedConversationAlignment: {
            ...state.namedConversationAlignment,
            [mercenaryId]: nextAlignment
        },
        namedConversationRewarded: {
            ...state.namedConversationRewarded,
            [mercenaryId]: alreadyRewarded || nextAlignment >= 2
        },
        tavern: {
            ...state.tavern,
            reputation: Math.max(0, Math.min(100, state.tavern.reputation + reputationDelta))
        },
        commission: {
            ...state.commission,
            activeContracts: newActiveContracts
        },
        activeDialogue,
        logs: [
            ...(rewardUnlocked ? [t(language, 'commission.personal_request_received', { name: mercenary.name })] : []),
            t(language, 'logs.named_conversation_answered', { name: mercenary.name, delta: deltaLabel, reputation: reputationLabel }),
            ...state.logs
        ]
    };
};

export const handleBuyDrink = (state: GameState, payload: { mercenaryId: string }): GameState => {
    const { mercenaryId } = payload;
    const DRINK_COST = 100;
    const AFFINITY_GAIN = 3;
    const language = state.settings.language;

    if (state.stats.gold < DRINK_COST) return state;
    if (state.boughtDrinkToday.includes(mercenaryId)) return state;

    const mercIndex = state.knownMercenaries.findIndex(m => m.id === mercenaryId);
    if (mercIndex === -1) return state;

    const newMercenaries = [...state.knownMercenaries];
    const merc = { ...newMercenaries[mercIndex] };
    merc.affinity = Math.min(100, (merc.affinity || 0) + AFFINITY_GAIN);
    newMercenaries[mercIndex] = merc;

    return {
        ...state,
        stats: {
            ...state.stats,
            gold: state.stats.gold - DRINK_COST
        },
        knownMercenaries: newMercenaries,
        boughtDrinkToday: [...state.boughtDrinkToday, mercenaryId],
        tavern: {
            ...state.tavern,
            reputation: Math.min(100, state.tavern.reputation + 2),
        },
        logs: [t(language, 'mercenary.log_bought_drink', { name: merc.name, affinity: AFFINITY_GAIN }), ...state.logs]
    };
};

export const handleAllocateStat = (state: GameState, payload: { mercenaryId: string; stat: keyof PrimaryStats }): GameState => {
    const { mercenaryId, stat } = payload;
    const mercIndex = state.knownMercenaries.findIndex(m => m.id === mercenaryId);
    if (mercIndex === -1) return state;

    const merc = state.knownMercenaries[mercIndex];
    if ((merc.bonusStatPoints || 0) <= 0) return state;

    const newAllocated = { ...merc.allocatedStats, [stat]: merc.allocatedStats[stat] + 1 };
    const merged = mergePrimaryStats(merc.stats, newAllocated);
    
    // Vitals update
    const newMaxHp = calculateMaxHp(merged, merc.level);
    const newMaxMp = calculateMaxMp(merged, merc.level);
    // Heal proportional to hp increase
    const hpGain = newMaxHp - merc.maxHp;
    const mpGain = newMaxMp - merc.maxMp;

    const updatedMerc: Mercenary = {
        ...merc,
        allocatedStats: newAllocated,
        bonusStatPoints: merc.bonusStatPoints - 1, // Consume point
        maxHp: newMaxHp,
        currentHp: merc.currentHp + (hpGain > 0 ? hpGain : 0),
        maxMp: newMaxMp,
        currentMp: merc.currentMp + (mpGain > 0 ? mpGain : 0)
    };

    const newKnownMercenaries = [...state.knownMercenaries];
    newKnownMercenaries[mercIndex] = updatedMerc;

    return {
        ...state,
        knownMercenaries: newKnownMercenaries
    };
};

export const handleUpdateMercenaryStats = (state: GameState, payload: { mercenaryId: string; stats: PrimaryStats }): GameState => {
    const { mercenaryId, stats: newAllocatedStats } = payload;
    const language = state.settings.language;
    const mercIndex = state.knownMercenaries.findIndex(m => m.id === mercenaryId);
    if (mercIndex === -1) return state;

    const merc = state.knownMercenaries[mercIndex];
    
    // Calculate total points spent
    const oldTotal = Object.values(merc.allocatedStats).reduce((a, b) => a + b, 0);
    const newTotal = Object.values(newAllocatedStats).reduce((a, b) => a + b, 0);
    const spentPoints = newTotal - oldTotal;

    const merged = mergePrimaryStats(merc.stats, newAllocatedStats);
    const newMaxHp = calculateMaxHp(merged, merc.level);
    const newMaxMp = calculateMaxMp(merged, merc.level);

    const hpDiff = newMaxHp - merc.maxHp;
    const mpDiff = newMaxMp - merc.maxMp;

    const updatedMerc: Mercenary = {
        ...merc,
        allocatedStats: newAllocatedStats,
        bonusStatPoints: Math.max(0, (merc.bonusStatPoints || 0) - spentPoints),
        maxHp: newMaxHp,
        maxMp: newMaxMp,
        currentHp: merc.currentHp + (hpDiff > 0 ? hpDiff : 0),
        currentMp: merc.currentMp + (mpDiff > 0 ? mpDiff : 0)
    };

    const newKnownMercenaries = [...state.knownMercenaries];
    newKnownMercenaries[mercIndex] = updatedMerc;

    return {
        ...state,
        knownMercenaries: newKnownMercenaries,
        logs: [t(language, 'mercenary.log_updated_stats', { name: merc.name, points: spentPoints }), ...state.logs]
    };
};
