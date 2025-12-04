import React from 'react';
import { useGame } from '../context/GameContext';
import { createRandomMercenary, getUnmetNamedMercenary } from '../utils/mercenaryGenerator';
import { Heart, PlusCircle } from 'lucide-react';

const TavernTab = () => {
    const { state, actions } = useGame();

    const handleScout = () => {
        // Try to get a named one first for fun, else random
        let newMerc = getUnmetNamedMercenary(state.knownMercenaries);
        if (!newMerc) {
            newMerc = createRandomMercenary(state.stats.day);
        } else {
            // Need to set visit/day if picking from data definition
            newMerc = { ...newMerc, visitCount: 1, lastVisitDay: state.stats.day };
        }
        
        actions.addMercenary(newMerc);
    };

    return (
        <div className="h-full w-full bg-stone-900 p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-amber-500 font-serif">The Broken Anvil Tavern</h2>
                    <p className="text-stone-400">Regulars and potential customers hang out here.</p>
                </div>
                <button 
                    onClick={handleScout}
                    className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded flex items-center gap-2 shadow-lg transition-colors border border-amber-600"
                >
                    <PlusCircle className="w-4 h-4" />
                    <span className="font-bold text-sm">Scout New (Debug)</span>
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.knownMercenaries.map(merc => (
                    <div key={merc.id} className="bg-stone-800 border border-stone-700 p-4 rounded-xl flex gap-4 shadow-lg hover:border-stone-500 transition-colors">
                        {/* Avatar */}
                        <div className="shrink-0">
                             <div className="w-16 h-16 bg-stone-900 rounded-full border-2 border-stone-600 flex items-center justify-center text-3xl shadow-inner">
                                {merc.icon || '👤'}
                             </div>
                             <div className="mt-2 text-center text-[10px] bg-stone-950 rounded py-0.5 text-stone-500 font-mono font-bold">
                                 LVL {merc.level}
                             </div>
                        </div>

                        {/* Stats */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-stone-200 truncate">{merc.name}</h3>
                                {merc.isUnique && <span className="text-[10px] text-amber-400 font-bold border border-amber-900 bg-amber-900/20 px-1.5 py-0.5 rounded tracking-wider">NAMED</span>}
                            </div>
                            <div className="text-xs text-stone-500 mb-2 uppercase tracking-wide font-bold">{merc.job}</div>

                            {/* Affinity */}
                            <div className="flex items-center gap-1 mb-3 bg-stone-900/50 p-1 rounded w-fit px-2 border border-stone-800">
                                <Heart className={`w-3 h-3 ${merc.affinity > 0 ? 'text-pink-500 fill-pink-500' : 'text-stone-600'}`} />
                                <span className="text-xs font-bold text-stone-300 ml-1">{merc.affinity} / 100</span>
                            </div>

                            {/* Bars */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span className="w-4 text-stone-500 font-bold">HP</span>
                                    <div className="flex-1 h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
                                        <div className="h-full bg-red-600" style={{ width: '100%' }}></div>
                                    </div>
                                    <span className="text-stone-400 w-6 text-right">{merc.maxHp}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span className="w-4 text-stone-500 font-bold">MP</span>
                                    <div className="flex-1 h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
                                        <div className="h-full bg-blue-600" style={{ width: '100%' }}></div>
                                    </div>
                                    <span className="text-stone-400 w-6 text-right">{merc.maxMp}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {state.knownMercenaries.length === 0 && (
                     <div className="col-span-full py-16 text-center text-stone-600 italic border-2 border-dashed border-stone-800 rounded-xl bg-stone-900/50">
                        No regulars yet. The tavern is empty.
                     </div>
                )}
            </div>
        </div>
    );
};

export default TavernTab;