
import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { generateShopRequest } from '../utils/shopUtils';
import { calculateMaxHp, calculateMaxMp } from '../models/Stats';

/**
 * ShopManager
 * This invisible component handles the background logic for the shop:
 * 1. Generating customers at random intervals (10s - 60s).
 * 2. Managing the queue.
 * 3. Handling customer patience timeouts (60s).
 */
const ShopManager = () => {
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
            // Random interval between 5s (5000ms) and 30s (30000ms)
            const interval = Math.random() * 30000 + 5000;
            
            arrivalTimerRef.current = setTimeout(() => {
                // STRICT MODE: Only allow mercenaries from the 'knownMercenaries' list (Tavern list).
                // Filter out anyone who has already visited today.
                const validCandidates = state.knownMercenaries.filter(m => !visitorsToday.includes(m.id));

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
    }, [isShopOpen, visitorsToday, state.knownMercenaries]);

    // --- 2. Queue Processing Logic ---
    useEffect(() => {
        if (!isShopOpen) return;

        // If counter is empty and queue has people, call next
        if (!activeCustomer && shopQueue.length > 0) {
            // Small delay for natural feel
            const t = setTimeout(() => {
                actions.nextCustomer();
            }, 1000);
            return () => clearTimeout(t);
        }
    }, [isShopOpen, activeCustomer, shopQueue]);

    // --- 3. Patience Timer Logic ---
    useEffect(() => {
        if (!activeCustomer) {
            if (patienceTimerRef.current) clearTimeout(patienceTimerRef.current);
            return;
        }

        // Customer waits 30 seconds then leaves
        patienceTimerRef.current = setTimeout(() => {
            actions.dismissCustomer();
        }, 30000);

        return () => {
            if (patienceTimerRef.current) clearTimeout(patienceTimerRef.current);
        };
    }, [activeCustomer]);

    return null; // Invisible component
};

export default ShopManager;
