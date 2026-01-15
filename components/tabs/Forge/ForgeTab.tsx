import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { EQUIPMENT_SUBCATEGORIES, EQUIPMENT_ITEMS } from '../../../data/equipment';
import { EquipmentCategory, EquipmentItem } from '../../../types/index';
import SmithingMinigame from './SmithingMinigame';
import WorkbenchMinigame from './WorkbenchMinigame';
import { Hammer, Shield, Sword, ChevronRight, ChevronLeft, Lock, Box, Flame, ChevronDown, ChevronUp, FastForward, Activity, AlertCircle } from 'lucide-react';
import { useGame } from '../../../context/GameContext';
import { GAME_CONFIG } from '../../../config/game-config';
import { MASTERY_THRESHOLDS } from '../../../config/mastery-config';
import { materials } from '../../../data/materials';
import { getAssetUrl } from '../../../utils';
import { getSmithingLevel, getUnlockedTier } from '../../../utils/craftingLogic';

// Sub-components
import ForgeSkillHeader from './ForgeSkillHeader';
import ForgeStatsGrid from './ForgeStatsGrid';
import RecipeCard from './RecipeCard';
import MasteryRadialGauge from './MasteryRadialGauge';
import QuickCraftOverlay from './QuickCraftOverlay';
import RecipeTooltip from './RecipeTooltip';

interface ForgeTabProps {
    onNavigate: (tab: any) => void;
}

const ForgeTab: React.FC<ForgeTabProps> = ({ onNavigate }) => {
  const { state, actions } = useGame();
  
  const { inventory, stats, isCrafting, craftingMastery, unlockedRecipes, tutorialStep } = state;
  const { hasFurnace, hasWorkbench } = state.forge;

  const [activeCategory, setActiveCategory] = useState<EquipmentCategory>('WEAPON');
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
  const [expandedSubCat, setExpandedSubCat] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<EquipmentItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [quickCraftProgress, setQuickCraftProgress] = useState<number | null>(null);

  const smithingLevel = getSmithingLevel(stats.smithingExp);
  const workbenchLevel = getSmithingLevel(stats.workbenchExp);
  const unlockedSmithingTier = getUnlockedTier(smithingLevel);
  const unlockedWorkbenchTier = getUnlockedTier(workbenchLevel);
  
  const getInventoryCount = useCallback((id: string) => {
      return inventory.find(i => i.id === id)?.quantity || 0;
  }, [inventory]);

  const getItemImageUrl = (item: EquipmentItem) => {
    if (item.image) return getAssetUrl(item.image);
    return getAssetUrl(`${item.id}.png`);
  };

  const GLOBAL_COOLING_RATE_PER_SEC = 5; 
  const timeDiffSec = (Date.now() - (state.lastForgeTime || 0)) / 1000;
  const coolingAmount = timeDiffSec * GLOBAL_COOLING_RATE_PER_SEC;
  const currentResidualTemp = Math.max(0, (state.forgeTemperature || 0) - coolingAmount);
  
  const hasHeat = currentResidualTemp > 0;
  const charcoalCount = getInventoryCount('charcoal');
  const hasFuel = charcoalCount > 0;
  
  const isTutorialForging = tutorialStep === 'START_FORGING_GUIDE';

  const isRequirementMet = useMemo(() => {
    if (!selectedItem) return true;
    if (selectedItem.craftingType === 'FORGE') return hasFurnace;
    if (selectedItem.craftingType === 'WORKBENCH') return hasWorkbench;
    return true;
  }, [selectedItem, hasFurnace, hasWorkbench]);

  const canEnterForge = useMemo(() => {
      if (!selectedItem) return false;
      if (!isRequirementMet) return false;
      if (selectedItem.craftingType === 'WORKBENCH') return true;
      if (isTutorialForging) return true; 
      return hasFuel || hasHeat;
  }, [selectedItem, isRequirementMet, hasFuel, hasHeat, isTutorialForging]);
  
  const requiredEnergy = useMemo(() => {
      if (!selectedItem) return GAME_CONFIG.ENERGY_COST.CRAFT;
      const count = craftingMastery[selectedItem.id] || 0;
      if (count >= MASTERY_THRESHOLDS.ARTISAN) {
          return GAME_CONFIG.ENERGY_COST.CRAFT - MASTERY_THRESHOLDS.ARTISAN_BONUS.energyDiscount;
      }
      return GAME_CONFIG.ENERGY_COST.CRAFT;
  }, [selectedItem, craftingMastery]);

  const hasEnergy = stats.energy >= requiredEnergy;

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
          sc.categoryId === activeCategory && groupedItems[sc.id] && groupedItems[sc.id].length > 0
      );
  }, [activeCategory, groupedItems]);

  useEffect(() => {
      if (visibleSubCats.length > 0) {
          const isCurrentValid = visibleSubCats.some(sc => sc.id === expandedSubCat);
          if (!isCurrentValid) {
              setExpandedSubCat(visibleSubCats[0].id);
          }
      } else {
          setExpandedSubCat(null);
      }
  }, [activeCategory, visibleSubCats, expandedSubCat]);

  const handleCategoryChange = useCallback((cat: EquipmentCategory) => {
    setActiveCategory(cat);
    setSelectedItem(null);   
  }, []);

  const toggleSubCategory = useCallback((subCatId: string) => {
      setExpandedSubCat(prev => (prev === subCatId ? null : subCatId));
  }, []);

  const toggleFavorite = useCallback((e: React.MouseEvent, itemId: string) => {
      e.stopPropagation(); 
      setFavorites(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  }, []);

  const quickCraftFuelCost = useMemo(() => {
      if (!selectedItem || selectedItem.craftingType !== 'FORGE') return 0;
      const d = selectedItem.maxDurability;
      if (d < 80) return 2;
      if (d < 150) return 3;
      if (d < 300) return 4;
      return 5;
  }, [selectedItem]);

  const startCrafting = useCallback(() => {
      if (!selectedItem) return;

      if (!isRequirementMet) {
          const facility = selectedItem.craftingType === 'FORGE' ? 'Furnace' : 'Workbench';
          actions.triggerEvent({
              id: 'NONE',
              title: 'Installation Required',
              description: `You are attempting to craft equipment that requires a ${facility}. This essential unit is currently missing from your forge. Visit the Market to acquire the necessary infrastructure.`,
              options: [
                  { label: 'Visit Market', action: () => onNavigate('MARKET') },
                  { label: 'Stay here', action: () => {} }
              ]
          });
          return;
      }
      
      const missing = selectedItem.requirements.filter(req => getInventoryCount(req.id) < req.count);
      if (missing.length > 0) {
          const names = missing.map(m => {
              const def = Object.values(materials).find(mat => mat.id === m.id);
              const needed = m.count - getInventoryCount(m.id);
              return `${def ? def.name : m.id} x${needed}`;
          }).join(', ');
          actions.showToast(`Insufficient: ${names}`);
          return;
      }

      if (!hasEnergy) {
          actions.triggerEnergyHighlight();
          actions.showToast("Not enough energy.");
          return;
      }
      if (selectedItem.craftingType === 'FORGE' && !canEnterForge) {
          actions.showToast("Forge is cold! Add fuel first.");
          return;
      }

      actions.startCrafting(selectedItem);
      setIsPanelOpen(false); 
  }, [actions, selectedItem, isRequirementMet, getInventoryCount, hasEnergy, canEnterForge, onNavigate]);

  const cancelCrafting = useCallback(() => {
      if (selectedItem) actions.cancelCrafting(selectedItem);
      else actions.setCrafting(false); 
      setIsPanelOpen(true);
  }, [actions, selectedItem]);

  const handleMinigameComplete = useCallback((score: number, bonus?: number) => {
    if (selectedItem) {
        const wasTutorialStep = tutorialStep === 'START_FORGING_GUIDE' && selectedItem.id === 'sword_bronze_t1';
        actions.finishCrafting(selectedItem, score, bonus);
        if (wasTutorialStep) {
            actions.setTutorialStep('CRAFT_RESULT_PROMPT');
        }
    }
    setIsPanelOpen(true);
  }, [selectedItem, actions, tutorialStep]);
  
  const handleMouseEnter = useCallback((item: EquipmentItem, e: React.MouseEvent) => {
      setHoveredItem(item);
      updateTooltipPosition(e.clientX, e.clientY);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (hoveredItem) updateTooltipPosition(e.clientX, e.clientY);
  }, [hoveredItem]);

  const updateTooltipPosition = (x: number, y: number) => {
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      let finalX = x + 20;
      let finalY = y + 20;
      const tooltipW = viewportW < 768 ? Math.max(160, viewportW * 0.4) : 256; 
      if (finalX + tooltipW > viewportW) finalX = x - tooltipW - 20;
      if (finalY + 160 > viewportH) finalY = y - 180;
      setTooltipPos({ x: finalX, y: finalY });
  };

  const handleMouseLeave = useCallback(() => setHoveredItem(null), []);

  const handleSelectItem = (item: EquipmentItem) => {
      setSelectedItem(item);
      if (state.tutorialStep === 'SELECT_SWORD_GUIDE' && item.id === 'sword_bronze_t1') {
          actions.setTutorialStep('START_FORGING_GUIDE');
      }
  };

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

  const handleQuickCraft = useCallback(() => {
      if (!selectedItem || !masteryInfo) return;

      if (!isRequirementMet) {
          const facility = selectedItem.craftingType === 'FORGE' ? 'Furnace' : 'Workbench';
          actions.triggerEvent({
              id: 'NONE',
              title: 'Installation Required',
              description: `High-speed production requires the specific ${facility} unit. Please install the facility via Market before attempting advanced crafting techniques.`,
              options: [
                  { label: 'Visit Market', action: () => onNavigate('MARKET') },
                  { label: 'Return', action: () => {} }
              ]
          });
          return;
      }
      
      const missing = selectedItem.requirements.filter(req => getInventoryCount(req.id) < req.count);
      if (missing.length > 0) {
          const names = missing.map(m => {
              const def = Object.values(materials).find(mat => mat.id === m.id);
              const needed = m.count - getInventoryCount(m.id);
              return `${def ? def.name : m.id} x${needed}`;
          }).join(', ');
          actions.showToast(`Insufficient: ${names}`);
          return;
      }

      if (!hasEnergy) {
          actions.triggerEnergyHighlight();
          actions.showToast("Not enough energy.");
          return;
      }

      if (selectedItem.craftingType === 'FORGE') {
          if (charcoalCount < quickCraftFuelCost) {
              actions.showToast(`Insufficient charcoal! Need ${quickCraftFuelCost} fuel.`);
              return;
          }
      }

      setQuickCraftProgress(0);
      const duration = 1500;
      const interval = 30;
      const step = (interval / duration) * 100;

      const timer = setInterval(() => {
          setQuickCraftProgress(prev => {
              if (prev === null || prev >= 100) {
                  clearInterval(timer);
                  
                  if (selectedItem.craftingType === 'FORGE') {
                      actions.consumeItem('charcoal', quickCraftFuelCost);
                  }
                  
                  let quality = 50;
                  let masteryGain = 0.5;

                  if (masteryInfo.count >= MASTERY_THRESHOLDS.ARTISAN) {
                      quality = 95;
                      masteryGain = 1.0;
                  } else if (masteryInfo.count >= MASTERY_THRESHOLDS.ADEPT) {
                      quality = 75;
                      masteryGain = 0.7;
                  }

                  actions.startCrafting(selectedItem);
                  actions.finishCrafting(selectedItem, quality, 0, masteryGain);
                  return null;
              }
              return Math.min(100, prev + step);
          });
      }, interval);

  }, [selectedItem, masteryInfo, isRequirementMet, getInventoryCount, hasEnergy, actions, charcoalCount, quickCraftFuelCost, onNavigate]);

  const isQuickCraftAvailable = useMemo(() => {
    if (!selectedItem) return false;
    return (craftingMastery[selectedItem.id] || 0) > 0;
  }, [selectedItem, craftingMastery]);

  return (
    <div className="relative h-full w-full bg-stone-950 overflow-hidden" style={{ backgroundImage: `url(${getAssetUrl('tile_forge.png')})`, backgroundRepeat: 'repeat', backgroundBlendMode: 'multiply' }}>
        
        {isCrafting && selectedItem && (
            <div className="absolute inset-0 z-[100] bg-stone-950">
                {selectedItem.craftingType === 'FORGE' ? (
                    <SmithingMinigame 
                        onComplete={handleMinigameComplete}
                        onClose={cancelCrafting}
                        difficulty={selectedItem.tier}
                        isTutorial={tutorialStep === 'START_FORGING_GUIDE'}
                    />
                ) : (
                    <WorkbenchMinigame 
                        onComplete={handleMinigameComplete}
                        onClose={cancelCrafting}
                        difficulty={selectedItem.tier}
                        subCategoryId={selectedItem.subCategoryId}
                        itemImage={selectedItem.image}
                    />
                )}
            </div>
        )}

        {quickCraftProgress !== null && <QuickCraftOverlay progress={quickCraftProgress} />}

        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 pointer-events-auto">
            {!isSkillsExpanded ? (
                <button 
                    onClick={() => setIsSkillsExpanded(true)}
                    className="bg-stone-900/90 backdrop-blur-md border border-stone-700 rounded-full px-4 py-2 flex items-center gap-3 shadow-xl hover:bg-stone-800 transition-all group"
                >
                    <div className="flex items-center gap-1.5">
                        <Hammer className="w-3.5 h-3.5 text-amber-50" />
                        <span className="text-[10px] md:text-xs font-mono font-black text-amber-400">Lv.{smithingLevel}</span>
                        <span className="text-[7px] md:text-[8px] font-black text-amber-600 bg-amber-950/40 px-1 rounded border border-amber-900/20">T{unlockedSmithingTier}</span>
                    </div>
                    <div className="w-px h-3 bg-stone-700" />
                    <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-[10px] md:text-xs font-mono font-black text-stone-300">Lv.{workbenchLevel}</span>
                        <span className="text-[7px] md:text-[8px] font-black text-stone-500 bg-stone-950/40 px-1 rounded border border-stone-800/40">T{unlockedWorkbenchTier}</span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-stone-500 group-hover:text-amber-500 transition-colors" />
                </button>
            ) : (
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => setIsSkillsExpanded(false)}
                        className="self-start mb-1 bg-stone-900/80 backdrop-blur-sm border border-stone-700 px-3 py-1 rounded-full text-[8px] font-black text-stone-400 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-all shadow-lg"
                    >
                        <ChevronUp className="w-3 h-3" /> Hide Progress
                    </button>
                    <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-300">
                        <ForgeSkillHeader exp={stats.smithingExp} label="Smithing" icon={Hammer} />
                        <ForgeSkillHeader exp={stats.workbenchExp} label="Workbench" icon={Activity} />
                    </div>
                </div>
            )}
        </div>

        <div className={`absolute inset-0 z-0 flex w-full h-full`}>
            <div className={`h-full relative flex flex-col transition-all duration-500 ease-in-out ${isPanelOpen ? 'w-[55%] md:w-[60%]' : 'w-full'}`}>
                <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 bg-stone-925/40 relative overflow-hidden text-center">
                    <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                        {selectedItem?.craftingType === 'FORGE' ? <Hammer className="w-64 h-64 md:w-96 md:h-96 text-stone-500" /> : <Activity className="w-64 h-64 md:w-96 md:h-96 text-stone-500" />}
                    </div>
                    {selectedItem ? (
                        <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full max-w-lg mx-auto">
                            <MasteryRadialGauge imageUrl={getItemImageUrl(selectedItem)} masteryInfo={masteryInfo} />

                            <h2 className="text-xl md:text-3xl font-bold text-amber-500 mb-1 md:mb-1.5 font-serif tracking-wide text-center">{selectedItem.name}</h2>
                            <p className="text-stone-500 text-center max-w-md mb-4 md:mb-6 italic text-[9px] md:text-sm leading-tight px-6 mx-auto">"{selectedItem.description}"</p>
                            
                            <ForgeStatsGrid item={selectedItem} />

                            <div className="flex flex-col sm:flex-row gap-3 w-full items-center justify-center px-4 max-w-lg mx-auto">
                                <button 
                                    onClick={startCrafting} 
                                    data-tutorial-id="START_FORGING_BUTTON"
                                    className={`w-full max-w-[200px] h-14 md:h-20 rounded-lg font-black text-sm md:text-base shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 md:gap-3 border ${!isRequirementMet ? 'bg-red-900/60 border-red-500 text-red-100' : canEnterForge ? (selectedItem.craftingType === 'FORGE' ? 'bg-amber-700 hover:bg-amber-600 border-amber-500' : 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500') : 'bg-stone-800 text-stone-500 border-stone-700 grayscale opacity-70'}`}
                                >
                                    {isRequirementMet ? (selectedItem.craftingType === 'FORGE' ? <Hammer className="w-4 h-4 md:w-6 md:h-6" /> : <Activity className="w-4 h-4 md:w-6 md:h-6" />) : <AlertCircle className="w-4 h-4 md:w-6 md:h-6" />}
                                    <span>{!isRequirementMet ? `Install ${selectedItem.craftingType === 'FORGE' ? 'Furnace' : 'Workbench'}` : selectedItem.craftingType === 'FORGE' ? 'Start Forging' : 'Start Crafting'}</span>
                                </button>
                                
                                {isQuickCraftAvailable && isRequirementMet && (
                                    <button 
                                        onClick={handleQuickCraft}
                                        className={`w-full max-w-[200px] h-14 md:h-20 rounded-lg font-black shadow-lg transition-all transform hover:-translate-y-1 flex flex-col items-center justify-center gap-0.5 border bg-stone-800 hover:bg-stone-700 border-stone-600 text-amber-500`}
                                    >
                                        <div className="flex items-center gap-1.5 md:gap-2">
                                            <FastForward className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                            <span className="text-sm md:text-base">Quick Craft</span>
                                        </div>
                                        {selectedItem.craftingType === 'FORGE' && (
                                            <div className="flex items-center gap-1 opacity-80 scale-90">
                                                <img src={getAssetUrl('charcoal.png')} className="w-3 h-3 object-contain" />
                                                <span className={`font-mono text-[10px] ${charcoalCount < quickCraftFuelCost ? 'text-red-500 animate-pulse' : 'text-stone-400'}`}>x{quickCraftFuelCost}</span>
                                            </div>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="z-10 flex flex-col items-center text-stone-600 text-center">
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-dashed border-stone-700 flex items-center justify-center mb-4 mx-auto">
                                <Hammer className="w-6 h-6 md:w-10 md:h-10" />
                            </div>
                            <h3 className="text-base md:text-xl font-bold text-stone-500 drop-shadow-md">The Anvil is Cold</h3>
                            <p className="text-[10px] md:text-sm mt-1 md:mt-2 font-medium">Select a recipe from the right to begin.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={`h-full bg-stone-900/95 border-l border-stone-800 shadow-2xl flex flex-col transition-all duration-500 ease-in-out relative backdrop-blur-sm ${isPanelOpen ? 'w-[45%] md:w-[40%] translate-x-0' : 'w-0 translate-x-full border-none'}`}>
                <button onClick={() => setIsPanelOpen(!isPanelOpen)} disabled={isCrafting} className={`absolute top-1/2 -left-6 w-6 h-20 md:h-24 -translate-y-1/2 bg-stone-800 border-y border-l border-stone-600 rounded-l-lg flex items-center justify-center hover:bg-stone-700 hover:text-amber-400 transition-colors z-20 ${isCrafting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>{isCrafting ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : isPanelOpen ? <ChevronRight className="w-4 h-4 text-stone-400" /> : <ChevronLeft className="w-4 h-4 text-amber-500 animate-pulse" />}</button>
                <div className="w-full h-full flex flex-col">
                    <div className="flex border-b border-stone-800 shrink-0">
                        <button onClick={() => handleCategoryChange('WEAPON')} className={`flex-1 py-3 md:py-4 text-center font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs ${activeCategory === 'WEAPON' ? 'bg-stone-800 text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}><Sword className="w-3 h-3 md:w-4 md:h-4" /> WEAPONS</button>
                        <button onClick={() => handleCategoryChange('ARMOR')} className={`flex-1 py-3 md:py-4 text-center font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs ${activeCategory === 'ARMOR' ? 'bg-stone-800 text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}><Shield className="w-3 h-3 md:w-4 md:h-4" /> ARMORS</button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 space-y-4">
                        {visibleSubCats.map(subCat => (
                            <div key={subCat.id} className="space-y-2">
                                <button onClick={() => toggleSubCategory(subCat.id)} className="w-full flex items-center justify-between px-3 py-2 bg-stone-800/40 rounded-lg hover:bg-stone-800/60 transition-colors">
                                    <span className="text-[10px] md:text-xs font-black uppercase text-stone-400 tracking-widest">{subCat.name}</span>
                                    {expandedSubCat === subCat.id ? <ChevronDown className="w-4 h-4 text-stone-600" /> : <ChevronRight className="w-4 h-4 text-stone-600" />}
                                </button>
                                {expandedSubCat === subCat.id && (
                                    <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-300">
                                        {groupedItems[subCat.id].map(item => (
                                            <RecipeCard 
                                                key={item.id}
                                                item={item}
                                                isSelected={selectedItem?.id === item.id}
                                                isFav={favorites.includes(item.id)}
                                                inventoryCount={inventory.filter(i => i.name === item.name).length}
                                                onSelect={handleSelectItem}
                                                onToggleFavorite={toggleFavorite}
                                                onMouseEnter={handleMouseEnter}
                                                onMouseMove={handleMouseMove}
                                                onMouseLeave={handleMouseLeave}
                                                imageUrl={getItemImageUrl(item)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {hoveredItem && <RecipeTooltip item={hoveredItem} pos={tooltipPos} getInventoryCount={getInventoryCount} />}
    </div>
  );
};

export default ForgeTab;