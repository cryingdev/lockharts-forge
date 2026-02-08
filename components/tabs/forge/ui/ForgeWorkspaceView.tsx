import React from 'react';
import { Hammer, FastForward, AlertCircle, Flame } from 'lucide-react';
import MasteryRadialGauge from './MasteryRadialGauge';
import ForgeStatsGrid from './ForgeStatsGrid';
import { SfxButton } from '../../../common/ui/SfxButton';
import { EquipmentItem } from '../../../../types';

interface ForgeWorkspaceViewProps {
    selectedItem: EquipmentItem | null;
    masteryInfo: any;
    imageUrl: string;
    canEnterForge: boolean;
    isFuelShortage: boolean;
    isQuickFuelShortage: boolean;
    quickCraftProgress: number | null;
    extraFuelCost: number;
    onStartCrafting: (e?: React.MouseEvent) => void;
    onQuickCraft: (e?: React.MouseEvent) => void;
}

export const ForgeWorkspaceView: React.FC<ForgeWorkspaceViewProps> = ({
    selectedItem, masteryInfo, imageUrl, canEnterForge, isFuelShortage, isQuickFuelShortage,
    quickCraftProgress, extraFuelCost, onStartCrafting, onQuickCraft
}) => {
    if (!selectedItem) {
        return (
            <div className="z-10 flex flex-col items-center text-stone-600 text-center animate-in fade-in duration-700">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-stone-900 rounded-full flex items-center justify-center mb-6 border border-stone-800 shadow-inner">
                    <Hammer className="w-8 h-8 sm:w-12 sm:h-12 opacity-20" />
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-[0.3em] opacity-40">Select a Pattern</h3>
                <p className="text-[10px] md:text-sm mt-2 text-stone-700 font-bold uppercase tracking-widest">Mastery leads to retribution.</p>
            </div>
        );
    }

    return (
        <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full max-w-lg mx-auto">
            <MasteryRadialGauge imageUrl={imageUrl} masteryInfo={masteryInfo} />
            <h2 className="text-xl md:text-3xl font-bold text-amber-500 mb-1.5 font-serif tracking-wide">{selectedItem.name}</h2>
            <p className="text-stone-500 mb-6 italic text-[9px] md:text-sm px-6">"{selectedItem.description}"</p>
            <ForgeStatsGrid item={selectedItem} />
            
            <div className="flex flex-col sm:flex-row gap-3 w-full items-center justify-center px-4">
                <SfxButton 
                    onClick={(e) => onStartCrafting(e)} 
                    data-tutorial-id="START_FORGING_BUTTON"
                    className={`w-full max-w-[200px] h-14 md:h-20 rounded-xl font-black text-sm md:text-base shadow-xl transition-all flex flex-col items-center justify-center border-b-4 active:translate-y-0.5 ${
                        canEnterForge 
                            ? (selectedItem.craftingType === 'FORGE' ? 'bg-amber-700 hover:bg-amber-600 border-amber-500 border-b-amber-900' : 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500 border-b-emerald-900') 
                            : isFuelShortage 
                                ? 'bg-red-950/40 border-red-900/60 text-red-500 border-b-red-950' 
                                : 'bg-stone-800 text-stone-500 border-stone-700 border-b-stone-950 grayscale opacity-70'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Hammer className="w-4 h-4 md:w-6 md:h-6" />
                        <span className="uppercase tracking-widest">Start Work</span>
                    </div>
                    {isFuelShortage && (
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest mt-1 animate-pulse">Need Charcoal</span>
                    )}
                </SfxButton>

                {masteryInfo.count >= 1 && (
                    <SfxButton 
                        onClick={(e) => onQuickCraft(e)}
                        disabled={quickCraftProgress !== null}
                        className={`w-full max-w-[200px] h-14 md:h-20 rounded-xl font-black text-sm md:text-base shadow-xl transition-all flex flex-col items-center justify-center gap-0.5 border-b-4 active:translate-y-0.5 ${
                            isQuickFuelShortage
                                ? 'bg-red-950/20 border-red-900/40 text-red-400 border-b-red-950'
                                : 'bg-indigo-900/40 hover:bg-indigo-800/60 border-indigo-500/50 text-indigo-100 border-b-indigo-950'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {isQuickFuelShortage ? <AlertCircle className="w-4 h-4 text-red-500" /> : <FastForward className="w-4 h-4 md:w-5 md:h-5" />}
                            <span className="uppercase tracking-widest">Quick Craft</span>
                        </div>
                        {extraFuelCost > 0 && (
                            <div className={`flex items-center gap-1 text-[8px] md:text-[9px] font-bold uppercase tracking-tighter ${isQuickFuelShortage ? 'text-red-500' : 'text-indigo-400'}`}>
                                <Flame className="w-2.5 h-2.5" />
                                <span>-{extraFuelCost} Fuel</span>
                            </div>
                        )}
                    </SfxButton>
                )}
            </div>
        </div>
    );
};