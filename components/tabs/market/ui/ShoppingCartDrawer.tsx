import React, { useState } from 'react';
import { ShoppingCart, X, Minus, Plus, ShoppingBag, Coins } from 'lucide-react';
import { materials } from '../../../../data/materials';
import { getAssetUrl } from '../../../../utils';

const RomanTierOverlay = ({ id }: { id: string }) => {
    if (id === 'scroll_t2') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-amber-500 font-serif font-black text-[10px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] translate-y-0.5">II</span></div>;
    if (id === 'scroll_t3') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-amber-500 font-serif font-black text-[10px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] translate-y-0.5">III</span></div>;
    if (id === 'scroll_t4') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-amber-500 font-serif font-black text-[10px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] translate-y-0.5">IV</span></div>;
    return null;
};

const CartItemImage = ({ id, meta }: { id: string, meta: any }) => {
    const [imgSrc, setImgSrc] = useState(getAssetUrl(`${id}.png`));
    
    const handleImgError = () => {
        if (meta?.image && imgSrc !== getAssetUrl(meta.image)) {
            setImgSrc(getAssetUrl(meta.image));
        }
    };

    return (
        <div className="w-10 h-10 bg-stone-950 rounded-lg flex items-center justify-center shrink-0 shadow-inner relative">
            <img src={imgSrc} onError={handleImgError} className="w-8 h-8 object-contain" />
            <RomanTierOverlay id={id} />
        </div>
    );
};

interface ShoppingCartDrawerProps {
    isOpen: boolean;
    cart: Record<string, number>;
    total: number;
    gold: number;
    onRemove: (id: string) => void;
    onAdd: (id: string, count: number) => void;
    onDelete: (id: string) => void;
    onBuy: () => void;
}

export const ShoppingCartDrawer: React.FC<ShoppingCartDrawerProps> = ({ isOpen, cart, total, gold, onRemove, onAdd, onDelete, onBuy }) => {
    return (
        <div className={`h-full bg-stone-950/80 border-l border-stone-800 shadow-2xl flex flex-col transition-all duration-500 ${isOpen ? 'w-48 md:w-72' : 'w-0 overflow-hidden border-none'}`}>
            <div className="bg-stone-850 p-4 border-b border-stone-800 shrink-0"><h3 className="font-serif font-black text-stone-100 uppercase truncate">Cart Contents</h3></div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {Object.entries(cart).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-10"><ShoppingCart className="w-10 h-10 mb-2"/><p className="text-[10px] font-black uppercase">Empty</p></div>
                ) : (
                    Object.entries(cart).map(([id, count]) => {
                        const meta = materials[id];
                        // Fixed: Added explicit type cast to count to ensure arithmetic operation is valid
                        const currentCount = count as number;
                        return (
                            <div key={id} className="bg-stone-900/60 p-2 rounded-xl border border-stone-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <CartItemImage id={id} meta={meta} />
                                    <div className="flex-1 min-w-0"><div className="text-stone-100 font-bold text-[10px] truncate">{meta?.name || id}</div><div className="text-amber-600 font-mono text-[9px] font-black">{ (meta?.baseValue || 0) * currentCount } G</div></div>
                                    <button onClick={() => onDelete(id)} className="text-stone-600 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                </div>
                                <div className="flex items-center justify-between bg-black/40 rounded p-1">
                                    <span className="text-[10px] font-mono font-black text-stone-200 ml-1">{count}</span>
                                    <div className="flex gap-1"><button onClick={() => onRemove(id)} className="w-6 h-6 bg-stone-800 rounded border border-stone-700 text-stone-300 active:scale-90"><Minus className="w-3.5 h-3.5 mx-auto" /></button><button onClick={() => onAdd(id, 1)} className="w-6 h-6 bg-stone-800 rounded border border-stone-700 text-stone-300 active:scale-90"><Plus className="w-3.5 h-3.5 mx-auto" /></button></div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <div className="bg-stone-850 p-4 border-t border-stone-800 space-y-2 shrink-0">
                <div className="flex justify-between items-center text-[10px] text-stone-500 font-bold uppercase"><span>Total</span><span className={`text-lg font-mono font-black ${total > gold ? 'text-red-500' : 'text-emerald-400'}`}>{total}G</span></div>
                <button onClick={onBuy} disabled={total === 0 || total > gold} className={`w-full py-3 rounded-xl font-black text-[10px] transition-all flex items-center justify-center gap-2 shadow-xl ${total > gold ? 'bg-red-900/60 text-red-100 border border-red-500/50' : total === 0 ? 'bg-stone-800 text-stone-600 opacity-60' : 'bg-amber-600 hover:bg-amber-500 text-white'}`}><ShoppingBag className="w-4 h-4" /><span>{total > gold ? 'Shortage' : 'Buy Now'}</span></button>
            </div>
        </div>
    );
};