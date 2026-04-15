
import React from 'react';
import { Heart, Box, Coins, ScrollText } from 'lucide-react';
import { EquipmentItem } from '../../../../types';
import { useAudio } from '../../../../hooks/useAudio';
import { useGame } from '../../../../context/GameContext';
import { getLocalizedItemName } from '../../../../utils/itemText';
import { t } from '../../../../utils/i18n';

interface RecipeCardProps {
    item: EquipmentItem;
    isSelected: boolean;
    isFav: boolean;
    inventoryCount: number;
    canCraft: boolean;
    onSelect: (item: EquipmentItem) => void;
    onToggleFavorite: (e: React.MouseEvent, itemId: string) => void;
    onMouseEnter: (item: EquipmentItem, e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
    imageUrl: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
    item, isSelected, isFav, inventoryCount, canCraft, onSelect, onToggleFavorite,
    onMouseEnter, onMouseMove, onMouseLeave, imageUrl
}) => {
    const { state } = useGame();
    const { playClick } = useAudio();
    const language = state.settings.language;

    const isPipOrder = state.tutorialStep === 'CRAFT_FIRST_SWORD_GUIDE' && item.id === 'sword_bronze_t1';

    return (
        <div 
            onClick={() => {
                playClick();
                onSelect(item);
            }}
            data-tutorial-id={item.id === 'sword_bronze_t1' ? 'SWORD_RECIPE' : undefined}
            onMouseEnter={(e) => onMouseEnter(item, e)} 
            onMouseMove={onMouseMove} 
            onMouseLeave={onMouseLeave}
            className={`relative flex flex-col items-center rounded-lg border transition-all cursor-pointer group text-left h-[115px] md:h-[135px] overflow-hidden active:scale-[0.985] ${
                isPipOrder 
                    ? 'bg-emerald-900/20 border-emerald-500/50 animate-pulse' 
                    : canCraft
                        ? 'bg-stone-800 border-stone-700 hover:border-stone-500 hover:bg-stone-750 active:bg-stone-700/90'
                        : 'bg-red-950/25 border-red-900/70 hover:border-red-700/80 hover:bg-red-950/40 active:bg-red-950/55'
            }`}
        >
            {isPipOrder && (
                <div className="absolute top-0 left-0 w-full bg-emerald-600/80 text-[8px] md:text-[10px] text-white font-black uppercase tracking-tighter py-0.5 px-1 flex items-center justify-center gap-1 z-20 shadow-lg">
                    <ScrollText className="w-2 h-2 md:w-2.5 md:h-2.5" /> Pip's Order
                </div>
            )}
            {inventoryCount > 0 && (
                <div className="absolute left-1 top-1 z-20 flex items-center gap-1 rounded-md border border-slate-600 bg-slate-950/88 px-1.5 py-0.5 text-[10px] font-black uppercase leading-none text-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.35)] md:text-[11px]">
                    <Box className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    <span>{inventoryCount}</span>
                </div>
            )}
            {!canCraft && !isSelected && !isPipOrder && (
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-20 rounded-full border border-red-800/70 bg-red-950/80 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-red-200 shadow-sm">
                    {t(language, 'common.insufficient_materials')}
                </div>
            )}
            <div className="w-full flex justify-between items-start p-1.5 md:p-2 z-10">
                 <span className={`text-[8px] md:text-[10px] font-bold tracking-wider font-mono ${
                    canCraft ? 'text-stone-600' : 'text-red-300/80'
                 }`}>T{item.tier}</span>
                 <button onClick={(e) => onToggleFavorite(e, item.id)} className="p-1 rounded-full hover:bg-stone-700 transition-colors">
                     <Heart className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-stone-600 hover:text-stone-400'}`} />
                 </button>
            </div>
            <div className="flex-1 flex items-center justify-center group-hover:scale-110 transition-transform -mt-2">
                <img src={imageUrl} className={`w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md ${canCraft ? '' : 'opacity-65 saturate-50'}`} />
            </div>
            <div className="w-full text-center pb-1.5 px-1 flex flex-col items-center gap-1">
                <div className={`text-[10px] md:text-xs font-bold leading-tight truncate w-full ${
                    canCraft ? 'text-stone-300' : 'text-red-100/90'
                }`}>
                    {getLocalizedItemName(language, item)}
                </div>
                
                <div className="flex items-center gap-1">
                    <div className={`inline-flex items-center gap-0.5 bg-stone-950/50 px-1 md:px-1.5 py-0.5 rounded text-[8px] font-mono border ${
                        canCraft ? 'text-amber-500/80 border-stone-800/50' : 'text-red-300/80 border-red-900/50'
                    }`} title="Base Value">
                        <Coins className="w-2 h-2 text-amber-600" /> {item.baseValue}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;
