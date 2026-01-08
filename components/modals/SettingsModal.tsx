import React, { useState } from 'react';
import { Save, Upload, Volume2, LogOut, X, Settings } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import SaveLoadModal from './SaveLoadModal';
import { loadFromSlot } from '../../utils/saveSystem';
import ConfirmationModal from './ConfirmationModal';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuit: () => void;
    onLoadRequest: (data: any, index: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onQuit, onLoadRequest }) => {
    const { state, actions } = useGame();
    const [slModal, setSlModal] = useState<{ isOpen: boolean, mode: 'SAVE' | 'LOAD' }>({ isOpen: false, mode: 'SAVE' });
    const [loadConfirm, setLoadConfirm] = useState<{ isOpen: boolean, data: any, index: number | null }>({
        isOpen: false,
        data: null,
        index: null
    });

    if (!isOpen) return null;

    const handleSlotAction = (slotIndex: number) => {
        if (slModal.mode === 'SAVE') {
            actions.saveGame(slotIndex);
        } else {
            const data = loadFromSlot(slotIndex);
            if (data) {
                setLoadConfirm({ isOpen: true, data, index: slotIndex });
            }
        }
    };

    const handleConfirmLoad = () => {
        if (loadConfirm.data && loadConfirm.index !== null) {
            setLoadConfirm({ ...loadConfirm, isOpen: false });
            setSlModal({ ...slModal, isOpen: false });
            onClose();
            onLoadRequest(loadConfirm.data, loadConfirm.index);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/90 backdrop-blur-md px-[10%] py-[15%] animate-in fade-in duration-200 overflow-hidden">
                <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl w-full max-w-sm h-fit max-h-full min-h-[200px] min-w-[280px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-stone-800 bg-stone-850 shrink-0">
                        <div className="flex items-center gap-3">
                            <Settings className="w-6 h-6 text-amber-500 animate-spin-slow" />
                            <h3 className="font-bold font-serif uppercase tracking-widest text-base text-stone-100">System Menu</h3>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500 transition-colors"><X className="w-6 h-6" /></button>
                    </div>

                    {/* Menu List */}
                    <div className="flex-1 p-5 space-y-3 overflow-y-auto custom-scrollbar">
                        {[
                            { label: 'Save Progress', icon: <Save className="w-5 h-5" />, action: () => setSlModal({ isOpen: true, mode: 'SAVE' }) },
                            { label: 'Load Data', icon: <Upload className="w-5 h-5" />, action: () => setSlModal({ isOpen: true, mode: 'LOAD' }) },
                            { label: 'Quit to Title', icon: <LogOut className="w-5 h-5" />, action: onQuit, variant: 'danger' }
                        ].map((item, idx) => (
                            <button
                                key={idx}
                                onClick={item.action}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                    item.variant === 'danger'
                                        ? 'bg-stone-800 border-stone-700 hover:border-red-500 hover:bg-red-950/20 text-stone-300'
                                        : 'bg-stone-800 border-stone-700 hover:border-amber-500 hover:bg-stone-750 text-stone-300'
                                }`}
                            >
                                <div className={item.variant === 'danger' ? 'text-red-500' : 'text-amber-500'}>{item.icon}</div>
                                <span className="font-black text-[10px] md:text-sm uppercase tracking-widest">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-stone-950 text-center border-t border-stone-800 shrink-0">
                        <span className="text-[10px] text-stone-600 font-mono uppercase tracking-[0.2em]">Build v0.1.36</span>
                    </div>
                </div>
            </div>

            <SaveLoadModal 
                isOpen={slModal.isOpen}
                mode={slModal.mode}
                onClose={() => setSlModal({ ...slModal, isOpen: false })}
                onAction={handleSlotAction}
            />

            <ConfirmationModal 
                isOpen={loadConfirm.isOpen}
                title="Overwrite Progress?"
                message="Loading this file will discard any unsaved progress in your current session. Do you wish to continue?"
                confirmLabel="Confirm Load"
                onConfirm={handleConfirmLoad}
                onCancel={() => setLoadConfirm({ ...loadConfirm, isOpen: false })}
            />
        </>
    );
};

export default SettingsModal;