
import React from 'react';
import { getSmithingLevel, getUnlockedTier, LEVEL_EXP_TABLE } from '../../../../utils/craftingLogic';

interface ForgeSkillHeaderProps {
    exp: number;
    label: string;
    icon: any;
}

const ForgeSkillHeader: React.FC<ForgeSkillHeaderProps> = ({ exp, label, icon: Icon }) => {
    const level = getSmithingLevel(exp);
    const tier = getUnlockedTier(level);
    const currentExpInLevel = exp - (LEVEL_EXP_TABLE[level - 1] || 0);
    const nextLevelExpThreshold = (LEVEL_EXP_TABLE[level] || LEVEL_EXP_TABLE[level - 1]) - (LEVEL_EXP_TABLE[level - 1] || 0);
    const progress = Math.min(100, (currentExpInLevel / (nextLevelExpThreshold || 1)) * 100);

    return (
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-2 md:p-3 flex items-center gap-3 md:gap-4 shadow-inner min-w-[150px] md:min-w-[220px]">
            <div className="p-1.5 md:p-2 bg-stone-950 rounded-lg border border-stone-800 shadow-md flex flex-col items-center gap-1">
                <Icon className="w-3.5 h-3.5 md:w-5 md:h-5 text-amber-50" />
                <span className="text-[6px] md:text-[8px] font-black text-amber-50 uppercase">Tier {tier}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-[8px] md:text-[10px] font-black uppercase text-stone-500 tracking-widest">{label}</span>
                    <span className="text-stone-400 font-mono text-[10px] md:text-xs">LV.{level}</span>
                </div>
                <div className="w-full h-1 md:h-1.5 bg-stone-950 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-amber-600 transition-all duration-700" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default ForgeSkillHeader;
