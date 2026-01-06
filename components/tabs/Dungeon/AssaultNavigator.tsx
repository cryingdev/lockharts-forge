
import React, { useEffect, useRef, useState, useMemo } from 'react';
import Phaser from 'phaser';
import { useGame } from '../../../context/GameContext';
import { DUNGEONS } from '../../../data/dungeons';
import DungeonScene from '../../../game/DungeonScene';
import DialogueBox from '../../DialogueBox';
import { 
    Key, Zap, LogOut, X, Save, Trophy
} from 'lucide-react';
import ConfirmationModal from '../../modals/ConfirmationModal';

const AssaultNavigator = () => {
    const { state, actions } = useGame();
    const session = state.activeManualDungeon;
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [showAbortConfirm, setShowAbortConfirm] = useState(false);
    const [isEnding, setIsEnding] = useState(false);

    if (!session) return null;

    const dungeon = DUNGEONS.find(d => d.id === session.dungeonId);
    if (!dungeon) return null;

    const party = state.knownMercenaries.filter(m => session.partyIds.includes(m.id));
    const avgEnergy = party.reduce((sum, m) => sum + (m.expeditionEnergy || 0), 0) / (party.length || 1);

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
        if (!isReady || !containerRef.current) return;

        if (!gameRef.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: containerRef.current,
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
                backgroundColor: 'transparent',
                transparent: true,
                scene: [DungeonScene],
                scale: {
                    mode: Phaser.Scale.RESIZE,
                    autoCenter: Phaser.Scale.CENTER_BOTH
                }
            };

            const game = new Phaser.Game(config);
            gameRef.current = game;

            game.scene.start('DungeonScene', {
                session,
                moveEnergy: dungeon.moveEnergy,
                bossEnergy: dungeon.bossEnergy,
                onMove: (dx: number, dy: number) => {
                    actions.moveInManualDungeon(dx, dy);
                }
            });
        } else {
            const scene = gameRef.current.scene.getScene('DungeonScene') as DungeonScene;
            if (scene) scene.updateSession(session);
        }
    }, [isReady, session, actions, dungeon.moveEnergy, dungeon.bossEnergy]);

    // 보스방 도달 체크 (자동 종료 제거, isEnding 상태만 활성화)
    useEffect(() => {
        if (isEnding) return;
        const { x, y } = session.playerPos;
        const currentRoom = session.grid[y][x];

        if (currentRoom === 'BOSS') {
            setIsEnding(true);
        }
    }, [session.playerPos, session.grid, isEnding]);

    useEffect(() => {
        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    const handleDpadMove = (dx: number, dy: number) => {
        if (isEnding) return;
        const scene = gameRef.current?.scene.getScene('DungeonScene') as DungeonScene;
        if (scene) scene.move(dx, dy);
    };

    const handleClose = () => {
        if (isEnding) return;
        actions.toggleManualDungeonOverlay(false);
    };

    const handleAbort = () => {
        actions.retreatFromManualDungeon();
        setShowAbortConfirm(false);
    };

    const navOptions = useMemo(() => [
        { 
            label: "North", 
            action: () => handleDpadMove(0, -1), 
            disabled: session.playerPos.y <= 0 
        },
        { 
            label: "South", 
            action: () => handleDpadMove(0, 1), 
            disabled: session.playerPos.y >= dungeon.gridHeight - 1 
        },
        { 
            label: "West", 
            action: () => handleDpadMove(-1, 0), 
            disabled: session.playerPos.x <= 0 
        },
        { 
            label: "East", 
            action: () => handleDpadMove(1, 0), 
            disabled: session.playerPos.x >= dungeon.gridWidth - 1 
        },
    ], [session.playerPos, dungeon, isEnding]);

    const tacticalDialogue = useMemo(() => {
        if (isEnding) return "Area secured. Threat neutralized. Preparing for tactical extraction and loot inventory...";
        if (avgEnergy < 20) return "Squad fatigue is critical. We must secure the objective and extract immediately.";
        if (session.hasKey) return "Boss Room key secured. All units, move to eliminate the target.";
        return "Tactical scan complete. Move through the shadows to locate the inner sanctum.";
    }, [avgEnergy, session.hasKey, isEnding]);

    return (
        <div className="absolute inset-0 z-[100] bg-stone-950 flex flex-col animate-in fade-in duration-500 overflow-hidden">
            
            {/* Phaser Viewport - Fullscreen Backdrop */}
            <div ref={containerRef} className="absolute inset-0 z-0" />

            {/* Top Bar - Improved Responsive Layout */}
            <div className="relative p-2 md:p-4 bg-stone-950/20 backdrop-blur-md border-b border-white/10 flex justify-between items-center shrink-0 z-50 gap-2">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all ${session.hasKey ? 'bg-amber-900/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse' : 'bg-stone-950/50 border-stone-800'}`}>
                        <Key className={`w-5 h-5 md:w-7 md:h-7 ${session.hasKey ? 'text-amber-400' : 'text-stone-600'}`} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-stone-100 font-black uppercase text-xs md:text-lg leading-none drop-shadow-md truncate">{dungeon.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                             <div className="flex items-center gap-1 bg-stone-950/60 px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                                <Zap className="w-2.5 h-2.5 text-blue-500" />
                                <span className="text-[8px] md:text-[10px] font-mono font-bold text-blue-400 uppercase tracking-tighter">{Math.floor(avgEnergy)}%</span>
                             </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                    <button 
                        onClick={() => !isEnding && setShowAbortConfirm(true)}
                        disabled={isEnding}
                        className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 rounded-lg text-red-400 font-bold text-[9px] md:text-[10px] transition-all backdrop-blur-md ${isEnding ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        <LogOut className="w-3 h-3 md:w-3.5 md:h-3.5" /> <span className="hidden xs:inline">Abort</span>
                    </button>
                    <button 
                        onClick={handleClose}
                        disabled={isEnding}
                        className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-stone-800/60 hover:bg-stone-700/80 border border-white/10 rounded-lg text-stone-200 font-bold text-[9px] md:text-xs transition-all backdrop-blur-md ${isEnding ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        <X className="w-3 h-3 md:w-4 md:h-4" /> <span>Pause</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 pointer-events-none" />

            <div className="relative z-40">
                <DialogueBox 
                    speaker={isEnding ? "Tactical AI" : "Tactical Link"}
                    text={tacticalDialogue}
                    options={isEnding ? [] : (navOptions as any)}
                />
            </div>

            <ConfirmationModal 
                isOpen={showAbortConfirm}
                title="Abandon Assault?"
                message="Retreating will forfeit all progress in this floor. All spent energy will not be recovered."
                confirmLabel="Confirm Retreat"
                cancelLabel="Stay Focused"
                isDanger={true}
                onConfirm={handleAbort}
                onCancel={() => setShowAbortConfirm(false)}
            />

            {/* 승리 오버레이 - 터치 상호작용 추가 */}
            {isEnding && (
                <div 
                    className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-500 pointer-events-auto cursor-pointer"
                    onClick={actions.finishManualAssault}
                >
                    <div className="bg-amber-600 text-white px-8 py-4 rounded-2xl shadow-[0_0_50px_rgba(217,119,6,0.6)] animate-in zoom-in-95 duration-300 flex items-center gap-3 mb-4">
                        <Trophy className="w-8 h-8 text-white animate-bounce" />
                        <span className="text-2xl font-black italic tracking-tighter uppercase">Objective Complete!</span>
                    </div>
                    <div className="text-amber-200/60 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] animate-pulse">
                        Touch to Claim Rewards
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssaultNavigator;
