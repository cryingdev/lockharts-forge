import React from 'react';
import { X } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { Mercenary } from '../../models/Mercenary';
import { EquipmentSlotType } from '../../types/inventory';
import { useMercenaryDetail } from '../../hooks/useMercenaryDetail';
import { calculateMercenaryPower } from '../../utils/combatLogic';
import { MercenaryPaperDoll } from '../mercenary/MercenaryPaperDoll';
import { MercenaryStatsPanel } from '../mercenary/MercenaryStatsPanel';
import { EquipmentInventoryList } from '../mercenary/EquipmentInventoryList';
import { SfxButton } from '../common/ui/SfxButton';
import { UI_MODAL_LAYOUT } from '../../config/ui-config';

interface MercenaryDetailModalProps {
  mercenary: Mercenary | null;
  onClose: () => void;
  onUnequip: (mercId: string, slot: EquipmentSlotType) => void;
  onEquip?: (mercId: string, itemId: string) => void; 
  onConsume?: (mercId: string, itemId: string) => void; 
  isReadOnly?: boolean;
  hideCloseButton?: boolean;
}

export const MercenaryDetailModal: React.FC<MercenaryDetailModalProps> = ({ 
  mercenary, 
  onClose, 
  onUnequip, 
  onEquip,
  onConsume,
  isReadOnly = false,
  hideCloseButton = false
}) => {
  const { state, actions } = useGame();
  const {
      selectedSlot,
      selectedInventoryItemId,
      setSelectedInventoryItemId,
      pendingAllocated,
      pendingPoints,
      isInventoryOpen,
      handleModifyStat,
      handleSaveAttributes,
      handleResetAttributes,
      handleSlotClick,
      handleToggleInventory,
      currentEqPrimaryStats,
      currentStats,
      currentCombatPower,
      preview
  } = useMercenaryDetail(mercenary);

  if (!mercenary || !currentStats) return null;

  const isHired = mercenary.status !== 'VISITOR' && mercenary.status !== 'DEAD';

  const effectiveFinalStats = preview?.stats || currentStats;
  const effectiveCombatPower = preview?.combatPower !== undefined ? preview.combatPower : currentCombatPower;
  const effectiveEqPrimaryStats = preview?.eqPrimaryStats || currentEqPrimaryStats;

  return (
    <div className={`${UI_MODAL_LAYOUT.OVERLAY} z-[1100] animate-in fade-in duration-300`}>
      <div className={`relative w-[95%] sm:w-[92%] max-w-4xl h-full max-h-[90dvh] bg-stone-950 border-2 border-stone-700 rounded-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] flex flex-col md:flex-row overflow-hidden ring-1 ring-white/10 transition-all duration-500`}>
        
        {!hideCloseButton && (
          <SfxButton
            sfx="switch"
            onClick={onClose}
            className="absolute top-4 right-4 z-[1050] p-1.5 md:p-2 bg-stone-900/80 hover:bg-red-900/80 rounded-full text-stone-500 hover:text-white border border-stone-700 transition-all shadow-xl backdrop-blur-md active:scale-90"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </SfxButton>
        )}

        {/* Left Side: Avatar & Stats */}
        <div className={`flex flex-col overflow-hidden transition-all duration-500 border-stone-800 ${isHired && isInventoryOpen ? 'w-full md:w-[45%] h-1/2 md:h-full border-b md:border-b-0 md:border-r' : 'w-full h-full'}`}>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-stone-900/20">
            <MercenaryPaperDoll
              mercenary={mercenary}
              currentCombatPower={calculateMercenaryPower(mercenary)}
              nextCombatPower={effectiveCombatPower}
              showAffinityGain={false}
              onUnequip={(slot) => onUnequip(mercenary.id, slot)}
              onSlotClick={handleSlotClick}
              selectedSlot={selectedSlot}
              isReadOnly={isReadOnly}
              isInventoryOpen={isInventoryOpen}
              onToggleInventory={handleToggleInventory}
              isHired={isHired}
            />
            <MercenaryStatsPanel
              mercenary={mercenary}
              baseStats={currentStats}
              finalStats={effectiveFinalStats}
              pendingAllocated={pendingAllocated}
              pendingPoints={pendingPoints}
              equipmentStats={effectiveEqPrimaryStats}
              previewEquipmentStats={preview?.eqPrimaryStats || null}
              onModifyStat={handleModifyStat}
              onSave={handleSaveAttributes}
              onReset={handleResetAttributes}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>

        {/* Right Side: Inventory (Conditionally shown) */}
        {isHired && (
          <div className={`bg-stone-950/40 flex flex-col transition-all duration-500 overflow-hidden ${isInventoryOpen ? 'flex-1 h-1/2 md:h-full opacity-100' : 'w-0 h-0 md:h-full opacity-0'}`}>
            <EquipmentInventoryList
              inventory={state.inventory.filter((i) => i.type === 'EQUIPMENT' || i.type === 'CONSUMABLE' || i.type === 'SKILL_BOOK')}
              selectedItemId={selectedInventoryItemId}
              onSelect={setSelectedInventoryItemId}
              onEquip={(id) => {
                if (onEquip) {
                  onEquip(mercenary.id, id);
                } else {
                  actions.equipItem(mercenary.id, id);
                }
                setSelectedInventoryItemId(null);
              }}
              onConsume={(id) => {
                if (onConsume) {
                  onConsume(mercenary.id, id);
                } else {
                  actions.useItem(id, mercenary.id);
                }
                setSelectedInventoryItemId(null);
              }}
              selectedSlotFilter={selectedSlot}
              mercenary={mercenary}
              isReadOnly={isReadOnly}
              onToggleInventory={handleToggleInventory}
            />
          </div>
        )}
      </div>
    </div>
  );
};