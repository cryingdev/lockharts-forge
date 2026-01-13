
import React, { useEffect, useRef, useState, useMemo } from 'react';
import Phaser from 'phaser';
import { useGame } from '../../../context/GameContext';
import { DUNGEONS } from '../../../data/dungeons';
import DungeonScene from '../../../game/DungeonScene';
import DialogueBox from '../../DialogueBox';
import { 
    Key, Zap, LogOut, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Lock, Unlock, Target, Shield, Sword, Skull
} from 'lucide-react';
import ConfirmationModal from '../../modals/ConfirmationModal';
import { calculateCombatPower, calculateMercenaryPower } from '../../../utils/combatLogic';
import DungeonCombatView from './DungeonCombatView';

type CameraMode = 'LOCKED' | 'ADAPTIVE' | 'FREE';

const AssaultNavigator = () => {
    const { state, actions } = useGame();
    const session = state.activeManualDungeon;
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [showRetreatConfirm, setShowRetreatConfirm] = useState(false);
    const [cameraMode, setCameraMode] = useState<CameraMode>('LOCKED');
    
    const [isSquadStatusExpanded, setIsSquadStatusExpanded] = useState(true);
    const [lastDiscoveryMessage, setLastDiscoveryMessage] = useState<string>('');
    // 도주 직후 해당 칸에서만 포기 버튼을 노출하기 위한 상태
    const [showWithdrawAfterFlee, setShowWithdrawAfterFlee] = useState(false);

    const dungeon = session ? DUNGEONS.find(d => d.id === session.dungeonId) : null;
    const party = session ? state.knownMercenaries.filter(m => session.partyIds.includes(m.id)) : [];
    
    const isEncountered = session?.encounterStatus === 'ENCOUNTERED';
    const isBattle = session?.encounterStatus === 'BATTLE';
    const isVictory = session?.encounterStatus === 'VICTORY';
    const isDefeat = session?.encounterStatus === 'DEFEAT';

    const bossPower = useMemo(() => {
        if (!session?.bossEntity) return 0;
        return calculateCombatPower(session.bossEntity.stats, 'Fighter' as any, 'PHYSICAL');
    }, [session?.bossEntity]);

    const fleeChance = useMemo(() => {
        if (!session || !session.bossEntity) return 0;
        const partyCP = party.reduce((sum, m) => sum + calculateMercenaryPower(m), 0);
        return Math.max(5, Math.min(95, Math.round(50 + (partyCP - bossPower) / 5)));
    }, [session, party, bossPower]);

    const handleDpadMove = (dx: number, dy: number) => {
        if (isEncountered || isBattle) return;
        
        const nextX = (session?.playerPos.x || 0) + dx;
        const nextY = (session?.playerPos.y || 0) + dy;
        const gridW = dungeon?.gridWidth || 0;
        const gridH = dungeon?.gridHeight || 0;

        if (nextX < 0 || nextX >= gridW || nextY < 0 || nextY >= gridH) {
            setLastDiscoveryMessage("Navigation blocked: Area boundary reached.");
            return;
        }

        const targetRoom = session?.grid[nextY][nextX];
        if (targetRoom === 'WALL') {
            setLastDiscoveryMessage("Navigation blocked: Solid obstruction detected.");
            return;
        }

        // 이동 시 도주 직후 상태 및 차단 메시지 초기화
        setShowWithdrawAfterFlee(false);
        if (lastDiscoveryMessage.includes("blocked")) {
            setLastDiscoveryMessage("Moving to next sector...");
        }

        const scene = gameRef.current?.scene.getScene('DungeonScene') as DungeonScene;
        if (scene) scene.move(dx, dy);
    };

    const handleStartCombat = () => {
        actions.startCombatManual();
    };

    const handleFleeSuccess = (finalParty: any[]) => {
        actions.resolveCombatManual(false, true, finalParty);
        // 도주 성공 시 해당 위치에서만 포기 버튼 활성화
        setShowWithdrawAfterFlee(true);
        setLastDiscoveryMessage("TACTICAL WITHDRAWAL: Squad has returned to the previous safe position. Abandon the mission and return to the forge?");
    };

    useEffect(() => {
        const checkSize = () => {
            if (containerRef.current && containerRef.current.clientWidth > 0) setIsReady(true);
            else requestAnimationFrame(checkSize);
        };
        checkSize();
    }, []);

    // 상황별 다이얼로그 업데이트 로직
    useEffect(() => {
        if (!session || !dungeon) return;
        
        const room = session.grid[session.playerPos.y][session.playerPos.x];
        const status = session.encounterStatus;

        // 1. 위협 조우 시 최우선 메시지
        if (status === 'ENCOUNTERED') {
            setLastDiscoveryMessage(`CRITICAL ALERT: ${session.bossEntity?.name} identified. Power Level: ${bossPower} CP. Probability of escape: ${fleeChance}%.`);
            return;
        }

        // 2. 전투 종료 후 승리/패배 메시지 (도주 성공 텍스트는 handleFleeSuccess에서 수동 처리하므로 제외)
        if (status === 'VICTORY') {
            setLastDiscoveryMessage("High-Value Target neutralized. The area is now secure. Proceed to extraction to secure all loot.");
            return;
        }
        if (status === 'DEFEAT') {
            setLastDiscoveryMessage("CRITICAL FAILURE: Squad vitals are failing. Emergency extraction protocol required.");
            return;
        }

        // 3. 일반 상태(NONE)에서의 위치별 메시지
        if (status === 'NONE' && !showWithdrawAfterFlee) {
            if (room === 'ENTRANCE') {
                if (session.isBossDefeated) {
                    setLastDiscoveryMessage("Mission complete. Extraction point is clear. Secure the haul and return to the forge?");
                } else {
                    setLastDiscoveryMessage(`Infiltration of ${dungeon.name} complete. Scanning for objectives...`);
                }
            } else if (room === 'NPC' && !session.npcFound) {
                setLastDiscoveryMessage("Life-sign confirmed. Survivor identified. Initializing rescue protocols.");
            } else if (room === 'BOSS' && session.isBossDefeated) {
                setLastDiscoveryMessage("Area secure. High-Value Target neutralized. Search for remaining loot or head to extraction.");
            } else if (lastDiscoveryMessage.includes("identified") || lastDiscoveryMessage.includes("WITHDRAWAL") || lastDiscoveryMessage === "") {
                setLastDiscoveryMessage("Sector clear. No immediate hostiles detected.");
            }
        }
    }, [session?.playerPos, session?.encounterStatus, session?.isBossDefeated, dungeon?.name, bossPower, fleeChance, showWithdrawAfterFlee]);

    useEffect(() => {
        if (!isReady || !containerRef.current || !session || !dungeon) return;
        if (!gameRef.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO, parent: containerRef.current, width: containerRef.current.clientWidth, height: containerRef.current.clientHeight, backgroundColor: 'transparent', transparent: true, scene: [DungeonScene],
                scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
            };
            const game = new Phaser.Game(config);
            gameRef.current = game;
            game.scene.start('DungeonScene', { session, moveEnergy: dungeon.moveEnergy, bossEnergy: dungeon.bossEnergy, onMove: (dx: number, dy: number) => actions.moveInManualDungeon(dx, dy), cameraMode: cameraMode });
        } else {
            const scene = gameRef.current.scene.getScene('DungeonScene') as DungeonScene;
            if (scene) { scene.updateSession(session); scene.setCameraMode(cameraMode); }
        }
    }, [isReady, session, actions, dungeon, cameraMode]);

    if (!session || !dungeon) return null;

    const currentRoom = session.grid[session.playerPos.y][session.playerPos.x];
    const isOnBossTile = currentRoom === 'BOSS';
    const isOnEntranceTile = currentRoom === 'ENTRANCE';

    return (
        <div className="absolute inset-0 z-[100] bg-stone-950 flex flex-col animate-in fade-in duration-500 overflow-hidden">
            <div ref={containerRef} className={`absolute inset-0 z-0 transition-all duration-700 ${isBattle ? 'opacity-20 blur-lg scale-110' : 'opacity-100 scale-100'}`} />
            
            {isBattle && (
                <DungeonCombatView 
                    session={session} 
                    party={party} 
                    boss={session.bossEntity!} 
                    fleeChance={fleeChance}
                    onFinish={(win, finalParty) => {
                        actions.resolveCombatManual(win, false, finalParty);
                        if (!win) {
                            setTimeout(() => actions.retreatFromManualDungeon(), 1000);
                        }
                    }}
                    onFlee={handleFleeSuccess}
                />
            )}

            {!isBattle && (
                <div className="absolute top-20 left-4 z-50 flex flex-col gap-2 w-48 md:w-56 pointer-events-none">
                    <button onClick={() => setIsSquadStatusExpanded(!isSquadStatusExpanded)} className="bg-stone-950/40 backdrop-blur-md border border-white/10 rounded-lg p-2.5 flex items-center justify-between pointer-events-auto hover:bg-stone-900/60 transition-colors shadow-2xl">
                        <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-400" /><span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Squad Status</span></div>
                        {isSquadStatusExpanded ? <ChevronUp className="w-3.5 h-3.5 text-stone-500" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-500" />}
                    </button>
                    {isSquadStatusExpanded && party.map(merc => {
                        const hpPer = (merc.currentHp / merc.maxHp) * 100;
                        const mpPer = (merc.currentMp / (merc.maxMp || 1)) * 100;
                        return (
                            <div key={merc.id} className={`bg-stone-900/80 border border-stone-700/50 p-3 rounded-xl backdrop-blur-md shadow-xl animate-in slide-in-from-top-2 duration-300 ${merc.currentHp <= 0 ? 'grayscale opacity-50' : ''}`}>
                                <div className="flex items-center gap-2.5 mb-2"><div className="w-8 h-8 rounded-full bg-stone-850 flex items-center justify-center border border-white/5 text-sm shadow-inner shrink-0">{merc.icon}</div><div className="min-w-0 flex-1"><div className="text-[11px] font-black text-white truncate leading-none uppercase">{merc.name.split(' ')[0]}</div><div className="text-[8px] text-stone-500 font-bold uppercase tracking-tighter truncate mt-0.5">{merc.job} • LV.{merc.level}</div></div></div>
                                <div className="space-y-1.5">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex justify-between text-[7px] font-mono text-stone-400 px-0.5 uppercase tracking-tighter"><span>HP</span><span>{Math.floor(merc.currentHp)}</span></div>
                                        <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden border border-white/5 shadow-inner"><div className={`h-full transition-all duration-500 ${hpPer < 30 ? 'bg-red-600 animate-pulse' : 'bg-red-500'}`} style={{ width: `${hpPer}%` }} /></div>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex justify-between text-[7px] font-mono text-stone-400 px-0.5 uppercase tracking-tighter"><span>MP</span><span>{Math.floor(merc.currentMp)}</span></div>
                                        <div className="w-full bg-stone-950 h-1 rounded-full overflow-hidden border border-white/5 shadow-inner"><div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${mpPer}%` }} /></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className={`absolute bottom-0 left-0 right-0 z-40 px-[2%] pb-[2%] flex flex-col items-end pointer-events-none transition-all duration-500 ${isBattle ? 'translate-y-full opacity-0 scale-95' : 'translate-y-0 opacity-100 scale-100'}`}>
                <div className={`mb-4 transition-all duration-500 pointer-events-auto ${isEncountered ? 'opacity-0 scale-90 translate-y-4 pointer-events-none' : 'opacity-100 scale-100 translate-y-0'}`}>
                    <div className="grid grid-cols-3 gap-2 p-3 bg-stone-900/60 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl" style={{ width: '18vmin', height: '18vmin', minWidth: '120px', minHeight: '120px' }}>
                        <div />
                        <button onClick={() => handleDpadMove(0, -1)} className="w-full h-full flex items-center justify-center rounded-xl border-2 transition-all bg-stone-800 border-stone-600 text-stone-200 active:scale-90 active:bg-amber-600 active:border-amber-400"><ChevronUp className="w-[70%] h-[70%]" /></button>
                        <div />
                        <button onClick={() => handleDpadMove(-1, 0)} className="w-full h-full flex items-center justify-center rounded-xl border-2 transition-all bg-stone-800 border-stone-600 text-stone-200 active:scale-90 active:bg-amber-600 active:border-amber-400"><ChevronLeft className="w-[70%] h-[70%]" /></button>
                        <button onClick={() => setCameraMode(prev => prev === 'LOCKED' ? 'ADAPTIVE' : prev === 'ADAPTIVE' ? 'FREE' : 'LOCKED')} className={`w-full h-full rounded-xl border flex items-center justify-center transition-all ${cameraMode !== 'FREE' ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-stone-800/40 border-stone-700 text-stone-500'}`}>{cameraMode === 'LOCKED' ? <Lock className="w-[50%] h-[50%]" /> : cameraMode === 'ADAPTIVE' ? <Target className="w-[50%] h-[50%]" /> : <Unlock className="w-[50%] h-[50%]" />}</button>
                        <button onClick={() => handleDpadMove(1, 0)} className="w-full h-full flex items-center justify-center rounded-xl border-2 transition-all bg-stone-800 border-stone-600 text-stone-200 active:scale-90 active:bg-amber-600 active:border-amber-400"><ChevronRight className="w-[70%] h-[70%]" /></button>
                        <div />
                        <button onClick={() => handleDpadMove(0, 1)} className="w-full h-full flex items-center justify-center rounded-xl border-2 transition-all bg-stone-800 border-stone-600 text-stone-200 active:scale-90 active:bg-amber-600 active:border-amber-400"><ChevronDown className="w-[70%] h-[70%]" /></button>
                        <div />
                    </div>
                </div>
                <div className="w-full pointer-events-auto">
                    <DialogueBox 
                        speaker={isEncountered ? "Tactical AI" : "Exploration Link"} 
                        text={lastDiscoveryMessage} 
                        options={isEncountered ? [
                            { label: "ENGAGE TARGET", action: handleStartCombat, variant: 'primary' },
                            { label: `FLEE TO SAFETY`, action: () => handleFleeSuccess(party), variant: 'danger' }
                        ] : (isOnBossTile && (isVictory || isDefeat)) ? [
                            { label: isVictory ? "Secure Loot & Extract" : "Emergency Retreat", action: () => (isVictory ? actions.finishManualAssault() : actions.retreatFromManualDungeon()), variant: 'primary' }
                        ] : (isOnEntranceTile) ? [
                            { label: session.isBossDefeated ? "FINISH MISSION" : "Withdraw", action: () => (session.isBossDefeated ? actions.finishManualAssault() : setShowRetreatConfirm(true)), variant: 'primary' },
                            { label: "Continue Exploring", action: () => setLastDiscoveryMessage("Resuming exploration. Stay vigilant."), variant: 'neutral' }
                        ] : (showWithdrawAfterFlee) ? [
                            { label: "Withdraw", action: () => setShowRetreatConfirm(true), variant: 'neutral' }
                        ] : []} 
                    />
                </div>
            </div>

            <ConfirmationModal isOpen={showRetreatConfirm} title="Abort Assault?" message="Confirm extraction to return the squad to safety. Unclaimed loot on this floor may be lost." onConfirm={() => actions.retreatFromManualDungeon()} onCancel={() => setShowRetreatConfirm(false)} isDanger={true} />
        </div>
    );
};

export default AssaultNavigator;
