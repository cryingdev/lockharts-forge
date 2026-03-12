import { useState, useMemo, useCallback } from 'react';
import { useGame } from '../../../../context/GameContext';
import { createRandomMercenary } from '../../../../utils/mercenaryGenerator';
import { isNamedMercenaryEligible } from '../../../../state/reducer/commission';
import { NAMED_CONTRACT_REGISTRY } from '../../../../data/contracts/namedContracts';
import { NAMED_MERCENARIES } from '../../../../data/mercenaries';
import { rng } from '../../../../utils/random';

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
        
        // 1. Check for eligible named mercenaries that are not currently in the tavern
        const eligibleNamed = NAMED_CONTRACT_REGISTRY.filter(entry => {
            // Only consider TAVERN encounters for this tab
            if (entry.encounterRule.location !== 'TAVERN') return false;
            
            // Check if they are eligible based on unlock rules and cooldowns
            if (!isNamedMercenaryEligible(state, entry)) return false;
            
            // Check if they are already in the tavern list
            const isAlreadyKnown = state.knownMercenaries.some(m => m.id === entry.mercenaryId);
            if (isAlreadyKnown) return false;

            return true;
        });

        let newMerc;
        
        // 2. If there are eligible named mercenaries, prioritize them (e.g., 70% chance to pick one)
        if (eligibleNamed.length > 0 && rng.chance(0.7)) {
            const pickedEntry = rng.pick(eligibleNamed);
            const mercData = NAMED_MERCENARIES.find(m => m.id === pickedEntry.mercenaryId);
            if (mercData) {
                newMerc = { ...mercData, status: 'ENCOUNTERED' as const };
            }
        }

        // 3. Fallback to a random mercenary
        if (!newMerc) {
            newMerc = createRandomMercenary(state.stats.day, state.knownMercenaries);
        }

        setInvitingMercenary(newMerc);
    }, [state.stats.gold, inviteCost, state.stats.day, state.knownMercenaries, state.commission.namedEncounters, actions]);

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
        const visitors = state.knownMercenaries.filter(m => m.status === 'VISITOR');
        const special = state.knownMercenaries.filter(m => ['ENCOUNTERED', 'CONTRACT_ACTIVE'].includes(m.status));
        return { hired, visitors, special };
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