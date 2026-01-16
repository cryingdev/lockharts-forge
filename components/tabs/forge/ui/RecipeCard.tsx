
import React from 'react';
import { Heart, Box } from 'lucide-react';
import { EquipmentItem } from '../../../../types';

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
    return (
        <div 
            onClick={() => onSelect(item)}
            data-tutorial-id={item.id === 'sword_bronze_t1' ? 'SWORD_RECIPE' : undefined}
            onMouseEnter={(e) => onMouseEnter(item, e)} 
            onMouseMove={onMouseMove} 
            onMouseLeave={onMouseLeave}
            className={`relative flex flex-col items-center rounded-lg border transition-all cursor-pointer group text-left h-[115px] md:h-[130px] overflow-hidden ${isSelected ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-stone-800 border-stone-700 hover:border-stone-500 hover:bg-stone-750'}`}
        >
            <div className="w-full flex justify-between items-start p-1.5 md:p-2 z-10">
                 <span className={`text-[8px] md:text-[10px] font-bold tracking-wider font-mono ${isSelected ? 'text-amber-400' : 'text-stone-600'}`}>T{item.tier}</span>
                 <button onClick={(e) => onToggleFavorite(e, item.id)} className="p-1 rounded-full hover:bg-stone-700 transition-colors">
                     <Heart className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-stone-600 hover:text-stone-400'}`} />
                 </button>
            </div>
            <div className="flex-1 flex items-center justify-center group-hover:scale-110 transition-transform -mt-2">
                <img src={imageUrl} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" />
            </div>
            <div className="w-full text-center pb-1.5 px-1 flex flex-col items-center gap-0.5">
                <div className={`text-[10px] md:text-xs font-bold leading-tight truncate w-full ${isSelected ? 'text-amber-200' : 'text-stone-300'}`}>
                    {item.name}
                </div>
                {inventoryCount > 0 && (
                    <div className="inline-flex items-center gap-0.5 bg-stone-950/50 px-1.5 py-0.5 rounded text-[8px] font-mono text-stone-500 border border-stone-800/50">
                        <Box className="w-2 h-2" /> {inventoryCount}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecipeCard;
