
import React, { useState, useCallback, useMemo } from 'react';
import { EQUIPMENT_SUBCATEGORIES, EQUIPMENT_ITEMS } from '../gameData';
import { EquipmentCategory, EquipmentItem } from '../types';
import SmithingMinigame from './SmithingMinigame';
import { Hammer, Shield, Sword, ChevronDown, ChevronRight, Info, ChevronLeft, Lock, Check, X as XIcon, Box } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ITEMS } from '../constants';

const ForgeTab = () => {
  const { state, actions } = useGame();
  
  // Destructure only what we need for this component to minimize re-render impact
  // We don't care about shopQueue, activeCustomer, etc.
  const { inventory } = state;

  // UI State
  const [activeCategory, setActiveCategory] = useState<EquipmentCategory>('WEAPON');
  const [expandedSubCat, setExpandedSubCat] = useState<string | null>('SWORD');
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  // Tooltip State
  const [hoveredItem, setHoveredItem] = useState<EquipmentItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  // Game Logic State
  const [isCrafting, setIsCrafting] = useState(false);

  // Handlers - Memoized to prevent prop changes in children
  const handleCategoryChange = useCallback((cat: EquipmentCategory) => {
    setActiveCategory(cat);
    setExpandedSubCat(null); // Close subcats on switch
    setSelectedItem(null);   // Deselect item
  }, []);

  const toggleSubCategory = useCallback((subCatId: string) => {
    setExpandedSubCat(prev => prev === subCatId ? null : subCatId);
  }, []);

  const startCrafting = useCallback(() => {
      setIsCrafting(true);
      setIsPanelOpen(false); // Auto collapse logic for background effect
  }, []);

  const stopCrafting = useCallback(() => {
      setIsCrafting(false);
      setIsPanelOpen(true); // Auto restore logic
  }, []);

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

  // Helper to check resources
  const getInventoryCount = useCallback((id: string) => {
      return inventory.find(i => i.id === id)?.quantity || 0;
  }, [inventory]);

  const getResourceName = (id: string) => {
      const itemDef = Object.values(ITEMS).find(i => i.id === id);
      return itemDef ? itemDef.name : id;
  };

  const canAfford = useCallback((item: EquipmentItem) => {
      return item.requirements.every(req => getInventoryCount(req.id) >= req.count);
  }, [getInventoryCount]);

  // Filter Data
  const currentSubCategories = useMemo(() => 
    EQUIPMENT_SUBCATEGORIES.filter(sc => sc.categoryId === activeCategory), 
  [activeCategory]);

  // Wrap the entire visual output in useMemo so that unrelated state changes (Shop queue, etc) 
  // do not cause the DOM to diff/repaint/flicker.
  const content = useMemo(() => {
    return (
        <div className="relative h-full w-full bg-stone-950 overflow-hidden">
        
        {/* ===========================================================================
            LAYER 1: SELECTION UI (Base Layer)
            - Contains the Left Panel (Preview) and Right Panel (Menu).
            - Remains in DOM but covered by Overlay when crafting.
        =========================================================================== */}
        <div className="absolute inset-0 z-0 flex w-full h-full">
            
            {/* --- Left Panel: Preview Area --- */}
            <div className={`h-full relative flex flex-col transition-all duration-500 ease-in-out ${isPanelOpen ? 'w-[60%]' : 'w-full'}`}>
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-stone-925 relative overflow-hidden">
                
                {/* Background Decoration */}
                <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                    <Hammer className="w-96 h-96 text-stone-500" />
                </div>

                {selectedItem ? (
                    <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    {/* Selected Item Preview */}
                    <div className="relative group">
                        <div className="w-48 h-48 bg-stone-900 rounded-full border-4 border-amber-600 flex items-center justify-center shadow-[0_0_40px_rgba(217,119,6,0.2)] mb-8 group-hover:shadow-[0_0_60px_rgba(217,119,6,0.4)] transition-shadow">
                            <span className="text-8xl filter drop-shadow-lg">{selectedItem.icon}</span>
                        </div>
                        {/* Tier Badge */}
                        <div className="absolute -bottom-2 right-4 bg-stone-800 text-stone-300 px-3 py-1 rounded-full text-xs font-bold border border-stone-600">
                            TIER {selectedItem.tier}
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-amber-500 mb-2 font-serif tracking-wide">{selectedItem.name}</h2>
                    <p className="text-stone-400 text-center max-w-md mb-8 italic">"{selectedItem.description}"</p>

                    {/* Action Button */}
                    <button 
                        onClick={startCrafting}
                        disabled={!canAfford(selectedItem)}
                        className={`px-12 py-4 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-3 border ${
                            canAfford(selectedItem) 
                            ? 'bg-amber-700 hover:bg-amber-600 text-amber-50 border-amber-500 hover:shadow-amber-900/50' 
                            : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed opacity-70'
                        }`}
                    >
                        {canAfford(selectedItem) ? (
                            <>
                                <Hammer className="w-6 h-6" />
                                Start Forging
                            </>
                        ) : (
                            <>
                                <Lock className="w-6 h-6" />
                                Missing Resources
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
            {/* Toggle Button attached to the left side of the right panel */}
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

            {/* Inner Container to prevent content squishing during transition */}
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

                {/* Content List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {currentSubCategories.map(subCat => {
                    const isOpen = expandedSubCat === subCat.id;
                    const items = EQUIPMENT_ITEMS.filter(i => i.subCategoryId === subCat.id);

                    return (
                    <div key={subCat.id} className="bg-stone-800/50 rounded-lg overflow-hidden border border-stone-700/50">
                        {/* Accordion Header */}
                        <button 
                        onClick={() => toggleSubCategory(subCat.id)}
                        className={`w-full flex items-center justify-between p-4 transition-colors ${isOpen ? 'bg-stone-800 text-amber-100' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'}`}
                        >
                        <span className="font-bold">{subCat.name}</span>
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        {/* Item Grid */}
                        {isOpen && (
                        <div className="p-3 bg-stone-900/50 border-t border-stone-700/50 grid grid-cols-2 gap-3">
                            {items.map(item => {
                            const isSelected = selectedItem?.id === item.id;
                            // For inventory count
                            const count = inventory.filter(i => i.name === item.name).length;
                            
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    onMouseEnter={(e) => handleMouseEnter(item, e)}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                    className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all group text-left ${
                                        isSelected 
                                        ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                                        : 'bg-stone-800 border-stone-700 hover:border-stone-500 hover:bg-stone-750'
                                    }`}
                                >
                                {/* Icon */}
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
                                
                                {/* Name */}
                                <div className={`text-xs font-bold mb-1 line-clamp-1 w-full text-center ${isSelected ? 'text-amber-200' : 'text-stone-300'}`}>
                                    {item.name}
                                </div>

                                {/* Info Badge (Tier) */}
                                <div className="absolute top-1 right-1">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border ${isSelected ? 'bg-amber-600 text-white border-amber-400' : 'bg-stone-700 text-stone-400 border-stone-600'}`}>
                                    {item.tier}
                                    </div>
                                </div>
                                
                                {/* Owned Count */}
                                {count > 0 && (
                                    <div className="absolute top-1 left-1 bg-stone-950/80 px-1.5 rounded border border-stone-700 text-[9px] font-mono text-stone-400 flex items-center gap-0.5">
                                        <Box className="w-2 h-2" /> {count}
                                    </div>
                                )}
                                </button>
                            );
                            })}
                            {items.length === 0 && (
                            <div className="col-span-2 text-center py-4 text-xs text-stone-600 italic">
                                No recipes available yet.
                            </div>
                            )}
                        </div>
                        )}
                    </div>
                    );
                })}
                </div>

                {/* Footer (Stats or Requirements Placeholder) */}
                <div className="p-4 border-t border-stone-800 bg-stone-900 shrink-0">
                <div className="flex items-start gap-2 text-xs text-stone-500">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>Select a recipe to view requirements and begin forging. Higher tier items are harder to craft.</p>
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* ===========================================================================
            LAYER 2: CRAFTING OVERLAY (Absolute Top)
            - Contains the Minigame.
            - Covers everything else when active.
            - Prevents layout shift jank since it's full screen.
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
            TOOLTIP (Fixed Position)
        =========================================================================== */}
        {hoveredItem && (
            <div 
                className="fixed z-[60] pointer-events-none w-64 bg-stone-950/95 border border-stone-700 rounded-lg shadow-2xl backdrop-blur-sm p-4 animate-in fade-in duration-150"
                style={{ top: tooltipPos.y + 10, left: tooltipPos.x - 270 }} // Position to the left of cursor
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
      activeCategory, expandedSubCat, selectedItem, isPanelOpen, isCrafting, hoveredItem, tooltipPos, inventory,
      handleCategoryChange, toggleSubCategory, startCrafting, stopCrafting, handleMinigameComplete, 
      handleMouseEnter, handleMouseMove, handleMouseLeave, canAfford, currentSubCategories, getInventoryCount
  ]);

  return content;
};

export default ForgeTab;
