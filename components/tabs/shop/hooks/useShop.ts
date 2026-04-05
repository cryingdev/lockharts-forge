import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGame } from '../../../../context/GameContext';
import { EQUIPMENT_ITEMS } from '../../../../data/equipment';
import { materials } from '../../../../data/materials';
import { GAME_CONFIG } from '../../../../config/game-config';
import { InventoryItem } from '../../../../types/inventory';
import { getAssetUrl as globalGetAssetUrl } from '../../../../utils';
import { t } from '../../../../utils/i18n';
import { getPlayerName } from '../../../../utils/gameText';
import { getLocalizedItemName } from '../../../../utils/itemText';

interface FloatingHeart {
    id: number;
    left: number;
    delay: number;
    size: number;
}

export const useShop = (onNavigate?: (tab: string) => void) => {
    const { state, actions } = useGame();
    const language = state.settings.language;
    const { isShopOpen } = state.forge;
    const { activeCustomer, shopQueue, tutorialStep, inventory, unlockedRecipes } = state;
    const playerName = getPlayerName(state);

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
        const newHearts = Array.from({ length: count }).map((_, i) => {
            // 캐릭터 중앙(50%)을 피해 좌우로 분산 생성
            const side = i % 2 === 0 ? -1 : 1; 
            const offset = 18 + Math.random() * 12; // 중앙에서 18%~30% 떨어진 위치
            return {
                id: Date.now() + i,
                left: 50 + (side * offset),
                delay: Math.random() * 0.6,
                size: 14 + Math.random() * 12
            };
        });
        setFloatingHearts(prev => [...prev, ...newHearts]);
        setTimeout(() => setFloatingHearts([]), 3500);
    }, []);

    const getItemName = useCallback((id: string) => {
        const eq = EQUIPMENT_ITEMS.find(e => e.id === id);
        if (eq) return getLocalizedItemName(language, eq);
        const res = Object.values(materials).find(i => i.id === id);
        return res ? getLocalizedItemName(language, res) : id;
    }, [language]);

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
            actions.showToast(t(language, 'shop.locked_item'));
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
    }, [language, activeCustomer, tutorialStep, actions, spawnHearts]);

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
        const isOpeningStep = state.tutorialStep === 'OPEN_SHOP_SIGN_GUIDE';
        if (isOpeningStep && !isShopOpen) {
            actions.setTutorialStep('SELL_ITEM_GUIDE');
        }
        actions.toggleShop();
    }, [actions, state.tutorialStep, isShopOpen]);

    const getThanksDialogue = useCallback(() => {
        const itemName = getItemName(activeCustomer?.request.requestedId || "");
        const isPip = activeCustomer?.mercenary.id === 'pip_green';

        if (lastSoldQuality >= 110) { // MASTERWORK
            if (isPip) {
                return t(language, 'shop.thanks_masterwork_pip', { playerName });
            }
            return [
                t(language, 'shop.thanks_masterwork_1', { item: itemName, playerName }),
                t(language, 'shop.thanks_masterwork_2'),
                t(language, 'shop.thanks_masterwork_3', { playerName })
            ][Math.floor(Math.random() * 3)];
        } 
        if (lastSoldQuality >= 100) { // PRISTINE
            if (isPip) {
                return t(language, 'shop.thanks_pristine_pip', { playerName });
            }
            return [
                t(language, 'shop.thanks_pristine_1', { item: itemName, playerName }),
                t(language, 'shop.thanks_pristine_2'),
                t(language, 'shop.thanks_pristine_3'),
                t(language, 'shop.thanks_pristine_4', { playerName })
            ][Math.floor(Math.random() * 4)];
        }
        if (lastSoldQuality < 80) {
            return [
                t(language, 'shop.thanks_rough_1', { item: itemName }),
                t(language, 'shop.thanks_rough_2', { playerName }),
                t(language, 'shop.thanks_rough_3')
            ][Math.floor(Math.random() * 3)];
        }
        return [
            t(language, 'shop.thanks_pristine_1', { item: itemName, playerName }),
            t(language, 'shop.thanks_pristine_2'),
            t(language, 'shop.thanks_pristine_3'),
            t(language, 'shop.thanks_pristine_4', { playerName })
        ][Math.floor(Math.random() * 4)];
    }, [language, activeCustomer, lastSoldQuality, getItemName, playerName]);

    const getRefusalDialogue = useCallback(() => {
        if (refusalReaction === 'POLITE') {
            return [
                t(language, 'shop.refuse_polite_1'),
                t(language, 'shop.refuse_polite_2'),
                t(language, 'shop.refuse_polite_3', { playerName }),
                t(language, 'shop.refuse_polite_4')
            ][(activeCustomer?.id.length || 0) % 4];
        } else {
            return [
                t(language, 'shop.refuse_angry_1'),
                t(language, 'shop.refuse_angry_2'),
                t(language, 'shop.refuse_angry_3'),
                t(language, 'shop.refuse_angry_4', { playerName })
            ][(activeCustomer?.id.length || 0) % 4];
        }
    }, [language, refusalReaction, activeCustomer]);

    const composeShopLine = useCallback((greetingKey: string, bodyKey: string, params: Record<string, string> = {}) => {
        return `${t(language, greetingKey, params)}\n${t(language, bodyKey, params)}`;
    }, [language]);

    const getRequestDialogue = useCallback((itemName: string, isFallback = false) => {
        const merc = activeCustomer?.mercenary;
        if (!merc) return '';

        if (merc.affinity >= 50) {
            return composeShopLine(
                'shop.greeting.high',
                isFallback ? 'shop.request_body.buy_high' : 'shop.request_body.need_high',
                { item: itemName, playerName }
            );
        }
        if (merc.affinity >= 20) {
            return composeShopLine(
                'shop.greeting.mid',
                isFallback ? 'shop.request_body.buy_mid' : 'shop.request_body.need_mid',
                { item: itemName }
            );
        }
        return composeShopLine(
            isFallback ? 'shop.greeting.low_buy' : 'shop.greeting.low_need',
            isFallback ? 'shop.request_body.buy_low' : 'shop.request_body.need_low',
            { item: itemName }
        );
    }, [activeCustomer, composeShopLine, playerName]);

    const tutorialContent = useMemo(() => {
        if (tutorialStep === 'CRAFT_FIRST_SWORD_DIALOG_GUIDE') {
            return {
                speaker: playerName,
                text: t(language, 'shop.pip_forge_intro', { playerName }),
                options: [{ 
                    label: t(language, 'shop.option_go_forge'), 
                    action: () => { 
                        actions.setTutorialScene('SMITHING');
                        actions.setTutorialStep('CRAFT_FIRST_SWORD_GUIDE');
                    }, 
                    variant: 'primary' as const,
                }]
            };
        }
        if (tutorialStep === 'PIP_PRAISE_DIALOG_GUIDE') {
            return {
                speaker: activeCustomer?.mercenary.name || "Pip the Green",
                text: t(language, 'shop.pip_gratitude', { playerName, item: getItemName(activeCustomer?.request.requestedId || 'bronze_shortsword') }),
                options: [{
                    label: t(language, 'shop.option_continue'),
                    action: () => {
                        handleFarewell();
                        actions.setTutorialStep('TUTORIAL_FINISH_DIALOG_GUIDE');
                    },
                    variant: 'primary' as const
                }]
            };
        }
        if (tutorialStep === 'TUTORIAL_FINISH_DIALOG_GUIDE') {
            return {
                speaker: playerName,
                text: t(language, 'shop.tutorial_finish'),
                options: [{
                    label: t(language, 'shop.option_complete_tutorial'),
                    action: () => {
                        handleFarewell();
                        actions.completeTutorial();
                    },
                    variant: 'primary' as const
                }]
            };
        }
        return null;
    }, [language, tutorialStep, activeCustomer, actions, handleFarewell, onNavigate, playerName]);

    const dialogueState = useMemo(() => {
        if (tutorialContent) return tutorialContent;
        if (!activeCustomer) return null;

        if (saleCompleted) {
            return {
                speaker: activeCustomer.mercenary.name,
                text: getThanksDialogue(),
                options: [{ label: t(language, 'shop.option_farewell'), action: handleFarewell, variant: 'neutral' as const }]
            };
        }

        if (refusalReaction) {
            return {
                speaker: activeCustomer.mercenary.name,
                text: getRefusalDialogue(),
                options: [{ label: t(language, 'shop.option_farewell'), action: handleFarewell, variant: 'neutral' as const }]
            };
        }

        const { request, mercenary } = activeCustomer;
        const inventoryMatch = matchingItems.length > 0;
        
        // Pip's initial request dialogue (Tutorial or first visit after skip on Day 1)
        const isInitialPipVisit = (tutorialStep === 'SELL_ITEM_GUIDE' || (!tutorialStep && state.stats.day === 1 && state.visitorsToday.length <= 1)) && mercenary.id === 'pip_green';
        
        if (isInitialPipVisit) {
            if (!inventoryMatch) {
                return {
                    speaker: mercenary.name,
                    text: t(language, 'shop.pip_request_missing', { item: getItemName(request.requestedId), playerName }),
                    highlightTerm: "Bronze Shortsword",
                    options: [
                        { 
                            label: t(language, 'shop.option_continue'), 
                            action: () => {
                                handleFarewell();
                                actions.setTutorialStep('CRAFT_FIRST_SWORD_DIALOG_GUIDE');
                            }, 
                            variant: 'primary' as const
                        }
                    ]
                };
            } else {
                return {
                    speaker: mercenary.name,
                    text: t(language, 'shop.pip_request_have_one'),
                    highlightTerm: "Bronze Shortsword",
                    options: [
                        { 
                            label: t(language, 'shop.option_sell_now'), 
                            action: handleSellClick, 
                            variant: 'primary' as const 
                        }
                    ]
                };
            }
        }

        if (tutorialStep === 'PIP_RETURN_DIALOG_GUIDE' && mercenary.id === 'pip_green') {
            return {
                speaker: mercenary.name,
                text: t(language, 'shop.pip_return_intro', { item: getItemName(request.requestedId), playerName }),
                highlightTerm: "Bronze Shortsword",
                options: [
                    {
                        label: t(language, 'shop.option_continue'),
                        action: () => actions.setTutorialStep('PIP_RETURN_GUIDE'),
                        variant: 'primary' as const
                    }
                ]
            };
        }

        // Pip's return dialogue
        if (tutorialStep === 'PIP_RETURN_GUIDE' && mercenary.id === 'pip_green') {
            return {
                speaker: mercenary.name,
                text: t(language, 'shop.pip_return_ready', { item: getItemName(request.requestedId) }),
                highlightTerm: "Bronze Shortsword",
                options: [
                    { 
                        label: t(language, 'shop.option_sell', { price: request.price }), 
                        action: handleSellClick, 
                        variant: 'primary' as const,
                        disabled: !inventoryMatch
                    },
                    { 
                        label: t(language, 'shop.option_wait_more'), 
                        action: handleRefuse, 
                        variant: 'danger' as const 
                    }
                ]
            };
        }

        const isEquip = request.type === 'EQUIPMENT';
        const recipe = isEquip ? EQUIPMENT_ITEMS.find(e => e.id === request.requestedId) : null;
        const material = !isEquip ? Object.values(materials).find(m => m.id === request.requestedId) : null;

        // 해금 여부 판단: 장비 아이템인 경우 플레이어의 해금 레시피 목록이나 기본 해금 여부 확인
        const isActuallyUnlocked = isEquip 
            ? (recipe?.unlockedByDefault || unlockedRecipes.includes(request.requestedId))
            : true; // 재료는 항상 해금된 것으로 간주

        return {
            speaker: mercenary.name,
            text: getRequestDialogue(getItemName(request.requestedId), !recipe && !material),
            highlightTerm: getItemName(request.requestedId),
            itemDetail: {
                id: request.requestedId,
                image: isEquip ? recipe?.image : material?.image,
                icon: isEquip ? (recipe?.icon || '⚔️') : (material?.icon || '📦'),
                price: request.price,
                requirements: recipe?.requirements,
                isUnlocked: isActuallyUnlocked
            },
            options: [
                { 
                    label: t(language, 'shop.option_sell', { price: request.price }), 
                    action: handleSellClick, 
                    variant: 'primary' as const, 
                    disabled: !inventoryMatch 
                },
                { 
                    label: t(language, 'shop.option_refuse'), 
                    action: handleRefuse, 
                    variant: 'danger' as const 
                }
            ]
        };
    }, [language, activeCustomer, saleCompleted, refusalReaction, matchingItems, tutorialContent, getThanksDialogue, getRefusalDialogue, handleFarewell, handleSellClick, handleRefuse, getItemName, getRequestDialogue, unlockedRecipes, playerName]);

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
        isTutorialActive: !!tutorialStep && !['CRAFT_FIRST_SWORD_GUIDE', 'PIP_RETURN_GUIDE', 'PIP_RETURN_DIALOG_GUIDE'].includes(tutorialStep),
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
