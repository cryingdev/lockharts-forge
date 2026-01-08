import React from 'react';
import { useGame } from '../../context/GameContext';
import { Trophy, Check, Star, Heart, Sparkles, Coins } from 'lucide-react';
import { getAssetUrl } from '../../utils';
import { MATERIALS } from '../../data/materials';

const DungeonResultModal = () => {
    const { state, actions } = useGame();
    const { dungeonResult } = state;

    if (!dungeonResult) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md px-[10%] py-[15%] animate-in fade-in duration-500 overflow-hidden">
            <div className="relative w-fit max-w-[600px] h-fit max-h-full min-h-[200px] min-w-[280px] bg-stone-900 border-2 border-amber-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                
                {/* Header */}
                <div className="bg-stone-850 p-4 md:p-6 border-b border-stone-700 flex flex-col items-center text-center shrink-0">
                    <div className="hidden xs:flex w-10 h-10 md:w-16 md:h-16 bg-amber-900/30 rounded-full border-2 border-amber-500 items-center justify-center mb-1 md:mb-3 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        <Trophy className="w-5 h-5 md:w-8 md:h-8 text-amber-400" />
                    </div>
                    <h2 className="text-lg md:text-2xl font-bold text-amber-100 font-serif tracking-wide leading-tight uppercase px-4">Mission Complete</h2>
                    <p className="text-stone-400 text-[10px] md:text-sm mt-0.5 uppercase tracking-widest font-black truncate max-w-full px-6">{dungeonResult.dungeonName}</p>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    {dungeonResult.rescuedMercenary && (
                        <div className="animate-in slide-in-from-top-4 duration-1000">
                            <h3 className="text-amber-500 font-black uppercase text-[8px] md:text-xs tracking-[0.2em] flex items-center gap-2 mb-2">
                                <Sparkles className="w-3 h-3" /> Rescued Survivor
                            </h3>
                            <div className="bg-gradient-to-br from-amber-950/40 to-stone-900 p-3 rounded-xl border border-amber-600/30 flex items-center gap-3">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-stone-950 rounded-full border-2 border-amber-500 flex items-center justify-center shrink-0">
                                    <span className="text-2xl md:text-3xl">{dungeonResult.rescuedMercenary.icon}</span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm md:text-lg font-black text-amber-50 uppercase truncate">{dungeonResult.rescuedMercenary.name}</span>
                                    <span className="text-amber-500/80 font-bold text-[8px] md:text-xs uppercase truncate">{dungeonResult.rescuedMercenary.job} • Lv.{dungeonResult.rescuedMercenary.level}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {dungeonResult.goldGained && dungeonResult.goldGained > 0 && (
                         <div className="bg-amber-900/10 border border-amber-700/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
                            <span className="text-[8px] md:text-[10px] text-stone-500 font-black uppercase tracking-widest">Total Treasury Gain</span>
                            <div className="flex items-center gap-3">
                                <Coins className="w-5 h-5 md:w-8 md:h-8 text-amber-500" />
                                <span className="text-2xl md:text-4xl font-mono font-black text-amber-400">+{dungeonResult.goldGained} G</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 px-2">
                        <h3 className="text-stone-500 font-black uppercase text-[8px] md:text-xs tracking-widest border-b border-stone-800 pb-1">Acquired Materials</h3>
                        {dungeonResult.rewards.length === 0 ? (
                            <div className="text-stone-600 italic text-[10px] md:text-sm text-center py-4 bg-stone-950/30 rounded-lg border border-stone-800 border-dashed">No items found.</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {dungeonResult.rewards.map((reward, idx) => (
                                    <div key={idx} className="flex gap-2 bg-stone-800/40 p-2 rounded-lg border border-stone-700 items-center min-w-[120px]">
                                        <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 bg-stone-950 rounded border border-stone-700 flex items-center justify-center relative">
                                            <img src={getAssetUrl(`${reward.id}.png`)} className="w-6 h-6 md:w-8 md:h-8 object-contain" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[10px] md:text-xs font-black text-stone-200 truncate">{reward.name}</div>
                                            <div className="text-amber-500 font-mono text-[9px] font-bold">x{reward.count}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-700 bg-stone-850 shrink-0">
                    <button onClick={actions.dismissDungeonResult} className="w-full py-3 md:py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 border-b-4 border-emerald-800 text-xs md:text-base uppercase tracking-widest">
                        <Check className="w-4 h-4 md:w-6 md:h-6" />
                        Acknowledge & Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DungeonResultModal;