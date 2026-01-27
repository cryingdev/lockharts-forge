
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGame } from '../../../../context/GameContext';
import { EQUIPMENT_ITEMS } from '../../../../data/equipment';
import { materials } from '../../../../data/materials';
import { GAME_CONFIG } from '../../../../config/game-config';
import { InventoryItem } from '../../../../types/inventory';
import { getAssetUrl as globalGetAssetUrl } from '../../../../utils';

interface FloatingHeart {
    id: number;
    left: number;
    delay: number;
    size: number;
}

export const useShop = () => {
    const { state, actions } = useGame();
    const { isShopOpen } = state.forge;
    const { activeCustomer, shopQueue, tutorialStep, inventory } = state;

    const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
    const [saleCompleted, setSaleCompleted] = useState(false);
    const [lastSoldQuality, setLastSoldQuality] = useState<number>(100);
    const [refusalReaction, setRefusalReaction] = useState<'POLITE' | 'ANGRY' | null>(null);
    const [showInstanceSelector, setShowInstanceSelector] = useState(false);
    const [selectedInstance, setSelectedInstance] = useState<InventoryItem | null>(null);

    useEffect(() => {
        if (!activeCustomer) {
            setSaleCompleted(false);
            setRefusalReaction(null);
            setShowInstanceSelector(false);
            setSelectedInstance(null);
        }
    }, [activeCustomer]);

    const spawnHearts = useCallback((count: number) => {
        const newHearts = Array.from({ length: count }).map((_, i) => ({
            id: Date.now() + i,
            left: 40 + Math.random() * 20,
            delay: Math.random() * 0.5,
            size: 16 + Math.random() * 12
        }));
        setFloatingHearts(prev => [...prev, ...newHearts]);
        setTimeout(() => setFloatingHearts([]), 3500);
    }, []);

    const getItemName = useCallback((id: string) => {
        const eq = EQUIPMENT_ITEMS.find(e => e.id === id);
        if (eq) return eq.name;
        const res = Object.values(materials).find(i => i.id === id);
        return res ? res.name : id;
    }, []);

    const matchingItems = useMemo(() => {
        if (!activeCustomer) return [];
        const { request } = activeCustomer;
        if (request.type === 'RESOURCE') {
            return inventory.filter(i => i.id === request.requestedId);
        } else {
            return inventory.filter(i => i.id.startsWith(request.requestedId));
        }
    }, [activeCustomer, inventory]);

    const executeSell = useCallback((item: InventoryItem) => {
        if (!activeCustomer || !item) return;
        if (item.isLocked) {
            actions.showToast("Item is locked and cannot be sold.");
            return;
        }
        const { mercenary, request } = activeCustomer;
        const isPipTutorial = tutorialStep === 'SELL_ITEM_GUIDE' && mercenary.id === 'pip_green';
        
        const itemQuality = item.equipmentData?.quality || 100;
        setLastSoldQuality(itemQuality);

        let affinityGain = isPipTutorial ? 10 : 2;
        if (itemQuality > 100) affinityGain += 2;
        else if (itemQuality < 80) affinityGain = Math.max(1, affinityGain - 1);
        
        const markup = request.markup || 1.25;
        const finalPrice = Math.ceil(item.baseValue * markup);

        if (item.type === 'RESOURCE') {
            actions.sellItem(item.id, 1, finalPrice, undefined, mercenary);
        } else {
            actions.sellItem(item.id, 1, finalPrice, item.id, mercenary);
        }

        spawnHearts(affinityGain);
        setSaleCompleted(true);
        setShowInstanceSelector(false);
        setSelectedInstance(null);
    }, [activeCustomer, tutorialStep, actions, spawnHearts]);

    const handleSellClick = useCallback(() => {
        if (!activeCustomer) return;
        if (matchingItems.length > 1) {
            setShowInstanceSelector(true);
        } else if (matchingItems.length === 1) {
            executeSell(matchingItems[0]);
        }
    }, [activeCustomer, matchingItems, executeSell]);

    const handleRefuse = useCallback(() => {
        if (!activeCustomer) return;
        const { mercenary } = activeCustomer;
        const affinity = mercenary.affinity || 0;
        const politeChance = affinity > 40 ? 0.8 : 0.3;
        const isPolite = Math.random() < politeChance;
        if (isPolite) {
            setRefusalReaction('POLITE');
            actions.refuseCustomer(mercenary.id, 0);
        } else {
            setRefusalReaction('ANGRY');
            actions.refuseCustomer(mercenary.id, 5);
        }
    }, [activeCustomer, actions]);

    const handleFarewell = useCallback(() => {
        setSaleCompleted(false);
        setRefusalReaction(null);
        actions.dismissCustomer();
    }, [actions]);

    const handleToggleShop = useCallback(() => {
        if (!isShopOpen && state.tutorialStep === 'OPEN_SHOP_SIGN_GUIDE') {
            actions.setTutorialStep('SELL_ITEM_GUIDE');
        }
        actions.toggleShop();
    }, [isShopOpen, state.tutorialStep, actions]);

    const getThanksDialogue = useCallback(() => {
        const itemName = getItemName(activeCustomer?.request.requestedId || "");
        if (lastSoldQuality > 100) {
            return [
                `"Unbelievable! This ${itemName} is a true masterpiece. The edge is unlike anything I've seen. You really have the Lockhart touch!"`,
                `"Absolute perfection. I can feel the strength in this steel. I'll tell everyone in the tavern about your forge!"`,
                `"This quality is beyond what I expected. A fair price for legendary work. Thank you, Lockhart!"`
            ][Math.floor(Math.random() * 3)];
        } 
        if (lastSoldQuality < 80) {
            return [
                `"It'll do for now, I suppose. Though the finish on this ${itemName} is a bit rough... I hope your next work is a bit more refined."`,
                `"Hmm, not your best work, smith. I'll take it, but I was expecting that famous Lockhart quality. Try harder next time."`,
                `"A bit crude, but I need a blade today. Next time, I hope the anvil's rhythm is more precise."`
            ][Math.floor(Math.random() * 3)];
        }
        return [
            `"Fantastic craftsmanship! This ${itemName} is exactly what I needed. Thank you, Lockhart!"`,
            `"Superb work. I feel much safer with this by my side. I'll be back!"`,
            `"A fair price for quality steel. May your bellows never tire, smith."`,
            `"You truly have the Lockhart touch. This will serve me well in the ruins."`
        ][Math.floor(Math.random() * 4)];
    }, [activeCustomer, lastSoldQuality, getItemName]);

    const getRefusalDialogue = useCallback(() => {
        if (refusalReaction === 'POLITE') {
            return [
                `"I see. Perhaps another time then. Safe forging, smith."`,
                `"Ah, a shame. I'll keep looking elsewhere for now."`,
                `"Understandable. A Lockhart's work shouldn't be rushed. Farewell."`,
                `"I'll come back when your anvil is hotter. Until next time."`
            ][(activeCustomer?.id.length || 0) % 4];
        } else {
            return [
                `"What? I walked all this way for nothing? Hmph. Don't expect me back soon."`,
                `"A cold welcome for a paying customer... I'll find a better forge."`,
                `"Unbelievable. My old blade has more edge than your business sense!"`,
                `"I thought the Lockharts were more reliable. Guess I was wrong."`
            ][(activeCustomer?.id.length || 0) % 4];
        }
    }, [refusalReaction, activeCustomer]);

    const tutorialContent = useMemo(() => {
        if (tutorialStep === 'PIP_PRAISE_DIALOG') {
            return {
                speaker: activeCustomer?.mercenary.name || "Pip the Green",
                text: "This... this is incredible. I can feel the balance in the grip. It's much better than the scraps I found in the woods. You really are a Lockhart, aren't you?",
                options: [{ label: "Continue", action: () => actions.setTutorialStep('DRAGON_TALK_DIALOG'), variant: 'primary' as const }]
            };
        }
        if (tutorialStep === 'DRAGON_TALK_DIALOG') {
            return {
                speaker: activeCustomer?.mercenary.name || "Pip the Green",
                text: "The village... it hasn't been the same since the Dragon's fire. I lost my brother that night. I see that same shadow in your eyes, smith. We all lost someone. Good luck with the forge.",
                options: [{ label: "Farewell", action: () => { handleFarewell(); actions.setTutorialStep('TUTORIAL_END_DIALOG'); }, variant: 'primary' as const }]
            };
        }
        if (tutorialStep === 'TUTORIAL_END_DIALOG') {
            return {
                speaker: "Lockhart",
                text: "Finally... the first sale. It's a small spark, but enough to light the way. I'll reclaim our legacy, one blade at a time.",
                options: [{ label: "Complete Tutorial", action: () => actions.completeTutorial(), variant: 'primary' as const }]
            };
        }
        return null;
    }, [tutorialStep, activeCustomer, actions, handleFarewell]);

    const dialogueState = useMemo(() => {
        if (tutorialContent) return tutorialContent;
        if (!activeCustomer) return null;

        if (saleCompleted) {
            return {
                speaker: activeCustomer.mercenary.name,
                text: getThanksDialogue(),
                options: [{ label: "Farewell", action: handleFarewell, variant: 'neutral' as const }]
            };
        }

        if (refusalReaction) {
            return {
                speaker: activeCustomer.mercenary.name,
                text: getRefusalDialogue(),
                options: [{ label: "Farewell", action: handleFarewell, variant: 'neutral' as const }]
            };
        }

        const { request, mercenary } = activeCustomer;
        const inventoryMatch = matchingItems.length > 0;
        
        return {
            speaker: mercenary.name,
            text: request.dialogue,
            highlightTerm: getItemName(request.requestedId),
            itemDetail: {
                icon: '📦',
                imageUrl: globalGetAssetUrl(`${request.requestedId}.png`, 'equipments'),
                price: request.price,
                isUnlocked: true
            },
            options: [
                { 
                    label: `Sell (${request.price} G)`, 
                    action: handleSellClick, 
                    variant: 'primary' as const, 
                    disabled: !inventoryMatch 
                },
                { 
                    label: "Refuse", 
                    action: handleRefuse, 
                    variant: 'danger' as const 
                }
            ]
        };
    }, [activeCustomer, saleCompleted, refusalReaction, matchingItems, tutorialContent, getThanksDialogue, getRefusalDialogue, handleFarewell, handleSellClick, handleRefuse, getItemName]);

    return {
        state,
        actions,
        isShopOpen,
        activeCustomer,
        shopQueue,
        floatingHearts,
        saleCompleted,
        refusalReaction,
        dialogueState,
        matchingItems,
        showInstanceSelector,
        selectedInstance,
        isTutorialActive: !!tutorialStep,
        canAffordOpen: state.stats.energy >= GAME_CONFIG.ENERGY_COST.OPEN_SHOP,
        handlers: {
            handleToggleShop,
            handleFarewell,
            handleSellClick,
            handleRefuse,
            setShowInstanceSelector,
            setSelectedInstance,
            executeSell
        }
    };
};
