
import React, { useState, useEffect } from 'react';
import { Save, Upload, X, Trash2, Clock, Coins, Calendar, ChevronRight } from 'lucide-react';
import { getSaveMetadataList, SaveMetadata, deleteSlot } from '../../utils/saveSystem';
import ConfirmationModal from './ConfirmationModal';

interface SaveLoadModalProps {
    isOpen: boolean;
    mode: 'SAVE' | 'LOAD';
    onClose: () => void;
    onAction: (slotIndex: number) => void;
}

const SaveLoadModal: React.FC<SaveLoadModalProps> = ({ isOpen, mode, onClose, onAction }) => {
    const [metaList, setMetaList] = useState<SaveMetadata[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, index: number | null }>({
        isOpen: false,
        index: null
    });
    
    useEffect(() => {
        if (isOpen) {
            setMetaList(getSaveMetadataList());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const slots = [0, 1, 2]; // 3개의 슬롯 지원

    const formatDate = (ts: number) => {
        return new Intl.DateTimeFormat('ko-KR', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(new Date(ts));
    };

    const requestDelete = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setDeleteConfirm({ isOpen: true, index });
    };

    const handleConfirmDelete = () => {
        if (deleteConfirm.index !== null) {
            deleteSlot(deleteConfirm.index);
            setMetaList(getSaveMetadataList());
            setDeleteConfirm({ isOpen: false, index: null });
        }
    };

    const handleSlotClick = (index: number) => {
        onAction(index);
        if (mode === 'SAVE') {
            setTimeout(() => setMetaList(getSaveMetadataList()), 100);
        }
    };

    return (
        <>
            <div className="absolute inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 px-[10%] py-[5%]">
                <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl w-full max-w-md shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-stone-800 bg-stone-850 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-stone-800 p-2 rounded-xl border border-stone-700 text-amber-500">
                                {mode === 'SAVE' ? <Save className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                            </div>
                            <h3 className="font-bold font-serif text-lg text-stone-200 tracking-wide uppercase">
                                {mode === 'SAVE' ? 'Save Game' : 'Load Game'}
                            </h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full text-stone-500 hover:text-stone-300 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Slot List */}
                    <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        {slots.map(index => {
                            const meta = metaList.find(m => m.index === index);
                            return (
                                <div 
                                    key={index}
                                    onClick={() => (meta || mode === 'SAVE') && handleSlotClick(index)}
                                    className={`group relative h-20 p-3 rounded-2xl border-2 transition-all flex flex-col justify-center gap-2 ${
                                        meta 
                                        ? 'bg-stone-800 border-stone-700 hover:border-amber-500 hover:bg-stone-750 cursor-pointer' 
                                        : mode === 'SAVE' 
                                            ? 'bg-stone-900 border-stone-800 border-dashed hover:border-stone-600 text-stone-600 cursor-pointer'
                                            : 'bg-stone-950 border-stone-900 text-stone-600 cursor-not-allowed opacity-60'
                                    }`}
                                >
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-[10px] uppercase tracking-widest text-stone-500 group-hover:text-amber-500">Slot {index + 1}</span>
                                            {meta?.version && (
                                                <span className="px-1.5 py-0.5 bg-stone-950 rounded text-[7px] font-mono font-bold text-stone-600 border border-stone-800 group-hover:border-amber-900/50 group-hover:text-amber-700 transition-colors">
                                                    v{meta.version}
                                                </span>
                                            )}
                                        </div>
                                        {meta && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-[10px] text-stone-500 font-mono">
                                                    <Clock className="w-3 h-3" /> {formatDate(meta.timestamp)}
                                                </div>
                                                <button onClick={(e) => requestDelete(e, index)} className="p-1 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {meta ? (
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                                                    <span className="text-sm font-bold text-stone-200">Day {meta.day}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                                                    <span className="text-sm font-bold text-amber-400 font-mono">{meta.gold}G</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-stone-600 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ) : (
                                        <div className="w-full py-0.5">
                                            <div className="text-center text-[10px] font-black uppercase tracking-[0.2em] italic opacity-70">
                                                {mode === 'SAVE' ? 'Click to Record Progress' : 'Empty Data Slot'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-3 bg-stone-950 text-center border-t border-stone-800">
                        <p className="text-[10px] text-stone-600 font-mono uppercase tracking-tighter">Your progress is kept in browser local storage.</p>
                    </div>
                </div>
            </div>

            <ConfirmationModal 
                isOpen={deleteConfirm.isOpen}
                title="Delete Save Data"
                message={`Are you sure you want to delete the data in Slot ${deleteConfirm.index !== null ? deleteConfirm.index + 1 : ''}? This action cannot be undone.`}
                confirmLabel="Delete Forever"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, index: null })}
                isDanger={true}
            />
        </>
    );
};

export default SaveLoadModal;
