import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Coins, Package, Lock } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { materials } from '../data/materials';
import { getAssetUrl } from '../utils';
import { t } from '../utils/i18n';
import { useAudio } from '../hooks/useAudio';
import { SfxButton } from './common/ui/SfxButton';

import { DialogueOption } from '../types/game-state';

interface ItemDetail {
  id: string;
  image?: string; 
  icon: string;
  price: number;
  requirements?: { id: string; count: number }[];
  isUnlocked?: boolean;
}

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
  speakerAvatar
}) => {
  const { state } = useGame();
  const language = state.settings.language;
  const { playClick } = useAudio();
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showItemTooltip, setShowItemTooltip] = useState(false);
  const [tooltipCoords, setTooltipCoords] = useState({ x: 0, y: 0 });
  const [imgError, setImgError] = useState(false);
  const [textPage, setTextPage] = useState(0);
  
  const isMounted = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const textPages = text.split('\n').filter(segment => segment.trim().length > 0);
  const hasTextPaging = textPages.length > 1;
  const currentText = textPages[textPage] ?? text;
  const hasMoreTextPages = textPage < textPages.length - 1;
  const hasDenseOptions = options.length >= 3;
  const dialogShellClass = hasDenseOptions
    ? "w-full h-[31dvh] min-h-[248px] md:h-[34vh] md:min-h-[288px] bg-stone-900/92 backdrop-blur-3xl border-[2px] md:border-[3px] border-stone-500/45 rounded-2xl md:rounded-3xl shadow-[0_28px_80px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.45)] overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-500 ring-1 ring-white/8"
    : "w-full h-[24dvh] min-h-[158px] md:h-[29vh] md:min-h-[188px] bg-stone-900/92 backdrop-blur-3xl border-[2px] md:border-[3px] border-stone-500/45 rounded-2xl md:rounded-3xl shadow-[0_28px_80px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.45)] overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-500 ring-1 ring-white/8";

  useEffect(() => {
    isMounted.current = true;
    return () => { 
      isMounted.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      setShowItemTooltip(false);
    };
  }, []);

  useEffect(() => {
    if (!showItemTooltip) return;
    const handleGlobalClick = () => setShowItemTooltip(false);
    window.addEventListener('mousedown', handleGlobalClick);
    window.addEventListener('touchstart', handleGlobalClick);
    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [showItemTooltip]);

  useEffect(() => {
    if (!textContainerRef.current) return;
    const container = textContainerRef.current;
    const scrollHandle = requestAnimationFrame(() => {
      container.scrollTop = 0;
    });
    return () => cancelAnimationFrame(scrollHandle);
  }, [currentText, textPage]);

  useLayoutEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setDisplayedIndex(0);
    setIsTyping(true);
    setShowItemTooltip(false);
    setImgError(false);
    let index = 0;
    const speed = 25; 

    timerRef.current = setInterval(() => {
      if (!isMounted.current) return;
      
      index++;
      if (index > currentText.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsTyping(false);
        setDisplayedIndex(currentText.length);
      } else {
        setDisplayedIndex(index);
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentText]);

  useEffect(() => {
    setTextPage(0);
  }, [text]);

  const handleSkipTyping = () => {
    if (isTyping) {
      if (timerRef.current) clearInterval(timerRef.current);
      setDisplayedIndex(currentText.length);
      setIsTyping(false);
      playClick();
    }
  };

  const handleAdvanceTextPage = () => {
    if (isTyping) {
      handleSkipTyping();
      return;
    }
    if (!hasMoreTextPages) return;
    playClick();
    setTextPage(prev => prev + 1);
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
      return <span>{currentText.slice(0, displayedIndex)}</span>;
    }

    const parts = currentText.split(new RegExp(`(${highlightTerm})`, 'g'));
    let charCount = 0;

    return parts.map((part, i) => {
      const startChar = charCount;
      const endChar = charCount + part.length;
      charCount = endChar;

      const visibleCountInPart = Math.max(0, Math.min(part.length, displayedIndex - startChar));
      if (visibleCountInPart <= 0) return null;

      const visiblePart = part.slice(0, visibleCountInPart);

      if (part === highlightTerm) {
        const isUnlocked = itemDetail?.isUnlocked ?? true;
        return (
          <span 
            key={i} 
            className={`text-amber-400 font-black underline decoration-amber-500/50 underline-offset-4 relative inline-block pointer-events-auto ${isUnlocked ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={(e) => { 
                e.stopPropagation(); 
                if (!isUnlocked) return;
                updateTooltipPosition(e); 
                setShowItemTooltip(!showItemTooltip); 
                playClick();
            }}
          >
            {visiblePart}
          </span>
        );
      }
      
      return <React.Fragment key={i}>{visiblePart}</React.Fragment>;
    });
  };

  const tooltipElement = showItemTooltip && itemDetail && createPortal(
    <div 
      className="fixed z-[10000] pointer-events-auto p-3 md:p-4 bg-stone-900/98 backdrop-blur-2xl border-2 border-stone-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] w-[80vw] max-w-[240px] md:max-w-[320px] animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
      style={{ 
        left: `${Math.max(130, Math.min(window.innerWidth - 130, tooltipCoords.x))}px`, 
        top: `${tooltipCoords.y - 10}px`,
        transform: 'translate(-50%, -100%)'
      }}
      onClick={(e) => {
        e.stopPropagation();
        setShowItemTooltip(false);
        playClick();
      }}
    >
      <div className="flex items-center gap-3 mb-2 md:mb-3 pb-2 md:pb-3 border-b border-white/10">
        <div className={`w-10 h-10 md:w-16 md:h-16 bg-stone-950 rounded-xl border-2 flex items-center justify-center shadow-inner shrink-0 overflow-hidden ${!itemDetail.isUnlocked ? 'border-amber-600/50' : 'border-stone-800'}`}>
          {!itemDetail.isUnlocked ? (
            <span className="text-2xl md:text-4xl font-serif text-amber-500 font-black animate-pulse">?</span>
          ) : (
            <>
              {!imgError ? (
                <img 
                  src={getAssetUrl(itemDetail.image || `${itemDetail.id}.png`, 'equipments')} 
                  onError={(e) => {
                    console.error('[Tooltip Debug] Image Failed to Load:', (e.target as HTMLImageElement).src);
                    setImgError(true);
                  }}
                  className="w-7 h-7 md:w-11 md:h-11 object-contain" 
                  alt="item" 
                />
              ) : (
                <span className="text-xl md:text-3xl">{itemDetail.icon}</span>
              )}
            </>
          )}
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[7px] md:text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1">Price</span>
          <div className={`flex items-center gap-1 font-mono font-black text-xs md:text-xl ${!itemDetail.isUnlocked ? 'text-stone-600' : 'text-emerald-400'}`}>
            <Coins className="w-3 h-3 md:w-5 md:h-5" />
            {!itemDetail.isUnlocked ? '???,???' : itemDetail.price.toLocaleString()} G
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="text-[7px] md:text-[9px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
          <Package className="w-2 h-2 md:w-3 md:h-3" /> Required Materials
        </h5>
        
        <div className="grid gap-1">
          {itemDetail.requirements && itemDetail.requirements.length > 0 ? (
            itemDetail.requirements.map((req, idx) => {
              const isClue = idx === 0; 
              const shouldShow = itemDetail.isUnlocked || isClue;
              
              if (!shouldShow) {
                return (
                  <div key={req.id} className="flex justify-between items-center text-[8px] md:text-xs opacity-40">
                    <span className="truncate mr-2 font-bold tracking-tight text-stone-600">
                      ???
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-mono font-black text-stone-700">
                        ? / ?
                      </span>
                      <div className="w-1 h-1 rounded-full bg-stone-800" />
                    </div>
                  </div>
                );
              }

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
            })
          ) : (
            <div className="text-[8px] md:text-xs text-stone-600 italic">No specific requirements found.</div>
          )}
        </div>

        {!itemDetail.isUnlocked && (
          <div className="mt-2 pt-2 border-t border-white/5 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 text-amber-600/80">
              <Lock className="w-2.5 h-2.5 md:w-3 md:h-3" />
              <span className="text-[6px] md:text-[8px] font-black uppercase tracking-widest">Locked Knowledge</span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );

  const renderedOptions = hasMoreTextPages
    ? [{ label: t(language, 'common.continue'), action: handleAdvanceTextPage, variant: 'primary' as const }]
    : options;

  return (
    <div className={className} onClick={(e) => { if (showItemTooltip) { e.stopPropagation(); setShowItemTooltip(false); playClick(); } }}>
      {tooltipElement}

      <div className={dialogShellClass}>
        <div 
          className="h-full px-5 py-4.5 md:px-9 md:py-7.5 relative flex flex-col min-h-0 bg-gradient-to-br from-white/5 to-transparent cursor-pointer after:absolute after:inset-0 after:rounded-2xl md:after:rounded-3xl after:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] after:pointer-events-none"
          onClick={handleSkipTyping}
        >
          <div 
            ref={textContainerRef}
            className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 md:pr-2 py-2 mb-2 md:mb-3 min-h-[3.75rem] md:min-h-[4.5rem] ${isTyping ? 'typing-active' : ''}`}
            style={{ scrollBehavior: isTyping ? 'auto' : 'smooth' }}
          >
            <div 
              className="text-stone-50 leading-[1.55] md:leading-[1.68] font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-opacity duration-300 break-words whitespace-pre-wrap"
              style={{ fontSize: 'clamp(1.12rem, 2.9dvh, 1.72rem)' }}
            >
              {renderFormattedText()}
            </div>
          </div>

          {!isTyping && renderedOptions.length > 0 && (
            <div className="mt-auto pt-2 flex flex-wrap gap-2 md:gap-3 justify-end animate-in fade-in slide-in-from-right-4 pb-1 shrink-0">
              {renderedOptions.map((option, idx) => (
                <SfxButton
                  key={idx}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (option.action) {
                      if (typeof option.action === 'function') {
                        option.action();
                      }
                    }
                  }}
                  disabled={option.disabled}
                  className={`px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-xl font-black text-[13px] md:text-[15px] flex items-center gap-2 md:gap-3 transition-all transform active:scale-95 border shadow-2xl min-h-[50px] md:min-h-[58px] ${
                    option.disabled 
                      ? 'bg-stone-800/40 text-stone-600 border-stone-700/30 cursor-not-allowed'
                      : option.variant === 'danger'
                        ? 'bg-red-900/60 text-red-50 border-red-800/50 hover:bg-red-700 hover:border-red-400'
                        : option.variant === 'neutral' || option.variant === 'secondary'
                            ? 'bg-stone-800/60 text-stone-100 border-stone-600 hover:bg-stone-750 hover:border-stone-400'
                            : 'bg-amber-700/80 text-white border-amber-500 hover:bg-amber-600 hover:border-amber-300 hover:shadow-amber-900/60'
                  }`}
                >
                  <span className="whitespace-nowrap">{option.label}</span>
                  {!option.disabled && <ChevronRight className="hidden xs:block w-3 md:w-5.5 h-3 md:h-5.5 opacity-70 group-hover:translate-x-1 transition-transform" />}
                </SfxButton>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DialogueBox;
