
import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { Trophy, Check, Star, Heart, Sparkles, Coins, Award, User, XCircle, AlertTriangle, Skull } from 'lucide-react';
import { getAssetUrl } from '../../utils';
import { materials } from '../../data/materials';
import { MercenaryPortrait } from '../common/ui/MercenaryPortrait';
import { SfxButton } from '../common/ui/SfxButton';

/**
 * 용병별 경험치 게이지 컴포넌트
 */
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
        statusChange?: 'NONE' | 'INJURED' | 'DEAD';
    };
    delay: number;
    isDefeat?: boolean;
}

const MercenaryExpRadial: React.FC<MercenaryExpRadialProps> = ({ 
    result, 
    delay,
    isDefeat
}) => {
    const { state } = useGame();
    const [progress, setProgress] = useState(0);
    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    
    const merc = state.knownMercenaries.find(m => m.id === result.id);
    
    const targetPercent = (result.currentXp / result.xpToNext) * 100;
    const isLevelUp = result.levelAfter > result.levelBefore;
    const isInjured = result.statusChange === 'INJURED';
    const isDead = result.statusChange === 'DEAD';

    useEffect(() => {
        const timer = setTimeout(() => {
            setProgress(targetPercent);
        }, 300 + delay);
        return () => clearTimeout(timer);
    }, [targetPercent, delay]);

    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-700" style={{ animationDelay: `${delay}ms` }}>
            <div className="relative group">
                <div className={`w-16 h-16 md:w-24 md:h-24 bg-stone-900 rounded-full flex items-center justify-center relative z-10 p-1 md:p-2 border border-stone-800/50 shadow-xl transition-all duration-700 ${isLevelUp ? 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''} ${(isInjured || isDead) ? 'grayscale' : ''}`}>
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-stone-950/40" />
                        <circle 
                            cx="50" cy="50" r="46" 
                            stroke="currentColor" strokeWidth="4" fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className={`transition-all duration-[1500ms] ease-out ${isLevelUp ? 'stroke-blue-400' : isDefeat ? 'stroke-red-800' : 'stroke-amber-500'}`}
                        />
                    </svg>
                    
                    <div className="relative w-[75%] h-[75%] rounded-full overflow-hidden border border-white/5 z-20">
                        {isDead ? (
                            <div className="w-full h-full bg-stone-950 flex items-center justify-center text-2xl md:text-4xl">💀</div>
                        ) : (
                            <MercenaryPortrait 
                                mercenary={merc || { name: result.name }} 
                                className="w-full h-full" 
                                showBg={false}
                            />
                        )}
                    </div>

                    <div className={`absolute -bottom-1 -right-1 md:bottom-0 md:right-0 z-30 px-1.5 py-0.5 rounded-full border shadow-xl flex items-center gap-0.5 ${isDead ? 'bg-black border-red-600' : isInjured ? 'bg-red-900 border-red-500' : isLevelUp ? 'bg-blue-600 border-blue-400 animate-bounce' : 'bg-stone-800 border-stone-700'}`}>
                        <span className="text-[8px] md:text-[10px] font-black text-white font-mono uppercase">
                            {isDead ? 'DEAD' : isInjured ? 'INJ' : `LV.${result.levelAfter}`}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="text-center min-w-0 px-1">
                <div className={`text-[10px] md:text-sm font-black truncate uppercase leading-none ${isDead ? 'text-red-600' : 'text-stone-200'}`}>{result.name.split(' ')[0]}</div>
                {isDead ? (
                    <div className="text-[8px] text-red-500 font-bold mt-1 uppercase">Lost in Action</div>
                ) : (
                    <div className={`text-[8px] md:text-[10px] font-bold mt-1 ${isLevelUp ? 'text-blue-400' : 'text-amber-500'}`}>
                        +{result.xpGained} XP {isLevelUp && 'UP!'}
                    </div>
                )}
            </div>
        </div>
    );
};

const DungeonResultModal = () => {
    const { state, actions } = useGame();
    const { dungeonResult } = state;

    if (!dungeonResult) return null;

    const isDefeat = !!dungeonResult.isDefeat;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md px-[10%] py-[15%] animate-in fade-in duration-500 overflow-hidden">
            <div className={`relative w-fit max-w-[600px] h-fit max-h-full min-h-[200px] min-w-[280px] bg-stone-900 border-2 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 ${isDefeat ? 'border-red-900 shadow-red-900/20' : 'border-amber-600'}`}>
                
                {/* Header */}
                <div className={`${isDefeat ? 'bg-red-950/20' : 'bg-stone-850'} p-4 md:p-6 border-b ${isDefeat ? 'border-red-900/30' : 'border-stone-700'} flex flex-col items-center text-center shrink-0`}>
                    <div className={`hidden xs:flex w-10 h-10 md:w-16 md:h-16 rounded-full border-2 items-center justify-center mb-1 md:mb-3 shadow-xl ${isDefeat ? 'bg-red-900/30 border-red-600 text-red-500' : 'bg-amber-900/30 border-amber-500 text-amber-400 shadow-amber-500/20'}`}>
                        {isDefeat ? <Skull className="w-5 h-5 md:w-8 md:h-8" /> : <Trophy className="w-5 h-5 md:w-8 md:h-8" />}
                    </div>
                    <h2 className={`text-lg md:text-2xl font-bold font-serif tracking-wide leading-tight uppercase px-4 ${isDefeat ? 'text-red-500' : 'text-amber-100'}`}>
                        {isDefeat ? 'Mission Failed' : 'Mission Complete'}
                    </h2>
                    <p className="text-stone-400 text-[10px] md:text-sm mt-0.5 uppercase tracking-widest font-black truncate max-w-full px-6">{dungeonResult.dungeonName}</p>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-8 custom-scrollbar">
                    
                    {/* Squad Status Section */}
                    <div className="space-y-4">
                        <h3 className={`font-black uppercase text-[8px] md:text-xs tracking-[0.2em] border-b pb-1 flex items-center gap-2 ${isDefeat ? 'text-red-500 border-red-900/30' : 'text-stone-500 border-stone-800'}`}>
                            <Award className={`w-3 h-3 ${isDefeat ? 'text-red-500' : 'text-amber-500'}`} /> {isDefeat ? 'Casualty Report' : 'Squad Growth'}
                        </h3>
                        <div className="flex wrap justify-center gap-6 md:gap-10 py-2">
                            {dungeonResult.mercenaryResults.map((m, idx) => (
                                <MercenaryExpRadial key={m.id} result={m} delay={idx * 150} isDefeat={isDefeat} />
                            ))}
                        </div>
                    </div>

                    {!isDefeat && dungeonResult.rescuedMercenary && (
                        <div className="animate-in slide-in-from-top-4 duration-1000">
                            <h3 className="text-amber-500 font-black uppercase text-[8px] md:text-xs tracking-[0.2em] flex items-center gap-2 mb-2">
                                <Sparkles className="w-3 h-3" /> Rescued Survivor
                            </h3>
                            <div className="bg-gradient-to-br from-amber-950/40 to-stone-900 p-3 rounded-xl border border-amber-600/30 flex items-center gap-3">
                                <MercenaryPortrait 
                                    mercenary={dungeonResult.rescuedMercenary} 
                                    className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-amber-500 shrink-0" 
                                />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm md:text-lg font-black text-amber-50 uppercase truncate">{dungeonResult.rescuedMercenary.name}</span>
                                    <span className="text-amber-500/80 font-bold text-[8px] md:text-xs uppercase truncate">{dungeonResult.rescuedMercenary.job} • Lv.{dungeonResult.rescuedMercenary.level}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isDefeat && dungeonResult.goldGained !== undefined && dungeonResult.goldGained > 0 && (
                         <div className="bg-amber-900/10 border border-amber-700/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
                            <span className="text-[8px] md:text-[10px] text-stone-500 font-black uppercase tracking-widest">Total Treasury Gain</span>
                            <div className="flex items-center gap-3">
                                <Coins className="w-5 h-5 md:w-8 md:h-8 text-amber-500" />
                                <span className="text-2xl md:text-4xl font-mono font-black text-amber-400">+{dungeonResult.goldGained} G</span>
                            </div>
                        </div>
                    )}

                    {!isDefeat && dungeonResult.rewards.length > 0 && (
                        <div className="space-y-3 px-2">
                            <h3 className="font-black uppercase text-[8px] md:text-xs tracking-widest border-b pb-1 text-stone-500 border-stone-800">
                                Acquired Materials
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {dungeonResult.rewards.map((reward, idx) => (
                                    <div key={idx} className="flex gap-2 bg-stone-800/40 p-2 rounded-lg border border-stone-700 items-center min-w-[120px]">
                                        <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 bg-stone-950 rounded border border-stone-700 flex items-center justify-center relative">
                                            <img src={getAssetUrl(`${reward.id}.png`, 'materials')} className="w-6 h-6 md:w-8 md:h-8 object-contain" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[10px] md:text-xs font-black text-stone-200 truncate">{reward.name}</div>
                                            <div className="text-amber-500 font-mono text-[9px] font-bold">x{reward.count}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={`p-4 border-t shrink-0 ${isDefeat ? 'bg-stone-900 border-red-900/30' : 'bg-stone-850 border-stone-700'}`}>
                    <SfxButton onClick={actions.dismissDungeonResult} className={`w-full py-3 md:py-4 font-black rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 border-b-4 border-emerald-800 text-xs md:text-base uppercase tracking-widest ${isDefeat ? 'bg-red-700 hover:bg-red-600 text-white border-red-900' : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800'}`}>
                        {isDefeat ? <AlertTriangle className="w-4 h-4 md:w-6 md:h-6" /> : <Check className="w-4 h-4 md:w-6 md:h-6" />}
                        {isDefeat ? 'Emergency Return' : 'Acknowledge & Close'}
                    </SfxButton>
                </div>
            </div>
        </div>
    );
};

export default DungeonResultModal;
