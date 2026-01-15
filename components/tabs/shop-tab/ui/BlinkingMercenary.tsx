import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getAssetUrl } from '../../../../utils';

interface BlinkingMercenaryProps {
    mercenary: any;
    className?: string;
}

export const BlinkingMercenary: React.FC<BlinkingMercenaryProps> = ({ mercenary, className }) => {
    const [frame, setFrame] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isPip = mercenary.id === 'pip_green';

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
        const delay = 3000 + Math.random() * 4000;
        timerRef.current = setTimeout(blink, delay);
    }, [blink]);

    useEffect(() => {
        if (isPip) scheduleNextBlink();
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isPip, scheduleNextBlink]);

    if (isPip) {
        return (
            <div className={className} style={{ aspectRatio: '453.3 / 1058', overflow: 'hidden' }}>
                <div 
                    className="h-full w-full transition-transform duration-75 ease-linear"
                    style={{
                        backgroundImage: `url(${getAssetUrl(mercenary.sprite)})`,
                        backgroundSize: '300% 100%',
                        backgroundPosition: `${frame * 50}% 0%`,
                        imageRendering: 'pixelated'
                    }}
                />
            </div>
        );
    }

    return (
        <img 
            src={mercenary.sprite ? getAssetUrl(mercenary.sprite) : getAssetUrl('adventurer_wanderer_01.png')} 
            className={className}
        />
    );
};
