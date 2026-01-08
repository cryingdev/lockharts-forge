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

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm px-[10%] py-[15%] animate-in fade-in duration-500 overflow-hidden">
            <div className="relative w-fit max-w-[500px] h-fit max-h-full min-h-[200px] min-w-[280px] bg-stone-900 border-2 border-amber-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 mx-auto">
                
                {/* Header */}
                <div className="bg-stone-850 p-4 md:p-6 border-b border-stone-800 flex flex-col items-center text-center shrink-0">
                    <div className={`w-16 h-16 md:w-20 md:h-20 bg-stone-900 rounded-full border-4 ${qColor.replace('text-', 'border-')} flex items-center justify-center mb-3 shadow-xl`}>
                        <img src={imageUrl} className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-lg" />
                    </div>
                    <h2 className="text-lg md:text-2xl font-bold text-stone-100 font-serif leading-tight px-6">{data.name}</h2>
                    <div className={`mt-2 px-3 py-1 rounded-full bg-stone-950 border border-stone-800 font-black uppercase tracking-widest text-[8px] md:text-[10px] ${qColor} flex items-center gap-1`}>
                        <Star className="w-3 h-3 fill-current" /> {label} Quality
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