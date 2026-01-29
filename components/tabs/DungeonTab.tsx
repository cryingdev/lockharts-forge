
import React from 'react';
import { useDungeon } from './hooks/useDungeon';
import { DungeonListView } from './ui/DungeonListView';
import { DungeonInfoPanel } from './ui/DungeonInfoPanel';
import { SquadActionPanel } from './ui/SquadActionPanel';
import { MercenaryPickerModal } from './ui/MercenaryPickerModal';
import AssaultNavigator from './AssaultNavigator';
import ConfirmationModal from '../../modals/ConfirmationModal';

const DungeonTab = () => {
    const dungeon = useDungeon();
    const { 
        state, actions, view, setView, selectedDungeon, selectedFloor,
        party, hiredMercs, availableCandidates, potentialRewards, isFloorCleared,
        requiredPowerForFloor, staminaCostForFloor, currentPartyPower, timeLeft,
        failedMercs, lowHpMercs, failedPowerHighlight, showRecallConfirm, setShowRecallConfirm,
        isPickerOpen, setIsPickerOpen, currentExpedition, hasActiveMission, isOngoingManual,
        handlers
    } = dungeon;

    if (view === 'LIST') {
        return (
            <DungeonListView 
                tierLevel={state.stats.tierLevel}
                maxFloorReached={state.maxFloorReached}
                dungeonClearCounts={state.dungeonClearCounts}
                onSelect={handlers.handleDungeonSelect}
            />
        );
    }

    return (
        <div className="h-full w-full bg-stone-950 text-stone-200 overflow-hidden font-sans relative flex flex-col sm:flex-row">
            {(!!state.activeManualDungeon && state.showManualDungeonOverlay) && <AssaultNavigator />}

            <DungeonInfoPanel 
                dungeon={selectedDungeon}
                selectedFloor={selectedFloor}
                potentialRewards={potentialRewards}
                staminaCost={staminaCostForFloor}
                requiredPower={requiredPowerForFloor}
                currentPower={currentPartyPower}
                powerHighlight={failedPowerHighlight}
                onBack={() => setView('LIST')}
                onPrevFloor={handlers.handlePrevFloor}
                onNextFloor={handlers.handleNextFloor}
                canGoPrev={selectedFloor > 1}
                canGoNext={selectedFloor < selectedDungeon.maxFloors}
            />

            <div className="flex-1 flex flex-col bg-stone-925 relative overflow-hidden min-h-0 min-w-0">
                <SquadActionPanel 
                    hasActiveMission={hasActiveMission}
                    isOngoingManual={isOngoingManual}
                    currentExpedition={currentExpedition}
                    timeLeft={timeLeft}
                    party={party}
                    maxPartySize={selectedDungeon.maxPartySize || 4}
                    hiredMercs={hiredMercs}
                    failedMercs={failedMercs}
                    lowHpMercs={lowHpMercs}
                    isFloorCleared={isFloorCleared}
                    onClaim={() => actions.claimExpedition(currentExpedition!.id)}
                    onRecall={() => setShowRecallConfirm(isOngoingManual ? 'MANUAL' : 'AUTO')}
                    onToggleMercenary={handlers.toggleMercenary}
                    onOpenPicker={() => setIsPickerOpen(true)}
                    onStartAuto={handlers.handleStartAutoExpedition}
                    onStartManual={handlers.handleStartManualAssault}
                />
            </div>

            <MercenaryPickerModal 
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                candidates={availableCandidates}
                onToggle={handlers.toggleMercenary}
                activeExpeditions={state.activeExpeditions}
                activeManualDungeon={state.activeManualDungeon}
                staminaCostForFloor={staminaCostForFloor}
            />

            <ConfirmationModal 
                isOpen={!!showRecallConfirm} 
                title="Abort Mission?" 
                message="Recalling the squad now will forfeit all progress and potential loot. Continue?" 
                confirmLabel="Confirm Recall" 
                cancelLabel="Stay Deployed" 
                isDanger 
                onConfirm={() => { 
                    if(showRecallConfirm === 'AUTO') actions.abortExpedition(currentExpedition!.id); 
                    else actions.retreatFromManualDungeon(); 
                    setShowRecallConfirm(null); 
                }} 
                onCancel={() => setShowRecallConfirm(null)} 
            />
        </div>
    );
};

export default DungeonTab;
