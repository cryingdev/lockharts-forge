import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, ChevronRight, Coins, Package, Lock } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { materials } from '../data/materials';

interface DialogueOption {
  label: string;
  action: () => void;
  variant?: 'primary' | 'danger' | 'neutral';
  disabled?: boolean;
}

interface ItemDetail {
  icon: string;
  imageUrl?: string;
  price: number;
  requirements?: { id: string; count: number }[];
  isUnlocked?: boolean;
}

// Added speakerAvatar to DialogueBoxProps to resolve TS error in AssaultNavigator.tsx
interface DialogueBoxProps {
  speaker: string;
  text: string;
  options?: DialogueOption[];
  highlightTerm?: string;
  itemDetail?: ItemDetail;
  className?: string;
  speakerAvatar?: string;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({ 
  speaker, 
  text, 
  options = [], 
  highlightTerm,
  itemDetail,
  className = "relative w-full z-40",
  speakerAvatar // Destructure speakerAvatar prop
}) => {
  const { state } = useGame();
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showItemTooltip, setShowItemTooltip] = useState(false);
  const [tooltipCoords, setTooltipCoords] = useState({ x: 0, y: 0 });
  
  const isMounted = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { 
      isMounted.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (textContainerRef.current) {
      const container = textContainerRef.current;
      const scrollHandle = requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
      return () => cancelAnimationFrame(scrollHandle);
    }
  }, [displayedIndex, text, isTyping]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setDisplayedIndex(0);
    setIsTyping(true);
    setShowItemTooltip(false);
    let index = 0;
    const speed = 25; 

    timerRef.current = setInterval(() => {
      if (!isMounted.current) return;
      
      index++;
      if (index > text.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsTyping(false);
        setDisplayedIndex(text.length);
      } else {
        setDisplayedIndex(index);
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text]);

  const handleSkipTyping = () => {
    if (isTyping) {
      if (timerRef.current) clearInterval(timerRef.current);
      setDisplayedIndex(text.length);
      setIsTyping(false);
    }
  };

  const getInventoryCount = (id: string) => {
    return state.inventory.find(i => i.id === id)?.quantity || 0;
  };

  const updateTooltipPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipCoords({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const renderFormattedText = () => {
    if (!highlightTerm) {
      return <span>{text.slice(0, displayedIndex)}</span>;
    }

    const parts = text.split(new RegExp(`(${highlightTerm})`, 'g'));
    let charCount = 0;

    return parts.map((part, i) => {
      const startChar = charCount;
      const endChar = charCount + part.length;
      charCount = endChar;

      const visibleCountInPart = Math.max(0, Math.min(part.length, displayedIndex - startChar));
      if (visibleCountInPart <= 0) return null;

      const visiblePart = part.slice(0, visibleCountInPart);

      if (part === highlightTerm) {
        return (
          <span 
            key={i} 
            className="text-amber-400 font-black underline decoration-amber-500/50 underline-offset-4 cursor-help relative inline-block pointer-events-auto"
            onMouseEnter={(e) => { updateTooltipPosition(e); setShowItemTooltip(true); }}
            onMouseLeave={() => setShowItemTooltip(false)}
            onClick={(e) => { e.stopPropagation(); updateTooltipPosition(e); setShowItemTooltip(!showItemTooltip); }}
          >
            {visiblePart}
          </span>
        );
      }
      
      return <React.Fragment key={i}>{visiblePart}</React.Fragment>;
    });
  };

  // Tooltip content rendered via Portal
  const tooltipElement = showItemTooltip && itemDetail && createPortal(
    <div 
      className="fixed z-[10000] pointer-events-none p-3 md:p-4 bg-stone-900/98 backdrop-blur-2xl border-2 border-stone-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] w-[80vw] max-w-[240px] md:max-w-[320px] animate-in fade-in zoom-in-95 duration-200"
      style={{ 
        left: `${Math.max(130, Math.min(window.innerWidth - 130, tooltipCoords.x))}px`, 
        top: `${tooltipCoords.y - 10}px`,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="flex items-center gap-3 mb-2 md:mb-3 pb-2 md:pb-3 border-b border-white/10">
        <div className="w-10 h-10 md:w-16 md:h-16 bg-stone-950 rounded-xl border-2 border-stone-800 flex items-center justify-center shadow-inner shrink-0 overflow-hidden">
          {itemDetail.imageUrl ? (
            <img src={itemDetail.imageUrl} className="w-7 h-7 md:w-11 md:h-11 object-contain" alt="item" />
          ) : (
            <span className="text-xl md:text-3xl">{itemDetail.icon}</span>
          )}
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[7px] md:text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1">Price</span>
          <div className="flex items-center gap-1 text-emerald-400 font-mono font-black text-xs md:text-xl">
            <Coins className="w-3 h-3 md:w-5 md:h-5" />
            {itemDetail.price.toLocaleString()} G
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="text-[7px] md:text-[9px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
          <Package className="w-2 h-2 md:w-3 md:h-3" /> Required Materials
        </h5>
        
        {itemDetail.isUnlocked ? (
          <div className="grid gap-1">
            {itemDetail.requirements?.map(req => {
              const hasCount = getInventoryCount(req.id);
              const isEnough = hasCount >= req.count;
              const mat = Object.values(materials).find(m => m.id === req.id);
              return (
                <div key={req.id} className="flex justify-between items-center text-[8px] md:text-xs">
                  <span className={`truncate mr-2 font-bold tracking-tight ${isEnough ? 'text-stone-300' : 'text-red-400'}`}>
                    {mat?.name || req.id}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`font-mono font-black ${isEnough ? 'text-stone-500' : 'text-red-500'}`}>
                      {hasCount}/{req.count}
                    </span>
                    <div className={`w-1 h-1 rounded-full ${isEnough ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 md:py-6 flex flex-col items-center justify-center bg-black/40 rounded-xl border-2 border-dashed border-stone-800 animate-in fade-in duration-500">
            <div className="relative">
                <span className="text-4xl md:text-7xl font-serif text-stone-800 font-black animate-pulse">?</span>
                <Lock className="absolute -top-0.5 -right-0.5 w-3 h-3 md:w-5 md:h-5 text-stone-700" />
            </div>
            <div className="mt-2 md:mt-4 flex flex-col items-center text-center px-2">
              <span className="text-[7px] md:text-[10px] text-stone-600 font-black uppercase tracking-widest italic leading-none">Unknown</span>
              <p className="mt-1 text-[6px] md:text-[8px] text-stone-700 font-bold max-w-[120px] md:max-w-[160px] uppercase leading-relaxed tracking-tighter">
                Requires Knowledge Scroll
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Tooltip Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] md:border-l-[12px] border-l-transparent border-r-[8px] md:border-r-[12px] border-r-transparent border-t-[8px] md:border-t-[12px] border-t-stone-900/98"></div>
    </div>,
    document.body
  );

  return (
    <div className={className}>
      {tooltipElement}

      <div 
        className="w-full h-[22dvh] min-h-[120px] md:h-[28vh] md:min-h-[160px] bg-stone-950/25 backdrop-blur-3xl border border-white/10 md:border-2 rounded-2xl md:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.7)] flex flex-row overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-500 ring-1 ring-white/10"
      >
        <div className="bg-stone-900/20 p-2 md:p-6 border-r border-white/5 flex flex-col items-center gap-1 md:gap-4 w-20 md:w-48 shrink-0 justify-center">
          <div className="w-9 h-9 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-amber-900/30 to-stone-800/40 border border-amber-600/30 flex items-center justify-center shadow-inner ring-1 ring-white/5 overflow-hidden">
             {/* Render speaker avatar if provided, otherwise use generic User icon */}
             {speakerAvatar ? (
               <img src={speakerAvatar} className="w-full h-full object-cover" alt={speaker} />
             ) : (
               <User className="w-5 h-5 md:w-10 md:h-10 text-amber-500/90 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
             )}
          </div>
          <div className="flex flex-col items-center overflow-hidden w-full">
              <span className="font-black text-amber-50 text-[10px] md:text-xl text-center font-serif leading-tight tracking-tight drop-shadow-md truncate w-full px-1">
                {speaker}
              </span>
          </div>
        </div>

        <div 
          className="flex-1 p-2.5 md:p-8 relative flex flex-col min-h-0 bg-gradient-to-br from-white/5 to-transparent cursor-pointer"
          onClick={handleSkipTyping}
        >
          <div 
            ref={textContainerRef}
            className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 md:pr-2 mb-1 md:mb-2 min-h-0 ${isTyping ? 'typing-active' : ''}`}
            style={{ scrollBehavior: isTyping ? 'auto' : 'smooth' }}
          >
            <div 
              className="text-stone-50 leading-snug md:leading-relaxed font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-opacity duration-300 break-words whitespace-pre-wrap"
              style={{ fontSize: 'clamp(0.9rem, 2.4dvh, 1.6rem)' }}
            >
              {renderFormattedText()}
            </div>
          </div>

          {!isTyping && options.length > 0 && (
            <div className="mt-auto pt-2 flex flex-wrap gap-1.5 md:gap-4 justify-end animate-in fade-in slide-in-from-right-4 pb-1 shrink-0">
              {options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); option.action(); }}
                  disabled={option.disabled}
                  className={`px-4 md:px-10 py-1.5 md:py-4 rounded-lg md:rounded-xl font-black text-[9px] md:text-sm flex items-center gap-1.5 md:gap-3 transition-all transform active:scale-95 border shadow-2xl ${
                    option.disabled 
                      ? 'bg-stone-800/40 text-stone-600 border-stone-700/30 cursor-not-allowed'
                      : option.variant === 'danger'
                        ? 'bg-red-900/60 text-red-50 border-red-800/50 hover:bg-red-700 hover:border-red-400'
                        : option.variant === 'neutral'
                            ? 'bg-stone-800/60 text-stone-100 border-stone-600 hover:bg-stone-750 hover:border-stone-400'
                            : 'bg-amber-700/80 text-white border-amber-500 hover:bg-amber-600 hover:border-amber-300 hover:shadow-amber-900/60'
                  }`}
                >
                  <span className="whitespace-nowrap">{option.label}</span>
                  {!option.disabled && <ChevronRight className="hidden xs:block w-2.5 md:w-5 h-2.5 md:h-5 opacity-70 group-hover:translate-x-1 transition-transform" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DialogueBox;