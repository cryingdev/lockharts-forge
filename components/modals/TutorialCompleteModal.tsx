import React from 'react';
import { useGame } from '../../context/GameContext';
import { 
    Award, Anvil, ShoppingBag, Package, Coins, Beer, Map, Activity, Sparkles, Check
} from 'lucide-react';

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
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/85 backdrop-blur-md px-[6%] py-[10%] animate-in fade-in duration-300 overflow-hidden">
            <div className="relative w-[88vw] max-w-[420px] h-fit max-h-full bg-stone-900 border-2 border-amber-600 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 mx-auto">
                
                {/* Header Section - Compact */}
                <div className="bg-stone-850 p-4 md:p-6 border-b border-stone-800 text-center shrink-0 flex flex-col items-center">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-amber-900/30 rounded-full border border-amber-500/50 flex items-center justify-center mb-2 shadow-lg animate-bounce">
                        <Award className="w-5 h-5 md:w-7 md:h-7 text-amber-400" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-stone-100 font-serif uppercase tracking-tight leading-none mb-1">Tutorial Completed</h2>
                    <p className="text-stone-500 text-[9px] md:text-xs italic px-4 leading-tight">
                        "The hammer rings. The lineage is restored."
                    </p>
                </div>

                {/* Unlocked Features Grid */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
                    <h3 className="text-[7px] md:text-[9px] font-black text-stone-500 uppercase tracking-[0.4em] mb-3 text-center opacity-60">
                        Facilities Unlocked
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-1.5">
                        {features.map((feat, idx) => (
                            <div 
                                key={feat.id} 
                                className="bg-stone-950/40 border border-white/5 p-1.5 md:p-2 rounded-xl flex items-center gap-2 animate-in slide-in-from-bottom-1 duration-500"
                                style={{ animationDelay: `${idx * 40}ms` }}
                            >
                                <div className="p-1.5 bg-stone-900 rounded-lg border border-white/5 shadow-inner shrink-0">
                                    <feat.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${feat.color}`} />
                                </div>
                                <h4 className="text-[9px] md:text-[11px] font-black text-stone-300 uppercase truncate leading-none">{feat.name}</h4>
                            </div>
                        ))}
                    </div>

                    {/* Bonus Reveal */}
                    <div className="mt-4 bg-amber-900/10 border border-amber-500/20 rounded-xl p-2.5 flex items-center justify-center gap-2 animate-in fade-in delay-500 duration-1000">
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-[7px] md:text-[10px] font-black text-amber-200 uppercase tracking-widest text-center">Global Market Tier 1 access granted</span>
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 md:p-5 bg-stone-850 border-t border-stone-800 shrink-0">
                    <button 
                        onClick={actions.dismissTutorialComplete}
                        className="w-full py-2.5 md:py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 border-b-4 border-amber-800 text-[10px] md:text-sm uppercase tracking-[0.2em]"
                    >
                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Enter the Forge
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorialCompleteModal;