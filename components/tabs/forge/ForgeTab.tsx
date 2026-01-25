
import React, { useRef } from 'react';
import { Hammer, Shield, Sword, ChevronRight, ChevronLeft, Lock, ChevronDown, ChevronUp, Activity, FastForward, Flame, AlertCircle } from 'lucide-react';
import { useForge } from './hooks/useForge';
import { getAssetUrl } from '../../../utils';
import { MASTERY_THRESHOLDS } from '../../../config/mastery-config';

// Sub-components
import ForgeSkillHeader from './ui/ForgeSkillHeader';
import ForgeStatsGrid from './ui/ForgeStatsGrid';
import RecipeCard from './ui/RecipeCard';
import MasteryRadialGauge from './ui/MasteryRadialGauge';
import QuickCraftOverlay from './ui/QuickCraftOverlay';
import RecipeTooltip from './ui/RecipeTooltip';
import SmithingMinigame from './ui/SmithingMinigame';
import WorkbenchMinigame from './ui/WorkbenchMinigame';

interface ForgeTabProps {
    onNavigate: (tab: any) => void;
}

const ForgeTab: React.FC<ForgeTabProps> = ({ onNavigate }) => {
  const forge = useForge(onNavigate);
  const { state, handlers, actions, isCrafting, selectedItem, isPanelOpen, isSkillsExpanded, activeCategory, expandedSubCat, favoriteItems, isFavExpanded, visibleSubCats, groupedItems, hoveredItem, tooltipPos, quickCraftProgress, masteryInfo, isFuelShortage, isQuickFuelShortage } = forge;

  const startButtonRef = useRef<HTMLButtonElement>(null);
  const quickButtonRef = useRef<HTMLButtonElement>(null);

  const getItemImageUrl = (item: any) => {
    if (item.image) return getAssetUrl(item.image);
    return getAssetUrl(`${item.id}.png`);
  };

  const getExtraFuelCost = (tier: number) => {
    if (tier === 1) return 3;
    if (tier === 2) return 5;
    return 8;
  };

  return (
    <div className="relative h-full w-full bg-stone-950 overflow-hidden" style={{ backgroundImage: `url(${getAssetUrl('tile_forge.png')})`, backgroundRepeat: 'repeat', backgroundBlendMode: 'multiply' }}>
        
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

        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 pointer-events-auto">
            {!isSkillsExpanded ? (
                <button 
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
                </button>
            ) : (
                <div className="flex flex-col gap-2">
                    <button onClick={() => handlers.setIsSkillsExpanded(false)} className="self-start mb-1 bg-stone-900/80 border border-stone-700 px-3 py-1 rounded-full text-[8px] font-black text-stone-400 hover:text-white uppercase tracking-widest flex items-center gap-1 shadow-lg transition-all"><ChevronUp className="w-3 h-3" /> Hide Progress</button>
                    <ForgeSkillHeader exp={state.stats.smithingExp} label="Smithing" icon={Hammer} />
                    <ForgeSkillHeader exp={state.stats.workbenchExp} label="Workbench" icon={Activity} />
                </div>
            )}
        </div>

        <div className="absolute inset-0 z-0 flex w-full h-full">
            <div className={`h-full relative flex flex-col transition-all duration-500 ease-in-out ${isPanelOpen ? 'w-[55%] md:w-[60%]' : 'w-full'}`}>
                <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 bg-stone-925/40 relative overflow-hidden text-center">
                    {selectedItem ? (
                        <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full max-w-lg mx-auto">
                            <MasteryRadialGauge imageUrl={getItemImageUrl(selectedItem)} masteryInfo={masteryInfo} />
                            <h2 className="text-xl md:text-3xl font-bold text-amber-500 mb-1.5 font-serif tracking-wide">{selectedItem.name}</h2>
                            <p className="text-stone-500 mb-6 italic text-[9px] md:text-sm px-6">"{selectedItem.description}"</p>
                            <ForgeStatsGrid item={selectedItem} />
                            
                            <div className="flex flex-col sm:flex-row gap-3 w-full items-center justify-center px-4">
                                <button 
                                    ref={startButtonRef}
                                    onClick={(e) => handlers.startCrafting(e)} 
                                    data-tutorial-id="START_FORGING_BUTTON"
                                    className={`w-full max-w-[200px] h-14 md:h-20 rounded-lg font-black text-sm md:text-base shadow-lg transition-all flex flex-col items-center justify-center border ${
                                        forge.canEnterForge 
                                            ? (selectedItem.craftingType === 'FORGE' ? 'bg-amber-700 hover:bg-amber-600 border-amber-500' : 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500') 
                                            : isFuelShortage 
                                                ? 'bg-red-950/40 border-red-900/60 text-red-500' 
                                                : 'bg-stone-800 text-stone-500 border-stone-700 grayscale opacity-70'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Hammer className="w-4 h-4 md:w-6 md:h-6" />
                                        <span>Start Forging</span>
                                    </div>
                                    {isFuelShortage && (
                                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest mt-1 animate-pulse">Need Charcoal</span>
                                    )}
                                </button>

                                {(state.craftingMastery[selectedItem.id] || 0) >= 1 && (
                                    <button 
                                        ref={quickButtonRef}
                                        onClick={(e) => handlers.handleQuickCraft(e)}
                                        disabled={quickCraftProgress !== null}
                                        className={`w-full max-w-[200px] h-14 md:h-20 rounded-lg font-black text-sm md:text-base shadow-lg transition-all flex flex-col items-center justify-center gap-0.5 border ${
                                            isQuickFuelShortage
                                                ? 'bg-red-950/20 border-red-900/40 text-red-400'
                                                : 'bg-indigo-900/40 hover:bg-indigo-800/60 border-indigo-500/50 text-indigo-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isQuickFuelShortage ? <AlertCircle className="w-4 h-4 text-red-500" /> : <FastForward className="w-4 h-4 md:w-5 md:h-5" />}
                                            <span>Quick Craft</span>
                                        </div>
                                        <div className={`flex items-center gap-1 text-[8px] md:text-[9px] font-bold uppercase tracking-tighter ${isQuickFuelShortage ? 'text-red-500' : 'text-indigo-400'}`}>
                                            <Flame className="w-2.5 h-2.5" />
                                            <span>-{getExtraFuelCost(selectedItem.tier)} Fuel</span>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="z-10 flex flex-col items-center text-stone-600 text-center">
                            <Hammer className="w-16 h-16 opacity-20 mb-4" />
                            <h3 className="text-xl font-bold">Select a Recipe</h3>
                        </div>
                    )}
                </div>
            </div>

            <div className={`h-full bg-stone-900/95 border-l border-stone-800 shadow-2xl flex flex-col transition-all duration-500 relative ${isPanelOpen ? 'w-[45%] md:w-[40%]' : 'w-0'}`}>
                <button onClick={() => handlers.setIsPanelOpen(!isPanelOpen)} className="absolute top-1/2 -left-6 w-6 h-20 -translate-y-1/2 bg-stone-800 border-y border-l border-stone-600 rounded-l-lg flex items-center justify-center hover:text-amber-400 z-20">
                    {isPanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                <div className="flex border-b border-stone-800 shrink-0">
                    <button onClick={() => handlers.handleCategoryChange('WEAPON')} className={`flex-1 py-4 text-center font-bold text-[10px] md:text-xs ${activeCategory === 'WEAPON' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-500'}`}><Sword className="w-3 h-3 md:w-4 md:h-4 inline mr-2" /> WEAPONS</button>
                    <button onClick={() => handlers.handleCategoryChange('ARMOR')} className={`flex-1 py-4 text-center font-bold text-[10px] md:text-xs ${activeCategory === 'ARMOR' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-500'}`}><Shield className="w-3 h-3 md:w-4 md:h-4 inline mr-2" /> ARMORS</button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 space-y-4">
                    {favoriteItems.length > 0 && (
                        <div className="space-y-2">
                            <button onClick={() => handlers.setIsFavExpanded(!isFavExpanded)} className="w-full flex items-center justify-between px-3 py-2 bg-stone-800/40 rounded-lg"><span className="text-[10px] md:text-xs font-black uppercase text-stone-400">Favorites</span>{isFavExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>
                            {isFavExpanded && (
                                <div className="grid grid-cols-2 gap-2">
                                    {favoriteItems.map(item => (
                                        <RecipeCard key={`fav-${item.id}`} item={item} isSelected={selectedItem?.id === item.id} isFav={true} inventoryCount={forge.getInventoryCount(item.id)} onSelect={handlers.handleSelectItem} onToggleFavorite={handlers.toggleFavorite} onMouseEnter={handlers.handleMouseEnter} onMouseMove={handlers.handleMouseMove} onMouseLeave={handlers.handleMouseLeave} imageUrl={getItemImageUrl(item)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {visibleSubCats.map(subCat => (
                        <div key={subCat.id} className="space-y-2">
                            <button onClick={() => handlers.toggleSubCategory(subCat.id)} className="w-full flex items-center justify-between px-3 py-2 bg-stone-800/40 rounded-lg"><span className="text-[10px] md:text-xs font-black uppercase text-stone-400">{subCat.name}</span>{expandedSubCat === subCat.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}</button>
                            {expandedSubCat === subCat.id && (
                                <div className="grid grid-cols-2 gap-2">
                                    {groupedItems[subCat.id]?.map(item => (
                                        <RecipeCard key={item.id} item={item} isSelected={selectedItem?.id === item.id} isFav={forge.favorites.includes(item.id)} inventoryCount={forge.getInventoryCount(item.id)} onSelect={handlers.handleSelectItem} onToggleFavorite={handlers.toggleFavorite} onMouseEnter={handlers.handleMouseEnter} onMouseMove={handlers.handleMouseMove} onMouseLeave={handlers.handleMouseLeave} imageUrl={getItemImageUrl(item)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
        {hoveredItem && <RecipeTooltip item={hoveredItem} pos={tooltipPos} getInventoryCount={forge.getInventoryCount} />}
    </div>
  );
};

export default ForgeTab;
