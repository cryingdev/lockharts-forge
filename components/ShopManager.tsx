import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { generateMercenary } from '../utils/mercenaryGenerator';
import { generateShopRequest } from '../utils/shopUtils';

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
            // Random interval between 10s (10000ms) and 60s (60000ms)
            const interval = Math.random() * 50000 + 10000;
            
            arrivalTimerRef.current = setTimeout(() => {
                // Attempt to generate a customer
                
                // We generate a candidate. The generator prefers known regulars but falls back to randoms.
                // We need to ensure we don't pick someone who has already visited today.
                // Note: generateMercenary logic handles selecting regulars who haven't visited,
                // but if it falls back to a NEW mercenary (random), we should check that ID too (though random IDs are unique).
                
                let mercCandidate = generateMercenary(state.knownMercenaries, state.stats.day);
                
                // Double check against visitorsToday to be safe, especially for Named ones
                if (visitorsToday.includes(mercCandidate.id)) {
                     // Try to find a valid replacement from known list
                     const validRegulars = state.knownMercenaries.filter(m => !visitorsToday.includes(m.id));
                     if (validRegulars.length > 0) {
                         mercCandidate = validRegulars[Math.floor(Math.random() * validRegulars.length)];
                     } else {
                         // Everyone known has visited, and generator gave us a duplicate (rare if generator logic is good, but possible)
                         // Force a random one if we can't find a regular?
                         // For now, if everyone visited, we might just skip this turn or generate a purely random nameless one.
                         // Let's assume generateMercenary is robust enough, but if we catch a dupe, we skip.
                         // Ideally generateMercenary returns a unique random if all named are exhausted.
                    
                         // If still duplicate, skip arrival
                         if (visitorsToday.includes(mercCandidate.id)) {
                             scheduleNextArrival();
                             return;
                         }
                     }
                }

                const customer = generateShopRequest(mercCandidate);
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

        // Customer waits 60 seconds then leaves
        patienceTimerRef.current = setTimeout(() => {
            actions.dismissCustomer();
        }, 60000);

        return () => {
            if (patienceTimerRef.current) clearTimeout(patienceTimerRef.current);
        };
    }, [activeCustomer]);

    return null; // Invisible component
};

export default ShopManager;