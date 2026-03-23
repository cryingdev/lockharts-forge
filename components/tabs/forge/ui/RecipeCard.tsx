
import React from 'react';
import { Heart, Box, Coins, ScrollText } from 'lucide-react';
import { EquipmentItem } from '../../../../types';
import { useAudio } from '../../../../hooks/useAudio';
import { useGame } from '../../../../context/GameContext';

interface RecipeCardProps {
    item: EquipmentItem;
    isSelected: boolean;
    isFav: boolean;
    inventoryCount: number;
    onSelect: (item: EquipmentItem) => void;
    onToggleFavorite: (e: React.MouseEvent, itemId: string) => void;
    onMouseEnter: (item: EquipmentItem, e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
    imageUrl: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
    item, isSelected, isFav, inventoryCount, onSelect, onToggleFavorite,
    onMouseEnter, onMouseMove, onMouseLeave, imageUrl
}) => {
    const { state } = useGame();
    const { playClick } = useAudio();

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
            className={`relative flex flex-col items-center rounded-lg border transition-all cursor-pointer group text-left h-[115px] md:h-[135px] overflow-hidden ${
                isSelected 
                    ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                    : isPipOrder 
                        ? 'bg-emerald-900/20 border-emerald-500/50 animate-pulse' 
                        : 'bg-stone-800 border-stone-700 hover:border-stone-500 hover:bg-stone-750'
            }`}
        >
            {isPipOrder && (
                <div className="absolute top-0 left-0 w-full bg-emerald-600/80 text-[8px] md:text-[10px] text-white font-black uppercase tracking-tighter py-0.5 px-1 flex items-center justify-center gap-1 z-20 shadow-lg">
                    <ScrollText className="w-2 h-2 md:w-2.5 md:h-2.5" /> Pip's Order
                </div>
            )}
            <div className="w-full flex justify-between items-start p-1.5 md:p-2 z-10">
                 <span className={`text-[8px] md:text-[10px] font-bold tracking-wider font-mono ${isSelected ? 'text-amber-400' : 'text-stone-600'}`}>T{item.tier}</span>
                 <button onClick={(e) => onToggleFavorite(e, item.id)} className="p-1 rounded-full hover:bg-stone-700 transition-colors">
                     <Heart className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-stone-600 hover:text-stone-400'}`} />
                 </button>
            </div>
            <div className="flex-1 flex items-center justify-center group-hover:scale-110 transition-transform -mt-2">
                <img src={imageUrl} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" />
            </div>
            <div className="w-full text-center pb-1.5 px-1 flex flex-col items-center gap-1">
                <div className={`text-[10px] md:text-xs font-bold leading-tight truncate w-full ${isSelected ? 'text-amber-200' : 'text-stone-300'}`}>
                    {item.name}
                </div>
                
                <div className="flex items-center gap-1">
                    {inventoryCount > 0 && (
                        <div className="inline-flex items-center gap-0.5 bg-stone-950/50 px-1 md:px-1.5 py-0.5 rounded text-[8px] font-mono text-stone-500 border border-stone-800/50" title="In Storage">
                            <Box className="w-2 h-2" /> {inventoryCount}
                        </div>
                    )}
                    <div className="inline-flex items-center gap-0.5 bg-stone-950/50 px-1 md:px-1.5 py-0.5 rounded text-[8px] font-mono text-amber-500/80 border border-stone-800/50" title="Base Value">
                        <Coins className="w-2 h-2 text-amber-600" /> {item.baseValue}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;
