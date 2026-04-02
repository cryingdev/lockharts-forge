import { useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { generateShopRequest } from '../../utils/shopUtils';
import { calculateMaxHp, calculateMaxMp } from '../../models/Stats';
import { generateMercenary } from '../../utils/mercenaryGenerator';
import { SHOP_CONFIG } from '../../config/shop-config';
import { rng } from '../../utils/random';
import { NAMED_MERCENARIES } from '../../data/mercenaries';

/**
 * useShopService
 * Handles the background logic for the shop.
 */
export const useShopService = () => {
    const { state, actions } = useGame();
    const { isShopOpen } = state.forge;
    const { activeCustomer, shopQueue, visitorsToday, unlockedRecipes } = state;
    const language = state.settings.language;

    const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const patienceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- 1. Arrival Logic ---
    useEffect(() => {
        if (!isShopOpen) {
            if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
            return;
        }

        const scheduleNextArrival = () => {
            const isTutorialSignStep = state.tutorialStep === 'SELL_ITEM_GUIDE';
            const isPipReturnStep = state.tutorialStep === 'PIP_RETURN_GUIDE';
            const isMidTutorial = !!state.tutorialStep && !isTutorialSignStep && !isPipReturnStep;
            
            // Check if this is the very first visitor of the game (even if tutorial is skipped)
            // Only apply this priority on Day 1
            const isFirstVisitorEver = state.stats.day === 1 && state.visitorsToday.length === 0 && !state.knownMercenaries.some(m => m.id === 'pip_green');
            
            // Block normal arrivals if any tutorial is active (except the selling guide and return guide)
            if (isMidTutorial) {
                if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
                return;
            }

            const isPriorityPip = isTutorialSignStep || isPipReturnStep || isFirstVisitorEver;
            
            // Check daily visit limit (except for priority Pip)
            const maxVisitorsToday = Math.ceil(state.knownMercenaries.length * SHOP_CONFIG.ARRIVAL.LIMIT_MULTIPLIER);
            const hasReachedLimit = state.visitorsToday.length >= Math.max(3, maxVisitorsToday); // Minimum 3 for early game

            if (hasReachedLimit && !isPriorityPip) {
                if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
                return;
            }

            const interval = isPriorityPip ? 500 : Math.floor(rng.standard(SHOP_CONFIG.ARRIVAL.MIN_INTERVAL_MS, SHOP_CONFIG.ARRIVAL.MIN_INTERVAL_MS + SHOP_CONFIG.ARRIVAL.VARIANCE_MS, 0));
            
            arrivalTimerRef.current = setTimeout(() => {
                // Priority Pip logic: Pip the Green enters for the first quest or return
                if (isPriorityPip) {
                    if (activeCustomer === null && shopQueue.length === 0) {
                        // Try to find Pip in known mercenaries first, fallback to NAMED_MERCENARIES
                        let pip = state.knownMercenaries.find(m => m.id === 'pip_green');
                        if (!pip) {
                            pip = NAMED_MERCENARIES.find(m => m.id === 'pip_green');
                        }

                        if (pip) {
                            const customer = generateShopRequest(pip, unlockedRecipes, language);
                            customer.request.requestedId = 'sword_bronze_t1';
                            
                            if (isTutorialSignStep || isFirstVisitorEver) {
                                customer.request.dialogue = language === 'ko'
                                    ? '록하트! 화로를 고쳤다면서요. 전 나무 막대기로만 훈련해왔어요... 진짜 Bronze Shortsword 하나 살 수 있을까요?'
                                    : "Lockhart! I heard you fixed the furnace. I've been training with a wooden stick... Do you have a real Bronze Shortsword for sale?";
                            } else {
                                customer.request.dialogue = language === 'ko'
                                    ? '다녀왔어요! Bronze Shortsword은 준비됐나요? 빨리 휘둘러 보고 싶어요!'
                                    : "I'm back! Is the Bronze Shortsword ready? I can't wait to try it out!";
                            }
                            
                            customer.request.price = 550;
                            actions.enqueueCustomer(customer);
                        }
                    }
                    return; // Exit to prevent other mercenaries from spawning
                }

                // 80% chance to actually have a customer arrive
                const doesArrive = rng.chance(SHOP_CONFIG.ARRIVAL.CHANCE);
                
                if (doesArrive) {
                    // Normal Candidate filtering
                    const validCandidates = state.knownMercenaries.filter(m => 
                        !visitorsToday.includes(m.id) && 
                        !['ON_EXPEDITION', 'INJURED', 'DEAD'].includes(m.status)
                    );

                    // 10% chance to generate a new mercenary, or if no valid candidates left
                    const shouldGenerateNew = rng.chance(SHOP_CONFIG.ARRIVAL.NEW_MERCENARY_CHANCE) || validCandidates.length === 0;

                    let selectedMerc;
                    if (shouldGenerateNew) {
                        selectedMerc = generateMercenary(state.knownMercenaries, state.stats.day);
                    } else {
                        selectedMerc = rng.pick(validCandidates);
                    }

                    if (selectedMerc) {
                        const maxHp = calculateMaxHp(selectedMerc.stats, selectedMerc.level);
                        const maxMp = calculateMaxMp(selectedMerc.stats, selectedMerc.level);
                        
                        const visitingMerc = {
                            ...selectedMerc,
                            currentHp: maxHp,
                            currentMp: maxMp,
                            maxHp,
                            maxMp
                        };

                        const customer = generateShopRequest(visitingMerc, unlockedRecipes, language);
                        actions.enqueueCustomer(customer);
                    }
                }
                
                scheduleNextArrival();
            }, interval);
        };

        scheduleNextArrival();

        return () => {
            if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
        };
    }, [isShopOpen, visitorsToday, state.knownMercenaries, state.tutorialStep, activeCustomer, shopQueue.length, actions, unlockedRecipes, language]);

    // --- 2. Queue Processing Logic ---
    useEffect(() => {
        if (!isShopOpen) return;

        if (!activeCustomer && shopQueue.length > 0) {
            const t = setTimeout(() => {
                actions.nextCustomer();
            }, SHOP_CONFIG.QUEUE_PROCESS_DELAY_MS);
            return () => clearTimeout(t);
        }
    }, [isShopOpen, activeCustomer, shopQueue, actions]);

    // --- 3. Patience Timer Logic ---
    useEffect(() => {
        const isTutorialDialogue = !!state.tutorialStep;
        
        if (!activeCustomer || isTutorialDialogue) {
            if (patienceTimerRef.current) clearTimeout(patienceTimerRef.current);
            return;
        }

        patienceTimerRef.current = setTimeout(() => {
            actions.dismissCustomer();
        }, SHOP_CONFIG.PATIENCE_MS);

        return () => {
            if (patienceTimerRef.current) clearTimeout(patienceTimerRef.current);
        };
    }, [activeCustomer, actions, state.tutorialStep]);
};
