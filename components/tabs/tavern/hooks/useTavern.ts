import { useState, useMemo, useCallback } from 'react';
import { useGame } from '../../../../context/GameContext';
import { createRandomMercenary, getUnmetNamedMercenary } from '../../../../utils/mercenaryGenerator';

export const useTavern = () => {
    const { state, actions } = useGame();
    const [selectedMercId, setSelectedMercId] = useState<string | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleScout = useCallback(() => {
        if (state.stats.gold < 50) {
            actions.showToast("Not enough gold.");
            return;
        }
        const newMerc = getUnmetNamedMercenary(state.knownMercenaries) || createRandomMercenary(state.stats.day);
        actions.scoutMercenary(newMerc, 50);
    }, [state.stats.gold, state.knownMercenaries, state.stats.day, actions]);

    const groupedMercs = useMemo(() => {
        const hired = state.knownMercenaries.filter(m => ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(m.status));
        const visitors = state.knownMercenaries.filter(m => !['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(m.status));
        return { hired, visitors };
    }, [state.knownMercenaries]);

    const selectedMercenary = useMemo(() => 
        state.knownMercenaries.find(m => m.id === selectedMercId) || null,
    [state.knownMercenaries, selectedMercId]);

    const handleSelectMercenary = useCallback((id: string) => {
        setSelectedMercId(id);
        setIsDetailOpen(false); // Reset detail when changing mercenary
    }, []);

    const handleCloseInteraction = useCallback(() => {
        setSelectedMercId(null);
        setIsDetailOpen(false);
    }, []);

    return {
        state,
        actions,
        selectedMercId,
        setSelectedMercId,
        selectedMercenary,
        groupedMercs,
        isDetailOpen,
        setIsDetailOpen,
        handlers: {
            handleScout,
            handleSelectMercenary,
            handleCloseInteraction
        }
    };
};