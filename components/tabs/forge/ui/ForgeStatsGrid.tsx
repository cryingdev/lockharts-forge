
import React from 'react';
import { Sword, Shield, Zap, Brain, Activity, Heart, Star, Wind } from 'lucide-react';
import { EquipmentItem } from '../../../../types';

interface ForgeStatsGridProps {
    item: EquipmentItem;
}

const ForgeStatsGrid: React.FC<ForgeStatsGridProps> = ({ item }) => {
    if (!item.baseStats) return null;
    const s = item.baseStats;

    const combatStats = [
        { label: 'P.Atk', val: s.physicalAttack, icon: <Sword className="w-3 h-3" />, color: 'text-stone-200' },
        { label: 'M.Atk', val: s.magicalAttack, icon: <Zap className="w-3 h-3" />, color: 'text-stone-200' },
        { label: 'P.Def', val: s.physicalDefense, icon: <Shield className="w-3 h-3" />, color: 'text-stone-200' },
        { label: 'M.Def', val: s.magicalDefense, icon: <Brain className="w-3 h-3" />, color: 'text-stone-200' },
    ].filter(st => st.val > 0);

    const bonusStats = [
        { label: 'STR', val: s.str, icon: <Activity className="w-3 h-3" />, color: 'text-orange-400', tag: 'bg-orange-500/10 border-orange-500/30' },
        { label: 'VIT', val: s.vit, icon: <Heart className="w-3 h-3" />, color: 'text-red-400', tag: 'bg-red-500/10 border-red-500/30' },
        { label: 'DEX', val: s.dex, icon: <Wind className="w-3 h-3" />, color: 'text-emerald-400', tag: 'bg-emerald-500/10 border-emerald-500/30' },
        { label: 'INT', val: s.int, icon: <Brain className="w-3 h-3" />, color: 'text-blue-400', tag: 'bg-blue-500/10 border-blue-500/30' },
        { label: 'LUK', val: s.luk, icon: <Star className="w-3 h-3" />, color: 'text-pink-400', tag: 'bg-pink-500/10 border-pink-500/30' },
    ].filter(st => st.val !== undefined && st.val > 0);

    return (
        <div className="flex flex-col gap-2.5 w-[90%] max-w-[320px] md:max-w-[380px] mb-5 md:mb-7 animate-in slide-in-from-bottom-2 duration-500 mx-auto px-1">
            <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                {combatStats.map((st, i) => (
                    <div key={`combat-${i}`} className="bg-stone-900/60 border border-stone-800 px-2 py-2 md:px-3 md:py-3 rounded-xl flex justify-between items-center shadow-inner">
                        <span className="text-[8px] md:text-[11px] text-stone-400 font-black uppercase flex items-center gap-1.5">{st.icon} {st.label}</span>
                        <span className={`text-[11px] md:text-[15px] font-mono font-bold ${st.color}`}>{st.val}</span>
                    </div>
                ))}
                {bonusStats.map((st, i) => (
                    <div key={`bonus-${i}`} className={`flex items-center justify-between px-2 md:px-3 py-2 md:py-3 rounded-xl border shadow-sm ${st.tag}`}>
                        <span className={`text-[8px] md:text-[11px] font-black uppercase flex items-center gap-1.5 ${st.color}`}>{st.icon} {st.label}</span>
                        <span className={`text-[11px] md:text-[15px] font-mono font-bold ${st.color}`}>+{st.val}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ForgeStatsGrid;
