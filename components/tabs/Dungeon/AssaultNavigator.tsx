
import React, { useEffect, useRef, useState, useMemo } from 'react';
import Phaser from 'phaser';
import { useGame } from '../../../context/GameContext';
import { DUNGEONS } from '../../../data/dungeons';
import DungeonScene from '../../../game/DungeonScene';
import DialogueBox from '../../DialogueBox';
import { 
    Key, Zap, LogOut, X, Trophy, Sparkles, Coins, ArrowRight, Package, ChevronUp, ChevronDown, CheckCircle, AlertTriangle, Shield, ChevronLeft, ChevronRight, Lock, Unlock, Target
} from 'lucide-react';
import ConfirmationModal from '../../modals/ConfirmationModal';
import { getAssetUrl } from '../../../utils';

type CameraMode = 'LOCKED' | 'ADAPTIVE' | 'FREE';

const AssaultNavigator = () => {
    const { state, actions } = useGame();
    const session = state.activeManualDungeon;
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [showAbortConfirm, setShowAbortConfirm] = useState(false);
    const [showRetreatAtEntranceConfirm, setShowRetreatAtEntranceConfirm] = useState(false);
    const [cameraMode, setCameraMode] = useState<CameraMode>('LOCKED');
    
    // UI states
    const [isSquadStatusExpanded, setIsSquadStatusExpanded] = useState(true);
    
    // Victory sequence states
    const [showResultPopup, setShowResultPopup] = useState(false);
    const [hasTriggeredVictory, setHasTriggeredVictory] = useState(false);
    
    // Persistent tactical feedback
    const [lastDiscoveryMessage, setLastDiscoveryMessage] = useState<string>('');

    // Rescue interaction state
    const [rescueStep, setRescueStep] = useState<'NONE' | 'DIALOGUE' | 'DONE'>('NONE');

    // CRITICAL FIX: All logic/calculations that depend on `session` must handle 
    // the case where `session` is null, because hooks cannot be skipped.
    const dungeon = session ? DUNGEONS.find(d => d.id === session.dungeonId) : null;
    const party = session ? state.knownMercenaries.filter(m => session.partyIds.includes(m.id)) : [];
    const avgEnergy = party.length > 0 ? party.reduce((sum, m) => sum + (m.expeditionEnergy || 0), 0) / (party.length || 1) : 0;

    const currentRoomType = (session && dungeon) ? session.grid[session.playerPos.y][session.playerPos.x] : null;
    const isNPCNode = currentRoomType === 'NPC';
    const isEntranceNode = currentRoomType === 'ENTRANCE';
    const isBossNode = currentRoomType === 'BOSS';
    const isTrapNode = currentRoomType === 'TRAP';

    useEffect(() => {
        const checkSize = () => {
            if (containerRef.current && containerRef.current.clientWidth > 0) {
                setIsReady(true);
            } else {
                requestAnimationFrame(checkSize);
            }
        };
        checkSize();
    }, []);

    useEffect(() => {
        if (!session || !dungeon) return;

        const room = session.grid[session.playerPos.y][session.playerPos.x];
        const latestLog = state.logs[0];

        if (session.isBossDefeated && !hasTriggeredVictory) {
            setShowResultPopup(true); 
            setHasTriggeredVictory(true);
            return;
        }

        if (room === 'KEY') setLastDiscoveryMessage("Chamber key recovered. Tactical scanning identifies the Boss location. What should we do next?");
        else if (room === 'NPC' && !session.npcFound) setLastDiscoveryMessage("Life-sign confirmed. Survivor location secured. Initializing escort protocols. What is the next move?");
        else if (room === 'BOSS' && !session.isBossDefeated) setLastDiscoveryMessage("Hostile Boss signature detected. Squad is ready to engage. Commencing Direct Assault?");
        else if (room === 'BOSS' && session.isBossDefeated) setLastDiscoveryMessage("Enemy High-Value Target neutralized. Sector secured. We can extract safely from this point.");
        else if (room === 'TRAP') setLastDiscoveryMessage("WARNING: Trap triggered! Structural integrity compromised, but area is currently safe. What should we do next?");
        else if (isEntranceNode && (lastDiscoveryMessage === '' || lastDiscoveryMessage.includes('Infiltration'))) setLastDiscoveryMessage(`Infiltration of ${dungeon.name} successful. Commencing area sweep. What's our first move?`);
        else if (room === 'EMPTY') {
            const goldTerms = ['Looted', 'Found', 'Discovered', 'cache', 'coins', 'gold'];
            if (goldTerms.some(term => latestLog?.includes(term))) setLastDiscoveryMessage("Treasury cache secured. This sector is now clear and safe. What should be our next course of action?");
            else setLastDiscoveryMessage("Scans indicate this area is vacant. No immediate threats detected. What is the next move?");
        }
    }, [session?.playerPos, session?.grid, session?.npcFound, dungeon?.name, isEntranceNode, state.logs, session?.isBossDefeated, hasTriggeredVictory]);

    useEffect(() => {
        if (!isReady || !containerRef.current || !session || !dungeon) return;
        if (!gameRef.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: containerRef.current,
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
                backgroundColor: 'transparent',
                transparent: true,
                scene: [DungeonScene],
                scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
            };
            const game = new Phaser.Game(config);
            gameRef.current = game;
            game.scene.start('DungeonScene', {
                session,
                moveEnergy: dungeon.moveEnergy,
                bossEnergy: dungeon.bossEnergy,
                onMove: (dx: number, dy: number) => { actions.moveInManualDungeon(dx, dy); },
                cameraMode: cameraMode
            });
        } else {
            const scene = gameRef.current.scene.getScene('DungeonScene') as DungeonScene;
            if (scene) {
                scene.updateSession(session);
                scene.setCameraMode(cameraMode);
            }
        }
    }, [isReady, session, actions, dungeon?.moveEnergy, dungeon?.bossEnergy, cameraMode]);

    useEffect(() => { return () => { if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; } }; }, []);

    const toggleCameraMode = () => {
        setCameraMode(prev => {
            if (prev === 'LOCKED') return 'ADAPTIVE';
            if (prev === 'ADAPTIVE') return 'FREE';
            return 'LOCKED';
        });
    };

    const handleDpadMove = (dx: number, dy: number) => {
        if (showResultPopup || rescueStep === 'DIALOGUE') return;
        const scene = gameRef.current?.scene.getScene('DungeonScene') as DungeonScene;
        if (scene) scene.move(dx, dy);
    };

    const handleClose = () => { if (showResultPopup) return; actions.toggleManualDungeonOverlay(false); };
    const handleAbort = () => { actions.retreatFromManualDungeon(); setShowAbortConfirm(false); };
    const handleRetreatAtEntrance = () => { actions.retreatFromManualDungeon(); setShowRetreatAtEntranceConfirm(false); };
    const handleRescueConfirm = () => { if (session?.dungeonId === 'dungeon_t1_rats') actions.rescueMercenary('tilly_footloose'); setRescueStep('DONE'); };
    const handleClaimRewardsAndExit = () => { actions.finishManualAssault(); };

    const interactionOptions = useMemo(() => {
        if (!session) return [];
        if (rescueStep === 'DIALOGUE') return [{ label: "Accept Escort Request", action: handleRescueConfirm, variant: 'primary' as const }];
        const opts = [];
        if (session.isBossDefeated && (isEntranceNode || isBossNode)) opts.push({ label: "Claim Rewards & Return", action: () => setShowResultPopup(true), variant: 'primary' as const });
        if (isEntranceNode && !session.isBossDefeated) opts.push({ label: "Retreat to Forge", action: () => setShowRetreatAtEntranceConfirm(true), variant: 'neutral' as const });
        if (isNPCNode && !session.npcFound && rescueStep === 'NONE') opts.push({ label: "Rescue Survivor", action: () => setRescueStep('DIALOGUE'), variant: 'primary' as const });
        return opts;
    }, [session?.playerPos, dungeon, isNPCNode, isBossNode, session?.npcFound, rescueStep, session?.isBossDefeated, actions, isEntranceNode]);

    const speakerName = useMemo(() => {
        if (session?.isBossDefeated) return "Tactical AI";
        if (rescueStep === 'DIALOGUE') return "Tilly Footloose";
        return "Tactical Link";
    }, [session?.isBossDefeated, rescueStep]);

    const tacticalDialogue = useMemo(() => {
        if (!session) return "";
        if (session.isBossDefeated) return "Mission status: CLEARED. Sector lockdown lifted. We can extract safely from the Boss chamber or the Sector Entrance. Would you like to secure the rewards now?";
        if (isEntranceNode) return "Current coordinates: Sector Entrance. Extraction point is active. If we retreat now without defeating the Boss, we will lose all collected resources.";
        if (rescueStep === 'DIALOGUE') return "Oh! Thank the gods! I thought the rats would have me for sure. Please, lead the way out... I'll find my own way back once we're clear of this floor.";
        if (isNPCNode && !session.npcFound) return "Warning: Unidentified life-sign detected in the immediate vicinity. Civilian presence confirmed. Escort protocols advised. What is the next move?";
        if (isTrapNode) return "TACTICAL ALERT: Active hazard detected on current coordinates! Avoid sustained exposure. What is our next move?";
        return lastDiscoveryMessage || "Scanning sector... Area clear. What's the next move?";
    }, [session?.isBossDefeated, isEntranceNode, rescueStep, isNPCNode, session?.npcFound, isTrapNode, lastDiscoveryMessage]);

    // Hook declarations finished. Now it is safe to return early if no session.
    if (!session || !dungeon) return null;

    const NavButton = ({ direction, dx, dy, disabled, Icon }: { direction: string, dx: number, dy: number, disabled: boolean, Icon: any }) => (
        <button 
            onClick={() => !disabled && handleDpadMove(dx, dy)}
            disabled={disabled}
            className={`w-full h-full flex items-center justify-center rounded-xl border-2 transition-all active:scale-90 shadow-lg ${
                disabled 
                ? 'bg-stone-900/40 border-stone-800 text-stone-700 opacity-20 cursor-not-allowed' 
                : 'bg-stone-800/80 hover:bg-stone-700 border-stone-600 text-stone-200 backdrop-blur-md'
            }`}
            title={direction}
        >
            <Icon className="w-[60%] h-[60%]" />
        </button>
    );

    const getCameraIcon = () => {
        if (cameraMode === 'LOCKED') return <Lock className="w-[50%] h-[50%]" />;
        if (cameraMode === 'ADAPTIVE') return <Target className="w-[50%] h-[50%]" />;
        return <Unlock className="w-[50%] h-[50%]" />;
    };

    const getCameraTitle = () => {
        if (cameraMode === 'LOCKED') return "Camera: Locked (Always Tracking)";
        if (cameraMode === 'ADAPTIVE') return "Camera: Adaptive (Track if Near Edge)";
        return "Camera: Free (No Tracking)";
    };

    return (
        <div className="absolute inset-0 z-[100] bg-stone-950 flex flex-col animate-in fade-in duration-500 overflow-hidden">
            <div ref={containerRef} className="absolute inset-0 z-0" />
            
            {/* Squad Status HUD */}
            <div className="absolute top-20 left-4 z-50 flex flex-col gap-2 w-48 md:w-56 pointer-events-none">
                <button onClick={() => setIsSquadStatusExpanded(!isSquadStatusExpanded)} className="bg-stone-950/40 backdrop-blur-md border border-white/10 rounded-lg p-2 mb-1 flex items-center justify-between pointer-events-auto hover:bg-stone-900/60 transition-colors group">
                    <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-blue-400" /><span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Squad Status</span></div>
                    {isSquadStatusExpanded ? <ChevronUp className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-300" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-300" />}
                </button>
                {isSquadStatusExpanded && party.map(merc => {
                    const hpPer = (merc.currentHp / merc.maxHp) * 100;
                    return (
                        <div key={merc.id} className="bg-stone-900/80 border border-stone-700/50 p-2 rounded-xl backdrop-blur-md shadow-lg animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 mb-1.5"><div className="w-6 h-6 rounded-full bg-stone-800 flex items-center justify-center border border-white/5 text-xs shadow-inner shrink-0">{merc.icon}</div><div className="min-w-0 flex-1"><div className="text-[10px] font-black text-white truncate leading-none uppercase">{merc.name.split(' ')[0]}</div><div className="text-[7px] text-stone-500 font-bold uppercase tracking-tighter truncate">{merc.job} • LV.{merc.level}</div></div></div>
                            <div className="flex justify-between text-[6px] font-mono text-stone-400 px-0.5 uppercase tracking-tighter mb-0.5"><span>HP</span><span>{Math.floor(merc.currentHp)}/{merc.maxHp}</span></div>
                            <div className="w-full bg-stone-950 h-1 rounded-full overflow-hidden border border-white/5"><div className={`h-full transition-all duration-500 ${hpPer < 30 ? 'bg-red-600 animate-pulse' : 'bg-red-500'}`} style={{ width: `${hpPer}%` }} /></div>
                        </div>
                    );
                })}
            </div>

            {/* Character Sprite Overlay */}
            {rescueStep === 'DIALOGUE' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-end pointer-events-none pb-0 animate-in fade-in zoom-in-95 duration-700">
                    <div className="relative h-[65dvh] md:h-[85dvh] flex justify-center bottom-[20dvh] md:bottom-[10dvh]"><img src={getAssetUrl('tily_footloose.png')} alt="Rescued Survivor" className="h-full w-auto object-contain object-bottom filter drop-shadow-[0_0_50px_rgba(0,0,0,1)]" /></div>
                </div>
            )}

            {/* Top Info Bar */}
            <div className="relative p-2 md:p-4 bg-stone-950/20 backdrop-blur-md border-b border-white/10 flex justify-between items-center shrink-0 z-50 gap-2">
                <div className="flex items-center gap-2 md:gap-4 min-w-0"><div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all ${session.hasKey ? 'bg-amber-900/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse' : 'bg-stone-950/50 border-stone-800'}`}><Key className={`w-5 h-5 md:w-7 md:h-7 ${session.hasKey ? 'text-amber-400' : 'text-stone-600'}`} /></div><div className="min-w-0"><h2 className="text-stone-100 font-black uppercase text-xs md:text-lg leading-none drop-shadow-md truncate">{dungeon.name}</h2><div className="flex items-center gap-2 mt-1"><div className="flex items-center gap-1 bg-stone-950/60 px-1.5 py-0.5 rounded border border-white/5 shrink-0"><Zap className="w-2.5 h-2.5 text-blue-500" /><span className="text-[8px] md:text-[10px] font-mono font-bold text-blue-400 uppercase tracking-tighter">{Math.floor(avgEnergy)}%</span></div>{session.goldCollected > 0 && <div className="flex items-center gap-1 bg-amber-900/40 px-1.5 py-0.5 rounded border border-amber-600/30 shrink-0"><Coins className="w-2.5 h-2.5 text-amber-400" /><span className="text-[8px] md:text-[10px] font-mono font-bold text-amber-200 uppercase tracking-tighter">+{session.goldCollected}</span></div>}</div></div></div>
                <div className="flex items-center gap-1 md:gap-2 shrink-0"><button onClick={() => !session.isBossDefeated && setShowAbortConfirm(true)} disabled={session.isBossDefeated} className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 rounded-lg text-red-400 font-bold text-[9px] md:text-[10px] transition-all backdrop-blur-md ${session.isBossDefeated ? 'opacity-30 cursor-not-allowed' : ''}`}><LogOut className="w-3 h-3 md:w-3.5 md:h-3.5" /> <span className="hidden xs:inline">Abort</span></button><button onClick={handleClose} disabled={showResultPopup} className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-stone-800/60 hover:bg-stone-700/80 border border-white/10 rounded-lg text-stone-200 font-bold text-[9px] md:text-xs transition-all backdrop-blur-md ${showResultPopup ? 'opacity-30 cursor-not-allowed' : ''}`}><X className="w-3 h-3 md:w-4 md:h-4" /> <span>Pause</span></button></div>
            </div>

            {/* Bottom Interaction Unit: D-Pad (Right Aligned) + Dialogue */}
            <div className="absolute bottom-0 left-0 right-0 z-40 px-[2%] pb-[2%] flex flex-col items-end pointer-events-none">
                
                {/* D-Pad Navigation - Positioned above dialogue, right-aligned, dynamic size */}
                <div className={`mb-4 transition-all duration-500 pointer-events-auto ${showResultPopup || rescueStep === 'DIALOGUE' ? 'opacity-0 scale-90 translate-y-4 pointer-events-none' : 'opacity-100 scale-100 translate-y-0'}`}>
                    <div className="grid grid-cols-3 gap-1 md:gap-2 p-2 bg-stone-900/40 backdrop-blur-md rounded-[1.5rem] border border-white/5 shadow-2xl shadow-black/50" style={{ width: '15vmin', height: '15vmin', minWidth: '100px', minHeight: '100px' }}>
                        <div />
                        <NavButton direction="North" dx={0} dy={-1} disabled={session.playerPos.y <= 0} Icon={ChevronUp} />
                        <div />
                        
                        <NavButton direction="West" dx={-1} dy={0} disabled={session.playerPos.x <= 0} Icon={ChevronLeft} />
                        <div className="flex items-center justify-center">
                            <button 
                                onClick={toggleCameraMode} 
                                className={`w-full h-full rounded-lg border flex flex-col items-center justify-center transition-all ${cameraMode !== 'FREE' ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-stone-800/40 border-stone-700 text-stone-500'}`}
                                title={getCameraTitle()}
                            >
                                {getCameraIcon()}
                                <span className="text-[5px] md:text-[6px] font-black uppercase mt-0.5">{cameraMode === 'LOCKED' ? 'Lock' : cameraMode === 'ADAPTIVE' ? 'Adapt' : 'Free'}</span>
                            </button>
                        </div>
                        <NavButton direction="East" dx={1} dy={0} disabled={session.playerPos.x >= dungeon.gridWidth - 1} Icon={ChevronRight} />
                        
                        <div />
                        <NavButton direction="South" dx={0} dy={1} disabled={session.playerPos.y >= dungeon.gridHeight - 1} Icon={ChevronDown} />
                        <div />
                    </div>
                </div>

                {/* Interaction Dialogue Box - Spans full width */}
                <div className="w-full pointer-events-auto">
                    <DialogueBox 
                        speaker={speakerName} 
                        text={tacticalDialogue} 
                        options={showResultPopup ? [] : (interactionOptions as any)} 
                    />
                </div>
            </div>

            {/* Modals */}
            <ConfirmationModal isOpen={showAbortConfirm} title="Abandon Assault?" message="Retreating via system override will forfeit all progress in this floor. All spent energy will not be recovered." confirmLabel="Confirm Retreat" cancelLabel="Stay Focused" isDanger={true} onConfirm={handleAbort} onCancel={() => setShowAbortConfirm(false)} />
            <ConfirmationModal isOpen={showRetreatAtEntranceConfirm} title="Retreat to Forge?" message="If you leave the dungeon now without defeating the Boss, you will forfeit all loot and gold collected during this session. Do you wish to proceed?" confirmLabel="Confirm Retreat" cancelLabel="Continue Mission" isDanger={true} onConfirm={handleRetreatAtEntrance} onCancel={() => setShowRetreatAtEntranceConfirm(false)} />
            
            {showResultPopup && (
                <div className="fixed inset-0 z-[700] bg-black/90 backdrop-blur-md flex items-center justify-center px-[10%] py-[15%] animate-in fade-in duration-500 pointer-events-auto overflow-hidden">
                    <div className="bg-stone-900 border-2 border-amber-600/50 rounded-3xl w-fit max-w-[600px] h-fit max-h-full min-h-[200px] min-w-[280px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 mx-auto">
                        <div className="bg-amber-600 p-4 md:p-6 flex flex-col items-center text-center text-white shrink-0">
                            <Trophy className="w-8 h-8 md:w-12 md:h-12 mb-1 md:mb-2 animate-bounce" />
                            <h2 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase font-serif leading-none px-4">Objective Complete!</h2>
                            <p className="text-amber-100 text-[8px] md:text-[10px] font-black uppercase tracking-widest mt-1 px-6">Mission Summary</p>
                        </div>
                        <div className="p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-2">
                                <h3 className="text-[8px] md:text-[10px] font-black text-stone-500 uppercase tracking-widest text-center">Treasury Secured</h3>
                                <div className="bg-stone-950 p-3 md:p-4 rounded-2xl border border-stone-800 flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-2 text-stone-400 font-mono text-xs md:text-sm"><span>Base: {dungeon.goldReward}G</span><span>+</span><span className="text-amber-400">Bonus: {session.goldCollected}G</span></div>
                                    <div className="flex items-center gap-2 mt-1"><Coins className="w-5 h-5 md:w-6 md:h-6 text-amber-500" /><span className="text-xl md:text-3xl font-black font-mono text-stone-100">{dungeon.goldReward! + session.goldCollected} G</span></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-[8px] md:text-[10px] font-black text-stone-500 uppercase tracking-widest text-center">Yield Projection</h3>
                                <div className="flex wrap gap-2 justify-center">{dungeon.rewards.map((r, i) => (<div key={i} className="w-8 h-8 md:w-10 md:h-10 bg-stone-850 border border-stone-800 rounded-lg flex items-center justify-center p-1"><img src={getAssetUrl(`${r.itemId}.png`)} className="w-full h-full object-contain" /></div>))}{session.rescuedNpcId && <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-900/30 border border-amber-600 rounded-lg flex items-center justify-center"><Sparkles className="w-5 h-5 md:w-6 md:h-6 text-amber-500" /></div>}</div>
                            </div>
                        </div>
                        <div className="p-4 md:p-6 pt-0 flex flex-col gap-2 md:gap-3 shrink-0">
                            <button onClick={handleClaimRewardsAndExit} className="w-full py-3 md:py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 border-b-4 border-emerald-800 text-[10px] md:text-base uppercase tracking-widest px-8"><Package className="w-4 h-4 md:w-5 md:h-5" />SECURE LOOT & RETURN</button>
                            <button onClick={() => setShowResultPopup(false)} className="w-full py-2.5 md:py-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] md:text-sm uppercase tracking-widest px-6"><ArrowRight className="w-4 h-4 md:w-5 md:h-5" /> KEEP EXPLORING</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssaultNavigator;
