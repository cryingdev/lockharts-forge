
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useGame } from '../../../../context/GameContext';
import { DUNGEONS } from '../../../../data/dungeons';
import { calculatePartyPower } from '../../../../utils/combatLogic';
import { formatDuration } from '../../../../utils';
import { MONSTER_DROPS } from '../../../../data/monster-drops';

export const useDungeon = () => {
    const { state, actions } = useGame();
    const { activeExpeditions, knownMercenaries, dungeonClearCounts, maxFloorReached, activeManualDungeon } = state;

    const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
    const [selectedDungeonId, setSelectedDungeonId] = useState<string | null>(null);
    const [selectedFloor, setSelectedFloor] = useState(1);
    const [party, setParty] = useState<string[]>([]);
    const [failedMercs, setFailedMercs] = useState<string[]>([]);
    const [lowHpMercs, setLowHpMercs] = useState<string[]>([]);
    const [failedPowerHighlight, setFailedPowerHighlight] = useState(false);
    const [showRecallConfirm, setShowRecallConfirm] = useState<'AUTO' | 'MANUAL' | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const selectedDungeon = useMemo(() => 
        DUNGEONS.find(d => d.id === selectedDungeonId) || DUNGEONS[0], 
    [selectedDungeonId]);

    const maxPartySize = selectedDungeon.maxPartySize || 4;
    const isOngoingManual = !!activeManualDungeon && activeManualDungeon.dungeonId === selectedDungeon.id;
    const currentExpedition = activeExpeditions.find(e => e.dungeonId === selectedDungeon.id);
    const hasActiveMission = !!currentExpedition || isOngoingManual;

    // --- EFFECT: Auto-Scrub Dead/Injured Mercenaries from local party state ---
    useEffect(() => {
        if (party.length > 0) {
            const validParty = party.filter(id => {
                const merc = knownMercenaries.find(m => m.id === id);
                return merc && merc.status !== 'DEAD' && merc.status !== 'INJURED';
            });
            if (validParty.length !== party.length) {
                setParty(validParty);
            }
        }
    }, [knownMercenaries, party]);

    const potentialRewards = useMemo(() => {
        if (!selectedDungeon) return [];
        const currentFloorMobs = selectedDungeon.monsterPools
            .filter(p => selectedFloor >= p.minFloor && selectedFloor <= p.maxFloor)
            .flatMap(p => p.monsterIds);
            
        const itemIds = new Set<string>();
        currentFloorMobs.forEach(mobId => {
            const drops = MONSTER_DROPS[mobId];
            if (drops) drops.forEach(d => itemIds.add(d.itemId));
        });

        if (selectedFloor === selectedDungeon.maxFloors) {
            if (selectedDungeon.bossVariantId) {
                const bossDrops = MONSTER_DROPS[selectedDungeon.bossVariantId];
                if (bossDrops) bossDrops.forEach(d => itemIds.add(d.itemId));
            }
            selectedDungeon.rewards.forEach(r => itemIds.add(r.itemId));
        }
        return Array.from(itemIds);
    }, [selectedDungeon, selectedFloor]);

    const isFloorCleared = useMemo(() => {
        const maxReached = maxFloorReached[selectedDungeon.id] || 1;
        if (selectedFloor < maxReached) return true;
        if (selectedFloor === selectedDungeon.maxFloors && (dungeonClearCounts[selectedDungeon.id] || 0) > 0) return true;
        return false;
    }, [selectedDungeon, selectedFloor, maxFloorReached, dungeonClearCounts]);

    const hiredMercs = useMemo(() => 
        knownMercenaries.filter(m => ['HIRED', 'ON_EXPEDITION', 'INJURED', 'DEAD'].includes(m.status)), 
    [knownMercenaries]);

    const availableCandidates = useMemo(() => 
        hiredMercs.filter(m => !party.includes(m.id)),
    [hiredMercs, party]);

    const requiredPowerForFloor = useMemo(() => {
        const base = selectedDungeon.requiredPower;
        return Math.round(base * (1 + (selectedFloor - 1) * 0.25));
    }, [selectedDungeon, selectedFloor]);

    const staminaCostForFloor = useMemo(() => {
        const base = selectedDungeon.energyCost;
        return base + (selectedFloor - 1) * 5;
    }, [selectedDungeon, selectedFloor]);

    const currentPartyPower = useMemo(() => {
        const selectedMercs = knownMercenaries.filter(m => party.includes(m.id));
        return calculatePartyPower(selectedMercs);
    }, [party, knownMercenaries]);

    const [timeLeft, setTimeLeft] = useState<string>('');
    useEffect(() => {
        if (!currentExpedition || currentExpedition.status === 'COMPLETED') {
            setTimeLeft(currentExpedition?.status === 'COMPLETED' ? '00:00' : '');
            return;
        }
        const interval = setInterval(() => {
            const diff = currentExpedition.endTime - Date.now();
            if (diff <= 0) setTimeLeft('00:00');
            else setTimeLeft(formatDuration(diff));
        }, 1000);
        return () => clearInterval(interval);
    }, [currentExpedition]);

    const handleDungeonSelect = useCallback((id: string) => {
        const dungeon = DUNGEONS.find(d => d.id === id);
        if (!dungeon || dungeon.tier > state.stats.tierLevel + 1) {
            actions.showToast("This area is currently inaccessible.");
            return;
        }
        setSelectedDungeonId(id);
        setSelectedFloor(1);
        setParty([]);
        setView('DETAIL');
    }, [state.stats.tierLevel, actions]);

    const toggleMercenary = useCallback((mercId: string) => {
        const merc = hiredMercs.find(m => m.id === mercId);
        if (!merc) return;
        
        if (party.includes(mercId)) {
            setParty(prev => prev.filter(id => id !== mercId));
            return;
        }

        if (merc.status === 'DEAD') {
            actions.showToast("The fallen cannot be deployed.");
            return;
        }

        if (party.length < maxPartySize) {
            setParty(prev => [...prev, mercId]);
            setIsPickerOpen(false);
        }
    }, [hiredMercs, party, maxPartySize, actions]);

    const validateEntry = useCallback(() => {
        if (party.length === 0) return false;
        const selectedMercs = knownMercenaries.filter(m => party.includes(m.id));
        
        const lowHpIds = selectedMercs.filter(m => (m.currentHp || 0) < 1 || m.status === 'INJURED').map(m => m.id);
        if (lowHpIds.length > 0) {
            setLowHpMercs(lowHpIds);
            setTimeout(() => setLowHpMercs([]), 2000);
            actions.showToast("Wounded members cannot be deployed.");
            return false;
        }

        const deadIds = selectedMercs.filter(m => m.status === 'DEAD').map(m => m.id);
        if (deadIds.length > 0) {
            actions.showToast("Casualties must be removed from the squad.");
            return false;
        }

        const lowStaminaIds = selectedMercs.filter(m => (m.expeditionEnergy || 0) < staminaCostForFloor).map(m => m.id);
        if (lowStaminaIds.length > 0) {
            setFailedMercs(lowStaminaIds);
            setTimeout(() => setFailedMercs([]), 2000);
            actions.showToast("Some squad members are too exhausted.");
            return false;
        }

        if (currentPartyPower < requiredPowerForFloor) {
            setFailedPowerHighlight(true);
            setTimeout(() => setFailedPowerHighlight(false), 2000);
            actions.showToast("Party power is insufficient for this floor.");
            return false;
        }
        return true;
    }, [party, knownMercenaries, staminaCostForFloor, currentPartyPower, requiredPowerForFloor, actions]);

    const handleStartAutoExpedition = useCallback(() => {
        if (!isFloorCleared) { actions.showToast("Manual clear required."); return; }
        if (isOngoingManual) return actions.showToast("Manual assault active.");
        if (!validateEntry()) return;
        actions.startExpedition(selectedDungeon.id, party);
    }, [isFloorCleared, isOngoingManual, validateEntry, actions, selectedDungeon.id, party]);

    const handleStartManualAssault = useCallback(() => {
        if (isOngoingManual) { actions.toggleManualDungeonOverlay(true); return; }
        if (!validateEntry()) return;
        actions.startManualAssault(selectedDungeon.id, party, selectedFloor);
    }, [isOngoingManual, validateEntry, actions, selectedDungeon.id, party, selectedFloor]);

    return {
        state, actions, view, setView, selectedDungeon, selectedFloor, setSelectedFloor,
        party, hiredMercs, availableCandidates, potentialRewards, isFloorCleared,
        requiredPowerForFloor, staminaCostForFloor, currentPartyPower, timeLeft,
        failedMercs, lowHpMercs, failedPowerHighlight, showRecallConfirm, setShowRecallConfirm,
        isPickerOpen, setIsPickerOpen, currentExpedition, hasActiveMission, isOngoingManual,
        handlers: {
            handleDungeonSelect,
            handlePrevFloor: () => setSelectedFloor(prev => Math.max(1, prev - 1)),
            handleNextFloor: () => {
                const maxReached = maxFloorReached[selectedDungeon.id] || 1;
                if (selectedFloor < selectedDungeon.maxFloors && selectedFloor < maxReached) {
                    setSelectedFloor(prev => prev + 1);
                } else if (selectedFloor >= selectedDungeon.maxFloors) {
                    // max
                } else {
                    actions.showToast("You must clear the current floor to descend deeper.");
                }
            },
            toggleMercenary,
            handleStartAutoExpedition,
            handleStartManualAssault
        }
    };
};
