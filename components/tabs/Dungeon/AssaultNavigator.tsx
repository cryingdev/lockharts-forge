import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Phaser from 'phaser';
import { useGame } from '../../../context/GameContext';
import { DUNGEONS } from '../../../data/dungeons';
import DungeonScene from '../../../game/DungeonScene';
import DialogueBox from '../../DialogueBox';
import { 
    Key, Zap, LogOut, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
    Skull, Shield, Sword, Sparkles, Users, Activity, Heart, 
    Maximize, Minimize, Plus, Minus, Move, Ghost, Settings, Layers, Wrench
} from 'lucide-react';
import ConfirmationModal from '../../modals/ConfirmationModal';
import { calculateCombatPower, calculateMercenaryPower } from '../../../utils/combatLogic';
import DungeonCombatView from './DungeonCombatView';
import { getAssetUrl } from '../../../utils';
import { AnimatedMercenary } from '../../common/ui/AnimatedMercenary';
import { MercenaryPortrait } from '../../common/ui/MercenaryPortrait';
import { TILLY_FOOTLOOSE } from '../../../data/mercenaries';
import { MercenaryDetailModal } from '../../modals/MercenaryDetailModal';
import { EquipmentSlotType } from '../../../types/inventory';

// Memoized to prevent re-renders during D-pad dragging
const SquadPanel = React.memo(({ party, onSelectMercenary }: { party: any[], onSelectMercenary: (id: string) => void }) => {
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
                    const hasPoints = (merc.bonusStatPoints || 0) > 0;

                    return (
                        <div 
                            key={merc.id} 
                            onClick={() => onSelectMercenary(merc.id)}
                            className="bg-stone-900/90 backdrop-blur-xl border border-white/5 p-2 rounded-xl shadow-xl flex flex-col gap-1.5 cursor-pointer hover:bg-stone-800 hover:border-amber-500/30 transition-all group active:scale-[0.98] ${merc.status === 'DEAD' ? 'opacity-40 grayscale' : ''}"
                        >
                            {/* Header: Portrait, Name, Energy */}
                            <div className="flex justify-between items-center px-0.5 border-b border-white/5 pb-1 mb-0.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="relative">
                                        <MercenaryPortrait mercenary={merc} className="w-5 h-5 rounded-md border border-white/10 shrink-0" />
                                        {hasPoints && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border border-stone-900 animate-pulse" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-black text-stone-200 truncate uppercase tracking-tighter group-hover:text-amber-400 transition-colors ${isLowHp ? 'text-red-400 animate-pulse' : ''}`}>{merc.name.split(' ')[0]}</span>
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
                            <div className="space-y-0.5 relative">
                                <div className="flex justify-between items-center text-[7px] font-mono text-stone-500 px-0.5 leading-none">
                                    <span>MP</span>
                                    <span className="font-black text-stone-300">{Math.floor(merc.currentMp)}</span>
                                </div>
                                <div className="h-1 w-full bg-stone-950 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${mpPer}%` }} />
                                </div>
                                <Wrench className="absolute -bottom-1 -right-1 w-2 h-2 text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

const AssaultNavigator = () => {
    const { state, actions } = useGame();
    const session = state.activeManualDungeon;
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [showRetreatConfirm, setShowRetreatConfirm] = useState(false);
    const [lastMsg, setLastMsg] = useState("");
    const [inspectedMercId, setInspectedMercId] = useState<string | null>(null);

    // --- D-pad & Camera Zoom State ---
    const [dpadTransform, setDpadTransform] = useState(() => {
        const saved = localStorage.getItem('dpad_transform_v2'); 
        let parsed = saved ? JSON.parse(saved) : { x: 0, y: 0, scale: 0.8, opacity: 1.0 };
        if (parsed.scale > 1.2) parsed.scale = 1.2;
        if (parsed.scale < 0.4) parsed.scale = 0.4;
        if (parsed.opacity === undefined) parsed.opacity = 1.0;
        return parsed;
    });
    const [isDraggingDpad, setIsDraggingDpad] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [mapZoom, setMapZoom] = useState(1.0);
    const [showDpadMenu, setShowDpadMenu] = useState(false);

    const rafRef = useRef<number | null>(null);

    const dungeon = session ? DUNGEONS.find(d => d.id === session.dungeonId) : null;
    const party = useMemo(() => {
        if (!session) return [];
        return state.knownMercenaries.filter(m => session.partyIds.includes(m.id));
    }, [session?.partyIds, state.knownMercenaries]);
    
    const isEncountered = session?.encounterStatus === 'ENCOUNTERED';
    const isBattle = session?.encounterStatus === 'BATTLE';
    const isStairs = session?.encounterStatus === 'STAIRS';
    const currentRoom = session ? session.grid[session.playerPos.y][session.playerPos.x] : null;

    useEffect(() => {
        if (session?.lastActionMessage) {
            setLastMsg(session.lastActionMessage);
        }
    }, [session?.lastActionMessage]);

    useEffect(() => {
        if (!session) return;
        if (currentRoom === 'NPC' && !session.npcFound) {
            setLastMsg(`"Help! Please... is someone there? The rats... they're everywhere..."`);
        }
    }, [currentRoom, session?.npcFound]);

    const handleDpadMove = (dx: number, dy: number) => {
        if (isEncountered || isBattle || isStairs) return;
        const scene = gameRef.current?.scene.getScene('DungeonScene') as DungeonScene;
        if (scene) scene.move(dx, dy);
    };

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDraggingDpad(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setDragStart({ x: clientX - dpadTransform.x, y: clientY - dpadTransform.y });
    };

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDraggingDpad) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            setDpadTransform((prev: any) => {
                const nextX = clientX - dragStart.x;
                const nextY = clientY - dragStart.y;
                return { ...prev, x: nextX, y: nextY };
            });
            rafRef.current = null;
        });
    }, [isDraggingDpad, dragStart.x, dragStart.y]);

    const handleDragEnd = useCallback(() => {
        if (isDraggingDpad) {
            setIsDraggingDpad(false);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            localStorage.setItem('dpad_transform_v2', JSON.stringify(dpadTransform));
        }
    }, [isDraggingDpad, dpadTransform]);

    useEffect(() => {
        if (isDraggingDpad) {
            window.addEventListener('mousemove', handleDragMove, { passive: true });
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: true });
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDraggingDpad, handleDragMove, handleDragEnd]);

    const cycleDpadScale = () => {
        setDpadTransform((prev: any) => {
            let nextScale = prev.scale + 0.2;
            if (nextScale > 1.25) nextScale = 0.4;
            const next = { ...prev, scale: parseFloat(nextScale.toFixed(1)) };
            localStorage.setItem('dpad_transform_v2', JSON.stringify(next));
            return next;
        });
    };

    const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setDpadTransform((prev: any) => {
            const next = { ...prev, opacity: val };
            localStorage.setItem('dpad_transform_v2', JSON.stringify(next));
            return next;
        });
    };

    const handleZoom = (delta: number) => {
        const nextZoom = Math.min(1.5, Math.max(0.5, mapZoom + delta));
        setMapZoom(nextZoom);
        const scene = gameRef.current?.scene.getScene('DungeonScene') as DungeonScene;
        if (scene) scene.updateZoom(nextZoom);
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
            game.scene.start('DungeonScene', { 
                session, 
                onMove: (dx: number, dy: number) => actions.moveInManualDungeon(dx, dy),
                initialZoom: mapZoom 
            });
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
    const inspectedMercenary = state.knownMercenaries.find(m => m.id === inspectedMercId) || null;

    return (
        <div className="absolute inset-0 z-[100] bg-stone-950 flex flex-col animate-in fade-in duration-500 overflow-hidden">
            <div ref={containerRef} className={`absolute inset-0 z-0 transition-opacity ${isBattle ? 'opacity-20 blur-md' : 'opacity-100'}`} />
            
            {!isBattle && <SquadPanel party={party} onSelectMercenary={(id) => setInspectedMercId(id)} />}

            {/* Top Center: Floor Display */}
            {!isBattle && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3 px-4 py-2 bg-stone-900/90 backdrop-blur-md border border-amber-500/30 rounded-2xl shadow-2xl">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span className="text-xs md:text-sm font-black text-amber-50 uppercase tracking-widest font-mono">
                        Floor {session.currentFloor} / {session.maxFloors}
                    </span>
                </div>
            )}

            {/* Top Right: Zoom & Key Controls */}
            <div className="absolute top-4 right-4 z-[110] flex flex-col items-end gap-2 pointer-events-auto">
                <div className={`flex items-center gap-2 px-3 py-1.5 bg-stone-900/80 backdrop-blur-md border rounded-xl shadow-xl transition-all ${session.hasKey ? 'border-amber-500 text-amber-400' : 'border-white/5 text-stone-600 opacity-40'}`}>
                    <Key className={`w-4 h-4 ${session.hasKey ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{session.hasKey ? 'Key Found' : 'No Key'}</span>
                </div>
                
                <div className="flex bg-stone-900/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    <button onClick={() => handleZoom(0.1)} className="p-2.5 hover:bg-stone-800 text-stone-300 transition-colors border-r border-white/5"><Plus className="w-4 h-4" /></button>
                    <div className="flex flex-col items-center justify-center px-2 min-w-[45px] select-none">
                        <span className="text-[8px] font-black text-stone-500 font-bold leading-none">ZOOM</span>
                        <span className="text-[10px] font-mono font-bold text-amber-500">{mapZoom.toFixed(1)}x</span>
                    </div>
                    <button onClick={() => handleZoom(-0.1)} className="p-2.5 hover:bg-stone-800 text-stone-300 transition-colors border-l border-white/5"><Minus className="w-4 h-4" /></button>
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
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-end pointer-events-none pb-20">
                    <div className="relative flex justify-center items-end w-full h-[80dvh] animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 ease-out">
                        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 blur-[80px] rounded-full -z-10 animate-pulse"></div>
                        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-48 h-10 bg-black/60 blur-2xl rounded-full -z-10"></div>
                        <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 z-0">
                            <Sparkles className="w-12 h-12 text-amber-300 opacity-40 animate-bounce" />
                        </div>
                        <AnimatedMercenary
                            mercenary={TILLY_FOOTLOOSE}
                            className="h-full w-auto filter drop-shadow-[0_0_50px_rgba(245,158,11,0.5)] transition-all duration-500 relative z-10"
                        />
                    </div>
                </div>
            )}

            {isBattle && (
                <DungeonCombatView 
                    session={session} party={party} enemies={session.enemies || []} fleeChance={50}
                    onFinish={(win, final) => actions.resolveCombatManual(win, false, final)}
                    onFlee={(final) => actions.resolveCombatManual(false, true, final)}
                />
            )}

            {!isBattle && (
                <>
                    {/* Draggable D-pad Container */}
                    {!isOnNPCTile && (
                        <div 
                            className={`pointer-events-auto transition-all z-[200] select-none ${isDraggingDpad ? 'shadow-glow-amber cursor-grabbing' : 'cursor-default'}`}
                            style={{
                                position: 'absolute',
                                bottom: 'calc(22dvh + 32px)',
                                right: 16,
                                transform: `translate3d(${dpadTransform.x}px, ${dpadTransform.y}px, 0) scale(${dpadTransform.scale})`,
                                opacity: dpadTransform.opacity,
                                transformOrigin: 'bottom right',
                                willChange: 'transform'
                            }}
                        >
                            <div className="grid grid-cols-3 gap-2 bg-stone-900/90 backdrop-blur-xl p-3 rounded-3xl border border-white/10 shadow-2xl relative">
                                
                                {showDpadMenu && (
                                    <div className="absolute -top-12 right-0 flex items-center gap-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center gap-2 bg-stone-900/80 border border-white/10 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
                                            <Ghost className="w-3.5 h-3.5 text-stone-500" />
                                            <input 
                                                type="range" min="0.1" max="1.0" step="0.1"
                                                value={dpadTransform.opacity}
                                                onChange={handleOpacityChange}
                                                className="w-16 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                            />
                                            <span className="text-[8px] font-mono font-bold text-stone-400 w-6">{Math.round(dpadTransform.opacity * 100)}%</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div 
                                                onMouseDown={handleDragStart} onTouchStart={handleDragStart}
                                                className="w-9 h-9 bg-stone-800 border border-white/20 rounded-full flex items-center justify-center text-blue-400 cursor-grab active:cursor-grabbing hover:bg-stone-700 transition-all shadow-lg active:scale-95"
                                            >
                                                <Move className="w-4 h-4" />
                                            </div>
                                            <button 
                                                onClick={cycleDpadScale}
                                                className="w-9 h-9 bg-stone-800 border border-white/20 rounded-full flex items-center justify-center text-stone-300 hover:text-white transition-all shadow-lg active:scale-90"
                                            >
                                                {dpadTransform.scale >= 1.2 ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div />
                                <button onClick={() => handleDpadMove(0,-1)} className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center text-white active:bg-stone-700 shadow-lg"><ChevronUp /></button>
                                
                                <button 
                                    onClick={() => setShowDpadMenu(!showDpadMenu)}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${showDpadMenu ? 'bg-amber-600 text-white shadow-glow-amber' : 'bg-stone-800 text-stone-500 hover:text-stone-300'}`}
                                >
                                    <Settings className={`w-6 h-6 ${showDpadMenu ? 'animate-spin-slow' : ''}`} />
                                </button>

                                <button onClick={() => handleDpadMove(-1,0)} className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center text-white active:bg-stone-700 shadow-lg"><ChevronLeft /></button>
                                
                                <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-400/40">
                                    <Zap className="w-6 h-6" />
                                </div>

                                <button onClick={() => handleDpadMove(1,0)} className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center text-white active:bg-stone-700 shadow-lg"><ChevronRight /></button>
                                
                                <div />
                                <button onClick={() => handleDpadMove(0,1)} className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center text-white active:bg-stone-700 shadow-lg"><ChevronDown /></button>
                                <div />
                            </div>
                        </div>
                    )}

                    {/* Bottom dialogue box container */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[95vw] max-w-5xl z-50 pointer-events-none">
                        <div className="flex flex-col items-end gap-4 relative">
                            <DialogueBox 
                                speaker={isOnNPCTile ? "Tilly Footloose" : isEncountered ? "Tactical AI" : isStairs ? "Navigation System" : "Comms Link"}
                                speakerAvatar={isOnNPCTile ? getAssetUrl(TILLY_FOOTLOOSE.profileImage || 'tilly_footloose.png') : undefined}
                                text={lastMsg}
                                options={isOnNPCTile ? [
                                    { label: "RESCUE SURVIVOR", action: () => { actions.rescueMercenary('tilly_footloose'); actions.showToast("Tilly Footloose has been secured!"); }, variant: 'primary' },
                                    { label: "LEAVE FOR NOW", action: () => setLastMsg("Sector marked for later extraction. Resuming scan."), variant: 'neutral' }
                                ] : isEncountered ? [
                                    { label: "ENGAGE TARGET", action: () => actions.startCombatManual(), variant: 'primary' },
                                    { label: "RETREAT", action: () => setShowRetreatConfirm(true), variant: 'neutral' }
                                ] : isStairs ? [
                                    { label: `DESCEND TO FLOOR ${session.currentFloor + 1}`, action: () => actions.proceedToNextFloorManual(), variant: 'primary' },
                                    { label: "FINISH & EXTRACT", action: () => actions.finishManualAssault(), variant: 'primary' },
                                    { label: "STAY HERE", action: () => actions.resolveCombatManual(false, true, party), variant: 'neutral' }
                                ] : currentRoom === 'ENTRANCE' && session.isBossDefeated ? [
                                    { label: "FINISH MISSION", action: () => actions.finishManualAssault(), variant: 'primary' }
                                ] : []}
                                className="w-full pointer-events-auto"
                            />
                        </div>
                    </div>
                </>
            )}

            {inspectedMercenary && (
                <MercenaryDetailModal 
                    mercenary={inspectedMercenary}
                    onClose={() => setInspectedMercId(null)}
                    onUnequip={(mercId, slot) => actions.unequipItem(mercId, slot)}
                    isReadOnly={false} 
                />
            )}

            {/* Comment: Replaced undefined showRecallConfirm with showRetreatConfirm as defined on line 132 */}
            <ConfirmationModal isOpen={showRetreatConfirm} title="Abort Mission?" message="Extraction will return the squad to safety. No rewards will be collected." onConfirm={() => actions.retreatFromManualDungeon()} onCancel={() => setShowRetreatConfirm(false)} isDanger={true} />
        </div>
    );
};

export default AssaultNavigator;