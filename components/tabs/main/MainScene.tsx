import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, ShieldAlert, ShoppingBag, Store, Beer, Swords } from 'lucide-react';
import { SfxButton } from '../../common/ui/SfxButton';
import { useGame } from '../../../context/GameContext';
import { t } from '../../../utils/i18n';
import { useAudio } from '../../../hooks/useAudio';
import { getImageUrl } from '../../../utils';
import MainHud from './MainHud';

interface MainSceneProps {
    onNavigate: (tab: any) => void;
    onSettingsClick: () => void;
}

type PoiId = 'wall' | 'market' | 'tavern' | 'forge' | 'arena' | 'people';
type SceneMode = 'landscape' | 'portrait';

interface PoiLayer {
    id: PoiId;
    title: string;
    target: 'DUNGEON' | 'MARKET' | 'TAVERN' | 'FORGE_BUILDING' | 'ARENA' | 'SHOP';
    lockKey?: 'DUNGEON' | 'MARKET' | 'TAVERN' | 'ARENA';
}

interface SceneConfig {
    width: number;
    height: number;
    background: string;
    poiSources: Record<PoiId, string>;
    labelAnchors: Record<PoiId, { x: number; y: number }>;
}

const ALPHA_HIT_THRESHOLD = 24;
const getMainImageUrl = (filename: string) => getImageUrl(filename, 'main');

const POI_LAYERS: PoiLayer[] = [
    { id: 'wall', title: 'Sortie Gate', target: 'DUNGEON', lockKey: 'DUNGEON' },
    { id: 'market', title: "Garrick's Wares", target: 'MARKET', lockKey: 'MARKET' },
    { id: 'tavern', title: 'Tavern', target: 'TAVERN', lockKey: 'TAVERN' },
    { id: 'forge', title: "Lockhart's Forge", target: 'FORGE_BUILDING' },
    { id: 'arena', title: 'Arena', target: 'ARENA', lockKey: 'ARENA' },
    { id: 'people', title: 'Shop', target: 'SHOP' },
];

const SCENE_CONFIGS: Record<SceneMode, SceneConfig> = {
    landscape: {
        width: 1672,
        height: 941,
        background: getMainImageUrl('bg_ground.png'),
        poiSources: {
            wall: getMainImageUrl('poi_wall.png'),
            market: getMainImageUrl('poi_market.png'),
            tavern: getMainImageUrl('poi_tavern.png'),
            forge: getMainImageUrl('poi_forge.png'),
            arena: getMainImageUrl('poi_arena.png'),
            people: getMainImageUrl('poi_people.png'),
        },
        labelAnchors: {
            wall: { x: 836, y: 480 },
            market: { x: 620, y: 582 },
            tavern: { x: 1304, y: 640 },
            forge: { x: 368, y: 809 },
            arena: { x: 1271, y: 847 },
            people: { x: 836, y: 678 },
        },
    },
    portrait: {
        width: 1024,
        height: 1536,
        background: getMainImageUrl('bg_ground_vertical.png'),
        poiSources: {
            wall: getMainImageUrl('poi_wall_vertical.png'),
            market: getMainImageUrl('poi_market_vertical.png'),
            tavern: getMainImageUrl('poi_tavern_vertical.png'),
            forge: getMainImageUrl('poi_forge_vertical.png'),
            arena: getMainImageUrl('poi_arena_vertical.png'),
            people: getMainImageUrl('poi_people_vertical.png'),
        },
        labelAnchors: {
            wall: { x: 512, y: 814 },
            market: { x: 317, y: 1044 },
            tavern: { x: 666, y: 1137 },
            forge: { x: 307, y: 1244 },
            arena: { x: 676, y: 1336 },
            people: { x: 512, y: 1121 },
        },
    },
};

const getViewportSize = () => {
    const visualViewport = window.visualViewport;
    return {
        width: Math.ceil(visualViewport?.width ?? window.innerWidth),
        height: Math.ceil(visualViewport?.height ?? window.innerHeight),
    };
};

const getAnchorStyle = (config: SceneConfig, id: PoiId): React.CSSProperties => {
    const anchor = config.labelAnchors[id];
    return {
        left: `${(anchor.x / config.width) * 100}%`,
        top: `${(anchor.y / config.height) * 100}%`,
    };
};

type LocationTagTone = 'danger' | 'market' | 'tavern' | 'forge' | 'arena';

const LOCATION_TAG_STYLES: Record<LocationTagTone, {
    accent: string;
    icon: string;
    medallion: string;
    glow: string;
}> = {
    danger: {
        accent: 'bg-red-700/75',
        icon: 'text-red-200',
        medallion: 'border-amber-600/34 bg-stone-950/72',
        glow: 'group-hover:shadow-red-950/35',
    },
    market: {
        accent: 'bg-blue-700/75',
        icon: 'text-blue-100',
        medallion: 'border-amber-600/34 bg-stone-950/72',
        glow: 'group-hover:shadow-blue-950/35',
    },
    tavern: {
        accent: 'bg-orange-700/75',
        icon: 'text-amber-100',
        medallion: 'border-amber-600/34 bg-stone-950/72',
        glow: 'group-hover:shadow-orange-950/35',
    },
    forge: {
        accent: 'bg-amber-700/75',
        icon: 'text-amber-200',
        medallion: 'border-amber-600/34 bg-stone-950/72',
        glow: 'group-hover:shadow-amber-950/35',
    },
    arena: {
        accent: 'bg-rose-700/75',
        icon: 'text-rose-200',
        medallion: 'border-amber-600/34 bg-stone-950/72',
        glow: 'group-hover:shadow-rose-950/35',
    },
};

const locationTagSurfaceStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(87, 58, 34, 0.5) 0%, rgba(55, 38, 25, 0.5) 44%, rgba(28, 23, 18, 0.5) 100%)',
    borderColor: 'rgba(137, 97, 47, 0.86)',
    color: '#fff7dd',
    boxShadow: 'inset 0 1px 0 rgba(255,229,168,0.24), inset 0 -2px 0 rgba(0,0,0,0.52), 0 9px 16px rgba(0,0,0,0.36)',
};

const LocationTag = ({
    className,
    style,
    category,
    title,
    Icon,
    tone,
    onClick,
    tutorialId,
    showChevron = true,
    badgeCount,
    showBadge = false,
}: {
    className: string;
    style?: React.CSSProperties;
    category: string;
    title: string;
    Icon: React.ElementType;
    tone: LocationTagTone;
    onClick: () => void;
    tutorialId?: string;
    showChevron?: boolean;
    badgeCount?: number;
    showBadge?: boolean;
}) => (
    <div className={className} style={style}>
        <SfxButton
            sfx="switch"
            onClick={onClick}
            onPointerDown={(event) => event.stopPropagation()}
            data-tutorial-id={tutorialId}
            className={`group pointer-events-auto relative inline-flex min-h-[36px] w-max max-w-[72vw] items-center gap-2 overflow-visible rounded-[3px] border py-1.5 pl-10 pr-6 shadow-xl backdrop-blur-[2px] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-2xl active:translate-y-0 active:scale-[0.98] md:min-h-[40px] md:pl-11 md:pr-7 scale-[0.9] md:scale-100 ${LOCATION_TAG_STYLES[tone].glow}`}
            style={locationTagSurfaceStyle}
        >
            <span className={`absolute left-0 inset-y-1 w-1 rounded-r-sm ${LOCATION_TAG_STYLES[tone].accent}`} aria-hidden="true" />
            <span className="absolute -left-5 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border border-amber-800/55 bg-black/22 shadow-[0_0_0_1px_rgba(255,214,143,0.12),0_6px_12px_rgba(0,0,0,0.32)] md:h-12 md:w-12" aria-hidden="true" />
            <span className={`absolute -left-3.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-700/80 bg-stone-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_6px_11px_rgba(0,0,0,0.42)] md:-left-4 md:h-10 md:w-10 ${LOCATION_TAG_STYLES[tone].medallion}`}>
                <span className="absolute inset-1 rounded-full border border-amber-200/20" aria-hidden="true" />
                <Icon className={`relative h-4 w-4 md:h-5 md:w-5 ${LOCATION_TAG_STYLES[tone].icon}`} />
            </span>
            {(showBadge || !!badgeCount) && (
                <span className="absolute left-5 -bottom-1 flex min-h-3 min-w-3 items-center justify-center rounded-full border border-amber-950/70 bg-red-900/90 px-1 text-[8px] font-black leading-none text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_3px_6px_rgba(0,0,0,0.34)]">
                    {badgeCount ? Math.min(badgeCount, 99) : ''}
                </span>
            )}
            <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full border border-amber-900/50 bg-amber-300/45" aria-hidden="true" />
            <span className="absolute right-2 bottom-1.5 h-1.5 w-1.5 rounded-full border border-black/35 bg-black/30" aria-hidden="true" />
            <span className="relative flex min-w-0 flex-col items-start leading-none">
                <span className="max-w-[42vw] truncate text-[7px] font-black uppercase tracking-[0.16em] text-amber-100/58 md:text-[8px]">
                    {category}
                </span>
                <span className="mt-1 max-w-[50vw] truncate font-serif text-[12px] font-black uppercase tracking-[0.08em] text-amber-50 drop-shadow-[0_1px_1px_rgba(0,0,0,0.78)] md:text-[13px]">
                    {title}
                </span>
            </span>
            {showChevron && (
                <span className="absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 rotate-45 items-center justify-center border-2 border-amber-700/80 bg-stone-900 shadow-[0_4px_8px_rgba(0,0,0,0.32)]">
                    <ChevronRight className="h-3 w-3 -rotate-45 text-amber-100/52 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-100/80" />
                </span>
            )}
        </SfxButton>
    </div>
);

/**
 * MainScene Component
 * Displays the exterior town map as stacked full-scene layers.
 */
const MainScene: React.FC<MainSceneProps> = ({ onNavigate, onSettingsClick }) => {
    const { state, actions } = useGame();
    const { playSwitch } = useAudio();
    const language = state.settings.language;
    const sceneRef = useRef<HTMLDivElement | null>(null);
    const hitCanvasRefs = useRef<Partial<Record<PoiId, CanvasRenderingContext2D>>>({});
    const [hoveredPoi, setHoveredPoi] = useState<PoiLayer | null>(null);
    const [selectedPoi, setSelectedPoi] = useState<PoiLayer | null>(null);
    const [viewportSize, setViewportSize] = useState(getViewportSize);
    const [sceneMode, setSceneMode] = useState<SceneMode>(() => viewportSize.height > viewportSize.width ? 'portrait' : 'landscape');
    const sceneConfig = SCENE_CONFIGS[sceneMode];
    const sceneAspectRatio = sceneConfig.width / sceneConfig.height;
    const viewportAspectRatio = viewportSize.width / viewportSize.height;
    const coverWidth = viewportAspectRatio > sceneAspectRatio ? viewportSize.width : viewportSize.height * sceneAspectRatio;
    const coverHeight = viewportAspectRatio > sceneAspectRatio ? viewportSize.width / sceneAspectRatio : viewportSize.height;
    useEffect(() => {
        const handleResize = () => {
            const nextViewportSize = getViewportSize();
            setViewportSize(nextViewportSize);
            setSceneMode(nextViewportSize.height > nextViewportSize.width ? 'portrait' : 'landscape');
        };

        const visualViewport = window.visualViewport;
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        visualViewport?.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            visualViewport?.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        let isCancelled = false;

        const loadHitLayer = async (layer: PoiLayer) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = sceneConfig.poiSources[layer.id];
            await img.decode();
            if (isCancelled) return;

            const canvas = document.createElement('canvas');
            canvas.width = sceneConfig.width;
            canvas.height = sceneConfig.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            ctx.clearRect(0, 0, sceneConfig.width, sceneConfig.height);
            ctx.drawImage(img, 0, 0, sceneConfig.width, sceneConfig.height);
            hitCanvasRefs.current[layer.id] = ctx;
        };

        hitCanvasRefs.current = {};
        Promise.all(POI_LAYERS.map(loadHitLayer)).catch((error) => {
            console.error('[MainScene] Failed to prepare POI hit maps.', error);
        });

        return () => {
            isCancelled = true;
            hitCanvasRefs.current = {};
        };
    }, [sceneConfig]);

    const totalShopVisitors = useMemo(() => {
        return (state.activeCustomer ? 1 : 0) + state.shopQueue.length;
    }, [state.activeCustomer, state.shopQueue]);

    const getScenePoint = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const scene = sceneRef.current;
        if (!scene) return null;

        const rect = scene.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * sceneConfig.width;
        const y = ((event.clientY - rect.top) / rect.height) * sceneConfig.height;

        if (x < 0 || y < 0 || x >= sceneConfig.width || y >= sceneConfig.height) return null;
        return { x: Math.floor(x), y: Math.floor(y) };
    }, [sceneConfig.height, sceneConfig.width]);

    const findPoiAtPoint = useCallback((x: number, y: number) => {
        for (let index = POI_LAYERS.length - 1; index >= 0; index -= 1) {
            const layer = POI_LAYERS[index];
            const ctx = hitCanvasRefs.current[layer.id];
            if (!ctx) continue;

            try {
                const alpha = ctx.getImageData(x, y, 1, 1).data[3];
                if (alpha > ALPHA_HIT_THRESHOLD) return layer;
            } catch (error) {
                console.error('[MainScene] Failed to read POI hit map.', error);
                return null;
            }
        }
        return null;
    }, []);

    const navigateToPoi = useCallback((poi: PoiLayer, shouldPlaySound = true) => {
        if (poi.lockKey && !state.unlockedTabs.includes(poi.lockKey)) {
            actions.showToast("Facility locked.");
            return;
        }

        if (shouldPlaySound) playSwitch();
        onNavigate(poi.target);
    }, [actions, onNavigate, playSwitch, state.unlockedTabs]);

    const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const point = getScenePoint(event);
        const nextPoi = point ? findPoiAtPoint(point.x, point.y) : null;
        setHoveredPoi((current) => current?.id === nextPoi?.id ? current : nextPoi);
    }, [findPoiAtPoint, getScenePoint]);

    const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const point = getScenePoint(event);
        const poi = point ? findPoiAtPoint(point.x, point.y) : null;
        if (!poi) return;

        setSelectedPoi(poi);
        navigateToPoi(poi);
    }, [findPoiAtPoint, getScenePoint, navigateToPoi]);

    const activePoi = hoveredPoi || selectedPoi;

    return (
        <div className="fixed inset-0 z-0 bg-stone-950 overflow-hidden flex items-center justify-center animate-in fade-in duration-1000">
            {/* Scene Layer */}
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#14231a]">
                <div
                    ref={sceneRef}
                    className="relative shrink-0 overflow-hidden bg-stone-950 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
                    style={{
                        width: `${coverWidth}px`,
                        height: `${coverHeight}px`,
                        aspectRatio: `${sceneConfig.width} / ${sceneConfig.height}`,
                        cursor: hoveredPoi ? 'pointer' : 'default',
                    }}
                    role="application"
                    aria-label="Lockhart's Forge town map"
                    onPointerMove={handlePointerMove}
                    onPointerLeave={() => setHoveredPoi(null)}
                    onPointerDown={handlePointerDown}
                >
                    <img
                        src={sceneConfig.background}
                        className="absolute inset-0 h-full w-full select-none object-fill"
                        alt="Lockhart valley ground"
                        draggable={false}
                    />
                    {POI_LAYERS.map((layer) => (
                        <img
                            key={layer.id}
                            crossOrigin="anonymous"
                            src={sceneConfig.poiSources[layer.id]}
                            className={`absolute inset-0 h-full w-full select-none object-fill pointer-events-none transition-[filter] duration-150 ${
                                activePoi?.id === layer.id ? 'brightness-110 saturate-110 drop-shadow-[0_0_18px_rgba(251,191,36,0.32)]' : ''
                            }`}
                            alt=""
                            draggable={false}
                        />
                    ))}

                    <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                    <div className="absolute inset-0 shadow-[inset_0_0_110px_rgba(0,0,0,0.45)] pointer-events-none" />

                    <div className="absolute inset-0 z-[50] pointer-events-none">
                        <LocationTag
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={getAnchorStyle(sceneConfig, 'wall')}
                            category="Sector Depths"
                            title="Sortie Gate"
                            Icon={ShieldAlert}
                            tone="danger"
                            onClick={() => navigateToPoi(POI_LAYERS[0], false)}
                        />

                        <LocationTag
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={getAnchorStyle(sceneConfig, 'market')}
                            category={t(language, 'market.market_district')}
                            title={t(language, 'market.garricks_wares')}
                            Icon={ShoppingBag}
                            tone="market"
                            onClick={() => navigateToPoi(POI_LAYERS[1], false)}
                            tutorialId="MARKET_POI"
                        />

                        <LocationTag
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={getAnchorStyle(sceneConfig, 'tavern')}
                            category={t(language, 'mainScene.tavern_category')}
                            title={t(language, 'mainScene.tavern_label')}
                            Icon={Beer}
                            tone="tavern"
                            onClick={() => navigateToPoi(POI_LAYERS[2], false)}
                        />

                        <LocationTag
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={getAnchorStyle(sceneConfig, 'arena')}
                            category={t(language, 'mainScene.arena_category')}
                            title={t(language, 'mainScene.arena_label')}
                            Icon={Swords}
                            tone="arena"
                            onClick={() => navigateToPoi(POI_LAYERS[4], false)}
                        />

                        <LocationTag
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={getAnchorStyle(sceneConfig, 'forge')}
                            category={t(language, 'mainScene.forge_category')}
                            title={t(language, 'mainScene.forge_label')}
                            Icon={Store}
                            tone="forge"
                            onClick={() => navigateToPoi(POI_LAYERS[3], false)}
                            tutorialId="FORGE_POI"
                            showChevron={false}
                            badgeCount={state.forge.isShopOpen ? totalShopVisitors : 0}
                        />
                    </div>

                    {activePoi && (
                        <div className="absolute left-4 bottom-4 z-[55] rounded-md border border-stone-900/70 bg-stone-950/75 px-4 py-2 text-sm font-bold text-amber-100 shadow-xl backdrop-blur-sm pointer-events-none">
                            {activePoi.title}
                        </div>
                    )}
                </div>
            </div>

            <MainHud
                day={state.stats.day}
                energy={state.stats.energy}
                maxEnergy={state.stats.maxEnergy}
                gold={state.stats.gold}
                energyHighlighted={state.uiEffects.energyHighlight}
                showLogTicker={state.settings.showLogTicker}
                latestLog={state.logs[0] || ''}
                language={language}
                onRest={actions.rest}
                onSettingsClick={onSettingsClick}
                onToggleJournal={actions.toggleJournal}
            />
        </div>
    );
};

export default MainScene;
