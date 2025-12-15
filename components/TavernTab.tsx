
import React from 'react';
import { useGame } from '../context/GameContext';
import { createRandomMercenary, getUnmetNamedMercenary } from '../utils/mercenaryGenerator';
import { Heart, PlusCircle, Coins, CheckCircle, Lock, CalendarClock } from 'lucide-react';
import { CONTRACT_CONFIG, calculateHiringCost, calculateDailyWage } from '../config/contract-config';

const TavernTab = () => {
    const { state, actions } = useGame();
    const { gold } = state.stats;

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

    const handleHire = (mercId: string, cost: number) => {
        actions.hireMercenary(mercId, cost);
    };

    return (
        <div className="h-full w-full bg-stone-900 p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-amber-500 font-serif">The Broken Anvil Tavern</h2>
                    <p className="text-stone-400">Wayfarers, regulars, and potential companions gather here.</p>
                </div>
                <button 
                    onClick={handleScout}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-4 py-2 rounded flex items-center gap-2 shadow-lg transition-colors border border-stone-600"
                >
                    <PlusCircle className="w-4 h-4" />
                    <span className="font-bold text-sm">Wait for New Faces</span>
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.knownMercenaries.map(merc => {
                    const hiringCost = calculateHiringCost(merc.level, merc.job);
                    const dailyWage = calculateDailyWage(merc.level, merc.job);
                    const canAfford = gold >= hiringCost;
                    const hasAffinity = merc.affinity >= CONTRACT_CONFIG.HIRE_AFFINITY_THRESHOLD;
                    const isHired = merc.isHired;

                    return (
                        <div key={merc.id} className={`bg-stone-800 border ${isHired ? 'border-amber-600/50' : 'border-stone-700'} p-4 rounded-xl flex flex-col gap-4 shadow-lg hover:border-stone-500 transition-colors relative overflow-hidden`}>
                            {/* Hired Banner */}
                            {isHired && (
                                <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-900/40 text-amber-500 px-2 py-1 rounded text-xs font-bold border border-amber-800/50">
                                    <CheckCircle className="w-3 h-3" /> HIRED
                                </div>
                            )}

                            <div className="flex gap-4">
                                {/* Avatar */}
                                <div className="shrink-0">
                                     <div className={`w-16 h-16 bg-stone-900 rounded-full border-2 ${isHired ? 'border-amber-600' : 'border-stone-600'} flex items-center justify-center text-3xl shadow-inner`}>
                                        {merc.icon || '👤'}
                                     </div>
                                     <div className="mt-2 text-center text-[10px] bg-stone-950 rounded py-0.5 text-stone-500 font-mono font-bold">
                                         LVL {merc.level}
                                     </div>
                                </div>

                                {/* Stats */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start pr-16">
                                        <h3 className="font-bold text-stone-200 truncate">{merc.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs text-stone-500 uppercase tracking-wide font-bold">{merc.job}</span>
                                        {merc.isUnique && <span className="text-[10px] text-amber-600 font-bold bg-amber-950/30 px-1 rounded">NAMED</span>}
                                    </div>

                                    {/* Affinity */}
                                    <div className="flex items-center gap-1 mb-3 bg-stone-900/50 p-1 rounded w-fit px-2 border border-stone-800" title={`Threshold for hiring: ${CONTRACT_CONFIG.HIRE_AFFINITY_THRESHOLD}`}>
                                        <Heart className={`w-3 h-3 ${merc.affinity > 0 ? 'text-pink-500 fill-pink-500' : 'text-stone-600'}`} />
                                        <span className={`text-xs font-bold ml-1 ${merc.affinity >= CONTRACT_CONFIG.HIRE_AFFINITY_THRESHOLD ? 'text-pink-400' : 'text-stone-500'}`}>
                                            {merc.affinity} / 100
                                        </span>
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

                            {/* Wage Info */}
                            {!isHired && (
                                <div className="bg-stone-900/40 p-2 rounded flex justify-between items-center text-xs border border-stone-800">
                                    <span className="text-stone-500 flex items-center gap-1"><CalendarClock className="w-3 h-3"/> Daily Wage</span>
                                    <span className="font-mono text-stone-300 font-bold">{dailyWage} G</span>
                                </div>
                            )}

                            {/* Action Area */}
                            {!isHired && (
                                <div className="mt-2 border-t border-stone-700 pt-3">
                                    {hasAffinity ? (
                                        <button 
                                            onClick={() => handleHire(merc.id, hiringCost)}
                                            disabled={!canAfford}
                                            className={`w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                                canAfford 
                                                ? 'bg-amber-700 hover:bg-amber-600 text-white shadow-md' 
                                                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                                            }`}
                                        >
                                            <span>Sign Contract</span>
                                            <div className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${canAfford ? 'bg-amber-800/50' : 'bg-stone-900'}`}>
                                                <Coins className="w-3 h-3" /> {hiringCost}
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="flex items-center justify-between text-stone-500 bg-stone-900/50 p-2 rounded border border-stone-800/50">
                                            <div className="flex items-center gap-2 text-xs">
                                                <Lock className="w-3 h-3" />
                                                <span>Trust required</span>
                                            </div>
                                            <span className="text-[10px] font-mono">Need {CONTRACT_CONFIG.HIRE_AFFINITY_THRESHOLD} Affinity</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                
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
