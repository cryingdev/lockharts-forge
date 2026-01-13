import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, ChevronRight, Coins, Package, Lock } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { MATERIALS } from '../data/materials';

interface DialogueBoxProps {
  speaker: string;
  text: string;
  speakerAvatar?: string; // 추가: 화자 이미지 URL 또는 아이콘
  options?: any[];
  highlightTerm?: string;
  itemDetail?: any;
  className?: string;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({ 
  speaker, 
  text, 
  speakerAvatar,
  options = [], 
  highlightTerm,
  itemDetail,
  className = "relative w-full z-40"
}) => {
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setDisplayedIndex(0);
    setIsTyping(true);
    let index = 0;
    timerRef.current = setInterval(() => {
      index++;
      if (index > text.length) {
        clearInterval(timerRef.current);
        setIsTyping(false);
      } else {
        setDisplayedIndex(index);
      }
    }, 25);
    return () => clearInterval(timerRef.current);
  }, [text]);

  return (
    <div className={className}>
      <div className="w-full h-[22dvh] min-h-[120px] bg-stone-950/25 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl flex flex-row overflow-hidden animate-in slide-in-from-bottom-8">
        <div className="bg-stone-900/20 p-2 md:p-6 border-r border-white/5 flex flex-col items-center gap-1 w-20 md:w-48 shrink-0 justify-center">
          <div className="w-12 h-12 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-amber-900/30 to-stone-800/40 border border-amber-600/30 flex items-center justify-center shadow-inner overflow-hidden">
             {speakerAvatar ? (
               <img src={speakerAvatar} className="w-full h-full object-cover" alt="avatar" />
             ) : (
               <User className="w-6 h-6 md:w-12 md:h-12 text-amber-500/90" />
             )}
          </div>
          <span className="font-black text-amber-50 text-[10px] md:text-lg text-center font-serif truncate w-full">{speaker}</span>
        </div>

        <div className="flex-1 p-4 relative flex flex-col bg-gradient-to-br from-white/5 to-transparent">
          <div className="flex-1 overflow-y-auto custom-scrollbar text-stone-50 leading-snug md:leading-relaxed font-medium text-lg md:text-2xl italic">
            {text.slice(0, displayedIndex)}
          </div>
          {!isTyping && options.length > 0 && (
            <div className="mt-auto pt-2 flex flex-wrap gap-2 justify-end animate-in fade-in">
              {options.map((opt, idx) => (
                <button key={idx} onClick={opt.action} className={`px-4 md:px-8 py-2 rounded-xl font-black text-[10px] md:text-sm uppercase transition-all transform active:scale-95 border border-amber-500/50 ${opt.variant === 'primary' ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-300'}`}>
                  {opt.label}
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