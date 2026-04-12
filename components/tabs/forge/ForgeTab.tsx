
import React, { useEffect, lazy, Suspense } from 'react';
import { ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Hammer, Activity, Library, ArrowLeft, Home, Book, X, Package, Zap, Users, Store } from 'lucide-react';
import { useForge } from './hooks/useForge';
import { getAssetUrl } from '../../../utils';
import { SfxButton } from '../../common/ui/SfxButton';
import { t } from '../../../utils/i18n';
import { useGame } from '../../../context/GameContext';

// Sub-components
import ForgeSkillHeader from './ui/ForgeSkillHeader';
import { ForgeListView } from './ui/ForgeListView';
import { ForgeWorkspaceView } from './ui/ForgeWorkspaceView';
import QuickCraftOverlay from './ui/QuickCraftOverlay';
import RecipeTooltip from './ui/RecipeTooltip';
import { UI_MODAL_LAYOUT } from '../../../config/ui-config';

// Lazy Import Minigames
const SmithingMinigame = lazy(() => import('./ui/SmithingMinigame'));
const WorkbenchMinigame = lazy(() => import('./ui/WorkbenchMinigame'));

const MinigameLoading = () => {
    const { state } = useGame();
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-950 z-[200]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin" />
                <span className="text-amber-500 font-serif italic text-xl animate-pulse">{t(state.settings.language, 'forge.loading')}</span>
            </div>
        </div>
    );
};

interface ForgeTabProps {
    onNavigate: (tab: any) => void;
    onOpenInventory: () => void;
    isActive?: boolean;
}

const ForgeTab: React.FC<ForgeTabProps> = ({ onNavigate, onOpenInventory, isActive }) => {
  const forge = useForge(onNavigate);
  const { 
    state, handlers, actions, isCrafting, selectedItem, isPanelOpen, 
    activeCategory, expandedSubCats, favoriteItems, isFavExpanded, visibleSubCats, 
    groupedItems, hoveredItem, tooltipPos, quickCraftProgress, masteryInfo, 
    isFuelShortage, isQuickFuelShortage, isEnergyShortage, requiredEnergy, extraQuickFuel, smithingLevel, workbenchLevel 
  } = forge;
  const language = state.settings.language;

  const [isPortrait, setIsPortrait] = React.useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const bgUrl = getAssetUrl('forge_start_bg.jpeg', 'tutorial');
  const energyPercent = (state.stats.energy / state.stats.maxEnergy) * 100;

  const totalShopVisitors = (state.activeCustomer ? 1 : 0) + state.shopQueue.length;

  // Reposition logic for tutorial: move buttons up if OPEN_RECIPE_GUIDE is active
  const isRecipeTutorial = state.tutorialStep === 'OPEN_RECIPE_GUIDE';

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
                <Suspense fallback={<MinigameLoading />}>
                    {selectedItem.craftingType === 'FORGE' ? (
                        <SmithingMinigame 
                            onComplete={handlers.handleMinigameComplete}
                            onClose={() => actions.cancelCrafting(selectedItem)}
                            difficulty={selectedItem.tier}
                            masteryCount={masteryInfo?.count || 0}
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
                </Suspense>
            </div>
        )}

        {quickCraftProgress !== null && selectedItem && (
            <QuickCraftOverlay 
                progress={quickCraftProgress} 
                extraFuel={extraQuickFuel}
            />
        )}

        {/* Navigation - Return to Forge Ground */}
        {!isCrafting && (
            <SfxButton 
                sfx="switch" 
                onClick={() => onNavigate('MAIN')} 
                className="absolute top-4 left-4 z-20 flex min-h-[52px] items-center gap-2.5 px-5 py-3 bg-stone-900/80 hover:bg-red-900/60 text-stone-300 rounded-2xl border border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-90 group"
            >
                <ArrowLeft className="w-4.5 h-4.5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[13px] font-black uppercase tracking-[0.18em]">{t(language, 'common.back')}</span>
            </SfxButton>
        )}

        {/* Paging Button - To Shop (좌측 중앙 배치) */}
        {!isCrafting && (!state.tutorialStep || ['CRAFT_FIRST_SWORD_GUIDE', 'PIP_RETURN_GUIDE', 'PIP_RETURN_DIALOG_GUIDE'].includes(state.tutorialStep)) && (
            <SfxButton 
                sfx="switch" 
                onClick={() => {
                    onNavigate('SHOP');
                }} 
                data-tutorial-id="NAV_TO_SHOP"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-[1050] w-12 h-28 overflow-hidden rounded-r-2xl border-y-2 border-r-2 border-amber-700/55 bg-stone-900/72 text-amber-500 shadow-2xl backdrop-blur-md transition-all active:scale-95 active:bg-amber-700/25 group flex items-center justify-center"
            >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/18 via-white/7 to-transparent" />
                <div className="pointer-events-none absolute inset-y-3 right-0 w-px bg-white/10" />
                <Store className="h-6 w-6 text-amber-400/90 group-hover:scale-110 transition-transform" />
                {state.forge.isShopOpen && totalShopVisitors > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg animate-bounce z-30">
                        <Users className="w-2.5 h-2.5" />
                        {totalShopVisitors}
                    </div>
                )}
            </SfxButton>
        )}

        {/* Global Skill/Research UI */}
        {!isCrafting && (
            <div className={`absolute top-4 right-4 z-20 pointer-events-auto flex flex-col items-end gap-2 transition-all duration-500 ${isRecipeTutorial ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <div className={`grid grid-cols-3 w-[16.5rem] md:w-[18.5rem] overflow-hidden rounded-xl border border-stone-800 bg-stone-900/66 shadow-inner backdrop-blur-sm ${state.uiEffects.energyHighlight ? 'animate-shake-soft ring-2 ring-red-500/50 bg-red-900/20' : ''}`}>
                    <div className="min-w-0 border-r border-stone-800/90 px-1.5 py-1.5">
                        <div className="flex flex-col items-center text-center gap-1">
                            <div className="relative w-11 h-11 rounded-lg bg-stone-950/90 border border-white/5 shadow-sm flex items-center justify-center">
                                <Zap className={`w-5 h-5 ${state.stats.energy < 20 || state.uiEffects.energyHighlight ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
                            </div>
                            <div className="leading-none">
                                <div className="text-[9px] font-black uppercase tracking-[0.04em] text-stone-200 truncate">{t(language, 'forge.energy')}</div>
                                <div className={`mt-0.5 text-[11px] font-mono font-black ${state.stats.energy < 20 || state.uiEffects.energyHighlight ? 'text-red-300' : 'text-stone-100'}`}>
                                    {state.stats.energy}
                                </div>
                            </div>
                            <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className={`h-full transition-all duration-700 ${state.stats.energy < 20 || state.uiEffects.energyHighlight ? 'bg-red-600' : 'bg-emerald-600'}`}
                                    style={{ width: `${energyPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-r border-stone-800/90">
                        <ForgeSkillHeader exp={state.stats.smithingExp} label={t(language, 'forge.smithing')} tierLabel={t(language, 'forge.tier')} icon={Hammer} compact compactBare />
                    </div>
                    <ForgeSkillHeader exp={state.stats.workbenchExp} label={t(language, 'forge.workbench')} tierLabel={t(language, 'forge.tier')} icon={Activity} compact compactBare />
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
                            <span className="text-[10px] md:text-[11px] font-black text-indigo-300 uppercase tracking-[0.14em]">{t(language, 'forge.research_bench')}</span>
                            <span className="text-[12px] md:text-[13px] font-black text-white uppercase tracking-tight">{t(language, 'forge.scholars_desk')}</span>
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
                    isEnergyShortage={isEnergyShortage}
                    quickCraftProgress={quickCraftProgress}
                    extraFuelCost={extraQuickFuel}
                    onStartCrafting={handlers.startCrafting}
                    onQuickCraft={handlers.handleQuickCraft}
                    onOpenRecipes={() => handlers.setIsPanelOpen(true)}
                />
            </div>
        </div>

        {/* Action Button Row - Elevated during tutorial to stay above DialogueBox */}
        {!isCrafting && (
            <div 
              className={`absolute right-6 z-[60] flex items-center gap-3 transition-all duration-500 ${isRecipeTutorial ? 'bottom-[35dvh]' : 'bottom-10 md:bottom-8'}`}
            >
                {/* Floating Toggle for Inventory Modal */}
                <SfxButton 
                    sfx="switch"
                    onClick={() => {
                        if (state.unlockedTabs.includes('INVENTORY')) {
                            onOpenInventory();
                        } else {
                            actions.showToast(t(language, 'forge.storage_locked'));
                        }
                    }}
                    className={`w-[5.6rem] h-[5.6rem] md:w-[6.4rem] md:h-[6.4rem] bg-stone-800 hover:bg-stone-700 text-white rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-2 border-stone-600 flex flex-col items-center justify-center transition-all active:scale-90 group ${isRecipeTutorial || !state.unlockedTabs.includes('INVENTORY') ? 'opacity-20 scale-90' : 'opacity-100'}`}
                >
                    <Package className="w-9 h-9 md:w-11 md:h-11 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] md:text-[13px] font-black uppercase tracking-tight mt-1.5">{t(language, 'forge.storage')}</span>
                </SfxButton>

                {/* Floating Toggle for Recipe Modal */}
                <SfxButton 
                    sfx="switch"
                    onClick={() => {
                        if (isRecipeTutorial) {
                            actions.setTutorialStep('SELECT_SWORD_GUIDE');
                        }
                        handlers.setIsPanelOpen(true);
                    }}
                    data-tutorial-id="RECIPE_TOGGLE"
                    className="w-[5.6rem] h-[5.6rem] md:w-[6.4rem] md:h-[6.4rem] bg-amber-600 hover:bg-amber-500 text-white rounded-full shadow-[0_10px_40px_rgba(180,83,9,0.5)] border-2 border-amber-400 flex flex-col items-center justify-center transition-all active:scale-90 group ring-4 ring-amber-500/20"
                >
                    <Book className="w-9 h-9 md:w-11 md:h-11 group-hover:rotate-12 transition-transform" />
                    <span className="text-[11px] md:text-[13px] font-black uppercase tracking-tight mt-1.5">{t(language, 'forge.recipes')}</span>
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
                                <Book className="w-6 h-6 text-amber-50" />
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-stone-100 font-serif uppercase tracking-tight leading-none">{t(language, 'forge.ancient_patterns')}</h3>
                                <p className="text-stone-500 text-[9px] md:text-xs font-bold uppercase tracking-[0.2em] mt-1">{t(language, 'forge.ancient_patterns_subtitle')}</p>
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
                            expandedSubCats={expandedSubCats}
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
