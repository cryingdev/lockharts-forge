import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getAssetUrl } from '../../../utils';

interface AnimatedMercenaryProps {
    mercenary: any;
    className?: string;
    height?: string;
}

/**
 * AnimatedMercenary
 * 용병의 스프라이트를 표시하며, '_sprite'가 파일명에 포함된 경우
 * 눈 깜빡임(3프레임) 애니메이션을 자동으로 처리합니다.
 */
export const AnimatedMercenary: React.FC<AnimatedMercenaryProps> = ({ mercenary, className, height = "100%" }) => {
    const [frame, setFrame] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isSpriteSheet = mercenary.sprite?.includes('_sprite');

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
        if (isSpriteSheet) scheduleNextBlink();
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isSpriteSheet, scheduleNextBlink]);

    if (isSpriteSheet) {
        return (
            <div 
                className={className} 
                style={{ 
                    height: height,
                    aspectRatio: '1 / 2.15', 
                    overflow: 'hidden' 
                }}
            >
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
            style={{ height: height }}
            alt={mercenary.name}
        />
    );
};