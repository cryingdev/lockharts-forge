import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { getMusicUrl, getAudioUrl, AssetCache } from '../utils';

interface AudioManagerProps {
    currentView: 'INTRO' | 'TITLE' | 'GAME';
}

/**
 * AudioManager
 * Web Audio API를 사용하여 오디오 재생 및 볼륨 조절을 담당합니다.
 * 리소스는 AssetCache에 프리로드된 데이터를 사용합니다.
 */
const AudioManager: React.FC<AudioManagerProps> = ({ currentView }) => {
    const { state } = useGame();
    const audioSettings = state.settings.audio;
    const activeDungeonId = state.activeManualDungeon?.dungeonId;
    const encounterStatus = state.activeManualDungeon?.encounterStatus;
    
    const contextRef = useRef<AudioContext | null>(null);
    const bgmGainRef = useRef<GainNode | null>(null);
    const sfxGainRef = useRef<GainNode | null>(null);
    const bgmSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const currentTrackName = useRef<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // 1. 현재 상황에 맞는 BGM 트랙 결정
    const targetTrackName = useMemo(() => {
        if (currentView === 'INTRO') return null;
        if (encounterStatus === 'BATTLE') return 'battle_track_01.mp3';
        if (activeDungeonId === 'dungeon_t1_sewers') return 'dungeon_track_01.mp3';
        return 'track_01.mp3';
    }, [currentView, activeDungeonId, encounterStatus]);

    // 2. 오디오 시스템 초기화
    useEffect(() => {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        
        const bgmGain = ctx.createGain();
        const sfxGain = ctx.createGain();
        
        bgmGain.connect(ctx.destination);
        sfxGain.connect(ctx.destination);
        
        contextRef.current = ctx;
        bgmGainRef.current = bgmGain;
        sfxGainRef.current = sfxGain;

        setIsInitialized(true);

        return () => {
            if (bgmSourceRef.current) {
                try { bgmSourceRef.current.stop(); } catch(e) {}
            }
            if (ctx.state !== 'closed') ctx.close();
        };
    }, []);

    /**
     * BGM 중지 로직
     */
    const stopBgm = useCallback((fadeTime: number = 0.3) => {
        const gainNode = bgmGainRef.current;
        const source = bgmSourceRef.current;
        const ctx = contextRef.current;

        if (source && gainNode && ctx && ctx.state !== 'closed') {
            const currentGain = gainNode.gain.value;
            gainNode.gain.cancelScheduledValues(ctx.currentTime);
            gainNode.gain.setValueAtTime(currentGain, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeTime);

            setTimeout(() => {
                try { 
                    if (source && source.buffer) source.stop(); 
                } catch (e) {}
                source.disconnect();
                if (bgmSourceRef.current === source) {
                    bgmSourceRef.current = null;
                    currentTrackName.current = null;
                }
            }, fadeTime * 1000 + 50);
        } else if (source) {
            try { source.stop(); } catch(e) {}
            source.disconnect();
            bgmSourceRef.current = null;
            currentTrackName.current = null;
        }
    }, []);

    /**
     * BGM 재생 시작
     */
    const startBgm = useCallback(async (trackName: string) => {
        const ctx = contextRef.current;
        const gainNode = bgmGainRef.current;
        if (!ctx || !gainNode || ctx.state === 'closed') return;

        if (currentTrackName.current === trackName && bgmSourceRef.current) return;

        stopBgm(0.2); 

        try {
            // AssetCache에서 버퍼 가져오기
            let buffer = AssetCache.audio.get(trackName);
            
            if (!buffer) {
                // 캐시에 없는 경우 (로딩 지연 등) 런타임 로드 시도
                console.warn(`[Audio] BGM ${trackName} not in cache, fetching manually...`);
                const url = getMusicUrl(trackName);
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                buffer = await ctx.decodeAudioData(arrayBuffer);
                AssetCache.audio.set(trackName, buffer);
            }

            if (targetTrackName !== trackName) return;

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            source.connect(gainNode);
            
            const effectiveVolume = audioSettings.masterVolume * audioSettings.musicVolume;
            gainNode.gain.cancelScheduledValues(ctx.currentTime);
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(effectiveVolume, ctx.currentTime + 0.5);

            // Fix: Removed redundant 'closed' check as 'suspended' state already implies it's not closed
            if (ctx.state === 'suspended') {
                await ctx.resume().catch(() => {});
            }
            
            source.start(0);
            bgmSourceRef.current = source;
            currentTrackName.current = trackName;
        } catch (e) {
            console.warn(`[Audio] BGM [${trackName}] play failed:`, e);
        }
    }, [targetTrackName, audioSettings.masterVolume, audioSettings.musicVolume, stopBgm]);

    /**
     * SFX 재생 로직
     */
    const playSfx = useCallback(async (filename: string) => {
        const ctx = contextRef.current;
        const gainNode = sfxGainRef.current;
        if (!ctx || !gainNode || ctx.state === 'closed') return;

        if (!audioSettings.masterEnabled || !audioSettings.sfxEnabled) return;

        try {
            let buffer = AssetCache.audio.get(filename);
            if (!buffer) {
                const url = getAudioUrl(filename);
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                buffer = await ctx.decodeAudioData(arrayBuffer);
                AssetCache.audio.set(filename, buffer);
            }

            // Fix: Removed redundant 'closed' check as 'suspended' state already implies it's not closed
            if (ctx.state === 'suspended') {
                await ctx.resume().catch(() => {});
            }

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(gainNode);
            source.start(0);
        } catch (e) {
            console.error(`[Audio] SFX [${filename}] error:`, e);
        }
    }, [audioSettings.masterEnabled, audioSettings.sfxEnabled]);

    // BGM 및 설정 감지
    useEffect(() => {
        if (!isInitialized) return;
        const gainNode = bgmGainRef.current;
        const ctx = contextRef.current;
        if (!gainNode || !ctx || ctx.state === 'closed') return;

        const shouldPlay = audioSettings.masterEnabled && audioSettings.musicEnabled && targetTrackName !== null;
        
        if (shouldPlay) {
            if (currentTrackName.current !== targetTrackName || !bgmSourceRef.current) {
                startBgm(targetTrackName!);
            } else {
                const effectiveVolume = audioSettings.masterVolume * audioSettings.musicVolume;
                gainNode.gain.setTargetAtTime(effectiveVolume, ctx.currentTime, 0.1);
            }
        } else {
            stopBgm(0.5);
        }
    }, [isInitialized, targetTrackName, audioSettings.masterVolume, audioSettings.musicVolume, audioSettings.masterEnabled, audioSettings.musicEnabled, startBgm, stopBgm]);

    // SFX 볼륨 업데이트
    useEffect(() => {
        if (!isInitialized) return;
        const gainNode = sfxGainRef.current;
        const ctx = contextRef.current;
        if (gainNode && ctx && ctx.state !== 'closed') {
            const isMuted = !audioSettings.masterEnabled || !audioSettings.sfxEnabled;
            const effectiveVolume = isMuted ? 0 : audioSettings.masterVolume * audioSettings.sfxVolume;
            gainNode.gain.setTargetAtTime(effectiveVolume, ctx.currentTime, 0.05);
        }
    }, [isInitialized, audioSettings.masterVolume, audioSettings.sfxVolume, audioSettings.masterEnabled, audioSettings.sfxEnabled]);

    // SFX 이벤트 리스너
    useEffect(() => {
        const handleSfxRequest = (e: any) => {
            if (e.detail?.file) {
                playSfx(e.detail.file);
            }
        };
        window.addEventListener('play-sfx', handleSfxRequest);
        return () => window.removeEventListener('play-sfx', handleSfxRequest);
    }, [playSfx]);

    // Autoplay 대응
    useEffect(() => {
        const handleInteraction = () => {
            const ctx = contextRef.current;
            // Fix: Removed redundant 'closed' check as 'suspended' state already implies it's not closed
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }
        };
        window.addEventListener('mousedown', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        return () => {
            window.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, []);

    return null;
};

export default AudioManager;