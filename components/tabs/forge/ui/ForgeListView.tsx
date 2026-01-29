
import React from 'react';
import { Sword, Shield, ChevronDown, ChevronRight, Heart } from 'lucide-react';
import RecipeCard from './RecipeCard';
import { EquipmentCategory, EquipmentItem } from '../../../../types';

interface ForgeListViewProps {
    activeCategory: EquipmentCategory;
    expandedSubCat: string | null;
    favoriteItems: EquipmentItem[];
    isFavExpanded: boolean;
    visibleSubCats: any[];
    groupedItems: Record<string, EquipmentItem[]>;
    selectedItem: EquipmentItem | null;
    favorites: string[];
    getInventoryCount: (id: string) => number;
    getItemImageUrl: (item: EquipmentItem) => string;
    onCategoryChange: (cat: EquipmentCategory) => void;
    onToggleSubCategory: (id: string) => void;
    onToggleFavExpanded: () => void;
    onSelectItem: (item: EquipmentItem) => void;
    onToggleFavorite: (e: React.MouseEvent, id: string) => void;
    onMouseEnter: (item: EquipmentItem, e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
}

export const ForgeListView: React.FC<ForgeListViewProps> = ({
    activeCategory, expandedSubCat, favoriteItems, isFavExpanded, visibleSubCats, groupedItems,
    selectedItem, favorites, getInventoryCount, getItemImageUrl,
    onCategoryChange, onToggleSubCategory, onToggleFavExpanded, onSelectItem, onToggleFavorite,
    onMouseEnter, onMouseMove, onMouseLeave
}) => {
    return (
        <div className="h-full bg-stone-900/95 flex flex-col relative">
            <div className="flex border-b border-stone-800 shrink-0">
                <button 
                    onClick={() => onCategoryChange('WEAPON')} 
                    className={`flex-1 py-4 text-center font-black text-[10px] md:text-xs transition-colors ${activeCategory === 'WEAPON' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300'}`}
                >
                    <Sword className="w-3 h-3 md:w-4 md:h-4 inline mr-2" /> WEAPONS
                </button>
                <button 
                    onClick={() => onCategoryChange('ARMOR')} 
                    className={`flex-1 py-4 text-center font-black text-[10px] md:text-xs transition-colors ${activeCategory === 'ARMOR' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300'}`}
                >
                    <Shield className="w-3 h-3 md:w-4 md:h-4 inline mr-2" /> ARMORS
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 space-y-4">
                {favoriteItems.length > 0 && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-500">
                        <button 
                            onClick={onToggleFavExpanded} 
                            className="w-full flex items-center justify-between px-3 py-2 bg-stone-800/40 rounded-lg group"
                        >
                            <span className="text-[10px] md:text-xs font-black uppercase text-stone-400 group-hover:text-amber-500 transition-colors">Favorites</span>
                            {isFavExpanded ? <ChevronDown className="w-4 h-4 text-stone-600" /> : <ChevronRight className="w-4 h-4 text-stone-600" />}
                        </button>
                        {isFavExpanded && (
                            <div className="grid grid-cols-2 gap-2">
                                {favoriteItems.map(item => (
                                    <RecipeCard 
                                        key={`fav-${item.id}`} 
                                        item={item} 
                                        isSelected={selectedItem?.id === item.id} 
                                        isFav={true} 
                                        inventoryCount={getInventoryCount(item.id)} 
                                        onSelect={onSelectItem} 
                                        onToggleFavorite={onToggleFavorite} 
                                        onMouseEnter={onMouseEnter} 
                                        onMouseMove={onMouseMove} 
                                        onMouseLeave={onMouseLeave} 
                                        imageUrl={getItemImageUrl(item)} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {visibleSubCats.map((subCat, idx) => (
                    <div key={subCat.id} className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                        <button 
                            onClick={() => onToggleSubCategory(subCat.id)} 
                            className="w-full flex items-center justify-between px-3 py-2 bg-stone-800/40 rounded-lg group"
                        >
                            <span className="text-[10px] md:text-xs font-black uppercase text-stone-400 group-hover:text-amber-500 transition-colors">{subCat.name}</span>
                            {expandedSubCat === subCat.id ? <ChevronDown className="w-3 h-3 text-stone-600" /> : <ChevronRight className="w-3 h-3 text-stone-600" />}
                        </button>
                        {expandedSubCat === subCat.id && (
                            <div className="grid grid-cols-2 gap-2">
                                {groupedItems[subCat.id]?.map(item => (
                                    <RecipeCard 
                                        key={item.id} 
                                        item={item} 
                                        isSelected={selectedItem?.id === item.id} 
                                        isFav={favorites.includes(item.id)} 
                                        inventoryCount={getInventoryCount(item.id)} 
                                        onSelect={onSelectItem} 
                                        onToggleFavorite={onToggleFavorite} 
                                        onMouseEnter={onMouseEnter} 
                                        onMouseMove={onMouseMove} 
                                        onMouseLeave={onMouseLeave} 
                                        imageUrl={getItemImageUrl(item)} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
