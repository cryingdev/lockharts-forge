
import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
// Added missing 'Sparkles' import from lucide-react
import { Hammer, Sword, Shield, Zap, Brain, Check, Star, ArrowUp, ArrowDown, Award, Sparkles } from 'lucide-react';
import { getAssetUrl } from '../../utils';
import { EquipmentStats } from '../../models/Equipment';
import { EQUIPMENT_ITEMS } from '../../data/equipment';
import { MASTERY_THRESHOLDS } from '../../config/mastery-config';

const CraftingResultModal = () => {
    const { state, actions } = useGame();
    const item = state.lastCraftedItem;
    const [animatedProgress, setAnimatedProgress] = useState(0);

    // Calculate Mastery Info
    const masteryInfo = useMemo(() => {
        if (!item || !item.equipmentData || !item.equipmentData.recipeId) return null;
        
        const recipeId = item.equipmentData.recipeId;
        const count = state.craftingMastery[recipeId] || 0;
        
        let label = "Novice";
        let colorClass = "stroke-stone-400";
        let textClass = "text-stone-400";
        let progress = 0;
        let nextMax = MASTERY_THRESHOLDS.ADEPT;

        if (count >= MASTERY_THRESHOLDS.ARTISAN) {
            label = "Artisan";
            colorClass = "stroke-amber-500";
            textClass = "text-amber-500";
            progress = Math.min(100, ((count - MASTERY_THRESHOLDS.ARTISAN) / 20) * 100);
            nextMax = 50; 
        } else if (count >= MASTERY_THRESHOLDS.ADEPT) {
            label = "Adept";
            colorClass = "stroke-emerald-500";
            textClass = "text-emerald-500";
            progress = ((count - MASTERY_THRESHOLDS.ADEPT) / (MASTERY_THRESHOLDS.ARTISAN - MASTERY_THRESHOLDS.ADEPT)) * 100;
            nextMax = MASTERY_THRESHOLDS.ARTISAN;
        } else {
            label = "Novice";
            colorClass = "stroke-stone-400";
            textClass = "text-stone-400";
            progress = (count / MASTERY_THRESHOLDS.ADEPT) * 100;
            nextMax = MASTERY_THRESHOLDS.ADEPT;
        }

        const radius = 46;
        const circumference = 2 * Math.PI * radius;

        return { label, colorClass, textClass, progress, circumference, count, nextMax };
    }, [item, state.craftingMastery]);

    // Animation Effect
    useEffect(() => {
        if (masteryInfo) {
            // Start from slightly less or zero to show growth
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
    const imageUrl = data.image ? getAssetUrl(data.image) : (data.recipeId ? getAssetUrl(`${recipe?.id}.png`) : getAssetUrl(`${item.id.split('_')[0]}.png`));

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

    const renderStatItem = (icon: React.ReactNode, labelStr: string, statKey: keyof EquipmentStats, value: number) => {
        const baseValue = recipe?.baseStats?.[statKey] || 0;
        const diff = value - baseValue;
        let status: 'UP' | 'DOWN' | 'EQUAL' = diff > 0 ? 'UP' : diff < 0 ? 'DOWN' : 'EQUAL';

        return (
            <div className={`bg-stone-950/50 p-2 md:p-3 rounded-xl border transition-all flex justify-between items-center min-w-[120px] ${status === 'UP' ? 'border-amber-600/40 shadow-[inner_0_0_10px_rgba(245,158,11,0.1)]' : status === 'DOWN' ? 'border-red-900/40' : 'border-stone-800'}`}>
                <span className="text-[8px] md:text-[10px] text-stone-500 font-bold uppercase flex items-center gap-1.5 pr-2">
                    {icon} {labelStr}
                </span>
                <div className="flex items-center gap-1">
                    <span className={`text-xs md:text-sm font-mono font-bold ${status === 'UP' ? 'text-amber-400' : status === 'DOWN' ? 'text-red-500' : 'text-stone-200'}`}>{value}</span>
                    {status === 'UP' && <ArrowUp className="w-2.5 h-2.5 text-amber-500 animate-bounce" />}
                </div>
            </div>
        );
    };

    const offset = masteryInfo.circumference - (animatedProgress / 100) * masteryInfo.circumference;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm px-[10%] py-[15%] animate-in fade-in duration-500 overflow-hidden">
            <div className="relative w-fit max-w-[500px] h-fit max-h-full min-h-[200px] min-w-[280px] bg-stone-900 border-2 border-amber-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 mx-auto">
                
                {/* Header */}
                <div className="bg-stone-850 p-4 md:p-6 border-b border-stone-800 flex flex-col items-center text-center shrink-0">
                    
                    {/* Radial Mastery Gauge around Item */}
                    <div className="relative mb-4 group">
                        <div className={`w-24 h-24 md:w-32 md:h-32 bg-stone-900 rounded-full flex items-center justify-center relative z-10 p-2 md:p-3 border border-stone-800/50 shadow-2xl`}>
                            {/* Radial SVG Gauge */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none scale-105" viewBox="0 0 100 100">
                                {/* Background Track */}
                                <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-stone-950/40" />
                                {/* Progress Arc */}
                                <circle 
                                    cx="50" cy="50" r="46" 
                                    stroke="currentColor" strokeWidth="4" fill="transparent"
                                    strokeDasharray={masteryInfo.circumference}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                    className={`${masteryInfo.colorClass} transition-all duration-[1000ms] ease-out`}
                                />
                            </svg>
                            
                            <img src={imageUrl} className="w-12 h-12 md:w-20 md:h-20 object-contain drop-shadow-2xl z-20 relative" />
                            
                            {/* Rank Badge */}
                            <div className={`absolute -bottom-1 -right-1 md:bottom-0 md:right-0 z-30 px-1.5 py-0.5 rounded-full border border-stone-700 bg-stone-900 shadow-xl flex items-center gap-1 animate-in slide-in-from-right-2 duration-700`}>
                                <Star className={`w-2 h-2 md:w-3 md:h-3 fill-current ${masteryInfo.textClass}`} />
                                <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-tighter ${masteryInfo.textClass}`}>{masteryInfo.label}</span>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-lg md:text-2xl font-bold text-stone-100 font-serif leading-tight px-6">{data.name}</h2>
                    
                    <div className="flex flex-col items-center gap-1.5 mt-2">
                        <div className={`px-3 py-1 rounded-full bg-stone-950 border border-stone-800 font-black uppercase tracking-widest text-[8px] md:text-[10px] ${qColor} flex items-center gap-1 shadow-inner`}>
                            <Sparkles className="w-3 h-3 fill-current" /> {label} Quality
                        </div>
                        <div className="flex items-center gap-1 text-[8px] md:text-[9px] font-black text-stone-500 uppercase tracking-widest">
                            <Award className="w-2.5 h-2.5" /> Experience: {Math.round(masteryInfo.progress)}%
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    <p className="text-stone-400 text-[10px] md:text-sm text-center italic leading-tight px-4">"{item.description}"</p>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                        {renderStatItem(<Sword className="w-3 h-3" />, "P.Atk", "physicalAttack", data.stats.physicalAttack)}
                        {renderStatItem(<Shield className="w-3 h-3" />, "P.Def", "physicalDefense", data.stats.physicalDefense)}
                        {renderStatItem(<Zap className="w-3 h-3" />, "M.Atk", "magicalAttack", data.stats.magicalAttack)}
                        {renderStatItem(<Brain className="w-3 h-3" />, "M.Def", "magicalDefense", data.stats.magicalDefense)}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-800 bg-stone-850 shrink-0">
                    <button onClick={actions.dismissCraftingResult} className="w-full py-3 md:py-4 bg-amber-700 hover:bg-amber-600 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 text-xs md:text-base uppercase tracking-widest">
                        <Check className="w-4 h-4" /> Finalize Forge
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CraftingResultModal;
