import React from 'react';
import { useGame } from '../../context/GameContext';
import { 
    Award, Anvil, ShoppingBag, Package, Coins, Beer, Map, Activity, Sparkles, Check
} from 'lucide-react';
import { UI_MODAL_LAYOUT } from '../../config/ui-config';

const TutorialCompleteModal = () => {
    const { state, actions } = useGame();

    if (!state.showTutorialCompleteModal) return null;

    const features = [
        { id: 'FORGE', icon: Anvil, name: 'The Forge', color: 'text-amber-500' },
        { id: 'MARKET', icon: ShoppingBag, name: 'Market', color: 'text-blue-400' },
        { id: 'INVENTORY', icon: Package, name: 'Inventory', color: 'text-stone-400' },
        { id: 'SHOP', icon: Coins, name: 'Shop', color: 'text-emerald-400' },
        { id: 'TAVERN', icon: Beer, name: 'Tavern', color: 'text-orange-400' },
        { id: 'DUNGEON', icon: Map, name: 'Dungeon', color: 'text-red-400' },
        { id: 'SIMULATION', icon: Activity, name: 'Simulation', color: 'text-indigo-400' },
    ];

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
                
                {/* Header Section - Height optimized */}
                <div className="bg-stone-850 p-3 md:p-6 border-b border-stone-800 text-center shrink-0 flex flex-col items-center">
                    <div className="w-8 h-8 md:w-14 md:h-14 bg-amber-900/30 rounded-full border border-amber-500/50 flex items-center justify-center mb-1 md:mb-2 shadow-lg">
                        <Award className="w-4 h-4 md:w-7 md:h-7 text-amber-400" />
                    </div>
                    <h2 className="text-base md:text-xl font-bold text-stone-100 font-serif uppercase tracking-tight leading-none mb-1">Tutorial Completed</h2>
                    <p className="text-stone-500 text-[8px] md:text-xs italic px-2 leading-tight">
                        "The hammer rings. The lineage is restored."
                    </p>
                </div>

                {/* Unlocked Features Grid - Compact version for short screens */}
                <div className="flex-1 p-3 md:p-6 overflow-y-auto custom-scrollbar">
                    <h3 className="text-[7px] md:text-[9px] font-black text-stone-500 uppercase tracking-[0.4em] mb-2 md:mb-3 text-center opacity-60">
                        Facilities Unlocked
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                        {features.map((feat) => (
                            <div 
                                key={feat.id} 
                                className="bg-stone-950/40 border border-white/5 p-1.5 md:p-2 rounded-xl flex items-center gap-1.5 md:gap-2"
                            >
                                <div className="p-1 md:p-1.5 bg-stone-900 rounded-lg border border-white/5 shadow-inner shrink-0">
                                    <feat.icon className={`w-3 h-3 md:w-4 md:h-4 ${feat.color}`} />
                                </div>
                                <h4 className="text-[8px] md:text-[11px] font-black text-stone-300 uppercase truncate leading-none">{feat.name}</h4>
                            </div>
                        ))}
                    </div>

                    {/* Tier Unlocked Message - TV ON Animation Applied Here */}
                    <div className="mt-4 md:mt-6 overflow-hidden">
                        <div className="bg-amber-600 border-y-2 border-amber-400 p-2 md:p-3 flex items-center justify-center gap-2 md:gap-3 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-tv-on">
                            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-white shrink-0" />
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] md:text-xs font-black text-amber-200 uppercase tracking-[0.2em] leading-none mb-1">Status Update</span>
                                <span className="text-[10px] md:text-base font-black text-white uppercase tracking-wider text-center drop-shadow-md">Forging Tier: Level 1 Unlocked</span>
                            </div>
                            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-white shrink-0" />
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-3 md:p-5 bg-stone-850 border-t border-stone-800 shrink-0">
                    <button 
                        onClick={actions.dismissTutorialComplete}
                        className="w-full py-2 md:py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 border-b-4 border-emerald-800 text-[9px] md:text-sm uppercase tracking-[0.2em]"
                    >
                        <Check className="w-3 h-3 md:w-4 md:h-4" />
                        Enter the Forge
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorialCompleteModal;