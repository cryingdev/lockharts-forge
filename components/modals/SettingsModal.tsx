
import React, { useState } from 'react';
import { Save, Upload, Volume2, LogOut, X, Settings } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import SaveLoadModal from './SaveLoadModal';
import { loadFromSlot } from '../../utils/saveSystem';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuit: () => void;
    onLoadRequest: (data: any, index: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onQuit, onLoadRequest }) => {
    const { state, actions } = useGame();
    const [slModal, setSlModal] = useState<{ isOpen: boolean, mode: 'SAVE' | 'LOAD' }>({ isOpen: false, mode: 'SAVE' });
    const VERSION = "0.1.34";
    
    if (!isOpen) return null;

    const handleSlotAction = (index: number) => {
        if (slModal.mode === 'SAVE') {
            // context의 saveGame 액션을 호출하여 활성 슬롯 동기화 처리
            actions.saveGame(index);
            setSlModal({ ...slModal, isOpen: false });
        } else {
            const data = loadFromSlot(index);
            if (data) {
                if (confirm("저장된 데이터를 불러오시겠습니까? 현재 진행 상황은 사라집니다.\n(안전한 로딩을 위해 타이틀 화면으로 이동합니다.)")) {
                    setSlModal({ ...slModal, isOpen: false });
                    onClose();
                    // App.tsx의 핸들러를 통해 로드 프로세스 시작
                    onLoadRequest(data, index);
                }
            }
        }
    };

    const menuItems = [
        { 
            label: 'Save Game', 
            icon: <Save className="w-5 h-5" />, 
            action: () => setSlModal({ isOpen: true, mode: 'SAVE' }),
            disabled: false 
        },
        { 
            label: 'Load Game', 
            icon: <Upload className="w-5 h-5" />, 
            action: () => setSlModal({ isOpen: true, mode: 'LOAD' }),
            disabled: false 
        },
        { 
            label: 'Audio Settings', 
            icon: <Volume2 className="w-5 h-5" />, 
            action: () => alert("Audio settings coming soon!"),
            disabled: true 
        },
        { 
            label: 'Return to Title', 
            icon: <LogOut className="w-5 h-5" />, 
            action: onQuit,
            variant: 'danger'
        }
    ];

    return (
        <>
            <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-stone-900 border-2 border-stone-700 rounded-xl w-full max-w-sm shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-850">
                        <div className="flex items-center gap-2 text-stone-200">
                            <Settings className="w-5 h-5 text-amber-500" />
                            <h3 className="font-bold font-serif tracking-wide">System Menu</h3>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-stone-800 rounded text-stone-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Menu List */}
                    <div className="p-4 space-y-3">
                        {menuItems.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={item.action}
                                disabled={item.disabled}
                                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all group ${
                                    item.disabled 
                                    ? 'bg-stone-900/50 border-stone-800 text-stone-600 cursor-not-allowed'
                                    : item.variant === 'danger'
                                        ? 'bg-stone-800 border-stone-700 hover:border-red-500 hover:bg-red-900/10 text-stone-300 hover:text-red-400'
                                        : 'bg-stone-800 border-stone-700 hover:border-amber-500 hover:bg-stone-750 text-stone-300 hover:text-amber-100'
                                }`}
                            >
                                <div className={`${
                                    item.disabled ? 'text-stone-700' : 
                                    item.variant === 'danger' ? 'text-red-500' : 'text-amber-500'
                                }`}>
                                    {item.icon}
                                </div>
                                <span className="font-bold text-sm">{item.label}</span>
                                {item.disabled && <span className="ml-auto text-[10px] uppercase font-bold tracking-wider text-stone-700">Soon</span>}
                            </button>
                        ))}
                    </div>

                    {/* Footer Info */}
                    <div className="p-3 bg-stone-950 text-center border-t border-stone-800">
                        <span className="text-[10px] text-stone-600 font-mono uppercase">Lockhart's Forge v{VERSION}</span>
                    </div>
                </div>
            </div>

            <SaveLoadModal 
                isOpen={slModal.isOpen}
                mode={slModal.mode}
                onClose={() => setSlModal({ ...slModal, isOpen: false })}
                onAction={handleSlotAction}
            />
        </>
    );
};

export default SettingsModal;
