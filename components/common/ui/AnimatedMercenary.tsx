
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
 * 이미지의 실제 크기를 측정하여 원본 비율에 맞는 aspect-ratio를 동적으로 적용합니다.
 */
export const AnimatedMercenary: React.FC<AnimatedMercenaryProps> = ({ mercenary, className, height = "100%" }) => {
    const [frame, setFrame] = useState(0);
    const [aspectRatio, setAspectRatio] = useState<number>(1 / 1.8); // 초기 기본값
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isSpriteSheet = mercenary.sprite?.includes('_sprite');
    const spriteUrl = mercenary.sprite ? getAssetUrl(mercenary.sprite) : getAssetUrl('adventurer_wanderer_01.png');

    // 이미지 로드 시 실제 해상도를 측정하여 가로세로비 계산
    useEffect(() => {
        if (isSpriteSheet && mercenary.sprite) {
            const img = new Image();
            img.src = spriteUrl;
            img.onload = () => {
                // 사용자가 제시한 공식 적용: (전체 너비 / 3) : 전체 높이
                const singleFrameWidth = img.naturalWidth / 3;
                const ratio = singleFrameWidth / img.naturalHeight;
                if (!isNaN(ratio) && ratio > 0) {
                    setAspectRatio(ratio);
                }
            };
        }
    }, [spriteUrl, isSpriteSheet]);

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
                    aspectRatio: `${aspectRatio}`, 
                    overflow: 'hidden' 
                }}
            >
                <div 
                    className="h-full w-full transition-transform duration-75 ease-linear"
                    style={{
                        backgroundImage: `url(${spriteUrl})`,
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
            src={spriteUrl} 
            className={className}
            style={{ height: height, objectFit: 'contain' }}
            alt={mercenary.name}
        />
    );
};
