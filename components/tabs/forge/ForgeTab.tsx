import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Hammer, Activity, Library, ArrowLeft, Home, Book, X, Package } from 'lucide-react';
import { useForge } from './hooks/useForge';
import { getAssetUrl } from '../../../utils';
import { SfxButton } from '../../common/ui/SfxButton';

// Sub-components
import ForgeSkillHeader from './ui/ForgeSkillHeader';
import { ForgeListView } from './ui/ForgeListView';
import { ForgeWorkspaceView } from './ui/ForgeWorkspaceView';
import QuickCraftOverlay from './ui/QuickCraftOverlay';
import RecipeTooltip from './ui/RecipeTooltip';
import SmithingMinigame from './ui/SmithingMinigame';
import WorkbenchMinigame from './ui/WorkbenchMinigame';
import { UI_MODAL_LAYOUT } from '../../../config/ui-config';

interface ForgeTabProps {
    onNavigate: (tab: any) => void;
    onOpenInventory: () => void;
}

const ForgeTab: React.FC<ForgeTabProps> = ({ onNavigate, onOpenInventory }) => {
  const forge = useForge(onNavigate);
  const { 
    state, handlers, actions, isCrafting, selectedItem, isPanelOpen, 
    activeCategory, expandedSubCat, favoriteItems, isFavExpanded, visibleSubCats, 
    groupedItems, hoveredItem, tooltipPos, quickCraftProgress, masteryInfo, 
    isFuelShortage, isQuickFuelShortage, smithingLevel, workbenchLevel 
  } = forge;

  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getExtraFuelCost = (tier: number) => {
    if (tier === 1) return 3;
    if (tier === 2) return 5;
    return 8;
  };

  const bgUrl = getAssetUrl('forge_start_bg.jpeg', 'tutorial');

  return (
    <div className="fixed inset-0 z-[50] bg-stone-950 overflow-hidden flex flex-col px-safe">
        
        {/* Immersive Background Layer */}
        <div className="absolute inset-0 z-0">
            <img 
                src={bgUrl} 
                className="w-full h-full object-cover transition-all duration-700 scale-105"
                alt="Forge Interior"
            />
            {/* Subtle overlay for UI readability */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
        </div>

        {isCrafting && selectedItem && (
            <div className="absolute inset-0 z-[100] bg-stone-950">
                {selectedItem.craftingType === 'FORGE' ? (
                    <SmithingMinigame 
                        onComplete={handlers.handleMinigameComplete}
                        onClose={() => actions.cancelCrafting(selectedItem)}
                        difficulty={selectedItem.tier}
                        isTutorial={state.activeTutorialScene === 'SMITHING'}
                    />
                ) : (
                    <WorkbenchMinigame 
                        onComplete={handlers.handleMinigameComplete}
                        onClose={() => actions.cancelCrafting(selectedItem)}
                        difficulty={selectedItem.tier}
                        masteryCount={masteryInfo?.count || 0}
                        subCategoryId={selectedItem.subCategoryId}
                        itemImage={selectedItem.image}
                    />
                )}
            </div>
        )}

        {quickCraftProgress !== null && selectedItem && (
            <QuickCraftOverlay 
                progress={quickCraftProgress} 
                extraFuel={getExtraFuelCost(selectedItem.tier)}
            />
        )}

        {/* Navigation - Return to Forge Ground */}
        {!isCrafting && (
            <SfxButton 
                sfx="switch" 
                onClick={() => onNavigate('MAIN')} 
                className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 bg-stone-900/80 hover:bg-red-900/60 text-stone-300 rounded-xl border border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-90 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest">Back</span>
            </SfxButton>
        )}

        {/* Paging Button - To Shop (좌측 중앙 배치) */}
        {!isCrafting && !state.tutorialStep && (
            <SfxButton 
                sfx="switch" 
                onClick={() => onNavigate('SHOP')} 
                className="absolute left-0 top-1/2 -translate-y-1/2 z-[1050] w-8 h-24 bg-stone-900/60 hover:bg-amber-600/40 text-amber-500 rounded-r-2xl border-y border-r border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-95 group flex items-center justify-center"
            >
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </SfxButton>
        )}

        {/* Global Skill/Research UI - Moved to Top-Right and Always Expanded */}
        {!isCrafting && (
            <div className="absolute top-4 right-4 z-20 pointer-events-auto flex flex-col items-end gap-2 transition-all">
                <div className="flex flex-col gap-2">
                    <ForgeSkillHeader exp={state.stats.smithingExp} label="Smithing" icon={Hammer} />
                    <ForgeSkillHeader exp={state.stats.workbenchExp} label="Workbench" icon={Activity} />
                </div>

                {state.forge.hasResearchTable && (
                    <SfxButton 
                        sfx="switch"
                        onClick={() => actions.setResearchOpen(true)}
                        className="bg-indigo-900/80 backdrop-blur-md border border-indigo-500/50 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-xl hover:bg-indigo-800 transition-all group animate-in slide-in-from-right-2 duration-700"
                    >
                        <div className="p-1.5 bg-stone-950/40 rounded-lg">
                            <Library className="w-4 h-4 md:w-5 md:h-5 text-indigo-300 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex flex-col items-end leading-tight pl-1">
                            <span className="text-[8px] md:text-[10px] font-black text-indigo-300 uppercase tracking-widest">Research Bench</span>
                            <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-tighter">Scholars Desk</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-indigo-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
                    </SfxButton>
                )}
            </div>
        )}

        {/* Main Focused Workspace */}
        <div className="flex-1 flex w-full h-full items-center justify-center p-4 md:p-8 overflow-hidden relative z-10">
            <div className="relative flex flex-col items-center justify-center w-full max-w-4xl h-full animate-in fade-in duration-1000">
                <ForgeWorkspaceView 
                    selectedItem={selectedItem}
                    masteryInfo={masteryInfo}
                    imageUrl={selectedItem ? forge.getItemImageUrl(selectedItem) : ''}
                    canEnterForge={forge.canEnterForge}
                    isFuelShortage={isFuelShortage}
                    isQuickFuelShortage={isQuickFuelShortage}
                    quickCraftProgress={quickCraftProgress}
                    extraFuelCost={selectedItem ? getExtraFuelCost(selectedItem.tier) : 0}
                    onStartCrafting={handlers.startCrafting}
                    onQuickCraft={handlers.handleQuickCraft}
                />
            </div>
        </div>

        {/* Action Button Row */}
        {!isCrafting && (
            <div className="absolute bottom-6 right-6 z-[60] flex items-center gap-3">
                {/* Floating Toggle for Inventory Modal */}
                <SfxButton 
                    sfx="switch"
                    onClick={onOpenInventory}
                    className="w-16 h-16 md:w-20 md:h-20 bg-stone-800 hover:bg-stone-700 text-white rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-2 border-stone-600 flex flex-col items-center justify-center transition-all active:scale-90 group"
                >
                    <Package className="w-7 h-7 md:w-9 md:h-9 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter mt-0.5">Storage</span>
                </SfxButton>

                {/* Floating Toggle for Recipe Modal */}
                <SfxButton 
                    sfx="switch"
                    onClick={() => handlers.setIsPanelOpen(true)}
                    data-tutorial-id="FORGE_TAB"
                    className="w-16 h-16 md:w-20 md:h-20 bg-amber-600 hover:bg-amber-500 text-white rounded-full shadow-[0_10px_40px_rgba(180,83,9,0.5)] border-2 border-amber-400 flex flex-col items-center justify-center transition-all active:scale-90 group"
                >
                    <Book className="w-7 h-7 md:w-9 md:h-9 group-hover:rotate-12 transition-transform" />
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter mt-0.5">Recipes</span>
                </SfxButton>
            </div>
        )}

        {/* Recipe Selection Modal */}
        {isPanelOpen && (
            <div className={`${UI_MODAL_LAYOUT.OVERLAY} z-[1200] animate-in fade-in duration-300`}>
                <div className="relative w-[95%] sm:w-[85%] max-w-4xl h-full max-h-[85vh] bg-stone-900 border-2 border-stone-700 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden ring-1 ring-white/10">
                    <div className="p-4 md:p-6 border-b border-stone-800 bg-stone-850 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-900/20 p-2 rounded-xl border border-amber-800/30">
                                <Book className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-stone-100 font-serif uppercase tracking-tight leading-none">Ancient Patterns</h3>
                                <p className="text-stone-500 text-[9px] md:text-xs font-bold uppercase tracking-[0.2em] mt-1">Deciphering the Lockhart Lineage</p>
                            </div>
                        </div>
                        <SfxButton 
                            sfx="switch" 
                            onClick={() => {
                                handlers.setIsPanelOpen(false);
                                handlers.handleMouseLeave(); // Ensure tooltip is hidden
                            }} 
                            className="p-2 hover:bg-stone-800 rounded-full text-stone-500 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </SfxButton>
                    </div>

                    <div className="flex-1 overflow-hidden bg-stone-950/20">
                        <ForgeListView 
                            activeCategory={activeCategory}
                            expandedSubCat={expandedSubCat}
                            favoriteItems={favoriteItems}
                            isFavExpanded={isFavExpanded}
                            visibleSubCats={visibleSubCats}
                            groupedItems={groupedItems}
                            selectedItem={selectedItem}
                            favorites={forge.favorites}
                            getInventoryCount={forge.getInventoryCount}
                            getItemImageUrl={forge.getItemImageUrl}
                            onCategoryChange={handlers.handleCategoryChange}
                            onToggleSubCategory={handlers.toggleSubCategory}
                            onToggleFavExpanded={() => handlers.setIsFavExpanded(!isFavExpanded)}
                            onSelectItem={(item) => {
                                handlers.handleSelectItem(item);
                                handlers.setIsPanelOpen(false);
                                handlers.handleMouseLeave(); // Ensure tooltip is hidden
                            }}
                            onToggleFavorite={handlers.toggleFavorite}
                            onMouseEnter={handlers.handleMouseEnter}
                            onMouseMove={handlers.handleMouseMove}
                            onMouseLeave={handlers.handleMouseLeave}
                        />
                    </div>
                </div>
            </div>
        )}

        {hoveredItem && <RecipeTooltip item={hoveredItem} pos={tooltipPos} getInventoryCount={forge.getInventoryCount} />}
    </div>
  );
};

export default ForgeTab;