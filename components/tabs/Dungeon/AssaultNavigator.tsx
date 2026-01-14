
import React, { useEffect, useRef, useState, useMemo } from 'react';
import Phaser from 'phaser';
import { useGame } from '../../../context/GameContext';
import { DUNGEONS } from '../../../data/dungeons';
import DungeonScene from '../../../game/DungeonScene';
import DialogueBox from '../../DialogueBox';
import { Key, Zap, LogOut, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Skull, Shield, Sword, Sparkles, Users, Activity, Heart } from 'lucide-react';
import ConfirmationModal from '../../modals/ConfirmationModal';
import { calculateCombatPower, calculateMercenaryPower } from '../../../utils/combatLogic';
import DungeonCombatView from './DungeonCombatView';
import { getAssetUrl } from '../../../utils';

const SquadPanel = ({ party }: { party: any[] }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="absolute top-4 left-4 z-[110] flex flex-col gap-2 pointer-events-auto max-w-[180px] md:max-w-[240px]">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 px-3 py-2 bg-stone-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl text-stone-300 hover:text-amber-400 transition-all w-fit group"
            >
                <Users className={`w-4 h-4 ${isExpanded ? 'text-amber-500' : 'text-stone-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden xs:block">Squad Status</span>
                {isExpanded ? <ChevronUp className="w-3 h-3 opacity-50" /> : <ChevronDown className="w-3 h-3 opacity-50" />}
            </button>

            <div className={`flex flex-col gap-1.5 transition-all duration-300 origin-top ${isExpanded ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 h-0 pointer-events-none'}`}>
                {party.map((merc) => {
                    const hpPer = (merc.currentHp / merc.maxHp) * 100;
                    const mpPer = (merc.currentMp / (merc.maxMp || 1)) * 100;
                    const enPer = (merc.expeditionEnergy || 0);
                    const isLowHp = hpPer < 30;

                    return (
                        <div key={merc.id} className="bg-stone-900/90 backdrop-blur-xl border border-white/5 p-2 rounded-xl shadow-xl flex flex-col gap-1.5">
                            {/* Header: Icon, Name, Energy */}
                            <div className="flex justify-between items-center px-0.5 border-b border-white/5 pb-1 mb-0.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-sm shrink-0">{merc.icon}</span>
                                    <span className={`text-[10px] font-black text-stone-200 truncate uppercase tracking-tighter ${isLowHp ? 'text-red-400 animate-pulse' : ''}`}>{merc.name.split(' ')[0]}</span>
                                </div>
                                <div className="flex items-center gap-1 bg-black/40 px-1 rounded border border-white/5 shrink-0">
                                    <Zap className={`w-2 h-2 ${enPer < 20 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} />
                                    <span className="text-[8px] font-mono font-bold text-stone-400">{Math.floor(enPer)}</span>
                                </div>
                            </div>

                            {/* Vitals: HP */}
                            <div className="space-y-0.5">
                                <div className="flex justify-between items-center text-[7px] font-mono text-stone-500 px-0.5 leading-none">
                                    <span>HP</span>
                                    <span className="font-black text-stone-300">{Math.floor(merc.currentHp)}</span>
                                </div>
                                <div className="h-1 w-full bg-stone-950 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className={`h-full transition-all duration-500 ${isLowHp ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-red-600'}`} 
                                        style={{ width: `${hpPer}%` }} 
                                    />
                                </div>
                            </div>

                            {/* Vitals: MP */}
                            <div className="space-y-0.5">
                                <div className="flex justify-between items-center text-[7px] font-mono text-stone-500 px-0.5 leading-none">
                                    <span>MP</span>
                                    <span className="font-black text-stone-300">{Math.floor(merc.currentMp)}</span>
                                </div>
                                <div className="h-1 w-full bg-stone-950 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${mpPer}%` }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AssaultNavigator = () => {
    const { state, actions } = useGame();
    const session = state.activeManualDungeon;
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [showRetreatConfirm, setShowRetreatConfirm] = useState(false);
    const [lastMsg, setLastMsg] = useState("");

    const dungeon = session ? DUNGEONS.find(d => d.id === session.dungeonId) : null;
    const party = useMemo(() => {
        if (!session) return [];
        return state.knownMercenaries.filter(m => session.partyIds.includes(m.id));
    }, [session?.partyIds, state.knownMercenaries]);
    
    const isEncountered = session?.encounterStatus === 'ENCOUNTERED';
    const isBattle = session?.encounterStatus === 'BATTLE';
    const currentRoom = session ? session.grid[session.playerPos.y][session.playerPos.x] : null;

    useEffect(() => {
        if (!session) return;
        if (session.encounterStatus === 'ENCOUNTERED') {
            setLastMsg(`CRITICAL ALERT: Hostile boss detected. Combat systems engaging...`);
        } else if (currentRoom === 'NPC' && !session.npcFound) {
            setLastMsg(`"Help! Please... is someone there? The rats... they're everywhere..."`);
        } else if (session.encounterStatus === 'VICTORY') {
            setLastMsg(`Sector neutralized. Extraction point is clear. Prepare to return.`);
        } else if (lastMsg === "") {
            setLastMsg(`Scanning sector... Vital signs stable.`);
        }
    }, [session?.encounterStatus, currentRoom]);

    const handleDpadMove = (dx: number, dy: number) => {
        if (isEncountered || isBattle) return;
        const scene = gameRef.current?.scene.getScene('DungeonScene') as DungeonScene;
        if (scene) scene.move(dx, dy);
    };

    useEffect(() => {
        if (!isReady || !containerRef.current || !session || !dungeon) return;
        if (!gameRef.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO, parent: containerRef.current, width: containerRef.current.clientWidth, height: containerRef.current.clientHeight, backgroundColor: 'transparent', transparent: true, scene: [DungeonScene],
                scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
            };
            const game = new Phaser.Game(config);
            gameRef.current = game;
            game.scene.start('DungeonScene', { session, onMove: (dx: number, dy: number) => actions.moveInManualDungeon(dx, dy) });
        } else {
            const scene = gameRef.current.scene.getScene('DungeonScene') as DungeonScene;
            if (scene) scene.updateSession(session);
        }
    }, [isReady, session, actions, dungeon]);

    useEffect(() => {
        const check = () => { if (containerRef.current?.clientWidth) setIsReady(true); else requestAnimationFrame(check); };
        check();
    }, []);

    if (!session || !dungeon) return null;

    const isOnNPCTile = currentRoom === 'NPC' && !session.npcFound;

    return (
        <div className="absolute inset-0 z-[100] bg-stone-950 flex flex-col animate-in fade-in duration-500 overflow-hidden">
            <div ref={containerRef} className={`absolute inset-0 z-0 transition-opacity ${isBattle ? 'opacity-20 blur-md' : 'opacity-100'}`} />
            
            {/* Squad Info Recovery */}
            {!isBattle && <SquadPanel party={party} />}

            {/* Top Right: Key & Retreat Indicator */}
            <div className="absolute top-4 right-4 z-[110] flex flex-col items-end gap-2 pointer-events-auto">
                <div className={`flex items-center gap-2 px-3 py-1.5 bg-stone-900/80 backdrop-blur-md border rounded-xl shadow-xl transition-all ${session.hasKey ? 'border-amber-500 text-amber-400' : 'border-white/5 text-stone-600 opacity-40'}`}>
                    <Key className={`w-4 h-4 ${session.hasKey ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{session.hasKey ? 'Key Found' : 'No Key'}</span>
                </div>
                <button 
                    onClick={() => setShowRetreatConfirm(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-900/30 rounded-xl text-red-500 font-bold text-[10px] uppercase tracking-widest transition-all shadow-xl"
                >
                    <LogOut className="w-4 h-4" /> Retreat
                </button>
            </div>

            {/* NPC Discovery Scene */}
            {isOnNPCTile && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pointer-events-none pb-20">
                    <div className="relative flex justify-center items-end w-full animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 ease-out">
                        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 blur-[80px] rounded-full -z-10 animate-pulse"></div>
                        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-48 h-10 bg-black/60 blur-2xl rounded-full -z-10"></div>
                        <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 z-0">
                            <Sparkles className="w-12 h-12 text-amber-300 opacity-40 animate-bounce" />
                        </div>
                        <img 
                            src={getAssetUrl('tily_footloose.png')} 
                            alt="Survivor"
                            className="h-[60dvh] md:h-[75dvh] w-auto object-contain object-bottom filter drop-shadow-[0_0_50px_rgba(245,158,11,0.5)] transition-all duration-500"
                        />
                    </div>
                </div>
            )}

            {isBattle && (
                <DungeonCombatView 
                    session={session} party={party} boss={session.bossEntity!} fleeChance={50}
                    onFinish={(win, final) => actions.resolveCombatManual(win, false, final)}
                    onFlee={(final) => actions.resolveCombatManual(false, true, final)}
                />
            )}

            {!isBattle && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[95vw] max-w-5xl z-50 pointer-events-none">
                    <div className="flex flex-col items-end gap-4">
                        {!isOnNPCTile && (
                            <div className="pointer-events-auto transition-all scale-90 sm:scale-100">
                                <div className="grid grid-cols-3 gap-2 bg-stone-900/60 backdrop-blur-xl p-3 rounded-3xl border border-white/10 shadow-2xl">
                                    <div /><button onClick={() => handleDpadMove(0,-1)} className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center text-white active:bg-stone-700"><ChevronUp /></button><div />
                                    <button onClick={() => handleDpadMove(-1,0)} className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center text-white active:bg-stone-700"><ChevronLeft /></button>
                                    <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-400"><Zap className="w-6 h-6" /></div>
                                    <button onClick={() => handleDpadMove(1,0)} className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center text-white active:bg-stone-700"><ChevronRight /></button>
                                    <div /><button onClick={() => handleDpadMove(0,1)} className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center text-white active:bg-stone-700"><ChevronDown /></button><div />
                                </div>
                            </div>
                        )}
                        
                        <DialogueBox 
                            speaker={isOnNPCTile ? "Tilly Footloose" : isEncountered ? "Tactical AI" : "Comms Link"}
                            speakerAvatar={isOnNPCTile ? getAssetUrl('tily_footloose.png') : undefined}
                            text={lastMsg}
                            options={isOnNPCTile ? [
                                { label: "RESCUE SURVIVOR", action: () => { actions.rescueMercenary('tilly_footloose'); actions.showToast("Tilly Footloose has been secured!"); }, variant: 'primary' },
                                { label: "LEAVE FOR NOW", action: () => setLastMsg("Sector marked for later extraction. Resuming scan."), variant: 'neutral' }
                            ] : isEncountered ? [
                                { label: "ENGAGE TARGET", action: () => actions.startCombatManual(), variant: 'primary' },
                                { label: "RETREAT", action: () => setShowRetreatConfirm(true), variant: 'neutral' }
                            ] : currentRoom === 'ENTRANCE' && session.isBossDefeated ? [
                                { label: "FINISH MISSION", action: () => actions.finishManualAssault(), variant: 'primary' }
                            ] : []}
                            className="w-full pointer-events-auto"
                        />
                    </div>
                </div>
            )}

            <ConfirmationModal isOpen={showRetreatConfirm} title="Abort Mission?" message="Extraction will return the squad to safety. No rewards will be collected." onConfirm={() => actions.retreatFromManualDungeon()} onCancel={() => setShowRetreatConfirm(false)} isDanger={true} />
        </div>
    );
};

export default AssaultNavigator;
