
import React, { useState } from 'react';
import { Package, Coins, Lock } from 'lucide-react';
import { getAssetUrl } from '../../../../utils';
import { SfxButton } from '../../../common/ui/SfxButton';

const RomanTierOverlay = ({ id }: { id: string }) => {
    if (id === 'scroll_t2') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-amber-500 font-serif font-black text-xs md:text-3xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] translate-y-2">II</span></div>;
    if (id === 'scroll_t3') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-amber-500 font-serif font-black text-xs md:text-3xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] translate-y-2">III</span></div>;
    if (id === 'scroll_t4') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-amber-500 font-serif font-black text-xs md:text-3xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] translate-y-2">IV</span></div>;
    return null;
};

interface MarketItemCardProps {
    item: any;
    stock: number;
    inventoryCount: number;
    multiplier: number;
    isLocked: boolean;
    gold: number;
    onAdd: (id: string, count: number) => void;
    onSetMultiplier: (id: string, val: number) => void;
}

export const MarketItemCard: React.FC<MarketItemCardProps> = ({ item, stock, inventoryCount, multiplier, isLocked, gold, onAdd, onSetMultiplier }) => {
    const isSoldOut = stock <= 0;
    const meta = item.meta;
    const currentPrice = meta.baseValue * multiplier;
    const canAfford = gold >= currentPrice;
    
    // 1순위: ID 기반 파일명 우선 시도
    const [imgSrc, setImgSrc] = useState(getAssetUrl(`${item.id}.png`, 'materials'));

    // 이미지 로드 실패 시 폴백 처리
    const handleImgError = () => {
        if (meta.image && imgSrc !== getAssetUrl(meta.image, 'materials')) {
            // 2순위: 메타데이터에 정의된 image 경로
            setImgSrc(getAssetUrl(meta.image, 'materials'));
        }
    };

    const handleQuickBuy = () => {
        if (isSoldOut || isLocked || !canAfford) return;
        onAdd(item.id, multiplier);
    };

    return (
        <div data-tutorial-id={item.id === 'furnace' ? 'FURNACE_ITEM' : undefined} className={`relative flex flex-col items-center p-2 rounded-2xl border transition-all h-[150px] md:h-[220px] justify-between overflow-hidden shadow-md ${isSoldOut ? 'bg-stone-900 border-stone-800 opacity-40 grayscale' : 'bg-stone-850 border-stone-800 hover:border-stone-600'}`}>
            {isLocked && <div className="absolute top-1 left-1 p-1 bg-red-900/80 rounded border border-red-500 z-20"><Lock className="w-2 h-2 text-white" /></div>}
            {inventoryCount > 0 && <div className="absolute top-1 left-1 px-1 py-0.5 rounded text-[6px] font-black uppercase border z-10 bg-slate-900/80 border-slate-600 text-slate-300 flex items-center gap-1"><Package className="w-2.5 h-2.5" />{inventoryCount}</div>}
            <div className={`absolute top-1 right-1 px-1 py-0.5 rounded text-[6px] font-black tracking-tighter border z-10 ${stock > 0 ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40' : 'bg-red-950/60 text-red-500 border-red-500/40'}`}>{isSoldOut ? 'X' : stock}</div>
            
            {/* 아이템 클릭 영역 (퀵 구매) */}
            <SfxButton 
                onClick={handleQuickBuy}
                disabled={isSoldOut || isLocked || !canAfford}
                className={`flex-1 w-full flex items-center justify-center transition-all mt-1 rounded-lg relative ${isSoldOut || isLocked || !canAfford ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-stone-800/50 active:scale-95'}`}
            >
                <img src={imgSrc} onError={handleImgError} className="w-10 h-10 md:w-24 md:h-24 object-contain drop-shadow-md" />
                <RomanTierOverlay id={item.id} />
            </SfxButton>

            {!isSoldOut && meta.type !== 'KEY_ITEM' && meta.type !== 'SCROLL' && (
                <div className="flex gap-1 mb-1 scale-75 md:scale-100">
                    {[1, 5, 10].map(v => (
                        <SfxButton 
                            key={v} 
                            sfx="switch"
                            disabled={stock < v} 
                            onClick={() => onSetMultiplier(item.id, v)} 
                            className={`w-5 h-5 md:w-7 md:h-7 rounded-full border text-[7px] font-black transition-all ${multiplier === v ? 'bg-amber-600 border-amber-400 text-white' : 'bg-stone-900 border-stone-700 text-stone-500 hover:text-stone-300'}`}
                        >
                            {v}
                        </SfxButton>
                    ))}
                </div>
            )}

            <div className="w-full text-center px-1"><h4 className={`text-[7px] md:text-[11px] font-black leading-none truncate ${meta.type === 'TECHNIQUE' ? 'text-amber-400' : 'text-stone-400'}`}>{meta.name}</h4></div>
            
            {/* 하단 가격 버튼 */}
            <SfxButton 
                onClick={handleQuickBuy}
                disabled={isSoldOut || isLocked || !canAfford}
                className={`w-full py-0.5 md:py-2 rounded-b-xl border-t flex flex-col items-center justify-center font-mono font-black transition-all overflow-hidden ${
                    isSoldOut 
                        ? 'bg-stone-900 border-stone-800 text-stone-700 cursor-not-allowed' 
                        : !canAfford 
                            ? 'bg-red-900 border-red-800 text-red-100 cursor-not-allowed' 
                            : 'bg-stone-950 border-stone-800 text-amber-500 cursor-pointer hover:bg-amber-900/20 active:scale-95'
                }`}
            >
                <div className="flex items-center justify-center gap-1 text-[7px] md:text-sm whitespace-nowrap px-1 w-full">
                    <span className="truncate">{currentPrice.toLocaleString()}</span>
                    <Coins className={`w-2 h-2 md:w-4 md:h-4 shrink-0 ${!canAfford ? 'text-red-400' : 'text-amber-600'}`} />
                </div>
            </SfxButton>

            {isSoldOut && <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 pointer-events-none"><span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded rotate-12 uppercase">Sold Out</span></div>}
        </div>
    );
};
