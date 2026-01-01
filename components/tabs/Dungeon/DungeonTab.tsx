
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import { DUNGEONS } from '../../../data/dungeons';
import { MATERIALS } from '../../../data/materials';
import { calculatePartyPower, calculateMercenaryPower, formatDuration } from '../../../utils/dungeonUtils';
import { Sword, Skull, Timer, Zap, Map as MapIcon, ChevronRight, ChevronLeft, Lock, CheckCircle, Trophy, User, XCircle, Triangle, Box } from 'lucide-react';
import { getAssetUrl } from '../../../utils';

const DungeonTab = () => {
    const { state, actions } = useGame();
    const { activeExpeditions, knownMercenaries, dungeonClearCounts } = state;

    // Index-based selection for paging
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [party, setParty] = useState<string[]>([]);
    
    const selectedDungeon = DUNGEONS[selectedIndex];

    const hiredMercs = useMemo(() => knownMercenaries.filter(m => m.status === 'HIRED'), [knownMercenaries]);
    const currentExpedition = activeExpeditions.find(e => e.dungeonId === selectedDungeon.id);
    
    const isMercBusy = (mercId: string) => {
        return activeExpeditions.some(e => e.partyIds.includes(mercId));
    };

    const handlePrev = () => {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : DUNGEONS.length - 1));
        setParty([]);
    };

    const handleNext = () => {
        setSelectedIndex(prev => (prev < DUNGEONS.length - 1 ? prev + 1 : 0));
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

    const isUnlocked = selectedDungeon.tier <= state.stats.tierLevel + 1;
    const clears = dungeonClearCounts[selectedDungeon.id] || 0;
    const isBoss = !!selectedDungeon.bossVariantId;

    return (
        <div className="h-full w-full flex flex-row bg-stone-950 text-stone-200 overflow-hidden">
            
            {/* Left Section: Dungeon Paging Selection (40%) */}
            <div className="w-[40%] h-full flex flex-col border-r border-stone-800 bg-stone-900/50 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <img src={getAssetUrl('dungeon_bg.png')} className="w-full h-full object-cover grayscale" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-start p-4 md:p-8 pt-8 md:pt-12 z-10 overflow-y-auto custom-scrollbar">
                    {/* Header Text */}
                    <div className="text-center animate-in fade-in zoom-in duration-300 mb-6 shrink-0">
                        <h1 className="text-xl md:text-3xl font-black text-white font-serif tracking-tighter uppercase leading-none mb-1">{selectedDungeon.name}</h1>
                        {!isUnlocked && (
                            <div className="flex items-center justify-center gap-1.5 text-red-500 font-bold text-[10px] md:text-xs uppercase mt-2">
                                <Lock className="w-3 h-3" /> Area Locked
                            </div>
                        )}
                    </div>

                    {/* Compact Paging Controls + Icon Wrapper */}
                    <div className="flex items-center gap-4 md:gap-8 mb-6 md:mb-8 shrink-0">
                        <button onClick={handlePrev} className="p-2 md:p-3 bg-stone-800 hover:bg-amber-600 rounded-full border border-stone-700 transition-all active:scale-90 group shadow-xl">
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-stone-400 group-hover:text-white" />
                        </button>

                        <div className="relative group">
                            {/* Visual Glow */}
                            <div className={`absolute inset-0 blur-2xl rounded-full opacity-20 ${isBoss ? 'bg-red-500' : 'bg-amber-500'} group-hover:opacity-40 transition-opacity`}></div>
                            
                            {/* Main Icon Box */}
                            <div className={`w-20 h-20 md:w-32 md:h-32 bg-stone-900 rounded-[1.5rem] border-4 border-stone-700 flex items-center justify-center relative shadow-2xl overflow-hidden ring-4 ring-white/5 ${!isUnlocked ? 'grayscale brightness-50' : ''}`}>
                                 <div className="text-3xl md:text-5xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                                    {selectedDungeon.id.includes('rat') ? '🐀' : selectedDungeon.id.includes('goblin') ? '👺' : selectedDungeon.id.includes('mine') ? '⛏️' : '🏰'}
                                 </div>
                                 {currentExpedition && (
                                     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
                                         <Timer className="w-6 h-6 text-amber-500 animate-pulse mb-1" />
                                         <span className="text-[10px] font-mono text-amber-400 font-bold">{timeLeft}</span>
                                     </div>
                                 )}
                            </div>

                            {/* Tier / Boss Badge - Moved Outside to avoid clipping and placed at top-right */}
                            <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-lg font-black text-[9px] md:text-[11px] shadow-xl border-2 z-30 font-mono tracking-tighter animate-in slide-in-from-bottom-1 duration-300 ${isBoss ? 'bg-red-700 border-red-400 text-white' : 'bg-amber-600 border-amber-400 text-amber-50'}`}>
                                {isBoss ? 'BOSS' : `T${selectedDungeon.tier}`}
                            </div>
                        </div>

                        <button onClick={handleNext} className="p-2 md:p-3 bg-stone-800 hover:bg-amber-600 rounded-full border border-stone-700 transition-all active:scale-90 group shadow-xl">
                            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-stone-400 group-hover:text-white" />
                        </button>
                    </div>

                    <div className="w-full max-w-xs space-y-4 shrink-0 pb-8">
                        <p className="text-stone-400 text-[10px] md:text-sm text-center italic px-4 leading-relaxed line-clamp-2 md:line-clamp-none">
                            "{selectedDungeon.description}"
                        </p>

                        {/* Obtainable Loot Section */}
                        <div className="bg-stone-950/40 p-2.5 rounded-xl border border-stone-800/50">
                            <div className="flex items-center justify-center gap-1.5 mb-2 px-1">
                                <Box className="w-2.5 h-2.5 text-stone-600" />
                                <h4 className="text-[8px] md:text-[10px] font-black text-stone-500 uppercase tracking-widest">Possible Loot</h4>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {selectedDungeon.rewards.map((reward, ridx) => {
                                    const mat = Object.values(MATERIALS).find(m => m.id === reward.itemId);
                                    return (
                                        <div key={ridx} className="group relative w-8 h-8 md:w-10 md:h-10 bg-stone-900 border border-stone-800 rounded-lg flex items-center justify-center hover:border-amber-500/50 transition-colors" title={mat?.name || reward.itemId}>
                                            <img 
                                                src={getAssetUrl(`${reward.itemId}.png`)} 
                                                className="w-5 h-5 md:w-7 md:h-7 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                                            />
                                            <span className="hidden text-[10px]">📦</span>
                                            
                                            {/* Minimal Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-[8px] font-bold text-stone-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                                                {mat?.name || reward.itemId}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {selectedDungeon.bossUnlockReq && (
                            <div className="bg-stone-950/80 p-2.5 rounded-xl border border-stone-800">
                                <div className="flex justify-between text-[8px] md:text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1.5 px-1">
                                    <span>Boss Progression</span>
                                    <span>{clears}/{selectedDungeon.bossUnlockReq} CLEARS</span>
                                </div>
                                <div className="h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800 shadow-inner">
                                    <div className="h-full bg-red-700 shadow-[0_0_10px_rgba(185,28,28,0.5)]" style={{ width: `${Math.min(100, (clears / selectedDungeon.bossUnlockReq) * 100)}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-3 bg-stone-950/80 border-t border-stone-800 text-center font-mono text-[9px] md:text-[11px] text-stone-600 uppercase tracking-[0.2em] shrink-0">
                    Location Selection {selectedIndex + 1} / {DUNGEONS.length}
                </div>
            </div>

            {/* Right Section: Details & Squad Deployment (60%) */}
            <div className="flex-1 h-full flex flex-col bg-stone-925 relative overflow-hidden">
                {currentExpedition ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center animate-in fade-in duration-500">
                        <Trophy className={`w-12 h-12 md:w-20 md:h-20 mb-6 ${isComplete ? 'text-emerald-500 animate-bounce' : 'text-stone-700 opacity-20'}`} />
                        <h2 className="text-xl md:text-3xl font-black text-stone-100 mb-4 uppercase tracking-tight font-serif">Mission in Progress</h2>
                        <p className="text-stone-500 text-xs md:text-base max-w-md mb-8 leading-relaxed">Your squad is currently clearing the depths of <span className="text-amber-500 font-bold">{selectedDungeon.name}</span>. Return when they have secured the loot.</p>
                        
                        {isComplete ? (
                            <button onClick={() => handleClaim(currentExpedition.id)} className="px-10 md:px-14 py-4 md:py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-2xl flex items-center gap-3 border-b-4 border-emerald-800 active:scale-95 transition-all">
                                <CheckCircle className="w-5 h-5 md:w-7 md:h-7" /> CLAIM REWARDS
                            </button>
                        ) : (
                            <div className="bg-stone-900 border border-stone-800 px-6 py-3 rounded-2xl font-mono text-lg md:text-2xl font-black text-amber-500 shadow-xl">
                                ETA: {timeLeft}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Requirement Banner */}
                        <div className="p-3 md:p-5 bg-stone-900/80 border-b border-stone-800 grid grid-cols-3 gap-2 md:gap-4 shrink-0">
                            <div className="bg-stone-950 p-2 md:p-3 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
                                <span className="text-[7px] md:text-[10px] text-stone-500 font-black uppercase tracking-tighter mb-1">Duration</span>
                                <div className="flex items-center gap-1.5 text-xs md:text-lg font-black text-stone-200 font-mono"><Timer className="w-3 h-3 md:w-4 md:h-4 text-stone-500" /> {selectedDungeon.durationMinutes}m</div>
                            </div>
                            <div className="bg-stone-950 p-2 md:p-3 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
                                <span className="text-[7px] md:text-[10px] text-stone-500 font-black uppercase tracking-tighter mb-1">Energy Req</span>
                                <div className="flex items-center gap-1.5 text-xs md:text-lg font-black text-blue-400 font-mono"><Zap className="w-3 h-3 md:w-4 md:h-4" /> -{selectedDungeon.energyCost}</div>
                            </div>
                            <div className="bg-stone-950 p-2 md:p-3 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
                                <span className="text-[7px] md:text-[10px] text-stone-500 font-black uppercase tracking-tighter mb-1">Required Pow</span>
                                <div className={`flex items-center gap-1.5 text-xs md:text-lg font-black font-mono ${currentPartyPower >= selectedDungeon.requiredPower ? 'text-emerald-400' : 'text-red-500'}`}>
                                    <Sword className="w-3 h-3 md:w-4 md:h-4" /> {currentPartyPower}/{selectedDungeon.requiredPower}
                                </div>
                            </div>
                        </div>

                        {/* Squad Grid & Tavern List */}
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-3 md:p-5 gap-3 md:gap-5 min-h-0">
                            {/* Selected Squad */}
                            <div className="w-full md:w-[45%] flex flex-col gap-3 shrink-0">
                                <h3 className="text-[9px] md:text-xs font-black text-stone-500 uppercase tracking-widest px-1">Selected Party ({party.length}/4)</h3>
                                <div className="grid grid-cols-2 gap-2 md:gap-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                                    {[0, 1, 2, 3].map(idx => {
                                        const mercId = party[idx];
                                        const merc = knownMercenaries.find(m => m.id === mercId);
                                        return (
                                            <div key={idx} className="h-20 md:h-auto md:aspect-square bg-stone-900 border-2 border-dashed border-stone-800 rounded-2xl flex items-center justify-center relative overflow-hidden group hover:bg-stone-800 transition-colors">
                                                {merc ? (
                                                    <button onClick={() => toggleMercenary(merc.id)} className="w-full h-full flex flex-col items-center justify-center p-2 relative">
                                                        <div className="text-3xl md:text-5xl group-hover:scale-110 transition-transform mb-1">{merc.icon}</div>
                                                        <div className="text-[8px] md:text-xs font-black text-stone-200 truncate w-full text-center">{merc.name}</div>
                                                        <div className="text-[7px] font-mono text-amber-500 font-black">CP {calculateMercenaryPower(merc)}</div>
                                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <XCircle className="w-4 h-4 text-red-500" />
                                                        </div>
                                                    </button>
                                                ) : (
                                                    <User className="w-6 h-6 md:w-10 md:h-10 text-stone-800" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Tavern Roster */}
                            <div className="flex-1 flex flex-col gap-3 bg-stone-950/40 rounded-2xl border border-stone-800/60 overflow-hidden shadow-inner min-h-0">
                                <div className="p-3 border-b border-stone-800 bg-stone-900/40 flex justify-between items-center shrink-0">
                                    <span className="text-[9px] md:text-xs font-black text-stone-400 uppercase tracking-widest">Tavern Roster</span>
                                    <span className="text-[8px] md:text-[10px] font-mono text-stone-600">{hiredMercs.length} Units</span>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                    {hiredMercs.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-stone-700 italic text-[10px] opacity-40 p-8 text-center">
                                            No mercenaries currently hired.
                                        </div>
                                    ) : (
                                        hiredMercs.map(merc => {
                                            const isSelected = party.includes(merc.id);
                                            const isBusy = isMercBusy(merc.id);
                                            const power = calculateMercenaryPower(merc);
                                            const energy = merc.expeditionEnergy || 0;
                                            const hasEnoughEnergy = energy >= selectedDungeon.energyCost;

                                            return (
                                                <button key={merc.id} onClick={() => !isBusy && toggleMercenary(merc.id)} disabled={isBusy} className={`w-full flex items-center justify-between p-2 md:p-3 rounded-xl border-2 transition-all ${isSelected ? 'bg-amber-900/30 border-amber-600' : 'bg-stone-900 border-stone-800 hover:border-stone-600'} ${isBusy ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : ''}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-xl md:text-3xl">{merc.icon}</div>
                                                        <div className="text-left leading-tight">
                                                            <div className="font-black text-stone-200 text-[10px] md:text-sm truncate max-w-[100px]">{merc.name}</div>
                                                            <div className="text-[7px] md:text-[9px] text-amber-500 font-mono font-black">CP {power}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                        {isBusy ? (
                                                            <span className="text-[7px] font-black uppercase text-stone-500 border border-stone-700 px-1.5 rounded">Deployed</span>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-10 md:w-16 h-1 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                                                                    <div className={`h-full transition-all duration-700 ${hasEnoughEnergy ? 'bg-blue-600' : 'bg-red-600'}`} style={{ width: `${energy}%` }}></div>
                                                                </div>
                                                                <Zap className={`w-2.5 h-2.5 ${hasEnoughEnergy ? 'text-blue-500' : 'text-red-600'}`} />
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

                        {/* Deployment Action Bar */}
                        <div className="p-3 md:p-5 bg-stone-900/50 border-t border-stone-800 flex items-center justify-between gap-4 shrink-0">
                            <div className="text-[8px] md:text-[10px] text-stone-600 font-bold uppercase italic hidden sm:block">
                                * Ensure squad combat power matches requirements.
                            </div>
                            <button onClick={handleStartExpedition} disabled={!canStart || !isUnlocked} className={`flex-1 sm:flex-none px-8 md:px-16 py-3 md:py-4 rounded-xl font-black text-xs md:text-lg shadow-2xl flex items-center justify-center gap-3 border-b-4 transition-all transform active:scale-95 ${canStart && isUnlocked ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-800' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed grayscale'}`}>
                                {isUnlocked ? (
                                    <>
                                        {canStart ? <Sword className="w-4 h-4 md:w-6 md:h-6" /> : <Lock className="w-4 h-4 md:w-6 md:h-6" />}
                                        DEPLOY SQUAD
                                    </>
                                ) : (
                                    "AREA LOCKED"
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DungeonTab;
