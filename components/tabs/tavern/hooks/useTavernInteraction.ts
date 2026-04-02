
import { useState, useCallback, useMemo } from 'react';
import { useGame } from '../../../../context/GameContext';
import { Mercenary } from '../../../../models/Mercenary';
import { calculateHiringCost, CONTRACT_CONFIG } from '../../../../config/contract-config';
import { InventoryItem } from '../../../../types/inventory';
import { t } from '../../../../utils/i18n';

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
    const [dialogue, setDialogue] = useState(t(language, 'tavern.interaction_intro', { name: mercenary.name }));
    const [showGiftMenu, setShowGiftMenu] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [pendingGiftItem, setPendingGiftItem] = useState<InventoryItem | null>(null);
    const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
    const [step, setStep] = useState<InteractionStep>('IDLE');

    const hiringCost = useMemo(() => calculateHiringCost(mercenary.level, mercenary.job), [mercenary]);
    const canAfford = state.stats.gold >= hiringCost;
    const hasAffinity = (mercenary.affinity || 0) >= CONTRACT_CONFIG.HIRE_AFFINITY_THRESHOLD;

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

        if (!state.talkedToToday.includes(mercenary.id)) {
            actions.talkMercenary(mercenary.id);
            spawnHearts();
        }

        const lines = [
            t(language, 'tavern.talk_1'),
            t(language, 'tavern.talk_2'),
            t(language, 'tavern.talk_3'),
            t(language, 'tavern.talk_4'),
            t(language, 'tavern.talk_5'),
            t(language, 'tavern.talk_6'),
        ];
        setDialogue(lines[Math.floor(Math.random() * lines.length)]);
    }, [language, mercenary.id, state.talkedToToday, pendingGiftItem, step, actions, spawnHearts]);

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
        setDialogue(t(language, 'tavern.drink_thanks'));
    }, [language, mercenary.id, state.stats.gold, state.boughtDrinkToday, pendingGiftItem, step, actions, spawnHearts]);

    const handleRecruitInit = useCallback(() => {
        if (!hasAffinity) {
            setDialogue(t(language, 'tavern.hire_not_enough_affinity'));
            return;
        }
        if (!canAfford) {
            setDialogue(t(language, 'tavern.hire_not_enough_gold', { cost: hiringCost }));
            return;
        }
        setStep('CONFIRM_HIRE');
        setDialogue(t(language, 'tavern.hire_confirm', { cost: hiringCost }));
    }, [language, hasAffinity, canAfford, hiringCost]);

    const handleConfirmHire = useCallback(() => {
        actions.hireMercenary(mercenary.id, hiringCost);
        setStep('IDLE');
        setDialogue(t(language, 'tavern.hire_success'));
    }, [language, mercenary.id, hiringCost, actions]);

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
        setDialogue(t(language, 'tavern.gift_success'));
        setPendingGiftItem(null);
    }, [language, pendingGiftItem, mercenary.id, actions]);

    return {
        state,
        actions,
        dialogue,
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
        handlers: {
            handleTalk,
            handleBuyDrink,
            handleRecruitInit,
            handleConfirmHire,
            handleTerminateInit,
            handleConfirmTerminate,
            handleSelectItemForGift,
            handleConfirmGift,
            handleCancelGift: () => { setPendingGiftItem(null); setDialogue(t(language, 'tavern.gift_cancel')); },
            handleCancelStep: () => { setStep('IDLE'); setDialogue(t(language, 'tavern.step_cancel')); }
        }
    };
};
