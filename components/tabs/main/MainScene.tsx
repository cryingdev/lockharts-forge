import React, { useState, useEffect, useMemo } from 'react';
import { getAssetUrl } from '../../../utils';
import { ChevronRight, ShieldAlert, ShoppingBag, Store, Beer, Coins, Zap, Calendar, BedDouble, BookOpen, Settings, Users } from 'lucide-react';
import { SfxButton } from '../../common/ui/SfxButton';
import { useGame } from '../../../context/GameContext';
import { t } from '../../../utils/i18n';

interface MainSceneProps {
    onNavigate: (tab: any) => void;
    onSettingsClick: () => void;
}

const LogTicker = ({ message, language }: { message: string; language: 'en' | 'ko' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const targetMessage = message || t(language, 'header.quiet');

  useEffect(() => {
    setCurrentIndex(0);
    let index = 0;
    const speed = 25;
    const timer = setInterval(() => {
      if (index < targetMessage.length) {
        index++;
        setCurrentIndex(index);
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [message]);

  return (
    <div className="flex items-center min-w-0 w-full overflow-hidden h-full">
        <span className="text-amber-600 mr-2 md:mr-2.5 text-[12px] md:text-[13px] shrink-0 animate-pulse">»</span>
        <span className="text-[12px] md:text-sm font-mono text-stone-400 whitespace-nowrap truncate w-full text-left tracking-tight">
            <span>{targetMessage.slice(0, currentIndex)}</span>
            <span className="opacity-0">{targetMessage.slice(currentIndex)}</span>
        </span>
    </div>
  );
};

/**
 * MainScene Component
 * Displays the forge's exterior ground background.
 */
const MainScene: React.FC<MainSceneProps> = ({ onNavigate, onSettingsClick }) => {
  const { state, actions } = useGame();
  const language = state.settings.language;
    const { gold, energy, maxEnergy, day } = state.stats;
    const { uiEffects, settings } = state;
    const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

    useEffect(() => {
        const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const totalShopVisitors = useMemo(() => {
        return (state.activeCustomer ? 1 : 0) + state.shopQueue.length;
    }, [state.activeCustomer, state.shopQueue]);

    const bgUrl = isPortrait 
        ? getAssetUrl('bg_ground_vertical.png', 'main') 
        : getAssetUrl('bg_ground_horizontal.png', 'main');

    const poiWallUrl = getAssetUrl('poi_wall_gate.png', 'main');
    const poiTreesUrl = getAssetUrl('poi_trees.png', 'main');
    const poiStoreUrl = getAssetUrl('poi_material_store.png', 'main');
    const poiForgeUrl = getAssetUrl('poi_forge.png', 'main');
    const poiTavernUrl = getAssetUrl('poi_tavern.png', 'main');

    return (
        <div className="fixed inset-0 z-0 bg-stone-950 overflow-hidden flex items-center justify-center animate-in fade-in duration-1000">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={bgUrl} 
                    className="w-full h-full object-cover transition-all duration-700 ease-in-out scale-105"
                    alt="Forge Exterior"
                />
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] pointer-events-none" />
            </div>

            {/* Floating HUD */}
            <div className="absolute top-5 inset-x-3 md:top-6 md:inset-x-8 z-[60] flex flex-col gap-3 pointer-events-none">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2.5 bg-stone-900/60 backdrop-blur-xl border border-stone-700/50 px-4 py-2.5 md:px-5 md:py-3 rounded-2xl shadow-2xl pointer-events-auto group">
                        <Calendar className="w-4.5 h-4.5 md:w-5 md:h-5 text-stone-500 group-hover:text-amber-500 transition-colors" />
                        <span className="font-black text-[13px] md:text-base tracking-[0.18em] uppercase font-serif text-stone-100">Day {day}</span>
                    </div>

                    <div className="flex items-center gap-2.5 md:gap-4 pointer-events-auto">
                        <div className={`flex flex-col w-16 md:w-32 p-1.5 md:p-2 rounded-xl transition-all bg-stone-900/40 backdrop-blur-md border border-stone-700/30 ${uiEffects.energyHighlight ? 'ring-2 ring-emerald-400 animate-shake-hard' : ''}`}>
                            <div className="flex justify-between items-center text-[8px] md:text-[10px] mb-1 text-stone-400 uppercase tracking-widest font-black">
                                <Zap className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 ${uiEffects.energyHighlight ? 'text-emerald-300' : 'text-emerald-500'}`} /> 
                                <span className="font-mono">{energy}</span>
                            </div>
                            <div className="w-full bg-black/40 rounded-full h-1.5 md:h-2 border border-white/5 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${energy < 20 ? 'bg-red-500' : 'bg-emerald-600'}`} style={{ width: `${(energy / maxEnergy) * 100}%` }} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 bg-stone-900/60 backdrop-blur-xl border border-stone-700/50 px-3.5 py-2.5 md:px-4 md:py-3 rounded-2xl shadow-2xl">
                            <span className="font-mono text-[16px] md:text-xl text-amber-500 font-black tracking-tighter">{gold >= 10000 ? `${(gold/1000).toFixed(1)}k` : gold.toLocaleString()}</span>
                            <Coins className="w-4.5 h-4.5 md:w-5 md:h-5 text-amber-600" />
                        </div>
                        <div className="flex gap-2.5">
                            <SfxButton onClick={actions.rest} className="p-3 md:p-3.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 rounded-xl border border-indigo-500/30 backdrop-blur-md transition-all shadow-xl active:scale-90"><BedDouble className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" /></SfxButton>
                            <SfxButton onClick={onSettingsClick} className="p-3 md:p-3.5 bg-stone-900/60 hover:bg-stone-800/80 text-stone-400 rounded-xl border border-stone-700/50 backdrop-blur-md transition-all shadow-xl active:rotate-90 duration-300"><Settings className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" /></SfxButton>
                        </div>
                    </div>
                </div>

                {settings.showLogTicker && (
                    <SfxButton onClick={actions.toggleJournal} className="w-fit max-w-[84%] mx-auto flex items-center gap-3 px-4 py-2 md:px-5 md:py-2.5 bg-stone-950/40 backdrop-blur-md rounded-full border border-white/5 hover:bg-black/40 hover:border-amber-500/30 transition-all group pointer-events-auto shadow-2xl">
                        <BookOpen className="w-4 h-4 md:w-4.5 md:h-4.5 text-stone-600 group-hover:text-amber-500 shrink-0 transition-colors" />
                        <div className="min-w-0"><LogTicker message={state.logs[0] || ''} language={language} /></div>
                    </SfxButton>
                )}
            </div>

            {/* Building Layer (Images and Interaction Area) */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {/* 1. Forgotten Gate */}
                <div className="absolute top-[40%] left-0 w-full z-20 flex flex-col items-center -translate-y-1/2">
                    <SfxButton sfx="switch" onClick={() => state.unlockedTabs.includes('DUNGEON') ? onNavigate('DUNGEON') : actions.showToast("Facility locked.")} className="group relative pointer-events-auto w-full flex flex-col items-center">
                        <div className="absolute inset-x-0 inset-y-1/4 bg-amber-500/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                        <img src={poiWallUrl} className="w-full h-auto object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.95)] group-hover:brightness-125 transition-all" alt="Forgotten Gate" />
                    </SfxButton>
                </div>

                {/* 2. Foreground Trees */}
                <div className="absolute top-[40%] left-0 w-full z-[25] -translate-y-1/2">
                    <img src={poiTreesUrl} className="w-full h-auto object-contain brightness-90 animate-in fade-in duration-[2000ms] delay-700" alt="Foreground Trees" />
                </div>

                {/* 3. Material Store (Market) */}
                <div className="absolute top-[52%] left-[0%] md:left-[12%] w-[45%] md:w-[32%] z-[35] flex flex-col items-end -translate-y-1/2 pr-4 md:pr-10">
                    <SfxButton 
                        sfx="switch" 
                        onClick={() => state.unlockedTabs.includes('MARKET') ? onNavigate('MARKET') : actions.showToast("Facility locked.")} 
                        className="group relative pointer-events-auto w-full flex flex-col items-end"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img src={poiStoreUrl} className="w-full h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] group-hover:brightness-110 transition-all" alt="Material Store" />
                    </SfxButton>
                </div>

                {/* 4. Tavern */}
                <div className="absolute top-[60%] right-[-15%] md:right-[-5%] w-[55%] md:w-[42%] z-[36] flex flex-col items-center -translate-y-1/2">
                    <SfxButton sfx="switch" onClick={() => state.unlockedTabs.includes('TAVERN') ? onNavigate('TAVERN') : actions.showToast("Facility locked.")} className="group relative pointer-events-auto w-full flex flex-col items-center">
                        <div className="absolute inset-0 bg-orange-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img src={poiTavernUrl} className="w-full h-auto object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.85)] group-hover:brightness-110 transition-all" alt="Tavern" />
                    </SfxButton>
                </div>

                {/* 5. Lockhart's Forge (Frontmost Building) */}
                <div className="absolute top-[78%] left-[-20%] md:left-[-10%] w-[65%] md:w-[45%] z-[40] flex flex-col items-center -translate-y-1/2">
                    <SfxButton 
                        sfx="switch" 
                        onClick={() => onNavigate('FORGE_BUILDING')} 
                        className="group relative pointer-events-auto w-full flex flex-col items-center"
                    >
                        <div className="absolute inset-0 bg-amber-500/5 blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img src={poiForgeUrl} className="w-full h-auto object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.9)] group-hover:brightness-110 transition-all" alt="Forge Exterior" />
                        
                        {/* Shop Visitor Queue Badge */}
                        {state.forge.isShopOpen && totalShopVisitors > 0 && (
                            <div className="absolute top-[45%] right-[12%] z-50 pointer-events-none animate-in zoom-in duration-500">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-600 blur-md opacity-40 animate-pulse"></div>
                                    <div className="relative flex items-center gap-1 bg-red-600 border border-red-400 px-2 py-0.5 rounded-full shadow-2xl scale-75 md:scale-100 ring-2 ring-red-600/30">
                                        <Users className="w-2.5 h-2.5 md:w-3 md:h-3 text-white fill-white/20" />
                                        <span className="text-[10px] md:text-xs font-black font-mono text-white leading-none">{totalShopVisitors}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </SfxButton>
                </div>
            </div>

            {/* Label Overlay Layer (z-[50]) - Labels anchored further down to the "bottom" */}
            <div className="absolute inset-0 z-[50] pointer-events-none">
                {/* Gate Label - Ground position */}
                <div className="absolute top-[40%] left-0 w-full flex flex-col items-center -translate-y-1/2">
                    <SfxButton sfx="switch" onClick={() => state.unlockedTabs.includes('DUNGEON') ? onNavigate('DUNGEON') : actions.showToast("Facility locked.")} className="mt-[32%] md:mt-[26%] pointer-events-auto flex items-center gap-2.5 md:gap-3.5 px-4 py-2 md:px-5 md:py-2.5 bg-stone-900/60 backdrop-blur-xl border border-stone-700/50 hover:border-amber-500/50 rounded-full shadow-2xl transition-all scale-[0.9] md:scale-100">
                        <div className="w-7 h-7 md:w-9 md:h-9 bg-red-950/30 border border-red-900/20 rounded-full flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-4 h-4 md:w-4.5 md:h-4.5 text-red-500/80" />
                        </div>
                        <div className="flex flex-col items-start leading-none pr-2">
                            <span className="text-[8px] md:text-[9px] font-black text-stone-500 uppercase tracking-[0.18em]">Sector Depths</span>
                            <span className="text-[12px] md:text-base font-black text-stone-100 font-serif uppercase tracking-[0.12em] mt-1">To Forgotten Dungeons</span>
                        </div>
                        <ChevronRight className="w-4.5 h-4.5 md:w-5 md:h-5 text-stone-600" />
                    </SfxButton>
                </div>

                {/* Market Label - Absolute bottom of store */}
                <div className="absolute top-[53%] left-[0%] md:left-[12%] w-[45%] md:w-[32%] flex flex-col items-end -translate-y-1/2 pr-4 md:pr-10">
                    <SfxButton 
                        sfx="switch" 
                        onClick={() => state.unlockedTabs.includes('MARKET') ? onNavigate('MARKET') : actions.showToast("Facility locked.")} 
                        data-tutorial-id="MARKET_POI"
                        className="mt-[55%] md:mt-[40%] pointer-events-auto flex flex-row-reverse items-center gap-2.5 px-3.5 py-1.5 md:px-4 md:py-2 bg-stone-900/70 backdrop-blur-xl border border-stone-700/50 hover:border-blue-500/50 rounded-full shadow-xl transition-all scale-[0.9] md:scale-100"
                    >
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-950/30 border border-blue-900/20 rounded-full flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400/80" />
                        </div>
                        <div className="flex flex-col items-end leading-none pl-1">
                            <span className="text-[8px] md:text-[9px] font-black text-stone-500 uppercase tracking-[0.16em] text-right">{t(language, 'market.market_district')}</span>
                            <span className="text-[11px] md:text-sm font-black text-stone-100 font-serif uppercase tracking-[0.12em] mt-1 text-right">{t(language, 'market.garricks_wares')}</span>
                        </div>
                    </SfxButton>
                </div>

                {/* Tavern Label - Deep base */}
                <div className="absolute top-[67%] right-[-15%] md:right-[-5%] w-[55%] md:w-[42%] flex flex-col items-center -translate-y-1/2">
                    <SfxButton sfx="switch" onClick={() => state.unlockedTabs.includes('TAVERN') ? onNavigate('TAVERN') : actions.showToast("Facility locked.")} className="mt-[42%] md:mt-[42%] translate-x-[-15%] pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 md:px-4 md:py-2 bg-stone-900/60 backdrop-blur-xl border border-stone-700/50 hover:border-orange-500/50 rounded-full shadow-2xl transition-all scale-[0.9] md:scale-100">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-orange-950/30 border border-orange-900/20 rounded-full flex items-center justify-center shrink-0">
                            <Beer className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-400/80" />
                        </div>
                        <div className="flex flex-col items-start leading-none pr-1">
                            <span className="text-[8px] md:text-[9px] font-black text-stone-500 uppercase tracking-[0.16em]">{t(language, 'mainScene.tavern_category')}</span>
                            <span className="text-[11px] md:text-sm font-black text-stone-100 font-serif uppercase tracking-[0.12em] mt-1">{t(language, 'mainScene.tavern_label')}</span>
                        </div>
                    </SfxButton>
                </div>

                {/* Forge Label - Very base of the entrance */}
                <div className="absolute top-[81%] left-[-20%] md:left-[-10%] w-[65%] md:w-[45%] flex flex-col items-center -translate-y-1/2">
                    <SfxButton 
                        sfx="switch" 
                        onClick={() => onNavigate('FORGE_BUILDING')} 
                        data-tutorial-id="FORGE_POI"
                        className="mt-[55%] md:mt-[50%] translate-x-[20%] pointer-events-auto flex flex-row-reverse items-center gap-2.5 px-3.5 py-1.5 md:px-4 md:py-2 bg-stone-900/80 backdrop-blur-2xl border border-amber-600/30 hover:border-amber-500/60 rounded-full shadow-2xl transition-all scale-[0.95] md:scale-100"
                    >
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-amber-950/30 border border-amber-900/20 rounded-full flex items-center justify-center shrink-0">
                            <Store className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400/80" />
                        </div>
                        <div className="flex flex-col items-end leading-none pl-1">
                            <span className="text-[8px] md:text-[9px] font-black text-amber-50/60 uppercase tracking-[0.16em] text-right">{t(language, 'mainScene.forge_category')}</span>
                            <span className="text-[12px] md:text-base font-black text-stone-100 font-serif uppercase tracking-[0.12em] mt-1 text-right">{t(language, 'mainScene.forge_label')}</span>
                        </div>
                    </SfxButton>
                </div>
            </div>

            {/* Scene Footer */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center">
                <h2 className="text-xl md:text-4xl font-black text-stone-500 font-serif uppercase tracking-[0.5em] opacity-20">Exterior Ground</h2>
            </div>
        </div>
    );
};

export default MainScene;
