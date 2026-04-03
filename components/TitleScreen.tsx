import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Anvil, Play, Upload, User, FastForward, X, Settings, Zap, BookOpen, Globe } from 'lucide-react';
import { getAssetUrl } from '../utils';
import { getDisplayForgeNameFromMetadata, getLatestSaveInfo, getSaveMetadataList, loadFromSlot } from '../utils/saveSystem';
import SaveLoadModal from './modals/SaveLoadModal';
const SettingsModal = React.lazy(() => import('./modals/SettingsModal'));
import { SfxButton } from './common/ui/SfxButton';
import { UI_MODAL_LAYOUT } from '../config/ui-config';
import { APP_VERSION } from '../utils/appVersion';
import { t } from '../utils/i18n';
import { useGame } from '../context/GameContext';
import { getDefaultPlayerName, getForgeName, getForgeNameFromPlayerName, splitTitleName } from '../utils/gameText';
import { createInitialGameState } from '../state/initial-game-state';

interface TitleScreenProps {
    onNewGame: (skipTutorial: boolean) => void;
    onLoadGame: (data: any, slotIndex: number) => void;
}

const TitleScreen: React.FC<TitleScreenProps> = ({ onNewGame, onLoadGame }) => {
    const { state, actions } = useGame();
    const language = state.settings.language;
    const [showCredits, setShowCredits] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showNewGameModal, setShowNewGameModal] = useState(false);
    const [hasSaves, setHasSaves] = useState(false);
    const [playerNameInput, setPlayerNameInput] = useState(state.settings.playerName || getDefaultPlayerName(language));
    const [latestSaveForgeName, setLatestSaveForgeName] = useState<string | null>(null);
    const currentTitleForgeName = showNewGameModal
        ? getForgeNameFromPlayerName(language, playerNameInput)
        : (latestSaveForgeName || getForgeName(state));
    const [titleLineOne, titleLineTwo] = useMemo(() => splitTitleName(currentTitleForgeName.toUpperCase()), [currentTitleForgeName]);
    const checkSaves = useCallback(() => {
        const metadata = getSaveMetadataList();
        setHasSaves(metadata.length > 0);
        setLatestSaveForgeName(metadata.length > 0 ? getDisplayForgeNameFromMetadata(metadata[0], state.settings) : null);
    }, [state.settings]);

    useEffect(() => {
        checkSaves();
    }, [checkSaves]);

    useEffect(() => {
        if (!showLoadModal) {
            checkSaves();
        }
    }, [showLoadModal, checkSaves]);

    useEffect(() => {
        if (showNewGameModal) {
            setPlayerNameInput(state.settings.playerName || getDefaultPlayerName(language));
        }
    }, [showNewGameModal, state.settings.playerName, language]);

    const commitPlayerName = () => {
        const nextName = playerNameInput.trim() || getDefaultPlayerName(language);
        actions.updateSettings({ playerName: nextName });
        setLatestSaveForgeName(getForgeNameFromPlayerName(language, nextName));
        return nextName;
    };

    const handleContinue = () => {
        const info = getLatestSaveInfo(createInitialGameState());
        if (info) {
            if (info.data.version !== APP_VERSION) {
                alert(t(language, 'title.version_mismatch', {
                    saveVersion: info.data.version || '0.1.36',
                    appVersion: APP_VERSION
                }));
                return;
            }
            onLoadGame(info.data, info.index);
        }
    };

    const handleLoadFromSlot = (index: number) => {
        const data = loadFromSlot(index, createInitialGameState());
        if (data) {
            if (data.version !== APP_VERSION) {
                alert(t(language, 'title.version_mismatch', {
                    saveVersion: data.version || '0.1.36',
                    appVersion: APP_VERSION
                }));
                return;
            }
            onLoadGame(data, index);
            setShowLoadModal(false);
        }
    };

    return (
            <div className="relative h-[100dvh] w-full bg-stone-950 overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <img 
                        src={getAssetUrl('forge_bg.jpeg', 'bg')} 
                        className="w-full h-full object-cover opacity-30 blur-sm scale-105"
                        alt="Background"
                    />
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>

                <div className="absolute top-4 right-4 z-20">
                    <SfxButton
                        sfx="switch"
                        onClick={() => actions.updateSettings({ language: language === 'en' ? 'ko' : 'en' })}
                        className="flex items-center gap-2 px-3 py-2 rounded-full border border-stone-700 bg-stone-950/80 hover:bg-stone-900 text-stone-200 shadow-xl backdrop-blur-md"
                    >
                        <Globe className="w-4 h-4 text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {t(language, `languages.${language}`)}
                        </span>
                    </SfxButton>
                </div>

                <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000 p-4 md:p-6 w-full max-h-full overflow-hidden px-safe">
                    <div className="mb-[2dvh] md:mb-12 text-center shrink-0">
                        <div className="w-[clamp(60px,15dvh,120px)] h-[clamp(60px,15dvh,120px)] md:w-32 md:h-32 bg-amber-900/20 rounded-full flex items-center justify-center border-2 md:border-4 border-amber-700/50 mb-[1.5dvh] md:mb-6 mx-auto shadow-[0_0_50px_rgba(180,83,9,0.3)]">
                            <Anvil className="w-[50%] h-[50%] text-amber-50 drop-shadow-lg" />
                        </div>
                        <h1 className="text-[clamp(24px,6dvh,64px)] md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-700 font-serif tracking-tighter drop-shadow-sm leading-[1.1]">
                            <span className="block">{titleLineOne}</span>
                            {titleLineTwo ? <span className="block">{titleLineTwo}</span> : null}
                        </h1>
                        <div className="h-0.5 md:h-1 w-16 md:w-32 bg-amber-800 mx-auto mt-[1dvh] md:mt-4 rounded-full"></div>
                        <p className="mt-[0.5dvh] md:mt-4 text-stone-500 font-sans tracking-[0.3em] text-[clamp(10px,1.2dvh,14px)] md:text-sm uppercase font-bold">{t(language, 'title.subtitle')}</p>
                        <p className="mt-1 text-stone-600 font-mono text-[9px] md:text-xs">{t(language, 'title.build', { version: APP_VERSION })}</p>
                    </div>

                    <div className="flex flex-col gap-1.5 md:gap-4 w-48 md:w-64 shrink-0">
                        {hasSaves && (
                            <SfxButton 
                                onClick={handleContinue}
                                className="group relative px-4 md:px-8 py-1.5 md:py-4 bg-amber-700/20 border border-amber-500 hover:bg-amber-600 transition-all rounded-lg shadow-xl animate-pulse hover:animate-none"
                            >
                                <div className="flex items-center justify-center gap-2 md:gap-3">
                                    <FastForward className="w-3 h-3 md:w-5 md:h-5 text-amber-400" />
                                    <span className="font-serif font-black text-amber-50 tracking-wide text-[10px] md:text-base">{t(language, 'title.continue')}</span>
                                </div>
                            </SfxButton>
                        )}

                        <SfxButton 
                            onClick={() => setShowNewGameModal(true)}
                            className="group relative px-4 md:px-8 py-1.5 md:py-4 bg-stone-900/80 border border-stone-700 hover:border-amber-500 rounded-lg overflow-hidden transition-all hover:bg-stone-800 shadow-lg"
                        >
                            <div className="absolute inset-0 w-1 bg-amber-500 transition-all group-hover:w-full opacity-10"></div>
                            <div className="flex items-center justify-center gap-2 md:gap-3">
                                <Play className="w-3 h-3 md:w-5 md:h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                                <span className="font-serif font-black text-stone-200 tracking-wide text-[10px] md:text-base">{t(language, 'title.new_game')}</span>
                            </div>
                        </SfxButton>

                        <SfxButton 
                            sfx="switch"
                            onClick={() => setShowLoadModal(true)}
                            className={`group px-4 md:px-8 py-1.5 md:py-4 border rounded-lg transition-all flex items-center justify-center gap-2 md:gap-3 bg-stone-900/80 border-stone-700 hover:border-stone-500 hover:bg-stone-800 text-stone-300`}
                        >
                            <div className="flex items-center justify-center gap-2 md:gap-3">
                                <Upload className="w-3 h-3 md:w-5 md:h-5" />
                                <span className="font-serif font-black tracking-wide text-[10px] md:text-base">{t(language, 'title.load_game')}</span>
                            </div>
                        </SfxButton>

                        <SfxButton 
                            sfx="switch"
                            onClick={() => setShowSettings(true)}
                            className="group px-4 md:px-8 py-1.5 md:py-4 bg-stone-900/80 border border-stone-700 hover:border-stone-500 rounded-lg transition-all hover:bg-stone-800 text-stone-300 flex items-center justify-center gap-2 md:gap-3"
                        >
                            <div className="flex items-center justify-center gap-2 md:gap-3">
                                <Settings className="w-3 h-3 md:w-5 md:h-5" />
                                <span className="font-serif font-black tracking-wide text-[10px] md:text-base">{t(language, 'title.settings')}</span>
                            </div>
                        </SfxButton>

                        <SfxButton 
                            onClick={() => setShowCredits(true)}
                            className="px-6 py-1 md:py-2 mt-0.5 md:mt-4 text-stone-600 hover:text-amber-600 text-[8px] md:text-xs font-black tracking-widest transition-colors flex items-center justify-center gap-2 font-sans"
                        >
                            <User className="w-2.5 h-2.5" /> {t(language, 'title.credits')}
                        </SfxButton>
                    </div>
                </div>

                {/* New Game Mode Selection Modal */}
                {showNewGameModal && (
                    <div className={`${UI_MODAL_LAYOUT.OVERLAY} z-[1600] animate-in fade-in duration-200`}>
                        <div className={`${UI_MODAL_LAYOUT.CONTAINER} border-stone-700 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-200 ring-1 ring-white/10`}>
                            <div className="p-4 md:p-5 border-b border-stone-800 bg-stone-850 flex justify-between items-center shrink-0">
                                <h3 className="font-bold text-stone-200 font-serif uppercase tracking-widest text-sm md:text-base ml-1">{t(language, 'title.new_game_modal_title')}</h3>
                                <SfxButton onClick={() => setShowNewGameModal(false)} className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500"><X className="w-5 h-5 md:w-6 md:h-6" /></SfxButton>
                            </div>
                            
                            <div className="p-4 md:p-6 space-y-3 md:space-y-4 overflow-y-auto custom-scrollbar">
                                <div className="rounded-2xl border border-stone-700 bg-stone-900/70 p-4 space-y-2">
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="player-name-input" className="font-black text-stone-100 text-[11px] md:text-sm uppercase tracking-widest">{t(language, 'title.player_name_label')}</label>
                                        <p className="text-[9px] md:text-[10px] text-stone-500 font-bold leading-tight">{t(language, 'title.player_name_desc', { playerName: playerNameInput.trim() || getDefaultPlayerName(language) })}</p>
                                    </div>
                                    <input
                                        id="player-name-input"
                                        value={playerNameInput}
                                        maxLength={28}
                                        onChange={(e) => setPlayerNameInput(e.target.value)}
                                        placeholder={getDefaultPlayerName(language)}
                                        className="w-full rounded-xl border border-stone-700 bg-stone-950/80 px-4 py-3 text-sm md:text-base font-serif font-bold text-stone-100 placeholder:text-stone-600 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                    />
                                </div>
                                <SfxButton 
                                    onClick={() => { commitPlayerName(); onNewGame(false); }}
                                    className="w-full group relative p-4 bg-stone-800 border-2 border-stone-700 hover:border-amber-500 rounded-2xl transition-all text-left flex items-center gap-4 shadow-lg active:scale-[0.98]"
                                >
                                    <div className="w-12 h-12 bg-amber-900/20 rounded-xl flex items-center justify-center border border-amber-700/30 group-hover:bg-amber-600/20 transition-colors shrink-0">
                                        <BookOpen className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-black text-stone-100 text-[11px] md:text-sm uppercase tracking-widest mb-0.5 group-hover:text-amber-400 transition-colors">{t(language, 'title.begin_narrative')}</span>
                                        <span className="text-[9px] md:text-[10px] text-stone-500 font-bold uppercase tracking-tight leading-tight">{t(language, 'title.begin_narrative_desc')}</span>
                                    </div>
                                </SfxButton>

                                <SfxButton 
                                    onClick={() => { commitPlayerName(); onNewGame(true); }}
                                    className="w-full group relative p-4 bg-stone-800 border-2 border-stone-700 hover:border-indigo-500 rounded-2xl transition-all text-left flex items-center gap-4 shadow-lg active:scale-[0.98]"
                                >
                                    <div className="w-12 h-12 bg-indigo-900/20 rounded-xl flex items-center justify-center border border-indigo-700/30 group-hover:bg-indigo-600/20 transition-colors shrink-0">
                                        <Zap className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-black text-stone-100 text-[11px] md:text-sm uppercase tracking-widest mb-0.5 group-hover:text-indigo-300 transition-colors">{t(language, 'title.legacy_mode')}</span>
                                        <span className="text-[9px] md:text-[10px] text-stone-500 font-bold uppercase tracking-tight leading-tight">{t(language, 'title.legacy_mode_desc')}</span>
                                    </div>
                                    <div className="absolute top-1.5 right-3 text-[6px] font-black text-indigo-500/50 uppercase tracking-widest">{t(language, 'title.tutorial_skip')}</div>
                                </SfxButton>
                            </div>

                            <div className="p-3 bg-stone-950 text-center border-t border-stone-800 shrink-0">
                                <p className="text-[8px] md:text-[9px] text-stone-600 font-mono uppercase tracking-[0.2em]">{t(language, 'title.choose_path')}</p>
                            </div>
                        </div>
                    </div>
                )}

                <SaveLoadModal 
                    isOpen={showLoadModal} 
                    mode="LOAD" 
                    onClose={() => setShowLoadModal(false)} 
                    onAction={handleLoadFromSlot} 
                />

                <React.Suspense fallback={null}>
                    <SettingsModal 
                        isOpen={showSettings}
                        onClose={() => setShowSettings(false)}
                        isTitleView={true}
                    />
                </React.Suspense>

                {showCredits && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                        <div className="max-w-md w-full bg-stone-900 border border-stone-700 p-6 md:p-8 rounded-xl text-center relative shadow-2xl">
                            <SfxButton sfx="switch" onClick={() => setShowCredits(false)} className="absolute top-4 right-4 text-stone-500 hover:text-stone-300">
                                <X className="w-5 h-5" />
                            </SfxButton>
                            <h2 className="text-xl md:text-2xl font-bold text-amber-50 mb-6 font-serif">{t(language, 'title.credits')}</h2>
                            <div className="space-y-4 text-stone-300 text-left">
                                <div><h3 className="text-[10px] md:text-xs text-stone-500 uppercase font-black tracking-widest mb-1 font-sans">{t(language, 'title.created_by')}</h3><p className="font-serif font-bold text-sm md:text-lg">CryingDev</p></div>
                                <div><h3 className="text-[10px] md:text-xs text-stone-500 uppercase font-black tracking-widest mb-1 font-sans">{t(language, 'title.assets')}</h3><p className="font-serif font-bold text-xs md:text-base">{t(language, 'title.assets_desc')}</p></div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-stone-800 text-[10px] text-stone-600 font-sans font-bold uppercase tracking-tighter">{t(language, 'title.tech_stack')}</div>
                        </div>
                    </div>
                )}
            </div>
    );
};

export default TitleScreen;
