
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useGame } from '../../../context/GameContext';
import { DUNGEONS } from '../../../data/dungeons';
import DungeonScene from '../../../game/DungeonScene';
import { 
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
    Key, Zap, LogOut
} from 'lucide-react';

const ManualDungeonOverlay = () => {
    const { state, actions } = useGame();
    const session = state.activeManualDungeon;
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

    // CRITICAL: Hooks cannot be skipped based on conditions.
    // Early returns must come AFTER hook calls.

    const dungeon = session ? DUNGEONS.find(d => d.id === session.dungeonId) : null;
    const party = session ? state.knownMercenaries.filter(m => session.partyIds.includes(m.id)) : [];
    const avgEnergy = party.length > 0 ? party.reduce((sum, m) => sum + (m.expeditionEnergy || 0), 0) / (party.length || 1) : 0;

    // 1. Phaser 초기화 체크
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

    // 2. Phaser 인스턴스 생성 및 세션 동기화
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
    }, [isReady, session, actions, dungeon?.moveEnergy, dungeon?.bossEnergy]);

    // 3. 언마운트 시 파괴
    useEffect(() => {
        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    if (!session || !dungeon) return null;

    const handleDpadMove = (dx: number, dy: number) => {
        const scene = gameRef.current?.scene.getScene('DungeonScene') as DungeonScene;
        if (scene) scene.move(dx, dy);
    };

    return (
        <div className="absolute inset-0 z-[100] bg-stone-950 flex flex-col animate-in fade-in duration-500 overflow-hidden">
            
            {/* Top Bar */}
            <div className="p-4 bg-stone-900 border-b border-stone-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${session.hasKey ? 'bg-amber-900/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse' : 'bg-stone-950 border-stone-800 opacity-30'}`}>
                        <Key className={`w-7 h-7 ${session.hasKey ? 'text-amber-400' : 'text-stone-600'}`} />
                    </div>
                    <div>
                        <h2 className="text-stone-100 font-black uppercase text-lg leading-none">{dungeon.name}</h2>
                        <p className="text-stone-500 text-[10px] tracking-widest mt-1">DIRECT ASSAULT MODE</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => actions.retreatFromManualDungeon()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-950/20 hover:bg-red-900/50 border border-red-900/50 rounded-lg text-red-400 font-bold text-xs transition-all"
                >
                    <LogOut className="w-4 h-4" /> Retreat
                </button>
            </div>

            {/* Phaser Viewport */}
            <div ref={containerRef} className="flex-1 w-full relative min-h-0" />

            {/* Interaction UI Panel */}
            <div className="p-6 bg-stone-900 border-t border-stone-800 shrink-0 flex flex-col items-center">
                
                {/* Energy Indicator */}
                <div className="w-full max-w-xs mb-6">
                    <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[8px] md:text-[10px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-1">
                            <Zap className="w-3 h-3 text-blue-500" /> Squad Stamina
                        </span>
                        <span className="text-[10px] font-mono font-bold text-blue-400">{Math.floor(avgEnergy)}%</span>
                    </div>
                    <div className="h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800 p-0.5">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${avgEnergy < 30 ? 'bg-red-600' : 'bg-blue-600'}`} 
                            style={{ width: `${avgEnergy}%` }} 
                        />
                    </div>
                </div>

                {/* D-Pad Controls */}
                <div className="grid grid-cols-3 gap-3">
                    <div />
                    <button onClick={() => handleDpadMove(0, -1)} className="w-14 h-14 md:w-16 md:h-16 bg-stone-800 hover:bg-stone-700 border-2 border-stone-700 rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-xl group">
                        <ChevronUp className="w-8 h-8 text-stone-400 group-hover:text-white" />
                    </button>
                    <div />
                    <button onClick={() => handleDpadMove(-1, 0)} className="w-14 h-14 md:w-16 md:h-16 bg-stone-800 hover:bg-stone-700 border-2 border-stone-700 rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-xl group">
                        <ChevronLeft className="w-8 h-8 text-stone-400 group-hover:text-white" />
                    </button>
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-stone-950 rounded-xl border-2 border-stone-800 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-blue-500/30" />
                    </div>
                    <button onClick={() => handleDpadMove(1, 0)} className="w-14 h-14 md:w-16 md:h-16 bg-stone-800 hover:bg-stone-700 border-2 border-stone-700 rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-xl group">
                        <ChevronRight className="w-8 h-8 text-stone-400 group-hover:text-white" />
                    </button>
                    <div />
                    <button onClick={() => handleDpadMove(0, 1)} className="w-14 h-14 md:w-16 md:h-16 bg-stone-800 hover:bg-stone-700 border-2 border-stone-700 rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-xl group">
                        <ChevronDown className="w-8 h-8 text-stone-400 group-hover:text-white" />
                    </button>
                    <div />
                </div>
            </div>
        </div>
    );
};

export default ManualDungeonOverlay;
