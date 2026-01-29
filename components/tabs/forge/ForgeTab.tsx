
import React from 'react';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Hammer, Activity, Library } from 'lucide-react';
import { useForge } from './hooks/useForge';
import { getAssetUrl } from '../../../utils';
import { SfxButton } from '../../common/ui/SfxButton';

// Sub-components
import ForgeSkillHeader from './ui/ForgeSkillHeader';
// Fixed: Use named import for ForgeListView as it is exported as a named constant
import { ForgeListView } from './ui/ForgeListView';
// Fixed: Use named import for ForgeWorkspaceView as it is exported as a named constant
import { ForgeWorkspaceView } from './ui/ForgeWorkspaceView';
import QuickCraftOverlay from './ui/QuickCraftOverlay';
import RecipeTooltip from './ui/RecipeTooltip';
import SmithingMinigame from './ui/SmithingMinigame';
import WorkbenchMinigame from './ui/WorkbenchMinigame';

interface ForgeTabProps {
    onNavigate: (tab: any) => void;
}

const ForgeTab: React.FC<ForgeTabProps> = ({ onNavigate }) => {
  const forge = useForge(onNavigate);
  const { 
    state, handlers, actions, isCrafting, selectedItem, isPanelOpen, isSkillsExpanded, 
    activeCategory, expandedSubCat, favoriteItems, isFavExpanded, visibleSubCats, 
    groupedItems, hoveredItem, tooltipPos, quickCraftProgress, masteryInfo, 
    isFuelShortage, isQuickFuelShortage 
  } = forge;

  const getExtraFuelCost = (tier: number) => {
    if (tier === 1) return 3;
    if (tier === 2) return 5;
    return 8;
  };

  return (
    <div className="relative h-full w-full bg-stone-950 overflow-hidden" style={{ backgroundImage: `url(${getAssetUrl('tile_forge.png', 'minigame')})`, backgroundRepeat: 'repeat', backgroundBlendMode: 'multiply' }}>
        
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

        {/* Global Skill/Research UI */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 pointer-events-auto flex flex-col gap-2">
            {!isSkillsExpanded ? (
                <SfxButton 
                    sfx="switch"
                    onClick={() => handlers.setIsSkillsExpanded(true)}
                    className="bg-stone-900/90 backdrop-blur-md border border-stone-700 rounded-full px-4 py-2 flex items-center gap-3 shadow-xl hover:bg-stone-800 transition-all group"
                >
                    <div className="flex items-center gap-1.5">
                        <Hammer className="w-3.5 h-3.5 text-amber-50" />
                        <span className="text-[10px] md:text-xs font-mono font-black text-stone-300">Lv.{forge.smithingLevel}</span>
                    </div>
                    <div className="w-px h-3 bg-stone-700" />
                    <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-[10px] md:text-xs font-mono font-black text-stone-300">Lv.{forge.workbenchLevel}</span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-stone-500 group-hover:text-amber-500 transition-colors" />
                </SfxButton>
            ) : (
                <div className="flex flex-col gap-2">
                    <SfxButton sfx="switch" onClick={() => handlers.setIsSkillsExpanded(false)} className="self-start mb-1 bg-stone-900/80 border border-stone-700 px-3 py-1 rounded-full text-[8px] font-black text-stone-400 hover:text-white uppercase tracking-widest flex items-center gap-1 shadow-lg transition-all"><ChevronUp className="w-3 h-3" /> Hide Progress</SfxButton>
                    <ForgeSkillHeader exp={state.stats.smithingExp} label="Smithing" icon={Hammer} />
                    <ForgeSkillHeader exp={state.stats.workbenchExp} label="Workbench" icon={Activity} />
                </div>
            )}

            {state.forge.hasResearchTable && (
                <SfxButton 
                    sfx="switch"
                    onClick={() => actions.setResearchOpen(true)}
                    className="bg-indigo-900/80 backdrop-blur-md border border-indigo-500/50 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-xl hover:bg-indigo-800 transition-all group animate-in slide-in-from-left-2 duration-700"
                >
                    <div className="p-1.5 bg-stone-950/40 rounded-lg">
                        <Library className="w-4 h-4 md:w-5 md:h-5 text-indigo-300 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                        <span className="text-[8px] md:text-[10px] font-black text-indigo-300 uppercase tracking-widest">Research Bench</span>
                        <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-tighter">Scholars Desk</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-indigo-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
                </SfxButton>
            )}
        </div>

        <div className="absolute inset-0 z-0 flex w-full h-full">
            <div className={`h-full relative flex flex-col items-center justify-center p-4 md:p-8 bg-stone-925/40 overflow-hidden transition-all duration-500 ease-in-out ${isPanelOpen ? 'w-[55%] md:w-[60%]' : 'w-full'}`}>
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

            <div className={`h-full transition-all duration-500 relative ${isPanelOpen ? 'w-[45%] md:w-[40%] opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'}`}>
                <SfxButton sfx="switch" onClick={() => handlers.setIsPanelOpen(!isPanelOpen)} className="absolute top-1/2 -left-6 w-6 h-20 -translate-y-1/2 bg-stone-800 border-y border-l border-stone-600 rounded-l-lg flex items-center justify-center hover:text-amber-400 z-20">
                    <ChevronRight className="w-4 h-4" />
                </SfxButton>
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
                    onSelectItem={handlers.handleSelectItem}
                    onToggleFavorite={handlers.toggleFavorite}
                    onMouseEnter={handlers.handleMouseEnter}
                    onMouseMove={handlers.handleMouseMove}
                    onMouseLeave={handlers.handleMouseLeave}
                />
            </div>

            {!isPanelOpen && (
                <SfxButton sfx="switch" onClick={() => handlers.setIsPanelOpen(true)} className="absolute top-1/2 right-0 w-8 h-24 -translate-y-1/2 bg-stone-800 border-y border-l border-stone-600 rounded-l-2xl flex items-center justify-center hover:text-amber-400 z-20 shadow-2xl animate-in slide-in-from-right-full duration-300">
                    <ChevronLeft className="w-6 h-6" />
                </SfxButton>
            )}
        </div>
        {hoveredItem && <RecipeTooltip item={hoveredItem} pos={tooltipPos} getInventoryCount={forge.getInventoryCount} />}
    </div>
  );
};

export default ForgeTab;
