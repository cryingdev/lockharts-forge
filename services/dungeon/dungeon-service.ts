
import { useEffect } from 'react';
import { useGame } from '../../context/GameContext';

/**
 * useDungeonService
 * Handles the lifecycle of expeditions (background logic).
 * Monitors time and transitions ACTIVE -> COMPLETED.
 */
export const useDungeonService = () => {
    const { state, actions } = useGame();
    const { activeExpeditions } = state;

    useEffect(() => {
        // If there are no ACTIVE expeditions, we don't need to run the interval
        const hasActive = activeExpeditions.some(e => e.status === 'ACTIVE');
        if (!hasActive) return;

        const interval = setInterval(() => {
            const now = Date.now();
            
            // Find expeditions that are ACTIVE but have passed their endTime
            const finishedExpeditions = activeExpeditions.filter(
                exp => exp.status === 'ACTIVE' && now >= exp.endTime
            );

            // Trigger completion callback/action for each
            finishedExpeditions.forEach(exp => {
                actions.completeExpedition(exp.id);
            });

        }, 1000);

        return () => clearInterval(interval);
    }, [activeExpeditions, actions]);
};
