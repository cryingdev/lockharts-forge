import React, { useEffect, useState } from 'react';
import { useTavern } from './hooks/useTavern';
import { useGame } from '../../../context/GameContext';
import { TavernListView } from './ui/TavernListView';
import { TavernInteractionView } from './ui/TavernInteractionView';
import { CommissionBoard } from './ui/CommissionBoard';
import { CommissionDetailModal } from './ui/CommissionDetailModal';
import { MercenaryInviteModal } from '../../modals/MercenaryInviteModal';
import { SfxButton } from '../../common/ui/SfxButton';
import { ArrowLeft, PlusCircle } from 'lucide-react';

interface TavernTabProps {
    onNavigate?: (tab: any) => void;
}

import { selectReadyContracts, selectAvailableContracts, selectAcceptedContracts } from '../../../state/selectors/commissionSelectors';

const TavernTab: React.FC<TavernTabProps> = ({ onNavigate }) => {
    const tavern = useTavern();
    const { state, actions } = useGame();
    const [showCommissionBoard, setShowCommissionBoard] = useState(false);
    const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
    
    const { 
        selectedMercenary, 
        groupedMercs, 
        isDetailOpen,
        setIsDetailOpen,
        invitingMercenary,
        inviteCost,
        handlers 
    } = tavern;

    const readyContracts = selectReadyContracts(state);
    const availableContracts = selectAvailableContracts(state);
    const acceptedContracts = selectAcceptedContracts(state);
    const selectedContract = [...availableContracts, ...acceptedContracts].find(c => c.id === selectedContractId);

    useEffect(() => {
        actions.refreshCommissions();
        actions.triggerNamedEncounterCheck('TAVERN');
    }, []);

    const handleBack = () => {
        if (isDetailOpen) {
            setIsDetailOpen(false);
        } else if (selectedMercenary) {
            handlers.handleCloseInteraction();
        } else if (onNavigate) {
            onNavigate('MAIN');
        }
    };

    return (
        <div className="fixed inset-0 z-[50] bg-stone-950 overflow-hidden flex flex-col px-safe pt-safe pb-safe">
            {/* Immersive Navigation Header */}
            {(!invitingMercenary && !selectedContractId) && (
                <div className="absolute top-4 left-4 right-4 z-[1100] flex items-center justify-between pointer-events-none">
                    <div className="pointer-events-auto">
                        {onNavigate && (
                            <SfxButton 
                                sfx="switch" 
                                onClick={handleBack}
                                className="flex items-center gap-2 px-4 py-2 bg-stone-900/80 hover:bg-red-900/60 text-stone-300 rounded-xl border border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-90 group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-xs font-black uppercase tracking-widest">Back</span>
                            </SfxButton>
                        )}
                    </div>

                    {!selectedMercenary && (
                        <div className="flex items-center gap-2 pointer-events-auto">
                            <SfxButton 
                                sfx="switch"
                                onClick={handlers.handleInvite}
                                className="flex items-center gap-2 px-4 py-2 bg-stone-900/80 hover:bg-amber-900/60 text-stone-300 rounded-xl border border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-90 group"
                            >
                                <PlusCircle className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-black uppercase tracking-widest">Invite ({inviteCost}G)</span>
                            </SfxButton>
                        </div>
                    )}
                </div>
            )}


            {/* View Switcher */}
            {selectedMercenary ? (
                <TavernInteractionView 
                    mercenary={selectedMercenary} 
                    onBack={handlers.handleCloseInteraction}
                    isDetailOpen={isDetailOpen}
                    setIsDetailOpen={setIsDetailOpen}
                />
            ) : (
                <TavernListView 
                    hired={groupedMercs.hired}
                    visitors={groupedMercs.visitors}
                    availableContracts={availableContracts}
                    acceptedContracts={acceptedContracts}
                    onInvite={handlers.handleInvite}
                    onSelect={handlers.handleSelectMercenary}
                    onOpenCommissions={() => setShowCommissionBoard(true)}
                    onSelectContract={(id) => setSelectedContractId(id)}
                    inviteCost={inviteCost}
                    readyContractsCount={readyContracts.length}
                />
            )}

            <MercenaryInviteModal 
                mercenary={invitingMercenary}
                onConfirm={handlers.confirmInvite}
                onClose={handlers.cancelInvite}
            />

            {/* Commission Board Modal */}
            {showCommissionBoard && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl h-[80vh] animate-in zoom-in-95">
                        <CommissionBoard onClose={() => setShowCommissionBoard(false)} />
                    </div>
                </div>
            )}

            {/* Commission Detail Modal */}
            {selectedContract && (
                <CommissionDetailModal 
                    contract={selectedContract}
                    onClose={() => setSelectedContractId(null)}
                />
            )}
        </div>
    );
};

export default TavernTab;
