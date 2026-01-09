
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { EQUIPMENT_SUBCATEGORIES, EQUIPMENT_ITEMS } from '../../../data/equipment';
import { EquipmentCategory, EquipmentItem } from '../../../types/index';
import SmithingMinigame from './SmithingMinigame';
import WorkbenchMinigame from './WorkbenchMinigame';
import { Hammer, Shield, Sword, ChevronRight, Info, ChevronLeft, Lock, Check, X as XIcon, Box, Flame, ChevronDown, Heart, Star, Zap, Award, Wrench, X, ShoppingCart, Brain, AlertCircle, TrendingUp, Sparkles, FastForward } from 'lucide-react';
import { useGame } from '../../../context/GameContext';
import { GAME_CONFIG } from '../../../config/game-config';
import { MASTERY_THRESHOLDS } from '../../../config/mastery-config';
import { MATERIALS } from '../../../data/materials';
import { getAssetUrl } from '../../../utils';

interface ForgeTabProps {
    onNavigate: (tab: any) => void;
}

const ForgeTab: React.FC<ForgeTabProps> = ({ onNavigate }) => {
  const { state, actions } = useGame();
  
  const { inventory, stats, isCrafting, craftingMastery, activeEvent, unlockedRecipes } = state;
  const { hasFurnace, hasWorkbench } = state.forge;

  const [activeCategory, setActiveCategory] = useState<EquipmentCategory>('WEAPON');
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [hasPromptedFurnace, setHasPromptedFurnace] = useState(false);
  const [failedFuelHighlight, setFailedFuelHighlight] = useState(false);
  
  const [expandedSubCat, setExpandedSubCat] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const [hoveredItem, setHoveredItem] = useState<EquipmentItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  const getInventoryCount = useCallback((id: string) => {
      return inventory.find(i => i.id === id)?.quantity || 0;
  }, [inventory]);

  const getResourceName = (id: string) => {
      const itemDef = Object.values(MATERIALS).find(i => i.id === id);
      return itemDef ? itemDef.name : id;
  };

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
  
  useEffect(() => {
    if (!hasFurnace && !hasPromptedFurnace && !activeEvent) {
        actions.triggerEvent({
            id: 'CUSTOMER_VISIT',
            title: "The Forge lies in Ruins",
            description: "Your journey as a blacksmith starts with a single spark. To begin forging weapons and armor, you must first install a Furnace from the market.",
            options: [
                { label: "Visit Market (500 G)", action: () => onNavigate('MARKET') },
                { label: "I'll look around first", action: () => {} }
            ]
        });
        setHasPromptedFurnace(true);
    }
  }, [hasFurnace, hasPromptedFurnace, activeEvent, actions, onNavigate]);

  const canEnterForge = useMemo(() => {
      if (!selectedItem) return false;
      if (selectedItem.craftingType === 'WORKBENCH') return true;
      return hasFuel || hasHeat;
  }, [selectedItem, hasFuel, hasHeat]);
  
  const requiredEnergy = useMemo(() => {
      if (!selectedItem) return GAME_CONFIG.ENERGY_COST.CRAFT;
      const count = craftingMastery[selectedItem.id] || 0;
      if (count >= MASTERY_THRESHOLDS.ARTISAN) {
          return GAME_CONFIG.ENERGY_COST.CRAFT - MASTERY_THRESHOLDS.ARTISAN_BONUS.energyDiscount;
      }
      return GAME_CONFIG.ENERGY_COST.CRAFT;
  }, [selectedItem, craftingMastery]);

  const hasEnergy = stats.energy >= requiredEnergy;

  const canAffordResources = useCallback((item: EquipmentItem) => {
      return item.requirements.every(req => getInventoryCount(req.id) >= req.count);
  }, [getInventoryCount]);

  const visibleItems = useMemo(() => {
      return EQUIPMENT_ITEMS.filter(item => {
          const isUnlocked = item.unlockedByDefault !== false || unlockedRecipes?.includes(item.id);
          if (!isUnlocked) return false;
          if (item.tier > stats.tierLevel) return false;
          const subCatDef = EQUIPMENT_SUBCATEGORIES.find(sc => sc.id === item.subCategoryId);
          return subCatDef?.categoryId === activeCategory;
      });
  }, [activeCategory, stats.tierLevel, unlockedRecipes]);

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
      if (visibleSubCats.length > 0 && !expandedSubCat) {
          setExpandedSubCat(visibleSubCats[0].id);
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

  const isRequirementMet = useMemo(() => {
    if (!selectedItem) return true;
    if (selectedItem.craftingType === 'FORGE') return hasFurnace;
    if (selectedItem.craftingType === 'WORKBENCH') return hasWorkbench;
    return true;
  }, [selectedItem, hasFurnace, hasWorkbench]);

  const startCrafting = useCallback(() => {
      if (!selectedItem) return;

      // Tiered checks for toast feedback
      if (!isRequirementMet) {
          actions.showToast(`You need a ${selectedItem.craftingType === 'FORGE' ? 'Furnace' : 'Workbench'} to craft this.`);
          return;
      }
      if (!canAffordResources(selectedItem)) {
          actions.showToast(`Insufficient materials for ${selectedItem.name}.`);
          return;
      }
      if (!hasEnergy) {
          actions.triggerEnergyHighlight();
          actions.showToast("Not enough energy.");
          return;
      }
      if (selectedItem.craftingType === 'FORGE' && !canEnterForge) {
          setFailedFuelHighlight(true);
          setTimeout(() => setFailedFuelHighlight(false), 2000);
          actions.showToast("Forge is cold! Add fuel first.");
          return;
      }

      actions.startCrafting(selectedItem);
      setIsPanelOpen(false); 
  }, [actions, selectedItem, isRequirementMet, canAffordResources, hasEnergy, canEnterForge]);

  const cancelCrafting = useCallback(() => {
      if (selectedItem) actions.cancelCrafting(selectedItem);
      else actions.setCrafting(false); 
      setIsPanelOpen(true);
  }, [actions, selectedItem]);

  const handleMinigameComplete = useCallback((score: number, bonus?: number) => {
    if (selectedItem) actions.finishCrafting(selectedItem, score, bonus);
    setIsPanelOpen(true);
  }, [selectedItem, actions]);
  
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
      if (finalX + 240 > viewportW) finalX = x - 260;
      if (finalY + 160 > viewportH) finalY = y - 180;
      setTooltipPos({ x: finalX, y: finalY });
  };

  const handleMouseLeave = useCallback(() => setHoveredItem(null), []);

  const renderStats = (item: EquipmentItem) => {
    if (!item.baseStats) return null;
    const s = item.baseStats;
    return (
        <div className="grid grid-cols-2 gap-1.5 md:gap-3 w-full max-w-xs mb-4 md:mb-6 animate-in slide-in-from-bottom-2 duration-500">
            {s.physicalAttack > 0 && (
                <div className="bg-stone-900/60 border border-stone-800 p-1.5 md:p-2 rounded-lg flex justify-between items-center shadow-inner">
                    <span className="text-[7px] md:text-[10px] text-stone-500 font-black uppercase flex items-center gap-1"><Sword className="w-2.5 h-2.5" /> P.Atk</span>
                    <span className="text-[9px] md:text-sm font-mono font-bold text-stone-200">{s.physicalAttack}</span>
                </div>
            )}
            {s.magicalAttack > 0 && (
                <div className="bg-stone-900/60 border border-stone-800 p-1.5 md:p-2 rounded-lg flex justify-between items-center shadow-inner">
                    <span className="text-[7px] md:text-[10px] text-stone-500 font-black uppercase flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> M.Atk</span>
                    <span className="text-[9px] md:text-sm font-mono font-bold text-stone-200">{s.magicalAttack}</span>
                </div>
            )}
            {s.physicalDefense > 0 && (
                <div className="bg-stone-900/60 border border-stone-800 p-1.5 md:p-2 rounded-lg flex justify-between items-center shadow-inner">
                    <span className="text-[7px] md:text-[10px] text-stone-500 font-black uppercase flex items-center gap-1"><Shield className="w-2.5 h-2.5" /> P.Def</span>
                    <span className="text-[9px] md:text-sm font-mono font-bold text-stone-200">{s.physicalDefense}</span>
                </div>
            )}
            {s.magicalDefense > 0 && (
                <div className="bg-stone-900/60 border border-stone-800 p-1.5 md:p-2 rounded-lg flex justify-between items-center shadow-inner">
                    <span className="text-[7px] md:text-[10px] text-stone-500 font-black uppercase flex items-center gap-1"><Brain className="w-2.5 h-2.5" /> M.Def</span>
                    <span className="text-[9px] md:text-sm font-mono font-bold text-stone-200">{s.magicalDefense}</span>
                </div>
            )}
        </div>
    );
  };

  const renderItemCard = (item: EquipmentItem) => {
      const isSelected = selectedItem?.id === item.id;
      const isFav = favorites.includes(item.id);
      const count = inventory.filter(i => i.name === item.name).length;
      return (
        <div 
            key={item.id} onClick={() => setSelectedItem(item)}
            onMouseEnter={(e) => handleMouseEnter(item, e)} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
            className={`relative flex flex-col items-center rounded-lg border transition-all cursor-pointer group text-left h-[115px] md:h-[130px] overflow-hidden ${isSelected ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-stone-800 border-stone-700 hover:border-stone-500 hover:bg-stone-750'}`}
        >
            <div className="w-full flex justify-between items-start p-1.5 md:p-2 z-10">
                 <span className={`text-[8px] md:text-[10px] font-bold tracking-wider font-mono ${isSelected ? 'text-amber-400' : 'text-stone-600'}`}>T{item.tier}</span>
                 <button onClick={(e) => toggleFavorite(e, item.id)} className="p-1 rounded-full hover:bg-stone-700 transition-colors"><Heart className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-stone-600 hover:text-stone-400'}`} /></button>
            </div>
            <div className="flex-1 flex items-center justify-center group-hover:scale-110 transition-transform -mt-2"><img src={getItemImageUrl(item)} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" /></div>
            <div className="w-full text-center pb-1.5 px-1 flex flex-col items-center gap-0.5"><div className={`text-[10px] md:text-xs font-bold leading-tight truncate w-full ${isSelected ? 'text-amber-200' : 'text-stone-300'}`}>{item.name}</div>{count > 0 && <div className="inline-flex items-center gap-0.5 bg-stone-950/50 px-1.5 py-0.5 rounded text-[8px] font-mono text-stone-500 border border-stone-800/50"><Box className="w-2 h-2" /> {count}</div>}</div>
        </div>
      );
  };

  // --- Mastery Radial Logic ---
  const masteryInfo = useMemo(() => {
    if (!selectedItem) return null;
    const count = craftingMastery[selectedItem.id] || 0;
    let label = "Novice";
    let colorClass = "stroke-stone-500";
    let glowClass = "shadow-[0_0_20px_rgba(120,113,108,0.2)]";
    let progress = 0;
    let nextMax = MASTERY_THRESHOLDS.ADEPT;

    if (count >= MASTERY_THRESHOLDS.ARTISAN) {
      label = "Artisan";
      colorClass = "stroke-amber-500";
      glowClass = "shadow-[0_0_40px_rgba(245,158,11,0.3)]";
      progress = Math.min(100, ((count - MASTERY_THRESHOLDS.ARTISAN) / 20) * 100);
      nextMax = 50; 
    } else if (count >= MASTERY_THRESHOLDS.ADEPT) {
      label = "Adept";
      colorClass = "stroke-emerald-500";
      glowClass = "shadow-[0_0_30px_rgba(16,185,129,0.2)]";
      progress = ((count - MASTERY_THRESHOLDS.ADEPT) / (MASTERY_THRESHOLDS.ARTISAN - MASTERY_THRESHOLDS.ADEPT)) * 100;
      nextMax = MASTERY_THRESHOLDS.ARTISAN;
    } else {
      label = "Novice";
      colorClass = "stroke-stone-400";
      glowClass = "shadow-[0_0_20px_rgba(168,162,158,0.15)]";
      progress = (count / MASTERY_THRESHOLDS.ADEPT) * 100;
      nextMax = MASTERY_THRESHOLDS.ADEPT;
    }

    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return { label, colorClass, glowClass, progress, circumference, offset, count, nextMax };
  }, [selectedItem, craftingMastery]);

  const quickCraftFuelCost = useMemo(() => {
      if (!selectedItem || selectedItem.craftingType !== 'FORGE' || !masteryInfo) return 0;
      const count = masteryInfo.count;
      let divisor = 8;
      if (count >= MASTERY_THRESHOLDS.ARTISAN) divisor = 14;
      else if (count >= MASTERY_THRESHOLDS.ADEPT) divisor = 12;
      return Math.ceil(selectedItem.maxDurability / divisor);
  }, [selectedItem, masteryInfo]);

  const handleQuickCraft = useCallback(() => {
      if (!selectedItem || !masteryInfo) return;

      // Tiered checks for Quick Craft
      if (!isRequirementMet) {
          actions.showToast(`You need a ${selectedItem.craftingType === 'FORGE' ? 'Furnace' : 'Workbench'} to craft this.`);
          return;
      }
      if (!canAffordResources(selectedItem)) {
          actions.showToast(`Insufficient materials for ${selectedItem.name}.`);
          return;
      }
      if (!hasEnergy) {
          actions.triggerEnergyHighlight();
          actions.showToast("Not enough energy.");
          return;
      }

      // Fuel logic for Smithing Quick Craft
      if (selectedItem.craftingType === 'FORGE') {
          if (charcoalCount < quickCraftFuelCost) {
              actions.showToast(`Insufficient charcoal! Need ${quickCraftFuelCost} fuel.`);
              return;
          }
          actions.consumeItem('charcoal', quickCraftFuelCost);
      }

      // Determine quality and mastery gain based on current rank
      let quality = 50;
      let masteryGain = 0.5;

      if (masteryInfo.count >= MASTERY_THRESHOLDS.ARTISAN) {
          quality = 95;
          masteryGain = 1.0;
      } else if (masteryInfo.count >= MASTERY_THRESHOLDS.ADEPT) {
          quality = 75;
          masteryGain = 0.7;
      }

      // Deduct resources and energy
      actions.startCrafting(selectedItem);
      // Immediately finalize with specific parameters
      actions.finishCrafting(selectedItem, quality, 0, masteryGain);
  }, [selectedItem, masteryInfo, isRequirementMet, canAffordResources, hasEnergy, actions, charcoalCount, quickCraftFuelCost]);

  const content = useMemo(() => {
    const canCraft = selectedItem && canAffordResources(selectedItem) && (selectedItem.craftingType === 'WORKBENCH' || canEnterForge) && hasEnergy && isRequirementMet;
    const canQuickCraft = selectedItem && canAffordResources(selectedItem) && hasEnergy && isRequirementMet && (selectedItem.craftingType !== 'FORGE' || charcoalCount >= quickCraftFuelCost);
    const isMissingFuelOnly = selectedItem && selectedItem.craftingType === 'FORGE' && canAffordResources(selectedItem) && !canEnterForge && hasEnergy && isRequirementMet;
    const hasAlreadyCraftedOnce = selectedItem ? (craftingMastery[selectedItem.id] || 0) > 0 : false;
    
    return (
        <div className="relative h-full w-full bg-stone-950 overflow-hidden" style={{ backgroundImage: `url(${getAssetUrl('tile_forge.png')})`, backgroundRepeat: 'repeat', backgroundBlendMode: 'multiply' }}>
        {selectedItem && !isRequirementMet && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md animate-in fade-in duration-700"></div>
                <div className="relative z-10 p-6 md:p-8 max-w-md w-full bg-stone-900 border-2 border-stone-800 rounded-2xl shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-2 text-stone-500 hover:text-stone-300 transition-colors"><X className="w-5 h-5" /></button>
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-stone-800 rounded-full flex items-center justify-center mb-4 md:mb-6 border border-stone-700 shrink-0">{selectedItem.craftingType === 'FORGE' ? <Flame className="w-8 h-8 md:w-10 md:h-10 text-stone-600" /> : <Wrench className="w-8 h-8 md:w-10 md:h-10 text-stone-600" />}</div>
                    <h2 className="text-xl md:text-2xl font-bold text-stone-300 font-serif mb-2">{selectedItem.craftingType === 'FORGE' ? 'Furnace Required' : 'Workbench Required'}</h2>
                    <p className="text-sm md:text-base text-stone-500 mb-6 md:mb-8 leading-relaxed">Crafting <span className="text-amber-500 font-bold">{selectedItem.name}</span> requires a functional {selectedItem.craftingType === 'FORGE' ? 'furnace' : 'workbench'}. Visit the market to purchase one.</p>
                    <button onClick={() => onNavigate('MARKET')} className="w-full py-3 md:py-4 bg-amber-700 hover:bg-amber-600 text-amber-50 font-bold rounded-xl shadow-lg hover:shadow-amber-900/40 transition-all flex items-center justify-center gap-2 group shrink-0">Go to Market <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" /></button>
                </div>
            </div>
        )}
        <div className={`absolute inset-0 z-0 flex w-full h-full ${((selectedItem && !isRequirementMet) || !hasFurnace) ? 'blur-sm pointer-events-none' : ''}`}>
            <div className={`h-full relative flex flex-col transition-all duration-500 ease-in-out ${isPanelOpen ? 'w-[55%] md:w-[60%]' : 'w-full'}`}>
                <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 bg-stone-925/40 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">{selectedItem?.craftingType === 'FORGE' ? <Hammer className="w-64 h-64 md:w-96 md:h-96 text-stone-500" /> : <Wrench className="w-64 h-64 md:w-96 md:h-96 text-stone-500" />}</div>
                    {selectedItem ? (
                        <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full max-w-lg">
                            
                            {/* Mastery Radial Indicator around item image */}
                            <div className="relative mb-3 md:mb-6 group">
                                <div className={`w-24 h-24 md:w-48 md:h-48 bg-stone-900 rounded-full flex items-center justify-center relative z-10 p-2 md:p-4 border border-stone-800/50 ${masteryInfo?.glowClass} transition-all duration-700`}>
                                    {/* Radial SVG Gauge */}
                                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                                        {/* Background Track */}
                                        <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-stone-950/40" />
                                        {/* Progress Arc */}
                                        <circle 
                                            cx="50" cy="50" r="46" 
                                            stroke="currentColor" strokeWidth="4" fill="transparent"
                                            strokeDasharray={masteryInfo?.circumference}
                                            strokeDashoffset={masteryInfo?.offset}
                                            strokeLinecap="round"
                                            className={`${masteryInfo?.colorClass} transition-all duration-1000 ease-out`}
                                        />
                                    </svg>
                                    <img src={getItemImageUrl(selectedItem)} className="w-14 h-14 md:w-32 md:h-32 object-contain drop-shadow-2xl z-20 relative transform group-hover:scale-110 transition-transform duration-500" />
                                    
                                    {/* Small Rank Badge */}
                                    <div className={`absolute -bottom-1 -right-1 md:bottom-2 md:right-2 z-30 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full border border-stone-700 bg-stone-900 shadow-xl flex items-center gap-1 animate-in slide-in-from-right-2 duration-700`}>
                                        <Star className={`w-2 h-2 md:w-3 md:h-3 ${masteryInfo?.colorClass.replace('stroke-', 'fill-')}`} />
                                        <span className={`text-[7px] md:text-[10px] font-black uppercase tracking-tighter ${masteryInfo?.colorClass.replace('stroke-', 'text-')}`}>{masteryInfo?.label}</span>
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-xl md:text-3xl font-bold text-amber-500 mb-1 md:mb-1.5 font-serif tracking-wide">{selectedItem.name}</h2>
                            <p className="text-stone-500 text-center max-w-md mb-4 md:mb-6 italic text-[9px] md:text-sm leading-tight px-6">"{selectedItem.description}"</p>
                            
                            {/* Stats Block */}
                            {renderStats(selectedItem)}

                            {/* Modified Mastery Info (Simplified Text since circle handles visual) */}
                            <div className="w-full max-w-xs mb-6 md:mb-8 flex flex-col items-center">
                                <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">
                                    <Award className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                                    <span>Experience: {Math.round(masteryInfo?.progress || 0)}%</span>
                                </div>
                            </div>

                            <div className="relative group flex flex-col items-center w-full gap-2 md:gap-4 px-4">
                                {/* Persistent Fuel Warning */}
                                {isMissingFuelOnly && (
                                    <div className="mb-2 flex items-center gap-1.5 text-orange-500 font-bold text-[9px] md:text-xs animate-pulse bg-orange-950/30 px-3 py-1 rounded-full border border-orange-900/40">
                                        <Flame className="w-3 h-3 md:w-4 md:h-4" />
                                        <span>Fuel Required to Heat the Forge</span>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                                    <button 
                                        onClick={startCrafting} 
                                        className={`flex-1 max-w-[280px] px-6 md:px-10 py-3 md:py-4 rounded-lg font-black text-sm md:text-lg shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 md:gap-3 border ${failedFuelHighlight ? 'bg-red-900 border-red-500 animate-shake-hard shadow-[0_0_20px_rgba(239,68,68,0.4)]' : canCraft ? (selectedItem.craftingType === 'FORGE' ? 'bg-amber-700 hover:bg-amber-600 border-amber-500' : 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500') : (isMissingFuelOnly ? 'bg-stone-800 text-stone-300 border-amber-600/50 grayscale opacity-70' : 'bg-stone-800 text-stone-500 border-stone-700 opacity-70 grayscale')}`}
                                    >
                                        {selectedItem.craftingType === 'FORGE' ? <Hammer className="w-4 h-4 md:w-6 md:h-6" /> : <Wrench className="w-4 h-4 md:w-6 md:h-6" />}
                                        <span>{selectedItem.craftingType === 'FORGE' ? 'Start Forging' : 'Start Crafting'}</span>
                                    </button>

                                    {hasAlreadyCraftedOnce && (
                                        <button 
                                            onClick={handleQuickCraft}
                                            className={`flex-1 max-w-[280px] px-6 md:px-10 py-3 md:py-4 rounded-lg font-black text-sm md:text-lg shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 md:gap-3 border bg-stone-900 border-stone-700 hover:bg-stone-800 hover:border-amber-600 group ${!canQuickCraft ? 'opacity-50 grayscale' : ''}`}
                                            title={`Quick Craft (Lower Quality & Mastery XP)${selectedItem.craftingType === 'FORGE' ? ` - Costs ${quickCraftFuelCost} Charcoal` : ''}`}
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-4 h-4 md:w-6 md:h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                                                    <span className="text-stone-300 group-hover:text-amber-200">Quick Craft</span>
                                                </div>
                                                {selectedItem.craftingType === 'FORGE' && (
                                                    <div className="flex items-center gap-1 mt-0.5 opacity-60 text-[8px] md:text-xs font-mono font-bold">
                                                        <Flame className="w-2.5 h-2.5 text-orange-500" />
                                                        <span>-{quickCraftFuelCost}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    )}
                                </div>
                                
                                {failedFuelHighlight && <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] md:text-xs font-black px-3 py-1.5 rounded-lg shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-2 whitespace-nowrap z-50 ring-2 ring-red-400"><AlertCircle className="w-3 h-3 md:w-4 md:h-4 inline mr-1" /> LACK OF FUEL</div>}
                            </div>
                        </div>
                    ) : (
                        <div className="z-10 flex flex-col items-center text-stone-600"><div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-dashed border-stone-700 flex items-center justify-center mb-4"><Hammer className="w-6 h-6 md:w-10 md:h-10" /></div><h3 className="text-base md:text-xl font-bold text-stone-500 drop-shadow-md">The Anvil is Cold</h3><p className="text-[10px] md:text-sm mt-1 md:mt-2 font-medium">Select a recipe from the right to begin.</p></div>
                    )}
                </div>
            </div>
            <div className={`h-full bg-stone-900/95 border-l border-stone-800 shadow-2xl flex flex-col transition-all duration-500 ease-in-out relative backdrop-blur-sm ${isPanelOpen ? 'w-[45%] md:w-[40%] translate-x-0' : 'w-0 translate-x-full border-none'}`}>
                <button onClick={() => setIsPanelOpen(!isPanelOpen)} disabled={isCrafting} className={`absolute top-1/2 -left-6 w-6 h-20 md:h-24 -translate-y-1/2 bg-stone-800 border-y border-l border-stone-600 rounded-l-lg flex items-center justify-center hover:bg-stone-700 hover:text-amber-400 transition-colors z-20 ${isCrafting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>{isCrafting ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : isPanelOpen ? <ChevronRight className="w-4 h-4 text-stone-400" /> : <ChevronLeft className="w-4 h-4 text-amber-500 animate-pulse" />}</button>
                <div className="w-full h-full flex flex-col">
                    <div className="flex border-b border-stone-800 shrink-0"><button onClick={() => handleCategoryChange('WEAPON')} className={`flex-1 py-3 md:py-4 text-center font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs ${activeCategory === 'WEAPON' ? 'bg-stone-800 text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}><Sword className="w-3 h-3 md:w-4 md:h-4" /> WEAPONS</button><button onClick={() => handleCategoryChange('ARMOR')} className={`flex-1 py-3 md:py-4 text-center font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs ${activeCategory === 'ARMOR' ? 'bg-stone-800 text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}><Shield className="w-3 h-3 md:w-4 md:h-4" /> ARMOR</button></div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-3 space-y-2">
                        {visibleSubCats.map(subCat => {
                            const isExpanded = expandedSubCat === subCat.id;
                            const items = groupedItems[subCat.id] || [];
                            return (
                                <div key={subCat.id} className="border border-stone-800 rounded-lg overflow-hidden">
                                    <button onClick={() => toggleSubCategory(subCat.id)} className="w-full bg-stone-800 p-2.5 md:p-3 flex items-center justify-between hover:bg-stone-750 transition-colors"><div className="flex items-center gap-1.5 md:gap-2">{isExpanded ? <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-100" /> : <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-500" />}<span className={`font-bold text-xs md:text-sm truncate ${isExpanded ? 'text-amber-100' : 'text-stone-400'}`}>{subCat.name}</span></div><span className="text-[10px] bg-stone-900 px-1.5 py-0.5 rounded text-stone-500 font-mono">{items.length}</span></button>
                                    {isExpanded && <div className="bg-stone-900/50 p-1.5 md:p-2 grid grid-cols-2 gap-1.5 md:gap-2 animate-in slide-in-from-top-2 duration-200">{items.map(item => renderItemCard(item))}</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
        {isCrafting && selectedItem && (
            <div className="absolute inset-0 z-50 animate-in fade-in zoom-in-95 duration-300 bg-stone-950">{selectedItem.craftingType === 'FORGE' ? <SmithingMinigame difficulty={selectedItem.tier} onComplete={handleMinigameComplete} onClose={cancelCrafting} /> : <WorkbenchMinigame difficulty={selectedItem.tier} onComplete={handleMinigameComplete} onClose={cancelCrafting} subCategoryId={selectedItem.subCategoryId} itemImage={selectedItem.image || `${selectedItem.id}.png`} />}</div>
        )}
        {hoveredItem && (
            <div className="fixed z-[60] pointer-events-none w-56 md:w-64 bg-stone-950/95 border border-stone-700 rounded-lg shadow-2xl backdrop-blur-sm p-3 md:p-4 animate-in fade-in duration-150" style={{ top: tooltipPos.y, left: tooltipPos.x }}>
                <h4 className="font-bold text-stone-200 border-b border-stone-800 pb-2 mb-2 flex justify-between items-center"><span className="text-[10px] md:text-xs">Requirements</span><span className="text-[9px] md:text-[10px] font-normal text-stone-500 uppercase">Tier {hoveredItem.tier}</span></h4>
                <div className="space-y-1.5">{hoveredItem.requirements.map((req, idx) => {
                    const currentCount = getInventoryCount(req.id);
                    const hasEnough = currentCount >= req.count;
                    return (
                        <div key={idx} className="flex justify-between items-center text-[10px] md:text-xs"><span className="text-stone-400 truncate mr-2">{getResourceName(req.id)}</span><div className={`flex items-center gap-1 font-mono ${hasEnough ? 'text-emerald-400' : 'text-red-400'}`}><span>{currentCount}/{req.count}</span>{hasEnough ? <Check className="w-2.5 h-2.5" /> : <XIcon className="w-2.5 h-2.5" />}</div></div>
                    );
                })}</div>
            </div>
        )}
        </div>
    );
  }, [activeCategory, selectedItem, isPanelOpen, isCrafting, hoveredItem, tooltipPos, inventory, hasFurnace, hasWorkbench, canEnterForge, hasHeat, charcoalCount, hasEnergy, requiredEnergy, stats.tierLevel, expandedSubCat, favorites, craftingMastery, isRequirementMet, handleCategoryChange, startCrafting, cancelCrafting, handleMinigameComplete, toggleSubCategory, toggleFavorite, handleMouseEnter, handleMouseMove, handleMouseLeave, canAffordResources, getInventoryCount, onNavigate, groupedItems, visibleSubCats, hasPromptedFurnace, activeEvent, unlockedRecipes, failedFuelHighlight, masteryInfo, handleQuickCraft, quickCraftFuelCost]);
  return content;
};

export default ForgeTab;
