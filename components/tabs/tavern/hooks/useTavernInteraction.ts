
import { useState, useCallback, useMemo } from 'react';
import { useGame } from '../../../../context/GameContext';
import { Mercenary } from '../../../../models/Mercenary';
import { calculateHiringCost, CONTRACT_CONFIG } from '../../../../config/contract-config';
import { InventoryItem } from '../../../../types/inventory';
import { resolveTavernTalkOutcome } from '../../../../state/helpers/tavernTalkHelpers';
import { getNextNamedConversationPrompt } from '../../../../state/helpers/namedConversationHelpers';
import { t } from '../../../../utils/i18n';
import { NamedConversationPrompt } from '../../../../types/game-state';
import { getPlayerName } from '../../../../utils/gameText';
import { getTavernLodgingCapacity } from '../../../../config/tavern-config';

export interface FloatingHeart {
    id: number;
    left: number;
    delay: number;
    size: number;
}

export type InteractionStep = 'IDLE' | 'CONFIRM_HIRE' | 'CONFIRM_FIRE';

export const useTavernInteraction = (mercenary: Mercenary) => {
    const { state, actions } = useGame();
    const language = state.settings.language;
    const playerName = getPlayerName(state);
    const [dialogue, setDialogue] = useState(t(language, 'tavern.interaction_intro', { name: mercenary.name }));
    const [showGiftMenu, setShowGiftMenu] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [followupText, setFollowupText] = useState<string | null>(null);
    const [activeNamedPrompt, setActiveNamedPrompt] = useState<NamedConversationPrompt | null>(null);
    const [pendingGiftItem, setPendingGiftItem] = useState<InventoryItem | null>(null);
    const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
    const [step, setStep] = useState<InteractionStep>('IDLE');

    const hiringCost = useMemo(() => calculateHiringCost(mercenary.level, mercenary.job), [mercenary]);
    const canAfford = state.stats.gold >= hiringCost;
    const hasAffinity = (mercenary.affinity || 0) >= CONTRACT_CONFIG.HIRE_AFFINITY_THRESHOLD;
    const hiredCount = useMemo(
        () => state.knownMercenaries.filter(m => ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(m.status)).length,
        [state.knownMercenaries]
    );
    const lodgingCapacity = useMemo(() => getTavernLodgingCapacity(state.tavern.lodgingLevel), [state.tavern.lodgingLevel]);
    const hasLodgingSpace = hiredCount < lodgingCapacity;

    const spawnHearts = useCallback(() => {
        const newHearts = Array.from({ length: 5 }).map((_, i) => ({
            id: Date.now() + i,
            left: 40 + Math.random() * 20,
            delay: Math.random() * 0.5,
            size: 16 + Math.random() * 12
        }));
        setFloatingHearts(prev => [...prev, ...newHearts]);
        setTimeout(() => setFloatingHearts([]), 3000);
    }, []);

    const handleTalk = useCallback(() => {
        if (pendingGiftItem || step !== 'IDLE') return;
        if (followupText || activeNamedPrompt) return;

        const firstMeaningfulTalkToday = !state.talkedToToday.includes(mercenary.id);
        if (!state.talkedToToday.includes(mercenary.id)) {
            actions.talkMercenary(mercenary.id);
            spawnHearts();
        }

        const promptMercenary = firstMeaningfulTalkToday
            ? { ...mercenary, affinity: Math.min(100, (mercenary.affinity || 0) + 1) }
            : mercenary;
        const namedPrompt = firstMeaningfulTalkToday ? getNextNamedConversationPrompt(state, promptMercenary) : null;

        if (namedPrompt) {
            setActiveNamedPrompt(namedPrompt);
            setFollowupText(null);
            setDialogue(t(language, namedPrompt.textKey));
            return;
        }

        const outcome = resolveTavernTalkOutcome(state, mercenary);
        const resolvedText = outcome.textKey ? t(language, outcome.textKey) : (outcome.text || t(language, 'tavern.talk_1'));
        const resolvedFollowup = outcome.followupTextKey
            ? t(language, outcome.followupTextKey)
            : (outcome.followupText || null);

        setDialogue(resolvedText);
        setFollowupText(resolvedFollowup);

        if (firstMeaningfulTalkToday && outcome.contractTemplateId) {
            actions.generateTavernMinorContract(mercenary.id, outcome.contractTemplateId);
        }

        if (outcome.outcome === 'OPPORTUNITY' && outcome.unlockNamedId) {
            actions.unlockNamedEncounter(outcome.unlockNamedId);
        }
    }, [language, mercenary, state, pendingGiftItem, step, followupText, activeNamedPrompt, actions, spawnHearts]);

    const handleNamedPromptOption = useCallback((optionId: string) => {
        if (!activeNamedPrompt) return;

        const selectedOption = activeNamedPrompt.options.find(option => option.id === optionId);
        if (!selectedOption) return;

        actions.answerNamedConversationPrompt(mercenary.id, activeNamedPrompt.id, optionId);
        setActiveNamedPrompt(null);
        const resolvedFollowup = selectedOption.followupTextKey
            ? t(language, selectedOption.followupTextKey)
            : (
                selectedOption.affinityDelta >= 3
                    ? t(language, 'namedConversations.followup_positive')
                    : selectedOption.affinityDelta <= -2
                        ? t(language, 'namedConversations.followup_negative')
                        : t(language, 'namedConversations.followup_neutral')
            );
        setFollowupText(resolvedFollowup);
        setDialogue(t(language, selectedOption.responseTextKey));
    }, [activeNamedPrompt, actions, language, mercenary.id]);

    const handleBuyDrink = useCallback(() => {
        if (pendingGiftItem || step !== 'IDLE') return;
        
        const DRINK_COST = 100;
        if (state.stats.gold < DRINK_COST) {
            setDialogue(t(language, 'tavern.drink_no_gold'));
            return;
        }

        if (state.boughtDrinkToday.includes(mercenary.id)) {
            setDialogue(t(language, 'tavern.drink_already_bought'));
            return;
        }

        actions.buyDrink(mercenary.id);
        spawnHearts();
        setDialogue(t(language, 'tavern.drink_thanks', { playerName }));
    }, [language, mercenary.id, state.stats.gold, state.boughtDrinkToday, pendingGiftItem, step, actions, spawnHearts, playerName]);

    const handleRecruitInit = useCallback(() => {
        if (!hasAffinity) {
            setDialogue(t(language, 'tavern.hire_not_enough_affinity'));
            return;
        }
        if (!hasLodgingSpace) {
            setDialogue(t(language, 'tavern.hire_not_enough_lodging', { capacity: lodgingCapacity }));
            return;
        }
        if (!canAfford) {
            setDialogue(t(language, 'tavern.hire_not_enough_gold', { cost: hiringCost }));
            return;
        }
        setStep('CONFIRM_HIRE');
        setDialogue(t(language, 'tavern.hire_confirm', { cost: hiringCost }));
    }, [canAfford, hasAffinity, hasLodgingSpace, hiringCost, language, lodgingCapacity]);

    const handleConfirmHire = useCallback(() => {
        actions.hireMercenary(mercenary.id, hiringCost);
        setStep('IDLE');
        setDialogue(t(language, 'tavern.hire_success', { playerName }));
    }, [language, mercenary.id, hiringCost, actions, playerName]);

    const handleTerminateInit = useCallback(() => {
        setStep('CONFIRM_FIRE');
        setDialogue(t(language, 'tavern.fire_confirm'));
    }, [language]);

    const handleConfirmTerminate = useCallback(() => {
        actions.fireMercenary(mercenary.id);
        setStep('IDLE');
        setDialogue(t(language, 'tavern.fire_success'));
    }, [language, mercenary.id, actions]);

    const handleSelectItemForGift = useCallback((item: InventoryItem) => {
        if (item.isLocked) {
            actions.showToast(t(language, 'tavern.gift_locked'));
            return;
        }
        setPendingGiftItem(item);
        setShowGiftMenu(false);
        setDialogue(t(language, 'tavern.gift_offer', { item: item.name }));
    }, [language, actions]);

    const handleConfirmGift = useCallback(() => {
        if (!pendingGiftItem) return;
        actions.giveGift(mercenary.id, pendingGiftItem.id);
        setDialogue(t(language, 'tavern.gift_success', { playerName }));
        setPendingGiftItem(null);
    }, [language, pendingGiftItem, mercenary.id, actions, playerName]);

    return {
        state,
        actions,
        dialogue,
        followupText,
        activeNamedPrompt,
        showGiftMenu,
        setShowGiftMenu,
        showDetail,
        setShowDetail,
        pendingGiftItem,
        setPendingGiftItem,
        floatingHearts,
        step,
        setStep,
        hiringCost,
        canAfford,
        hasAffinity,
        hasLodgingSpace,
        lodgingCapacity,
        handlers: {
            handleTalk,
            handleNamedPromptOption,
            handleBuyDrink,
            handleRecruitInit,
            handleConfirmHire,
            handleTerminateInit,
            handleConfirmTerminate,
            handleSelectItemForGift,
            handleConfirmGift,
            handleContinue: () => setFollowupText(null),
            handleCancelGift: () => { setPendingGiftItem(null); setDialogue(t(language, 'tavern.gift_cancel')); },
            handleCancelStep: () => { setStep('IDLE'); setDialogue(t(language, 'tavern.step_cancel')); }
        }
    };
};
