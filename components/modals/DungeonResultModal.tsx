import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Trophy, Check, ArrowRight, Star } from 'lucide-react';
import { getAssetUrl } from '../../utils';

const DungeonResultModal = () => {
    const { state, actions } = useGame();
    const { dungeonResult } = state;

    if (!dungeonResult) return null;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-500 overflow-hidden">
            <div className="relative z-10 w-full max-w-2xl max-h-[95vh] bg-stone-900 border-2 border-amber-600 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                
                {/* Header - Compact for mobile */}
                <div className="bg-stone-850 p-4 md:p-6 border-b border-stone-700 flex flex-col items-center text-center shrink-0">
                    <div className="hidden xs:flex w-12 h-12 md:w-16 md:h-16 bg-amber-900/30 rounded-full border-2 border-amber-500 items-center justify-center mb-2 md:mb-3 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        <Trophy className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-amber-100 font-serif tracking-wide">Mission Complete</h2>
                    <p className="text-stone-400 text-xs md:text-sm mt-1">{dungeonResult.dungeonName}</p>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    
                    {/* Rewards Section */}
                    <div>
                        <h3 className="text-stone-300 font-bold uppercase text-[10px] md:text-xs tracking-widest mb-3 border-b border-stone-800 pb-1">
                            Loot Acquired
                        </h3>
                        {dungeonResult.rewards.length === 0 ? (
                            <div className="text-stone-600 italic text-sm text-center py-4 bg-stone-950/50 rounded-lg">
                                No items found.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3">
                                {dungeonResult.rewards.map((reward, idx) => (
                                    <div key={idx} className="flex flex-col items-center bg-stone-800 p-2 md:p-3 rounded-lg border border-stone-700 animate-in slide-in-from-bottom-2 fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className="w-8 h-8 md:w-10 md:h-10 mb-2 relative">
                                            <img 
                                                src={getAssetUrl(`${reward.id}.png`)}
                                                className="w-full h-full object-contain"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-stone-950 text-stone-300 text-[8px] md:text-[10px] px-1.5 py-0.5 rounded font-mono border border-stone-700">
                                                x{reward.count}
                                            </div>
                                        </div>
                                        <span className="text-[10px] md:text-xs text-stone-300 text-center leading-tight truncate w-full">{reward.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mercenary XP Section */}
                    <div>
                        <h3 className="text-stone-300 font-bold uppercase text-[10px] md:text-xs tracking-widest mb-3 border-b border-stone-800 pb-1">
                            Party Growth
                        </h3>
                        <div className="space-y-3 pb-2">
                            {dungeonResult.mercenaryResults.map((res, idx) => {
                                const isLevelUp = res.levelAfter > res.levelBefore;
                                const progressPercent = Math.min(100, (res.currentXp / res.xpToNext) * 100);

                                return (
                                    <div key={res.id} className="bg-stone-800 p-2.5 md:p-3 rounded-lg border border-stone-700 flex items-center justify-between gap-4">
                                        <div className="flex flex-col min-w-[80px] md:min-w-[100px]">
                                            <span className="font-bold text-stone-200 text-xs md:text-sm truncate">{res.name}</span>
                                            <span className="text-[10px] text-stone-500 uppercase">{res.job}</span>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-1">
                                            <div className="flex justify-between items-end text-[10px]">
                                                <span className={`font-mono font-bold ${isLevelUp ? 'text-amber-400' : 'text-stone-400'}`}>
                                                    LVL {res.levelAfter}
                                                </span>
                                                <span className="text-stone-500">
                                                    +{res.xpGained} XP
                                                </span>
                                            </div>
                                            
                                            <div className="w-full h-1.5 md:h-2 bg-stone-950 rounded-full overflow-hidden relative">
                                                <div 
                                                    className="h-full bg-blue-600 transition-all duration-1000 ease-out" 
                                                    style={{ width: `${progressPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {isLevelUp && (
                                            <div className="shrink-0 flex flex-col items-center animate-bounce">
                                                <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-yellow-400" />
                                                <span className="text-[8px] font-bold text-yellow-400 uppercase">Level Up!</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-700 bg-stone-850 shrink-0">
                    <button 
                        onClick={actions.dismissDungeonResult}
                        className="w-full py-3 md:py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                        <Check className="w-5 h-5" />
                        Collect & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DungeonResultModal;