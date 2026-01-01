import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import { DUNGEONS } from '../../../data/dungeons';
import { calculatePartyPower, calculateMercenaryPower, formatDuration } from '../../../utils/dungeonUtils';
import { Sword, Skull, Timer, Zap, Map as MapIcon, ChevronRight, Lock, CheckCircle, Trophy, User, XCircle } from 'lucide-react';
import { getAssetUrl } from '../../../utils';

const DungeonTab = () => {
    const { state, actions } = useGame();
    const { activeExpeditions, knownMercenaries, dungeonClearCounts } = state;

    const [selectedDungeonId, setSelectedDungeonId] = useState<string | null>(null);
    const [party, setParty] = useState<string[]>([]);
    
    const selectedDungeon = DUNGEONS.find(d => d.id === selectedDungeonId) || DUNGEONS[0];

    const hiredMercs = useMemo(() => knownMercenaries.filter(m => m.status === 'HIRED'), [knownMercenaries]);
    const currentExpedition = activeExpeditions.find(e => e.dungeonId === selectedDungeon.id);
    
    const isMercBusy = (mercId: string) => {
        return activeExpeditions.some(e => e.partyIds.includes(mercId));
    };

    const handleSelectDungeon = (id: string) => {
        setSelectedDungeonId(id);
        setParty([]); 
    };

    const toggleMercenary = (mercId: string) => {
        if (party.includes(mercId)) {
            setParty(prev => prev.filter(id => id !== mercId));
        } else {
            if (party.length < 4) {
                setParty(prev => [...prev, mercId]);
            }
        }
    };

    const handleStartExpedition = () => {
        if (party.length === 0 || !selectedDungeon) return;
        actions.startExpedition(selectedDungeon.id, party);
    };

    const handleClaim = (expId: string) => {
        actions.claimExpedition(expId);
    };

    const currentPartyPower = useMemo(() => {
        const selectedMercs = knownMercenaries.filter(m => party.includes(m.id));
        return calculatePartyPower(selectedMercs);
    }, [party, knownMercenaries]);

    const canStart = useMemo(() => {
        if (!selectedDungeon) return false;
        if (party.length === 0) return false;
        if (currentPartyPower < selectedDungeon.requiredPower) return false;
        
        const selectedMercs = knownMercenaries.filter(m => party.includes(m.id));
        const hasEnergy = selectedMercs.every(m => (m.expeditionEnergy || 0) >= selectedDungeon.energyCost);
        
        return hasEnergy;
    }, [selectedDungeon, party, currentPartyPower, knownMercenaries]);

    const [timeLeft, setTimeLeft] = useState<string>('');
    const isComplete = currentExpedition?.status === 'COMPLETED';

    useEffect(() => {
        if (!currentExpedition) return;
        if (currentExpedition.status === 'COMPLETED') {
            setTimeLeft('00:00');
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const end = currentExpedition.endTime;
            const diff = end - now;
            if (diff <= 0) setTimeLeft('00:00');
            else setTimeLeft(formatDuration(diff));
        }, 1000);

        return () => clearInterval(interval);
    }, [currentExpedition]);

    return (
        <div className="h-full w-full flex flex-col lg:flex-row bg-stone-950 text-stone-200 overflow-hidden">
            
            {/* Sidebar: Dungeon List - Top 30% on narrow, Left 30% on wide */}
            <div className="w-full lg:w-[30%] min-w-0 lg:min-w-[320px] h-[30vh] lg:h-full bg-stone-900 border-b lg:border-b-0 lg:border-r border-stone-800 flex flex-col shrink-0 z-20 shadow-xl">
                <div className="p-3 md:p-4 border-b border-stone-800 flex items-center justify-between shrink-0 bg-stone-900/50">
                    <div className="flex items-center gap-2">
                        <MapIcon className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                        <h2 className="font-bold font-serif tracking-wide text-amber-100 text-sm md:text-base uppercase">Expeditions</h2>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 bg-black/40 px-2 py-0.5 rounded-full">{DUNGEONS.length} Sites</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-stone-925/30">
                    {DUNGEONS.map(dungeon => {
                        const clears = dungeonClearCounts[dungeon.id] || 0;
                        const isUnlocked = dungeon.tier <= state.stats.tierLevel + 1; 
                        const activeExp = activeExpeditions.find(e => e.dungeonId === dungeon.id);

                        return (
                            <button
                                key={dungeon.id}
                                onClick={() => handleSelectDungeon(dungeon.id)}
                                disabled={!isUnlocked}
                                className={`w-full p-2.5 md:p-3 rounded-xl text-left transition-all border-2 relative overflow-hidden group ${
                                    selectedDungeon.id === dungeon.id 
                                    ? 'bg-amber-900/20 border-amber-600/50 shadow-lg shadow-amber-900/10' 
                                    : 'bg-stone-800 border-stone-700/50 hover:border-stone-500 hover:bg-stone-750'
                                } ${!isUnlocked ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1 relative z-10">
                                    <div className="flex flex-col min-w-0">
                                        <span className={`font-bold text-xs md:text-sm truncate pr-2 ${selectedDungeon.id === dungeon.id ? 'text-amber-400' : 'text-stone-300'}`}>
                                            {dungeon.name}
                                        </span>
                                        <div className="flex items-center gap-2 text-[9px] text-stone-500 mt-0.5">
                                            <span className="bg-stone-950 px-1 py-0.5 rounded-md font-mono text-stone-400">T{dungeon.tier}</span>
                                            <div className="flex items-center gap-1">
                                                <Timer className="w-2.5 h-2.5" /> {dungeon.durationMinutes}m
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {activeExp && (
                                        <div className="shrink-0 ml-2">
                                             {activeExp.status === 'COMPLETED' ? (
                                                 <div className="bg-emerald-500/20 p-1 rounded-full border border-emerald-500/50 animate-bounce">
                                                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
                                                 </div>
                                             ) : (
                                                 <div className="bg-amber-500/20 p-1 rounded-full border border-amber-500/50 animate-pulse">
                                                    <Timer className="w-3 h-3 md:w-4 md:h-4 text-amber-400" />
                                                 </div>
                                             )}
                                        </div>
                                    )}
                                </div>

                                {dungeon.bossUnlockReq && (
                                    <div className="mt-2 w-full bg-stone-950 h-1 rounded-full overflow-hidden relative z-10">
                                        <div 
                                            className="h-full bg-red-800 shadow-[0_0_8px_rgba(153,27,27,0.5)] transition-all duration-1000" 
                                            style={{ width: `${Math.min(100, (clears / dungeon.bossUnlockReq) * 100)}%` }}
                                        ></div>
                                    </div>
                                )}
                                
                                {!isUnlocked && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                                        <Lock className="w-4 h-4 text-stone-600" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Area - Details & Party Deployment */}
            <div className="flex-1 flex flex-col relative overflow-hidden min-h-0 bg-stone-950">
                 {/* Decorative background */}
                 <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
                    <img src={getAssetUrl('dungeon_bg.png')} className="w-full h-full object-cover grayscale mix-blend-overlay" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/50"></div>
                </div>

                <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
                    {currentExpedition ? (
                        <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-8 text-center animate-in fade-in zoom-in duration-500">
                            <div className="relative mb-6 md:mb-8">
                                <div className={`absolute inset-0 blur-3xl rounded-full opacity-30 ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                <div className="w-24 h-24 md:w-40 md:h-40 bg-stone-900 rounded-full border-4 border-stone-700 flex items-center justify-center relative shadow-2xl ring-2 ring-white/5">
                                    {isComplete ? (
                                        <Trophy className="w-12 h-12 md:w-20 md:h-20 text-emerald-500 animate-bounce" />
                                    ) : (
                                        <Timer className="w-12 h-12 md:w-20 md:h-20 text-amber-500 animate-pulse" />
                                    )}
                                </div>
                            </div>
                            
                            <h2 className="text-xl md:text-4xl font-black text-stone-100 mb-2 font-serif tracking-tight">{selectedDungeon.name}</h2>
                            <div className={`text-sm md:text-2xl font-mono font-black mb-8 md:mb-12 px-6 py-2.5 rounded-2xl border-2 backdrop-blur-md ${isComplete ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400' : 'bg-stone-900/80 border-stone-700 text-amber-500'}`}>
                                {isComplete ? "EXPEDITION COMPLETE" : `TIME REMAINING: ${timeLeft}`}
                            </div>

                            {isComplete ? (
                                <button 
                                    onClick={() => handleClaim(currentExpedition.id)}
                                    className="px-10 md:px-14 py-3 md:py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-[0_15px_30px_rgba(16,185,129,0.3)] flex items-center gap-3 animate-in zoom-in transition-all transform active:scale-95 border-b-4 border-emerald-800"
                                >
                                    <Trophy className="w-5 h-5 md:w-7 md:h-7" />
                                    CLAIM REWARDS
                                </button>
                            ) : (
                                <div className="flex -space-x-2 md:-space-x-4">
                                    {currentExpedition.partyIds.map(id => {
                                        const merc = knownMercenaries.find(m => m.id === id);
                                        if(!merc) return null;
                                        return (
                                            <div key={id} className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-stone-800 border-4 border-stone-700 flex items-center justify-center text-2xl md:text-5xl shadow-2xl ring-1 ring-white/10" title={merc.name}>
                                                {merc.icon}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Dungeon Info Card */}
                            <div className="bg-stone-900/80 border border-stone-700/50 p-5 md:p-8 rounded-[2rem] backdrop-blur-md shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[100px] group-hover:bg-amber-500/10 transition-colors"></div>
                                <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4 relative z-10">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h1 className="text-2xl md:text-4xl font-black text-amber-500 font-serif tracking-tight leading-none">{selectedDungeon.name}</h1>
                                            <span className="bg-stone-950 px-2 py-0.5 rounded text-[10px] md:text-xs font-mono font-bold text-stone-500 border border-stone-800">TIER {selectedDungeon.tier}</span>
                                        </div>
                                        <p className="text-stone-400 mt-2 max-w-2xl text-xs md:text-base leading-relaxed italic">"{selectedDungeon.description}"</p>
                                    </div>
                                    <div className="lg:text-right shrink-0 bg-black/40 p-3 md:p-4 rounded-2xl border border-stone-800/50 backdrop-blur-xl">
                                        <div className="text-[9px] md:text-[10px] text-stone-500 uppercase font-black tracking-widest mb-1 opacity-60">Req. Combat Power</div>
                                        <div className={`text-xl md:text-3xl font-mono font-black flex items-center lg:justify-end gap-2 ${currentPartyPower >= selectedDungeon.requiredPower ? 'text-emerald-400' : 'text-red-500'}`}>
                                            <Sword className="w-5 h-5 md:w-7 md:h-7" />
                                            {currentPartyPower} / {selectedDungeon.requiredPower}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-sm font-black text-stone-300 relative z-10">
                                    <div className="bg-stone-800/80 px-3 py-1.5 md:px-4 md:py-2 rounded-xl flex items-center gap-2 border border-stone-700/50 shadow-lg">
                                        <Timer className="w-4 h-4 text-stone-500" /> 
                                        <span>{selectedDungeon.durationMinutes} Minutes</span>
                                    </div>
                                    <div className="bg-stone-800/80 px-3 py-1.5 md:px-4 md:py-2 rounded-xl flex items-center gap-2 border border-stone-700/50 shadow-lg">
                                        <Zap className="w-4 h-4 text-blue-400" /> 
                                        <span className="text-blue-200">-{selectedDungeon.energyCost} Energy / Unit</span>
                                    </div>
                                </div>
                            </div>

                            {/* Party & Available List Grid */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                                {/* Left Side: Selected Party */}
                                <div className="space-y-4">
                                    <h3 className="font-black text-stone-500 uppercase tracking-[0.2em] text-[10px] md:text-xs flex items-center gap-3 px-2">
                                        <User className="w-4 h-4 text-amber-600" /> Expedition Party ({party.length}/4)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        {[0, 1, 2, 3].map(idx => {
                                            const mercId = party[idx];
                                            const merc = knownMercenaries.find(m => m.id === mercId);
                                            return (
                                                <div key={idx} className="h-20 md:h-28 bg-stone-900/40 border-2 border-dashed border-stone-800/50 rounded-2xl flex items-center justify-center relative overflow-hidden group hover:border-stone-700 hover:bg-stone-900/60 transition-all">
                                                    {merc ? (
                                                        <button 
                                                            onClick={() => toggleMercenary(merc.id)} 
                                                            className="w-full h-full flex items-center gap-3 px-3 md:px-4 bg-stone-800/40 hover:bg-stone-800/80 border-none transition-all text-left group"
                                                        >
                                                            <div className="text-3xl md:text-5xl drop-shadow-lg group-hover:scale-110 transition-transform">{merc.icon}</div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-black text-stone-200 truncate text-xs md:text-lg leading-tight">{merc.name}</div>
                                                                <div className="text-[8px] md:text-[11px] text-stone-500 uppercase font-black tracking-tighter truncate mt-0.5">{merc.job} (LV.{merc.level})</div>
                                                                <div className="text-[10px] md:text-sm text-amber-500 font-mono font-black mt-1">POW: {calculateMercenaryPower(merc)}</div>
                                                            </div>
                                                            <div className="absolute top-2 right-2 p-1.5 bg-red-950/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-red-500/30">
                                                                <XCircle className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                                                            </div>
                                                        </button>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1 opacity-20">
                                                            <User className="w-6 h-6 md:w-8 md:h-8" />
                                                            <span className="text-[8px] md:text-[10px] font-mono uppercase tracking-widest">VACANT SLOT</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Side: Recruitment/Available Pool */}
                                <div className="flex flex-col min-h-[400px] bg-stone-900/50 rounded-[2rem] border border-stone-800/50 overflow-hidden shadow-inner backdrop-blur-sm">
                                    <div className="p-4 md:p-5 border-b border-stone-800 bg-stone-900/80 flex justify-between items-center shrink-0">
                                        <h3 className="font-black text-stone-400 uppercase tracking-widest text-[10px] md:text-xs">Wanderers in Tavern</h3>
                                        <span className="text-[10px] font-mono text-stone-600">{hiredMercs.length} Hired</span>
                                    </div>
                                    <div className="overflow-y-auto p-3 space-y-2.5 flex-1 custom-scrollbar bg-black/20">
                                        {hiredMercs.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-stone-600 italic text-sm p-12 text-center opacity-40">
                                                <User className="w-12 h-12 mb-4" />
                                                No mercenaries currently in your service.
                                            </div>
                                        ) : (
                                            hiredMercs.map(merc => {
                                                const isSelected = party.includes(merc.id);
                                                const isBusy = isMercBusy(merc.id);
                                                const power = calculateMercenaryPower(merc);
                                                const energy = merc.expeditionEnergy || 0;
                                                const hasEnoughEnergy = energy >= selectedDungeon.energyCost;

                                                return (
                                                    <button 
                                                        key={merc.id}
                                                        onClick={() => !isBusy && toggleMercenary(merc.id)}
                                                        disabled={isBusy}
                                                        className={`w-full flex items-center justify-between p-3 md:p-4 rounded-2xl border-2 transition-all group ${
                                                            isSelected 
                                                            ? 'bg-amber-900/30 border-amber-600 shadow-lg shadow-amber-900/10' 
                                                            : 'bg-stone-800/60 border-stone-700/50 hover:border-stone-500 hover:bg-stone-800'
                                                        } ${isBusy ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : 'active:scale-[0.98]'}`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-3xl md:text-4xl drop-shadow-md transition-transform group-hover:scale-110">{merc.icon}</div>
                                                            <div className="text-left">
                                                                <div className="font-black text-stone-100 text-xs md:text-base leading-tight">{merc.name}</div>
                                                                <div className="flex items-center gap-2 text-[9px] md:text-xs mt-0.5">
                                                                    <span className="text-stone-500 font-bold uppercase tracking-tighter">{merc.job}</span>
                                                                    <span className="text-amber-500 font-mono font-black tracking-tight">POW: {power}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-end gap-1.5">
                                                            {isBusy ? (
                                                                <span className="text-[8px] md:text-[10px] bg-stone-950 text-stone-500 px-2 py-0.5 rounded-full font-black uppercase border border-stone-800">Deployed</span>
                                                            ) : (
                                                                <div className="flex items-center gap-2" title={`${energy}/100 Energy`}>
                                                                    <Zap className={`w-3 h-3 md:w-4 md:h-4 ${hasEnoughEnergy ? 'text-blue-400' : 'text-red-500'}`} />
                                                                    <div className="w-16 md:w-24 h-1.5 md:h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800 shadow-inner">
                                                                        <div 
                                                                            className={`h-full transition-all duration-1000 ${hasEnoughEnergy ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-red-600'}`} 
                                                                            style={{ width: `${energy}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-4 pb-12">
                                <div className="text-[10px] md:text-xs text-stone-500 italic px-2">
                                    {party.length < 4 ? `Add ${4 - party.length} more units to maximize success probability.` : "Full squad ready for deployment."}
                                </div>
                                <button 
                                    onClick={handleStartExpedition}
                                    disabled={!canStart}
                                    className={`w-full sm:w-auto px-10 md:px-16 py-4 md:py-5 rounded-2xl font-black text-sm md:text-xl shadow-2xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 border-b-4 ${
                                        canStart 
                                        ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-800 shadow-amber-900/40' 
                                        : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed grayscale'
                                    }`}
                                >
                                    {canStart ? (
                                        <>
                                            <Sword className="w-5 h-5 md:w-7 md:h-7" /> COMMENCE MISSION
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-5 h-5 md:w-6 md:h-6" /> 
                                            {party.length === 0 ? 'SELECT PARTY' : 'REQUIREMENTS NOT MET'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DungeonTab;