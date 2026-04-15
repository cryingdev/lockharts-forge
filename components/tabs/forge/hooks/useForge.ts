
// Fix: Import React to resolve 'Cannot find namespace React' errors for React.MouseEvent
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useGame } from '../../../../context/GameContext';
import { EquipmentCategory, EquipmentItem } from '../../../../types';
import { EQUIPMENT_SUBCATEGORIES, EQUIPMENT_ITEMS } from '../../../../data/equipment';
import { MASTERY_THRESHOLDS } from '../../../../config/mastery-config';
import { materials } from '../../../../data/materials';
import { getSmithingLevel, getUnlockedTier, getEnergyCost, getQuickCraftQuality } from '../../../../utils/craftingLogic';
import { getAssetUrl } from '../../../../utils';
import { GAME_CONFIG } from '../../../../config/game-config';
import { t } from '../../../../utils/i18n';

const FORGE_EXPANDED_SUBCATS_COOKIE = 'forge_expanded_subcats_v1';
const FORGE_ACTIVE_CATEGORY_COOKIE = 'forge_active_category_v1';
const FORGE_FAVORITES_EXPANDED_COOKIE = 'forge_favorites_expanded_v1';

type ExpandedSubCatState = Record<EquipmentCategory, string[]>;
type ExpandedSubCatSavedState = Record<EquipmentCategory, boolean>;

const readCookieValue = (key: string): string | null => {
  if (typeof document === 'undefined') return null;
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${key}=`));

  if (!cookie) return null;
  return decodeURIComponent(cookie.split('=').slice(1).join('='));
};

const readExpandedSubCatsCookie = (): { state: ExpandedSubCatState; saved: ExpandedSubCatSavedState } => {
  const emptyState: ExpandedSubCatState = {
    WEAPON: [],
    ARMOR: [],
    ACCESSORY: [],
  };
  const emptySaved: ExpandedSubCatSavedState = {
    WEAPON: false,
    ARMOR: false,
    ACCESSORY: false,
  };

  try {
    const rawValue = readCookieValue(FORGE_EXPANDED_SUBCATS_COOKIE);
    if (!rawValue) return { state: emptyState, saved: emptySaved };
    const parsed = JSON.parse(rawValue);

    if (!parsed || typeof parsed !== 'object') return { state: emptyState, saved: emptySaved };

    return {
      state: {
        WEAPON: Array.isArray(parsed.WEAPON) ? parsed.WEAPON.filter((value: unknown): value is string => typeof value === 'string') : [],
        ARMOR: Array.isArray(parsed.ARMOR) ? parsed.ARMOR.filter((value: unknown): value is string => typeof value === 'string') : [],
        ACCESSORY: Array.isArray(parsed.ACCESSORY) ? parsed.ACCESSORY.filter((value: unknown): value is string => typeof value === 'string') : [],
      },
      saved: {
        WEAPON: Array.isArray(parsed.WEAPON),
        ARMOR: Array.isArray(parsed.ARMOR),
        ACCESSORY: Array.isArray(parsed.ACCESSORY),
      }
    };
  } catch {
    return { state: emptyState, saved: emptySaved };
  }
};

const writeCookieValue = (key: string, value: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
};

const writeExpandedSubCatsCookie = (expandedSubCats: ExpandedSubCatState) => {
  writeCookieValue(FORGE_EXPANDED_SUBCATS_COOKIE, JSON.stringify(expandedSubCats));
};

const readForgeActiveCategoryCookie = (): EquipmentCategory => {
  const rawValue = readCookieValue(FORGE_ACTIVE_CATEGORY_COOKIE);
  return rawValue === 'ARMOR' ? 'ARMOR' : 'WEAPON';
};

const writeForgeActiveCategoryCookie = (category: EquipmentCategory) => {
  writeCookieValue(FORGE_ACTIVE_CATEGORY_COOKIE, category);
};

const readForgeFavoritesExpandedCookie = (): boolean => {
  const rawValue = readCookieValue(FORGE_FAVORITES_EXPANDED_COOKIE);
  return rawValue === null ? true : rawValue === 'true';
};

const writeForgeFavoritesExpandedCookie = (isExpanded: boolean) => {
  writeCookieValue(FORGE_FAVORITES_EXPANDED_COOKIE, String(isExpanded));
};

export const useForge = (onNavigate: (tab: any) => void) => {
  const { state, actions } = useGame();
  const { inventory, stats, isCrafting, craftingMastery, unlockedRecipes, tutorialStep, forgeTemperature, lastForgeTime } = state;
  const { hasFurnace, hasWorkbench, hasResearchTable } = state.forge;
  const language = state.settings.language;

  const [activeCategory, setActiveCategory] = useState<EquipmentCategory>(() => readForgeActiveCategoryCookie());
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
  const expandedSubCatCookie = useMemo(() => readExpandedSubCatsCookie(), []);
  const [expandedSubCatsByCategory, setExpandedSubCatsByCategory] = useState<ExpandedSubCatState>(() => expandedSubCatCookie.state);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFavExpanded, setIsFavExpanded] = useState<boolean>(() => readForgeFavoritesExpandedCookie());
  const [hoveredItem, setHoveredItem] = useState<EquipmentItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [quickCraftProgress, setQuickCraftProgress] = useState<number | null>(null);

  // Timer ref for auto-hiding the tooltip
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedExpandedCategoriesRef = useRef<ExpandedSubCatSavedState>(expandedSubCatCookie.saved);

  const expandedSubCats = useMemo(
    () => expandedSubCatsByCategory[activeCategory] || [],
    [expandedSubCatsByCategory, activeCategory]
  );

  const smithingLevel = getSmithingLevel(stats.smithingExp);
  const workbenchLevel = getSmithingLevel(stats.workbenchExp);
  const unlockedSmithingTier = getUnlockedTier(smithingLevel);
  const unlockedWorkbenchTier = getUnlockedTier(workbenchLevel);

  const getInventoryCount = useCallback((id: string) => {
    return inventory.find(i => i.id === id)?.quantity || 0;
  }, [inventory]);

  const currentResidualTemp = useMemo(() => {
    const GLOBAL_COOLING_RATE_PER_SEC = 30;
    const timeDiffSec = (Date.now() - (lastForgeTime || 0)) / 1000;
    return Math.max(0, (forgeTemperature || 0) - (timeDiffSec * GLOBAL_COOLING_RATE_PER_SEC));
  }, [forgeTemperature, lastForgeTime]);

  const requiredEnergy = useMemo(() => {
    if (!selectedItem) return GAME_CONFIG.ENERGY_COST.CRAFT;
    const count = craftingMastery[selectedItem.id] || 0;
    return getEnergyCost(selectedItem, count);
  }, [selectedItem, craftingMastery]);

  const isEnergyShortage = useMemo(() => {
    if (!selectedItem) return false;
    return stats.energy < requiredEnergy;
  }, [selectedItem, stats.energy, requiredEnergy]);

  const isFuelShortage = useMemo(() => {
    if (!selectedItem || selectedItem.craftingType !== 'FORGE') return false;
    const hasHeat = currentResidualTemp > 0;
    const hasFuel = getInventoryCount('charcoal') > 0;
    const isTutorialForging = tutorialStep === 'START_FORGING_GUIDE';
    return !isTutorialForging && !hasHeat && !hasFuel;
  }, [selectedItem, currentResidualTemp, getInventoryCount, tutorialStep]);

  const canEnterForge = useMemo(() => {
    if (!selectedItem) return false;
    if (selectedItem.craftingType === 'FORGE') {
      const hasHeat = currentResidualTemp > 0;
      const hasFuel = getInventoryCount('charcoal') > 0;
      const isTutorialForging = tutorialStep === 'START_FORGING_GUIDE';
      return hasFurnace && (hasFuel || hasHeat || isTutorialForging) && !isEnergyShortage;
    }
    return hasWorkbench && !isEnergyShortage;
  }, [selectedItem, hasFurnace, hasWorkbench, currentResidualTemp, getInventoryCount, tutorialStep, isEnergyShortage]);

  const extraQuickFuel = useMemo(() => {
    if (!selectedItem || selectedItem.craftingType !== 'FORGE') return 0;
    return selectedItem.tier === 1 ? 3 : selectedItem.tier === 2 ? 5 : 8;
  }, [selectedItem]);

  const quickCraftQuality = useMemo(() => {
    if (!selectedItem) return 0;
    return getQuickCraftQuality(craftingMastery[selectedItem.id] || 0);
  }, [selectedItem, craftingMastery]);

  const isQuickFuelShortage = useMemo(() => {
    if (!selectedItem || selectedItem.craftingType !== 'FORGE') return false;
    return getInventoryCount('charcoal') < extraQuickFuel;
  }, [selectedItem, getInventoryCount, extraQuickFuel]);

  const visibleItems = useMemo(() => {
    return EQUIPMENT_ITEMS.filter(item => {
      const isUnlocked = item.unlockedByDefault !== false || unlockedRecipes?.includes(item.id);
      if (!isUnlocked) return false;
      const myTier = item.craftingType === 'FORGE' ? unlockedSmithingTier : unlockedWorkbenchTier;
      if (item.tier > myTier) return false;
      const subCatDef = EQUIPMENT_SUBCATEGORIES.find(sc => sc.id === item.subCategoryId);
      return subCatDef?.categoryId === activeCategory;
    });
  }, [activeCategory, unlockedSmithingTier, unlockedWorkbenchTier, unlockedRecipes]);

  const favoriteItems = useMemo(() => visibleItems.filter(item => favorites.includes(item.id)), [visibleItems, favorites]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, EquipmentItem[]> = {};
    visibleItems.forEach(item => {
      if (!groups[item.subCategoryId]) groups[item.subCategoryId] = [];
      groups[item.subCategoryId].push(item);
    });
    return groups;
  }, [visibleItems]);

  const visibleSubCats = useMemo(() => {
    return EQUIPMENT_SUBCATEGORIES.filter(sc => 
      sc.categoryId === activeCategory && (groupedItems[sc.id]?.length || 0) > 0
    );
  }, [activeCategory, groupedItems]);

  useEffect(() => {
    setExpandedSubCatsByCategory(prev => {
      if (initializedExpandedCategoriesRef.current[activeCategory]) {
        return prev;
      }

      const visibleIds = visibleSubCats.map(subCat => subCat.id);
      initializedExpandedCategoriesRef.current[activeCategory] = true;

      return {
        ...prev,
        [activeCategory]: visibleIds,
      };
    });
  }, [visibleSubCats, activeCategory]);

  useEffect(() => {
    writeExpandedSubCatsCookie(expandedSubCatsByCategory);
  }, [expandedSubCatsByCategory]);

  useEffect(() => {
    writeForgeActiveCategoryCookie(activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    writeForgeFavoritesExpandedCookie(isFavExpanded);
  }, [isFavExpanded]);

  const masteryInfo = useMemo(() => {
    if (!selectedItem) return null;
    const count = craftingMastery[selectedItem.id] || 0;
    let label = "Novice";
    let colorClass = "stroke-stone-500";
    let glowClass = "shadow-[0_0_20px_rgba(120,113,108,0.2)]";
    let progress = 0;

    if (count >= MASTERY_THRESHOLDS.ARTISAN) {
      label = "Artisan";
      colorClass = "stroke-amber-500";
      glowClass = "shadow-[0_0_40px_rgba(245,158,11,0.3)]";
      progress = Math.min(100, ((count - MASTERY_THRESHOLDS.ARTISAN) / 20) * 100);
    } else if (count >= MASTERY_THRESHOLDS.ADEPT) {
      label = "Adept";
      colorClass = "stroke-emerald-500";
      glowClass = "shadow-[0_0_30px_rgba(16,185,129,0.2)]";
      progress = ((count - MASTERY_THRESHOLDS.ADEPT) / (MASTERY_THRESHOLDS.ARTISAN - MASTERY_THRESHOLDS.ADEPT)) * 100;
    } else {
      label = "Novice";
      colorClass = "stroke-stone-400";
      glowClass = "shadow-[0_0_20px_rgba(168,162,158,0.15)]";
      progress = (count / MASTERY_THRESHOLDS.ADEPT) * 100;
    }

    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return { label, colorClass, glowClass, progress, circumference, offset, count };
  }, [selectedItem, craftingMastery]);

  const updateTooltipPosition = useCallback((x: number, y: number) => {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    
    const tooltipWidth = window.innerWidth < 768 ? 160 : 256;
    const tooltipHeight = 180;
    
    let finalX = x + 15;
    let finalY = y + 15;

    if (finalX + tooltipWidth > viewportW - 10) {
      finalX = x - tooltipWidth - 15;
    }
    
    if (finalY + tooltipHeight > viewportH - 10) {
      finalY = y - tooltipHeight - 15;
    }

    finalX = Math.max(10, Math.min(finalX, viewportW - tooltipWidth - 10));
    finalY = Math.max(10, Math.min(finalY, viewportH - tooltipHeight - 10));

    setTooltipPos({ x: finalX, y: finalY });
  }, []);

  const handleCategoryChange = useCallback((cat: EquipmentCategory) => {
      setActiveCategory(cat);
  }, []);

  const clearTooltipRef = useCallback(() => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
  }, []);

  const startCrafting = useCallback((e?: React.MouseEvent) => {
    if (!selectedItem) return;
    const isRequirementMet = selectedItem.craftingType === 'FORGE' ? hasFurnace : hasWorkbench;
    
    if (!isRequirementMet) {
      actions.triggerEvent({
        id: 'NONE',
        title: t(language, 'eventModal.install_required_title'),
        titleKey: 'eventModal.install_required_title',
        description: t(
          language,
          selectedItem.craftingType === 'FORGE'
            ? 'eventModal.requires_furnace'
            : 'eventModal.requires_workbench'
        ),
        descriptionKey: selectedItem.craftingType === 'FORGE'
          ? 'eventModal.requires_furnace'
          : 'eventModal.requires_workbench',
        options: [
          {
            label: t(language, 'eventModal.visit_market'),
            labelKey: 'eventModal.visit_market',
            action: () => onNavigate('MARKET')
          },
          {
            label: t(language, 'eventModal.stay_here'),
            labelKey: 'eventModal.stay_here',
            action: () => {}
          }
        ]
      });
      return;
    }
    
    if (isEnergyShortage) {
        actions.triggerEnergyHighlight();
        return;
    }

    const missing = selectedItem.requirements.filter(req => getInventoryCount(req.id) < req.count);
    if (missing.length > 0 || isFuelShortage) {
      if (e) updateTooltipPosition(e.clientX, e.clientY);
      setHoveredItem(selectedItem);
      
      // Auto hide tooltip after 1 second when triggered by click
      clearTooltipRef();
      tooltipTimerRef.current = setTimeout(() => {
        setHoveredItem(null);
        tooltipTimerRef.current = null;
      }, 2500);
      return;
    }

    if (tutorialStep === 'START_FORGING_GUIDE' && selectedItem.id === 'sword_bronze_t1') {
      actions.setTutorialStep('SMITHING_TOUCH_TO_START_GUIDE');
    }
    actions.startCrafting(selectedItem);
    setIsPanelOpen(false);
  }, [selectedItem, hasFurnace, hasWorkbench, getInventoryCount, stats.energy, craftingMastery, actions, onNavigate, isFuelShortage, isEnergyShortage, updateTooltipPosition, clearTooltipRef, tutorialStep]);

  const handleMinigameComplete = useCallback((score: number, bonus?: number) => {
    if (selectedItem) {
      actions.finishCrafting(selectedItem, score, bonus);
      if (
        ['SMITHING_INTRO_DIALOG_GUIDE', 'SMITHING_TOUCH_TO_START_GUIDE', 'FIRST_HIT_DIALOG_GUIDE', 'SMITHING_MINIGAME_HIT_GUIDE'].includes(tutorialStep || '') &&
        selectedItem.id === 'sword_bronze_t1'
      ) {
        actions.setTutorialStep('CRAFT_RESULT_DIALOG_GUIDE');
      }
    }
    // minigame 완료 후 레시피 목록을 열지 않고 워크스페이스(레시피 카드) 상태를 유지합니다.
    setIsPanelOpen(false);
  }, [selectedItem, actions, tutorialStep]);

  const handleQuickCraft = useCallback((e?: React.MouseEvent) => {
    if (!selectedItem) return;

    if (isEnergyShortage) {
        actions.triggerEnergyHighlight();
        return;
    }

    const missing = selectedItem.requirements.filter(req => getInventoryCount(req.id) < req.count);
    if (missing.length > 0 || isQuickFuelShortage) {
      if (e) updateTooltipPosition(e.clientX, e.clientY);
      setHoveredItem(selectedItem);

      // Auto hide tooltip after 1 second when triggered by click
      clearTooltipRef();
      tooltipTimerRef.current = setTimeout(() => {
        setHoveredItem(null);
        tooltipTimerRef.current = null;
      }, 1000);
      return;
    }

    setQuickCraftProgress(0);
    const duration = 1500;
    const interval = 30;
    const step = (100 / (duration / interval));

    const timer = setInterval(() => {
      setQuickCraftProgress(prev => {
        if (prev === null || prev >= 100) {
          clearInterval(timer);
          if (extraQuickFuel > 0) {
            actions.consumeItem('charcoal', extraQuickFuel);
          }
          actions.startCrafting(selectedItem);
          actions.finishCrafting(selectedItem, quickCraftQuality, 0, 0.7);
          return null;
        }
        return prev + step;
      });
    }, interval);
  }, [selectedItem, actions, getInventoryCount, stats.energy, craftingMastery, isEnergyShortage, isQuickFuelShortage, extraQuickFuel, quickCraftQuality, updateTooltipPosition, clearTooltipRef]);

  const handleSelectItem = useCallback((item: EquipmentItem) => {
      setSelectedItem(item);
      if (tutorialStep === 'SELECT_SWORD_GUIDE' && item.id === 'sword_bronze_t1') {
          actions.setTutorialStep('START_FORGING_GUIDE');
      }
  }, [tutorialStep, actions]);

  const handleMouseEnter = useCallback((item: EquipmentItem, e: React.MouseEvent) => {
      clearTooltipRef(); // Manual hover overrides auto-hide
      setHoveredItem(item);
      updateTooltipPosition(e.clientX, e.clientY);
  }, [updateTooltipPosition, clearTooltipRef]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (hoveredItem) updateTooltipPosition(e.clientX, e.clientY);
  }, [hoveredItem, updateTooltipPosition]);

  const handleMouseLeave = useCallback(() => {
    clearTooltipRef();
    setHoveredItem(null);
  }, [clearTooltipRef]);

  const getItemImageUrl = (item: EquipmentItem) => {
    if (item.image) return getAssetUrl(item.image, 'equipments');
    return getAssetUrl(`${item.id}.png`, 'equipments');
  };

  return {
    state,
    actions,
    isCrafting,
    activeCategory,
    selectedItem,
    isPanelOpen,
    isSkillsExpanded,
    expandedSubCats,
    favorites,
    isFavExpanded,
    hoveredItem,
    tooltipPos,
    quickCraftProgress,
    extraQuickFuel,
    quickCraftQuality,
    smithingLevel,
    workbenchLevel,
    unlockedSmithingTier,
    unlockedWorkbenchTier,
    visibleSubCats,
    groupedItems,
    favoriteItems,
    canEnterForge,
    isFuelShortage,
    isQuickFuelShortage,
    isEnergyShortage,
    requiredEnergy,
    getInventoryCount,
    masteryInfo,
    getItemImageUrl,
    handlers: {
      setActiveCategory,
      setSelectedItem,
      setIsPanelOpen,
      setIsSkillsExpanded,
      setExpandedSubCatsByCategory,
      setFavorites,
      setIsFavExpanded,
      setHoveredItem,
      setTooltipPos,
      handleCategoryChange,
      startCrafting,
      handleMinigameComplete,
      handleQuickCraft,
      updateTooltipPosition,
      handleSelectItem,
      handleMouseEnter,
      handleMouseMove,
      handleMouseLeave,
      toggleSubCategory: (id: string) => setExpandedSubCatsByCategory(prev => {
        const currentExpanded = prev[activeCategory] || [];
        return {
          ...prev,
          [activeCategory]: currentExpanded.includes(id)
            ? currentExpanded.filter(subCatId => subCatId !== id)
            : [...currentExpanded, id]
        };
      }),
      toggleFavorite: (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
      }
    }
  };
};
