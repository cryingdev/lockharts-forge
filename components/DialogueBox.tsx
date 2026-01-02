import React, { useState, useEffect, useRef } from 'react';
import { User, ChevronRight } from 'lucide-react';

interface DialogueOption {
  label: string;
  action: () => void;
  variant?: 'primary' | 'danger' | 'neutral';
  disabled?: boolean;
}

interface DialogueBoxProps {
  speaker: string;
  text: string;
  options?: DialogueOption[];
}

const DialogueBox: React.FC<DialogueBoxProps> = ({ speaker, text, options = [] }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Use a ref to ensure we don't try to update state on unmounted component
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Typewriter Effect
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    
    // Typing speed: fast for better UX
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

  // Click to skip typing
  const handleSkipTyping = () => {
    if (isTyping) {
      setDisplayedText(text);
      setIsTyping(false);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 w-full z-40 p-4 pb-6">
      <div 
        className="w-full max-w-4xl mx-auto bg-stone-900 border-2 border-stone-600 rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300"
      >
        
        {/* Speaker Name Badge (Mobile Top / Desktop Left) */}
        <div className="bg-stone-800 p-4 border-b md:border-b-0 md:border-r border-stone-700 flex flex-row md:flex-col items-center gap-3 md:w-48 shrink-0">
          <div className="w-12 h-12 rounded-full bg-amber-900/30 border border-amber-700 flex items-center justify-center">
             <User className="w-6 h-6 text-amber-500" />
          </div>
          <span className="font-bold text-amber-100 text-lg md:text-center font-serif leading-tight">
            {speaker}
          </span>
        </div>

        {/* Text Area */}
        <div className="flex-1 p-6 relative flex flex-col">
          <div 
            className={`text-lg text-stone-200 leading-relaxed font-medium min-h-[4rem] cursor-pointer ${isTyping ? 'after:content-["|"] after:animate-pulse after:text-amber-500' : ''}`}
            onClick={handleSkipTyping}
          >
            {displayedText}
          </div>

          {/* Options */}
          {!isTyping && options.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3 justify-end animate-in fade-in slide-in-from-left-2">
              {options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={option.action}
                  disabled={option.disabled}
                  className={`px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all transform active:scale-95 border ${
                    option.disabled 
                      ? 'bg-stone-800 text-stone-600 border-stone-700 cursor-not-allowed'
                      : option.variant === 'danger'
                        ? 'bg-red-900/20 text-red-400 border-red-800/50 hover:bg-red-900/40 hover:border-red-500'
                        : option.variant === 'neutral'
                            ? 'bg-stone-800 text-stone-300 border-stone-600 hover:bg-stone-700 hover:border-stone-500'
                            : 'bg-amber-700 text-amber-50 border-amber-600 hover:bg-amber-600 hover:border-amber-400 shadow-lg shadow-amber-900/20'
                  }`}
                >
                  {option.label}
                  {!option.disabled && <ChevronRight className="w-4 h-4" />}
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