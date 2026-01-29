
import React, { useState } from 'react';
import { Save, Upload, Volume2, VolumeX, LogOut, X, Settings, Layout, Check, Music, Zap } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import SaveLoadModal from './SaveLoadModal';
import { loadFromSlot } from '../../utils/saveSystem';
import ConfirmationModal from './ConfirmationModal';
import { SfxButton } from '../common/ui/SfxButton';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuit: () => void;
    onLoadRequest: (data: any, depth: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onQuit, onLoadRequest }) => {
    const { state, actions } = useGame();
    const [slModal, setSlModal] = useState<{ isOpen: boolean, mode: 'SAVE' | 'LOAD' }>({ isOpen: false, mode: 'SAVE' });
    const [loadConfirm, setLoadConfirm] = useState<{ isOpen: boolean, data: any, index: number | null }>({
        isOpen: false,
        data: null,
        index: null
    });

    const APP_VERSION = "0.1.43a";
    if (!isOpen) return null;

    const audio = state.settings.audio;

    const handleSlotAction = (slotIndex: number) => {
        if (slModal.mode === 'SAVE') {
            actions.saveGame(slotIndex);
        } else {
            const data = loadFromSlot(slotIndex);
            if (data) {
                if (data.version !== APP_VERSION) {
                    actions.showToast(`Load Failed: Version mismatch.`);
                    return;
                }
                setLoadConfirm({ isOpen: true, data, index: slotIndex });
            }
        }
    };

    const VolumeSlider = ({ label, value, icon: Icon, onChange, disabled }: { label: string, value: number, icon: any, onChange: (v: number) => void, disabled?: boolean }) => (
        <div className={`flex flex-col gap-1.5 p-3 rounded-xl border transition-all w-full ${disabled ? 'bg-stone-900/40 border-stone-800/50 opacity-40 grayscale' : 'bg-stone-800/40 border-stone-700/50'}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${!disabled && value > 0 ? 'text-amber-500' : 'text-stone-600'}`} />
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{label}</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-stone-500">{Math.round(value * 100)}%</span>
            </div>
            <input 
                type="range" min="0" max="1" step="0.01" 
                value={value} 
                disabled={disabled}
                onChange={(e) => !disabled && onChange(parseFloat(e.target.value))}
                className={`w-full h-2.5 bg-stone-900 rounded-lg appearance-none cursor-pointer accent-amber-600 ${disabled ? 'cursor-not-allowed' : ''}`}
            />
        </div>
    );

    return (
        <>
            <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/90 backdrop-blur-md px-[10%] py-[15%] animate-in fade-in duration-200 overflow-hidden">
                <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl w-[90vw] max-w-[420px] h-fit max-h-full min-h-[200px] min-w-[280px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 mx-auto">
                    
                    <div className="flex items-center justify-between p-5 border-b border-stone-800 bg-stone-850 shrink-0">
                        <div className="flex items-center gap-3">
                            <Settings className="w-6 h-6 text-amber-500 animate-spin-slow" />
                            <h3 className="font-bold font-serif uppercase tracking-widest text-base text-stone-100">System Menu</h3>
                        </div>
                        <SfxButton onClick={onClose} className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500 transition-colors"><X className="w-6 h-6" /></SfxButton>
                    </div>

                    <div className="flex-1 p-5 space-y-6 overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                            <h4 className="text-[9px] font-black text-stone-500 uppercase tracking-widest px-1">Persistence</h4>
                            <div className="flex flex-col gap-2.5">
                                <SfxButton onClick={() => setSlModal({ isOpen: true, mode: 'SAVE' })} className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-700 bg-stone-800 hover:border-amber-500 hover:bg-stone-750 text-stone-300 transition-all shadow-md active:scale-95">
                                    <Save className="w-5 h-5 text-amber-500" /><div className="flex flex-col items-start leading-none"><span className="font-black text-[11px] uppercase tracking-widest">Manual Save</span><span className="text-[8px] text-stone-500 uppercase font-bold mt-1">Record progress</span></div>
                                </SfxButton>
                                <SfxButton onClick={() => setSlModal({ isOpen: true, mode: 'LOAD' })} className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-700 bg-stone-800 hover:border-stone-500 hover:bg-stone-750 text-stone-300 transition-all shadow-md active:scale-95">
                                    <Upload className="w-5 h-5 text-indigo-400" /><div className="flex flex-col items-start leading-none"><span className="font-black text-[11px] uppercase tracking-widest">Restore Data</span><span className="text-[8px] text-stone-500 uppercase font-bold mt-1">Load records</span></div>
                                </SfxButton>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h4 className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Audio Engine</h4>
                                <SfxButton sfx="switch" className="flex items-center gap-2" onClick={() => actions.updateSettings({ audio: { ...audio, masterEnabled: !audio.masterEnabled } })}>
                                    <span className="text-[8px] font-black text-stone-600 uppercase">{audio.masterEnabled ? 'ENABLED' : 'MUTED'}</span>
                                    <div className={`w-8 h-4 rounded-full p-0.5 transition-all duration-300 ${audio.masterEnabled ? 'bg-amber-600' : 'bg-stone-800'}`}><div className={`w-3 h-3 bg-white rounded-full transition-all duration-300 ${audio.masterEnabled ? 'translate-x-4' : 'translate-x-0'}`} /></div>
                                </SfxButton>
                            </div>
                            <div className="flex flex-col gap-2.5">
                                <VolumeSlider label="Master Output" value={audio.masterVolume} disabled={!audio.masterEnabled} icon={audio.masterEnabled && audio.masterVolume > 0 ? Volume2 : VolumeX} onChange={(v) => actions.updateSettings({ audio: { ...audio, masterVolume: v, masterEnabled: v > 0 } })} />
                                <VolumeSlider label="Music Tracks" value={audio.musicVolume} disabled={!audio.masterEnabled} icon={Music} onChange={(v) => actions.updateSettings({ audio: { ...audio, musicVolume: v, musicEnabled: v > 0 } })} />
                                <VolumeSlider label="Sound Effects" value={audio.sfxVolume} disabled={!audio.masterEnabled} icon={Zap} onChange={(v) => actions.updateSettings({ audio: { ...audio, sfxVolume: v, sfxEnabled: v > 0 } })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-[9px] font-black text-stone-500 uppercase tracking-widest px-1">Interface</h4>
                            <SfxButton sfx="switch" className="w-full bg-stone-800/60 border border-stone-700 rounded-xl p-4 flex items-center justify-between group" onClick={() => actions.updateSettings({ showLogTicker: !state.settings.showLogTicker })}>
                                <div className="flex items-center gap-3"><Layout className="w-5 h-5 text-indigo-400" /><div className="flex flex-col items-start"><span className="font-black text-xs uppercase tracking-widest text-stone-200">Header Logs</span><span className="text-[9px] text-stone-500 uppercase font-bold">Show/Hide Log Ticker</span></div></div>
                                <div className={`w-10 h-6 rounded-full p-1 transition-all duration-300 ${state.settings.showLogTicker ? 'bg-amber-600' : 'bg-stone-900 border border-stone-700'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${state.settings.showLogTicker ? 'translate-x-4' : 'translate-x-0'}`} /></div>
                            </SfxButton>
                        </div>

                        <div className="pt-2 pb-4">
                            <SfxButton onClick={onQuit} className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-700 bg-red-950/10 hover:border-red-500 hover:bg-red-950/20 text-red-400 transition-all">
                                <div className="text-red-500"><LogOut className="w-5 h-5" /></div><span className="font-black text-xs uppercase tracking-widest">Quit to Title</span>
                            </SfxButton>
                        </div>
                    </div>

                    <div className="p-3 bg-stone-950 text-center border-t border-stone-800 shrink-0"><span className="text-[10px] text-stone-600 font-mono uppercase tracking-[0.2em]">Build v{APP_VERSION}</span></div>
                </div>
            </div>

            <SaveLoadModal isOpen={slModal.isOpen} mode={slModal.mode} onClose={() => setSlModal({ ...slModal, isOpen: false })} onAction={handleSlotAction} />
            
            <ConfirmationModal 
                isOpen={loadConfirm.isOpen} 
                title="Overwrite Progress?" 
                message="Loading will discard unsaved progress." 
                onConfirm={() => { setLoadConfirm({ ...loadConfirm, isOpen: false }); setSlModal({ ...slModal, isOpen: false }); onClose(); onLoadRequest(loadConfirm.data, loadConfirm.index!); }} 
                onCancel={() => setLoadConfirm({ ...loadConfirm, isOpen: false })} 
            />
        </>
    );
};

export default SettingsModal;
