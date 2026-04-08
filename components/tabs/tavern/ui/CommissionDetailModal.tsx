import React from 'react';
import { X } from 'lucide-react';
import { SfxButton } from '../../../common/ui/SfxButton';
import { CommissionCard } from './CommissionCard';
import { ContractDefinition } from '../../../../types/game-state';
import { useGame } from '../../../../context/GameContext';
import { isContractReady } from '../../../../state/selectors/commissionSelectors';
import { t } from '../../../../utils/i18n';


const WideChevron = ({ direction }: { direction: 'left' | 'right' }) => (
    <svg
        viewBox="0 0 64 64"
        className={`h-[3.2rem] w-[3.2rem] drop-shadow-[0_5px_14px_rgba(0,0,0,0.55)] ${direction === 'right' ? '-scale-x-100' : ''}`}
        fill="none"
        aria-hidden="true"
    >
        <path d="M38 10 L18 32 L38 54" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

interface CommissionDetailModalProps {
    contract: ContractDefinition;
    contracts: ContractDefinition[];
    selectedIndex: number;
    onSelectIndex: (index: number) => void;
    onClose: () => void;
}

export const CommissionDetailModal: React.FC<CommissionDetailModalProps> = ({
    contract,
    contracts,
    selectedIndex,
    onSelectIndex,
    onClose
}) => {
    const { state } = useGame();
    const language = state.settings.language;
    const hasPrev = selectedIndex > 0;
    const hasNext = selectedIndex < contracts.length - 1;

    return (
        <div className="fixed inset-0 z-[2500] flex items-start justify-center overflow-hidden bg-black/10 px-4 pb-4 pt-[18vh] backdrop-blur-[1px] animate-in fade-in duration-300">
            <div className="flex w-full max-w-3xl animate-in zoom-in-95 duration-300 flex-col items-center gap-2.5">
                <div className="relative w-full max-w-[31rem]">
                    <div className="overflow-visible rounded-[1.9rem] border border-stone-800/90 bg-stone-950/95 shadow-[0_24px_56px_rgba(0,0,0,0.58)]">
                        <div className="rounded-t-[1.9rem] border-b border-stone-700/80 bg-gradient-to-b from-[#5b4431] via-[#342920] to-stone-950 px-5 py-3">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-[15px] italic font-black uppercase tracking-[0.18em] text-amber-400">
                                {t(language, 'commission.detail_title')}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full border border-stone-700/70 bg-stone-900/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                                    {selectedIndex + 1}/{contracts.length}
                                </span>
                                <SfxButton 
                                    sfx="switch"
                                    onClick={onClose}
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-700 bg-stone-900/95 text-stone-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(0,0,0,0.45)] transition-all hover:bg-red-900/40 hover:text-red-400"
                                >
                                    <X className="w-5 h-5" />
                                </SfxButton>
                            </div>
                        </div>
                    </div>

                        <div className="relative">
                        <SfxButton
                            sfx="switch"
                            onClick={() => hasPrev && onSelectIndex(selectedIndex - 1)}
                            disabled={!hasPrev}
                            className={`fixed -left-1 top-1/2 z-[2510] flex h-16 w-16 -translate-y-1/2 items-center justify-center bg-transparent transition-all ${
                                hasPrev
                                    ? 'text-[#e5ded6] hover:text-[#f1ebe4]'
                                    : 'text-stone-700 cursor-not-allowed opacity-45'
                            }`}
                        >
                            <WideChevron direction="left" />
                        </SfxButton>

                        <div className="overflow-hidden rounded-b-[1.9rem] shadow-[0_0_54px_rgba(0,0,0,0.5)]">
                            <CommissionCard 
                                contract={contract} 
                                activeTab={contract.status === 'ACTIVE' ? (isContractReady(state, contract) ? 'ready' : 'accepted') : 'available'} 
                                onActionComplete={onClose}
                                className="rounded-none border-0 border-t border-stone-800 p-5 md:p-6"
                            />
                        </div>

                        <SfxButton
                            sfx="switch"
                            onClick={() => hasNext && onSelectIndex(selectedIndex + 1)}
                            disabled={!hasNext}
                            className={`fixed -right-1 top-1/2 z-[2510] flex h-16 w-16 -translate-y-1/2 items-center justify-center bg-transparent transition-all ${
                                hasNext
                                    ? 'text-[#e5ded6] hover:text-[#f1ebe4]'
                                    : 'text-stone-700 cursor-not-allowed opacity-45'
                            }`}
                        >
                            <WideChevron direction="right" />
                        </SfxButton>
                        </div>
                    </div>
                </div>

                {/* Hint */}
                <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500 animate-pulse">
                    {t(language, 'commission.detail_hint')}
                </p>
            </div>
            
            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
};
