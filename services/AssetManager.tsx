import React, { useEffect, useCallback } from 'react';
import { 
    AUDIO_MANIFEST, 
    IMAGE_MANIFEST, 
    AssetCache, 
    getMusicUrl, 
    getAudioUrl, 
    getAssetUrl 
} from '../utils';

/**
 * AssetManager
 * 앱 시작 시 모든 리소스를 병렬로 로드하여 AssetCache를 채웁니다.
 * 로딩 상태를 전역 이벤트 'asset-loading-progress'로 알립니다.
 */
const AssetManager: React.FC = () => {
    const preloadAll = useCallback(async () => {
        // Audio Context 생성 (디코딩용)
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();

        const bgms = AUDIO_MANIFEST.BGM;
        const sfxs = AUDIO_MANIFEST.SFX;
        const mercs = IMAGE_MANIFEST.MERCENARIES;
        const misc = (IMAGE_MANIFEST as any).MISC || [];
        
        const total = bgms.length + sfxs.length + mercs.length + misc.length;
        let loaded = 0;

        const reportProgress = (assetName: string, type: 'Audio' | 'Image') => {
            const progress = Math.round((loaded / total) * 100);
            window.dispatchEvent(new CustomEvent('asset-loading-progress', { 
                detail: { progress, assetName, assetType: type } 
            }));
        };

        // 오디오 로드 및 캐싱
        const loadAudio = async (name: string, type: 'BGM' | 'SFX') => {
            try {
                const url = type === 'BGM' ? getMusicUrl(name) : getAudioUrl(name);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                
                AssetCache.audio.set(name, audioBuffer);
                
                loaded++;
                reportProgress(name, 'Audio');
            } catch (err) {
                console.error(`[AssetLoader] Audio Failed: ${name}`, err);
                loaded++; // 진행률 유지를 위해 카운트는 올림
                reportProgress(name, 'Audio');
            }
        };

        // 이미지 로드 및 캐싱
        const loadImage = (name: string, folder?: string) => {
            return new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => {
                    AssetCache.images.set(name, img);
                    loaded++;
                    reportProgress(name, 'Image');
                    resolve();
                };
                img.onerror = () => {
                    console.error(`[AssetLoader] Image Failed: ${name}`);
                    loaded++;
                    reportProgress(name, 'Image');
                    resolve();
                };
                img.src = getAssetUrl(name, folder);
            });
        };

        // 초기화 보고
        window.dispatchEvent(new CustomEvent('asset-loading-progress', { 
            detail: { progress: 0, assetName: 'Initializing Engine...', assetType: 'System' } 
        }));

        // 병렬 실행
        const tasks = [
            ...bgms.map((name: string) => loadAudio(name, 'BGM')),
            ...sfxs.map((name: string) => loadAudio(name, 'SFX')),
            ...mercs.map((name: string) => loadImage(name, 'mercenaries')),
            ...misc.map((name: string) => loadImage(name))
        ];

        await Promise.all(tasks);
        console.log("%c[AssetLoader] All assets internalized.", "color: #10b981; font-weight: bold;");
        
        // AudioContext 닫기 (디코딩용 임시 컨텍스트)
        if (ctx.state !== 'closed') ctx.close();
    }, []);

    useEffect(() => {
        preloadAll();
    }, [preloadAll]);

    return null;
};

export default AssetManager;