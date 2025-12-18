
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

    // Only mercenaries with status 'HIRED' can join new expeditions. 
    // Those 'ON_EXPEDITION' are filtered out naturally by not being selectable or handled by busy check, 
    // but semantically only HIRED are available.
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

            if (diff <= 0) {
                setTimeLeft('00:00');
            } else {
                setTimeLeft(formatDuration(diff));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentExpedition]);

    return (
        <div className="h-full w-full flex bg-stone-950 text-stone-200">
            
            {/* Left Sidebar: Dungeon List */}
            <div className="w-1/3 min-w-[250px] bg-stone-900 border-r border-stone-800 flex flex-col">
                <div className="p-4 border-b border-stone-800 flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-amber-500" />
                    <h2 className="font-bold font-serif tracking-wide text-amber-100">Expeditions</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {DUNGEONS.map(dungeon => {
                        const clears = dungeonClearCounts[dungeon.id] || 0;
                        const isUnlocked = dungeon.tier <= state.stats.tierLevel + 1; 
                        const activeExp = activeExpeditions.find(e => e.dungeonId === dungeon.id);

                        return (
                            <button
                                key={dungeon.id}
                                onClick={() => handleSelectDungeon(dungeon.id)}
                                disabled={!isUnlocked}
                                className={`w-full p-3 rounded-lg text-left transition-all border relative overflow-hidden group ${
                                    selectedDungeon.id === dungeon.id 
                                    ? 'bg-amber-900/20 border-amber-500' 
                                    : 'bg-stone-800 border-stone-700 hover:border-stone-500'
                                } ${!isUnlocked ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1 relative z-10">
                                    <span className={`font-bold text-sm ${selectedDungeon.id === dungeon.id ? 'text-amber-400' : 'text-stone-300'}`}>
                                        {dungeon.name}
                                    </span>
                                    <span className="text-xs bg-stone-950 px-1.5 py-0.5 rounded text-stone-500 font-mono">T{dungeon.tier}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs text-stone-500 mb-2 relative z-10">
                                    <div className="flex items-center gap-1">
                                        <Sword className="w-3 h-3" /> {dungeon.requiredPower}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Timer className="w-3 h-3" /> {dungeon.durationMinutes}m
                                    </div>
                                </div>

                                {activeExp && (
                                    <div className="absolute top-2 right-2 z-20">
                                         {activeExp.status === 'COMPLETED' ? (
                                             <CheckCircle className="w-4 h-4 text-emerald-500 animate-bounce" />
                                         ) : (
                                             <Timer className="w-4 h-4 text-amber-500 animate-pulse" />
                                         )}
                                    </div>
                                )}
                                
                                {dungeon.bossUnlockReq && (
                                    <div className="mt-2 w-full bg-stone-950 h-1.5 rounded-full overflow-hidden relative z-10">
                                        <div 
                                            className="h-full bg-red-800" 
                                            style={{ width: `${Math.min(100, (clears / dungeon.bossUnlockReq) * 100)}%` }}
                                        ></div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                 <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <img src={getAssetUrl('dungeon_bg.png')} className="w-full h-full object-cover grayscale" />
                </div>

                {currentExpedition ? (
                    // --- ACTIVE EXPEDITION VIEW ---
                    <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
                        <div className="w-32 h-32 bg-stone-900 rounded-full border-4 border-stone-700 flex items-center justify-center mb-6 shadow-2xl relative">
                            {isComplete ? (
                                <CheckCircle className="w-16 h-16 text-emerald-500 animate-bounce" />
                            ) : (
                                <Timer className="w-16 h-16 text-amber-500 animate-pulse" />
                            )}
                        </div>
                        
                        <h2 className="text-3xl font-bold text-stone-200 mb-2">{selectedDungeon.name}</h2>
                        <div className="text-xl font-mono text-amber-500 mb-8 bg-stone-900/80 px-4 py-2 rounded-lg border border-stone-800">
                            {isComplete ? "MISSION COMPLETE" : `Time Remaining: ${timeLeft}`}
                        </div>

                        {isComplete ? (
                            <button 
                                onClick={() => handleClaim(currentExpedition.id)}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 animate-in zoom-in"
                            >
                                <Trophy className="w-5 h-5" />
                                Claim Rewards
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                {currentExpedition.partyIds.map(id => {
                                    const merc = knownMercenaries.find(m => m.id === id);
                                    if(!merc) return null;
                                    return (
                                        <div key={id} className="w-12 h-12 rounded-full bg-stone-800 border-2 border-stone-600 flex items-center justify-center text-xl shadow-lg" title={merc.name}>
                                            {merc.icon}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    // --- PREPARATION VIEW ---
                    <div className="flex-1 flex flex-col p-6 relative z-10 overflow-y-auto">
                        <div className="bg-stone-900/90 border border-stone-800 p-6 rounded-xl mb-6 backdrop-blur-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-amber-500 font-serif">{selectedDungeon.name}</h1>
                                    <p className="text-stone-400 mt-1 max-w-lg">{selectedDungeon.description}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-stone-500 uppercase font-bold tracking-widest mb-1">Recommended Power</div>
                                    <div className={`text-2xl font-mono font-bold ${currentPartyPower >= selectedDungeon.requiredPower ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {currentPartyPower} / {selectedDungeon.requiredPower}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 text-sm font-bold text-stone-300">
                                <div className="bg-stone-800 px-3 py-1.5 rounded flex items-center gap-2">
                                    <Timer className="w-4 h-4 text-stone-500" /> {selectedDungeon.durationMinutes} Minutes
                                </div>
                                <div className="bg-stone-800 px-3 py-1.5 rounded flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-blue-400" /> -{selectedDungeon.energyCost} Energy / Merc
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <div className="space-y-4">
                                <h3 className="font-bold text-stone-400 uppercase tracking-wider text-sm flex items-center gap-2">
                                    <User className="w-4 h-4" /> Expedition Party ({party.length}/4)
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[0, 1, 2, 3].map(idx => {
                                        const mercId = party[idx];
                                        const merc = knownMercenaries.find(m => m.id === mercId);
                                        
                                        return (
                                            <div key={idx} className="h-24 bg-stone-900/50 border-2 border-dashed border-stone-700 rounded-xl flex items-center justify-center relative overflow-hidden group hover:border-stone-500 transition-colors">
                                                {merc ? (
                                                    <button onClick={() => toggleMercenary(merc.id)} className="w-full h-full flex items-center gap-3 px-3 bg-stone-800 border-none">
                                                        <div className="text-3xl">{merc.icon}</div>
                                                        <div className="text-left min-w-0">
                                                            <div className="font-bold text-stone-200 truncate">{merc.name}</div>
                                                            <div className="text-xs text-stone-500">{merc.job} (Lvl {merc.level})</div>
                                                            <div className="text-xs text-amber-500 font-mono">Pow: {calculateMercenaryPower(merc)}</div>
                                                        </div>
                                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <XCircle className="w-4 h-4 text-red-500" />
                                                        </div>
                                                    </button>
                                                ) : (
                                                    <span className="text-stone-600 text-xs font-mono uppercase">Empty Slot</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex flex-col min-h-0 bg-stone-900/80 rounded-xl border border-stone-800 flex-1 overflow-hidden">
                                <div className="p-3 border-b border-stone-800 bg-stone-900">
                                    <h3 className="font-bold text-stone-400 uppercase tracking-wider text-sm">Available Mercenaries</h3>
                                </div>
                                <div className="overflow-y-auto p-2 space-y-2 flex-1">
                                    {hiredMercs.length === 0 ? (
                                        <div className="p-4 text-center text-stone-500 italic">No available mercenaries.</div>
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
                                                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                                        isSelected 
                                                        ? 'bg-amber-900/30 border-amber-600' 
                                                        : 'bg-stone-800 border-stone-700 hover:bg-stone-750'
                                                    } ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-2xl">{merc.icon}</div>
                                                        <div className="text-left">
                                                            <div className="font-bold text-stone-200 text-sm">{merc.name}</div>
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <span className="text-stone-500">{merc.job}</span>
                                                                <span className="text-amber-500 font-mono">Pow: {power}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-1">
                                                        {isBusy ? (
                                                            <span className="text-[10px] bg-stone-950 text-stone-500 px-2 py-0.5 rounded uppercase">Deployed</span>
                                                        ) : (
                                                            <div className="flex items-center gap-1" title={`${energy}/100 Energy`}>
                                                                <Zap className={`w-3 h-3 ${hasEnoughEnergy ? 'text-blue-400' : 'text-red-500'}`} />
                                                                <div className="w-16 h-1.5 bg-stone-950 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className={`h-full ${hasEnoughEnergy ? 'bg-blue-500' : 'bg-red-500'}`} 
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

                        <div className="mt-6 pt-4 border-t border-stone-800 flex justify-end">
                            <button 
                                onClick={handleStartExpedition}
                                disabled={!canStart}
                                className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2 transition-all ${
                                    canStart 
                                    ? 'bg-amber-600 hover:bg-amber-500 text-white hover:scale-105' 
                                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                                }`}
                            >
                                {canStart ? (
                                    <>
                                        <Sword className="w-5 h-5" /> Start Expedition
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-5 h-5" /> 
                                        {party.length === 0 ? 'Select Party' : 'Requirements Not Met'}
                                    </>
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
