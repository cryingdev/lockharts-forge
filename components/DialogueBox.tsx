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
}

const DialogueBox: React.FC<DialogueBoxProps> = ({ 
  speaker, 
  text, 
  options = [], 
  highlightTerm,
  itemDetail 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showItemTooltip, setShowItemTooltip] = useState(false);
  const isMounted = useRef(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    setShowItemTooltip(false);
    let index = 0;
    const speed = 25; 

    const timer = setInterval(() => {
      if (!isMounted.current) return;
      
      index++;
      if (index > text.length) {
        clearInterval(timer);
        setIsTyping(false);
        setDisplayedText(text);
      } else {
        setDisplayedText(text.slice(0, index));
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedText]);

  const handleSkipTyping = () => {
    if (isTyping) {
      setDisplayedText(text);
      setIsTyping(false);
    }
  };

  // Helper to render text with highlighting
  const renderFormattedText = () => {
    if (!highlightTerm || !displayedText.includes(highlightTerm)) {
      return displayedText;
    }

    const parts = displayedText.split(new RegExp(`(${highlightTerm})`, 'g'));
    return parts.map((part, i) => 
      part === highlightTerm ? (
        <span 
          key={i} 
          className="text-emerald-400 font-black underline decoration-emerald-500/30 underline-offset-4 cursor-help relative group"
          onMouseEnter={() => setShowItemTooltip(true)}
          onMouseLeave={() => setShowItemTooltip(false)}
          onClick={(e) => { e.stopPropagation(); setShowItemTooltip(!showItemTooltip); }}
        >
          {part}
          {/* Tooltip Popup */}
          {itemDetail && (
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
      ) : part
    );
  };

  return (
    <div className="absolute bottom-2 md:bottom-6 left-1/2 -translate-x-1/2 w-[96vw] md:w-[90vw] max-w-6xl z-40 pb-[env(safe-area-inset-bottom)]">
      <div 
        className="w-full h-[30vh] min-h-[120px] bg-stone-950/20 backdrop-blur-3xl border border-white/10 md:border-2 rounded-2xl md:rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.7)] flex flex-row overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500 ring-1 ring-white/10"
      >
        
        {/* Speaker Name Badge - Reduced padding for landscape */}
        <div className="bg-stone-900/10 p-2 md:p-6 border-r border-white/5 flex flex-col items-center gap-1 md:gap-4 w-24 md:w-44 shrink-0 justify-center">
          <div className="w-10 h-10 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-amber-900/20 to-stone-800/40 border border-amber-600/20 flex items-center justify-center shadow-inner">
             <User className="w-5 h-5 md:w-10 md:h-10 text-amber-500/80 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
          </div>
          <div className="flex flex-col items-center">
              <span className="font-black text-amber-50 text-[10px] md:text-xl text-center font-serif leading-tight tracking-tight drop-shadow-md truncate w-full">
                {speaker}
              </span>
          </div>
        </div>

        {/* Text Area Content - Responsive spacing */}
        <div className="flex-1 p-3 md:p-8 relative flex flex-col min-h-0 bg-gradient-to-br from-white/5 to-transparent">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto custom-scrollbar pr-2 cursor-pointer"
            onClick={handleSkipTyping}
          >
            <div 
              className={`text-xs md:text-2xl text-stone-50 leading-snug md:leading-relaxed font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-opacity duration-300 ${isTyping ? 'after:content-["_"] after:inline-block after:w-2 after:h-4 md:after:h-5 after:bg-amber-500 after:animate-pulse after:ml-1' : ''}`}
            >
              {renderFormattedText()}
            </div>
          </div>

          {/* Options - More compact buttons for small height */}
          {!isTyping && options.length > 0 && (
            <div className="mt-2 md:mt-6 flex flex-wrap gap-2 md:gap-4 justify-end animate-in fade-in slide-in-from-right-4 pb-1 shrink-0">
              {options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={option.action}
                  disabled={option.disabled}
                  className={`px-3 md:px-8 py-1.5 md:py-4 rounded-lg md:rounded-xl font-black text-[9px] md:text-sm flex items-center gap-1.5 md:gap-2 transition-all transform active:scale-95 border shadow-2xl ${
                    option.disabled 
                      ? 'bg-stone-800/40 text-stone-600 border-stone-700/30 cursor-not-allowed'
                      : option.variant === 'danger'
                        ? 'bg-red-900/60 text-red-50 border-red-800/50 hover:bg-red-700 hover:border-red-400'
                        : option.variant === 'neutral'
                            ? 'bg-stone-800/60 text-stone-100 border-stone-600 hover:bg-stone-700 hover:border-stone-400'
                            : 'bg-amber-700/80 text-white border-amber-500 hover:bg-amber-600 hover:border-amber-300 hover:shadow-amber-900/60'
                  }`}
                >
                  {option.label}
                  {!option.disabled && <ChevronRight className="w-2.5 h-2.5 md:w-5 md:h-5 opacity-70 group-hover:translate-x-1 transition-transform" />}
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