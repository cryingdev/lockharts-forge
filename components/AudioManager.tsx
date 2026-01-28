
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { getMusicUrl, getAudioUrl } from '../utils';

/**
 * AudioManager
 * Web Audio API(AudioContext)를 사용하여 배경음(BGM)과 효과음(SFX)을 통합 관리합니다.
 */
const AudioManager: React.FC = () => {
    const { state } = useGame();
    const audioSettings = state.settings.audio;
    const activeDungeonId = state.activeManualDungeon?.dungeonId;
    const encounterStatus = state.activeManualDungeon?.encounterStatus;
    
    const contextRef = useRef<AudioContext | null>(null);
    const bgmGainRef = useRef<GainNode | null>(null);
    const sfxGainRef = useRef<GainNode | null>(null);
    const bgmSourceRef = useRef<AudioBufferSourceNode | null>(null);
    
    const bgmCache = useRef<Map<string, AudioBuffer>>(new Map());
    const sfxCache = useRef<Map<string, AudioBuffer>>(new Map());
    const currentTrackName = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. 현재 상황에 맞는 BGM 트랙 결정
    const targetTrackName = useMemo(() => {
        // Battle track has priority during combat
        if (encounterStatus === 'BATTLE') {
            return 'battle_track_01.mp3';
        }
        
        if (activeDungeonId === 'dungeon_t1_sewers') {
            return 'dungeon_track_01.mp3';
        }
        return 'track_01.mp3';
    }, [activeDungeonId, encounterStatus]);

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

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'none';
        }

        setIsLoaded(true);

        return () => {
            stopBgm(0);
            if (contextRef.current) {
                contextRef.current.close();
            }
        };
    }, []);

    /**
     * BGM 중지 로직
     */
    const stopBgm = useCallback((fadeTime: number = 0.3) => {
        const gainNode = bgmGainRef.current;
        const source = bgmSourceRef.current;
        const ctx = contextRef.current;

        if (source && gainNode && ctx) {
            const currentGain = gainNode.gain.value;
            gainNode.gain.cancelScheduledValues(ctx.currentTime);
            gainNode.gain.setValueAtTime(currentGain, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeTime);

            setTimeout(() => {
                try { source.stop(); } catch (e) {}
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
        if (!ctx || !gainNode) return;

        if (currentTrackName.current === trackName && bgmSourceRef.current) return;

        stopBgm(0.2); 

        try {
            let buffer = bgmCache.current.get(trackName);
            if (!buffer) {
                const url = getMusicUrl(trackName);
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} at ${url}`);
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    throw new Error(`Invalid content type: received HTML instead of audio at ${url}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                buffer = await ctx.decodeAudioData(arrayBuffer);
                bgmCache.current.set(trackName, buffer);
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

            if (ctx.state === 'suspended') await ctx.resume();
            
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
        if (!ctx || !gainNode) return;

        // 설정 확인
        if (!audioSettings.masterEnabled || !audioSettings.sfxEnabled) {
            console.debug(`[Audio] SFX [${filename}] skip (Muted)`);
            return;
        }

        try {
            let buffer = sfxCache.current.get(filename);
            if (!buffer) {
                const url = getAudioUrl(filename);
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for ${filename} at ${url}`);
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    throw new Error(`Invalid content type: received HTML instead of audio for ${filename} at ${url}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                buffer = await ctx.decodeAudioData(arrayBuffer);
                sfxCache.current.set(filename, buffer);
            }

            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(gainNode);
            source.start(0);
            console.debug(`[Audio] Playing SFX: ${filename}`);
        } catch (e) {
            console.error(`[Audio] SFX [${filename}] error:`, e);
        }
    }, [audioSettings.masterEnabled, audioSettings.sfxEnabled]);

    // BGM 설정 업데이트
    useEffect(() => {
        if (!isLoaded) return;
        const gainNode = bgmGainRef.current;
        const ctx = contextRef.current;
        if (!gainNode || !ctx) return;

        const shouldPlay = audioSettings.masterEnabled && audioSettings.musicEnabled;
        if (shouldPlay) {
            if (currentTrackName.current !== targetTrackName || !bgmSourceRef.current) {
                startBgm(targetTrackName);
            } else {
                const effectiveVolume = audioSettings.masterVolume * audioSettings.musicVolume;
                gainNode.gain.setTargetAtTime(effectiveVolume, ctx.currentTime, 0.1);
            }
        } else {
            stopBgm(0.5);
        }
    }, [isLoaded, targetTrackName, audioSettings.masterVolume, audioSettings.musicVolume, audioSettings.masterEnabled, audioSettings.musicEnabled, startBgm, stopBgm]);

    // SFX 볼륨 업데이트 (설정 변경 시 즉각 반영)
    useEffect(() => {
        if (!isLoaded) return;
        const gainNode = sfxGainRef.current;
        const ctx = contextRef.current;
        if (gainNode && ctx) {
            const isMuted = !audioSettings.masterEnabled || !audioSettings.sfxEnabled;
            const effectiveVolume = isMuted ? 0 : audioSettings.masterVolume * audioSettings.sfxVolume;
            gainNode.gain.setTargetAtTime(effectiveVolume, ctx.currentTime, 0.05);
        }
    }, [isLoaded, audioSettings.masterVolume, audioSettings.sfxVolume, audioSettings.masterEnabled, audioSettings.sfxEnabled]);

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

    // 브라우저 Autoplay 정책 대응
    useEffect(() => {
        const handleInteraction = () => {
            if (contextRef.current && contextRef.current.state === 'suspended') {
                contextRef.current.resume();
            }
        };
        window.addEventListener('mousedown', handleInteraction, { once: true });
        window.addEventListener('touchstart', handleInteraction, { once: true });
        return () => {
            window.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, []);

    return null;
};

export default AudioManager;
