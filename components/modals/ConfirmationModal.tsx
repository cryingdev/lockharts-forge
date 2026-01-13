import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { UI_MODAL_LAYOUT } from '../../config/ui-config';

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
        <div 
            className={`${UI_MODAL_LAYOUT.OVERLAY} ${UI_MODAL_LAYOUT.Z_INDEX.CONFIRM} animate-in fade-in duration-200`} 
            onClick={onCancel}
        >
            <div 
                className={`${UI_MODAL_LAYOUT.CONTAINER} border-stone-700 animate-in zoom-in-95 duration-200`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 md:p-6 bg-stone-850 border-b border-stone-800 flex items-center gap-4 shrink-0">
                    <div className={`p-2 rounded-lg shrink-0 ${isDanger ? 'bg-red-950/40 text-red-500 border border-red-900/30' : 'bg-amber-900/30 text-amber-500 border border-amber-800/30'}`}>
                        <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <h3 className="text-base md:text-xl font-bold text-stone-100 font-serif uppercase tracking-tight truncate pr-4">{title}</h3>
                </div>
                
                {/* Body */}
                <div className="flex-1 p-5 md:p-8 overflow-y-auto custom-scrollbar">
                    <p className="text-stone-400 text-xs md:text-sm leading-relaxed text-center italic px-2">
                        {message}
                    </p>
                </div>

                {/* Footer - Vertical stack for mobile */}
                <div className="p-4 md:p-6 bg-stone-900 border-t border-stone-800 flex flex-col-reverse sm:flex-row gap-2 md:gap-3 shrink-0">
                    <button 
                        onClick={onCancel}
                        className="w-full sm:flex-1 py-2.5 md:py-3 rounded-xl text-[10px] md:text-xs font-black text-stone-500 hover:text-stone-200 bg-stone-800 hover:bg-stone-750 transition-all uppercase tracking-widest px-4"
                    >
                        {cancelLabel}
                    </button>
                    <button 
                        onClick={onConfirm}
                        className={`w-full sm:flex-[1.5] py-2.5 md:py-3 rounded-xl text-[10px] md:text-xs font-black transition-all border-b-4 uppercase tracking-widest px-6 ${
                            isDanger 
                            ? 'bg-red-700 hover:bg-red-600 text-white border-red-900' 
                            : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-800'
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