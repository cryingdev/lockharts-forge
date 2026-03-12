import { useState, useMemo, useCallback } from 'react';
import { useGame } from '../../../../context/GameContext';
import { createRandomMercenary, getUnmetNamedMercenary } from '../../../../utils/mercenaryGenerator';

export const useTavern = () => {
    const { state, actions } = useGame();
    const [selectedMercId, setSelectedMercId] = useState<string | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [invitingMercenary, setInvitingMercenary] = useState<any | null>(null);

    const inviteCost = useMemo(() => 50 * Math.pow(2, state.stats.inviteCount), [state.stats.inviteCount]);

    const handleInvite = useCallback(() => {
        if (state.stats.gold < inviteCost) {
            actions.showToast("Not enough gold.");
            return;
        }
        
        // Named mercenaries are now trigger-based, so always create a random one here
        const newMerc = createRandomMercenary(state.stats.day);
        setInvitingMercenary(newMerc);
    }, [state.stats.gold, inviteCost, state.stats.day, actions]);

    const confirmInvite = useCallback(() => {
        if (invitingMercenary) {
            actions.scoutMercenary(invitingMercenary, inviteCost);
            setInvitingMercenary(null);
            actions.showToast(`${invitingMercenary.name} has arrived at the tavern!`);
        }
    }, [invitingMercenary, inviteCost, actions]);

    const cancelInvite = useCallback(() => {
        setInvitingMercenary(null);
    }, []);

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
        invitingMercenary,
        inviteCost,
        handlers: {
            handleInvite,
            confirmInvite,
            cancelInvite,
            handleSelectMercenary,
            handleCloseInteraction
        }
    };
};