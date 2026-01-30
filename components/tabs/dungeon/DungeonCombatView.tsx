import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Shield, Sword, Activity, Skull, Zap, LogOut, FastForward, Pause, Play, ChevronDown, ChevronUp, Sparkles, Target, Package, X, Check, RotateCcw, Wand2, ChevronRight, Heart } from 'lucide-react';
import { Mercenary } from '../../../models/Mercenary';
import { Monster } from '../../../models/Monster';
import { ManualDungeonSession } from '../../../types/game-state';
import { calculateCombatResult } from '../../../utils/combatLogic';
import { calculateDerivedStats, applyEquipmentBonuses, mergePrimaryStats } from '../../../models/Stats';
import { useGame } from '../../../context/GameContext';
import { SKILLS } from '../../../data/skills';
import { MercenaryPortrait } from '../../common/ui/MercenaryPortrait';
import { getAssetUrl } from '../../../utils';
import { InventoryItem, EquipmentSlotType } from '../../../types/inventory';
import { MercenaryDetailModal } from '../../modals/MercenaryDetailModal';
import { DUNGEONS } from '../../../data/dungeons';
import { SfxButton } from '../../common/ui/SfxButton';

const ACTION_THRESHOLD = 1000;

interface CombatLogEntry {
    msg: string;
    team: 'PLAYER' | 'ENEMY' | 'SYSTEM';
    isCrit?: boolean;
    isSkill?: boolean;
    isHeal?: boolean;
}

interface DamagePopup {
    id: number;
    value: number;
    targetId: string;
    isCrit: boolean;
    isSkill: boolean;
    isHeal?: boolean;
}

interface DungeonCombatViewProps {
    session: ManualDungeonSession;
    party: Mercenary[];
    enemies: Monster[];
    fleeChance: number;
    onFinish: (win: boolean, finalParty: any[]) => void;
    onFlee: (finalParty: any[]) => void;
}

const DungeonCombatView: React.FC<DungeonCombatViewProps> = ({ session, party, enemies, fleeChance, onFinish, onFlee }) => {
    const { state, actions } = useGame();
    const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>(
        window.innerWidth > window.innerHeight ? 'LANDSCAPE' : 'PORTRAIT'
    );
    
    const dungeonInfo = useMemo(() => DUNGEONS.find(d => d.id === session.dungeonId), [session.dungeonId]);

    const [partyState, setPartyState] = useState(party.map(m => {
        const primary = mergePrimaryStats(m.stats, m.allocatedStats);
        const derived = applyEquipmentBonuses(calculateDerivedStats(primary, m.level), (Object.values(m.equipment) as any[]).map(e=>e?.stats).filter(Boolean) as any);
        return { ...m, derived, currentHp: m.currentHp, currentMp: m.currentMp, gauge: 0, lastDamaged: false };
    }));
    
    const [enemySquadState, setEnemySquadState] = useState(enemies.map((e, idx) => ({
        ...e,
        instanceId: `enemy_${idx}`,
        gauge: 0,
        lastDamaged: false,
        hasUsedRevival: false
    })));

    const [logs, setLogs] = useState<CombatLogEntry[]>([]);
    const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
    
    const [isAuto, setIsAuto] = useState(() => {
        const saved = localStorage.getItem('dungeon_combat_auto');
        return saved === null ? true : saved === 'true';
    });
    
    const [battleSpeed, setBattleSpeed] = useState<1 | 2 | 4>(() => {
        const saved = localStorage.getItem('dungeon_combat_speed');
        const parsed = saved ? parseInt(saved) : 1; 
        if (parsed === 1 || parsed === 2 || parsed === 4) return parsed as 1 | 2 | 4;
        return 1;
    });

    useEffect(() => {
        localStorage.setItem('dungeon_combat_auto', isAuto.toString());
    }, [isAuto]);

    useEffect(() => {
        localStorage.setItem('dungeon_combat_speed', battleSpeed.toString());
    }, [battleSpeed]);

    const [isPaused, setIsPaused] = useState(false);
    const [activeActorId, setActiveActorId] = useState<string | null>(null); 
    const [attackingUnitId, setAttackingUnitId] = useState<string | null>(null);
    const [showLogs, setShowLogs] = useState(false);
    const [showSkillList, setShowSkillList] = useState(false);
    
    const [pendingAction, setPendingAction] = useState<{ type: 'ATTACK' | 'SKILL', skillId?: string } | null>(null);
    const [inspectedMercId, setInspectedMercId] = useState<string | null>(null);
    
    const battleInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const speedRef = useRef(1);

    useEffect(() => {
        speedRef.current = battleSpeed;
    }, [battleSpeed]);

    useEffect(() => {
        const handleResize = () => {
            setOrientation(window.innerWidth > window.innerHeight ? 'LANDSCAPE' : 'PORTRAIT');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const addLog = useCallback((msg: string, team: 'PLAYER' | 'ENEMY' | 'SYSTEM', isCrit = false, isSkill = false, isHeal = false) => {
        setLogs(prev => [{ msg, team, isCrit, isSkill, isHeal }, ...prev].slice(0, 50));
    }, []);

    const triggerDamagePopup = useCallback((targetId: string, value: number, isCrit: boolean, isSkill: boolean, isHeal = false) => {
        const id = Date.now() + Math.random();
        setDamagePopups(prev => [...prev, { id, value, targetId, isCrit, isSkill, isHeal }]);
        setTimeout(() => {
            setDamagePopups(prev => prev.filter(p => p.id !== id));
        }, 800 / speedRef.current);
    }, []);

    /**
     * executeAction: 전투의 핵심 Use Case 처리기
     * Fix: multipliers and MP costs now have safe defaults to resolve TS18048.
     */
    const executeAction = useCallback((attacker: any, target: any, isPlayerSide: boolean, skillId?: string) => {
        setAttackingUnitId(isPlayerSide ? attacker.id : attacker.instanceId);
        
        setTimeout(() => {
            const skill = skillId ? SKILLS[skillId] : null;
            const multiplier = skill?.multiplier ?? 1.0;
            const mpCost = skill?.mpCost ?? 0;
            const isHealAction = skill?.tags.includes('HEAL') || false;

            // USE CASE: HEALING
            if (isHealAction) {
                const baseHeal = Math.round((attacker.derived?.magicalAttack || attacker.stats.magicalAttack || 10) * multiplier);
                const isCrit = Math.random() * 100 <= (attacker.derived?.critChance || 0);
                const finalHeal = isCrit ? Math.round(baseHeal * 1.5) : baseHeal;

                window.dispatchEvent(new CustomEvent('play-sfx', { detail: { file: 'click_light.wav' } }));

                if (isPlayerSide) {
                    setPartyState(prev => prev.map(p => {
                        if (p.id === target.id) {
                            const nextHp = Math.min(p.derived.maxHp, p.currentHp + finalHeal);
                            triggerDamagePopup(p.id, finalHeal, isCrit, true, true);
                            return { ...p, currentHp: nextHp };
                        }
                        if (p.id === attacker.id) {
                            return { ...p, currentMp: Math.max(0, p.currentMp - mpCost) };
                        }
                        return p;
                    }));
                    addLog(`${attacker.name} used ${skill!.name} on ${target.name} for ${finalHeal} HP!`, 'PLAYER', isCrit, true, true);
                } else {
                    setEnemySquadState(prev => prev.map(e => {
                        if (e.instanceId === target.instanceId) {
                            const nextHp = Math.min(e.stats.maxHp, e.currentHp + finalHeal);
                            triggerDamagePopup(e.instanceId, finalHeal, isCrit, true, true);
                            return { ...e, currentHp: nextHp };
                        }
                        return e;
                    }));
                    addLog(`${attacker.name} healed ${target.name} for ${finalHeal}!`, 'ENEMY', isCrit, true, true);
                }
            } 
            // USE CASE: DAMAGE
            else {
                const res = calculateCombatResult(
                    isPlayerSide ? attacker.derived : attacker.stats,
                    isPlayerSide ? target.stats : target.derived,
                    isPlayerSide ? attacker.job : 'Fighter' as any,
                    isPlayerSide ? (attacker.derived.magicalAttack > attacker.derived.physicalAttack ? 'MAGICAL' : 'PHYSICAL') : 'PHYSICAL',
                    multiplier
                );

                if (res.isHit) {
                    window.dispatchEvent(new CustomEvent('play-sfx', { detail: { file: 'battle_slash.mp3' } }));
                } else {
                    window.dispatchEvent(new CustomEvent('play-sfx', { detail: { file: 'swing_miss.mp3' } }));
                }

                if (isPlayerSide) {
                    setEnemySquadState(prev => prev.map(e => {
                        if (e.instanceId === target.instanceId) {
                            const next = { ...e, lastDamaged: res.isHit };
                            if (res.isHit) {
                                let nextHp = Math.max(0, next.currentHp - res.damage);
                                if (nextHp <= 0 && next.id === 'phoenix' && !next.hasUsedRevival) {
                                    nextHp = next.stats.maxHp;
                                    next.hasUsedRevival = true;
                                    addLog("Phoenix rebirth triggered!", 'ENEMY', true, true);
                                    triggerDamagePopup(target.instanceId, 0, true, true);
                                } else {
                                    next.currentHp = nextHp;
                                }
                                triggerDamagePopup(target.instanceId, res.damage, res.isCrit, !!skill);
                            }
                            setTimeout(() => setEnemySquadState(curr => curr.map(currE => currE.instanceId === target.instanceId ? { ...currE, lastDamaged: false } : currE)), 200 / speedRef.current);
                            return next;
                        }
                        return e;
                    }));
                    
                    setPartyState(prev => prev.map(p => p.id === attacker.id ? { ...p, currentMp: Math.max(0, p.currentMp - mpCost) } : p));
                    
                    if (skill) {
                        addLog(`${attacker.name} used ${skill.name}!`, 'PLAYER', res.isCrit, true);
                    } else {
                        addLog(`${attacker.name} hits ${target.name} for ${res.damage}`, 'PLAYER', res.isCrit);
                    }
                } else {
                    setPartyState(prev => prev.map(p => {
                        if (p.id === target.id) {
                            const next = { ...p, lastDamaged: res.isHit };
                            if (res.isHit) {
                                next.currentHp = Math.max(0, next.currentHp - res.damage);
                                triggerDamagePopup(p.id, res.damage, res.isCrit, false);
                            }
                            setTimeout(() => setPartyState(curr => curr.map(c => c.id === p.id ? { ...c, lastDamaged: false } : c)), 200 / speedRef.current);
                            return next;
                        }
                        return p;
                    }));
                    addLog(`${attacker.name} strikes ${target.name} for ${res.damage}`, 'ENEMY');
                }
            }
            
            setTimeout(() => setAttackingUnitId(null), 150 / speedRef.current);
        }, 200 / speedRef.current);
    }, [addLog, triggerDamagePopup]);

    const processLoop = useCallback(() => {
        if (isPaused || activeActorId || attackingUnitId || inspectedMercId) return;

        const enemiesDefeated = enemySquadState.every(e => e.currentHp <= 0);
        const partyDefeated = partyState.every(p => p.currentHp <= 0);

        if (enemiesDefeated) {
            setIsPaused(true);
            setTimeout(() => onFinish(true, partyState), 800 / speedRef.current);
            return;
        }
        if (partyDefeated) {
            setIsPaused(true);
            setTimeout(() => onFinish(false, partyState), 800 / speedRef.current);
            return;
        }

        setPartyState(prev => {
            const next = [...prev];
            let readyMerc = null;
            for (let p of next) {
                if (p.currentHp > 0) {
                    p.gauge += (p.derived.speed * 0.2 * speedRef.current); 
                    if (p.gauge >= ACTION_THRESHOLD && !readyMerc) readyMerc = p;
                }
            }
            if (readyMerc && !attackingUnitId) {
                if (isAuto) {
                    readyMerc.gauge -= ACTION_THRESHOLD;
                    const livingEnemies = enemySquadState.filter(e => e.currentHp > 0);
                    const livingAllies = next.filter(p => p.currentHp > 0);

                    const availableSkillIds = [
                        ...(readyMerc.skillIds || []),
                        ...Object.values(readyMerc.equipment || {}).map(i => (i as any)?.socketedSkillId).filter(Boolean) as string[]
                    ];

                    let sid = undefined;
                    let target = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];

                    if (availableSkillIds.length > 0) {
                        const skillId = availableSkillIds[0];
                        const skill = SKILLS[skillId];
                        if (skill && readyMerc.currentMp >= (skill.mpCost ?? 0) && Math.random() < 0.3) {
                            sid = skillId;
                            if (skill.tags.includes('HEAL')) {
                                target = [...livingAllies].sort((a,b) => (a.currentHp/a.derived.maxHp) - (b.currentHp/b.derived.maxHp))[0];
                            }
                        }
                    }
                    executeAction(readyMerc, target, true, sid);
                } else {
                    setActiveActorId(readyMerc.id);
                    setShowSkillList(false);
                    setPendingAction(null);
                }
            }
            return next;
        });

        setEnemySquadState(prev => {
            const next = [...prev];
            let readyEnemy = null;
            for (let e of next) {
                if (e.currentHp > 0) {
                    e.gauge += (e.stats.speed * 0.2 * speedRef.current); 
                    if (e.gauge >= ACTION_THRESHOLD && !readyEnemy) readyEnemy = e;
                }
            }
            if (readyEnemy && !activeActorId && !attackingUnitId) {
                readyEnemy.gauge -= ACTION_THRESHOLD;
                const livingPlayers = partyState.filter(p => p.currentHp > 0);
                if (livingPlayers.length > 0) {
                    const target = livingPlayers[Math.floor(Math.random() * livingPlayers.length)];
                    executeAction(readyEnemy, target, false);
                }
            }
            return next;
        });
    }, [isPaused, isAuto, activeActorId, attackingUnitId, inspectedMercId, enemySquadState, partyState, executeAction, onFinish]);

    useEffect(() => {
        battleInterval.current = setInterval(processLoop, 100);
        return () => { if (battleInterval.current) clearInterval(battleInterval.current); };
    }, [processLoop]);

    const handleTurnConsumed = useCallback((targetMercId: string) => {
        setTimeout(() => {
            const updatedMercFromContext = state.knownMercenaries.find(m => m.id === targetMercId);
            if (updatedMercFromContext) {
                setPartyState(prev => prev.map(p => {
                    if (p.id === targetMercId) {
                        const primary = mergePrimaryStats(updatedMercFromContext.stats, updatedMercFromContext.allocatedStats);
                        const derived = applyEquipmentBonuses(
                            calculateDerivedStats(primary, updatedMercFromContext.level), 
                            (Object.values(updatedMercFromContext.equipment) as any[]).map(e=>e?.stats).filter(Boolean) as any
                        );
                        return { 
                            ...p, 
                            ...updatedMercFromContext, 
                            derived,
                            currentHp: updatedMercFromContext.currentHp,
                            currentMp: updatedMercFromContext.currentMp,
                            gauge: Math.max(0, p.gauge - ACTION_THRESHOLD),
                            lastDamaged: false // Reset local flag
                        };
                    }
                    return p;
                }));
                setInspectedMercId(null);
                setActiveActorId(null);
            }
        }, 50);
    }, [state.knownMercenaries]);

    const handleManualAction = (e: React.MouseEvent, type: 'ATTACK' | 'SKILL', skillId?: string) => {
        e.stopPropagation(); 
        if (!activeActorId) return;
        
        if (type === 'SKILL' && !skillId) {
            setShowSkillList(true);
            return;
        }

        if (type === 'SKILL' && skillId) {
            const skill = SKILLS[skillId];
            const actor = partyState.find(p => p.id === activeActorId);
            if (!actor || actor.currentMp < (skill?.mpCost ?? 0)) {
                actions.showToast("Not enough MP!");
                return;
            }
            setShowSkillList(false);
        }

        setPendingAction({ type, skillId });
    };

    /**
     * handleTargetClick: 타겟 지정 Use Case
     */
    const handleTargetClick = (target: any, side: 'PLAYER' | 'ENEMY') => {
        if (!activeActorId || !pendingAction) return;
        
        if (target.currentHp <= 0 && side === 'ENEMY') return;
        
        const skill = pendingAction.skillId ? SKILLS[pendingAction.skillId] : null;
        const isSupportive = skill?.tags.includes('HEAL') || skill?.tags.includes('BUFF');

        if (!isSupportive && side === 'PLAYER' && pendingAction.type === 'ATTACK') return;
        if (!isSupportive && side === 'PLAYER' && skill && !skill.tags.includes('DAMAGE')) return;
        if (isSupportive && side === 'ENEMY') return;

        const actor = partyState.find(p => p.id === activeActorId);
        if (!actor) return;
        
        setPartyState(prev => prev.map(p => p.id === activeActorId ? { ...p, gauge: p.gauge - ACTION_THRESHOLD } : p));
        executeAction(actor, target, true, pendingAction.skillId);
        setPendingAction(null);
        setActiveActorId(null);
    };

    const handleFlee = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (Math.random() * 100 < fleeChance) {
            onFlee(partyState);
        } else {
            addLog("Escape failed!", 'SYSTEM');
            setActiveActorId(null);
            setPendingAction(null);
            const actor = partyState.find(p => p.id === activeActorId);
            if (actor) {
                setPartyState(prev => prev.map(p => p.id === actor.id ? { ...p, gauge: 0 } : p));
            }
        }
    };

    const getUnitStyle = (id: string, side: 'PLAYER' | 'ENEMY'): React.CSSProperties => {
        if (attackingUnitId !== id) return {};
        let transform = orientation === 'PORTRAIT' 
            ? (side === 'PLAYER' ? 'translateY(-120px) scale(1.1)' : 'translateY(120px) scale(1.1)')
            : (side === 'PLAYER' ? 'translateX(120px) scale(1.1)' : 'translateX(-120px) scale(1.1)');
        return { transform, zIndex: 100 };
    };

    const activeActor = useMemo(() => partyState.find(p => p.id === activeActorId), [partyState, activeActorId]);
    
    const activeActorSkills = useMemo(() => {
        if (!activeActor) return [];
        const learned = (activeActor.skillIds || []).map(id => ({ id, source: 'LEARNED' }));
        const fromGear = Object.values(activeActor.equipment || {}).map(i => (i as any)?.socketedSkillId).filter(Boolean).map(id => ({ id, source: 'GEAR' }));
        return [...learned, ...fromGear as any];
    }, [activeActor]);

    const isSupportiveAction = useMemo(() => {
        if (!pendingAction || pendingAction.type === 'ATTACK') return false;
        if (!pendingAction.skillId) return false;
        const skill = SKILLS[pendingAction.skillId];
        return skill.tags.includes('HEAL') || skill.tags.includes('BUFF');
    }, [pendingAction]);

    return (
        <div className="fixed inset-0 z-[150] flex flex-col bg-stone-950 animate-in fade-in duration-500 overflow-hidden font-sans pb-safe">
            <style>{`
                @keyframes damage-float { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-60px); opacity: 0; } }
                .animate-damage { animation: damage-float 1s ease-out forwards; }
                @keyframes heal-float { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-60px); opacity: 0; } }
                .animate-heal { animation: heal-float 1s ease-out forwards; }
                @keyframes unit-shake { 0%, 100% { transform: translate(0,0); } 25% { transform: translate(-4px, 2px); } 50% { transform: translate(4px, -2px); } 75% { transform: translate(-2px, -4px); } }
                .animate-hit { animation: unit-shake 0.2s ease-in-out 3; }
                @keyframes target-pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { transform: scale(1); } }
                .animate-target { animation: target-pulse 1.5s infinite; }
                @keyframes heal-target-pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); } 100% { transform: scale(1); } }
                .animate-heal-target { animation: heal-target-pulse 1.5s infinite; }
            `}</style>

            {/* Background Tile Layer */}
            {dungeonInfo?.tile && (
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <img 
                        src={getAssetUrl(dungeonInfo.tile, 'dungeons')} 
                        className="w-full h-full object-cover opacity-60 brightness-[0.6]" 
                        alt="Combat Background" 
                    />
                </div>
            )}

            {/* Top Bar */}
            <div className="p-3 bg-red-950/20 border-b border-red-900/30 flex justify-between items-center z-[200] backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Skull className="w-4 h-4 text-red-50" />
                    <h2 className="text-white font-black uppercase text-[10px] md:text-sm tracking-widest font-mono">Combat Zone</h2>
                </div>
                <div className="flex items-center gap-3 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    <SfxButton sfx="switch" onClick={() => setIsPaused(!isPaused)} className={`p-1.5 rounded-full transition-all ${isPaused ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-400'}`}>
                        {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </SfxButton>
                    <div className="flex items-center gap-1">
                        {[1, 2, 4].map(s => (
                            <SfxButton sfx="switch" key={s} onClick={() => setBattleSpeed(s as any)} className={`px-2 py-0.5 rounded font-mono text-[8px] md:text-[10px] font-black ${battleSpeed === s ? 'bg-indigo-600 text-white' : 'text-stone-600'}`}>{s}x</SfxButton>
                        ))}
                    </div>
                </div>
                <SfxButton sfx="switch" onClick={() => { setIsAuto(!isAuto); setPendingAction(null); setShowSkillList(false); }} className={`px-4 py-1.5 rounded-lg border font-black text-[9px] tracking-widest transition-all ${isAuto ? 'bg-amber-600 border-amber-400 text-white' : 'bg-stone-800 border-stone-600 text-stone-400'}`}>
                    {isAuto ? 'AUTO' : 'MANUAL'}
                </SfxButton>
            </div>

            {/* Combat Field */}
            <div className={`flex-1 flex relative transition-all duration-700 z-10 ${orientation === 'PORTRAIT' ? 'flex-col' : 'flex-row'}`}>
                {/* Enemies Area */}
                <div className={`flex flex-1 items-center justify-center p-4 gap-6 md:gap-12 ${orientation === 'PORTRAIT' ? 'order-1' : 'order-2'}`}>
                    {enemySquadState.map(e => {
                        const isTargetable = !!pendingAction && e.currentHp > 0 && !isSupportiveAction;
                        return (
                            <div key={e.instanceId} style={getUnitStyle(e.instanceId, 'ENEMY')} onClick={() => isTargetable && handleTargetClick(e, 'ENEMY')} className={`relative flex flex-col items-center transition-all ${e.currentHp <= 0 ? 'opacity-20 grayscale' : e.lastDamaged ? 'animate-hit' : ''}`}>
                                <div className={`w-24 h-24 md:w-48 md:h-48 bg-stone-900 rounded-2xl border-2 flex items-center justify-center relative shadow-2xl ${e.lastDamaged ? 'border-red-500 bg-red-950/20' : 'border-stone-800'} ${isTargetable ? 'animate-target border-red-500 cursor-crosshair' : ''}`}>
                                    <img src={getAssetUrl(e.sprite || '', 'monsters')} className="w-[80%] h-[80%] object-contain" alt={e.name} />
                                    {isTargetable && <div className="absolute inset-0 flex items-center justify-center"><Target className="w-12 h-12 text-red-500 opacity-50" /></div>}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        {damagePopups.filter(p => p.targetId === e.instanceId).map(p => (
                                            <div key={p.id} className={`absolute font-black text-3xl md:text-5xl animate-damage ${p.isCrit ? 'text-amber-400 scale-125' : 'text-red-500'}`}>-{p.value}</div>
                                        ))}
                                    </div>
                                </div>
                                {e.currentHp > 0 && (
                                    <div className="mt-2 w-24 md:w-52 space-y-1">
                                        <div className="flex flex-col items-center leading-none mb-1">
                                            <span className="text-[9px] md:text-xs font-black text-stone-300 uppercase tracking-tighter truncate w-full text-center">{e.name}</span>
                                            <span className="text-[7px] md:text-[9px] font-bold text-stone-500 uppercase tracking-widest">Lv.{e.level}</span>
                                        </div>
                                        <div className="relative h-2.5 bg-black rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${(e.currentHp/e.stats.maxHp)*100}%` }} />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="text-[7px] md:text-[10px] font-mono font-black text-white drop-shadow-sm">{Math.floor(e.currentHp)} / {e.stats.maxHp}</span>
                                            </div>
                                        </div>
                                        <div className="h-1 bg-black rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(e.gauge/ACTION_THRESHOLD)*100}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Players Area */}
                <div className={`flex flex-1 items-center justify-center p-4 gap-6 md:gap-12 ${orientation === 'PORTRAIT' ? 'order-3 pt-0' : 'order-1'}`}>
                    {partyState.map(p => {
                        const isActive = activeActorId === p.id;
                        const isTargetable = !!pendingAction && p.currentHp > 0 && isSupportiveAction;
                        const hpPer = (p.currentHp / p.derived.maxHp) * 100;
                        const mpPer = (p.currentMp / (p.derived.maxMp || 1)) * 100;

                        return (
                            <div key={p.id} style={getUnitStyle(p.id, 'PLAYER')} onClick={() => isTargetable && handleTargetClick(p, 'PLAYER')} className={`relative flex flex-col items-center transition-all ${p.currentHp <= 0 ? 'opacity-20 grayscale' : isActive ? '-translate-y-4' : ''} ${p.lastDamaged ? 'animate-hit' : ''}`}>
                                <div className={`w-24 h-24 md:w-48 md:h-48 bg-stone-900 rounded-2xl border-2 flex items-center justify-center relative shadow-2xl ${isActive ? 'border-amber-400 ring-4 ring-amber-500/20' : isTargetable ? 'animate-heal-target border-emerald-500 ring-4 ring-emerald-500/20 cursor-pointer' : 'border-stone-800'}`}>
                                    <MercenaryPortrait mercenary={p} className="w-[85%] h-[85%] rounded-xl" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        {damagePopups.filter(pop => pop.targetId === p.id).map(pop => (
                                            <div key={pop.id} className={`absolute font-black text-3xl md:text-5xl ${pop.isHeal ? 'animate-heal text-emerald-400' : 'animate-damage text-red-50'}`}>{pop.isHeal ? '+' : '-'}{pop.value}</div>
                                        ))}
                                    </div>
                                    
                                    {!!pendingAction && isActive && (
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                                            <div className={`bg-amber-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg border border-amber-400 whitespace-nowrap`}>
                                                {pendingAction.skillId ? SKILLS[pendingAction.skillId].name : 'Striking'}
                                            </div>
                                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-amber-600"></div>
                                        </div>
                                    )}

                                    {isActive && !pendingAction && !isAuto && !showSkillList && (
                                        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 z-[300] bg-stone-900/95 border-2 border-amber-500 p-2.5 rounded-2xl grid grid-cols-2 gap-3 shadow-2xl animate-in slide-in-from-top-2 backdrop-blur-md w-40">
                                            <SfxButton onClick={(e) => handleManualAction(e, 'ATTACK')} className="p-3 bg-stone-800 hover:bg-stone-700 rounded-xl text-white transition-colors border border-white/5 flex flex-col items-center gap-1 group">
                                                <Sword size={20} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-[8px] font-black uppercase">Atk</span>
                                            </SfxButton>
                                            <SfxButton onClick={(e) => handleManualAction(e, 'SKILL')} className="p-3 bg-indigo-900/40 hover:bg-indigo-800 rounded-xl text-indigo-100 transition-colors border border-indigo-500/30 flex flex-col items-center gap-1 group">
                                                <Wand2 size={20} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-[8px] font-black uppercase">Skill</span>
                                            </SfxButton>
                                            <SfxButton sfx="switch" onClick={(e) => { e.stopPropagation(); setInspectedMercId(p.id); }} className="p-3 bg-stone-800 hover:bg-stone-750 rounded-xl text-stone-300 transition-colors border border-stone-700 flex flex-col items-center gap-1 group">
                                                <Package size={20} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-[8px] font-black uppercase">Bag</span>
                                            </SfxButton>
                                            <SfxButton onClick={(e) => handleFlee(e)} className="p-3 bg-red-950/40 hover:bg-red-900 rounded-xl text-red-500 transition-colors border border-red-500/30 flex flex-col items-center gap-1 group">
                                                <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-[8px] font-black uppercase">Flee</span>
                                            </SfxButton>
                                        </div>
                                    )}

                                    {isActive && showSkillList && (
                                        <div className="absolute -bottom-52 left-1/2 -translate-x-1/2 z-[310] bg-stone-900/98 border-2 border-indigo-500 p-3 rounded-2xl shadow-2xl animate-in zoom-in-95 backdrop-blur-xl w-64 md:w-80">
                                            <div className="flex justify-between items-center mb-2 px-1">
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Available Skills</span>
                                                <SfxButton sfx="switch" onClick={() => setShowSkillList(false)} className="text-stone-500 hover:text-white"><X size={16} /></SfxButton>
                                            </div>
                                            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                                {activeActorSkills.map((ref, idx) => {
                                                    const skill = SKILLS[ref.id];
                                                    if (!skill) return null;
                                                    const actor = partyState.find(ps => ps.id === activeActorId);
                                                    const canCast = !!actor && actor.currentMp >= (skill.mpCost ?? 0);
                                                    const isHeal = skill.tags.includes('HEAL');
                                                    return (
                                                        <button 
                                                            key={`${ref.id}-${idx}`}
                                                            disabled={!canCast}
                                                            onClick={(e) => handleManualAction(e, 'SKILL', ref.id)}
                                                            className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all text-left group ${canCast ? 'bg-indigo-900/20 border-indigo-500/30 hover:bg-indigo-800/40 hover:border-indigo-400' : 'bg-stone-900 border-stone-800 opacity-50 grayscale cursor-not-allowed'}`}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className={`p-1.5 rounded-lg border ${ref.source === 'GEAR' ? 'bg-purple-900/30 border-purple-500/50 text-purple-400' : isHeal ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' : 'bg-indigo-900/40 border-indigo-500/50 text-indigo-300'}`}>
                                                                    {isHeal ? <Heart size={14} /> : <Zap size={14} />}
                                                                </div>
                                                                <div className="min-w-0 flex flex-col leading-tight">
                                                                    <span className="text-[10px] font-black text-stone-100 uppercase truncate">{skill.name}</span>
                                                                    <span className="text-[7px] text-stone-500 italic truncate">{skill.description}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                                                <span className="text-[9px] font-mono font-black text-blue-400">{skill.mpCost} MP</span>
                                                                <ChevronRight size={14} className="text-stone-700 group-hover:text-white transition-colors" />
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                                {activeActorSkills.length === 0 && (
                                                    <div className="py-8 text-center text-stone-600 text-[10px] font-black uppercase tracking-widest opacity-40 italic">No usable skills</div>
                                                )}
                                            </div>
                                            {!!pendingAction && (
                                                <div className="mt-3 pt-3 border-t border-indigo-500/30">
                                                    <SfxButton onClick={() => setPendingAction(null)} className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 text-[10px] font-black uppercase rounded-lg">Cancel Selection</SfxButton>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {p.currentHp > 0 && (
                                    <div className="mt-2 w-24 md:w-52 space-y-1">
                                        <div className="flex flex-col items-center leading-none mb-1">
                                            <span className="text-[9px] md:text-xs font-black text-stone-100 uppercase tracking-tighter truncate w-full text-center">{p.name}</span>
                                            <span className="text-[7px] md:text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-0.5">{p.job} • Lv.{p.level}</span>
                                        </div>
                                        <div className="relative h-3 bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
                                            <div className={`h-full transition-all duration-500 ${hpPer < 30 ? 'bg-red-500 animate-pulse' : 'bg-red-600'}`} style={{ width: `${hpPer}%` }} />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="text-[7px] md:text-[11px] font-mono font-black text-white drop-shadow-sm">{Math.floor(p.currentHp)} / {p.derived.maxHp}</span>
                                            </div>
                                        </div>
                                        <div className="relative h-2.5 bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
                                            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${mpPer}%` }} />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="text-[6px] md:text-[9px] font-mono font-black text-blue-100 drop-shadow-sm">{Math.floor(p.currentMp)} / {p.derived.maxMp}</span>
                                            </div>
                                        </div>
                                        <div className="h-1 bg-black rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(p.gauge/ACTION_THRESHOLD)*100}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tactical Feed */}
            <div className={`bg-stone-900 border-t border-stone-800 flex flex-col shrink-0 transition-all z-10 ${showLogs ? 'h-48' : 'h-18'}`}>
                <button onClick={() => setShowLogs(!showLogs)} className="w-full h-10 flex items-center justify-between px-4 bg-black/20 hover:bg-black/40 transition-colors shrink-0">
                    <div className="flex items-center gap-2">
                        <Activity className={`w-3.5 h-3.5 ${isPaused ? 'text-stone-600' : 'text-amber-500 animate-pulse'}`} />
                        <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Engagement Feed</span>
                    </div>
                    {showLogs ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
                <div className={`flex-1 ${showLogs ? 'overflow-y-auto' : 'overflow-hidden'} p-2 space-y-1 font-mono text-[9px] custom-scrollbar`}>
                    {(showLogs ? logs : logs.slice(0, 1)).map((log, i) => (
                        <div key={i} className={`p-1.5 border-l-2 ${log.team === 'PLAYER' ? (log.isHeal ? 'border-emerald-500 text-emerald-100' : 'border-blue-500 text-blue-100') : log.team === 'ENEMY' ? 'border-red-500 text-red-100' : 'border-stone-700 text-stone-400'} ${log.isCrit ? 'bg-white/5 font-black' : ''}`}>
                            <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}]</span>
                            {log.msg}
                        </div>
                    ))}
                </div>
            </div>

            {/* Modals */}
            {inspectedMercId && (
                <MercenaryDetailModal 
                    mercenary={partyState.find(p => p.id === inspectedMercId) || null}
                    onClose={() => setInspectedMercId(null)}
                    onEquip={(mercId, itemId) => { actions.equipItem(mercId, itemId); handleTurnConsumed(mercId); }}
                    onConsume={(mercId, itemId) => { actions.useItem(itemId, mercId); handleTurnConsumed(mercId); }}
                    onUnequip={(mercId, slot) => { actions.unequipItem(mercId, slot); handleTurnConsumed(mercId); }}
                    isReadOnly={false} 
                />
            )}
        </div>
    );
};

export default DungeonCombatView;