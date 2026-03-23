import React from 'react';
import { X } from 'lucide-react';
import { SfxButton } from '../../../common/ui/SfxButton';
import { CommissionCard } from './CommissionCard';
import { ContractDefinition } from '../../../../types/game-state';
import { useGame } from '../../../../context/GameContext';
import { isContractReady } from '../../../../state/selectors/commissionSelectors';

interface CommissionDetailModalProps {
    contract: ContractDefinition;
    onClose: () => void;
}

export const CommissionDetailModal: React.FC<CommissionDetailModalProps> = ({ contract, onClose }) => {
    const { state } = useGame();
    return (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg animate-in zoom-in-95 duration-300 flex flex-col gap-4">
                {/* Header with Close Button */}
                <div className="flex justify-between items-center px-2">
                    <h2 className="text-amber-500 font-black uppercase tracking-[0.3em] text-sm italic">Commission Details</h2>
                    <SfxButton 
                        sfx="switch"
                        onClick={onClose}
                        className="p-2 bg-stone-900/80 hover:bg-red-900/40 text-stone-400 hover:text-red-500 rounded-full border border-stone-800 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </SfxButton>
                </div>

                {/* The Card */}
                <div className="shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <CommissionCard 
                        contract={contract} 
                        activeTab={contract.status === 'ACTIVE' ? (isContractReady(state, contract) ? 'ready' : 'accepted') : 'available'} 
                        onActionComplete={onClose}
                    />
                </div>

                {/* Hint */}
                <p className="text-center text-[10px] text-stone-500 uppercase font-bold tracking-widest animate-pulse">
                    Click outside or press X to close
                </p>
            </div>
            
            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
};
