
import { useState, useCallback, useMemo } from 'react';
import { useGame } from '../../../../context/GameContext';
import { Mercenary } from '../../../../models/Mercenary';
import { calculateHiringCost, CONTRACT_CONFIG } from '../../../../config/contract-config';
import { InventoryItem } from '../../../../types/inventory';

export interface FloatingHeart {
    id: number;
    left: number;
    delay: number;
    size: number;
}

export type InteractionStep = 'IDLE' | 'CONFIRM_HIRE' | 'CONFIRM_FIRE';

export const useTavernInteraction = (mercenary: Mercenary) => {
    const { state, actions } = useGame();
    const [dialogue, setDialogue] = useState(`(You sit across from ${mercenary.name}.)`);
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
            "The road is long, but a warm fire makes it easier.",
            "I heard rumors of rare ores in the Rat Cellar...",
            "What's your specialty, smith? I need something that won't break.",
            "I've seen many forges, but yours has... potential.",
            "Tell me, do you have any ale left?",
            "I'm looking for work. Something that pays in gold and glory."
        ];
        setDialogue(lines[Math.floor(Math.random() * lines.length)]);
    }, [mercenary.id, state.talkedToToday, pendingGiftItem, step, actions, spawnHearts]);

    const handleRecruitInit = useCallback(() => {
        if (!hasAffinity) {
            setDialogue("I don't know you well enough to pledge my blade to your forge yet.");
            return;
        }
        if (!canAfford) {
            setDialogue(`The contract is ${hiringCost} gold. Come back when you have the coin.`);
            return;
        }
        setStep('CONFIRM_HIRE');
        setDialogue(`"A contract for ${hiringCost} Gold? Are you certain you want me on your squad?"`);
    }, [hasAffinity, canAfford, hiringCost]);

    const handleConfirmHire = useCallback(() => {
        actions.hireMercenary(mercenary.id, hiringCost);
        setStep('IDLE');
        setDialogue("A fair contract. My strength is yours, Lockhart.");
    }, [mercenary.id, hiringCost, actions]);

    const handleTerminateInit = useCallback(() => {
        setStep('CONFIRM_FIRE');
        setDialogue(`(Surprised) "Terminate the contract? Did I fail you in some way?"`);
    }, []);

    const handleConfirmTerminate = useCallback(() => {
        actions.fireMercenary(mercenary.id);
        setStep('IDLE');
        setDialogue(`"I see. Perhaps our paths will cross again. Farewell, smith."`);
    }, [mercenary.id, actions]);

    const handleSelectItemForGift = useCallback((item: InventoryItem) => {
        if (item.isLocked) {
            actions.showToast("Cannot gift locked items.");
            return;
        }
        setPendingGiftItem(item);
        setShowGiftMenu(false);
        setDialogue(`(You hold out the ${item.name}.) "Would you like this?"`);
    }, [actions]);

    const handleConfirmGift = useCallback(() => {
        if (!pendingGiftItem) return;
        actions.giveGift(mercenary.id, pendingGiftItem.id);
        setDialogue(`"For me? You're too kind, Lockhart."`);
        setPendingGiftItem(null);
    }, [pendingGiftItem, mercenary.id, actions]);

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
            handleRecruitInit,
            handleConfirmHire,
            handleTerminateInit,
            handleConfirmTerminate,
            handleSelectItemForGift,
            handleConfirmGift,
            handleCancelGift: () => { setPendingGiftItem(null); setDialogue("Actually, never mind."); },
            handleCancelStep: () => { setStep('IDLE'); setDialogue("I'm glad we cleared that up."); }
        }
    };
};
