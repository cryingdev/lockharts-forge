import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getAssetUrl } from '../../../utils';

interface AnimatedMercenaryProps {
    mercenary: any;
    className?: string;
    height?: string;
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    valign?: 'top' | 'center' | 'bottom';
}

/**
 * AnimatedMercenary
 * 용병의 스프라이트를 표시하며, '_sprite'가 파일명에 포함된 경우
 * 눈 깜빡임(3프레임) 애니메이션을 자동으로 처리합니다.
 */
export const AnimatedMercenary: React.FC<AnimatedMercenaryProps> = ({ 
    mercenary, 
    className, 
    height,
    objectFit = 'contain',
    valign = 'bottom'
}) => {
    const [frame, setFrame] = useState(0);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null); 
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isSpriteSheet = !!mercenary?.spriteImage && mercenary.spriteImage.includes('_sprite');
    const displayImage = mercenary?.spriteImage || mercenary?.fullBodyImage || mercenary?.portraitImage || 'default.png';
    const isFullImage = !isSpriteSheet && (!!mercenary?.fullBodyImage || !!mercenary?.portraitImage || !!mercenary?.spriteImage);
    const imageUrl = getAssetUrl(displayImage, 'mercenaries');

    // 이미지 로드 시 실제 해상도를 측정하여 가로세로비 계산 (프레임 단위 비율)
    useEffect(() => {
        if (!displayImage) return;
        
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            // 스프라이트 시트인 경우 전체 너비의 1/3이 한 프레임의 너비
            const singleFrameWidth = isSpriteSheet ? (img.naturalWidth / 3) : img.naturalWidth;
            const ratio = singleFrameWidth / img.naturalHeight;
            
            if (!isNaN(ratio) && ratio > 0) {
                setDimensions({ width: singleFrameWidth, height: img.naturalHeight });
                console.log(`[AnimatedMercenary] Asset Loaded: ${displayImage}, Frame Ratio: ${ratio.toFixed(2)}`);
            }
        };
    }, [imageUrl, isSpriteSheet, displayImage]);

    const blink = useCallback(() => {
        if (!isSpriteSheet) return;
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
    }, [isSpriteSheet]);

    const scheduleNextBlink = useCallback(() => {
        if (!isSpriteSheet) return;
        const delay = 3000 + Math.random() * 4000;
        timerRef.current = setTimeout(blink, delay);
    }, [blink, isSpriteSheet]);

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
                    height: height || '85vh',
                    aspectRatio: dimensions ? `${dimensions.width} / ${dimensions.height}` : undefined,
                    width: dimensions ? `calc(${height || '85vh'} * ${dimensions.width / dimensions.height})` : 'auto',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: valign === 'top' ? 'flex-start' : valign === 'center' ? 'center' : 'flex-end',
                    position: 'relative',
                    flexShrink: 0,
                    maxWidth: '100%'
                }}
            >
                <div 
                    className="h-full w-full"
                    style={{
                        backgroundImage: `url(${imageUrl})`,
                        // 컨테이너 너비의 300%로 설정하여 1/3(1프레임)이 딱 맞게 함
                        backgroundSize: '300% 100%',
                        backgroundPosition: `${frame * 50}% 0%`,
                        backgroundRepeat: 'no-repeat',
                        imageRendering: isSpriteSheet ? 'pixelated' : 'auto'
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
                height: height || '85vh', 
                width: dimensions ? `calc(${height || '85vh'} * ${dimensions.width} / ${dimensions.height})` : 'auto',
                aspectRatio: dimensions ? `${dimensions.width} / ${dimensions.height}` : undefined,
                maxWidth: '100%',
                objectFit: objectFit,
                imageRendering: isFullImage ? 'auto' : 'pixelated',
                flexShrink: 0
            }}
            alt={mercenary.name}
        />
    );
};