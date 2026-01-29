
import { useState, useMemo, useCallback } from 'react';
import { useGame } from '../../../../context/GameContext';
import { createRandomMercenary, getUnmetNamedMercenary } from '../../../../utils/mercenaryGenerator';

export const useTavern = () => {
    const { state, actions } = useGame();
    const [selectedMercId, setSelectedMercId] = useState<string | null>(null);

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

    return {
        state,
        actions,
        selectedMercId,
        setSelectedMercId,
        selectedMercenary,
        groupedMercs,
        handlers: {
            handleScout,
            handleSelectMercenary: (id: string) => setSelectedMercId(id),
            handleCloseInteraction: () => setSelectedMercId(null)
        }
    };
};
