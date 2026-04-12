
import React from 'react';
import { getSmithingLevel, getUnlockedTier, LEVEL_EXP_TABLE } from '../../../../utils/craftingLogic';

interface ForgeSkillHeaderProps {
    exp: number;
    label: string;
    tierLabel: string;
    icon: any;
}

const ForgeSkillHeader: React.FC<ForgeSkillHeaderProps> = ({ exp, label, tierLabel, icon: Icon }) => {
    const level = getSmithingLevel(exp);
    const tier = getUnlockedTier(level);
    const currentExpInLevel = exp - (LEVEL_EXP_TABLE[level - 1] || 0);
    const nextLevelExpThreshold = (LEVEL_EXP_TABLE[level] || LEVEL_EXP_TABLE[level - 1]) - (LEVEL_EXP_TABLE[level - 1] || 0);
    const progress = Math.min(100, (currentExpInLevel / (nextLevelExpThreshold || 1)) * 100);

    return (
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3 md:p-3.5 flex items-center gap-4 md:gap-4.5 shadow-inner min-w-[184px] md:min-w-[236px]">
            <div className="p-2.5 md:p-2.5 bg-stone-950 rounded-lg border border-stone-800 shadow-md flex flex-col items-center gap-1">
                <Icon className="w-4.5 h-4.5 md:w-5.5 md:h-5.5 text-amber-50" />
                <span className="text-[8px] md:text-[9px] font-black text-amber-50 uppercase">{tierLabel} {tier}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[11px] md:text-[12px] font-black uppercase text-stone-300 tracking-[0.14em]">{label}</span>
                    <span className="text-stone-200 font-mono text-[13px] md:text-[14px] font-black">LV.{level}</span>
                </div>
                <div className="w-full h-1.5 md:h-2 bg-stone-950 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-amber-600 transition-all duration-700" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default ForgeSkillHeader;
