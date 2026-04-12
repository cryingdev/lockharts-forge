
import React from 'react';
import { getSmithingLevel, getUnlockedTier, LEVEL_EXP_TABLE } from '../../../../utils/craftingLogic';

interface ForgeSkillHeaderProps {
    exp: number;
    label: string;
    tierLabel: string;
    icon: any;
    compact?: boolean;
    compactBare?: boolean;
}

const ForgeSkillHeader: React.FC<ForgeSkillHeaderProps> = ({ exp, label, tierLabel, icon: Icon, compact = false, compactBare = false }) => {
    const level = getSmithingLevel(exp);
    const tier = getUnlockedTier(level);
    const currentExpInLevel = exp - (LEVEL_EXP_TABLE[level - 1] || 0);
    const nextLevelExpThreshold = (LEVEL_EXP_TABLE[level] || LEVEL_EXP_TABLE[level - 1]) - (LEVEL_EXP_TABLE[level - 1] || 0);
    const progress = Math.min(100, (currentExpInLevel / (nextLevelExpThreshold || 1)) * 100);
    const tierAccentClass = tier >= 4
        ? 'text-fuchsia-200'
        : tier === 3
            ? 'text-sky-200'
            : tier === 2
                ? 'text-emerald-200'
                : 'text-amber-50';
    const tierBadgeClass = tier >= 4
        ? 'bg-fuchsia-950/80 text-fuchsia-100'
        : tier === 3
            ? 'bg-sky-950/80 text-sky-100'
            : tier === 2
                ? 'bg-emerald-950/80 text-emerald-100'
                : 'bg-black/65 text-amber-50';
    const tierTextClass = tier >= 4
        ? 'text-fuchsia-100'
        : tier === 3
            ? 'text-sky-100'
            : tier === 2
                ? 'text-emerald-100'
                : 'text-amber-50';

    if (compact) {
        return (
            <div className={`${compactBare ? 'bg-transparent border-0 rounded-none shadow-none backdrop-blur-0' : 'bg-stone-900/66 border border-stone-800 rounded-xl shadow-inner backdrop-blur-sm'} px-1.5 py-1.5 min-w-0`}>
                <div className="flex flex-col items-center text-center gap-1">
                    <div className={`relative w-11 h-11 ${compactBare ? 'rounded-lg bg-stone-950/90 border border-white/5 shadow-sm' : 'rounded-xl bg-stone-950 border border-stone-800 shadow-md'} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${tierAccentClass}`} />
                        <span className={`absolute right-1 top-1 rounded-md px-1 py-[1px] text-[7px] font-black uppercase leading-none ${tierBadgeClass}`}>
                            T{tier}
                        </span>
                    </div>
                    <div className="leading-none">
                        <div className="text-[9px] font-black uppercase tracking-[0.04em] text-stone-200 truncate">{label}</div>
                        <div className="mt-0.5 text-[11px] font-mono font-black text-stone-100">LV.{level}</div>
                    </div>
                    <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-amber-600 transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3 md:p-3.5 flex items-center gap-4 md:gap-4.5 shadow-inner min-w-[184px] md:min-w-[236px]">
            <div className="p-2.5 md:p-2.5 bg-stone-950 rounded-lg border border-stone-800 shadow-md flex flex-col items-center gap-1">
                <Icon className={`w-4.5 h-4.5 md:w-5.5 md:h-5.5 ${tierAccentClass}`} />
                <span className={`text-[8px] md:text-[9px] font-black uppercase ${tierTextClass}`}>T{tier}</span>
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
