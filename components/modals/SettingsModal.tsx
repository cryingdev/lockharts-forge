import React, { useState } from 'react';
import { Save, Upload, Volume2, VolumeX, LogOut, X, Settings, Layout, Check, Music, Zap, ChevronDown, Globe } from 'lucide-react';
import { useGame } from '../../context/GameContext';
const SaveLoadModal = React.lazy(() => import('./SaveLoadModal'));
import { loadFromSlotWithStatus } from '../../utils/saveSystem';
const ConfirmationModal = React.lazy(() => import('./ConfirmationModal'));
import { SfxButton } from '../common/ui/SfxButton';
import { CustomSlider } from '../common/ui/CustomSlider';
import { t } from '../../utils/i18n';
import { APP_VERSION } from '../../utils/appVersion';
import { createInitialGameState } from '../../state/initial-game-state';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuit?: () => void;
    onLoadRequest?: (data: any, depth: number) => void;
    isTitleView?: boolean;
}

/**
 * Internal sub-component for volume control.
 * Defined outside the main component to prevent unmounting during re-renders.
 */
const VolumeSlider = ({ label, value, icon: Icon, onChange, disabled }: { label: string, value: number, icon: any, onChange: (v: number) => void, disabled?: boolean }) => (
    <div className={`flex flex-col gap-1.5 p-3 rounded-xl border transition-all w-full ${disabled ? 'bg-stone-900/40 border-stone-800/50 opacity-40 grayscale' : 'bg-stone-800/40 border-stone-700/50'}`}>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${!disabled && value > 0 ? 'text-amber-500' : 'text-stone-600'}`} />
                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-[9px] font-mono font-bold text-stone-500">{Math.round(value * 100)}%</span>
        </div>
        <CustomSlider 
            value={value} 
            onChange={onChange} 
            disabled={disabled}
        />
    </div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onQuit, onLoadRequest, isTitleView = false }) => {
    const { state, actions } = useGame();
    const [slModal, setSlModal] = useState<{ isOpen: boolean, mode: 'SAVE' | 'LOAD' }>({ isOpen: false, mode: 'SAVE' });
    const [showLanguageList, setShowLanguageList] = useState(false);
    const [loadConfirm, setLoadConfirm] = useState<{ isOpen: boolean, data: any, index: number | null }>({
        isOpen: false,
        data: null,
        index: null
    });
    const [migrationFailure, setMigrationFailure] = useState<{ isOpen: boolean; saveVersion?: string }>({
        isOpen: false
    });

    if (!isOpen) return null;

    const audio = state.settings.audio;
    const language = state.settings.language;

    const handleSlotAction = (slotIndex: number) => {
        if (slModal.mode === 'SAVE') {
            actions.saveGame(slotIndex);
        } else {
            const result = loadFromSlotWithStatus(slotIndex, createInitialGameState());
            if (!result.success || !result.data) {
                setMigrationFailure({ isOpen: true, saveVersion: result.version });
                return;
            }
            setLoadConfirm({ isOpen: true, data: result.data, index: slotIndex });
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/90 backdrop-blur-md px-[10%] py-[15%] animate-in fade-in duration-200 overflow-hidden">
                <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl w-[90vw] max-w-[420px] h-fit max-h-full min-h-[200px] min-w-[280px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 mx-auto text-left">
                    
                    <div className="flex items-center justify-between p-5 border-b border-stone-800 bg-stone-850 shrink-0">
                        <div className="flex items-center gap-3">
                            <Settings className="w-6 h-6 text-amber-500 animate-spin-slow" />
                            <h3 className="font-bold font-serif uppercase tracking-widest text-base text-stone-100">{t(language, 'settings.title')}</h3>
                        </div>
                        <SfxButton onClick={onClose} className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500 transition-colors"><X className="w-6 h-6" /></SfxButton>
                    </div>

                    <div className="flex-1 p-5 space-y-6 overflow-y-auto custom-scrollbar">
                        {!isTitleView && (
                            <div className="space-y-2">
                                <h4 className="text-[9px] font-black text-stone-500 uppercase tracking-widest px-1">{t(language, 'settings.persistence')}</h4>
                                <div className="flex flex-col gap-2.5">
                                    <SfxButton onClick={() => setSlModal({ isOpen: true, mode: 'SAVE' })} className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-700 bg-stone-800 hover:border-amber-500 hover:bg-stone-750 text-stone-300 transition-all shadow-md active:scale-95">
                                        <Save className="w-5 h-5 text-amber-500" /><div className="flex flex-col items-start leading-none"><span className="font-black text-[11px] uppercase tracking-widest">{t(language, 'settings.manual_save')}</span><span className="text-[8px] text-stone-500 uppercase font-bold mt-1">{t(language, 'settings.manual_save_desc')}</span></div>
                                    </SfxButton>
                                    <SfxButton onClick={() => setSlModal({ isOpen: true, mode: 'LOAD' })} className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-700 bg-stone-800 hover:border-stone-500 hover:bg-stone-750 text-stone-300 transition-all shadow-md active:scale-95">
                                        <Upload className="w-5 h-5 text-indigo-400" /><div className="flex flex-col items-start leading-none"><span className="font-black text-[11px] uppercase tracking-widest">{t(language, 'settings.restore_data')}</span><span className="text-[8px] text-stone-500 uppercase font-bold mt-1">{t(language, 'settings.restore_data_desc')}</span></div>
                                    </SfxButton>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h4 className="text-[9px] font-black text-stone-500 uppercase tracking-widest">{t(language, 'settings.audio_engine')}</h4>
                                <SfxButton sfx="switch" className="flex items-center gap-2" onClick={() => actions.updateSettings({ audio: { ...audio, masterEnabled: !audio.masterEnabled } })}>
                                    <span className="text-[8px] font-black text-stone-600 uppercase">{audio.masterEnabled ? t(language, 'settings.enabled') : t(language, 'settings.muted')}</span>
                                    <div className={`w-8 h-4 rounded-full p-0.5 transition-all duration-300 ${audio.masterEnabled ? 'bg-amber-600' : 'bg-stone-800'}`}><div className={`w-3 h-3 bg-white rounded-full transition-all duration-300 ${audio.masterEnabled ? 'translate-x-4' : 'translate-x-0'}`} /></div>
                                </SfxButton>
                            </div>
                            <div className="flex flex-col gap-2.5">
                                <VolumeSlider 
                                    label={t(language, 'settings.master_output')}
                                    value={audio.masterVolume} 
                                    disabled={false} // Always allow Master slider interaction to enable sound
                                    icon={audio.masterEnabled && audio.masterVolume > 0 ? Volume2 : VolumeX} 
                                    onChange={(v) => actions.updateSettings({ audio: { ...audio, masterVolume: v, masterEnabled: v > 0 } })} 
                                />
                                <VolumeSlider label={t(language, 'settings.music_tracks')} value={audio.musicVolume} disabled={!audio.masterEnabled} icon={Music} onChange={(v) => actions.updateSettings({ audio: { ...audio, musicVolume: v, musicEnabled: v > 0 } })} />
                                <VolumeSlider label={t(language, 'settings.sound_effects')} value={audio.sfxVolume} disabled={!audio.masterEnabled} icon={Zap} onChange={(v) => actions.updateSettings({ audio: { ...audio, sfxVolume: v, sfxEnabled: v > 0 } })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-[9px] font-black text-stone-500 uppercase tracking-widest px-1">{t(language, 'settings.interface')}</h4>
                            <SfxButton sfx="switch" className="w-full bg-stone-800/60 border border-stone-700 rounded-xl p-4 flex items-center justify-between group" onClick={() => actions.updateSettings({ showLogTicker: !state.settings.showLogTicker })}>
                                <div className="flex items-center gap-3"><Layout className="w-5 h-5 text-indigo-400" /><div className="flex flex-col items-start"><span className="font-black text-xs uppercase tracking-widest text-stone-200">{t(language, 'settings.header_logs')}</span><span className="text-[9px] text-stone-500 uppercase font-bold">{t(language, 'settings.header_logs_desc')}</span></div></div>
                                <div className={`w-10 h-6 rounded-full p-1 transition-all duration-300 ${state.settings.showLogTicker ? 'bg-amber-600' : 'bg-stone-900 border border-stone-700'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${state.settings.showLogTicker ? 'translate-x-4' : 'translate-x-0'}`} /></div>
                            </SfxButton>
                            <div className="w-full bg-stone-800/60 border border-stone-700 rounded-xl p-4 flex items-center justify-between gap-3">
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-xs uppercase tracking-widest text-stone-200">{t(language, 'settings.language')}</span>
                                    <span className="text-[9px] text-stone-500 uppercase font-bold">{t(language, 'settings.language_desc')}</span>
                                </div>
                                <div className="relative w-[150px] shrink-0">
                                    <SfxButton
                                        sfx="switch"
                                        onClick={() => setShowLanguageList(prev => !prev)}
                                        className="w-full px-3 py-2 rounded-lg border border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800 transition-all"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                <span className="text-[10px] font-black uppercase tracking-widest truncate">
                                                    {t(language, `languages.${language}`)}
                                                </span>
                                            </div>
                                            <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${showLanguageList ? 'rotate-180' : ''}`} />
                                        </div>
                                    </SfxButton>

                                    {showLanguageList && (
                                        <div className="absolute top-full mt-2 w-full max-h-40 overflow-y-auto custom-scrollbar rounded-xl border border-stone-700 bg-stone-950 shadow-2xl z-20">
                                            {(['en', 'ko'] as const).map(option => {
                                                const selected = option === language;
                                                return (
                                                    <SfxButton
                                                        key={option}
                                                        sfx="switch"
                                                        onClick={() => {
                                                            actions.updateSettings({ language: option });
                                                            setShowLanguageList(false);
                                                        }}
                                                        className={`w-full px-3 py-3 text-left transition-all border-b border-stone-800 last:border-b-0 ${selected ? 'bg-amber-600/15 text-amber-100' : 'text-stone-300 hover:bg-stone-900'}`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                                {t(language, `languages.${option}`)}
                                                            </span>
                                                            {selected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                                        </div>
                                                    </SfxButton>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {!isTitleView && onQuit && (
                            <div className="pt-2 pb-4">
                                <SfxButton onClick={onQuit} className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-700 bg-red-950/10 hover:border-red-500 hover:bg-red-950/20 text-red-400 transition-all">
                                    <div className="text-red-500"><LogOut className="w-5 h-5" /></div><span className="font-black text-xs uppercase tracking-widest">{t(language, 'settings.quit_to_title')}</span>
                                </SfxButton>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-stone-950 text-center border-t border-stone-800 shrink-0"><span className="text-[10px] text-stone-600 font-mono uppercase tracking-[0.2em]">{t(language, 'settings.build', { version: APP_VERSION })}</span></div>
                </div>
            </div>

            <React.Suspense fallback={null}>
                <SaveLoadModal isOpen={slModal.isOpen} mode={slModal.mode} onClose={() => setSlModal({ ...slModal, isOpen: false })} onAction={handleSlotAction} />
            </React.Suspense>
            
            <React.Suspense fallback={null}>
                <ConfirmationModal 
                    isOpen={loadConfirm.isOpen} 
                    title={t(language, 'settings.overwrite_progress')} 
                    message={t(language, 'settings.overwrite_progress_desc')} 
                    onConfirm={() => { setLoadConfirm({ ...loadConfirm, isOpen: false }); setSlModal({ ...slModal, isOpen: false }); onClose(); if(onLoadRequest) onLoadRequest(loadConfirm.data, loadConfirm.index!); }} 
                    onCancel={() => setLoadConfirm({ ...loadConfirm, isOpen: false })} 
                />
                <ConfirmationModal
                    isOpen={migrationFailure.isOpen}
                    title={t(language, 'title.save_migration_failed_title')}
                    message={t(language, 'title.save_migration_failed_message', {
                        saveVersion: migrationFailure.saveVersion || '0.0.0',
                        appVersion: APP_VERSION
                    })}
                    confirmLabel={t(language, 'common.accept')}
                    cancelLabel={t(language, 'common.accept')}
                    onConfirm={() => setMigrationFailure({ isOpen: false })}
                    onCancel={() => setMigrationFailure({ isOpen: false })}
                />
            </React.Suspense>
        </>
    );
};

export default SettingsModal;
