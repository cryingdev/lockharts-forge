import React, { useState, useMemo } from 'react';
import { 
  Box, Sword, Shield, Sparkles, FlaskConical, Package, 
  ChevronRight, AlertCircle, Check, X 
} from 'lucide-react';
import { InventoryItem, EquipmentSlotType } from '../../types/inventory';
import { Mercenary } from '../../models/Mercenary';
import { PrimaryStats, mergePrimaryStats } from '../../models/Stats';
import { getAssetUrl } from '../../utils';

type CategoryFilter = 'ALL' | 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'CONSUMABLE';

interface EquipmentInventoryListProps {
  inventory: InventoryItem[];
  selectedItemId: string | null;
  onSelect: (itemId: string) => void;
  onEquip: (itemId: string) => void;
  onConsume: (itemId: string) => void;
  selectedSlotFilter: EquipmentSlotType | null;
  mercenary: Mercenary;
  isReadOnly?: boolean;
  onToggleInventory: () => void;
}

const getRarityClasses = (rarity?: string) => {
  switch (rarity) {
    case 'Legendary':
      return 'text-amber-400 border-amber-500/50 bg-amber-950/40';
    case 'Epic':
      return 'text-purple-400 border-purple-500/50 bg-purple-950/40';
    case 'Rare':
      return 'text-blue-400 border-blue-500/50 bg-blue-950/40';
    case 'Uncommon':
      return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
    default:
      return 'text-stone-400 border-stone-700/50 bg-stone-900/40';
  }
};

const getQualityLabel = (q: number): string => {
  if (q >= 110) return 'MASTERWORK';
  if (q >= 100) return 'PRISTINE';
  if (q >= 90) return 'SUPERIOR';
  if (q >= 80) return 'FINE';
  if (q >= 70) return 'STANDARD';
  if (q >= 60) return 'RUSTIC';
  return 'CRUDE';
};

export const EquipmentInventoryList: React.FC<EquipmentInventoryListProps> = ({
  inventory,
  selectedItemId,
  onSelect,
  onEquip,
  onConsume,
  selectedSlotFilter,
  mercenary,
  isReadOnly,
  onToggleInventory,
}) => {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('ALL');

  const pureMercStats = useMemo(() => {
    return mergePrimaryStats(mercenary.stats, mercenary.allocatedStats);
  }, [mercenary.stats, mercenary.allocatedStats]);

  const displayInventory = useMemo(() => {
    let filtered = inventory;

    if (selectedSlotFilter) {
      return filtered.filter((item) => item.equipmentData?.slotType === selectedSlotFilter);
    }

    if (activeFilter === 'WEAPON') {
      return filtered.filter((item) => item.equipmentData?.slotType === 'MAIN_HAND');
    }
    if (activeFilter === 'ARMOR') {
      return filtered.filter((item) => 
        ['HEAD', 'BODY', 'LEGS', 'HANDS', 'FEET', 'OFF_HAND'].includes(item.equipmentData?.slotType || '')
      );
    }
    if (activeFilter === 'ACCESSORY') {
      return filtered.filter((item) => ['ACCESSORY', 'WAIST'].includes(item.equipmentData?.slotType || ''));
    }
    if (activeFilter === 'CONSUMABLE') {
      return filtered.filter((item) => item.type === 'CONSUMABLE');
    }

    return filtered;
  }, [inventory, selectedSlotFilter, activeFilter]);

  const filterChips: { id: CategoryFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'ALL', label: 'All', icon: <Box className="w-3 h-3" /> },
    { id: 'WEAPON', label: 'Weapons', icon: <Sword className="w-3 h-3" /> },
    { id: 'ARMOR', label: 'Armor', icon: <Shield className="w-3 h-3" /> },
    { id: 'ACCESSORY', label: 'Accessory', icon: <Sparkles className="w-3 h-3" /> },
    { id: 'CONSUMABLE', label: 'Items', icon: <FlaskConical className="w-3 h-3" /> },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div 
        onClick={onToggleInventory}
        className="p-4 md:p-6 bg-stone-950 border-b border-white/5 flex justify-between items-center shrink-0 z-10 backdrop-blur-md cursor-pointer hover:bg-stone-900 transition-colors group"
      >
        <div className="flex flex-col">
            <h3 className="text-[10px] md:text-sm font-black text-stone-100 uppercase tracking-widest flex items-center gap-2 group-hover:text-amber-500 transition-colors">
            <Package className="w-4 h-4 text-amber-600" />
            <span>{selectedSlotFilter ? `Filtering: ${selectedSlotFilter}` : 'Squad Inventory'}</span>
            </h3>
            <span className="text-[7px] md:text-[10px] text-stone-500 font-mono mt-0.5 uppercase">Click Header to Close</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] md:text-xs text-stone-600 font-mono bg-stone-900 px-2 py-0.5 rounded border border-stone-800">{displayInventory.length} ITEMS</span>
          <ChevronRight className="w-4 h-4 text-stone-700 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {!selectedSlotFilter && (
        <div className="px-3 md:px-6 py-2 md:py-3 bg-stone-950/40 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] md:text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap ${
                activeFilter === chip.id
                  ? 'bg-amber-600 border-amber-400 text-white shadow-glow-sm'
                  : 'bg-stone-800 border-stone-700 text-stone-500 hover:text-stone-300'
              }`}
            >
              {chip.icon}
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-2 md:space-y-3">
        {displayInventory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-800 italic p-12 text-center">
            <Box className="w-12 h-12 opacity-10 mb-2" />
            <p className="text-xs">No suitable gear found.</p>
            {selectedSlotFilter && (
              <button 
                onClick={onToggleInventory}
                className="mt-4 px-4 py-2 bg-stone-800 text-stone-400 rounded-lg text-[10px] uppercase font-bold hover:text-stone-200"
              >
                Back to View All
              </button>
            )}
          </div>
        ) : (
          displayInventory.map((item) => {
            const isConsumable = item.type === 'CONSUMABLE';
            const isSelected = selectedItemId === item.id;
            
            const minLevel = item.equipmentData?.minLevel || 1;
            const canEquip = isConsumable || (mercenary.level >= minLevel);

            const rarityClasses = isConsumable ? 'text-stone-400 border-stone-700 bg-stone-900/40' : getRarityClasses(item.equipmentData?.rarity);
            const imageUrl = item.type === 'EQUIPMENT' && item.equipmentData
              ? (item.equipmentData.image
                  ? getAssetUrl(item.equipmentData.image)
                  : item.equipmentData.recipeId
                    ? getAssetUrl(`${item.equipmentData.recipeId}.png`)
                    : getAssetUrl(`${item.id.split('_')[0]}.png`))
              : getAssetUrl(`${item.id}.png`);

            return (
              <div
                key={item.id}
                onClick={() => !isSelected && onSelect(item.id)}
                className={`flex flex-col gap-2 p-3 md:p-5 rounded-xl border transition-all ${
                  isSelected ? 'border-amber-500 bg-stone-900/80 shadow-inner' : 'border-stone-800 bg-stone-900/30'
                } cursor-pointer group relative overflow-hidden ${!isConsumable && !canEquip ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`w-10 h-10 md:w-16 md:h-16 bg-stone-950 rounded-lg border-2 flex items-center justify-center shrink-0 ${rarityClasses}`}>
                    <img src={imageUrl} className="w-8 h-8 md:w-12 md:h-12 object-contain" alt={item.name} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] md:text-lg font-black truncate text-stone-200">{item.name}</div>
                    <div className="flex wrap items-center gap-2 mt-1">
                      <span className={`text-[7px] md:text-[9px] px-1.5 py-0.5 rounded font-black uppercase border leading-none ${rarityClasses}`}>
                        {isConsumable ? 'CONSUMABLE' : item.equipmentData?.rarity}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[7px] md:text-[9px] text-stone-500 font-mono font-bold">
                          QTY: {item.quantity}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isReadOnly && isSelected && !isConsumable && canEquip && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEquip(item.id);
                      }}
                      className="shrink-0 px-3 md:px-8 py-1.5 md:py-3 bg-amber-700 hover:bg-amber-600 text-white text-[9px] md:text-xs font-black uppercase rounded shadow-lg transition-all"
                    >
                      Equip
                    </button>
                  )}

                  {!isReadOnly && isSelected && isConsumable && (
                    <div className="absolute top-0 right-0 h-full w-24 md:w-32 bg-stone-900/95 border-l border-amber-600/30 flex flex-col animate-in slide-in-from-right-full duration-200 z-30">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onConsume(item.id); }}
                            className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-emerald-900/40 text-emerald-400 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            <span className="text-[8px] md:text-[10px] font-black uppercase">Consume</span>
                        </button>
                        <div className="h-px w-full bg-amber-600/10" />
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSelect(""); }}
                            className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-red-900/40 text-stone-500 hover:text-red-400 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            <span className="text-[8px] md:text-[10px] font-black uppercase">Cancel</span>
                        </button>
                    </div>
                  )}
                </div>

                {!isConsumable && !canEquip && isSelected && (
                  <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-2 flex items-center gap-2 text-[8px] md:text-[10px] text-red-400 font-bold uppercase tracking-tight">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Requires Level {minLevel} (Current: {mercenary.level})
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-white/5 pt-2">
                   <div className="flex items-center gap-2">
                        {isConsumable ? (
                             <span className="text-[7px] md:text-[9px] text-stone-500 italic truncate max-w-[150px]">
                                {item.description}
                             </span>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-[7px] md:text-[9px] text-amber-600 font-black uppercase tracking-tighter bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-900/20">
                                {getQualityLabel(item.equipmentData?.quality || 100)}
                                </span>
                                <span className={`text-[7px] md:text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${mercenary.level >= minLevel ? 'text-stone-500 border-stone-800' : 'text-red-500 border-red-900/30 bg-red-900/10'}`}>
                                    Req. Lv.{minLevel}
                                </span>
                            </div>
                        )}
                    </div>
                    {!isConsumable && item.equipmentData && (
                        <div className="flex items-center gap-2 text-[8px] md:text-xs text-stone-600 font-mono">
                            {(item.equipmentData.stats.physicalAttack > 0 || item.equipmentData.stats.magicalAttack > 0) && (
                                <span className="flex items-center gap-1"><Sword className="w-2.5 h-2.5" /> {item.equipmentData.stats.physicalAttack || item.equipmentData.stats.magicalAttack}</span>
                            )}
                            {(item.equipmentData.stats.physicalDefense > 0 || item.equipmentData.stats.magicalDefense > 0) && (
                                <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5" /> {item.equipmentData.stats.physicalDefense || item.equipmentData.stats.magicalDefense}</span>
                            )}
                        </div>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};