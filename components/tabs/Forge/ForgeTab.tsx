import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { EQUIPMENT_SUBCATEGORIES, EQUIPMENT_ITEMS } from '../../../data/equipment';
import { EquipmentCategory, EquipmentItem } from '../../../types/index';
import SmithingMinigame from './SmithingMinigame';
import WorkbenchMinigame from './WorkbenchMinigame';
import { Hammer, Shield, Sword, ChevronRight, Info, ChevronLeft, Lock, Check, X as XIcon, Box, Flame, ChevronDown, Heart, Star, Zap, Award, Wrench, X, ShoppingCart, Brain } from 'lucide-react';
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
    // Fallback logic for items without specific image filenames
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
                {
                    label: "Visit Market (500 G)",
                    action: () => onNavigate('MARKET')
                },
                {
                    label: "I'll look around first",
                    action: () => {}
                }
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
          // Locked recipes check
          if (item.id === 'sword_bronze_long_t1') {
              const isUnlocked = unlockedRecipes?.includes(item.id);
              if (!isUnlocked) return false;
          }
          
          if (item.tier > stats.tierLevel) return false;
          const subCatDef = EQUIPMENT_SUBCATEGORIES.find(sc => sc.id === item.subCategoryId);
          return subCatDef?.categoryId === activeCategory;
      });
  }, [activeCategory, stats.tierLevel, unlockedRecipes]);

  const favoriteItems = useMemo(() => {
      return visibleItems.filter(item => favorites.includes(item.id));
  }, [visibleItems, favorites]);

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
      if (favoriteItems.length > 0) {
          setExpandedSubCat('FAVORITES');
      } else if (visibleSubCats.length > 0) {
          setExpandedSubCat(visibleSubCats[0].id);
      } else {
          setExpandedSubCat(null);
      }
  }, [activeCategory, visibleSubCats, favoriteItems.length]);

  const handleCategoryChange = useCallback((cat: EquipmentCategory) => {
    setActiveCategory(cat);
    setSelectedItem(null);   
  }, []);

  const toggleSubCategory = useCallback((subCatId: string) => {
      setExpandedSubCat(prev => (prev === subCatId ? null : subCatId));
  }, []);

  const toggleFavorite = useCallback((e: React.MouseEvent, itemId: string) => {
      e.stopPropagation(); 
      setFavorites(prev => 
          prev.includes(itemId)
              ? prev.filter(id => id !== itemId)
              : [...prev, itemId]
      );
  }, []);

  const startCrafting = useCallback(() => {
      if (!selectedItem) return;
      actions.startCrafting(selectedItem);
      setIsPanelOpen(false); 
  }, [actions, selectedItem]);

  const cancelCrafting = useCallback(() => {
      if (selectedItem) {
          actions.cancelCrafting(selectedItem);
      } else {
          actions.setCrafting(false); 
      }
      setIsPanelOpen(true);
  }, [actions, selectedItem]);

  const handleMinigameComplete = useCallback((score: number, bonus?: number) => {
    if (selectedItem) {
        actions.finishCrafting(selectedItem, score, bonus);
    }
    setIsPanelOpen(true);
  }, [selectedItem, actions]);
  
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

  const getMasteryLevel = (count: number) => {
      if (count >= MASTERY_THRESHOLDS.ARTISAN) return 2;
      if (count >= MASTERY_THRESHOLDS.ADEPT) return 1;
      return 0;
  };

  const getMasteryIcon = (level: number) => {
      if (level === 2) return <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />;
      if (level === 1) return <Star className="w-3 h-3 text-stone-300 fill-stone-300" />;
      return <Star className="w-3 h-3 text-amber-700/50" />;
  };

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
            <div className="w-full flex justify-between items-start p-2 z-10">
                 <span className={`text-[10px] font-bold tracking-wider font-mono ${isSelected ? 'text-amber-400' : 'text-stone-600'}`}>
                    TIER {item.tier}
                </span>

                <div className="flex items-center gap-1 -mt-1 -mr-1">
                    {masteryCount > 0 && (
                        <div className="p-1" title={`Mastery Level ${masteryLevel} (${masteryCount})`}>
                            {getMasteryIcon(masteryLevel)}
                        </div>
                    )}
                    <button 
                        onClick={(e) => toggleFavorite(e, item.id)}
                        className="p-1 rounded-full hover:bg-stone-700 transition-colors"
                    >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-stone-600 hover:text-stone-400'}`} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center group-hover:scale-110 transition-transform -mt-2">
                <img 
                    src={getItemImageUrl(item)} 
                    className="w-10 h-10 object-contain drop-shadow-md" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} 
                />
                <span className="hidden text-3xl">{item.icon}</span>
            </div>
            
            <div className="w-full text-center pb-2 px-1 flex flex-col items-center gap-1">
                <div className={`text-xs font-bold leading-tight truncate w-full ${isSelected ? 'text-amber-200' : 'text-stone-300'}`}>
                    {item.name}
                </div>
                
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

  const isRequirementMet = useMemo(() => {
      if (!selectedItem) return true;
      if (selectedItem.craftingType === 'FORGE') return hasFurnace;
      if (selectedItem.craftingType === 'WORKBENCH') return hasWorkbench;
      return true;
  }, [selectedItem, hasFurnace, hasWorkbench]);

  const content = useMemo(() => {
    const canCraft = selectedItem && canAffordResources(selectedItem) && canEnterForge && hasEnergy && isRequirementMet;
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
            color = "text-stone-300";
            nextThreshold = MASTERY_THRESHOLDS.ARTISAN;
            progress = ((count - MASTERY_THRESHOLDS.ADEPT) / (MASTERY_THRESHOLDS.ARTISAN - MASTERY_THRESHOLDS.ADEPT)) * 100;
            benefits = "Value +10%, Stats +10%";
        } else {
            label = "Artisan";
            color = "text-yellow-400";
            nextThreshold = count;
            progress = 100;
            benefits = "Value +25%, Stats +20%, Cost -5 Energy";
        }
        masteryInfo = { count, level, nextThreshold, progress, label, color, benefits };
    }

    return (
        <div 
            className="relative h-full w-full bg-stone-950 overflow-hidden"
            style={{ 
                backgroundImage: `url(${getAssetUrl('tile_forge.png')})`,
                backgroundRepeat: 'repeat',
                backgroundBlendMode: 'multiply'
            }}
        >
        
        {selectedItem && !isRequirementMet && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center">
                <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md animate-in fade-in duration-700"></div>
                <div className="relative z-10 p-8 max-w-md w-full bg-stone-900 border-2 border-stone-800 rounded-2xl shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                    <button 
                        onClick={() => setSelectedItem(null)}
                        className="absolute top-4 right-4 p-2 text-stone-500 hover:text-stone-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-20 h-20 bg-stone-800 rounded-full flex items-center justify-center mb-6 border border-stone-700">
                        {selectedItem.craftingType === 'FORGE' ? <Flame className="w-10 h-10 text-stone-600" /> : <Wrench className="w-10 h-10 text-stone-600" />}
                    </div>
                    <h2 className="text-2xl font-bold text-stone-300 font-serif mb-2">
                        {selectedItem.craftingType === 'FORGE' ? 'Furnace Required' : 'Workbench Required'}
                    </h2>
                    <p className="text-stone-500 mb-8 leading-relaxed">
                        Crafting <span className="text-amber-500 font-bold">{selectedItem.name}</span> requires a functional {selectedItem.craftingType === 'FORGE' ? 'furnace' : 'workbench'}. 
                        Visit the market to purchase one.
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

        <div className={`absolute inset-0 z-0 flex w-full h-full ${((selectedItem && !isRequirementMet) || !hasFurnace) ? 'blur-sm pointer-events-none' : ''}`}>
            
            <div className={`h-full relative flex flex-col transition-all duration-500 ease-in-out ${isPanelOpen ? 'w-[60%]' : 'w-full'}`}>
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-stone-925/40 relative overflow-hidden">
                
                <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                    {selectedItem?.craftingType === 'FORGE' ? (
                        <Hammer className="w-96 h-96 text-stone-500" />
                    ) : (
                        <Wrench className="w-96 h-96 text-stone-500" />
                    )}
                </div>

                {selectedItem ? (
                    <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full max-w-lg">
                    <div className="relative group">
                        <div className={`w-48 h-48 bg-stone-900 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
                            selectedItem.craftingType === 'FORGE' 
                            ? 'border-amber-600 shadow-[0_0_40px_rgba(217,119,6,0.2)]' 
                            : 'border-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.2)]'
                        } mb-8 group-hover:scale-105`}>
                            <img 
                                src={getItemImageUrl(selectedItem)} 
                                className="w-32 h-32 object-contain drop-shadow-xl z-10" 
                                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} 
                            />
                            <span className="hidden text-8xl filter drop-shadow-lg">{selectedItem.icon}</span>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-amber-500 mb-2 font-serif tracking-wide">{selectedItem.name}</h2>
                    <p className="text-stone-400 text-center max-w-md mb-4 italic">"{selectedItem.description}"</p>

                    {/* Base Stats Section Added */}
                    <div className="w-full grid grid-cols-4 gap-2 mb-6">
                        <div className="bg-stone-900/80 border border-stone-800 p-2 rounded-lg flex flex-col items-center">
                            <span className="text-[8px] text-stone-500 font-bold uppercase flex items-center gap-1 mb-1"><Sword className="w-2 h-2"/> P.Atk</span>
                            <span className="text-xs font-mono font-bold text-stone-300">{selectedItem.baseStats?.physicalAttack || 0}</span>
                        </div>
                        <div className="bg-stone-900/80 border border-stone-800 p-2 rounded-lg flex flex-col items-center">
                            <span className="text-[8px] text-stone-500 font-bold uppercase flex items-center gap-1 mb-1"><Shield className="w-2 h-2"/> P.Def</span>
                            <span className="text-xs font-mono font-bold text-stone-300">{selectedItem.baseStats?.physicalDefense || 0}</span>
                        </div>
                        <div className="bg-stone-900/80 border border-stone-800 p-2 rounded-lg flex flex-col items-center">
                            <span className="text-[8px] text-stone-500 font-bold uppercase flex items-center gap-1 mb-1"><Zap className="w-2 h-2"/> M.Atk</span>
                            <span className="text-xs font-mono font-bold text-stone-300">{selectedItem.baseStats?.magicalAttack || 0}</span>
                        </div>
                        <div className="bg-stone-900/80 border border-stone-800 p-2 rounded-lg flex flex-col items-center">
                            <span className="text-[8px] text-stone-500 font-bold uppercase flex items-center gap-1 mb-1"><Brain className="w-2 h-2"/> M.Def</span>
                            <span className="text-xs font-mono font-bold text-stone-300">{selectedItem.baseStats?.magicalDefense || 0}</span>
                        </div>
                    </div>

                    {masteryInfo && (
                        <div className="w-full bg-stone-900/50 p-3 rounded-lg border border-stone-800 mb-6 backdrop-blur-sm">
                            <div className="flex justify-between items-center mb-1 text-xs uppercase font-bold tracking-wider">
                                <span className="text-stone-500 flex items-center gap-1">
                                    <Award className="w-3 h-3" /> Mastery
                                </span>
                                <span className={masteryInfo.color}>{masteryInfo.label}</span>
                            </div>
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

                    <div className="flex items-center gap-3 mb-6">
                         <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-sm backdrop-blur-sm ${
                            hasEnergy 
                            ? 'bg-blue-900/40 border-blue-700/50 text-blue-400' 
                            : 'bg-red-900/40 border-red-700/50 text-red-500 animate-pulse'
                        }`}>
                            <Zap className="w-4 h-4" />
                            <span>Energy: -{requiredEnergy}</span>
                        </div>
                    </div>

                    <button 
                        onClick={startCrafting}
                        disabled={!canCraft}
                        className={`px-12 py-4 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-3 border ${
                            canCraft 
                            ? selectedItem.craftingType === 'FORGE'
                                ? 'bg-amber-700 hover:bg-amber-600 text-amber-50 border-amber-500 hover:shadow-amber-900/50'
                                : 'bg-emerald-700 hover:bg-emerald-600 text-emerald-50 border-emerald-500 hover:shadow-emerald-900/50'
                            : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed opacity-70'
                        }`}
                    >
                        {!isRequirementMet ? (
                            <>
                                <Lock className="w-6 h-6" />
                                Facility Required
                            </>
                        ) : !canEnterForge ? (
                            <>
                                <Flame className="w-6 h-6 text-red-500" />
                                Need Heat or Fuel
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
                                {selectedItem.craftingType === 'FORGE' ? <Hammer className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
                                {selectedItem.craftingType === 'FORGE' ? 'Start Forging' : 'Start Crafting'}
                            </>
                        )}
                    </button>
                    </div>
                ) : (
                    <div className="z-10 flex flex-col items-center text-stone-600">
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-stone-700 flex items-center justify-center mb-4">
                        <Hammer className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-stone-500 drop-shadow-md">The Anvil is Cold</h3>
                    <p className="text-sm mt-2 font-medium">Select a recipe from the right to begin.</p>
                    </div>
                )}
            </div>
            </div>

            <div 
            className={`h-full bg-stone-900/95 border-l border-stone-800 shadow-2xl flex flex-col transition-all duration-500 ease-in-out relative backdrop-blur-sm ${
                isPanelOpen ? 'w-[40%] translate-x-0' : 'w-0 translate-x-full border-none'
            }`}
            >
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

            <div className="w-screen md:w-full min-w-[300px] h-full flex flex-col">
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

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
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

                <div className="p-4 border-t border-stone-800 bg-stone-900 shrink-0">
                <div className="flex items-start gap-2 text-xs text-stone-500">
                    <div className="flex items-center gap-1 font-bold text-amber-600 uppercase tracking-tighter">
                         <Info className="w-3.5 h-3.5" /> Potential
                    </div>
                    <p>Stats shown are base values. Higher quality crafts will multiply these results.</p>
                </div>
                </div>
            </div>
            </div>
        </div>

        {isCrafting && selectedItem && (
            <div className="absolute inset-0 z-50 animate-in fade-in zoom-in-95 duration-300 bg-stone-950">
                {selectedItem.craftingType === 'FORGE' ? (
                    <SmithingMinigame 
                        difficulty={selectedItem.tier}
                        onComplete={handleMinigameComplete}
                        onClose={cancelCrafting}
                    />
                ) : (
                    <WorkbenchMinigame 
                        difficulty={selectedItem.tier}
                        onComplete={handleMinigameComplete}
                        onClose={cancelCrafting}
                    />
                )}
            </div>
        )}

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
      activeCategory, selectedItem, isPanelOpen, isCrafting, hoveredItem, tooltipPos, inventory, hasFurnace, hasWorkbench, canEnterForge, hasHeat, charcoalCount, hasEnergy, requiredEnergy, stats.tierLevel, expandedSubCat, favorites, favoriteItems, craftingMastery, isRequirementMet,
      handleCategoryChange, startCrafting, cancelCrafting, handleMinigameComplete, toggleSubCategory, toggleFavorite,
      handleMouseEnter, handleMouseMove, handleMouseLeave, canAffordResources, getInventoryCount, onNavigate, groupedItems, visibleSubCats, hasPromptedFurnace, activeEvent, unlockedRecipes
  ]);

  return content;
};

export default ForgeTab;