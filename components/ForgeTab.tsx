
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { EQUIPMENT_SUBCATEGORIES, EQUIPMENT_ITEMS } from '../data/equipment';
import { EquipmentCategory, EquipmentItem } from '../types/index';
import SmithingMinigame from './SmithingMinigame';
import { Hammer, Shield, Sword, ChevronRight, Info, ChevronLeft, Lock, Check, X as XIcon, Box, Flame, ChevronDown, Heart, Star, Zap, Award } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GAME_CONFIG } from '../config/game-config';
import { MASTERY_THRESHOLDS } from '../config/mastery-config';
import { MATERIALS } from '../data/materials';

interface ForgeTabProps {
    onNavigate: (tab: any) => void;
}

const ForgeTab: React.FC<ForgeTabProps> = ({ onNavigate }) => {
  const { state, actions } = useGame();
  
  // Destructure only what we need for this component to minimize re-render impact
  const { inventory, stats, isCrafting, craftingMastery } = state;
  const { hasFurnace } = state.forge;

  // UI State
  const [activeCategory, setActiveCategory] = useState<EquipmentCategory>('WEAPON');
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  // Accordion & Favorites State
  // Changed to string | null to enforce single-expand behavior
  const [expandedSubCat, setExpandedSubCat] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Tooltip State
  const [hoveredItem, setHoveredItem] = useState<EquipmentItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  // Helper to check resources
  const getInventoryCount = useCallback((id: string) => {
      return inventory.find(i => i.id === id)?.quantity || 0;
  }, [inventory]);

  const getResourceName = (id: string) => {
      const itemDef = Object.values(MATERIALS).find(i => i.id === id);
      return itemDef ? itemDef.name : id;
  };

  // CHECKS
  const charcoalCount = getInventoryCount('charcoal');
  const hasFuel = charcoalCount > 0;
  
  // Determine energy cost dynamically based on mastery of SELECTED item
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

  // Filter Items directly based on Category and Tier
  const visibleItems = useMemo(() => {
      return EQUIPMENT_ITEMS.filter(item => {
          // 1. Check Tier
          if (item.tier > stats.tierLevel) return false;

          // 2. Check Category (Map subCategory to main Category)
          const subCatDef = EQUIPMENT_SUBCATEGORIES.find(sc => sc.id === item.subCategoryId);
          return subCatDef?.categoryId === activeCategory;
      });
  }, [activeCategory, stats.tierLevel]);

  // Get Favorites from visible items
  const favoriteItems = useMemo(() => {
      return visibleItems.filter(item => favorites.includes(item.id));
  }, [visibleItems, favorites]);

  // Group Items by SubCategory
  const groupedItems = useMemo(() => {
      const groups: Record<string, EquipmentItem[]> = {};
      visibleItems.forEach(item => {
          if (!groups[item.subCategoryId]) groups[item.subCategoryId] = [];
          groups[item.subCategoryId].push(item);
      });
      return groups;
  }, [visibleItems]);

  // Get visible subcategories that actually have items
  const visibleSubCats = useMemo(() => {
      return EQUIPMENT_SUBCATEGORIES.filter(sc => 
          sc.categoryId === activeCategory && groupedItems[sc.id] && groupedItems[sc.id].length > 0
      );
  }, [activeCategory, groupedItems]);

  // Initialize expanded state when category changes
  useEffect(() => {
      // Priority: Favorites -> First available subcategory
      if (favoriteItems.length > 0) {
          setExpandedSubCat('FAVORITES');
      } else if (visibleSubCats.length > 0) {
          setExpandedSubCat(visibleSubCats[0].id);
      } else {
          setExpandedSubCat(null);
      }
  }, [activeCategory, visibleSubCats, favoriteItems.length]); // Depend on favoriteItems.length to auto-open if first fav added

  // Handlers - Memoized to prevent prop changes in children
  const handleCategoryChange = useCallback((cat: EquipmentCategory) => {
    setActiveCategory(cat);
    setSelectedItem(null);   // Deselect item
  }, []);

  const toggleSubCategory = useCallback((subCatId: string) => {
      setExpandedSubCat(prev => (prev === subCatId ? null : subCatId));
  }, []);

  const toggleFavorite = useCallback((e: React.MouseEvent, itemId: string) => {
      e.stopPropagation(); // Prevent item selection
      setFavorites(prev => 
          prev.includes(itemId)
              ? prev.filter(id => id !== itemId)
              : [...prev, itemId]
      );
  }, []);

  const startCrafting = useCallback(() => {
      // Use global state to prevent day change during crafting
      actions.setCrafting(true);
      setIsPanelOpen(false); // Auto collapse logic for background effect
  }, [actions]);

  const stopCrafting = useCallback(() => {
      actions.setCrafting(false);
      setIsPanelOpen(true); // Auto restore logic
  }, [actions]);

  const handleMinigameComplete = useCallback((score: number) => {
    // Pass the score (quality) to the crafting action
    if (selectedItem) {
        console.log(`Crafted ${selectedItem.name} with score: ${score}`);
        actions.craftItem(selectedItem, score);
    }
    stopCrafting();
  }, [selectedItem, actions, stopCrafting]);
  
  // Mouse handlers for tooltip
  const handleMouseEnter = useCallback((item: EquipmentItem, e: React.MouseEvent) => {
      setHoveredItem(item);
      setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (hoveredItem) {
          setTooltipPos({ x: e.clientX, y: e.clientY });
      }
  }, [hoveredItem]);

  const handleMouseLeave = useCallback(() => {
      setHoveredItem(null);
  }, []);

  // Mastery Helper
  const getMasteryLevel = (count: number) => {
      if (count >= MASTERY_THRESHOLDS.ARTISAN) return 2;
      if (count >= MASTERY_THRESHOLDS.ADEPT) return 1;
      return 0;
  };

  const getMasteryIcon = (level: number) => {
      if (level === 2) return <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />; // Gold
      if (level === 1) return <Star className="w-3 h-3 text-stone-300 fill-stone-300" />; // Silver
      return <Star className="w-3 h-3 text-amber-700/50" />; // None
  };

  // Render Helper for Item Card
  const renderItemCard = (item: EquipmentItem) => {
      const isSelected = selectedItem?.id === item.id;
      const isFav = favorites.includes(item.id);
      const count = inventory.filter(i => i.name === item.name).length;
      
      const masteryCount = craftingMastery[item.id] || 0;
      const masteryLevel = getMasteryLevel(masteryCount);

      return (
        <div 
            key={item.id}
            onClick={() => setSelectedItem(item)}
            onMouseEnter={(e) => handleMouseEnter(item, e)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative flex flex-col items-center rounded-lg border transition-all cursor-pointer group text-left h-[130px] overflow-hidden ${
                isSelected 
                ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                : 'bg-stone-800 border-stone-700 hover:border-stone-500 hover:bg-stone-750'
            }`}
        >
            {/* Top Row: Tier & Mastery/Favorite */}
            <div className="w-full flex justify-between items-start p-2 z-10">
                 <span className={`text-[10px] font-bold tracking-wider font-mono ${isSelected ? 'text-amber-400' : 'text-stone-600'}`}>
                    TIER {item.tier}
                </span>

                <div className="flex items-center gap-1 -mt-1 -mr-1">
                    {/* Mastery Icon */}
                    {masteryCount > 0 && (
                        <div className="p-1" title={`Mastery Level ${masteryLevel} (${masteryCount})`}>
                            {getMasteryIcon(masteryLevel)}
                        </div>
                    )}
                    
                    {/* Favorite Button */}
                    <button 
                        onClick={(e) => toggleFavorite(e, item.id)}
                        className="p-1 rounded-full hover:bg-stone-700 transition-colors"
                    >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-stone-600 hover:text-stone-400'}`} />
                    </button>
                </div>
            </div>

            {/* Icon (Centered) */}
            <div className="flex-1 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform -mt-2">
                {item.icon}
            </div>
            
            {/* Bottom Info (Fixed Layout) */}
            <div className="w-full text-center pb-2 px-1 flex flex-col items-center gap-1">
                {/* Name */}
                <div className={`text-xs font-bold leading-tight truncate w-full ${isSelected ? 'text-amber-200' : 'text-stone-300'}`}>
                    {item.name}
                </div>
                
                {/* Count Badge */}
                <div className="h-5 flex items-center justify-center w-full">
                    {count > 0 ? (
                        <div className="inline-flex items-center gap-0.5 bg-stone-950/50 px-2 py-0.5 rounded text-[10px] font-mono text-stone-500 border border-stone-800/50">
                            <Box className="w-2.5 h-2.5" /> {count}
                        </div>
                    ) : (
                        <div className="h-[18px]"></div>
                    )}
                </div>
            </div>
        </div>
      );
  };

  // Wrap the entire visual output in useMemo
  const content = useMemo(() => {
    
    // Derived state for selected item button logic
    const canCraft = selectedItem && canAffordResources(selectedItem) && hasFuel && hasEnergy;
    
    // Mastery Info for Selected Item
    let masteryInfo = null;
    if (selectedItem) {
        const count = craftingMastery[selectedItem.id] || 0;
        const level = getMasteryLevel(count);
        let nextThreshold = MASTERY_THRESHOLDS.ADEPT;
        let progress = 0;
        let label = "Novice";
        let color = "text-stone-500";
        let benefits = "Base Stats";

        if (level === 0) {
            nextThreshold = MASTERY_THRESHOLDS.ADEPT;
            progress = (count / MASTERY_THRESHOLDS.ADEPT) * 100;
        } else if (level === 1) {
            label = "Adept";
            color = "text-stone-300"; // Silver
            nextThreshold = MASTERY_THRESHOLDS.ARTISAN;
            progress = ((count - MASTERY_THRESHOLDS.ADEPT) / (MASTERY_THRESHOLDS.ARTISAN - MASTERY_THRESHOLDS.ADEPT)) * 100;
            benefits = "Value +10%, Stats +10%";
        } else {
            label = "Artisan";
            color = "text-yellow-400"; // Gold
            nextThreshold = count; // Maxed
            progress = 100;
            benefits = "Value +25%, Stats +20%, Cost -5 Energy";
        }
        
        masteryInfo = { count, level, nextThreshold, progress, label, color, benefits };
    }

    return (
        <div className="relative h-full w-full bg-stone-950 overflow-hidden">
        
        {/* ===========================================================================
            LAYER 0: NO FURNACE OVERLAY
        =========================================================================== */}
        {!hasFurnace && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center">
                 {/* Background Dim */}
                <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md animate-in fade-in duration-700"></div>
                
                {/* Modal */}
                <div className="relative z-10 p-8 max-w-md w-full bg-stone-900 border-2 border-stone-800 rounded-2xl shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-stone-800 rounded-full flex items-center justify-center mb-6 border border-stone-700">
                        <Flame className="w-10 h-10 text-stone-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-stone-300 font-serif mb-2">The Forge is Cold</h2>
                    <p className="text-stone-500 mb-8 leading-relaxed">
                        You cannot smelt ore or forge weapons without a <span className="text-amber-500 font-bold">Furnace</span>. 
                        Visit the market to purchase the necessary equipment to begin your journey.
                    </p>
                    <button 
                        onClick={() => onNavigate('MARKET')}
                        className="w-full py-4 bg-amber-700 hover:bg-amber-600 text-amber-50 font-bold rounded-xl shadow-lg hover:shadow-amber-900/40 transition-all flex items-center justify-center gap-2 group"
                    >
                        Go to Market
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        )}

        {/* ===========================================================================
            LAYER 1: SELECTION UI (Base Layer)
        =========================================================================== */}
        <div className={`absolute inset-0 z-0 flex w-full h-full ${!hasFurnace ? 'blur-sm pointer-events-none' : ''}`}>
            
            {/* --- Left Panel: Preview Area --- */}
            <div className={`h-full relative flex flex-col transition-all duration-500 ease-in-out ${isPanelOpen ? 'w-[60%]' : 'w-full'}`}>
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-stone-925 relative overflow-hidden">
                
                {/* Background Decoration */}
                <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                    <Hammer className="w-96 h-96 text-stone-500" />
                </div>

                {selectedItem ? (
                    <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full max-w-lg">
                    {/* Selected Item Preview */}
                    <div className="relative group">
                        <div className="w-48 h-48 bg-stone-900 rounded-full border-4 border-amber-600 flex items-center justify-center shadow-[0_0_40px_rgba(217,119,6,0.2)] mb-8 group-hover:shadow-[0_0_60px_rgba(217,119,6,0.4)] transition-shadow">
                            <span className="text-8xl filter drop-shadow-lg">{selectedItem.icon}</span>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-amber-500 mb-2 font-serif tracking-wide">{selectedItem.name}</h2>
                    <p className="text-stone-400 text-center max-w-md mb-6 italic">"{selectedItem.description}"</p>

                    {/* Mastery Bar */}
                    {masteryInfo && (
                        <div className="w-full bg-stone-900/50 p-3 rounded-lg border border-stone-800 mb-6">
                            <div className="flex justify-between items-center mb-1 text-xs uppercase font-bold tracking-wider">
                                <span className="text-stone-500 flex items-center gap-1">
                                    <Award className="w-3 h-3" /> Mastery
                                </span>
                                <span className={masteryInfo.color}>{masteryInfo.label}</span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden mb-1.5">
                                <div 
                                    className={`h-full transition-all duration-500 ${masteryInfo.level === 2 ? 'bg-yellow-500' : 'bg-amber-600'}`} 
                                    style={{ width: `${masteryInfo.progress}%` }}
                                ></div>
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-stone-500">
                                    {masteryInfo.level < 2 ? `${masteryInfo.count} / ${masteryInfo.nextThreshold} Crafted` : 'Max Level'}
                                </span>
                                <span className="text-emerald-500">{masteryInfo.benefits}</span>
                            </div>
                        </div>
                    )}

                    {/* Indicators: Fuel & Energy */}
                    <div className="flex items-center gap-3 mb-6">
                        {/* Fuel */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-sm ${
                            hasFuel 
                            ? 'bg-amber-900/20 border-amber-700/50 text-amber-500' 
                            : 'bg-red-900/20 border-red-700/50 text-red-500 animate-pulse'
                        }`}>
                            <Flame className="w-4 h-4" />
                            <span>Fuel: {charcoalCount}</span>
                        </div>
                        {/* Energy */}
                         <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-sm ${
                            hasEnergy 
                            ? 'bg-blue-900/20 border-blue-700/50 text-blue-400' 
                            : 'bg-red-900/20 border-red-700/50 text-red-500 animate-pulse'
                        }`}>
                            <Zap className="w-4 h-4" />
                            <span>Energy: -{requiredEnergy}</span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={startCrafting}
                        disabled={!canCraft}
                        className={`px-12 py-4 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-3 border ${
                            canCraft 
                            ? 'bg-amber-700 hover:bg-amber-600 text-amber-50 border-amber-500 hover:shadow-amber-900/50' 
                            : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed opacity-70'
                        }`}
                    >
                        {!hasFuel ? (
                            <>
                                <Flame className="w-6 h-6 text-red-500" />
                                Need Charcoal
                            </>
                        ) : !hasEnergy ? (
                             <>
                                <Zap className="w-6 h-6 text-red-500" />
                                Need Energy
                            </>
                        ) : !canAffordResources(selectedItem) ? (
                            <>
                                <Lock className="w-6 h-6" />
                                Missing Resources
                            </>
                        ) : (
                            <>
                                <Hammer className="w-6 h-6" />
                                Start Forging
                            </>
                        )}
                    </button>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="z-10 flex flex-col items-center text-stone-600">
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-stone-700 flex items-center justify-center mb-4">
                        <Hammer className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-stone-500">The Anvil is Cold</h3>
                    <p className="text-sm mt-2">Select a recipe from the right to begin.</p>
                    </div>
                )}
            </div>
            </div>

            {/* --- Right Panel: Recipe Selector --- */}
            <div 
            className={`h-full bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col transition-all duration-500 ease-in-out relative ${
                isPanelOpen ? 'w-[40%] translate-x-0' : 'w-0 translate-x-full border-none'
            }`}
            >
            {/* Toggle Button */}
            <button
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                disabled={isCrafting}
                className={`absolute top-1/2 -left-6 w-6 h-24 -translate-y-1/2 bg-stone-800 border-y border-l border-stone-600 rounded-l-lg flex items-center justify-center hover:bg-stone-700 hover:text-amber-400 transition-colors z-20 ${
                    isCrafting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                } ${!isPanelOpen ? '-left-8 w-8' : ''}`} 
            >
                {isCrafting ? (
                    <Lock className="w-4 h-4 text-stone-500" />
                ) : isPanelOpen ? (
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                ) : (
                    <ChevronLeft className="w-4 h-4 text-amber-500 animate-pulse" />
                )}
            </button>

            {/* Inner Container */}
            <div className="w-screen md:w-full min-w-[300px] h-full flex flex-col">
                {/* Top Tabs */}
                <div className="flex border-b border-stone-800 shrink-0">
                <button 
                    onClick={() => handleCategoryChange('WEAPON')}
                    className={`flex-1 py-4 text-center font-bold tracking-wider transition-colors flex items-center justify-center gap-2 ${
                    activeCategory === 'WEAPON' ? 'bg-stone-800 text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
                    }`}
                >
                    <Sword className="w-4 h-4" /> WEAPONS
                </button>
                <button 
                    onClick={() => handleCategoryChange('ARMOR')}
                    className={`flex-1 py-4 text-center font-bold tracking-wider transition-colors flex items-center justify-center gap-2 ${
                    activeCategory === 'ARMOR' ? 'bg-stone-800 text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
                    }`}
                >
                    <Shield className="w-4 h-4" /> ARMOR
                </button>
                </div>

                {/* Content List - Accordion */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {/* === SPECIAL GROUP: FAVORITES === */}
                    {favoriteItems.length > 0 && (
                        <div className="border border-amber-800/50 rounded-lg overflow-hidden mb-4 shadow-lg shadow-amber-900/10">
                            <button 
                                onClick={() => toggleSubCategory('FAVORITES')}
                                className="w-full bg-gradient-to-r from-stone-800 to-stone-900 p-3 flex items-center justify-between hover:bg-stone-750 transition-colors border-l-4 border-amber-500"
                            >
                                <div className="flex items-center gap-2">
                                    {expandedSubCat === 'FAVORITES' ? <ChevronDown className="w-4 h-4 text-amber-500" /> : <ChevronRight className="w-4 h-4 text-stone-500" />}
                                    <span className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                        FAVORITES
                                    </span>
                                </div>
                                <span className="text-xs bg-amber-900/30 text-amber-500 border border-amber-800/50 px-2 py-0.5 rounded font-mono">
                                    {favoriteItems.length}
                                </span>
                            </button>
                            {expandedSubCat === 'FAVORITES' && (
                                <div className="bg-stone-900/50 p-2 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
                                    {favoriteItems.map(item => renderItemCard(item))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* === STANDARD GROUPS === */}
                    {visibleSubCats.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-600 italic opacity-50">
                            <Lock className="w-8 h-8 mb-2" />
                            <p>No recipes available for this tier.</p>
                        </div>
                    ) : (
                        visibleSubCats.map(subCat => {
                            const isExpanded = expandedSubCat === subCat.id;
                            const items = groupedItems[subCat.id] || [];

                            return (
                                <div key={subCat.id} className="border border-stone-800 rounded-lg overflow-hidden">
                                    {/* Accordion Header */}
                                    <button 
                                        onClick={() => toggleSubCategory(subCat.id)}
                                        className="w-full bg-stone-800 p-3 flex items-center justify-between hover:bg-stone-750 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {isExpanded ? <ChevronDown className="w-4 h-4 text-amber-500" /> : <ChevronRight className="w-4 h-4 text-stone-500" />}
                                            <span className={`font-bold text-sm ${isExpanded ? 'text-amber-100' : 'text-stone-400'}`}>{subCat.name}</span>
                                        </div>
                                        <span className="text-xs bg-stone-900 px-2 py-0.5 rounded text-stone-500 font-mono">{items.length}</span>
                                    </button>

                                    {/* Accordion Content */}
                                    {isExpanded && (
                                        <div className="bg-stone-900/50 p-2 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
                                            {items.map(item => renderItemCard(item))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-800 bg-stone-900 shrink-0">
                <div className="flex items-start gap-2 text-xs text-stone-500">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>Select a recipe to view requirements. Ensure you have enough <span className="text-amber-500 font-bold">Charcoal</span> and <span className="text-blue-400 font-bold">Energy</span>.</p>
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* ===========================================================================
            LAYER 2: CRAFTING OVERLAY
        =========================================================================== */}
        {isCrafting && selectedItem && (
            <div className="absolute inset-0 z-50 animate-in fade-in zoom-in-95 duration-300 bg-stone-950">
            <SmithingMinigame 
                difficulty={selectedItem.tier}
                onComplete={handleMinigameComplete}
                onClose={stopCrafting}
                />
            </div>
        )}

        {/* ===========================================================================
            TOOLTIP
        =========================================================================== */}
        {hoveredItem && (
            <div 
                className="fixed z-[60] pointer-events-none w-64 bg-stone-950/95 border border-stone-700 rounded-lg shadow-2xl backdrop-blur-sm p-4 animate-in fade-in duration-150"
                style={{ top: tooltipPos.y + 10, left: tooltipPos.x - 270 }} 
            >
                <h4 className="font-bold text-stone-200 border-b border-stone-800 pb-2 mb-2 flex justify-between">
                    Requirements
                    <span className="text-xs font-normal text-stone-500 mt-0.5">Tier {hoveredItem.tier}</span>
                </h4>
                <div className="space-y-2">
                    {/* Charcoal Requirement Visualization */}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-stone-400 flex items-center gap-1"><Flame className="w-3 h-3 text-amber-500" /> Charcoal (Fuel)</span>
                        <div className={`flex items-center gap-1 font-mono ${hasFuel ? 'text-emerald-400' : 'text-red-400'}`}>
                            <span>1</span>
                            {hasFuel ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                        </div>
                    </div>

                    {hoveredItem.requirements.map((req, idx) => {
                        const currentCount = getInventoryCount(req.id);
                        const hasEnough = currentCount >= req.count;
                        return (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-stone-400">{getResourceName(req.id)}</span>
                                <div className={`flex items-center gap-1 font-mono ${hasEnough ? 'text-emerald-400' : 'text-red-400'}`}>
                                    <span>{currentCount}/{req.count}</span>
                                    {hasEnough ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        </div>
    );
  }, [
      activeCategory, selectedItem, isPanelOpen, isCrafting, hoveredItem, tooltipPos, inventory, hasFurnace, charcoalCount, hasFuel, hasEnergy, requiredEnergy, stats.tierLevel, expandedSubCat, favorites, favoriteItems, craftingMastery,
      handleCategoryChange, startCrafting, stopCrafting, handleMinigameComplete, toggleSubCategory, toggleFavorite,
      handleMouseEnter, handleMouseMove, handleMouseLeave, canAffordResources, getInventoryCount, onNavigate, groupedItems, visibleSubCats
  ]);

  return content;
};

export default ForgeTab;
