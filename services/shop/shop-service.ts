
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
    const { activeCustomer, shopQueue, visitorsToday } = state;

    const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const patienceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- 1. Arrival Logic ---
    useEffect(() => {
        if (!isShopOpen) {
            if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
            return;
        }

        const scheduleNextArrival = () => {
            const interval = Math.random() * SHOP_CONFIG.ARRIVAL.VARIANCE_MS + SHOP_CONFIG.ARRIVAL.MIN_INTERVAL_MS;
            
            arrivalTimerRef.current = setTimeout(() => {
                // STRICT MODE: Only allow mercenaries from the 'knownMercenaries' list (Tavern list).
                // Filter out:
                // 1. Anyone who has already visited today.
                // 2. Anyone currently busy (ON_EXPEDITION), injured, or dead.
                const validCandidates = state.knownMercenaries.filter(m => 
                    !visitorsToday.includes(m.id) && 
                    !['ON_EXPEDITION', 'INJURED', 'DEAD'].includes(m.status)
                );

                if (validCandidates.length === 0) {
                    // Everyone has visited today. No one comes.
                    // Reschedule check just in case new mercenaries are added via Tavern later in the day.
                    scheduleNextArrival();
                    return;
                }

                // Pick a random candidate from the valid list
                const selectedMerc = validCandidates[Math.floor(Math.random() * validCandidates.length)];

                // Refresh their stats for the visit (Simulate them coming fresh)
                const maxHp = calculateMaxHp(selectedMerc.stats, selectedMerc.level);
                const maxMp = calculateMaxMp(selectedMerc.stats, selectedMerc.level);
                
                const visitingMerc = {
                    ...selectedMerc,
                    currentHp: maxHp,
                    currentMp: maxMp,
                    maxHp,
                    maxMp
                };

                const customer = generateShopRequest(visitingMerc);
                actions.enqueueCustomer(customer);
                
                scheduleNextArrival();
            }, interval);
        };

        scheduleNextArrival();

        return () => {
            if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
        };
    }, [isShopOpen, visitorsToday, state.knownMercenaries, actions]);

    // --- 2. Queue Processing Logic ---
    useEffect(() => {
        if (!isShopOpen) return;

        // If counter is empty and queue has people, call next
        if (!activeCustomer && shopQueue.length > 0) {
            const t = setTimeout(() => {
                actions.nextCustomer();
            }, SHOP_CONFIG.QUEUE_PROCESS_DELAY_MS);
            return () => clearTimeout(t);
        }
    }, [isShopOpen, activeCustomer, shopQueue, actions]);

    // --- 3. Patience Timer Logic ---
    useEffect(() => {
        if (!activeCustomer) {
            if (patienceTimerRef.current) clearTimeout(patienceTimerRef.current);
            return;
        }

        // Customer waits then leaves
        patienceTimerRef.current = setTimeout(() => {
            actions.dismissCustomer();
        }, SHOP_CONFIG.PATIENCE_MS);

        return () => {
            if (patienceTimerRef.current) clearTimeout(patienceTimerRef.current);
        };
    }, [activeCustomer, actions]);
};
