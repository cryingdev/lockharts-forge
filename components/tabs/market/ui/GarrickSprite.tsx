
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart } from 'lucide-react';
import { getAssetUrl } from '../../../../utils';
import { FloatingHeart } from '../hooks/useMarket';

export const GarrickSprite = ({ floatingHearts }: { floatingHearts: FloatingHeart[] }) => {
    const [frame, setFrame] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const blink = useCallback(() => {
        setFrame(1);
        setTimeout(() => {
            setFrame(2);
            setTimeout(() => {
                setFrame(1);
                setTimeout(() => {
                    setFrame(0);
                    scheduleNextBlink();
                }, 80);
            }, 100);
        }, 80);
    }, []);

    const scheduleNextBlink = useCallback(() => {
        timerRef.current = setTimeout(blink, 3000 + Math.random() * 4000);
    }, [blink]);

    useEffect(() => {
        scheduleNextBlink();
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [scheduleNextBlink]);

    return (
        <div className="relative w-full h-full flex items-end justify-center pointer-events-none">
            <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full -z-10 animate-pulse"></div>
            {floatingHearts.map(heart => (
                <Heart key={heart.id} className="absolute animate-heart fill-pink-500 text-pink-400 z-0" style={{ left: `${heart.left}%`, bottom: '40%', width: heart.size, height: heart.size, animationDelay: `${heart.delay}s`, '--wobble': `${(Math.random() - 0.5) * 60}px` } as React.CSSProperties} />
            ))}
            <div className="relative h-[75dvh] md:h-[110dvh] bottom-[12dvh] md:bottom-0 md:translate-y-[15dvh] z-10" style={{ aspectRatio: '453.3 / 1058' }}>
                <div className="h-full w-full" style={{ backgroundImage: `url(${getAssetUrl('garrick_standing_sprite.png')})`, backgroundSize: '300% 100%', backgroundPosition: `${frame * 50}% 0%`, imageRendering: 'pixelated', filter: 'drop-shadow(0 0 50px rgba(0,0,0,0.9))' }} />
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 h-10 bg-black/60 blur-3xl rounded-full -z-10"></div>
        </div>
    );
};
