
import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { Sword, Shield, Zap, Brain, Check, Star, ArrowUp, Award, Sparkles, Lock, Activity, Heart, Wind } from 'lucide-react';
import { getAssetUrl } from '../../utils';
import { EquipmentStats } from '../../models/Equipment';
import { EQUIPMENT_ITEMS } from '../../data/equipment';
import { MASTERY_THRESHOLDS } from '../../config/mastery-config';
import { UI_MODAL_LAYOUT } from '../../config/ui-config';

const CraftingResultModal = () => {
    const { state, actions } = useGame();
    const item = state.lastCraftedItem;
    const [animatedProgress, setAnimatedProgress] = useState(0);

    const masteryInfo = useMemo(() => {
        if (!item || !item.equipmentData || !item.equipmentData.recipeId) return null;
        
        const recipeId = item.equipmentData.recipeId;
        const count = state.craftingMastery[recipeId] || 0;
        
        let label = "Novice";
        let colorClass = "stroke-stone-400";
        let textClass = "text-stone-400";
        let progress = 0;

        if (count >= MASTERY_THRESHOLDS.ARTISAN) {
            label = "Artisan";
            colorClass = "stroke-amber-500";
            textClass = "text-amber-500";
            progress = Math.min(100, ((count - MASTERY_THRESHOLDS.ARTISAN) / 20) * 100);
        } else if (count >= MASTERY_THRESHOLDS.ADEPT) {
            label = "Adept";
            colorClass = "stroke-emerald-500";
            textClass = "text-emerald-500";
            progress = ((count - MASTERY_THRESHOLDS.ADEPT) / (MASTERY_THRESHOLDS.ARTISAN - MASTERY_THRESHOLDS.ADEPT)) * 100;
        } else {
            label = "Novice";
            colorClass = "stroke-stone-400";
            textClass = "text-stone-400";
            progress = (count / MASTERY_THRESHOLDS.ADEPT) * 100;
        }

        const radius = 46;
        const circumference = 2 * Math.PI * radius;

        return { label, colorClass, textClass, progress, circumference, count };
    }, [item, state.craftingMastery]);

    useEffect(() => {
        if (masteryInfo) {
            setAnimatedProgress(0);
            const timer = setTimeout(() => {
                setAnimatedProgress(masteryInfo.progress);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [masteryInfo]);

    if (!item || !item.equipmentData || !masteryInfo) return null;

    const data = item.equipmentData;
    const recipe = EQUIPMENT_ITEMS.find(r => r.id === data.recipeId);
    const imageUrl = data.image 
        ? getAssetUrl(data.image, 'equipments') 
        : (data.recipeId 
            ? getAssetUrl(`${recipe?.id}.png`, 'equipments') 
            : getAssetUrl(`${item.id.split('_')[0]}.png`, 'equipments'));

    const getQualityLabel = (q: number): string => {
        if (q >= 110) return "Masterwork";
        if (q >= 100) return "Pristine";
        if (q >= 90) return "Superior";
        if (q >= 80) return "Fine";
        if (q >= 70) return "Standard";
        if (q >= 60) return "Rustic";
        return "Crude";
    };

    const getQualityColor = (q: number): string => {
        if (q >= 110) return 'text-amber-400';
        if (q >= 100) return 'text-yellow-400';
        if (q >= 90) return 'text-emerald-400';
        if (q >= 80) return 'text-blue-400';
        return 'text-stone-400';
    };

    const label = getQualityLabel(data.quality);
    const qColor = getQualityColor(data.quality);

    const isLockedByTutorial = state.tutorialStep === 'CRAFT_RESULT_DIALOG';

    const handleFinalize = () => {
        if (isLockedByTutorial) return;
        if (state.tutorialStep === 'FINALIZE_FORGE_GUIDE') {
            actions.setTutorialStep('SHOP_INTRO_DIALOG');
        }
        actions.dismissCraftingResult();
    };

    const renderStatItem = (icon: React.ReactNode, labelStr: string, statKey: keyof EquipmentStats, value: number, customTagClass?: string) => {
        if (value === undefined || value <= 0) return null;

        const baseValue = recipe?.baseStats?.[statKey] || 0;
        const diff = value - baseValue;
        const isUp = diff > 0;

        return (
            <div className={`bg-stone-950/50 p-2 md:p-3 rounded-xl border transition-all flex justify-between items-center ${isUp ? 'border-amber-600/40 shadow-[inner_0_0_10px_rgba(245,158,11,0.1)]' : 'border-stone-800'} ${customTagClass || ''}`}>
                <span className="text-[7px] md:text-[10px] text-stone-500 font-bold uppercase flex items-center gap-1 md:gap-1.5 pr-1 truncate">
                    {icon} {labelStr}
                </span>
                <div className="flex items-center gap-0.5 shrink-0">
                    <span className={`text-[10px] md:text-sm font-mono font-black ${isUp ? 'text-amber-400' : 'text-stone-200'}`}>{value}</span>
                    {isUp && <ArrowUp className="w-2 h-2 md:w-2.5 md:h-2.5 text-amber-500 animate-bounce" />}
                </div>
            </div>
        );
    };

    const offset = masteryInfo.circumference - (animatedProgress / 100) * masteryInfo.circumference;

    return (
        <div className={`${UI_MODAL_LAYOUT.OVERLAY} ${UI_MODAL_LAYOUT.Z_INDEX.RESULT}`}>
            <div className={`${UI_MODAL_LAYOUT.CONTAINER} border-amber-600 animate-in zoom-in-95 duration-300`}>
                
                <div className="bg-stone-850 p-3 md:p-6 border-b border-stone-800 flex flex-col items-center text-center shrink-0">
                    
                    <div className="relative mb-2 md:mb-4 group">
                        <div className={`w-20 h-20 md:w-32 md:h-32 bg-stone-900 rounded-full flex items-center justify-center relative z-10 p-2 md:p-3 border border-stone-800/50 shadow-2xl`}>
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none scale-105" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-stone-950/40" />
                                <circle 
                                    cx="50" cy="50" r="46" 
                                    stroke="currentColor" strokeWidth="4" fill="transparent"
                                    strokeDasharray={masteryInfo.circumference}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                    className={`${masteryInfo.colorClass} transition-all duration-[1000ms] ease-out`}
                                />
                            </svg>
                            
                            <img src={imageUrl} className="w-10 h-10 md:w-20 md:h-20 object-contain drop-shadow-2xl z-20 relative" />
                            
                            <div className={`absolute -bottom-1 -right-1 md:bottom-0 md:right-0 z-30 px-1 md:px-1.5 py-0.5 rounded-full border border-stone-700 bg-stone-900 shadow-xl flex items-center gap-1`}>
                                <Star className={`w-2 h-2 md:w-3 md:h-3 fill-current ${masteryInfo.textClass}`} />
                                <span className={`text-[6px] md:text-[9px] font-black uppercase tracking-tighter ${masteryInfo.textClass}`}>{masteryInfo.label}</span>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-base md:text-2xl font-bold text-stone-100 font-serif leading-tight px-2 truncate w-full">{data.name}</h2>
                    
                    <div className="flex flex-col items-center gap-1 mt-1 md:mt-2">
                        <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-stone-950 border border-stone-800 font-black uppercase tracking-widest text-[7px] md:text-[10px] ${qColor} flex items-center gap-1 shadow-inner`}>
                            <Sparkles className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 fill-current" /> {label} Quality
                        </div>
                        <div className="flex items-center gap-1 text-[7px] md:text-[9px] font-black text-stone-500 uppercase tracking-widest">
                            <Award className="w-2 h-2 md:w-2.5 md:h-2.5" /> Mastery: {Math.round(masteryInfo.progress)}%
                        </div>
                    </div>
                </div>

                <div className="p-3 md:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    <p className="text-stone-400 text-[9px] md:text-sm text-center italic leading-tight px-2">"{item.description}"</p>
                    
                    {/* Unified Stats Grid - 2 columns */}
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                        {renderStatItem(<Sword className="w-2.5 h-2.5 text-stone-500" />, "P.Atk", "physicalAttack", data.stats.physicalAttack)}
                        {renderStatItem(<Zap className="w-2.5 h-2.5 text-stone-500" />, "M.Atk", "magicalAttack", data.stats.magicalAttack)}
                        {renderStatItem(<Shield className="w-2.5 h-2.5 text-stone-500" />, "P.Def", "physicalDefense", data.stats.physicalDefense)}
                        {renderStatItem(<Brain className="w-2.5 h-2.5 text-stone-500" />, "M.Def", "magicalDefense", data.stats.magicalDefense)}
                        
                        {/* Bonus Stats in the same grid with color coding */}
                        {renderStatItem(<Activity className="w-2.5 h-2.5 text-orange-400" />, "STR", "str", data.stats.str || 0, "border-orange-500/20 bg-orange-500/10")}
                        {renderStatItem(<Heart className="w-2.5 h-2.5 text-red-400" />, "VIT", "vit", data.stats.vit || 0, "border-red-500/20 bg-red-500/10")}
                        {renderStatItem(<Wind className="w-2.5 h-2.5 text-emerald-400" />, "DEX", "dex", data.stats.dex || 0, "border-emerald-500/20 bg-emerald-500/10")}
                        {renderStatItem(<Brain className="w-2.5 h-2.5 text-blue-400" />, "INT", "int", data.stats.int || 0, "border-blue-500/20 bg-blue-500/10")}
                        {renderStatItem(<Star className="w-2.5 h-2.5 text-pink-400" />, "LUK", "luk", data.stats.luk || 0, "border-pink-500/20 bg-pink-500/10")}
                    </div>
                </div>

                <div className="p-3 md:p-5 border-t border-stone-800 bg-stone-850 shrink-0">
                    <button 
                        onClick={handleFinalize} 
                        disabled={isLockedByTutorial}
                        data-tutorial-id="FINALIZE_BUTTON"
                        className={`w-full py-2.5 md:py-4 font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all text-[10px] md:text-base uppercase tracking-widest border-b-4 ${
                            isLockedByTutorial 
                            ? 'bg-stone-800 text-stone-600 border-stone-900 grayscale cursor-not-allowed' 
                            : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-800 active:scale-95'
                        }`}
                    >
                        {isLockedByTutorial ? (
                            <><Lock className="w-3 h-3 md:w-4 md:h-4" /> Reviewing...</>
                        ) : (
                            <><Check className="w-3 h-3 md:w-4 md:h-4" /> Finalize Forge</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CraftingResultModal;
