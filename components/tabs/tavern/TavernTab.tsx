import React from 'react';
import { useTavern } from './hooks/useTavern';
import { TavernListView } from './ui/TavernListView';
import { TavernInteractionView } from './ui/TavernInteractionView';
import { SfxButton } from '../../common/ui/SfxButton';
import { ArrowLeft } from 'lucide-react';

interface TavernTabProps {
    onNavigate?: (tab: any) => void;
}

const TavernTab: React.FC<TavernTabProps> = ({ onNavigate }) => {
    const tavern = useTavern();
    const { 
        selectedMercenary, 
        groupedMercs, 
        isDetailOpen,
        setIsDetailOpen,
        handlers 
    } = tavern;

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
                    onScout={handlers.handleScout}
                    onSelect={handlers.handleSelectMercenary}
                />
            )}
        </div>
    );
};

export default TavernTab;