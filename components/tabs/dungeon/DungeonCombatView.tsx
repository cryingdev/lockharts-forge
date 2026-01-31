import React, { useMemo } from 'react';
import { Target, Sparkles, Play, Pause, Clock } from 'lucide-react';
import { Mercenary } from '../../../models/Mercenary';
import { Monster } from '../../../models/Monster';
import { ManualDungeonSession } from '../../../types/game-state';
import { useGame } from '../../../context/GameContext';
import { SKILLS } from '../../../data/skills';
import { MercenaryPortrait } from '../../common/ui/MercenaryPortrait';
import { getAssetUrl } from '../../../utils';
import { SfxButton } from '../../common/ui/SfxButton';
import { useDungeonCombat } from './hooks/useDungeonCombat';
import { DUNGEONS } from '../../../data/dungeons';
import { UnitInspector } from './ui/UnitInspector';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const ACTION_THRESHOLD = 1000;

interface DungeonCombatViewProps {
    session: ManualDungeonSession;
    party: Mercenary[];
    enemies: Monster[];
    fleeChance: number;
    onFinish: (win: boolean, finalParty: any[]) => void;
    onFlee: (finalParty: any[]) => void;
}

const DungeonCombatView: React.FC<DungeonCombatViewProps> = (props) => {
    const { state, actions } = useGame();
    const [orientation, setOrientation] = React.useState<'PORTRAIT' | 'LANDSCAPE'>(
        window.innerWidth > window.innerHeight ? 'LANDSCAPE' : 'PORTRAIT'
    );

    const combat = useDungeonCombat(
        props.session, props.party, props.enemies, props.fleeChance, props.onFinish, props.onFlee
    );

    const {
        partyState, enemySquadState, damagePopups, skillBanner, isScreenShaking,
        isAuto, setIsAuto, battleSpeed, setBattleSpeed, isPaused, setIsPaused,
        activeActorId, attackingUnitId, focusedUnitId, setFocusedUnitId,
        commandMode, setCommandMode, pendingAction, queuedActions, handlers
    } = combat;

    React.useEffect(() => {
        const handleResize = () => setOrientation(window.innerWidth > window.innerHeight ? 'LANDSCAPE' : 'PORTRAIT');
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const dungeonDef = useMemo(() => 
        DUNGEONS.find(d => d.id === props.session.dungeonId), 
    [props.session.dungeonId]);

    const getUnitStyle = (id: string, side: 'PLAYER' | 'ENEMY'): React.CSSProperties => {
        const style: React.CSSProperties = { transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' };
        if (attackingUnitId === id) {
            let transform = orientation === 'PORTRAIT' 
                ? (side === 'PLAYER' ? 'translateY(-120px) scale(1.1)' : 'translateY(120px) scale(1.1)')
                : (side === 'PLAYER' ? 'translateX(120px) scale(1.1)' : 'translateX(-120px) scale(1.1)');
            style.transform = transform;
            style.zIndex = 100;
        }
        return style;
    };

    const focusedUnit = useMemo(() => partyState.find(p => p.id === focusedUnitId), [partyState, focusedUnitId]);
    const availablePotions = useMemo(() => state.inventory.filter(i => i.id.startsWith('potion_')), [state.inventory]);
    
    const isSupportiveAction = useMemo(() => {
        if (!pendingAction) return false;
        if (pendingAction.type === 'ITEM') return true;
        if (pendingAction.type === 'SKILL' && pendingAction.id) {
            const skill = SKILLS[pendingAction.id];
            return skill.tags.includes('HEAL') || skill.tags.includes('BUFF');
        }
        return false;
    }, [pendingAction]);

    return (
        <div className={`fixed inset-0 z-[150] flex flex-col bg-stone-950 animate-in fade-in duration-500 overflow-hidden font-sans pb-safe ${isScreenShaking ? 'animate-screen-shake' : ''}`}>
            <style>{`
                @keyframes damage-float { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-80px); opacity: 0; } }
                .animate-damage { animation: damage-float 1.2s ease-out forwards; }
                @keyframes heal-float { 0% { transform: translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateY(-80px) scale(1.2); opacity: 0; } }
                .animate-heal { animation: heal-float 1.2s ease-out forwards; }
                
                @keyframes crit-pop { 
                    0% { transform: translateY(0) scale(0.5); opacity: 0; } 
                    15% { transform: translateY(-10px) scale(1.3); opacity: 1; } 
                    25% { transform: translateY(-8px) scale(1.1); opacity: 1; }
                    80% { transform: translateY(-40px) scale(1.1); opacity: 1; } 
                    100% { transform: translateY(-60px) scale(1); opacity: 0; } 
                }
                .animate-crit-pop { animation: crit-pop 1.2s ease-out forwards; }

                @keyframes unit-shake { 0%, 100% { transform: translate(0,0); } 25% { transform: translate(-6px, 3px); } 50% { transform: translate(6px, -3px); } 75% { transform: translate(-3px, -6px); } }
                .animate-hit { animation: unit-shake 0.15s ease-in-out 3; }
                
                @keyframes screen-shake { 0% { transform: translate(0,0); } 10% { transform: translate(-8px, -8px); } 20% { transform: translate(8px, 8px); } 30% { transform: translate(-8px, 8px); } 40% { transform: translate(8px, -8px); } 100% { transform: translate(0,0); } }
                .animate-screen-shake { animation: screen-shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
                
                @keyframes banner-in { 0% { transform: scaleX(0); opacity: 0; } 15% { transform: scaleX(1.1); opacity: 1; } 25% { transform: scaleX(1); opacity: 1; } 85% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(0); opacity: 0; } }
                .animate-banner { animation: banner-in 1.2s cubic-bezier(0.23, 1, 0.32, 1) forwards; transform-origin: center; }

                @keyframes aura-pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
                .animate-ailment { animation: aura-pulse 2s ease-in-out infinite; }
            `}</style>

            {/* Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {dungeonDef?.tile && (
                    <img 
                        src={getAssetUrl(dungeonDef.tile, 'dungeons')} 
                        className="w-full h-full object-cover grayscale brightness-[0.2] blur-[1px] opacity-70"
                        alt="Battle Background"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-transparent to-stone-950/80" />
            </div>

            {/* Combat Field */}
            <div className={`flex-1 flex relative transition-all duration-700 z-10 ${orientation === 'PORTRAIT' ? 'flex-col' : 'flex-row'}`}>
                {/* Enemies Area */}
                <div className={`flex flex-1 items-center justify-center p-4 gap-6 md:gap-12 ${orientation === 'PORTRAIT' ? 'order-1' : 'order-2'}`}>
                    {enemySquadState.map(e => {
                        const isTargetable = !!pendingAction && e.currentHp > 0 && !isSupportiveAction;
                        return (
                            <div key={e.instanceId} style={getUnitStyle(e.instanceId, 'ENEMY')} onClick={() => isTargetable && handlers.handleTargetClick(e, 'ENEMY')} className={`relative flex flex-col items-center transition-all ${e.currentHp <= 0 ? 'opacity-10 grayscale blur-[2px]' : e.lastDamaged ? 'animate-hit' : ''}`}>
                                <div className={`w-24 h-24 md:w-48 md:h-48 bg-stone-900/40 rounded-3xl border-2 flex items-center justify-center relative shadow-2xl transition-all ${e.lastDamaged ? 'border-red-500 bg-red-950/20' : e.lastHealed ? 'border-emerald-400' : e.lastBuffed ? 'border-sky-400' : e.lastDebuffed ? 'border-purple-400' : e.id.includes('rat_king') ? 'border-amber-700' : 'border-stone-800/40'} ${isTargetable ? 'animate-target border-red-500 ring-4 ring-red-500/20 cursor-crosshair' : ''}`}>
                                    <img src={getAssetUrl(e.sprite || '', 'monsters')} className="w-[85%] h-[85%] object-contain drop-shadow-2xl" alt={e.name} />
                                    <div className="absolute -bottom-2 flex gap-1 z-30">
                                        {e.statusAilments.map((ail, i) => (
                                            <div key={i} className={`p-1 rounded-full border animate-ailment ${ail === 'BUFF' ? 'bg-sky-900/60 border-sky-400 text-sky-400' : 'bg-purple-900/60 border-purple-400 text-purple-400'}`}>
                                                {ail === 'BUFF' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                            </div>
                                        ))}
                                    </div>
                                    {isTargetable && <div className="absolute inset-0 flex items-center justify-center"><Target className="w-14 h-14 text-red-500 opacity-60 animate-ping" /></div>}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        {damagePopups.filter(p => p.targetId === e.instanceId).map(p => (
                                            <div key={p.id} className="absolute inset-0 flex items-center justify-center">
                                                {p.isCrit && (
                                                    <div className="absolute -top-16 md:-top-24 font-serif italic font-black text-red-500 text-sm md:text-3xl tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-crit-pop whitespace-nowrap z-50">
                                                        CRITICAL!
                                                    </div>
                                                )}
                                                <div className={`absolute font-black text-4xl md:text-6xl drop-shadow-glow ${
                                                    p.type === 'HEAL' ? 'animate-heal text-emerald-400' : 
                                                    p.type === 'BUFF' ? 'animate-heal text-sky-400' :
                                                    p.type === 'DEBUFF' ? 'animate-heal text-purple-400' :
                                                    p.value === 'MISS' ? 'animate-damage text-stone-400' :
                                                    p.element === 'MAGICAL' ? 'animate-damage text-blue-400' :
                                                    p.element === 'PURE' ? 'animate-damage text-amber-300' :
                                                    'animate-damage text-red-600'
                                                } ${p.isCrit ? 'scale-150 z-50' : ''}`}>
                                                    {p.type === 'HEAL' ? '+' : (p.type === 'DAMAGE' && typeof p.value === 'number') ? '-' : ''}{p.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {e.currentHp > 0 && (
                                    <div className="mt-3 w-24 md:w-52 space-y-1">
                                        <div className="flex flex-col items-center leading-none mb-1">
                                            <span className="text-[9px] md:text-xs font-black text-stone-300 uppercase tracking-tighter truncate w-full text-center">{e.name}</span>
                                        </div>
                                        <div className="relative h-1.5 bg-stone-950/60 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-red-700 transition-all duration-500 shadow-glow-sm" style={{ width: `${(e.currentHp/e.stats.maxHp)*100}%` }} />
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
                        const queued = queuedActions[p.id];

                        return (
                            <div key={p.id} style={getUnitStyle(p.id, 'PLAYER')} onClick={() => isTargetable ? handlers.handleTargetClick(p, 'PLAYER') : setFocusedUnitId(prev => prev === p.id ? null : p.id)} className={`relative flex flex-col items-center transition-all ${p.currentHp <= 0 ? 'opacity-20 grayscale' : isActive ? '-translate-y-6 scale-105' : ''} ${p.lastDamaged ? 'animate-hit' : ''}`}>
                                <div className={`w-24 h-24 md:w-48 md:h-48 bg-stone-900/40 rounded-3xl border-2 flex items-center justify-center relative shadow-2xl transition-all ${p.lastDamaged ? 'border-red-500 bg-red-950/20' : p.lastHealed ? 'border-emerald-400' : p.lastBuffed ? 'border-sky-400' : p.lastDebuffed ? 'border-purple-400' : isActive ? 'border-amber-400 ring-4 ring-amber-500/20 z-50' : isTargetable ? 'animate-heal-target border-emerald-500 ring-4 ring-emerald-500/30 cursor-pointer' : focusedUnitId === p.id ? 'border-blue-500 shadow-blue-900/40' : 'border-stone-800/40'}`}>
                                    <MercenaryPortrait mercenary={p} className="w-[88%] h-[88%] rounded-2xl drop-shadow-2xl" />
                                    
                                    {queued && (
                                        <div className="absolute -top-2 -right-2 z-40 bg-indigo-600 border border-indigo-400 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                                            <Clock className="w-2.5 h-2.5 text-white" />
                                            <span className="text-[7px] font-black text-white uppercase tracking-tighter">PLANNED</span>
                                        </div>
                                    )}

                                    <div className="absolute -bottom-2 flex gap-1 z-30">
                                        {p.statusAilments.map((ail, i) => (
                                            <div key={i} className={`p-1 rounded-full border animate-ailment ${ail === 'BUFF' ? 'bg-sky-900/60 border-sky-400 text-sky-400' : 'bg-purple-900/60 border-purple-400 text-purple-400'}`}>
                                                {ail === 'BUFF' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        {damagePopups.filter(pop => pop.targetId === p.id).map(pop => (
                                            <div key={pop.id} className="absolute inset-0 flex items-center justify-center">
                                                {pop.isCrit && (
                                                    <div className="absolute -top-16 md:-top-24 font-serif italic font-black text-red-500 text-sm md:text-3xl tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-crit-pop whitespace-nowrap z-50">
                                                        CRITICAL!
                                                    </div>
                                                )}
                                                <div className={`absolute font-black text-4xl md:text-6xl drop-shadow-glow ${
                                                    pop.type === 'HEAL' ? 'animate-heal text-emerald-400' : 
                                                    pop.type === 'BUFF' ? 'animate-heal text-sky-400' :
                                                    pop.type === 'DEBUFF' ? 'animate-heal text-purple-400' :
                                                    pop.value === 'MISS' ? 'animate-damage text-stone-400' :
                                                    pop.element === 'MAGICAL' ? 'animate-damage text-blue-300' :
                                                    'animate-damage text-stone-100'
                                                }`}>
                                                    {pop.type === 'HEAL' ? '+' : (pop.type === 'DAMAGE' && typeof pop.value === 'number') ? '-' : ''}{pop.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {p.currentHp > 0 && (
                                    <div className="mt-3 w-24 md:w-52 space-y-1.5">
                                        <div className="flex flex-col items-center leading-none mb-1">
                                            <span className="text-[10px] md:sm font-black text-stone-100 uppercase tracking-tight truncate w-full text-center">{p.name}</span>
                                        </div>
                                        <div className="relative h-1.5 bg-stone-950/60 rounded-full overflow-hidden border border-white/5">
                                            <div className={`h-full transition-all duration-500 ${hpPer < 30 ? 'bg-red-500 animate-pulse shadow-glow-red' : 'bg-red-700'}`} style={{ width: `${hpPer}%` }} />
                                        </div>
                                        <div className="h-1 bg-stone-950/60 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 transition-all shadow-glow-amber" style={{ width: `${(p.gauge/ACTION_THRESHOLD)*100}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={`bg-stone-900 border-t border-stone-800 transition-all z-[200] overflow-hidden ${focusedUnit ? 'h-44 md:h-48' : 'h-0 opacity-0'}`}>
                {focusedUnit && (
                    <UnitInspector 
                        unit={focusedUnit}
                        activeActorId={activeActorId}
                        isAuto={isAuto}
                        commandMode={commandMode}
                        setCommandMode={setCommandMode}
                        availablePotions={availablePotions}
                        onManualAction={handlers.handleManualAction}
                        onFlee={handlers.handleFlee}
                        onUseItem={(itemId) => handlers.handleManualAction(null, 'ITEM', itemId)}
                        onClose={() => setFocusedUnitId(null)}
                    />
                )}
            </div>
            
            <div className="fixed top-24 left-0 w-full z-[300] flex justify-center pointer-events-none">
                {skillBanner && (
                    <div className={`animate-banner px-12 py-3 border-y-2 relative overflow-hidden flex items-center gap-4 ${skillBanner.team === 'PLAYER' ? 'bg-indigo-900/60 border-indigo-500/50 text-indigo-50' : 'bg-red-950/60 border-red-500/50 text-red-50'}`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                        <Sparkles className="w-5 h-5 animate-spin-slow" />
                        <span className="text-xl md:text-3xl font-black uppercase tracking-[0.3em] font-serif italic drop-shadow-glow">{skillBanner.name}</span>
                        <Sparkles className="w-5 h-5 animate-spin-slow" />
                    </div>
                )}
            </div>

            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-stone-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/5 shadow-2xl scale-75 md:scale-100">
                <SfxButton sfx="switch" onClick={() => setIsPaused(!isPaused)} className={`p-2 rounded-full transition-all ${isPaused ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-400'}`}>
                    {isPaused ? <Play size={16} /> : <Pause size={16} />}
                </SfxButton>
                <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                    {[1, 2, 4].map(s => (
                        <SfxButton sfx="switch" key={s} onClick={() => setBattleSpeed(s as any)} className={`px-2.5 py-1 rounded font-mono text-[10px] font-black ${battleSpeed === s ? 'bg-indigo-600 text-white' : 'text-stone-600 hover:text-stone-300'}`}>{s}x</SfxButton>
                    ))}
                </div>
            </div>

            <div className="fixed top-5 right-4 z-[200] flex items-center scale-75 md:scale-100 origin-right">
                <SfxButton 
                    sfx="switch" 
                    onClick={() => setIsAuto(!isAuto)} 
                    className={`px-5 py-2 rounded-2xl border-2 font-black text-[10px] tracking-widest transition-all shadow-2xl backdrop-blur-md ${
                        isAuto 
                            ? 'bg-amber-600 border-amber-400 text-white shadow-glow-amber' 
                            : 'bg-stone-900/80 border-stone-600 text-stone-400'
                    }`}
                >
                    {isAuto ? 'AUTO' : 'DIRECT'}
                </SfxButton>
            </div>
        </div>
    );
};

export default DungeonCombatView;