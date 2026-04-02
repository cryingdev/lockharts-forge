import React, { lazy, Suspense } from 'react';
import { useDungeon } from './hooks/useDungeon';
import { DungeonListView } from './ui/DungeonListView';
import { DungeonInfoPanel } from './ui/DungeonInfoPanel';
import { SquadActionPanel } from './ui/SquadActionPanel';
import { MercenaryPickerModal } from './ui/MercenaryPickerModal';
const ConfirmationModal = React.lazy(() => import('../../modals/ConfirmationModal'));
import { SfxButton } from '../../common/ui/SfxButton';
import { ArrowLeft } from 'lucide-react';
import { useGame } from '../../../context/GameContext';
import { t } from '../../../utils/i18n';

const AssaultNavigator = lazy(() => import('./AssaultNavigator'));

const NavigatorLoading = () => {
    const { state } = useGame();
    return (
        <div className="absolute inset-0 z-[1000] bg-stone-950 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-red-900/20 border-t-red-600 rounded-full animate-spin mb-4" />
            <span className="text-red-500 font-black uppercase tracking-[0.3em] animate-pulse">{t(state.settings.language, 'dungeon.loading')}</span>
        </div>
    );
};

interface DungeonTabProps {
    onNavigate?: (tab: any) => void;
}

const DungeonTab: React.FC<DungeonTabProps> = ({ onNavigate }) => {
    const dungeon = useDungeon();
    const { 
        state, actions, view, setView, selectedDungeon, selectedFloor,
        party, hiredMercs, availableCandidates, potentialRewards, isFloorCleared,
        requiredPowerForFloor, staminaCostForFloor, currentPartyPower, timeLeft,
        failedMercs, lowHpMercs, failedPowerHighlight, showRecallConfirm, setShowRecallConfirm,
        isPickerOpen, setIsPickerOpen, currentExpedition, hasActiveMission, isOngoingManual,
        inspectedMercId, setInspectedMercId,
        handlers
    } = dungeon;
    const language = state.settings.language;

    const handleBack = () => {
        // If mercenary inspection is open, close it first
        if (inspectedMercId) {
            setInspectedMercId(null);
            return;
        }

        if (view === 'DETAIL') {
            setView('LIST');
        } else if (onNavigate) {
            onNavigate('MAIN');
        }
    };

    return (
        <div className="fixed inset-0 z-[50] bg-stone-950 overflow-hidden flex flex-col px-safe">
            {/* Unified Immersive Back Button Overlay - Always Floating, Hidden during slot selection */}
            {onNavigate && !isPickerOpen && (
                <SfxButton 
                    sfx="switch" 
                    onClick={handleBack} 
                    className="absolute top-4 left-4 z-[1100] flex items-center gap-2 px-4 py-2 bg-stone-900/60 hover:bg-red-900/60 text-stone-300 rounded-xl border border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-90 group animate-in fade-in duration-300"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">{t(language, 'common.back')}</span>
                </SfxButton>
            )}

            {view === 'LIST' ? (
                <DungeonListView 
                    tierLevel={state.stats.tierLevel}
                    maxFloorReached={state.maxFloorReached}
                    dungeonClearCounts={state.dungeonClearCounts}
                    onSelect={handlers.handleDungeonSelect}
                />
            ) : (
                <div className="h-full w-full bg-stone-950 text-stone-200 overflow-hidden font-sans relative flex flex-col sm:flex-row">
                    {(!!state.activeManualDungeon && state.showManualDungeonOverlay) && (
                        <Suspense fallback={<NavigatorLoading />}>
                            <AssaultNavigator 
                                inspectedMercId={inspectedMercId}
                                setInspectedMercId={setInspectedMercId}
                            />
                        </Suspense>
                    )}

                    <DungeonInfoPanel 
                        dungeon={selectedDungeon}
                        selectedFloor={selectedFloor}
                        potentialRewards={potentialRewards}
                        staminaCost={staminaCostForFloor}
                        requiredPower={requiredPowerForFloor}
                        currentPower={currentPartyPower}
                        powerHighlight={failedPowerHighlight}
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
                </div>
            )}

            <MercenaryPickerModal 
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                candidates={availableCandidates}
                onToggle={handlers.toggleMercenary}
                activeExpeditions={state.activeExpeditions}
                activeManualDungeon={state.activeManualDungeon}
                staminaCostForFloor={staminaCostForFloor}
            />

            <React.Suspense fallback={null}>
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
            </React.Suspense>
        </div>
    );
};

export default DungeonTab;
