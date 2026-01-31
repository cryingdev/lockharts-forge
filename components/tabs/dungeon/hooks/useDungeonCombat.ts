import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Mercenary } from '../../../../models/Mercenary';
import { Monster } from '../../../../models/Monster';
import { ManualDungeonSession } from '../../../../types/game-state';
import { calculateCombatResult } from '../../../../utils/combatLogic';
import { calculateDerivedStats, applyEquipmentBonuses, mergePrimaryStats } from '../../../../models/Stats';
import { useGame } from '../../../../context/GameContext';
import { SKILLS } from '../../../../data/skills';
import { JobClass } from '../../../../models/JobClass';
import { materials } from '../../../../data/materials';

const ACTION_THRESHOLD = 1000;

export interface CombatLogEntry {
    msg: string;
    team: 'PLAYER' | 'ENEMY' | 'SYSTEM';
    isCrit?: boolean;
    isSkill?: boolean;
    isHeal?: boolean;
    isBuff?: boolean;
    isDebuff?: boolean;
}

export interface DamagePopup {
    id: number;
    value: number | string;
    targetId: string;
    isCrit: boolean;
    isSkill: boolean;
    type: 'DAMAGE' | 'HEAL' | 'BUFF' | 'DEBUFF';
    element?: 'PHYSICAL' | 'MAGICAL' | 'PURE';
}

interface QueuedAction {
    type: 'ATTACK' | 'SKILL' | 'ITEM';
    id?: string; // skillId or itemId
    targetId: string;
    targetSide: 'PLAYER' | 'ENEMY';
}

export const useDungeonCombat = (
    session: ManualDungeonSession,
    party: Mercenary[],
    enemies: Monster[],
    fleeChance: number,
    onFinish: (win: boolean, finalParty: any[]) => void,
    onFlee: (finalParty: any[]) => void
) => {
    const { actions, state } = useGame();
    
    // Units State
    const [partyState, setPartyState] = useState(party.map(m => {
        const primary = mergePrimaryStats(m.stats, m.allocatedStats);
        const derived = applyEquipmentBonuses(calculateDerivedStats(primary, m.level), (Object.values(m.equipment) as any[]).map(e=>e?.stats).filter(Boolean) as any);
        return { ...m, derived, currentHp: m.currentHp, currentMp: m.currentMp, gauge: 0, lastDamaged: false, lastHealed: false, lastBuffed: false, lastDebuffed: false, statusAilments: [] as string[] };
    }));
    
    const [enemySquadState, setEnemySquadState] = useState(enemies.map((e, idx) => ({
        ...e,
        instanceId: `enemy_${idx}`,
        gauge: 0,
        lastDamaged: false,
        lastHealed: false,
        lastBuffed: false,
        lastDebuffed: false,
        hasUsedRevival: false,
        statusAilments: [] as string[]
    })));

    // Feedback State
    const [logs, setLogs] = useState<CombatLogEntry[]>([]);
    const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
    const [skillBanner, setSkillBanner] = useState<{ name: string, team: 'PLAYER' | 'ENEMY' } | null>(null);
    const [isScreenShaking, setIsScreenShaking] = useState(false);

    // Settings
    const [isAuto, setIsAuto] = useState(() => localStorage.getItem('dungeon_combat_auto') !== 'false');
    const [battleSpeed, setBattleSpeed] = useState<1 | 2 | 4>(() => {
        const s = parseInt(localStorage.getItem('dungeon_combat_speed') || '1');
        return (s === 1 || s === 2 || s === 4) ? s as any : 1;
    });

    // Control Flow
    const [isPaused, setIsPaused] = useState(false);
    const [activeActorId, setActiveActorId] = useState<string | null>(null); 
    const [attackingUnitId, setAttackingUnitId] = useState<string | null>(null);
    const [focusedUnitId, setFocusedUnitId] = useState<string | null>(null); 
    const [commandMode, setCommandMode] = useState<'MAIN' | 'SKILL'>('MAIN');
    const [pendingAction, setPendingAction] = useState<{ type: 'ATTACK' | 'SKILL' | 'ITEM', id?: string } | null>(null);
    
    // New: Queued actions for units
    const [queuedActions, setQueuedActions] = useState<Record<string, QueuedAction>>({});

    const battleInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const speedRef = useRef(1);

    useEffect(() => {
        speedRef.current = battleSpeed;
        localStorage.setItem('dungeon_combat_speed', battleSpeed.toString());
    }, [battleSpeed]);

    useEffect(() => {
        localStorage.setItem('dungeon_combat_auto', isAuto.toString());
    }, [isAuto]);

    // Handle Auto-switch during active manual turn
    useEffect(() => {
        if (isAuto && activeActorId) {
            setActiveActorId(null);
            setPendingAction(null);
            setCommandMode('MAIN');
        }
    }, [isAuto, activeActorId]);

    const addLog = useCallback((entry: CombatLogEntry) => {
        setLogs(prev => [entry, ...prev].slice(0, 50));
    }, []);

    const triggerDamagePopup = useCallback((targetId: string, value: number | string, isCrit: boolean, isSkill: boolean, type: DamagePopup['type'], element?: DamagePopup['element']) => {
        const id = Date.now() + Math.random();
        setDamagePopups(prev => [...prev, { id, value, targetId, isCrit, isSkill, type, element }]);
        setTimeout(() => {
            setDamagePopups(prev => prev.filter(p => p.id !== id));
        }, 1000 / speedRef.current);
    }, []);

    const executeItemEffect = useCallback((itemId: string, target: any) => {
        const itemDef = materials[itemId];
        if (!itemDef) return;

        // Potions usually restore HP/MP/Stamina
        const parts = itemId.split('_');
        const type = parts[1]; // health, mana, energy, stamina
        const size = parts[2]; // small, medium, large, huge
        
        const effects: Record<string, Record<string, number>> = {
            health: { small: 50, medium: 150, large: 400, huge: 9999 },
            mana: { small: 30, medium: 100, large: 250, huge: 9999 },
            stamina: { small: 25, medium: 50, large: 75, huge: 100 },
            energy: { small: 20, medium: 45, large: 75, huge: 100 }
        };

        const amount = effects[type]?.[size] || 0;
        
        if (type === 'health') {
            setPartyState(prev => prev.map(p => p.id === target.id ? { ...p, currentHp: Math.min(p.derived.maxHp, p.currentHp + amount), lastHealed: true } : p));
            setTimeout(() => setPartyState(curr => curr.map(p => p.id === target.id ? { ...p, lastHealed: false } : p)), 800 / speedRef.current);
            triggerDamagePopup(target.id, amount, false, false, 'HEAL');
        } else if (type === 'mana') {
            setPartyState(prev => prev.map(p => p.id === target.id ? { ...p, currentMp: Math.min(p.derived.maxMp, p.currentMp + amount), lastHealed: true } : p));
            setTimeout(() => setPartyState(curr => curr.map(p => p.id === target.id ? { ...p, lastHealed: false } : p)), 800 / speedRef.current);
            triggerDamagePopup(target.id, amount, false, false, 'HEAL');
        }

        // Consume the item globally
        actions.consumeItem(itemId, 1);
        addLog({ msg: `Used ${itemDef.name} on ${target.name}`, team: 'PLAYER', isSkill: true, isHeal: true });
        
        setSkillBanner({ name: itemDef.name, team: 'PLAYER' });
        setTimeout(() => setSkillBanner(null), 1000 / speedRef.current);
    }, [actions, addLog, triggerDamagePopup]);

    const executeAction = useCallback((attacker: any, representativeTarget: any, isPlayerSide: boolean, skillId?: string, itemId?: string) => {
        if (!attacker || !representativeTarget) return;

        if (itemId) {
            executeItemEffect(itemId, representativeTarget);
            return;
        }
        
        const skill = skillId ? SKILLS[skillId] : null;
        const isAoe = skill?.targetType === 'ALL_ENEMIES' || skill?.targetType === 'ALL_ALLIES';
        const mpCost = skill?.mpCost ?? 0;

        let targets: any[] = [];
        if (isAoe) {
            const isOffensive = skill?.tags.includes('DAMAGE') || skill?.tags.includes('DEBUFF');
            if (isOffensive) targets = isPlayerSide ? enemySquadState.filter(e => e.currentHp > 0) : partyState.filter(p => p.currentHp > 0);
            else targets = isPlayerSide ? partyState.filter(p => p.currentHp > 0) : enemySquadState.filter(e => e.currentHp > 0);
        } else {
            targets = [representativeTarget];
        }

        if (targets.length === 0) return;

        if (skill) {
            setSkillBanner({ name: skill.name, team: isPlayerSide ? 'PLAYER' : 'ENEMY' });
            setTimeout(() => setSkillBanner(null), 1200 / speedRef.current);
        }

        const isHarmful = skill?.tags.includes('DAMAGE') || skill?.tags.includes('DEBUFF') || !skill;
        if (isHarmful) {
            setAttackingUnitId(isPlayerSide ? attacker.id : attacker.instanceId);
        }
        
        if (isPlayerSide) {
            setPartyState(prev => prev.map(p => p.id === attacker.id ? { ...p, currentMp: Math.max(0, p.currentMp - mpCost) } : p));
        }

        setTimeout(() => {
            let shakeStrength = isAoe ? true : false;

            targets.forEach(target => {
                const targetId = isPlayerSide 
                    ? (skill?.tags.includes('HEAL') || skill?.tags.includes('BUFF') || itemId ? target.id : target.instanceId)
                    : (skill?.tags.includes('HEAL') || skill?.tags.includes('BUFF') ? target.instanceId : target.id);

                if (skill?.tags.includes('HEAL')) {
                    const multiplier = skill.multiplier ?? 1.0;
                    const baseHeal = Math.round((attacker.derived?.magicalAttack || attacker.stats.magicalAttack || 10) * multiplier);
                    const isCrit = Math.random() * 100 <= (attacker.derived?.critChance || 0);
                    const finalHeal = isCrit ? Math.round(baseHeal * 1.5) : baseHeal;

                    if (target.instanceId) {
                        setEnemySquadState(prev => prev.map(e => e.instanceId === target.instanceId ? { ...e, currentHp: Math.min(e.stats.maxHp, e.currentHp + finalHeal), lastHealed: true } : e));
                        setTimeout(() => setEnemySquadState(curr => curr.map(e => e.instanceId === target.instanceId ? { ...e, lastHealed: false } : e)), 800 / speedRef.current);
                    } else {
                        setPartyState(prev => prev.map(p => p.id === target.id ? { ...p, currentHp: Math.min(p.derived.maxHp, p.currentHp + finalHeal), lastHealed: true } : p));
                        setTimeout(() => setPartyState(curr => curr.map(p => p.id === target.id ? { ...p, lastHealed: false } : p)), 800 / speedRef.current);
                    }
                    triggerDamagePopup(targetId, finalHeal, isCrit, true, 'HEAL');
                    window.dispatchEvent(new CustomEvent('play-sfx', { detail: { file: 'click_light.wav' } }));
                } 
                else if (skill?.tags.includes('BUFF')) {
                    const applyToSide = (side: any[]) => side.map(u => (u.id === target.id || u.instanceId === target.instanceId) ? { ...u, lastBuffed: true, statusAilments: Array.from(new Set([...u.statusAilments, 'BUFF'])) } : u);
                    if (target.instanceId) setEnemySquadState(prev => applyToSide(prev));
                    else setPartyState(prev => applyToSide(prev));
                    
                    setTimeout(() => {
                        const removeEffect = (side: any[]) => side.map(u => (u.id === target.id || u.instanceId === target.instanceId) ? { ...u, lastBuffed: false } : u);
                        if (target.instanceId) setEnemySquadState(prev => removeEffect(prev));
                        else setPartyState(prev => removeEffect(prev));
                    }, 800 / speedRef.current);

                    triggerDamagePopup(targetId, "BUFF", false, true, 'BUFF');
                }
                else if (skill?.tags.includes('DEBUFF')) {
                    const applyToSide = (side: any[]) => side.map(u => (u.id === target.id || u.instanceId === target.instanceId) ? { ...u, lastDebuffed: true, statusAilments: Array.from(new Set([...u.statusAilments, 'DEBUFF'])) } : u);
                    if (target.instanceId) setEnemySquadState(prev => applyToSide(prev));
                    else setPartyState(prev => applyToSide(prev));

                    setTimeout(() => {
                        const removeEffect = (side: any[]) => side.map(u => (u.id === target.id || u.instanceId === target.instanceId) ? { ...u, lastDebuffed: false } : u);
                        if (target.instanceId) setEnemySquadState(prev => removeEffect(prev));
                        else setPartyState(prev => removeEffect(prev));
                    }, 800 / speedRef.current);

                    triggerDamagePopup(targetId, "WEAK", false, true, 'DEBUFF');
                }
                else {
                    const type = isPlayerSide ? (attacker.derived.magicalAttack > attacker.derived.physicalAttack ? 'MAGICAL' : 'PHYSICAL') : (skill?.damageType === 'MAGICAL' ? 'MAGICAL' : 'PHYSICAL');
                    const res = calculateCombatResult(
                        isPlayerSide ? attacker.derived : attacker.stats,
                        isPlayerSide ? target.stats : target.derived,
                        isPlayerSide ? attacker.job : JobClass.FIGHTER,
                        type,
                        skill?.multiplier ?? 1.0
                    );

                    if (res.isHit) {
                        if (res.isCrit) shakeStrength = true;
                        window.dispatchEvent(new CustomEvent('play-sfx', { detail: { file: 'battle_slash.mp3' } }));
                        
                        const applyDmg = (u: any) => {
                            let nextHp = Math.max(0, u.currentHp - res.damage);
                            if (nextHp <= 0 && u.id === 'phoenix' && !u.hasUsedRevival) {
                                nextHp = u.stats.maxHp;
                                u.hasUsedRevival = true;
                                addLog({ msg: "Phoenix rebirth triggered!", team: 'ENEMY', isCrit: true, isSkill: true });
                            }
                            return { ...u, currentHp: nextHp, lastDamaged: true };
                        };

                        if (target.instanceId) {
                            setEnemySquadState(prev => prev.map(e => e.instanceId === target.instanceId ? applyDmg(e) : e));
                            setTimeout(() => setEnemySquadState(curr => curr.map(e => e.instanceId === target.instanceId ? { ...e, lastDamaged: false } : e)), 300 / speedRef.current);
                        } else {
                            setPartyState(prev => prev.map(p => p.id === target.id ? applyDmg(p) : p));
                            setTimeout(() => setPartyState(curr => curr.map(p => p.id === target.id ? { ...p, lastDamaged: false } : p)), 300 / speedRef.current);
                        }
                        triggerDamagePopup(targetId, res.damage, res.isCrit, !!skill, 'DAMAGE', type);
                    } else {
                        window.dispatchEvent(new CustomEvent('play-sfx', { detail: { file: 'swing_miss.mp3' } }));
                        triggerDamagePopup(targetId, "MISS", false, !!skill, 'DAMAGE');
                    }
                }
            });

            if (shakeStrength) {
                setIsScreenShaking(true);
                setTimeout(() => setIsScreenShaking(false), 400);
            }

            if (skill) {
                addLog({ msg: `${attacker.name} uses ${skill.name}${isAoe ? ' on everyone' : ''}!`, team: isPlayerSide ? 'PLAYER' : 'ENEMY', isSkill: true, isHeal: skill.tags.includes('HEAL'), isBuff: skill.tags.includes('BUFF'), isDebuff: skill.tags.includes('DEBUFF') });
            } else if (!isAoe) {
                addLog({ msg: `${attacker.name} strikes ${representativeTarget.name}`, team: isPlayerSide ? 'PLAYER' : 'ENEMY' });
            }

            setTimeout(() => setAttackingUnitId(null), 150 / speedRef.current);
        }, 300 / speedRef.current);
    }, [addLog, triggerDamagePopup, enemySquadState, partyState, executeItemEffect]);

    const processLoop = useCallback(() => {
        if (isPaused || activeActorId || attackingUnitId) return;

        const enemiesDefeated = enemySquadState.every(e => e.currentHp <= 0);
        const partyDefeated = partyState.every(p => p.currentHp <= 0);

        if (enemiesDefeated) { setIsPaused(true); setTimeout(() => onFinish(true, partyState), 800 / speedRef.current); return; }
        if (partyDefeated) { setIsPaused(true); setTimeout(() => onFinish(false, partyState), 800 / speedRef.current); return; }

        setPartyState(prev => {
            const next = [...prev];
            let readyMerc = null;
            for (let p of next) {
                if (p.currentHp > 0) {
                    p.gauge += (p.derived.speed * 0.22 * speedRef.current); 
                    if (p.gauge >= ACTION_THRESHOLD && !readyMerc) readyMerc = p;
                }
            }

            if (readyMerc && !attackingUnitId) {
                const queued = queuedActions[readyMerc.id];
                if (queued) {
                    readyMerc.gauge -= ACTION_THRESHOLD;
                    const target = queued.targetSide === 'ENEMY' 
                        ? enemySquadState.find(e => e.instanceId === queued.targetId)
                        : next.find(p => p.id === queued.targetId);
                    
                    if (target && target.currentHp > 0) {
                        executeAction(readyMerc, target, true, queued.type === 'SKILL' ? queued.id : undefined, queued.type === 'ITEM' ? queued.id : undefined);
                    }
                    
                    setQueuedActions(prevQ => {
                        const nextQ = { ...prevQ };
                        delete nextQ[readyMerc.id];
                        return nextQ;
                    });
                    
                    if (readyMerc.id === activeActorId) setActiveActorId(null);
                } else if (isAuto) {
                    readyMerc.gauge -= ACTION_THRESHOLD;
                    const livingEnemies = enemySquadState.filter(e => e.currentHp > 0);
                    const livingAllies = next.filter(p => p.currentHp > 0);
                    const availableSkillIds = [...(readyMerc.skillIds || []), ...Object.values(readyMerc.equipment || {}).map(i => (i as any)?.socketedSkillId).filter(Boolean) as string[]];
                    let sid = undefined;
                    let target: any = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
                    if (availableSkillIds.length > 0) {
                        const skillId = availableSkillIds[Math.floor(Math.random() * availableSkillIds.length)];
                        const skill = SKILLS[skillId];
                        if (skill && readyMerc.currentMp >= (skill.mpCost ?? 0) && Math.random() < 0.45) {
                            sid = skillId;
                            if (skill.tags.includes('HEAL') || skill.tags.includes('BUFF')) target = [...livingAllies].sort((a,b) => (a.currentHp/a.derived.maxHp) - (b.currentHp/b.derived.maxHp))[0];
                        }
                    }
                    executeAction(readyMerc, target, true, sid);
                } else {
                    setActiveActorId(readyMerc.id);
                    setFocusedUnitId(readyMerc.id); 
                    setCommandMode('MAIN'); 
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
                    e.gauge += (e.stats.speed * 0.22 * speedRef.current); 
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
    }, [isPaused, isAuto, activeActorId, attackingUnitId, enemySquadState, partyState, executeAction, onFinish, queuedActions]);

    useEffect(() => {
        battleInterval.current = setInterval(processLoop, 100);
        return () => { if (battleInterval.current) clearInterval(battleInterval.current); };
    }, [processLoop]);

    const handleManualAction = useCallback((e: React.MouseEvent | null, type: 'ATTACK' | 'SKILL' | 'ITEM', id?: string) => {
        if (e) e.stopPropagation(); 
        if (!focusedUnitId) return;
        
        if (type === 'SKILL' && !id) { setCommandMode('SKILL'); return; }
        
        if (type === 'SKILL' && id) {
            const skill = SKILLS[id];
            const actor = partyState.find(p => p.id === focusedUnitId);
            if (!actor || actor.currentMp < (skill?.mpCost ?? 0)) { actions.showToast("Not enough MP!"); return; }
        }
        
        setPendingAction({ type, id });
        actions.showToast(`Select a target for ${type === 'ITEM' ? materials[id!]?.name : type === 'SKILL' ? SKILLS[id!]?.name : 'Attack'}`);
    }, [focusedUnitId, partyState, actions]);

    const handleTargetClick = useCallback((target: any, side: 'PLAYER' | 'ENEMY') => {
        if (!focusedUnitId || !pendingAction) return;
        if (target.currentHp <= 0 && side === 'ENEMY') return;

        const actor = partyState.find(p => p.id === focusedUnitId);
        if (!actor) return;

        const skill = (pendingAction.type === 'SKILL' && pendingAction.id) ? SKILLS[pendingAction.id] : null;
        const isSupportive = pendingAction.type === 'ITEM' || (skill?.tags.includes('HEAL') || skill?.tags.includes('BUFF'));

        if (!isSupportive && side === 'PLAYER' && pendingAction.type === 'ATTACK') return;
        if (!isSupportive && side === 'PLAYER' && skill && !skill.tags.includes('DAMAGE')) return;
        if (isSupportive && side === 'ENEMY') return;

        if (actor.gauge >= ACTION_THRESHOLD && !attackingUnitId) {
            setPartyState(prev => prev.map(p => p.id === focusedUnitId ? { ...p, gauge: p.gauge - ACTION_THRESHOLD } : p));
            executeAction(actor, target, true, pendingAction.type === 'SKILL' ? pendingAction.id : undefined, pendingAction.type === 'ITEM' ? pendingAction.id : undefined);
            if (actor.id === activeActorId) setActiveActorId(null);
        } else {
            setQueuedActions(prev => ({
                ...prev,
                [actor.id]: { type: pendingAction.type, id: pendingAction.id, targetId: target.instanceId || target.id, targetSide: side }
            }));
            actions.showToast("Action queued. Waiting for turn...");
        }

        setPendingAction(null);
    }, [focusedUnitId, pendingAction, partyState, executeAction, activeActorId, actions, attackingUnitId]);

    const handleFlee = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (Math.random() * 100 < fleeChance) onFlee(partyState);
        else {
            window.dispatchEvent(new CustomEvent('play-sfx', { detail: { file: 'swing_miss.mp3' } }));
            addLog({ msg: "Escape failed!", team: 'SYSTEM' });
            setActiveActorId(null);
            setPendingAction(null);
            const actor = partyState.find(p => p.id === activeActorId);
            if (actor) setPartyState(prev => prev.map(p => p.id === actor.id ? { ...p, gauge: 0 } : p));
        }
    }, [fleeChance, onFlee, partyState, addLog, activeActorId]);

    return {
        partyState, enemySquadState, logs, damagePopups, skillBanner, isScreenShaking,
        isAuto, setIsAuto, battleSpeed, setBattleSpeed, isPaused, setIsPaused,
        activeActorId, attackingUnitId, focusedUnitId, setFocusedUnitId,
        commandMode, setCommandMode, pendingAction, queuedActions,
        handlers: {
            handleManualAction, handleTargetClick, handleFlee
        }
    };
};