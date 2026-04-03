import React from 'react';
import { Sword, Zap, Wand2, LogOut, Package, X, Activity } from 'lucide-react';
import { Mercenary } from '../../../../models/Mercenary';
import { SKILLS } from '../../../../data/skills';
import { MercenaryPortrait } from '../../../common/ui/MercenaryPortrait';
import { getAssetUrl } from '../../../../utils';
import { SfxButton } from '../../../common/ui/SfxButton';
import { useGame } from '../../../../context/GameContext';
import { t } from '../../../../utils/i18n';
import { getLocalizedItemName } from '../../../../utils/itemText';

interface UnitInspectorProps {
    unit: any; // partyState unit
    activeActorId: string | null;
    isAuto: boolean;
    commandMode: 'MAIN' | 'SKILL';
    setCommandMode: (mode: 'MAIN' | 'SKILL') => void;
    availablePotions: any[];
    onManualAction: (e: React.MouseEvent, type: 'ATTACK' | 'SKILL', skillId?: string) => void;
    onFlee: (e: React.MouseEvent) => void;
    onUseItem: (itemId: string) => void;
    onClose: () => void;
}

export const UnitInspector: React.FC<UnitInspectorProps> = ({
    unit, activeActorId, isAuto, commandMode, setCommandMode, availablePotions,
    onManualAction, onFlee, onUseItem, onClose
}) => {
    const { state } = useGame();
    const language = state.settings.language;
    const [activeTooltip, setActiveTooltip] = React.useState<string | null>(null);
    const isPlayerTurn = unit.id === activeActorId && !isAuto;
    const hpPer = (unit.currentHp / unit.derived.maxHp) * 100;
    const mpPer = (unit.currentMp / (unit.derived.maxMp || 1)) * 100;

    const unitSkills = React.useMemo(() => {
        const learned = (unit.skillIds || []).map((id: string) => ({ id, source: 'LEARNED' as const }));
        const fromGear = Object.values(unit.equipment || {}).map((i: any) => i?.socketedSkillId).filter(Boolean).map((id: string) => ({ id, source: 'GEAR' as const }));
        return [...learned, ...fromGear];
    }, [unit]);

    const renderTooltipLabel = (id: string, shortKey: string, fullKey: string) => (
        <button
            type="button"
            onClick={() => setActiveTooltip(prev => prev === id ? null : id)}
            className="relative cursor-help"
        >
            <span>{t(language, shortKey)}</span>
            {activeTooltip === id && (
                <span className="absolute left-1/2 top-full z-30 mt-1 w-max max-w-[120px] -translate-x-1/2 rounded-md border border-stone-700 bg-stone-950/95 px-2 py-1 text-[7px] font-bold normal-case tracking-normal text-stone-200 shadow-xl">
                    {t(language, fullKey)}
                </span>
            )}
        </button>
    );

    return (
        <div className="w-full h-full bg-stone-950/90 backdrop-blur-md p-1.5 md:p-3 flex items-stretch animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-row w-full h-full gap-2 md:gap-4 max-w-full">
                
                {/* Column 1: Profile & Vitals (22%) */}
                <div className="flex flex-col gap-1 justify-center shrink-0 border-r border-white/5 pr-2 md:pr-4 w-[22%]">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-9 h-9 md:w-14 md:h-14 bg-stone-800 rounded-lg border border-stone-700 overflow-hidden shadow-xl shrink-0">
                            <MercenaryPortrait mercenary={unit} className="w-full h-full" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h4 className="text-[10px] md:text-sm font-black text-amber-50 uppercase truncate leading-none mb-0.5">{unit.name}</h4>
                            <span className="text-[7px] md:text-[10px] text-stone-500 font-bold uppercase truncate leading-none">{unit.job} • Lv.{unit.level}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-1 mt-0.5">
                        {/* HP Section */}
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-center text-[6px] md:text-[9px] font-mono text-stone-500 px-0.5 leading-none">
                                <span>{t(language, 'tavern.hp')}</span>
                                <span className="font-black text-stone-300">{Math.floor(unit.currentHp)}/{unit.derived.maxHp}</span>
                            </div>
                            <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-red-700 transition-all duration-300" style={{ width: `${hpPer}%` }} />
                            </div>
                        </div>
                        {/* MP Section */}
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-center text-[6px] md:text-[9px] font-mono text-stone-500 px-0.5 leading-none">
                                <span>{t(language, 'assault.mp')}</span>
                                <span className="font-black text-stone-300">{Math.floor(unit.currentMp)}/{unit.derived.maxMp}</span>
                            </div>
                            <div className="h-1 w-full bg-stone-900 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-blue-700 transition-all duration-300" style={{ width: `${mpPer}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-0.5 md:gap-1 w-full">
                        {[
                            { id: 'atk', label: renderTooltipLabel('atk', 'unitInspector.atk', 'unitInspector.atk_full'), val: unit.derived.physicalAttack },
                            { id: 'def', label: renderTooltipLabel('def', 'unitInspector.def', 'unitInspector.def_full'), val: unit.derived.physicalDefense },
                            { id: 'matk', label: renderTooltipLabel('matk', 'unitInspector.matk', 'unitInspector.matk_full'), val: unit.derived.magicalAttack },
                            { id: 'mdef', label: renderTooltipLabel('mdef', 'unitInspector.mdef', 'unitInspector.mdef_full'), val: unit.derived.magicalDefense },
                        ].map((s, idx) => (
                            <div key={idx} className="flex flex-col items-center justify-center p-0.5 bg-stone-900/60 rounded border border-white/5 h-7 md:h-9">
                                <span className="text-[5px] md:text-[7px] font-black text-stone-600 uppercase truncate leading-none mb-0.5">{s.label}</span>
                                <span className="text-[7px] md:text-[10px] font-mono font-black text-stone-200 truncate leading-none">{s.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Column 2: Tactics / Skills (23%) */}
                <div className="flex flex-col shrink-0 border-r border-white/5 pr-2 md:pr-4 w-[23%] overflow-hidden">
                    <div className="flex justify-between items-center h-5 md:h-6 shrink-0 border-b border-white/5 mb-1 px-1">
                         <span className="text-[6px] md:text-[8px] font-black text-stone-600 uppercase">
                             {isPlayerTurn
                                ? (commandMode === 'MAIN' ? t(language, 'unitInspector.tactics') : t(language, 'unitInspector.technique'))
                                : t(language, 'unitInspector.active_arts')}
                         </span>
                         {isPlayerTurn && commandMode === 'SKILL' && (
                             <SfxButton sfx="switch" onClick={() => setCommandMode('MAIN')} className="text-[6px] font-black text-stone-400 hover:text-white uppercase tracking-tighter">{t(language, 'common.back')}</SfxButton>
                         )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-0.5 min-h-0">
                        {isPlayerTurn ? (
                            commandMode === 'MAIN' ? (
                                <div className="flex flex-col gap-1">
                                    <SfxButton onClick={(e) => onManualAction(e, 'ATTACK')} className="w-full flex items-center gap-2 p-1.5 bg-stone-800 hover:bg-amber-600 hover:text-white rounded border border-white/5 transition-all group">
                                        <Sword size={12} className="shrink-0" />
                                        <span className="text-[8px] md:text-[10px] font-black uppercase">{t(language, 'unitInspector.strike')}</span>
                                    </SfxButton>
                                    <SfxButton onClick={(e) => onManualAction(e, 'SKILL')} className="w-full flex items-center gap-2 p-1.5 bg-indigo-900/40 hover:bg-indigo-700 rounded border border-indigo-500/30 text-indigo-100 transition-all group">
                                        <Wand2 size={12} className="shrink-0" />
                                        <span className="text-[8px] md:text-[10px] font-black uppercase">{t(language, 'unitInspector.arts')}</span>
                                    </SfxButton>
                                    <SfxButton onClick={(e) => onFlee(e)} className="w-full flex items-center gap-2 p-1.5 bg-red-950/40 hover:bg-red-700 rounded border border-red-500/30 text-red-500 hover:text-white transition-all group">
                                        <LogOut size={12} className="shrink-0" />
                                        <span className="text-[8px] md:text-[10px] font-black uppercase">{t(language, 'unitInspector.withdraw')}</span>
                                    </SfxButton>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    {unitSkills.map((ref, idx) => {
                                        const skill = SKILLS[ref.id];
                                        if (!skill) return null;
                                        const canCast = unit.currentMp >= (skill.mpCost ?? 0);
                                        return (
                                            <button 
                                                key={`${ref.id}-${idx}`}
                                                disabled={!canCast}
                                                onClick={(e) => onManualAction(e, 'SKILL', ref.id)}
                                                className={`w-full flex items-center justify-between p-1.5 rounded border transition-all text-left ${canCast ? 'bg-indigo-900/20 border-indigo-500/40 hover:bg-indigo-800/40' : 'bg-stone-900 border-stone-800 opacity-40 grayscale'}`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Zap size={10} className={ref.source === 'GEAR' ? 'text-purple-400 shrink-0' : 'text-indigo-300 shrink-0'} />
                                                    <span className="text-[8px] md:text-[10px] font-black text-stone-100 uppercase truncate leading-none">{skill.name}</span>
                                                </div>
                                                <span className="text-[6px] md:text-[8px] text-stone-500 font-bold shrink-0">{skill.mpCost}M</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col gap-1">
                                {unitSkills.map((ref, idx) => (
                                    <div key={idx} className={`flex items-center gap-2 p-1.5 rounded bg-stone-950/60 border border-white/5 ${ref.source === 'GEAR' ? 'border-indigo-500/30' : ''}`}>
                                        <Wand2 className={`w-3 h-3 ${ref.source === 'GEAR' ? 'text-indigo-400' : 'text-amber-500'}`} />
                                        <span className="text-[8px] md:text-[10px] font-bold text-stone-300 uppercase truncate leading-none">{SKILLS[ref.id]?.name}</span>
                                    </div>
                                ))}
                                {unitSkills.length === 0 && <span className="text-[7px] text-stone-700 italic px-1">{t(language, 'unitInspector.none_available')}</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 3: Stats List (Minimal & Direct) (~18%) */}
                <div className="flex flex-col shrink-0 border-r border-white/5 pr-2 md:pr-4 w-[18%] overflow-hidden">
                    <div className="flex items-center h-5 md:h-6 shrink-0 border-b border-white/5 mb-1 px-1">
                         <span className="text-[6px] md:text-[8px] font-black text-stone-600 uppercase tracking-widest">{t(language, 'unitInspector.detail')}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center space-y-1.5 md:space-y-2 py-1 min-h-0">
                        {[
                            { id: 'spd', label: renderTooltipLabel('spd', 'unitInspector.spd', 'unitInspector.spd_full'), val: unit.derived.speed },
                            { id: 'crt', label: renderTooltipLabel('crt', 'unitInspector.crt', 'unitInspector.crt_full'), val: `${unit.derived.critChance}%` },
                            { id: 'cdmg', label: renderTooltipLabel('cdmg', 'unitInspector.cdmg', 'unitInspector.cdmg_full'), val: `${unit.derived.critDamage}%` },
                            { id: 'acc', label: renderTooltipLabel('acc', 'unitInspector.acc', 'unitInspector.acc_full'), val: unit.derived.accuracy },
                            { id: 'eva', label: renderTooltipLabel('eva', 'unitInspector.eva', 'unitInspector.eva_full'), val: unit.derived.evasion },
                            { id: 'prd', label: renderTooltipLabel('prd', 'unitInspector.prd', 'unitInspector.prd_full'), val: `${Math.round(unit.derived.physicalReduction * 100)}%` },
                            { id: 'mrd', label: renderTooltipLabel('mrd', 'unitInspector.mrd', 'unitInspector.mrd_full'), val: `${Math.round(unit.derived.magicalReduction * 100)}%` },
                        ].map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between px-1">
                                <span className="text-[6px] md:text-[8px] font-black text-stone-500 uppercase">{s.label}</span>
                                <span className="text-[7px] md:text-[10px] font-mono font-black text-stone-200">{s.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Column 4: Pouch-Themed Inventory (Expanded & Scrollable) */}
                <div className="flex-1 flex flex-col overflow-hidden px-1">
                    <div className="flex items-center h-5 md:h-6 shrink-0 border-b border-white/5 mb-1 px-1">
                         <span className="text-[6px] md:text-[8px] font-black text-stone-600 uppercase tracking-widest">{t(language, 'unitInspector.storage')}</span>
                    </div>
                    <div 
                        className="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-0 bg-stone-800/40 shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] rounded-xl border border-stone-700/50"
                        style={{
                            backgroundImage: `
                                linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)
                            `,
                            backgroundSize: '24px 24px'
                        }}
                    >
                        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5 pb-2">
                            {availablePotions.map((potion) => (
                                <SfxButton 
                                    key={potion.id} 
                                    onClick={() => onUseItem(potion.id)} 
                                    className="group relative aspect-square bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-lg transition-all p-1 flex items-center justify-center shadow-lg active:scale-95 ring-1 ring-white/5"
                                >
                                    <img 
                                        src={getAssetUrl(`${potion.id}.png`, 'materials')} 
                                        className="w-full h-full object-contain drop-shadow-md brightness-110" 
                                        alt={getLocalizedItemName(language, potion)}
                                    />
                                    <div className="absolute -top-1 -right-1 bg-amber-600 text-white text-[6px] md:text-[9px] font-black px-1 rounded-full border border-stone-900 shadow-md">
                                        {potion.quantity}
                                    </div>
                                </SfxButton>
                            ))}
                            {availablePotions.length === 0 && (
                                <div className="col-span-full py-10 flex flex-col items-center justify-center opacity-10">
                                    <Package size={24} />
                                    <span className="text-[8px] uppercase font-black mt-2 tracking-widest">{t(language, 'common.empty')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
