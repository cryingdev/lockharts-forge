
import React from 'react';
import { useGame } from '../../context/GameContext';
import { Trophy, Check, Star, Info } from 'lucide-react';
import { getAssetUrl } from '../../utils';
import { MATERIALS } from '../../data/materials';

const DungeonResultModal = () => {
    const { state, actions } = useGame();
    const { dungeonResult } = state;

    if (!dungeonResult) return null;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md px-[10%] py-[5%] animate-in fade-in duration-500 overflow-hidden">
            <div className="relative z-10 w-full max-w-2xl max-h-[95vh] bg-stone-900 border-2 border-amber-600 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                
                {/* Header */}
                <div className="bg-stone-850 p-4 md:p-6 border-b border-stone-700 flex flex-col items-center text-center shrink-0">
                    <div className="hidden xs:flex w-12 h-12 md:w-16 md:h-16 bg-amber-900/30 rounded-full border-2 border-amber-500 items-center justify-center mb-2 md:mb-3 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        <Trophy className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-amber-100 font-serif tracking-wide">Mission Complete</h2>
                    <p className="text-stone-400 text-xs md:text-sm mt-1 uppercase tracking-widest font-black">{dungeonResult.dungeonName}</p>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-8 custom-scrollbar">
                    
                    {/* Rewards Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-1">
                            <h3 className="text-stone-300 font-black uppercase text-[10px] md:text-xs tracking-widest">
                                Loot Acquired
                            </h3>
                            <span className="text-[8px] bg-amber-950 text-amber-500 px-1.5 rounded font-mono font-bold">{dungeonResult.rewards.length} ITEMS</span>
                        </div>
                        
                        {dungeonResult.rewards.length === 0 ? (
                            <div className="text-stone-600 italic text-sm text-center py-6 bg-stone-950/50 rounded-lg border border-stone-800 border-dashed">
                                No items found in the shadows.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                                {dungeonResult.rewards.map((reward, idx) => {
                                    const materialDef = Object.values(MATERIALS).find(m => m.id === reward.id);
                                    return (
                                        <div key={idx} className="flex gap-3 bg-stone-800/50 p-3 rounded-xl border border-stone-700 animate-in slide-in-from-bottom-2 fade-in hover:bg-stone-800 transition-colors" style={{ animationDelay: `${idx * 100}ms` }}>
                                            <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 bg-stone-950 rounded-lg border border-stone-700 flex items-center justify-center relative group">
                                                <img 
                                                    src={getAssetUrl(`${reward.id}.png`)}
                                                    className="w-8 h-8 md:w-10 md:h-10 object-contain group-hover:scale-110 transition-transform"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                />
                                                <div className="absolute -top-2 -right-2 bg-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-lg ring-2 ring-stone-900">
                                                    x{reward.count}
                                                </div>
                                            </div>
                                            <div className="flex flex-col justify-center min-w-0 overflow-hidden">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] md:text-xs font-black text-stone-100 truncate">{reward.name}</span>
                                                    {(materialDef as any)?.tier && (
                                                        <span className="text-[7px] font-mono text-stone-500 bg-stone-900 px-1 rounded">T{(materialDef as any).tier}</span>
                                                    )}
                                                </div>
                                                <p className="text-[8px] md:text-[10px] text-stone-500 italic mt-0.5 leading-tight line-clamp-2">
                                                    {materialDef?.description || "A mysterious material from the depths."}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Mercenary XP Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-1">
                            <h3 className="text-stone-300 font-black uppercase text-[10px] md:text-xs tracking-widest">
                                Squad Progression
                            </h3>
                        </div>
                        <div className="space-y-3 pb-2">
                            {dungeonResult.mercenaryResults.map((res, idx) => {
                                const isLevelUp = res.levelAfter > res.levelBefore;
                                const progressPercent = Math.min(100, (res.currentXp / res.xpToNext) * 100);

                                return (
                                    <div key={res.id} className="bg-stone-800/30 p-2.5 md:p-4 rounded-xl border border-stone-700/50 flex items-center justify-between gap-4">
                                        <div className="flex flex-col min-w-[90px] md:min-w-[120px]">
                                            <span className="font-black text-stone-200 text-xs md:text-sm truncate uppercase tracking-tighter">{res.name}</span>
                                            <span className="text-[8px] md:text-[10px] text-stone-500 font-bold tracking-widest">{res.job}</span>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <div className="flex justify-between items-end">
                                                <span className={`font-mono text-[10px] font-black ${isLevelUp ? 'text-amber-400' : 'text-stone-400'}`}>
                                                    LVL {res.levelAfter}
                                                </span>
                                                <span className="text-[9px] font-bold text-blue-400 uppercase">
                                                    +{res.xpGained} XP
                                                </span>
                                            </div>
                                            
                                            <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden relative shadow-inner ring-1 ring-white/5">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
                                                    style={{ width: `${progressPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {isLevelUp && (
                                            <div className="shrink-0 flex flex-col items-center animate-bounce ml-2">
                                                <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-yellow-400" />
                                                <span className="text-[8px] font-black text-yellow-400 uppercase tracking-tighter">LVL UP!</span>
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
                        className="w-full py-3 md:py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 border-b-4 border-emerald-800"
                    >
                        <Check className="w-5 h-5 md:w-6 md:h-6" />
                        SECURE LOOT & RETURN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DungeonResultModal;
