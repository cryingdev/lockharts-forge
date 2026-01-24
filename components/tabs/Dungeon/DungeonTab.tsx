import { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import { DUNGEONS } from '../../../data/dungeons';
import { materials } from '../../../data/materials';
import { EQUIPMENT_ITEMS } from '../../../data/equipment';
import { calculatePartyPower, calculateMercenaryPower } from '../../../utils/combatLogic';
import { Sword, Skull, Timer, Zap, Map as MapIcon, ChevronRight, ChevronLeft, Lock, CheckCircle, Trophy, User, XCircle, Box, AlertCircle, Gamepad2, Navigation2, Play, Ban, LogOut, HeartOff, LayoutList, Layers } from 'lucide-react';
import { getAssetUrl, formatDuration } from '../../../utils';
import AssaultNavigator from './AssaultNavigator';
import ConfirmationModal from '../../modals/ConfirmationModal';

const DungeonTab = () => {
    const { state, actions } = useGame();
    const { activeExpeditions, knownMercenaries, dungeonClearCounts, maxFloorReached, activeManualDungeon, showManualDungeonOverlay } = state;

    // View State: 'LIST' or 'DETAIL'
    const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
    const [selectedDungeonId, setSelectedDungeonId] = useState<string | null>(null);
    const [selectedFloor, setSelectedFloor] = useState(1);
    const [party, setParty] = useState<string[]>([]);
    const [failedMercs, setFailedMercs] = useState<string[]>([]);
    const [lowHpMercs, setLowHpMercs] = useState<string[]>([]);
    const [failedPowerHighlight, setFailedPowerHighlight] = useState(false);
    const [showRecallConfirm, setShowRecallConfirm] = useState<'AUTO' | 'MANUAL' | null>(null);
    
    const selectedDungeon = useMemo(() => 
        DUNGEONS.find(d => d.id === selectedDungeonId) || DUNGEONS[0], 
    [selectedDungeonId]);

    const maxPartySize = selectedDungeon.maxPartySize || 4;
    const isOngoingManual = !!activeManualDungeon && activeManualDungeon.dungeonId === selectedDungeon.id;
    const currentExpedition = activeExpeditions.find(e => e.dungeonId === selectedDungeon.id);
    const hasActiveMission = !!currentExpedition || isOngoingManual;

    // --- Auto Expedition Availability Logic ---
    const isFloorCleared = useMemo(() => {
        const maxReached = maxFloorReached[selectedDungeon.id] || 1;
        // Case 1: If selected floor is below the max reached floor, it means the player found the stairs and moved past it.
        if (selectedFloor < maxReached) return true;
        // Case 2: If it's the last floor (Boss), check if the entire dungeon has been cleared at least once.
        if (selectedFloor === selectedDungeon.maxFloors && (dungeonClearCounts[selectedDungeon.id] || 0) > 0) return true;
        return false;
    }, [selectedDungeon, selectedFloor, maxFloorReached, dungeonClearCounts]);

    const hiredMercs = useMemo(() => 
        knownMercenaries.filter(m => m.status === 'HIRED' || m.status === 'ON_EXPEDITION'), 
    [knownMercenaries]);

    // UI Calculations based on selected floor
    const requiredPowerForFloor = useMemo(() => {
        const base = selectedDungeon.requiredPower;
        return Math.round(base * (1 + (selectedFloor - 1) * 0.25));
    }, [selectedDungeon, selectedFloor]);

    const energyCostForFloor = useMemo(() => {
        const base = selectedDungeon.energyCost;
        return base + (selectedFloor - 1) * 5;
    }, [selectedDungeon, selectedFloor]);

    const handleDungeonSelect = (id: string) => {
        const dungeon = DUNGEONS.find(d => d.id === id);
        if (!dungeon || dungeon.tier > state.stats.tierLevel + 1) {
            actions.showToast("This area is currently inaccessible.");
            return;
        }
        setSelectedDungeonId(id);
        setSelectedFloor(1);
        setParty([]);
        setView('DETAIL');
    };

    const handlePrevFloor = () => {
        setSelectedFloor(prev => Math.max(1, prev - 1));
    };

    const handleNextFloor = () => {
        const maxReached = maxFloorReached[selectedDungeon.id] || 1;
        if (selectedFloor >= selectedDungeon.maxFloors) return;
        if (selectedFloor >= maxReached) {
            actions.showToast("You must clear the current floor to descend deeper.");
            return;
        }
        setSelectedFloor(prev => Math.min(selectedDungeon.maxFloors, prev + 1));
    };

    // Comment: Fixed "Cannot find name 'id'" error by using mercId directly and removing unnecessary nested function
    const toggleMercenary = (mercId: string) => {
        if (party.includes(mercId)) {
            setParty(prev => prev.filter(id => id !== mercId));
        } else if (party.length < maxPartySize) {
            setParty(prev => [...prev, mercId]);
        }
    };

    const validateEntry = () => {
        if (party.length === 0) return false;
        const selectedMercs = knownMercenaries.filter(m => party.includes(m.id));
        
        const lowHpIds = selectedMercs.filter(m => (m.currentHp || 0) < 1).map(m => m.id);
        if (lowHpIds.length > 0) {
            setLowHpMercs(lowHpIds);
            setTimeout(() => setLowHpMercs([]), 2000);
            actions.showToast("Wounded members cannot be deployed.");
            return false;
        }

        const lowEnergyIds = selectedMercs.filter(m => (m.expeditionEnergy || 0) < energyCostForFloor).map(m => m.id);
        if (lowEnergyIds.length > 0) {
            setFailedMercs(lowEnergyIds);
            setTimeout(() => setFailedMercs([]), 2000);
            actions.showToast("Some squad members are too exhausted.");
            return false;
        }

        if (currentPartyPower < requiredPowerForFloor) {
            setFailedPowerHighlight(true);
            setTimeout(() => setFailedPowerHighlight(false), 2000);
            actions.showToast("Party power is insufficient for this floor.");
            return false;
        }

        return true;
    };

    const handleStartAutoExpedition = () => {
        if (!isFloorCleared) {
            actions.showToast("Auto exploration requires at least one manual clear of this floor.");
            return;
        }
        if (isOngoingManual) return actions.showToast("Manual assault active.");
        if (!validateEntry()) return;
        actions.startExpedition(selectedDungeon.id, party);
    };

    const handleStartManualAssault = () => {
        if (isOngoingManual) {
            actions.toggleManualDungeonOverlay(true);
            return;
        }
        if (!validateEntry()) return;
        actions.startManualAssault(selectedDungeon.id, party, selectedFloor);
    };

    const currentPartyPower = useMemo(() => {
        const selectedMercs = knownMercenaries.filter(m => party.includes(m.id));
        return calculatePartyPower(selectedMercs);
    }, [party, knownMercenaries]);

    const [timeLeft, setTimeLeft] = useState<string>('');
    useEffect(() => {
        if (!currentExpedition || currentExpedition.status === 'COMPLETED') {
            setTimeLeft(currentExpedition?.status === 'COMPLETED' ? '00:00' : '');
            return;
        }
        const interval = setInterval(() => {
            const diff = currentExpedition.endTime - Date.now();
            if (diff <= 0) setTimeLeft('00:00');
            else setTimeLeft(formatDuration(diff));
        }, 1000);
        return () => clearInterval(interval);
    }, [currentExpedition]);

    // --- RENDER: LIST VIEW ---
    if (view === 'LIST') {
        return (
            <div className="h-full w-full bg-stone-950 flex flex-col p-4 md:p-8 animate-in fade-in duration-500 overflow-hidden">
                <div className="flex justify-between items-end border-b border-stone-800 pb-4 mb-6 shrink-0">
                    <div>
                        <h2 className="text-2xl md:text-4xl font-black text-amber-500 font-serif uppercase tracking-tighter">Tactical Deployment</h2>
                        <p className="text-stone-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mt-1">Select Engagement Zone</p>
                    </div>
                    <div className="flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800 text-[10px] font-mono text-stone-500">
                        <LayoutList className="w-3.5 h-3.5" /> Sector Overview
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    {DUNGEONS.map(d => {
                        const isLocked = d.tier > state.stats.tierLevel + 1;
                        const maxReached = maxFloorReached[d.id] || 1;
                        const progressPercent = (maxReached / d.maxFloors) * 100;

                        return (
                            <button 
                                key={d.id} 
                                onClick={() => handleDungeonSelect(d.id)}
                                className={`w-full group relative flex flex-col md:flex-row items-center gap-4 p-4 md:p-6 rounded-2xl border-2 transition-all overflow-hidden ${isLocked ? 'bg-stone-900 border-stone-800 opacity-50 grayscale' : 'bg-stone-900/40 border-stone-800 hover:border-amber-500 hover:bg-stone-800 shadow-xl active:scale-[0.99]'}`}
                            >
                                {/* Background Image/Icon */}
                                <div className="w-20 h-20 md:w-32 md:h-32 bg-stone-950 rounded-xl border-2 border-stone-800 flex items-center justify-center text-4xl md:text-6xl shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                    {isLocked ? <Lock className="w-8 h-8 text-stone-700" /> : (d.id.includes('rat') ? '🐀' : d.id.includes('goblin') ? '👺' : d.id.includes('mine') ? '⛏️' : '🏰')}
                                </div>

                                <div className="flex-1 text-center md:text-left min-w-0">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                                        <h3 className="text-lg md:text-2xl font-black text-stone-100 uppercase font-serif tracking-tight">{d.name}</h3>
                                        <span className={`w-fit mx-auto md:mx-0 px-2 py-0.5 rounded font-black text-[8px] md:text-[10px] uppercase border ${isLocked ? 'border-stone-700 text-stone-600' : 'border-amber-600/30 bg-amber-900/20 text-amber-500'}`}>Tier {d.tier}</span>
                                    </div>
                                    <p className="text-stone-500 text-[10px] md:text-sm line-clamp-2 italic mb-3">"{d.description}"</p>
                                    
                                    <div className="flex wrap justify-center md:justify-start gap-4">
                                        <div className="flex items-center gap-2">
                                            <Layers className="w-3.5 h-3.5 text-stone-600" />
                                            <span className="text-[10px] md:text-xs font-black text-stone-400 uppercase">Progression: <span className="text-amber-500">{maxReached}/{d.maxFloors} Floors</span></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Skull className="w-3.5 h-3.5 text-stone-600" />
                                            <span className="text-[10px] md:text-xs font-black text-stone-400 uppercase">Threat: <span className="text-red-500">POW {d.requiredPower}</span></span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 w-full h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800 shadow-inner">
                                        <div className="h-full bg-gradient-to-r from-amber-900 to-amber-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                                    </div>
                                </div>

                                <div className="absolute top-4 right-4 md:relative md:top-0 md:right-0">
                                    {isLocked ? (
                                        <Lock className="w-6 h-6 text-stone-800" />
                                    ) : (
                                        <ChevronRight className="w-6 h-6 text-stone-700 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- RENDER: DETAIL VIEW ---
    return (
        <div className="h-full w-full flex flex-col sm:flex-row bg-stone-950 text-stone-200 overflow-hidden font-sans relative">
            {(!!activeManualDungeon && showManualDungeonOverlay) && <AssaultNavigator />}

            <div className="w-full sm:w-[40%] h-[42%] sm:h-full flex flex-col border-b sm:border-b-0 sm:border-r border-stone-800 bg-stone-900/50 relative overflow-hidden shrink-0 min-h-0">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <img src={getAssetUrl('dungeon_bg.png')} className="w-full h-full object-cover grayscale" />
                </div>

                <div key={selectedDungeon.id} className="flex-1 flex flex-col items-center z-10 min-h-0">
                    <button onClick={() => setView('LIST')} className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg border border-stone-700 text-stone-400 text-[10px] font-black uppercase transition-all shadow-xl active:scale-95">
                        <ChevronLeft className="w-3.5 h-3.5" /> Back to Sectors
                    </button>

                    <div className="relative flex flex-col items-center pt-10 sm:pt-14 z-10 shrink-0 w-full">
                        <div className="h-14 sm:h-20 flex flex-col items-center justify-center text-center px-10 mb-2">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-serif tracking-tighter uppercase leading-none">{selectedDungeon.name}</h1>
                            <div className="mt-1.5 px-3 py-0.5 rounded-full bg-amber-900/30 border border-amber-600/30 text-amber-500 text-[8px] font-black uppercase tracking-widest shadow-lg">Tier {selectedDungeon.tier} Engagement</div>
                        </div>

                        <div className="relative w-full flex items-center justify-center h-24 sm:h-44 mb-2 sm:mb-6">
                            <button 
                                onClick={handlePrevFloor} 
                                className={`absolute left-4 z-30 p-3 sm:p-5 rounded-full border transition-all active:scale-90 shadow-2xl backdrop-blur-md ${selectedFloor > 1 ? 'bg-stone-800 hover:bg-amber-600 border-stone-700 text-white' : 'bg-stone-900 border-stone-850 text-stone-800 opacity-20 cursor-not-allowed'}`}
                            >
                                <ChevronLeft className="w-6 h-6 sm:w-10 sm:h-10" />
                            </button>

                            <div className="relative group animate-in fade-in zoom-in duration-300">
                                <div className={`w-20 h-20 sm:w-36 lg:w-44 sm:h-36 lg:h-44 bg-stone-900 rounded-[2rem] border-4 border-stone-700 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden ring-4 ring-white/5`}>
                                     <div className="text-[10px] font-black text-stone-600 uppercase mb-1">Floor</div>
                                     <div className="text-4xl sm:text-7xl lg:text-8xl font-black text-white font-mono leading-none">{selectedFloor}</div>
                                     <div className="text-[8px] sm:text-[10px] font-bold text-amber-500/60 mt-1 uppercase tracking-[0.2em]">Deployment</div>
                                </div>
                                {selectedFloor === selectedDungeon.maxFloors && (
                                    <div className="absolute -top-3 -right-3 px-3 py-1 bg-red-600 border-2 border-red-400 rounded-xl text-white font-black text-[10px] shadow-2xl animate-pulse rotate-12 z-40">BOSS SECTOR</div>
                                )}
                            </div>

                            <button 
                                onClick={handleNextFloor} 
                                className={`absolute right-4 z-30 p-3 sm:p-5 rounded-full border transition-all active:scale-90 shadow-2xl backdrop-blur-md ${selectedFloor < selectedDungeon.maxFloors ? 'bg-stone-800 hover:bg-amber-600 border-stone-700 text-white' : 'bg-stone-900 border-stone-850 text-stone-800 opacity-20 cursor-not-allowed'}`}
                            >
                                <ChevronRight className="w-6 h-6 sm:w-10 sm:h-10" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-8 pt-0 z-10 flex flex-col items-center min-h-0 w-full">
                        <div className="w-full max-w-sm space-y-4 sm:space-y-6">
                            <div className="bg-stone-950/40 p-4 rounded-xl border border-stone-800/50">
                                <div className="flex items-center justify-center gap-1.5 mb-3">
                                    <Box className="w-4 h-4 text-stone-600" />
                                    <h4 className="text-[10px] sm:text-xs font-black text-stone-500 uppercase tracking-widest">Expected Loot</h4>
                                </div>
                                <div className="flex wrap justify-center gap-3">
                                    {selectedDungeon.rewards.map((reward, ridx) => (
                                        <div key={`${reward.itemId}-${ridx}`} className="w-10 h-10 md:w-14 md:h-14 bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-center shadow-inner relative group">
                                            <img src={getAssetUrl(`${reward.itemId}.png`)} className="w-7 h-7 md:w-10 md:h-10 object-contain" onError={e=>e.currentTarget.style.display='none'} />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stone-950 border border-stone-700 rounded text-[10px] font-bold text-stone-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">{materials[reward.itemId]?.name || reward.itemId}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-stone-925 relative overflow-hidden min-h-0 min-w-0">
                {hasActiveMission ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center animate-in fade-in duration-700">
                        <Trophy className={`w-12 h-12 sm:w-28 mb-8 ${currentExpedition?.status === 'COMPLETED' ? 'text-emerald-500 animate-bounce' : 'text-stone-800 opacity-30'}`} />
                        <h2 className="text-lg sm:text-4xl font-black text-stone-100 mb-2 uppercase tracking-tighter font-serif italic">Mission Underway</h2>
                        <div className="bg-stone-900/80 border-2 border-stone-800 px-10 py-5 rounded-2xl font-mono text-2xl sm:text-4xl font-black text-amber-50 shadow-2xl flex items-center gap-3 mb-8">
                            <Timer className="w-8 h-8 animate-pulse text-amber-600" />
                            <span>{timeLeft || '---'}</span>
                        </div>
                        <div className="flex gap-3">
                            {currentExpedition?.status === 'COMPLETED' ? (
                                <button onClick={() => actions.claimExpedition(currentExpedition.id)} className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-xl flex items-center gap-2 border-b-4 border-emerald-800 active:scale-95 transition-all uppercase tracking-widest"><CheckCircle className="w-5 h-5" /> Secure Loot</button>
                            ) : (
                                <button onClick={() => setShowRecallConfirm(isOngoingManual ? 'MANUAL' : 'AUTO')} className="px-6 py-3 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 rounded-xl text-red-500 font-black text-xs uppercase tracking-widest transition-all active:scale-95"><Ban className="w-4 h-4 mr-2 inline" /> Recall Squad</button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 sm:p-6 bg-stone-900/80 border-b border-stone-800 grid grid-cols-3 gap-4 shrink-0">
                            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
                                <span className="text-[10px] text-stone-500 font-black uppercase mb-1">Time</span>
                                <div className="text-base sm:text-xl font-black text-stone-200 font-mono">{selectedDungeon.durationMinutes}m</div>
                            </div>
                            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
                                <span className="text-[10px] text-stone-500 font-black uppercase mb-1">Energy</span>
                                <div className="text-base sm:text-xl font-black text-blue-400 font-mono">-{energyCostForFloor}</div>
                            </div>
                            <div className={`bg-stone-950 p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${failedPowerHighlight ? 'border-red-500 ring-2 ring-red-500/50 animate-shake-hard' : 'border-stone-800'}`}>
                                <span className="text-[10px] text-stone-500 font-black uppercase mb-1">Req. Power</span>
                                <div className={`text-base sm:text-xl font-black font-mono ${currentPartyPower >= requiredPowerForFloor ? 'text-emerald-400' : 'text-red-500'}`}>{currentPartyPower} / {requiredPowerForFloor}</div>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden p-4 sm:p-6 gap-4 sm:gap-6 min-h-0">
                            <div className="w-full sm:w-[45%] flex flex-col gap-3 shrink-0">
                                <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest px-1 flex justify-between"><span>Squad Slots</span><span>{party.length}/{maxPartySize}</span></h3>
                                <div className="grid grid-cols-4 sm:grid-cols-2 gap-3 shrink-0">
                                    {Array.from({ length: 4 }).map((_, idx) => {
                                        const isAvailable = idx < maxPartySize;
                                        const mercId = party[idx];
                                        const merc = knownMercenaries.find(m => m.id === mercId);
                                        const hasError = mercId && (failedMercs.includes(mercId) || lowHpMercs.includes(mercId));

                                        if (!isAvailable) return <div key={idx} className="aspect-square bg-stone-950/60 border-2 border-stone-900 rounded-2xl flex items-center justify-center grayscale"><Ban className="w-10 text-stone-800" /></div>;

                                        return (
                                            <div key={idx} className={`aspect-square bg-stone-900 border-2 rounded-2xl flex items-center justify-center relative shadow-2xl overflow-hidden group hover:bg-stone-850 transition-all ${hasError ? 'border-red-600 animate-shake-hard' : 'border-dashed border-stone-800'}`}>
                                                {!!merc ? (
                                                    <button onClick={() => toggleMercenary(merc.id)} className="w-full h-full flex flex-col items-center justify-center p-2 relative animate-in zoom-in-95">
                                                        <div className="text-3xl sm:text-6xl group-hover:scale-110 transition-transform mb-1">{merc.icon}</div>
                                                        <div className="text-[10px] sm:text-xs font-black text-stone-200 truncate w-full text-center">{merc.name.split(' ')[0]}</div>
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><XCircle className="w-5 text-red-600" /></div>
                                                        {hasError && <div className="absolute inset-0 bg-red-900/40 backdrop-blur-[1px] flex items-center justify-center"><AlertCircle className="w-10 text-white" /></div>}
                                                    </button>
                                                ) : <User className="text-stone-800/40 w-12" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col bg-stone-950/40 rounded-2xl border border-stone-800 shadow-inner overflow-hidden">
                                <div className="p-3 border-b border-stone-800 bg-stone-900/40 flex justify-between items-center"><span className="text-xs font-black text-stone-400 uppercase tracking-widest">Available Units</span></div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                                    {hiredMercs.map(merc => {
                                        const isSelected = party.includes(merc.id);
                                        const isBusy = activeExpeditions.some(e => e.partyIds.includes(merc.id)) || (activeManualDungeon?.partyIds.includes(merc.id));
                                        const power = calculateMercenaryPower(merc);
                                        const energy = merc.expeditionEnergy || 0;
                                        const hasError = failedMercs.includes(merc.id) || lowHpMercs.includes(merc.id);

                                        return (
                                            <button key={merc.id} onClick={() => !isBusy && toggleMercenary(merc.id)} disabled={isBusy} className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${isSelected ? 'bg-amber-900/30 border-amber-600 shadow-glow-sm' : 'bg-stone-900 border-stone-800'} ${isBusy ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : ''} ${hasError ? 'border-red-600' : ''}`}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="text-2xl sm:text-4xl">{merc.icon}</div>
                                                    <div className="text-left"><div className="font-black text-stone-200 text-xs sm:text-sm truncate">{merc.name}</div><div className="text-[10px] text-amber-500 font-mono font-bold">POW {power}</div></div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    {isBusy ? <span className="text-[8px] font-black uppercase text-stone-500 bg-stone-950 px-2 py-0.5 rounded">Deployed</span> : <div className="flex items-center gap-2"><div className="w-12 h-2 bg-stone-950 rounded-full border border-stone-800"><div className={`h-full rounded-full ${energy >= energyCostForFloor ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${energy}%` }} /></div><Zap className={`w-4 h-4 ${energy >= energyCostForFloor ? 'text-blue-500' : 'text-red-500 animate-pulse'}`} /></div>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-stone-900/50 border-t border-stone-800 shrink-0">
                            <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
                                {/* Strategic Deploy (Auto) Button */}
                                <button 
                                    onClick={handleStartAutoExpedition} 
                                    disabled={party.length === 0 || isOngoingManual || !isFloorCleared} 
                                    className={`group flex flex-col items-center justify-center gap-1 py-4 rounded-xl border-b-4 transition-all shadow-xl ${party.length > 0 && !isOngoingManual && isFloorCleared ? 'bg-indigo-700 hover:bg-indigo-600 border-indigo-900 text-white' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed opacity-60'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {!isFloorCleared ? <Lock className="w-4 h-4" /> : <Timer className="w-5" />}
                                        <span className="font-black uppercase text-sm">Strategic Deploy</span>
                                    </div>
                                    <span className="text-[8px] font-bold opacity-60 uppercase">
                                        {isFloorCleared ? "Auto Expedition" : "Requires Manual Clear"}
                                    </span>
                                </button>

                                {/* Direct Assault (Manual) Button */}
                                <button onClick={handleStartManualAssault} disabled={party.length === 0 && !isOngoingManual} className={`group flex flex-col items-center justify-center gap-1 py-4 rounded-xl border-b-4 transition-all shadow-xl ${party.length > 0 || isOngoingManual ? 'bg-amber-600 hover:bg-amber-500 border-amber-800 text-white' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed'}`}><div className="flex items-center gap-2"><Gamepad2 className="w-5" /><span className="font-black uppercase text-sm">{isOngoingManual ? 'Resume' : 'Direct Assault'}</span></div><span className="text-[10px] font-bold opacity-60 uppercase">Manual Exploration</span></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal isOpen={!!showRecallConfirm} title="Abort Mission?" message="Recalling the squad now will forfeit all progress and potential loot. Continue?" confirmLabel="Confirm Recall" cancelLabel="Stay Deployed" isDanger onConfirm={() => { if(showRecallConfirm==='AUTO') actions.abortExpedition(currentExpedition!.id); else actions.retreatFromManualDungeon(); setShowRecallConfirm(null); }} onCancel={() => setShowRecallConfirm(null)} />
        </div>
    );
};

export default DungeonTab;