import React from 'react';
import { Hammer, Sparkles, Flame, Activity } from 'lucide-react';
import { CraftingType } from '../../../../types/inventory';
import { useGame } from '../../../../context/GameContext';
import { t } from '../../../../utils/i18n';

interface QuickCraftOverlayProps {
    progress: number;
    extraFuel: number;
    craftingType: CraftingType;
    quality: number;
}

const QuickCraftOverlay: React.FC<QuickCraftOverlayProps> = ({ progress, extraFuel, craftingType, quality }) => {
    const { state } = useGame();
    const language = state.settings.language;
    const isWorkbench = craftingType === 'WORKBENCH';
    const CraftIcon = isWorkbench ? Activity : Hammer;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-72 md:w-96 bg-stone-900 border-2 border-indigo-600/50 rounded-3xl p-6 md:p-10 shadow-[0_0_50px_rgba(79,70,229,0.3)] flex flex-col items-center gap-6 animate-in zoom-in-95">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                    <CraftIcon className="w-12 h-12 text-indigo-400 animate-bounce relative z-10" />
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-300 animate-pulse z-20" />
                </div>
                
                <div className="w-full space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-widest">
                                {t(language, isWorkbench ? 'forge.quick_craft_workbench_title' : 'forge.quick_craft_forge_title')}
                            </span>
                            {extraFuel > 0 && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                    <span className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-tighter">
                                        {t(language, 'forge.quick_craft_extra_fuel', { amount: extraFuel })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="h-4 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800 shadow-inner p-1">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-700 via-indigo-500 to-amber-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                
                <div className="flex flex-col items-center text-center gap-1.5">
                    <p className="text-stone-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] animate-pulse italic">
                        {t(language, isWorkbench ? 'forge.quick_craft_workbench_status' : 'forge.quick_craft_forge_status')}
                    </p>
                    <span className="text-indigo-400/80 font-black text-[7px] md:text-[9px] uppercase tracking-wider px-2 py-0.5 bg-indigo-950/40 rounded border border-indigo-900/30">
                        {t(language, 'forge.quick_craft_quality_guaranteed', { quality })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default QuickCraftOverlay;
