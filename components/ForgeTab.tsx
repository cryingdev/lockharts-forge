
import React, { useState, useEffect } from 'react';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_SUBCATEGORIES, EQUIPMENT_ITEMS } from '../gameData';
import { EquipmentCategory, EquipmentItem } from '../types';
import SmithingMinigame from './SmithingMinigame';
import { Hammer, Shield, Sword, ChevronDown, ChevronRight, Info, ChevronLeft, Lock } from 'lucide-react';

const ForgeTab = () => {
  // UI State
  const [activeCategory, setActiveCategory] = useState<EquipmentCategory>('WEAPON');
  const [expandedSubCat, setExpandedSubCat] = useState<string | null>('SWORD');
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  // Game Logic State
  const [isCrafting, setIsCrafting] = useState(false);

  // Handlers
  const handleCategoryChange = (cat: EquipmentCategory) => {
    setActiveCategory(cat);
    setExpandedSubCat(null); // Close subcats on switch
    setSelectedItem(null);   // Deselect item
  };

  const toggleSubCategory = (subCatId: string) => {
    setExpandedSubCat(expandedSubCat === subCatId ? null : subCatId);
  };

  const startCrafting = () => {
      setIsCrafting(true);
      setIsPanelOpen(false); // Auto collapse logic for background effect
  };

  const stopCrafting = () => {
      setIsCrafting(false);
      setIsPanelOpen(true); // Auto restore logic
  };

  const handleMinigameComplete = (score: number) => {
    console.log(`Crafted ${selectedItem?.name} with score: ${score}`);
    stopCrafting();
    // Future: Add item to inventory here via Context
  };

  // Filter Data
  const currentSubCategories = EQUIPMENT_SUBCATEGORIES.filter(sc => sc.categoryId === activeCategory);

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
                    className="px-12 py-4 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg font-bold text-lg shadow-lg hover:shadow-amber-900/50 transition-all transform hover:-translate-y-1 flex items-center gap-3 border border-amber-500"
                  >
                    <Hammer className="w-6 h-6" />
                    Start Forging
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
                          return (
                              <button
                              key={item.id}
                              onClick={() => setSelectedItem(item)}
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

    </div>
  );
};

export default ForgeTab;
