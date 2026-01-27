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

    // 전용 프로필 이미지가 있는 경우 (Tilly, Pip 등)
    if (profileImage) {
        return (
            <div className={`relative overflow-hidden rounded-lg ${showBg ? 'bg-stone-800' : ''} ${className}`}>
                <img 
                    src={getAssetUrl(profileImage, 'mercenaries')} 
                    alt={name}
                    className="w-full h-full object-cover object-top"
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>
        );
    }

    // 전용 이미지가 없고 스프라이트만 있는 경우 (일반 용병)
    const isSpriteSheet = sprite?.includes('_sprite');
    const spriteUrl = sprite 
        ? getAssetUrl(sprite, 'mercenaries') 
        : getAssetUrl('adventurer_wanderer_01.png', 'mercenaries');

    return (
        <div className={`relative overflow-hidden rounded-lg ${showBg ? 'bg-stone-800' : ''} ${className}`}>
            <div 
                className="w-full h-full"
                style={{
                    backgroundImage: `url(${spriteUrl})`,
                    backgroundSize: isSpriteSheet ? '300% auto' : '100% auto',
                    backgroundPosition: 'top center',
                    imageRendering: 'pixelated',
                    transform: 'scale(1.2) translateY(5%)', // 얼굴 부각을 위한 미세 조정
                }}
                aria-label={name}
            />
        </div>
    );
};