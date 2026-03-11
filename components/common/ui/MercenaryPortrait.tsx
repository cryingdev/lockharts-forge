import React from 'react';
import { getAssetUrl } from '../../../utils';

interface MercenaryPortraitProps {
    mercenary: {
        spriteImage?: string;
        portraitImage?: string;
        fullBodyImage?: string;
        name: string;
    };
    className?: string;
    showBg?: boolean;
}

/**
 * MercenaryPortrait
 * 용병의 이미지를 표시합니다. 
 * 1. portraitImage가 있으면 해당 이미지를 그대로 표시합니다.
 * 2. portraitImage가 없으면 fullBodyImage를 얼굴 부위 위주로 표시합니다.
 * 3. 둘 다 없으면 sprite 이미지의 상단 1/3 영역을 크롭하여 표시합니다.
 */
export const MercenaryPortrait: React.FC<MercenaryPortraitProps> = ({ 
    mercenary, 
    className = "w-10 h-10", 
    showBg = true 
}) => {
    const { portraitImage, fullBodyImage, spriteImage: sprite, name } = mercenary;
    const isSpriteSheet = !!sprite && sprite.includes('_sprite');
    
    // 전용 초상이 있는지 여부
    const hasPortrait = !!portraitImage;
    // 전용 초상은 없지만 전신 이미지가 있는지 여부
    const hasFullBody = !hasPortrait && !!fullBodyImage;
    
    const displayImage = portraitImage || fullBodyImage || sprite || 'default.png';
    const imageUrl = getAssetUrl(displayImage, 'mercenaries');

    return (
        <div className={`relative overflow-hidden rounded-lg ${showBg ? 'bg-stone-800' : ''} ${className}`}>
            {(portraitImage || fullBodyImage || (sprite && !isSpriteSheet)) ? (
                <img 
                    src={imageUrl} 
                    alt={name}
                    className="w-full h-full object-cover object-top"
                    style={{ 
                        imageRendering: 'pixelated',
                        // 전용 프로필 이미지는 약간만 확대, 전신 이미지는 얼굴 부위 크롭, 단일 스프라이트는 얼굴 위주로 크게 확대
                        transform: hasPortrait 
                            ? 'scale(1.1) translateY(12%)' 
                            : 'scale(2.6) translateY(30%)' // 25%에서 10% 추가하여 35%로 조정   
                    }}
                    referrerPolicy="no-referrer"
                />
            ) : (
                <div 
                    className="w-full h-full"
                    style={{
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: '300% 100%', // 3프레임 시트이므로 가로 300%
                        backgroundPosition: '0% 0%', // F1(눈 뜬 상태) 표시를 위해 왼쪽 끝(0%) 고정
                        backgroundRepeat: 'no-repeat',
                        imageRendering: 'pixelated',
                        transform: 'scale(2.5) translateY(20%)',
                    }}
                    aria-label={name}
                />
            )}
        </div>
    );
};