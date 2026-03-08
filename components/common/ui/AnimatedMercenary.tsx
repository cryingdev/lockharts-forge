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
export const AnimatedMercenary: React.FC<AnimatedMercenaryProps> = ({ 
    mercenary, 
    className, 
    height 
}) => {
    const [frame, setFrame] = useState(0);
    const [aspectRatio, setAspectRatio] = useState<number>(1 / 2.15); // 초기 기본값
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isSpriteSheet = !!mercenary?.sprite && mercenary.sprite.includes('_sprite');
    const isFullImage = !!mercenary?.profileImage || (!!mercenary?.sprite && !isSpriteSheet);
    const displayImage = mercenary?.profileImage || mercenary?.sprite || 'default.png';
    const imageUrl = getAssetUrl(displayImage, 'mercenaries');

    // 이미지 로드 시 실제 해상도를 측정하여 가로세로비 계산 (프레임 단위 비율)
    useEffect(() => {
        if (!displayImage) return;
        
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            const singleFrameWidth = isSpriteSheet ? (img.naturalWidth / 3) : img.naturalWidth;
            const ratio = singleFrameWidth / img.naturalHeight;
            if (!isNaN(ratio) && ratio > 0) {
                setAspectRatio(ratio);
            }
        };
    }, [imageUrl, isSpriteSheet, isFullImage]);

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

    if (!mercenary) return null;

    if (isSpriteSheet) {
        return (
            <div 
                className={className} 
                style={{ 
                    height: height || '100%',
                    aspectRatio: `${aspectRatio}`, 
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'flex-end'
                }}
            >
                <div 
                    className="h-full w-full transition-transform duration-75 ease-linear"
                    style={{
                        backgroundImage: `url(${imageUrl})`,
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
            src={imageUrl} 
            className={className}
            style={{ 
                height: height || '100%', 
                objectFit: 'contain',
                imageRendering: isFullImage ? 'auto' : 'pixelated'
            }}
            alt={mercenary.name}
        />
    );
};