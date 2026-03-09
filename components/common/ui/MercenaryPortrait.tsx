import React from 'react';
import { getAssetUrl } from '../../../utils';

interface MercenaryPortraitProps {
    mercenary: {
        sprite?: string;
        profileImage?: string;
        name: string;
    };
    className?: string;
    showBg?: boolean;
}

/**
 * MercenaryPortrait
 * 용병의 이미지를 표시합니다. 
 * 1. profileImage가 있으면 해당 이미지를 그대로 표시합니다.
 * 2. profileImage가 없으면 sprite 이미지의 상단 1/3 영역을 크롭하여 표시합니다.
 */
export const MercenaryPortrait: React.FC<MercenaryPortraitProps> = ({ 
    mercenary, 
    className = "w-10 h-10", 
    showBg = true 
}) => {
    const { profileImage, sprite, name } = mercenary;
    const isSpriteSheet = !!sprite && sprite.includes('_sprite');
    const isFullImage = !!profileImage || (!!sprite && !isSpriteSheet);
    const isDedicatedProfile = !!profileImage;
    const displayImage = profileImage || sprite || 'default.png';
    const imageUrl = getAssetUrl(displayImage, 'mercenaries');

    return (
        <div className={`relative overflow-hidden rounded-lg ${showBg ? 'bg-stone-800' : ''} ${className}`}>
            {isFullImage ? (
                <img 
                    src={imageUrl} 
                    alt={name}
                    className="w-full h-full object-cover object-top"
                    style={{ 
                        imageRendering: 'pixelated',
                        // 전용 프로필 이미지는 약간만 확대, 단일 스프라이트는 얼굴 위주로 크게 확대
                        transform: isDedicatedProfile 
                            ? 'scale(1.1) translateY(2%)' 
                            : 'scale(2.5) translateY(25%)',
                    }}
                    referrerPolicy="no-referrer"
                />
            ) : (
                <div 
                    className="w-full h-full"
                    style={{
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: '300% auto',
                        backgroundPosition: 'top center',
                        imageRendering: 'pixelated',
                        transform: 'scale(2.5) translateY(20%)',
                    }}
                    aria-label={name}
                />
            )}
        </div>
    );
};