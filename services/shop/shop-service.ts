
import { useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { generateShopRequest } from '../../utils/shopUtils';
import { calculateMaxHp, calculateMaxMp } from '../../models/Stats';
import { SHOP_CONFIG } from '../../config/shop-config';

/**
 * useShopService
 * Handles the background logic for the shop:
 * 1. Generating customers at random intervals (Configurable).
 * 2. Managing the queue.
 * 3. Handling customer patience timeouts.
 */
export const useShopService = () => {
    const { state, actions } = useGame();
    const { isShopOpen } = state.forge;
    const { activeCustomer, shopQueue, visitorsToday, unlockedRecipes } = state;

    const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const patienceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- 1. Arrival Logic ---
    useEffect(() => {
        if (!isShopOpen) {
            if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
            return;
        }

        const scheduleNextArrival = () => {
            // Tutorial check: If waiting for the first sell, Pip enqueues immediately
            // Also block ALL arrivals if we are in the middle of any tutorial dialogue steps
            const isTutorialSignStep = state.tutorialStep === 'SELL_ITEM_GUIDE';
            const isMidDialogue = state.tutorialStep === 'PIP_PRAISE_DIALOG' || state.tutorialStep === 'DRAGON_TALK_DIALOG' || state.tutorialStep === 'TUTORIAL_END_DIALOG';
            
            // CRITICAL: Block all non-tutorial arrivals while ANY tutorial is active
            if (state.tutorialStep && !isTutorialSignStep) {
                if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
                return;
            }

            if (isMidDialogue) {
                if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
                return;
            }

            const interval = isTutorialSignStep ? 500 : (Math.random() * SHOP_CONFIG.ARRIVAL.VARIANCE_MS + SHOP_CONFIG.ARRIVAL.MIN_INTERVAL_MS);
            
            arrivalTimerRef.current = setTimeout(() => {
                // Tutorial logic: Always bring Pip the Green if in the shop guide
                if (isTutorialSignStep && activeCustomer === null && shopQueue.length === 0) {
                    const pip = state.knownMercenaries.find(m => m.id === 'pip_green');
                    if (pip) {
                        const customer = generateShopRequest(pip, unlockedRecipes);
                        // Force request to be the Bronze Shortsword
                        customer.request.requestedId = 'sword_bronze_t1';
                        customer.request.dialogue = "Lockhart! I heard you fixed the furnace. I've been training with a wooden stick... Do you have a real Bronze Shortsword for sale?";
                        customer.request.price = 550;
                        actions.enqueueCustomer(customer);
                    }
                    // Exit here so NO other mercenaries enter during this tick in tutorial
                    return;
                }

                // If some tutorial is active (but not the sell step), don't spawn anyone
                if (state.tutorialStep) return;

                // Normal Candidate filtering
                const validCandidates = state.knownMercenaries.filter(m => 
                    !visitorsToday.includes(m.id) && 
                    !['ON_EXPEDITION', 'IN_JURED', 'DEAD'].includes(m.status)
                );

                if (validCandidates.length === 0) {
                    scheduleNextArrival();
                    return;
                }

                const selectedMerc = validCandidates[Math.floor(Math.random() * validCandidates.length)];
                const maxHp = calculateMaxHp(selectedMerc.stats, selectedMerc.level);
                const maxMp = calculateMaxMp(selectedMerc.stats, selectedMerc.level);
                
                const visitingMerc = {
                    ...selectedMerc,
                    currentHp: maxHp,
                    currentMp: maxMp,
                    maxHp,
                    maxMp
                };

                const customer = generateShopRequest(visitingMerc, unlockedRecipes);
                actions.enqueueCustomer(customer);
                
                scheduleNextArrival();
            }, interval);
        };

        scheduleNextArrival();

        return () => {
            if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
        };
    }, [isShopOpen, visitorsToday, state.knownMercenaries, state.tutorialStep, activeCustomer, shopQueue.length, actions, unlockedRecipes]);

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
        // Disable patience timer during tutorial to prevent Pip from leaving
        const isTutorialDialogue = state.tutorialStep === 'SELL_ITEM_GUIDE' || state.tutorialStep === 'PIP_PRAISE_DIALOG' || state.tutorialStep === 'DRAGON_TALK_DIALOG';
        
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
