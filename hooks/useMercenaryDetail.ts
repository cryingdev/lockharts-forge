import { useState, useMemo, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { Mercenary } from '../models/Mercenary';
import { EquipmentSlotType } from '../types/inventory';
import {
  calculateDerivedStats,
  applyEquipmentBonuses,
  DerivedStats,
  PrimaryStats,
  mergePrimaryStats,
} from '../models/Stats';
import { calculateCombatPower } from '../utils/combatLogic';
import { Equipment } from '../models/Equipment';

export interface MercenaryDetailHook {
    selectedSlot: EquipmentSlotType | null;
    setSelectedSlot: (slot: EquipmentSlotType | null) => void;
    selectedInventoryItemId: string | null;
    setSelectedInventoryItemId: (id: string | null) => void;
    pendingAllocated: PrimaryStats;
    pendingPoints: number;
    isInventoryOpen: boolean;
    handleModifyStat: (key: keyof PrimaryStats, delta: number) => void;
    handleSaveAttributes: () => void;
    handleResetAttributes: () => void;
    handleSlotClick: (slot: EquipmentSlotType | null) => void;
    handleToggleInventory: () => void;
    currentEqPrimaryStats: PrimaryStats;
    currentStats: DerivedStats | null;
    currentCombatPower: number;
    preview: {
        stats: DerivedStats;
        combatPower: number;
        eqPrimaryStats: PrimaryStats;
    } | null;
}

export const useMercenaryDetail = (mercenary: Mercenary | null): MercenaryDetailHook => {
  const { state, actions } = useGame();
  
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotType | null>(null);
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string | null>(null);
  const [pendingAllocated, setPendingAllocated] = useState<PrimaryStats>({ str: 0, vit: 0, dex: 0, int: 0, luk: 0 });
  const [pendingPoints, setPendingPoints] = useState(0);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  // Sync state when mercenary changes
  useEffect(() => {
    if (mercenary) {
      setSelectedSlot(null);
      setSelectedInventoryItemId(null);
      setPendingAllocated({ ...mercenary.allocatedStats });
      setPendingPoints(mercenary.bonusStatPoints || 0);
    }
  }, [mercenary?.id]);

  const handleModifyStat = useCallback((key: keyof PrimaryStats, delta: number) => {
    if (!mercenary) return;
    if (delta > 0 && pendingPoints <= 0) return;
    if (delta < 0 && pendingAllocated[key] <= mercenary.allocatedStats[key]) return;

    setPendingAllocated(prev => ({ ...prev, [key]: prev[key] + delta }));
    setPendingPoints(prev => prev - delta);
  }, [mercenary, pendingPoints, pendingAllocated]);

  const handleSaveAttributes = useCallback(() => {
    if (!mercenary) return;
    actions.updateMercenaryStats(mercenary.id, pendingAllocated);
    actions.showToast(`${mercenary.name}'s attributes have been finalized.`);
  }, [mercenary, actions, pendingAllocated]);

  const handleResetAttributes = useCallback(() => {
    if (!mercenary) return;
    setPendingAllocated({ ...mercenary.allocatedStats });
    setPendingPoints(mercenary.bonusStatPoints || 0);
  }, [mercenary]);

  const handleSlotClick = useCallback((slot: EquipmentSlotType | null) => {
    const isHired = mercenary && mercenary.status !== 'VISITOR' && mercenary.status !== 'DEAD';
    if (!isHired) return;
    setSelectedSlot(slot);
    if (slot && !isInventoryOpen) setIsInventoryOpen(true);
  }, [mercenary, isInventoryOpen]);

  const handleToggleInventory = useCallback(() => {
    setIsInventoryOpen(prev => !prev);
  }, []);

  // Calculate stats based on current pending allocation and current equipment
  const currentEqPrimaryStats = useMemo(() => {
    if (!mercenary) return { str: 0, vit: 0, dex: 0, int: 0, luk: 0 };
    return (Object.values(mercenary.equipment).filter(Boolean) as Equipment[]).reduce(
      (acc: PrimaryStats, eq: Equipment) => ({
        str: acc.str + (eq.stats.str || 0),
        vit: acc.vit + (eq.stats.vit || 0),
        dex: acc.dex + (eq.stats.dex || 0),
        int: acc.int + (eq.stats.int || 0),
        luk: acc.luk + (eq.stats.luk || 0),
      }),
      { str: 0, vit: 0, dex: 0, int: 0, luk: 0 }
    );
  }, [mercenary?.equipment]);

  const currentStats = useMemo(() => {
    if (!mercenary) return null;
    const mergedPrimary = mergePrimaryStats(mercenary.stats, pendingAllocated, currentEqPrimaryStats);
    const baseDerived = calculateDerivedStats(mergedPrimary, mercenary.level);
    const currentEquipmentStatsList = (Object.values(mercenary.equipment) as (Equipment | null)[]).map((eq) => eq?.stats).filter(Boolean);
    return applyEquipmentBonuses(baseDerived, currentEquipmentStatsList as any);
  }, [mercenary, pendingAllocated, currentEqPrimaryStats]);

  const currentCombatPower = useMemo(() => {
      if (!mercenary || !currentStats) return 0;
      const mergedPrimary = mergePrimaryStats(mercenary.stats, pendingAllocated, currentEqPrimaryStats);
      const currentAttackType = mergedPrimary.int > mergedPrimary.str ? 'MAGICAL' : 'PHYSICAL';
      return calculateCombatPower(currentStats, mercenary.job, currentAttackType);
  }, [mercenary, currentStats, pendingAllocated, currentEqPrimaryStats]);

  const preview = useMemo(() => {
    if (!mercenary || !selectedInventoryItemId) return null;
    
    const item = state.inventory.find((i) => i.id === selectedInventoryItemId)?.equipmentData;
    if (!item) return null;

    const previewEq = { ...mercenary.equipment };
    if (item.slotType === 'MAIN_HAND' && item.isTwoHanded) previewEq.OFF_HAND = null;
    else if (item.slotType === 'OFF_HAND' && previewEq.MAIN_HAND?.isTwoHanded) previewEq.MAIN_HAND = null;
    previewEq[item.slotType] = item;

    const previewEqPrimaryStats = (Object.values(previewEq).filter(Boolean) as Equipment[]).reduce(
      (acc: PrimaryStats, eq: Equipment) => ({
        str: acc.str + (eq.stats.str || 0),
        vit: acc.vit + (eq.stats.vit || 0),
        dex: acc.dex + (eq.stats.dex || 0),
        int: acc.int + (eq.stats.int || 0),
        luk: acc.luk + (eq.stats.luk || 0),
      }),
      { str: 0, vit: 0, dex: 0, int: 0, luk: 0 }
    );

    const previewMerged = mergePrimaryStats(mercenary.stats, pendingAllocated, previewEqPrimaryStats);
    const previewBase = calculateDerivedStats(previewMerged, mercenary.level);
    const previewStats = applyEquipmentBonuses(
      previewBase,
      (Object.values(previewEq) as (Equipment | null)[]).map((e) => e?.stats).filter(Boolean) as any
    );
    const combatPower = calculateCombatPower(previewStats, mercenary.job, previewMerged.int > previewMerged.str ? 'MAGICAL' : 'PHYSICAL');

    return {
        stats: previewStats,
        combatPower,
        eqPrimaryStats: previewEqPrimaryStats
    };
  }, [mercenary, selectedInventoryItemId, state.inventory, pendingAllocated]);

  return {
    selectedSlot,
    setSelectedSlot,
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
  };
};
