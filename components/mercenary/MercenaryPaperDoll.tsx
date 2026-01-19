import React from 'react';
import { 
  X, Sword, Shield, Shirt, Hand, Footprints, Crown, Sparkles, Heart, Star, 
  Package, ChevronLeft, ChevronDown 
} from 'lucide-react';
import { Mercenary } from '../../models/Mercenary';
import { EquipmentSlotType } from '../../types/inventory';
import { getAssetUrl } from '../../utils';
import { calculateMercenaryPower } from '../../utils/combatLogic';
import { StatDiff } from './StatDiff';

interface MercenaryPaperDollProps {
  mercenary: Mercenary;
  currentCombatPower: number;
  nextCombatPower: number;
  showAffinityGain: boolean;
  onUnequip: (slot: EquipmentSlotType) => void;
  onSlotClick: (slot: EquipmentSlotType | null) => void;
  selectedSlot: EquipmentSlotType | null;
  isReadOnly?: boolean;
  isInventoryOpen: boolean;
  onToggleInventory: () => void;
  isHired: boolean;
}

export const MercenaryPaperDoll: React.FC<MercenaryPaperDollProps> = ({
  mercenary,
  currentCombatPower,
  nextCombatPower,
  showAffinityGain,
  onUnequip,
  onSlotClick,
  selectedSlot,
  isReadOnly,
  isInventoryOpen,
  onToggleInventory,
  isHired,
}) => {
  const renderSlot = ({
    slot,
    icon,
    style,
  }: {
    slot: EquipmentSlotType;
    icon: React.ReactNode;
    style: string;
  }) => {
    const equippedItem = mercenary.equipment[slot];
    const isSelected = selectedSlot === slot;
    let borderColor = isSelected ? 'border-amber-400' : 'border-stone-700/50';
    let bgColor = 'bg-stone-950/40';

    if (equippedItem) {
      switch (equippedItem.rarity) {
        case 'Common':
          borderColor = isSelected ? 'border-amber-400' : 'border-stone-50';
          break;
        case 'Uncommon':
          borderColor = isSelected ? 'border-amber-400' : 'border-emerald-600';
          break;
        case 'Rare':
          borderColor = isSelected ? 'border-amber-400' : 'border-blue-500';
          break;
        case 'Epic':
          borderColor = isSelected ? 'border-amber-400' : 'border-purple-500';
          break;
        case 'Legendary':
          borderColor = isSelected ? 'border-amber-400' : 'border-amber-500';
          break;
      }
      bgColor = 'bg-stone-800/60';
    }

    let imageUrl = '';
    if (equippedItem) {
      imageUrl = equippedItem.image
        ? getAssetUrl(equippedItem.image)
        : equippedItem.recipeId
          ? getAssetUrl(`${equippedItem.recipeId}.png`)
          : getAssetUrl(`${equippedItem.id.split('_')[0]}.png`);
    }

    return (
      <div
        className={`absolute w-10 h-10 md:w-14 md:h-14 rounded-xl border-2 backdrop-blur-md ${borderColor} ${bgColor} flex items-center justify-center shadow-lg transition-all z-20 group ${style} ${isSelected ? 'ring-4 ring-amber-500/30 scale-110' : 'hover:scale-105'} ${isHired ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={() => isHired && onSlotClick(isSelected ? null : slot)}
      >
        {equippedItem ? (
          <img src={imageUrl} className="w-7 h-7 md:w-10 md:h-10 object-contain drop-shadow-md" alt={equippedItem.name} />
        ) : (
          <div className="text-stone-600/80 scale-75 md:scale-100">{icon}</div>
        )}
        {equippedItem && !isReadOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnequip(slot);
            }}
            className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity text-white shadow-lg"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  const hasPowerDiff = nextCombatPower !== currentCombatPower;
  const isSpriteSheet = mercenary.sprite?.includes('_sprite');

  return (
    <div className="w-full flex flex-col shrink-0">
      <div className="p-4 md:p-6 flex flex-col gap-0.5 md:gap-1 shrink-0 bg-stone-950/40 border-b border-white/5 backdrop-blur-md z-30">
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-sm md:text-2xl font-black text-stone-100 font-serif truncate leading-none">
            {mercenary.name}
          </h2>
          {isHired && (
            <button
              onClick={onToggleInventory}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-black uppercase tracking-widest ${isInventoryOpen ? 'bg-amber-600 border-amber-400 text-white shadow-glow-sm' : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'}`}
            >
              <Package className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{isInventoryOpen ? 'Close Gear' : 'Open Gear'}</span>
              {isInventoryOpen ? <ChevronLeft className="w-3 h-3 md:hidden" /> : <ChevronDown className="w-3 h-3 md:hidden" />}
            </button>
          )}
        </div>
        
        <div className="flex justify-between items-end">
          <div className="flex wrap items-center gap-1">
            <span className="text-[7px] md:text-xs font-black text-amber-500 uppercase tracking-widest bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/20">
              {mercenary.job}
            </span>
            <div
              className={`flex items-center gap-0.5 text-[8px] md:text-sm ${showAffinityGain ? 'text-pink-400 animate-pulse' : 'text-stone-500 font-bold'}`}
            >
              <Heart className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 ${showAffinityGain ? 'fill-pink-500' : ''}`} />
              <span>{mercenary.affinity}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[6px] md:text-[9px] text-stone-600 uppercase font-black tracking-tighter block leading-none">
              Combat Power
            </span>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 md:gap-1 text-[12px] md:text-xl font-mono font-black text-stone-300">
                <Star className="w-2.5 h-2.5 md:w-4 md:h-4 text-amber-600 fill-amber-600" />
                <span className={hasPowerDiff ? (nextCombatPower > currentCombatPower ? 'text-emerald-400' : 'text-red-400') : ''}>
                  {nextCombatPower}
                </span>
              </div>
              <StatDiff current={currentCombatPower} next={nextCombatPower} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[4/3] md:aspect-square flex items-center justify-center overflow-hidden min-h-[180px] md:min-h-[280px]">
        <div className="relative h-[90%] w-full flex items-center justify-center pointer-events-none opacity-80">
          {isSpriteSheet ? (
            <div 
              className="h-full" 
              style={{ 
                aspectRatio: '1 / 2.15',
                backgroundImage: `url(${getAssetUrl(mercenary.sprite!)})`,
                backgroundSize: '300% 100%',
                backgroundPosition: '0% 0%',
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))'
              }} 
            />
          ) : (
            <img
              src={mercenary.sprite ? getAssetUrl(mercenary.sprite) : getAssetUrl('adventurer_wanderer_01.png')}
              className="h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              alt={mercenary.name}
            />
          )}
        </div>
        {renderSlot({ slot: 'HEAD', icon: <Crown className="w-5 h-5" />, style: 'top-[6%] left-1/2 -translate-x-1/2' })}
        {renderSlot({ slot: 'BODY', icon: <Shirt className="w-5 h-5" />, style: 'top-[26%] left-1/2 -translate-x-1/2' })}
        {renderSlot({ slot: 'HANDS', icon: <Hand className="w-5 h-5" />, style: 'top-[26%] left-[10%]' })}
        {renderSlot({ slot: 'ACCESSORY', icon: <Sparkles className="w-5 h-5" />, style: 'top-[26%] right-[10%]' })}
        {renderSlot({ slot: 'MAIN_HAND', icon: <Sword className="w-5 h-5" />, style: 'top-[50%] left-[4%]' })}
        {renderSlot({ slot: 'OFF_HAND', icon: <Shield className="w-5 h-5" />, style: 'top-[50%] right-[4%]' })}
        {renderSlot({
          slot: 'FEET',
          icon: <Footprints className="w-5 h-5" />,
          style: 'bottom-[8%] left-1/2 -translate-x-1/2',
        })}
      </div>
    </div>
  );
};