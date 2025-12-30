import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDanger?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    title, 
    message, 
    confirmLabel = "Confirm", 
    cancelLabel = "Cancel", 
    onConfirm, 
    onCancel,
    isDanger = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel}>
            <div 
                className="bg-stone-900 border-2 border-stone-700 rounded-xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-full ${isDanger ? 'bg-red-900/30 text-red-500' : 'bg-amber-900/30 text-amber-500'}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-200 font-serif">{title}</h3>
                </div>
                
                <p className="text-stone-400 mb-6 text-sm leading-relaxed">
                    {message}
                </p>

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-stone-400 hover:bg-stone-800 transition-colors border border-transparent hover:border-stone-700"
                    >
                        {cancelLabel}
                    </button>
                    <button 
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all border ${
                            isDanger 
                            ? 'bg-red-900/50 text-red-200 border-red-800 hover:bg-red-800 hover:border-red-500' 
                            : 'bg-amber-700 text-amber-50 border-amber-600 hover:bg-amber-600'
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;