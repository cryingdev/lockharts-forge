
import React, { useState, useEffect, useRef } from 'react';
import { User, ChevronRight, Coins } from 'lucide-react';

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
}

interface DialogueBoxProps {
  speaker: string;
  text: string;
  options?: DialogueOption[];
  highlightTerm?: string;
  itemDetail?: ItemDetail;
  className?: string;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({ 
  speaker, 
  text, 
  options = [], 
  highlightTerm,
  itemDetail,
  className = "relative w-full z-40"
}) => {
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showItemTooltip, setShowItemTooltip] = useState(false);
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

  // Auto-scroll to bottom when typing, text changes, OR typing status changes (buttons appear)
  // Including isTyping ensures that when buttons appear at the end, the scroll adjusts to the new height.
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
    // Clear any existing timer when text changes
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
            className="text-emerald-400 font-black underline decoration-emerald-500/30 underline-offset-4 cursor-help relative group"
            onMouseEnter={() => setShowItemTooltip(true)}
            onMouseLeave={() => setShowItemTooltip(false)}
            onClick={(e) => { e.stopPropagation(); setShowItemTooltip(!showItemTooltip); }}
          >
            <span>{visiblePart}</span>
            {itemDetail && visibleCountInPart > 0 && (
              <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-3 bg-stone-900/95 backdrop-blur-xl border-2 border-emerald-500/50 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 transition-all duration-300 min-w-max z-[100] ${showItemTooltip ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-stone-800 rounded-xl border border-stone-700 flex items-center justify-center shadow-inner shrink-0">
                    {itemDetail.imageUrl ? (
                      <img src={itemDetail.imageUrl} className="w-7 h-7 md:w-9 md:h-9 object-contain" />
                    ) : (
                      <span className="text-xl md:text-2xl">{itemDetail.icon}</span>
                    )}
                 </div>
                 <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1">Asking Price</span>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-black text-sm md:text-xl">
                      <Coins className="w-4 h-4 md:w-5 md:h-5" />
                      {itemDetail.price} G
                    </div>
                 </div>
                 <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-emerald-500/50"></div>
              </span>
            )}
          </span>
        );
      }
      
      return <React.Fragment key={i}>{visiblePart}</React.Fragment>;
    });
  };

  return (
    <div className={className}>
      <div 
        className="w-full h-[22dvh] min-h-[120px] md:h-[28vh] md:min-h-[160px] bg-stone-950/25 backdrop-blur-3xl border border-white/10 md:border-2 rounded-2xl md:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.7)] flex flex-row overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-500 ring-1 ring-white/10"
      >
        {/* Left Area (Speaker) */}
        <div className="bg-stone-900/20 p-2 md:p-6 border-r border-white/5 flex flex-col items-center gap-1 md:gap-4 w-20 md:w-48 shrink-0 justify-center">
          <div className="w-9 h-9 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-amber-900/30 to-stone-800/40 border border-amber-600/30 flex items-center justify-center shadow-inner ring-1 ring-white/5">
             <User className="w-5 h-5 md:w-10 md:h-10 text-amber-500/90 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          </div>
          <div className="flex flex-col items-center overflow-hidden w-full">
              <span className="font-black text-amber-50 text-[10px] md:text-xl text-center font-serif leading-tight tracking-tight drop-shadow-md truncate w-full px-1">
                {speaker}
              </span>
          </div>
        </div>

        {/* Right Area (Content) */}
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

          {/* Options */}
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
