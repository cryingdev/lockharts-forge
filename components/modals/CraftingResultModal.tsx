import React from 'react';
import { useGame } from '../../context/GameContext';
import { Hammer, Sword, Shield, Zap, Brain, Check, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { getAssetUrl } from '../../utils';
import { EquipmentStats } from '../../models/Equipment';
import { EQUIPMENT_ITEMS } from '../../data/equipment';

const CraftingResultModal = () => {
    const { state, actions } = useGame();
    const item = state.lastCraftedItem;

    if (!item || !item.equipmentData) return null;

    const data = item.equipmentData;
    const recipe = EQUIPMENT_ITEMS.find(r => r.id === data.recipeId);
    const imageUrl = data.image ? getAssetUrl(data.image) : (data.recipeId ? getAssetUrl(`${data.recipeId}.png`) : getAssetUrl(`${item.id.split('_')[0]}.png`));

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
        
        let status: 'UP' | 'DOWN' | 'EQUAL' = 'EQUAL';
        if (diff > 0) status = 'UP';
        else if (diff < 0) status = 'DOWN';

        return (
            <div 
                className={`bg-stone-950/50 p-2 md:p-3 rounded-xl border transition-all hover:bg-stone-900 group cursor-help flex justify-between items-center ${
                    status === 'UP' ? 'border-amber-600/40 shadow-[inner_0_0_10px_rgba(245,158,11,0.1)]' : 
                    status === 'DOWN' ? 'border-red-900/40 shadow-[inner_0_0_10px_rgba(239,68,68,0.05)]' : 
                    'border-stone-800'
                }`}
            >
                <span className="text-[9px] md:text-[10px] text-stone-500 font-bold uppercase flex items-center gap-1.5 group-hover:text-stone-400">
                    {icon} {labelStr}
                </span>
                <div className="flex items-center gap-1.5">
                    <span className={`text-xs md:text-sm font-mono font-bold transition-colors ${
                        status === 'UP' ? 'text-amber-400' : 
                        status === 'DOWN' ? 'text-red-500' : 
                        'text-stone-200'
                    }`}>
                        {value}
                    </span>
                    {status === 'UP' && <ArrowUp className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-500 animate-bounce" />}
                    {status === 'DOWN' && <ArrowDown className="w-2.5 h-2.5 md:w-3 md:h-3 text-red-700 animate-pulse" />}
                </div>
            </div>
        );
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-500 overflow-hidden">
            <div className="relative z-10 w-full max-w-md max-h-[95vh] bg-stone-900 border-2 border-amber-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                
                {/* Header - Compact for small screens */}
                <div className="bg-stone-850 p-4 md:p-6 border-b border-stone-800 flex flex-col items-center text-center relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-2 opacity-5 hidden md:block">
                         <Hammer className="w-20 h-20 text-stone-500" />
                    </div>
                    <div className={`w-16 h-16 md:w-24 md:h-24 bg-stone-900 rounded-full border-4 ${qColor.replace('text-', 'border-')} flex items-center justify-center mb-2 md:mb-4 shadow-2xl`}>
                        <img 
                            src={imageUrl} 
                            className="w-10 h-10 md:w-16 md:h-16 object-contain drop-shadow-lg" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                        />
                        <span className="hidden text-3xl md:text-5xl">{item.icon || '📦'}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-stone-200 font-serif tracking-wide truncate w-full">{data.name}</h2>
                    <div className={`flex items-center gap-2 mt-1 md:mt-2 px-3 py-0.5 md:py-1 rounded-full bg-stone-950 border border-stone-800 font-bold uppercase tracking-widest text-[9px] md:text-[10px] ${qColor}`}>
                        <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current" />
                        {label} Quality
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="p-4 md:p-6 space-y-4 md:space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                    <p className="text-stone-400 text-xs md:text-sm text-center italic leading-relaxed px-2">
                        "{item.description}"
                    </p>

                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                        {renderStatItem(<Sword className="w-3 h-3" />, "P.Atk", "physicalAttack", data.stats.physicalAttack)}
                        {renderStatItem(<Shield className="w-3 h-3" />, "P.Def", "physicalDefense", data.stats.physicalDefense)}
                        {renderStatItem(<Zap className="w-3 h-3" />, "M.Atk", "magicalAttack", data.stats.magicalAttack)}
                        {renderStatItem(<Brain className="w-3 h-3" />, "M.Def", "magicalDefense", data.stats.magicalDefense)}
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-stone-800 pt-3 md:pt-4 px-2">
                        <span className="text-stone-500 uppercase font-bold tracking-tighter">Market Value</span>
                        <span className="text-amber-500 font-mono font-bold text-base md:text-lg">{data.price} G</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-800 bg-stone-850 shrink-0">
                    <button 
                        onClick={actions.dismissCraftingResult}
                        className="w-full py-3 md:py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95"
                    >
                        <Check className="w-5 h-5" />
                        Complete Forge
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CraftingResultModal;