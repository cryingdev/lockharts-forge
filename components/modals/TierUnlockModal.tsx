
import React from 'react';
import { useGame } from '../../context/GameContext';
import { Sparkles, Check, Star, Hammer, Wrench } from 'lucide-react';
import { UI_MODAL_LAYOUT } from '../../config/ui-config';
import { SfxButton } from '../common/ui/SfxButton';

const TierUnlockModal = () => {
    const { state, actions } = useGame();

    if (!state.unlockedTierPopup) return null;

    const { type, tier } = state.unlockedTierPopup;

    return (
        <div className={`${UI_MODAL_LAYOUT.OVERLAY} ${UI_MODAL_LAYOUT.Z_INDEX.UNLOCK}`}>
            <style>
                {`
                @keyframes tv-on {
                    0% { transform: scale(0, 0.005); opacity: 0; }
                    40% { transform: scale(1, 0.005); opacity: 1; }
                    100% { transform: scale(1, 1); opacity: 1; }
                }
                .animate-tv-on {
                    animation: tv-on 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                    transform-origin: center;
                }
                `}
            </style>

            <div className={`${UI_MODAL_LAYOUT.CONTAINER} border-amber-600 shadow-[0_0_60px_rgba(0,0,0,0.8)]`}>
                
                {/* Header Section */}
                <div className="bg-stone-850 p-4 md:p-6 border-b border-stone-800 text-center shrink-0 flex flex-col items-center">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-amber-900/30 rounded-full border border-amber-500/50 flex items-center justify-center mb-2 shadow-lg">
                        <Star className="w-5 h-5 md:w-7 md:h-7 text-amber-400" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-stone-100 font-serif uppercase tracking-tight leading-none mb-1">
                        Crafting Excellence
                    </h2>
                    <p className="text-stone-500 text-[9px] md:text-xs italic px-4 leading-tight">
                        "Your hands find the rhythm of advanced materials."
                    </p>
                </div>

                {/* Unlocked Features Grid */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col items-center gap-4 mb-4">
                        <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 shadow-inner flex items-center justify-center">
                            {type === 'FORGE' ? (
                                <Hammer className="w-12 h-12 text-amber-500" />
                            ) : (
                                <Wrench className="w-12 h-12 text-blue-400" />
                            )}
                        </div>
                        <h4 className="text-xs md:text-sm font-black text-stone-300 uppercase tracking-widest text-center">
                            {type === 'FORGE' ? 'Smithing' : 'Workbench'} Tier {tier} Mastery
                        </h4>
                    </div>

                    <div className="mt-2 overflow-hidden">
                        <div className="bg-amber-600 border-y-2 border-amber-400 p-3 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-tv-on">
                            <Sparkles className="w-4 h-4 text-white shrink-0" />
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] md:text-xs font-black text-amber-200 uppercase tracking-[0.2em] leading-none mb-1">New Patterns Unlocked</span>
                                <span className="text-xs md:text-base font-black text-white uppercase tracking-wider text-center drop-shadow-md">Tier {tier} Recipes Available</span>
                            </div>
                            <Sparkles className="w-4 h-4 text-white shrink-0" />
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 md:p-5 bg-stone-850 border-t border-stone-800 shrink-0">
                    <SfxButton 
                        onClick={actions.dismissTierUnlock}
                        className="w-full py-2.5 md:py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 border-b-4 border-emerald-800 text-[10px] md:text-sm uppercase tracking-[0.2em]"
                    >
                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Master New Skills
                    </SfxButton>
                </div>
            </div>
        </div>
    );
};

export default TierUnlockModal;
