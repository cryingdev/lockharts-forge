
import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { Trophy, Check, Star, Heart, Sparkles, Coins, Award, User } from 'lucide-react';
import { getAssetUrl } from '../../utils';
import { MATERIALS } from '../../data/materials';

/**
 * 용병별 경험치 게이지 컴포넌트
 */
// FIX: Typed as React.FC to properly handle standard props like 'key' in parent components
interface MercenaryExpRadialProps {
    result: { 
        id: string; 
        name: string; 
        job: string; 
        levelBefore: number; 
        levelAfter: number; 
        xpGained: number; 
        currentXp: number; 
        xpToNext: number; 
    };
    delay: number;
}

const MercenaryExpRadial: React.FC<MercenaryExpRadialProps> = ({ 
    result, 
    delay 
}) => {
    const [progress, setProgress] = useState(0);
    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    
    // 최종 목표 퍼센트 계산
    const targetPercent = (result.currentXp / result.xpToNext) * 100;
    const isLevelUp = result.levelAfter > result.levelBefore;

    useEffect(() => {
        const timer = setTimeout(() => {
            setProgress(targetPercent);
        }, 300 + delay);
        return () => clearTimeout(timer);
    }, [targetPercent, delay]);

    const offset = circumference - (progress / 100) * circumference;
    const merc = { icon: '👤' }; // 기본 아이콘 (필요시 전역 상태에서 매칭 가능)

    return (
        <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-700" style={{ animationDelay: `${delay}ms` }}>
            <div className="relative group">
                <div className={`w-16 h-16 md:w-24 md:h-24 bg-stone-900 rounded-full flex items-center justify-center relative z-10 p-1 md:p-2 border border-stone-800/50 shadow-xl transition-all duration-700 ${isLevelUp ? 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''}`}>
                    {/* Radial SVG Gauge */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                        {/* Background Track */}
                        <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-stone-950/40" />
                        {/* Progress Arc */}
                        <circle 
                            cx="50" cy="50" r="46" 
                            stroke="currentColor" strokeWidth="4" fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className={`transition-all duration-[1500ms] ease-out ${isLevelUp ? 'stroke-blue-400' : 'stroke-amber-500'}`}
                        />
                    </svg>
                    
                    <div className="text-2xl md:text-4xl filter drop-shadow-md z-20">
                        {/* 용병 아이콘을 찾을 수 있으면 표시 */}
                        {result.name.includes('Pip') ? '🌱' : result.name.includes('Garret') ? '🛡️' : result.name.includes('Elara') ? '🔥' : '👤'}
                    </div>

                    {/* Level Badge */}
                    <div className={`absolute -bottom-1 -right-1 md:bottom-0 md:right-0 z-30 px-1.5 py-0.5 rounded-full border shadow-xl flex items-center gap-0.5 ${isLevelUp ? 'bg-blue-600 border-blue-400 animate-bounce' : 'bg-stone-800 border-stone-700'}`}>
                        <span className="text-[8px] md:text-[10px] font-black text-white font-mono">LV.{result.levelAfter}</span>
                    </div>
                </div>
            </div>
            
            <div className="text-center min-w-0 px-1">
                <div className="text-[10px] md:text-sm font-black text-stone-200 truncate uppercase leading-none">{result.name.split(' ')[0]}</div>
                <div className={`text-[8px] md:text-[10px] font-bold mt-1 ${isLevelUp ? 'text-blue-400' : 'text-amber-500'}`}>
                    +{result.xpGained} XP {isLevelUp && 'UP!'}
                </div>
            </div>
        </div>
    );
};

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
                <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-8 custom-scrollbar">
                    
                    {/* Squad Progress Section */}
                    <div className="space-y-4">
                        <h3 className="text-stone-500 font-black uppercase text-[8px] md:text-xs tracking-[0.2em] border-b border-stone-800 pb-1 flex items-center gap-2">
                            <Award className="w-3 h-3 text-amber-500" /> Squad Growth
                        </h3>
                        <div className="flex flex-wrap justify-center gap-6 md:gap-10 py-2">
                            {dungeonResult.mercenaryResults.map((m, idx) => (
                                <MercenaryExpRadial key={m.id} result={m} delay={idx * 150} />
                            ))}
                        </div>
                    </div>

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
