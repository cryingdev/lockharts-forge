import React from 'react';
import { Save, Upload, Volume2, LogOut, X, Settings } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuit: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onQuit }) => {
    if (!isOpen) return null;

    const menuItems = [
        { 
            label: 'Save Game', 
            icon: <Save className="w-5 h-5" />, 
            action: () => alert("Save functionality coming soon!"),
            disabled: true 
        },
        { 
            label: 'Load Game', 
            icon: <Upload className="w-5 h-5" />, 
            action: () => alert("Load functionality coming soon!"),
            disabled: true 
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
        <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-stone-900 border-2 border-stone-700 rounded-xl w-full max-w-sm shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-850">
                    <div className="flex items-center gap-2 text-stone-200">
                        <Settings className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold font-serif tracking-wide">System Menu</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-stone-800 rounded text-stone-500 hover:text-stone-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Menu List */}
                <div className="p-4 space-y-3">
                    {menuItems.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={item.action}
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
                    <span className="text-[10px] text-stone-600 font-mono uppercase">Lockhart's Forge v0.1.31</span>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;