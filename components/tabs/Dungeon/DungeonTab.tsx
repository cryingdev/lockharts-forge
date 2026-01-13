
import { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import { DUNGEONS } from '../../../data/dungeons';
import { MATERIALS } from '../../../data/materials';
import { EQUIPMENT_ITEMS } from '../../../data/equipment';
import { calculatePartyPower, calculateMercenaryPower } from '../../../utils/combatLogic';
import { Sword, Skull, Timer, Zap, Map as MapIcon, ChevronRight, ChevronLeft, Lock, CheckCircle, Trophy, User, XCircle, Triangle, Box, AlertCircle, Gamepad2, Navigation2, Play, Ban, RefreshCw, LogOut, AlertTriangle } from 'lucide-react';
import { getAssetUrl, formatDuration } from '../../../utils';
import AssaultNavigator from './AssaultNavigator';
import ConfirmationModal from '../../modals/ConfirmationModal';

const DungeonTab = () => {
    const { state, actions } = useGame();
    const { activeExpeditions, knownMercenaries, dungeonClearCounts, unlockedRecipes, inventory, activeManualDungeon, showManualDungeonOverlay } = state;

    // Index-based selection for paging
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [party, setParty] = useState<string[]>([]);
    const [failedMercs, setFailedMercs] = useState<string[]>([]);
    const [failedPowerHighlight, setFailedPowerHighlight] = useState(false);
    
    // Modal states
    const [showRecallConfirm, setShowRecallConfirm] = useState<'AUTO' | 'MANUAL' | null>(null);
    
    const selectedDungeon = DUNGEONS[selectedIndex];
    const maxPartySize = selectedDungeon.maxPartySize || 4;

    // Check if this specific dungeon is the one being manually assaulted
    const isOngoingManual = activeManualDungeon && activeManualDungeon.dungeonId === selectedDungeon.id;
    const currentExpedition = activeExpeditions.find(e => e.dungeonId === selectedDungeon.id);
    
    // Any active mission (Auto or Manual) for this dungeon
    const hasActiveMission = !!currentExpedition || !!isOngoingManual;

    const hiredMercs = useMemo(() => knownMercenaries.filter(m => m.status === 'HIRED'), [knownMercenaries]);
    
    const isMercBusy = (mercId: string) => {
        return activeExpeditions.some(e => e.partyIds.includes(mercId)) || 
               (activeManualDungeon && activeManualDungeon.partyIds.includes(mercId));
    };

    const handlePrev = () => {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : DUNGEONS.length - 1));
        setParty([]);
        setFailedMercs([]);
        setFailedPowerHighlight(false);
    };

    const handleNext = () => {
        setSelectedIndex(prev => (prev < DUNGEONS.length - 1 ? prev + 1 : 0));
        setParty([]);
        setFailedMercs([]);
        setFailedPowerHighlight(false);
    };

    const toggleMercenary = (mercId: string) => {
        if (party.includes(mercId)) {
            setParty(prev => prev.filter(id => id !== mercId));
        } else {
            if (party.length < maxPartySize) {
                setParty(prev => [...prev, mercId]);
            } else if (maxPartySize === 1 && party.length === 1) {
                // If 1-person dungeon, swap the current member
                setParty([mercId]);
            }
        }
        if (failedMercs.includes(mercId)) {
            setFailedMercs(prev => prev.filter(id => id !== mercId));
        }
    };

    const validateEntry = () => {
        if (party.length === 0 || !selectedDungeon) return false;

        const selectedMercs = knownMercenaries.filter(m => party.includes(m.id));
        const lowEnergyIds = selectedMercs
            .filter(m => (m.expeditionEnergy || 0) < selectedDungeon.energyCost)
            .map(m => m.id);

        if (lowEnergyIds.length > 0) {
            setFailedMercs(lowEnergyIds);
            setTimeout(() => setFailedMercs([]), 2000);
            actions.showToast("Some squad members are too exhausted.");
            return false;
        }

        if (currentPartyPower < selectedDungeon.requiredPower) {
            setFailedPowerHighlight(true);
            setTimeout(() => setFailedPowerHighlight(false), 2000);
            actions.showToast("Party power is insufficient for this area.");
            return false;
        }

        return true;
    };

    const handleStartAutoExpedition = () => {
        if (isOngoingManual) {
            actions.showToast("Cannot start auto-expedition while a manual assault is active.");
            return;
        }
        if (!validateEntry()) return;
        actions.startExpedition(selectedDungeon.id, party);
    };

    const handleStartManualAssault = () => {
        if (isOngoingManual) {
            actions.toggleManualDungeonOverlay(true);
            return;
        }
        if (!validateEntry()) return;
        actions.startManualAssault(selectedDungeon.id, party);
    };

    const handleClaim = (expId: string) => {
        actions.claimExpedition(expId);
    };

    const handleConfirmRecall = () => {
        if (showRecallConfirm === 'AUTO' && currentExpedition) {
            actions.abortExpedition(currentExpedition.id);
            actions.showToast("Strategic deployment cancelled.");
        } else if (showRecallConfirm === 'MANUAL') {
            actions.retreatFromManualDungeon();
            actions.showToast("Direct assault abandoned.");
        }
        setShowRecallConfirm(null);
    };

    const currentPartyPower = useMemo(() => {
        const selectedMercs = knownMercenaries.filter(m => party.includes(m.id));
        return calculatePartyPower(selectedMercs);
    }, [party, knownMercenaries]);

    const [timeLeft, setTimeLeft] = useState<string>('');
    const isComplete = currentExpedition?.status === 'COMPLETED';

    useEffect(() => {
        if (!currentExpedition) {
            setTimeLeft('');
            return;
        }
        if (currentExpedition.status === 'COMPLETED') {
            setTimeLeft('00:00');
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const end = currentExpedition.endTime;
            const diff = end - now;
            if (diff <= 0) setTimeLeft('00:00');
            else setTimeLeft(formatDuration(diff));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [currentExpedition]);

    const isUnlocked = selectedDungeon.tier <= state.stats.tierLevel + 1;
    const clears = dungeonClearCounts[selectedDungeon.id] || 0;
    const isBoss = !!selectedDungeon.bossVariantId;

    const displayRewards = useMemo(() => {
        const base = [...selectedDungeon.rewards];
        if (selectedDungeon.id === 'dungeon_t1_rats') {
            const targetId = 'sword_bronze_long_t1';
            const itemDef = EQUIPMENT_ITEMS.find(i => i.id === targetId);
            const isItemAlreadyUnlocked = itemDef?.unlockedByDefault !== false || unlockedRecipes.includes(targetId);
            const hasScroll = inventory.some(i => i.id === 'recipe_scroll_bronze_longsword');
            
            if (clears === 0 && !isItemAlreadyUnlocked && !hasScroll) {
                base.push({ itemId: 'recipe_scroll_bronze_longsword', minQuantity: 1, maxQuantity: 1, chance: 1.0 });
            }
        }
        return base;
    }, [selectedDungeon, clears, unlockedRecipes, inventory]);

    return (
        <div className="h-full w-full flex flex-col sm:flex-row bg-stone-950 text-stone-200 overflow-hidden font-sans relative">
            
            {(activeManualDungeon && showManualDungeonOverlay) && <AssaultNavigator />}

            {/* Left/Upper Panel: Dungeon Selection */}
            <div className="w-full sm:w-[40%] h-[42%] sm:h-full flex flex-col border-b sm:border-b-0 sm:border-r border-stone-800 bg-stone-900/50 relative overflow-hidden shrink-0 min-h-0">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <img src={getAssetUrl('dungeon_bg.png')} className="w-full h-full object-cover grayscale" />
                </div>

                <div key={selectedDungeon.id} className="flex-1 flex flex-col items-center z-10 min-h-0 transform-gpu backface-hidden">
                    
                    <div className="relative flex flex-col items-center pt-3 sm:pt-10 z-10 shrink-0 w-full">
                        <div className="h-14 sm:h-24 flex flex-col items-center justify-center text-center px-10 mb-1 sm:mb-4">
                            <h1 className="text-base sm:text-2xl lg:text-3xl font-black text-white font-serif tracking-tighter uppercase leading-none animate-in fade-in duration-300">
                                {selectedDungeon.name}
                            </h1>
                            {!isUnlocked && (
                                <div className="flex items-center justify-center gap-1.5 text-red-500 font-bold text-[8px] sm:text-xs uppercase mt-1">
                                    <Lock className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> Area Locked
                                </div>
                            )}
                        </div>

                        <div className="relative w-full flex items-center justify-center h-20 sm:h-40 mb-1 sm:mb-6">
                            <button 
                                onClick={handlePrev} 
                                className="absolute left-2 sm:left-4 z-30 p-2 sm:p-4 bg-stone-800/80 hover:bg-amber-600 rounded-full border border-stone-700 transition-all active:scale-90 group shadow-2xl backdrop-blur-md"
                            >
                                <ChevronLeft className="w-4 h-4 sm:w-8 sm:h-8 text-stone-400 group-hover:text-white" />
                            </button>

                            <div className="relative group animate-in fade-in zoom-in duration-300">
                                <div className={`absolute inset-0 blur-2xl rounded-full opacity-20 ${isBoss ? 'bg-red-500' : 'bg-amber-500'} group-hover:opacity-40 transition-opacity`}></div>
                                
                                <div className={`w-16 h-16 sm:w-32 lg:w-40 sm:h-32 lg:h-40 bg-stone-900 rounded-[1.2rem] sm:rounded-[2rem] border-2 sm:border-4 border-stone-700 flex items-center justify-center relative shadow-2xl overflow-hidden ring-4 ring-white/5 ${!isUnlocked ? 'grayscale brightness-50' : ''}`}>
                                     <div className="text-2xl sm:text-5xl lg:text-6xl drop-shadow-2xl">
                                        {selectedDungeon.id.includes('rat') ? '🐀' : selectedDungeon.id.includes('goblin') ? '👺' : selectedDungeon.id.includes('mine') ? '⛏️' : '🏰'}
                                     </div>
                                     {currentExpedition && timeLeft && (
                                         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
                                             <Timer className="w-4 h-4 sm:w-8 sm:h-8 text-amber-50 animate-pulse" />
                                             <span className="text-[9px] sm:text-sm font-mono text-amber-400 font-bold">{timeLeft}</span>
                                         </div>
                                     )}
                                     {isOngoingManual && !showManualDungeonOverlay && (
                                         <div className="absolute inset-0 bg-amber-900/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
                                             <Navigation2 className="w-4 h-4 sm:w-8 sm:h-8 text-amber-200 animate-bounce" />
                                             <span className="text-[9px] sm:text-xs font-black text-white uppercase tracking-tight">Active</span>
                                         </div>
                                     )}
                                </div>

                                <div className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded sm:rounded-lg font-black text-[7px] sm:text-xs shadow-xl border sm:border-2 z-30 font-mono tracking-tighter ${isBoss ? 'bg-red-700 border-red-400 text-white' : 'bg-amber-600 border-amber-400 text-amber-50'}`}>
                                    {isBoss ? 'BOSS' : `TIER ${selectedDungeon.tier}`}
                                </div>
                            </div>

                            <button 
                                onClick={handleNext} 
                                className="absolute right-2 sm:right-4 z-30 p-2 sm:p-4 bg-stone-800/80 hover:bg-amber-600 rounded-full border border-stone-700 transition-all active:scale-90 group shadow-2xl backdrop-blur-md"
                            >
                                <ChevronRight className="w-4 h-4 sm:w-8 sm:h-8 text-stone-400 group-hover:text-white" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-8 pt-0 z-10 flex flex-col items-center min-h-0 w-full">
                        <div className="w-full max-w-sm space-y-3 sm:space-y-6">
                            <p className="text-stone-400 text-[9px] sm:text-sm text-center italic px-4 leading-snug animate-in fade-in duration-500">
                                "{selectedDungeon.description}"
                            </p>

                            <div className="bg-stone-950/40 p-2 sm:p-4 rounded-xl border border-stone-800/50">
                                <div className="flex items-center justify-center gap-1.5 mb-1.5 sm:mb-3">
                                    <Box className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-stone-600" />
                                    <h4 className="text-[7px] sm:text-xs font-black text-stone-500 uppercase tracking-widest">Expected Loot</h4>
                                </div>
                                <div className="flex flex-wrap justify-center gap-1 sm:gap-3">
                                    {displayRewards.map((reward, ridx) => {
                                        const mat = Object.values(MATERIALS).find(m => m.id === reward.itemId);
                                        return (
                                            <div key={`${selectedDungeon.id}-reward-${ridx}`} className="group relative w-7 h-7 sm:w-12 sm:h-12 bg-stone-900 border border-stone-800 rounded-lg flex items-center justify-center hover:border-amber-500/50 transition-colors shadow-inner">
                                                <img 
                                                    src={getAssetUrl(`${reward.itemId}.png`)} 
                                                    className="w-4 h-4 sm:w-8 sm:h-8 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stone-950 border border-stone-700 rounded text-[7px] sm:text-[9px] font-bold text-stone-300 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-2xl">
                                                    {mat?.name || reward.itemId}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {selectedDungeon.bossUnlockReq && (
                                <div className="bg-stone-950/80 p-2 sm:p-4 rounded-xl border border-stone-800 shadow-xl">
                                    <div className="flex justify-between text-[7px] sm:text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1.5 sm:mb-2">
                                        <span>Area Progress</span>
                                        <span className="text-red-500">{clears}/{selectedDungeon.bossUnlockReq} CLEARS</span>
                                    </div>
                                    <div className="h-1 sm:h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                                        <div className="h-full bg-gradient-to-r from-red-900 to-red-600 transition-all duration-1000" style={{ width: `${Math.min(100, (clears / selectedDungeon.bossUnlockReq) * 100)}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="hidden sm:block p-3 sm:p-4 bg-stone-950/80 border-t border-stone-800 text-center font-mono text-[9px] sm:text-[10px] text-stone-600 uppercase tracking-[0.3em] shrink-0">
                    Location Index {selectedIndex + 1} of {DUNGEONS.length}
                </div>
            </div>

            {/* Right/Lower Panel: Deployment & Squad */}
            <div className="flex-1 flex flex-col bg-stone-925 relative overflow-hidden min-h-0 min-w-0">
                {hasActiveMission ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center animate-in fade-in duration-700">
                        <Trophy className={`w-10 h-10 sm:w-24 lg:w-28 mb-4 sm:mb-8 ${isComplete ? 'text-emerald-500 animate-bounce' : 'text-stone-800 opacity-30'}`} />
                        <h2 className="text-lg sm:text-3xl lg:text-4xl font-black text-stone-100 mb-2 uppercase tracking-tighter font-serif italic">Mission Underway</h2>
                        <p className="text-stone-500 text-[10px] sm:text-base lg:text-lg max-w-lg mb-4 sm:mb-8 leading-relaxed px-4">
                            {isOngoingManual 
                                ? `Your squad is currently engaging targets in ${selectedDungeon.name}. Await tactical updates or resume command.`
                                : `The squad is currently navigating the hazards of ${selectedDungeon.name}. Stand by for status updates.`}
                        </p>
                        
                        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                            {/* Case 1: Completed Auto Expedition */}
                            {currentExpedition && isComplete && (
                                <button onClick={() => handleClaim(currentExpedition.id)} className="w-full py-4 sm:py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl md:rounded-2xl shadow-2xl flex items-center justify-center gap-3 border-b-4 border-emerald-800 active:scale-95 transition-all">
                                    <CheckCircle className="w-5 h-5 sm:w-8" /> 
                                    <span className="text-xs sm:text-xl uppercase tracking-widest">Secure Loot & Return</span>
                                </button>
                            )}

                            {/* Case 2: Active Auto Expedition */}
                            {currentExpedition && !isComplete && (
                                <>
                                    <div className="bg-stone-900/80 border-2 border-stone-800 px-6 py-3 sm:px-10 sm:py-5 rounded-2xl font-mono text-base sm:text-2xl lg:text-3xl font-black text-amber-50 shadow-2xl backdrop-blur-md flex items-center gap-2">
                                        <Timer className="w-5 h-5 sm:w-8 lg:w-10 animate-pulse text-amber-600 shrink-0" />
                                        <span>{timeLeft}</span>
                                    </div>
                                    <button 
                                        onClick={() => setShowRecallConfirm('AUTO')}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 rounded-xl text-red-500 font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95"
                                    >
                                        <Ban className="w-4 h-4" /> Cancel & Recall Squad
                                    </button>
                                </>
                            )}

                            {/* Case 3: Ongoing Manual Assault */}
                            {isOngoingManual && (
                                <>
                                    <button 
                                        onClick={handleStartManualAssault} 
                                        className="w-full py-3 md:py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl shadow-2xl flex items-center justify-center gap-3 border-b-4 border-amber-800 active:scale-95 transition-all"
                                    >
                                        <Play className="w-5 h-5 sm:w-6 animate-pulse" /> 
                                        <span className="text-xs sm:text-lg uppercase tracking-widest">Resume Assault</span>
                                    </button>
                                    <button 
                                        onClick={() => setShowRecallConfirm('MANUAL')}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 rounded-xl text-red-500 font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95"
                                    >
                                        <LogOut className="w-4 h-4" /> Abandon & Return
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Requirement Banner */}
                        <div className="p-2 sm:p-5 lg:p-6 bg-stone-900/80 border-b border-stone-800 grid grid-cols-3 gap-2 sm:gap-6 shrink-0">
                            <div className="bg-stone-950 p-1.5 sm:p-4 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
                                <span className="text-[6px] sm:text-[9px] lg:text-[10px] text-stone-500 font-black uppercase tracking-tighter mb-0.5">Time</span>
                                <div className="flex items-center gap-1 text-[10px] sm:text-lg lg:text-xl font-black text-stone-200 font-mono"><Timer className="w-2.5 h-2.5 sm:w-4 lg:w-5 text-stone-500" /> {selectedDungeon.durationMinutes}m</div>
                            </div>
                            <div className="bg-stone-950 p-1.5 sm:p-4 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
                                <span className="text-[6px] sm:text-[9px] lg:text-[10px] text-stone-500 font-black uppercase tracking-tighter mb-0.5">Energy</span>
                                <div className="flex items-center gap-1 text-[10px] sm:text-lg lg:text-xl font-black text-blue-400 font-mono"><Zap className="w-2.5 h-2.5 sm:w-4 lg:w-5" /> -{selectedDungeon.energyCost}</div>
                            </div>
                            <div className={`bg-stone-950 p-1.5 sm:p-4 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 relative ${failedPowerHighlight ? 'border-red-500 ring-2 ring-red-500/50 animate-shake-hard shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-stone-800'}`}>
                                <span className="text-[6px] sm:text-[9px] lg:text-[10px] text-stone-500 font-black uppercase tracking-tighter mb-0.5">Squad Power</span>
                                <div className={`flex items-center gap-1 text-[10px] sm:text-lg lg:text-xl font-black font-mono ${currentPartyPower >= selectedDungeon.requiredPower ? 'text-emerald-400' : 'text-red-500'}`}>
                                    <Sword className="w-2.5 h-2.5 sm:w-4 lg:w-5" /> {currentPartyPower} / {selectedDungeon.requiredPower}
                                </div>
                                {failedPowerHighlight && (
                                    <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[7px] sm:text-[10px] font-black px-2 py-1 rounded shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-2 whitespace-nowrap z-50 ring-1 ring-red-400">
                                        INSUFFICIENT POWER
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Squad Grid & Tavern List */}
                        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden p-2 sm:p-5 lg:p-6 gap-2 sm:gap-6 min-h-0 min-w-0">
                            {/* Selected Squad Slot Area */}
                            <div className="w-full sm:w-[45%] flex flex-col gap-2 shrink-0">
                                <h3 className="text-[8px] sm:text-xs font-black text-stone-500 uppercase tracking-widest px-1 flex justify-between">
                                    <span>Deployment Slots</span>
                                    <span>{party.length} / {maxPartySize}</span>
                                </h3>
                                <div className="grid grid-cols-4 sm:grid-cols-2 gap-1.5 sm:gap-4 shrink-0 px-1">
                                    {Array.from({ length: 4 }).map((_, idx) => {
                                        const isAvailable = idx < maxPartySize;
                                        const mercId = party[idx];
                                        const merc = knownMercenaries.find(m => m.id === mercId);
                                        const hasError = mercId ? failedMercs.includes(mercId) : false;

                                        if (!isAvailable) {
                                            return (
                                                <div key={idx} className="aspect-square bg-stone-950/60 border-2 border-stone-900 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group grayscale">
                                                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.2)_8px,rgba(0,0,0,0.2)_16px)] opacity-40"></div>
                                                    <Ban className="w-5 h-5 sm:w-8 lg:w-10 text-stone-800 mb-1" />
                                                    <span className="text-[6px] sm:text-[8px] font-black text-stone-800 uppercase tracking-widest">Locked</span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={idx} className={`aspect-square bg-stone-900 border-2 rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden group hover:bg-stone-850 transition-all ${hasError ? 'border-red-600 animate-shake-hard' : 'border-dashed border-stone-800'}`}>
                                                {merc ? (
                                                    <button onClick={() => toggleMercenary(merc.id)} className="w-full h-full flex flex-col items-center justify-center p-1 sm:p-2 relative animate-in zoom-in-95 duration-200">
                                                        <div className="text-xl sm:text-5xl lg:text-6xl group-hover:scale-110 transition-transform mb-0.5">{merc.icon}</div>
                                                        <div className="text-[7px] sm:text-[10px] lg:text-sm font-black text-stone-200 truncate w-full text-center">{merc.name.split(' ')[0]}</div>
                                                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-10 transition-opacity">
                                                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 shadow-2xl" />
                                                        </div>
                                                        {hasError && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-red-900/40 backdrop-blur-[1px] animate-in fade-in">
                                                                <AlertCircle className="w-6 h-6 sm:w-10 text-white drop-shadow-[0_0_8px_rgba(0,0,0,1)]" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <User className="text-stone-800/40 w-4 h-4 sm:w-10 lg:w-12" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Roster Selection Area */}
                            <div className="flex-1 flex flex-col gap-2 sm:gap-3 bg-stone-950/40 rounded-xl sm:rounded-2xl border border-stone-800 shadow-inner min-h-0 min-w-0 overflow-hidden">
                                <div className="p-2 sm:p-3 lg:p-4 border-b border-stone-800 bg-stone-900/40 flex justify-between items-center shrink-0">
                                    <span className="text-[8px] sm:text-10px] lg:text-xs font-black text-stone-400 uppercase tracking-widest">Available Units</span>
                                    <span className="text-[7px] sm:text-[9px] lg:text-[10px] font-mono text-stone-600 bg-stone-950 px-2 py-0.5 rounded-full">{hiredMercs.length} Hired</span>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 sm:p-3 space-y-1.5 sm:space-y-2">
                                    {hiredMercs.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-stone-700 italic text-[10px] sm:text-[11px] p-6 text-center opacity-50">
                                            No combat-ready mercenaries available. Visit the Tavern.
                                        </div>
                                    ) : (
                                        hiredMercs.map(merc => {
                                            const isSelected = party.includes(merc.id);
                                            const isBusy = isMercBusy(merc.id);
                                            const power = calculateMercenaryPower(merc);
                                            const energy = merc.expeditionEnergy || 0;
                                            const hasEnoughEnergy = energy >= selectedDungeon.energyCost;
                                            const hasError = failedMercs.includes(merc.id);

                                            return (
                                                <button 
                                                    key={merc.id} 
                                                    onClick={() => !isBusy && toggleMercenary(merc.id)} 
                                                    disabled={isBusy} 
                                                    className={`w-full flex items-center justify-between p-1.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${isSelected ? 'bg-amber-900/30 border-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.1)]' : 'bg-stone-900 border-stone-800 hover:border-stone-600'} ${isBusy ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : ''} ${hasError ? 'border-red-600 animate-shake-hard' : ''}`}
                                                >
                                                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
                                                        <div className="text-base sm:text-2xl lg:text-4xl">{merc.icon}</div>
                                                        <div className="text-left leading-tight min-w-0">
                                                            <div className="font-black text-stone-200 text-[9px] sm:text-xs lg:text-base truncate">{merc.name}</div>
                                                            <div className="text-[7px] sm:text-[9px] lg:text-[11px] text-amber-500 font-mono font-bold mt-0.5">POW {power}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                        {isBusy ? (
                                                            <span className="text-[6px] sm:text-[8px] lg:text-[9px] font-black uppercase text-stone-500 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">Busy</span>
                                                        ) : (
                                                            <div className="flex items-center gap-1 sm:gap-1.5">
                                                                <div className="w-8 xs:w-12 sm:w-16 lg:w-20 h-2 sm:h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800 p-[1px] shadow-inner">
                                                                    <div className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${hasEnoughEnergy ? 'from-blue-700 to-blue-500' : 'from-red-800 to-red-600 animate-pulse'}`} style={{ width: `${energy}%` }}></div>
                                                                </div>
                                                                <Zap className={`w-3 h-3 sm:w-4 lg:w-5 ${hasEnoughEnergy ? 'text-blue-500' : 'text-red-600 animate-pulse'}`} />
                                                                {hasError && <AlertCircle className="w-3.5 h-3.5 sm:w-5 text-red-500 animate-pulse" />}
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

                        {/* Footer Action Bar: Dual Mode Split */}
                        <div className="p-2 sm:p-5 lg:p-6 bg-stone-900/50 border-t border-stone-800 shrink-0">
                            <div className="grid grid-cols-2 gap-2 sm:gap-4 max-w-2xl mx-auto">
                                {/* Strategic Deploy (Existing Auto) */}
                                <button 
                                    onClick={handleStartAutoExpedition} 
                                    disabled={!isUnlocked || party.length === 0 || !!isOngoingManual} 
                                    className={`group flex flex-col items-center justify-center gap-1 py-2 sm:py-4 rounded-xl border-b-4 transition-all transform active:scale-95 shadow-xl ${isUnlocked && party.length > 0 && !isOngoingManual ? 'bg-indigo-700 hover:bg-indigo-600 border-indigo-900 text-white' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed grayscale'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Timer className={`w-3 h-3 sm:w-5 ${isUnlocked && party.length > 0 && !isOngoingManual ? 'animate-pulse' : ''}`} />
                                        <span className="text-[10px] sm:text-base font-black uppercase tracking-tight">Strategic Deploy</span>
                                    </div>
                                    <span className="text-[7px] sm:text-[10px] font-bold opacity-60 uppercase tracking-widest">Auto Exploration</span>
                                </button>

                                {/* Direct Assault (New Manual) */}
                                <button 
                                    onClick={handleStartManualAssault} 
                                    disabled={!isUnlocked || (party.length === 0 && !isOngoingManual)} 
                                    className={`group flex flex-col items-center justify-center gap-1 py-2 sm:py-4 rounded-xl border-b-4 transition-all transform active:scale-95 shadow-xl ${isUnlocked && (party.length > 0 || isOngoingManual) ? 'bg-amber-600 hover:bg-amber-500 border-amber-800 text-white' : 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed grayscale'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {isOngoingManual ? <Play className="w-3 h-3 sm:w-5 animate-pulse text-amber-100" /> : <Gamepad2 className="w-3 h-3 sm:w-5" />}
                                        <span className="text-[10px] sm:text-base font-black uppercase tracking-tight">
                                            {isOngoingManual ? 'Resume Assault' : 'Direct Assault'}
                                        </span>
                                    </div>
                                    <span className="text-[7px] sm:text-[10px] font-bold opacity-60 uppercase tracking-widest">
                                        {isOngoingManual ? 'Continue Exploration' : 'Active Control'}
                                    </span>
                                </button>
                            </div>
                            {!isUnlocked && (
                                <div className="mt-3 text-center">
                                    <span className="text-[8px] sm:text-xs text-red-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                                        <Lock className="w-3 h-3" /> Area Exploration Locked
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Recall Confirmation Modal */}
            <ConfirmationModal 
                isOpen={!!showRecallConfirm}
                title="Recall Squad?"
                message={showRecallConfirm === 'MANUAL' 
                    ? "Abandon the current assault? You will lose all progress on this floor and return the entire squad to the Tavern immediately. No rewards will be gained."
                    : "Cancel strategic deployment? The squad will return to the Tavern immediately. No loot will be collected and energy will not be refunded."
                }
                confirmLabel="Confirm Recall"
                cancelLabel="Stay Deployed"
                isDanger={true}
                onConfirm={handleConfirmRecall}
                onAction={() => setShowRecallConfirm(null)}
            />
        </div>
    );
};

export default DungeonTab;
