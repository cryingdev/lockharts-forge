import React, { useEffect, useRef, useState, useMemo } from 'react';
import Phaser from 'phaser';
import { useGame } from '../../../context/GameContext';
import { DUNGEONS } from '../../../data/dungeons';
import DungeonScene from '../../../game/DungeonScene';
import DialogueBox from '../../DialogueBox';
import { Key, Zap, LogOut, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Skull, Shield, Sword } from 'lucide-react';
import ConfirmationModal from '../../modals/ConfirmationModal';
import { calculateCombatPower, calculateMercenaryPower } from '../../../utils/combatLogic';
import DungeonCombatView from './DungeonCombatView';
// FIX: Added missing import for getAssetUrl
import { getAssetUrl } from '../../../utils';

const AssaultNavigator = () => {
    const { state, actions } = useGame();
    const session = state.activeManualDungeon;
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [showRetreatConfirm, setShowRetreatConfirm] = useState(false);
    const [lastMsg, setLastMsg] = useState("");

    const dungeon = session ? DUNGEONS.find(d => d.id === session.dungeonId) : null;
    const party = session ? state.knownMercenaries.filter(m => session.partyIds.includes(m.id)) : [];
    
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
                        <div className="pointer-events-auto transition-all scale-90 sm:scale-100">
                            <div className="grid grid-cols-3 gap-2 bg-stone-900/60 backdrop-blur-xl p-3 rounded-3xl border border-white/10 shadow-2xl">
                                <div /><button onClick={() => handleDpadMove(0,-1)} className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center text-white"><ChevronUp /></button><div />
                                <button onClick={() => handleDpadMove(-1,0)} className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center text-white"><ChevronLeft /></button>
                                <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-400"><Zap className="w-6 h-6" /></div>
                                <button onClick={() => handleDpadMove(1,0)} className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center text-white"><ChevronRight /></button>
                                <div /><button onClick={() => handleDpadMove(0,1)} className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center text-white"><ChevronDown /></button><div />
                            </div>
                        </div>
                        
                        <DialogueBox 
                            speaker={isOnNPCTile ? "Tilly Footloose" : isEncountered ? "Tactical AI" : "Comms Link"}
                            speakerAvatar={isOnNPCTile ? getAssetUrl('tily_footloose.png') : undefined}
                            text={lastMsg}
                            options={isOnNPCTile ? [
                                { label: "RESCUE SURVIVOR", action: () => actions.rescueMercenary('tilly_footloose'), variant: 'primary' },
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
