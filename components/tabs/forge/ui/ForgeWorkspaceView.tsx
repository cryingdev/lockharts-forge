
import React from 'react';
import { Hammer, FastForward, AlertCircle, Flame, Zap } from 'lucide-react';
import MasteryRadialGauge from './MasteryRadialGauge';
import ForgeStatsGrid from './ForgeStatsGrid';
import { SfxButton } from '../../../common/ui/SfxButton';
import { EquipmentItem } from '../../../../types';
import { useGame } from '../../../../context/GameContext';
import { getLocalizedItemDescription } from '../../../../utils/itemText';
import { t } from '../../../../utils/i18n';

interface ForgeWorkspaceViewProps {
    selectedItem: EquipmentItem | null;
    masteryInfo: any;
    imageUrl: string;
    canEnterForge: boolean;
    isFuelShortage: boolean;
    isQuickFuelShortage: boolean;
    isEnergyShortage: boolean;
    quickCraftProgress: number | null;
    extraFuelCost: number;
    onStartCrafting: (e?: React.MouseEvent) => void;
    onQuickCraft: (e?: React.MouseEvent) => void;
    onOpenRecipes: () => void;
}

export const ForgeWorkspaceView: React.FC<ForgeWorkspaceViewProps> = ({
    selectedItem, masteryInfo, imageUrl, canEnterForge, isFuelShortage, isQuickFuelShortage,
    isEnergyShortage, quickCraftProgress, extraFuelCost, onStartCrafting, onQuickCraft, onOpenRecipes
}) => {
    const { state } = useGame();
    const language = state.settings.language;

    if (!selectedItem) {
        return (
            <div className="z-10 flex flex-col items-center text-center animate-in fade-in duration-700 px-6">
                <SfxButton
                    sfx="switch"
                    onClick={onOpenRecipes}
                    className="w-24 h-24 sm:w-28 sm:h-28 bg-stone-900/92 rounded-full flex items-center justify-center mb-6 border border-stone-700 shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:bg-stone-800/95 active:scale-95"
                >
                    <Hammer className="w-12 h-12 sm:w-14 sm:h-14 opacity-70 text-stone-200" />
                </SfxButton>
                <h3 className="text-[1.45rem] md:text-[1.9rem] font-black uppercase tracking-[0.14em] text-stone-50 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                    {t(language, 'forge.select_pattern')}
                </h3>
                <p className="text-[13px] md:text-[15px] mt-3 text-stone-200/95 font-black tracking-[0.08em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                    {t(language, 'forge.workspace_tagline')}
                </p>
            </div>
        );
    }

    return (
        <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full max-w-lg mx-auto">
            <MasteryRadialGauge imageUrl={imageUrl} masteryInfo={masteryInfo} onOpenRecipes={onOpenRecipes} />
            <h2 className="text-[1.85rem] md:text-[2.35rem] font-bold text-amber-500 mb-2 font-serif tracking-wide text-center px-5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">{selectedItem.name}</h2>
            <p className="text-stone-300/85 mb-7 italic text-[12px] md:text-[15px] text-center px-8">"{getLocalizedItemDescription(language, selectedItem)}"</p>
            <ForgeStatsGrid item={selectedItem} />
            
            <div className="flex flex-col sm:flex-row gap-3 w-full items-center justify-center px-4">
                <SfxButton 
                    onClick={(e) => onStartCrafting(e)} 
                    data-tutorial-id="START_FORGING_BUTTON"
                    className={`w-full max-w-[230px] h-16 md:h-20 rounded-xl font-black text-[15px] md:text-[18px] shadow-xl transition-all flex flex-col items-center justify-center border-b-4 active:translate-y-0.5 ${
                        canEnterForge 
                            ? (selectedItem.craftingType === 'FORGE' ? 'bg-amber-700 hover:bg-amber-600 border-amber-500 border-b-amber-900' : 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500 border-b-emerald-900') 
                            : isEnergyShortage
                                ? 'bg-red-900/60 border-red-500 border-b-red-950 text-red-100'
                                : isFuelShortage 
                                    ? 'bg-red-950/40 border-red-900/60 text-red-500 border-b-red-950' 
                                    : 'bg-stone-800 text-stone-500 border-stone-700 border-b-stone-950 grayscale opacity-70'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Hammer className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="uppercase tracking-widest">{t(language, 'forge.start_work')}</span>
                    </div>
                    {isEnergyShortage ? (
                        <div className="flex items-center gap-1 mt-1 animate-pulse">
                            <Zap className="w-3 h-3 text-red-400" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{t(language, 'forge.low_energy')}</span>
                        </div>
                    ) : isFuelShortage && (
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1 animate-pulse">{t(language, 'forge.need_charcoal')}</span>
                    )}
                </SfxButton>

                {masteryInfo.count >= 1 && (
                    <SfxButton 
                        onClick={(e) => onQuickCraft(e)}
                        disabled={quickCraftProgress !== null}
                        className={`w-full max-w-[230px] h-16 md:h-20 rounded-xl font-black text-[15px] md:text-[18px] shadow-xl transition-all flex flex-col items-center justify-center gap-0.5 border-b-4 active:translate-y-0.5 ${
                            isEnergyShortage || isQuickFuelShortage
                                ? 'bg-red-950/20 border-red-900/40 text-red-400 border-b-red-950'
                                : 'bg-indigo-900/40 hover:bg-indigo-800/60 border-indigo-500/50 text-indigo-100 border-b-indigo-950'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {(isEnergyShortage || isQuickFuelShortage) ? <AlertCircle className="w-5 h-5 text-red-500" /> : <FastForward className="w-5 h-5 md:w-6 md:h-6" />}
                            <span className="uppercase tracking-widest">{t(language, 'forge.quick_craft')}</span>
                        </div>
                        {isEnergyShortage ? (
                            <span className="text-[9px] md:text-[10px] font-bold text-red-500 uppercase">{t(language, 'forge.insufficient_energy')}</span>
                        ) : extraFuelCost > 0 && (
                            <div className={`flex items-center gap-1 text-[9px] md:text-[10px] font-bold uppercase tracking-tighter ${isQuickFuelShortage ? 'text-red-500' : 'text-indigo-400'}`}>
                                <Flame className="w-3 h-3" />
                                <span>-{extraFuelCost} Fuel</span>
                            </div>
                        )}
                    </SfxButton>
                )}
            </div>
        </div>
    );
};
