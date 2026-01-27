
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Sword, Activity, Skull, Zap, LogOut, FastForward, Pause, ChevronDown, ChevronUp, Sparkles, Target } from 'lucide-react';
import { Mercenary } from '../../../models/Mercenary';
import { Monster } from '../../../models/Monster';
import { ManualDungeonSession } from '../../../types/game-state';
import { calculateCombatResult } from '../../../utils/combatLogic';
import { calculateDerivedStats, applyEquipmentBonuses, mergePrimaryStats } from '../../../models/Stats';
import { useGame } from '../../../context/GameContext';
import { SKILLS } from '../../../data/skills';
import { MercenaryPortrait } from '../../common/ui/MercenaryPortrait';
import { getAssetUrl } from '../../../utils';

const ACTION_THRESHOLD = 1000;

interface CombatLogEntry {
    msg: string;
    team: 'PLAYER' | 'ENEMY' | 'SYSTEM';
    isCrit?: boolean;
    isSkill?: boolean;
}

interface DamagePopup {
    id: number;
    value: number;
    targetId: string;
    isCrit: boolean;
    isSkill: boolean;
}

interface DungeonCombatViewProps {
    session: ManualDungeonSession;
    party: Mercenary[];
    enemies: Monster[];
    fleeChance: number;
    onFinish: (win: boolean, finalParty: any[]) => void;
    onFlee: (finalParty: any[]) => void;
}

const DungeonCombatView: React.FC<DungeonCombatViewProps> = ({ party, enemies, fleeChance, onFinish, onFlee }) => {
    const { actions } = useGame();
    const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>(
        window.innerWidth > window.innerHeight ? 'LANDSCAPE' : 'PORTRAIT'
    );
    
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
    const [isAuto, setIsAuto] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [activeActorId, setActiveActorId] = useState<string | null>(null); 
    const [attackingUnitId, setAttackingUnitId] = useState<string | null>(null); // For Dash Animation
    const [showLogs, setShowLogs] = useState(false);
    const battleInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // Orientation Detector
    useEffect(() => {
        const handleResize = () => {
            setOrientation(window.innerWidth > window.innerHeight ? 'LANDSCAPE' : 'PORTRAIT');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const addLog = (msg: string, team: 'PLAYER' | 'ENEMY' | 'SYSTEM', isCrit = false, isSkill = false) => {
        setLogs(prev => [{ msg, team, isCrit, isSkill }, ...prev].slice(0, 50));
    };

    const triggerDamagePopup = (targetId: string, value: number, isCrit: boolean, isSkill: boolean) => {
        const id = Date.now() + Math.random();
        setDamagePopups(prev => [...prev, { id, value, targetId, isCrit, isSkill }]);
        setTimeout(() => {
            setDamagePopups(prev => prev.filter(p => p.id !== id));
        }, 800);
    };

    const executeAttack = useCallback((attacker: any, target: any, isPlayerAttacker: boolean, skillId?: string) => {
        // Trigger Visual Dash
        const attackerId = isPlayerAttacker ? attacker.id : target.instanceId; // Logical ID check
        setAttackingUnitId(isPlayerAttacker ? attacker.id : target.instanceId);
        
        setTimeout(() => {
            const skill = skillId ? SKILLS[skillId] : null;
            const multiplier = skill ? skill.multiplier : 1.0;
            const mpCost = skill ? skill.mpCost : 0;

            const res = calculateCombatResult(
                isPlayerAttacker ? attacker.derived : attacker.stats,
                isPlayerAttacker ? target.stats : target.derived,
                isPlayerAttacker ? attacker.job : 'Fighter' as any,
                isPlayerAttacker ? (attacker.derived.magicalAttack > attacker.derived.physicalAttack ? 'MAGICAL' : 'PHYSICAL') : 'PHYSICAL',
                multiplier
            );

            if (isPlayerAttacker) {
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
                        setTimeout(() => setEnemySquadState(curr => curr.map(currE => currE.instanceId === target.instanceId ? { ...currE, lastDamaged: false } : currE)), 200);
                        return next;
                    }
                    return e;
                }));
                
                if (skill) {
                    setPartyState(prev => prev.map(p => p.id === attacker.id ? { ...p, currentMp: Math.max(0, p.currentMp - mpCost) } : p));
                    addLog(`${attacker.name.split(' ')[0]} used ${skill.name}!`, 'PLAYER', res.isCrit, true);
                } else {
                    addLog(`${attacker.name.split(' ')[0]} hits ${target.name} for ${res.damage}`, 'PLAYER', res.isCrit);
                }
            } else {
                setPartyState(prev => prev.map(p => {
                    if (p.id === target.id) {
                        const next = { ...p, lastDamaged: res.isHit };
                        if (res.isHit) {
                            next.currentHp = Math.max(0, next.currentHp - res.damage);
                            triggerDamagePopup(p.id, res.damage, res.isCrit, false);
                        }
                        setTimeout(() => setPartyState(curr => curr.map(c => c.id === p.id ? { ...c, lastDamaged: false } : c)), 200);
                        return next;
                    }
                    return p;
                }));
                addLog(`${attacker.name} strikes ${target.name.split(' ')[0]} for ${res.damage}`, 'ENEMY');
            }
            
            // End Animation
            setTimeout(() => setAttackingUnitId(null), 150);
        }, 200); // Wait for dash to peak
    }, [addLog]);

    const processLoop = useCallback(() => {
        if (isPaused || activeActorId || attackingUnitId) return;

        setPartyState(prevParty => {
            const nextParty = [...prevParty];
            setEnemySquadState(prevEnemySquad => {
                const nextEnemySquad = [...prevEnemySquad];

                // 1. Tick Gauges
                nextParty.forEach(p => { if (p.currentHp > 0) p.gauge += p.derived.speed * 0.5; });
                nextEnemySquad.forEach(e => { if (e.currentHp > 0) e.gauge += e.stats.speed * 0.5; });

                // 2. Player Turns
                const readyMerc = nextParty.find(p => p.currentHp > 0 && p.gauge >= ACTION_THRESHOLD);
                if (readyMerc) {
                    const livingEnemies = nextEnemySquad.filter(e => e.currentHp > 0);
                    if (livingEnemies.length > 0) {
                        const targetEnemy = livingEnemies[0]; 
                        if (isAuto) {
                            readyMerc.gauge -= ACTION_THRESHOLD;
                            let chosenSkillId: string | undefined = undefined;
                            if (readyMerc.skillIds && readyMerc.skillIds.length > 0) {
                                const availableSkills = readyMerc.skillIds.map(id => SKILLS[id]).filter(s => readyMerc.currentMp >= s.mpCost);
                                if (availableSkills.length > 0) {
                                    chosenSkillId = availableSkills.sort((a, b) => b.multiplier - a.multiplier)[0].id;
                                }
                            }
                            executeAttack(readyMerc, targetEnemy, true, chosenSkillId);
                        } else {
                            setActiveActorId(readyMerc.id);
                        }
                    }
                }

                // 3. Enemy Turns
                const readyEnemy = nextEnemySquad.find(e => e.currentHp > 0 && e.gauge >= ACTION_THRESHOLD);
                if (readyEnemy && !activeActorId && !attackingUnitId) {
                    const livingPlayers = nextParty.filter(p => p.currentHp > 0);
                    if (livingPlayers.length > 0) {
                        readyEnemy.gauge -= ACTION_THRESHOLD;
                        const targetPlayer = livingPlayers[Math.floor(Math.random() * livingPlayers.length)];
                        executeAttack(readyEnemy, targetPlayer, false);
                    }
                }

                return nextEnemySquad;
            });
            return nextParty;
        });
    }, [isPaused, isAuto, activeActorId, attackingUnitId, executeAttack]);

    useEffect(() => {
        battleInterval.current = setInterval(processLoop, 100);
        return () => { if (battleInterval.current) clearInterval(battleInterval.current); };
    }, [processLoop]);

    const handleManualCommand = (type: 'ATTACK' | 'FLEE' | 'SKILL', skillId?: string) => {
        if (!activeActorId) return;
        const actor = partyState.find(p => p.id === activeActorId);
        const livingEnemies = enemySquadState.filter(e => e.currentHp > 0);
        if (!actor || livingEnemies.length === 0) return;

        if (type === 'ATTACK' || (type === 'SKILL' && skillId)) {
            setPartyState(prev => prev.map(p => p.id === activeActorId ? { ...p, gauge: p.gauge - ACTION_THRESHOLD } : p));
            executeAttack(actor, livingEnemies[0], true, skillId);
            setActiveActorId(null);
        } else if (type === 'FLEE') {
            const roll = Math.random() * 100;
            if (roll < fleeChance) {
                onFlee(partyState);
            } else {
                addLog(`${actor.name.split(' ')[0]} failed to find escape route!`, 'SYSTEM');
                setPartyState(prev => prev.map(p => p.id === activeActorId ? { ...p, gauge: p.gauge - ACTION_THRESHOLD } : p));
                setActiveActorId(null);
            }
        }
    };

    useEffect(() => {
        if (enemySquadState.every(e => e.currentHp <= 0)) {
            setIsPaused(true);
            setTimeout(() => onFinish(true, partyState), 1200);
        } else if (partyState.every(p => p.currentHp <= 0)) {
            setIsPaused(true);
            setTimeout(() => onFinish(false, partyState), 1200);
        }
    }, [enemySquadState, partyState, onFinish]);

    // UI Helper for Attack Dash
    const getUnitStyle = (id: string, side: 'PLAYER' | 'ENEMY'): React.CSSProperties => {
        if (attackingUnitId !== id) return {};
        
        let transform = '';
        if (orientation === 'PORTRAIT') {
            transform = side === 'PLAYER' ? 'translateY(-120px) scale(1.1)' : 'translateY(120px) scale(1.1)';
        } else {
            transform = side === 'PLAYER' ? 'translateX(120px) scale(1.1)' : 'translateX(-120px) scale(1.1)';
        }
        
        return { transform, zIndex: 100 };
    };

    return (
        <div className="fixed inset-0 z-[150] flex flex-col bg-stone-950 animate-in fade-in duration-500 overflow-hidden select-none font-sans">
            <style>{`
                @keyframes damage-float {
                    0% { transform: translateY(0) scale(0.8); opacity: 0; }
                    20% { opacity: 1; scale: 1.2; }
                    100% { transform: translateY(-60px) scale(1.0); opacity: 0; }
                }
                .animate-damage { animation: damage-float 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                
                @keyframes unit-shake {
                    0%, 100% { transform: translate(0,0); }
                    25% { transform: translate(-4px, 2px); }
                    50% { transform: translate(4px, -2px); }
                    75% { transform: translate(-2px, -4px); }
                }
                .animate-hit { animation: unit-shake 0.2s ease-in-out 3; }
            `}</style>

            {/* Top Toolbar */}
            <div className="p-3 bg-red-950/20 border-b border-red-900/30 flex justify-between items-center shrink-0 z-[200]">
                <div className="flex items-center gap-2">
                    <Skull className="w-4 h-4 text-red-50" />
                    <h2 className="text-white font-black uppercase text-[10px] md:text-sm tracking-widest font-mono">Combat Zone</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsAuto(!isAuto)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${isAuto ? 'bg-amber-600 border-amber-400 text-white shadow-glow-sm' : 'bg-stone-800 border-stone-600 text-stone-400'}`}
                    >
                        {isAuto ? <FastForward className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                        {isAuto ? 'AUTO' : 'MANUAL'}
                    </button>
                </div>
            </div>

            <div className={`flex-1 flex relative overflow-hidden transition-all duration-700 ${orientation === 'PORTRAIT' ? 'flex-col' : 'flex-row'}`}>
                {/* Visual Background Decor */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {/* SQUAD AREA 1 (Top in Portrait / Right in Landscape) */}
                <div className={`flex flex-1 items-center justify-center p-4 gap-3 md:gap-6 ${orientation === 'PORTRAIT' ? 'order-1' : 'order-2'}`}>
                    {enemySquadState.map((e) => (
                        <div 
                            key={e.instanceId} 
                            style={getUnitStyle(e.instanceId, 'ENEMY')}
                            className={`relative flex flex-col items-center transition-all duration-300 ease-out ${e.currentHp <= 0 ? 'grayscale opacity-20 scale-90' : e.lastDamaged ? 'animate-hit' : ''}`}
                        >
                            <div className={`w-16 h-16 md:w-32 md:h-32 bg-stone-900/60 rounded-2xl border-2 flex items-center justify-center relative shadow-2xl transition-colors ${e.lastDamaged ? 'border-red-500 bg-red-950/20' : 'border-stone-800'} ${attackingUnitId === e.instanceId ? 'ring-4 ring-red-500/40' : ''}`}>
                                <div className="w-[85%] h-[85%] flex items-center justify-center relative overflow-hidden">
                                    <img 
                                        src={getAssetUrl(e.sprite || 'giant_rat.png', 'monsters')} 
                                        className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]" 
                                        alt={e.name}
                                    />
                                </div>
                                
                                {/* Damage Popups */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {damagePopups.filter(p => p.targetId === e.instanceId).map(p => (
                                        <div key={p.id} className={`absolute font-black text-2xl md:text-4xl animate-damage drop-shadow-[0_4px_6px_rgba(0,0,0,1)] ${p.isSkill ? 'text-blue-400' : p.isCrit ? 'text-amber-400' : 'text-red-500'}`}>
                                            -{p.value}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {e.currentHp > 0 && (
                                <div className="mt-2 w-16 md:w-32 space-y-1">
                                    <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                        <div className="h-full bg-red-600 rounded-full transition-all duration-500" style={{ width: `${(e.currentHp/e.stats.maxHp)*100}%` }} />
                                    </div>
                                    <div className="h-1 bg-black rounded-full overflow-hidden border border-white/5">
                                        <div className="h-full bg-amber-500 transition-all duration-100" style={{ width: `${(e.gauge/ACTION_THRESHOLD)*100}%` }} />
                                    </div>
                                    <div className="text-[7px] font-black text-stone-500 text-center uppercase truncate tracking-[0.2em]">{e.name.split(' ')[0]}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* SQUAD AREA 2 (Bottom in Portrait / Left in Landscape) */}
                <div className={`flex flex-1 items-center justify-center p-4 gap-3 md:gap-6 ${orientation === 'PORTRAIT' ? 'order-3' : 'order-1'}`}>
                    {partyState.map((p) => {
                        const isActive = activeActorId === p.id;
                        const hpPer = (p.currentHp / p.derived.maxHp) * 100;
                        const isReady = p.gauge >= ACTION_THRESHOLD;

                        return (
                            <div 
                                key={p.id} 
                                style={getUnitStyle(p.id, 'PLAYER')}
                                className={`relative flex flex-col items-center transition-all duration-300 ease-out ${p.currentHp <= 0 ? 'grayscale opacity-20 scale-90' : isActive ? '-translate-y-2' : ''} ${p.lastDamaged ? 'animate-hit' : ''}`}
                            >
                                <div className={`w-16 h-16 md:w-32 md:h-32 bg-stone-900/60 rounded-2xl border-2 flex items-center justify-center relative shadow-2xl transition-all ${isActive ? 'border-amber-400 bg-amber-900/10 ring-4 ring-amber-500/20' : 'border-stone-800'} ${attackingUnitId === p.id ? 'ring-4 ring-amber-400/50' : ''}`}>
                                    <MercenaryPortrait mercenary={p} className="w-[85%] h-[85%] rounded-xl" />
                                    
                                    {isReady && !isAuto && p.currentHp > 0 && (
                                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-amber-500 rounded-full border-2 border-stone-900 flex items-center justify-center animate-bounce z-20 shadow-lg">
                                            <Zap className="w-3.5 h-3.5 text-stone-900 fill-stone-900" />
                                        </div>
                                    )}

                                    {/* Damage Popups */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        {damagePopups.filter(dp => dp.targetId === p.id).map(dp => (
                                            <div key={dp.id} className="absolute font-black text-2xl md:text-4xl animate-damage text-red-500 drop-shadow-[0_4px_6px_rgba(0,0,0,1)]">
                                                -{dp.value}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {p.currentHp > 0 && (
                                    <div className="mt-2 w-16 md:w-32 space-y-1">
                                        <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                            <div className={`h-full transition-all duration-500 ${hpPer < 30 ? 'bg-red-500 animate-pulse' : 'bg-red-600'}`} style={{ width: `${hpPer}%` }} />
                                        </div>
                                        <div className="h-1 bg-black rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-amber-500 transition-all duration-100" style={{ width: `${(p.gauge/ACTION_THRESHOLD)*100}%` }} />
                                        </div>
                                        
                                        <div className="flex justify-between items-center px-0.5">
                                            <span className="text-[7px] font-black text-stone-400 uppercase tracking-tighter truncate">{p.name.split(' ')[0]}</span>
                                            <div className="flex items-center gap-0.5">
                                                <Zap className="w-1.5 h-1.5 text-blue-400" />
                                                <span className="text-[6px] font-mono text-blue-400 font-black">{Math.floor(p.currentMp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Manual Action Menu */}
                                {isActive && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-[300] animate-in slide-in-from-top-4 duration-300">
                                        <div className="flex flex-col gap-2 bg-stone-900/95 backdrop-blur-xl border-2 border-amber-500 p-2 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] w-36 md:w-52">
                                            <button 
                                                onClick={() => handleManualCommand('ATTACK')}
                                                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-[10px] md:text-xs font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95"
                                            >
                                                <Sword className="w-3.5 h-3.5 text-amber-500" /> Attack
                                            </button>
                                            
                                            {p.skillIds?.map(id => {
                                                const skill = SKILLS[id];
                                                const canUse = p.currentMp >= (skill?.mpCost || 0);
                                                if (!skill) return null;
                                                return (
                                                    <button 
                                                        key={id}
                                                        disabled={!canUse}
                                                        onClick={() => handleManualCommand('SKILL', id)}
                                                        className={`w-full py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase flex flex-col items-center justify-center border-b-2 transition-all ${canUse ? 'bg-amber-600 border-amber-800 text-white hover:bg-amber-500 active:scale-95' : 'bg-stone-950 border-stone-800 text-stone-700'}`}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <Sparkles className="w-3 h-3" />
                                                            <span>{skill.name}</span>
                                                        </div>
                                                        <span className="text-[7px] opacity-70">{skill.mpCost} MP</span>
                                                    </button>
                                                );
                                            })}

                                            <button 
                                                onClick={() => handleManualCommand('FLEE')}
                                                className="w-full py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-500 rounded-xl text-[9px] md:text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"
                                            >
                                                <LogOut className="w-3 h-3" /> Retreat
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Message Hub (Middle) */}
                <div className={`flex items-center justify-center z-50 pointer-events-none transition-all duration-700 ${orientation === 'PORTRAIT' ? 'order-2 h-16 w-full' : 'absolute inset-0 pointer-events-none'}`}>
                    <div className="bg-stone-900/90 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2">
                         <Activity className={`w-3.5 h-3.5 text-red-500 ${isPaused ? '' : 'animate-pulse'}`} />
                         <span className="text-[10px] md:text-sm font-mono font-black text-stone-200 uppercase tracking-widest truncate max-w-[220px] md:max-w-md">
                            {logs[0]?.msg || "Syncing combat data..."}
                         </span>
                    </div>
                </div>
            </div>

            {/* Tactical Feed (Footer) */}
            <div className={`bg-stone-900 border-t border-stone-800 transition-all duration-500 flex flex-col shrink-0 z-[200] ${showLogs ? 'h-48 md:h-60' : 'h-10 md:h-12'}`}>
                <button 
                    onClick={() => setShowLogs(!showLogs)}
                    className="w-full h-full flex items-center justify-between px-4 bg-stone-950/40 hover:bg-stone-950/60 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-stone-500" />
                        <span className="text-[9px] md:text-[11px] font-black text-stone-400 uppercase tracking-[0.2em] font-mono">Real-time Engagement Feed</span>
                    </div>
                    {showLogs ? <ChevronDown className="w-4 h-4 text-stone-600" /> : <ChevronUp className="w-4 h-4 text-stone-600" />}
                </button>
                
                <div className={`flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 bg-stone-950/30 ${showLogs ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {logs.map((log, idx) => (
                        <div key={idx} className={`text-[10px] md:text-[11px] font-mono px-4 py-1.5 border-l-4 rounded-r-md ${log.isSkill ? 'border-amber-400 bg-amber-900/10' : log.team === 'PLAYER' ? 'border-blue-500 text-blue-100 bg-blue-900/5' : log.team === 'ENEMY' ? 'border-red-500 text-red-100 bg-red-900/5' : 'border-stone-500 text-stone-400'}`}>
                            <span className="opacity-20 mr-3 text-[9px] font-bold">{new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}</span>
                            {log.msg}
                        </div>
                    ))}
                    {logs.length === 0 && <div className="h-full flex items-center justify-center text-stone-800 italic text-[10px] md:text-sm uppercase tracking-widest opacity-40 font-mono">Initializing tactical arrays...</div>}
                </div>
            </div>
        </div>
    );
};

export default DungeonCombatView;
