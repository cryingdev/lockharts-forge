import React, { useEffect, useState } from 'react';
import { useTavern } from './hooks/useTavern';
import { useGame } from '../../../context/GameContext';
import { TavernListView } from './ui/TavernListView';
import { TavernInteractionView } from './ui/TavernInteractionView';
import { CommissionBoard } from './ui/CommissionBoard';
import { MercenaryInviteModal } from '../../modals/MercenaryInviteModal';
import { SfxButton } from '../../common/ui/SfxButton';
import { ArrowLeft, ClipboardList } from 'lucide-react';

interface TavernTabProps {
    onNavigate?: (tab: any) => void;
}

import { selectReadyContracts } from '../../../state/selectors/commissionSelectors';

const TavernTab: React.FC<TavernTabProps> = ({ onNavigate }) => {
    const tavern = useTavern();
    const { state, actions } = useGame();
    const [showCommissionBoard, setShowCommissionBoard] = useState(false);
    
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
        <div className="fixed inset-0 z-[50] bg-stone-950 overflow-hidden flex flex-col px-safe">
            {/* Immersive Navigation - Unified Back Action */}
            {onNavigate && (
                <SfxButton 
                    sfx="switch" 
                    onClick={handleBack}
                    className="absolute top-4 left-4 z-[1100] flex items-center gap-2 px-4 py-2 bg-stone-900/80 hover:bg-red-900/60 text-stone-300 rounded-xl border border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-90 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Back</span>
                </SfxButton>
            )}

            {/* Commission Board Button */}
            {!selectedMercenary && (
                <SfxButton 
                    sfx="switch"
                    onClick={() => setShowCommissionBoard(true)}
                    className="absolute top-4 right-4 z-[1100] flex items-center gap-2 px-4 py-2 bg-stone-900/80 hover:bg-amber-900/60 text-stone-300 rounded-xl border border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-90 group"
                >
                    <ClipboardList className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-widest">Commissions</span>
                    {readyContracts.length > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-stone-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                            {readyContracts.length}
                        </div>
                    )}
                </SfxButton>
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
                    onInvite={handlers.handleInvite}
                    onSelect={handlers.handleSelectMercenary}
                    inviteCost={inviteCost}
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
        </div>
    );
};

export default TavernTab;
