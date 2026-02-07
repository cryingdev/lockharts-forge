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
        <div className="h-full bg-transparent flex flex-col relative">
            <div className="flex border-b border-stone-800 shrink-0 bg-stone-900/60 backdrop-blur-sm">
                <button 
                    onClick={() => onCategoryChange('WEAPON')} 
                    className={`flex-1 py-4 text-center font-black text-[11px] md:text-sm transition-colors ${activeCategory === 'WEAPON' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300'}`}
                >
                    <Sword className="w-4 h-4 inline mr-2" /> WEAPONS
                </button>
                <button 
                    onClick={() => onCategoryChange('ARMOR')} 
                    className={`flex-1 py-4 text-center font-black text-[11px] md:text-sm transition-colors ${activeCategory === 'ARMOR' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300'}`}
                >
                    <Shield className="w-4 h-4 inline mr-2" /> ARMORS
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
                {favoriteItems.length > 0 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-500">
                        <button 
                            onClick={onToggleFavExpanded} 
                            className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-950/20 border border-amber-900/20 rounded-xl group transition-all hover:bg-amber-900/30"
                        >
                            <div className="flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                                <span className="text-[11px] md:text-xs font-black uppercase text-amber-500 tracking-[0.1em]">Treasured Designs</span>
                            </div>
                            {isFavExpanded ? <ChevronDown className="w-4 h-4 text-amber-700" /> : <ChevronRight className="w-4 h-4 text-amber-700" />}
                        </button>
                        {isFavExpanded && (
                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
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
                    <div key={subCat.id} className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                        <button 
                            onClick={() => onToggleSubCategory(subCat.id)} 
                            className="w-full flex items-center justify-between px-4 py-2.5 bg-stone-800/40 border border-stone-700/30 rounded-xl group transition-all hover:bg-stone-800/60"
                        >
                            <span className="text-[11px] md:text-xs font-black uppercase text-stone-400 group-hover:text-amber-500 transition-colors tracking-widest">{subCat.name}</span>
                            <div className="flex-1 h-px bg-stone-800 mx-4 opacity-50"></div>
                            {expandedSubCat === subCat.id ? <ChevronDown className="w-4 h-4 text-stone-600" /> : <ChevronRight className="w-4 h-4 text-stone-600" />}
                        </button>
                        {expandedSubCat === subCat.id && (
                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
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