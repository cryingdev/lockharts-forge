import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShieldAlert, ShoppingBag, Store, Beer, Swords } from 'lucide-react';
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
type InteractivePoiId = Exclude<PoiId, 'people'>;
type SceneMode = 'landscape' | 'portrait';

interface PoiLayer {
    id: InteractivePoiId;
    title: string;
    target: 'DUNGEON' | 'MARKET' | 'TAVERN' | 'FORGE_BUILDING' | 'ARENA';
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
const POI_IMAGE_LAYERS: PoiId[] = ['wall', 'market', 'tavern', 'forge', 'arena', 'people'];

const POI_LAYERS: PoiLayer[] = [
    { id: 'wall', title: 'Sortie Gate', target: 'DUNGEON', lockKey: 'DUNGEON' },
    { id: 'market', title: "Garrick's Wares", target: 'MARKET', lockKey: 'MARKET' },
    { id: 'tavern', title: 'Tavern', target: 'TAVERN', lockKey: 'TAVERN' },
    { id: 'forge', title: "Lockhart's Forge", target: 'FORGE_BUILDING' },
    { id: 'arena', title: 'Arena', target: 'ARENA', lockKey: 'ARENA' },
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
            market: { x: 317, y: 944 },
            tavern: { x: 736, y: 937 },
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
        medallion: 'bg-stone-950/72',
        glow: 'group-hover:shadow-red-950/35',
    },
    market: {
        accent: 'bg-blue-700/75',
        icon: 'text-blue-100',
        medallion: 'bg-stone-950/72',
        glow: 'group-hover:shadow-blue-950/35',
    },
    tavern: {
        accent: 'bg-orange-700/75',
        icon: 'text-amber-100',
        medallion: 'bg-stone-950/72',
        glow: 'group-hover:shadow-orange-950/35',
    },
    forge: {
        accent: 'bg-amber-700/75',
        icon: 'text-amber-200',
        medallion: 'bg-stone-950/72',
        glow: 'group-hover:shadow-amber-950/35',
    },
    arena: {
        accent: 'bg-rose-700/75',
        icon: 'text-rose-200',
        medallion: 'bg-stone-950/72',
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
    badgeCount,
    showBadge = false,
    active = false,
    onHoverChange,
}: {
    className: string;
    style?: React.CSSProperties;
    category: string;
    title: string;
    Icon: React.ElementType;
    tone: LocationTagTone;
    onClick: () => void;
    tutorialId?: string;
    badgeCount?: number;
    showBadge?: boolean;
    active?: boolean;
    onHoverChange?: (hovered: boolean) => void;
}) => (
    <div className={className} style={style}>
        <SfxButton
            sfx="switch"
            onClick={onClick}
            onPointerEnter={() => onHoverChange?.(true)}
            onPointerLeave={() => onHoverChange?.(false)}
            onPointerMove={(event) => event.stopPropagation()}
            onMouseEnter={() => onHoverChange?.(true)}
            onMouseLeave={() => onHoverChange?.(false)}
            onMouseMove={(event) => event.stopPropagation()}
            onFocus={() => onHoverChange?.(true)}
            onBlur={() => onHoverChange?.(false)}
            onPointerDown={(event) => event.stopPropagation()}
            data-tutorial-id={tutorialId}
            className={`group pointer-events-auto relative inline-flex min-h-[44px] w-max max-w-[76vw] items-center gap-2.5 overflow-visible rounded-[3px] border py-2 pl-10 pr-5 shadow-xl backdrop-blur-[2px] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-2xl active:translate-y-0 active:scale-[0.98] md:min-h-[52px] md:gap-3 md:pl-12 md:pr-6 ${active ? '-translate-y-0.5 brightness-110 shadow-2xl' : ''} ${LOCATION_TAG_STYLES[tone].glow}`}
            style={locationTagSurfaceStyle}
        >
            <span className={`absolute left-0 inset-y-1 w-1 rounded-r-sm ${LOCATION_TAG_STYLES[tone].accent}`} aria-hidden="true" />
            <span className={`absolute -left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-stone-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_1px_rgba(181,118,42,0.66),0_6px_11px_rgba(0,0,0,0.42)] md:-left-5 md:h-12 md:w-12 ${LOCATION_TAG_STYLES[tone].medallion}`}>
                <Icon className={`relative h-5 w-5 md:h-6 md:w-6 ${LOCATION_TAG_STYLES[tone].icon}`} />
            </span>
            {(showBadge || !!badgeCount) && (
                <span className="absolute left-5 -bottom-1 flex min-h-3 min-w-3 items-center justify-center rounded-full border border-amber-950/70 bg-red-900/90 px-1 text-[8px] font-black leading-none text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_3px_6px_rgba(0,0,0,0.34)]">
                    {badgeCount ? Math.min(badgeCount, 99) : ''}
                </span>
            )}
            <span className="relative flex min-w-0 flex-col items-start leading-none">
                <span className="max-w-[44vw] truncate text-[8px] font-black uppercase tracking-[0.16em] text-amber-100/58 md:text-[10px]">
                    {category}
                </span>
                <span className="mt-1.5 max-w-[54vw] truncate font-serif text-[15px] font-black uppercase tracking-[0.08em] text-amber-50 drop-shadow-[0_1px_1px_rgba(0,0,0,0.78)] md:text-[18px]">
                    {title}
                </span>
            </span>
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
                    {POI_IMAGE_LAYERS.map((id) => (
                        <img
                            key={id}
                            crossOrigin="anonymous"
                            src={sceneConfig.poiSources[id]}
                            className={`absolute inset-0 h-full w-full select-none object-fill pointer-events-none transition-[filter] duration-150 ${
                                activePoi?.id === id ? 'animate-poi-highlight brightness-110 saturate-110 drop-shadow-[0_0_18px_rgba(251,191,36,0.32)]' : ''
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
                            active={activePoi?.id === 'wall'}
                            onHoverChange={(isHovered) => setHoveredPoi((current) => isHovered ? POI_LAYERS[0] : current?.id === 'wall' ? null : current)}
                        />

                        <LocationTag
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={getAnchorStyle(sceneConfig, 'market')}
                            category={t(language, 'market.market_district')}
                            title="Garrick's"
                            Icon={ShoppingBag}
                            tone="market"
                            onClick={() => navigateToPoi(POI_LAYERS[1], false)}
                            tutorialId="MARKET_POI"
                            active={activePoi?.id === 'market'}
                            onHoverChange={(isHovered) => setHoveredPoi((current) => isHovered ? POI_LAYERS[1] : current?.id === 'market' ? null : current)}
                        />

                        <LocationTag
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={getAnchorStyle(sceneConfig, 'tavern')}
                            category={t(language, 'mainScene.tavern_category')}
                            title="Tavern"
                            Icon={Beer}
                            tone="tavern"
                            onClick={() => navigateToPoi(POI_LAYERS[2], false)}
                            active={activePoi?.id === 'tavern'}
                            onHoverChange={(isHovered) => setHoveredPoi((current) => isHovered ? POI_LAYERS[2] : current?.id === 'tavern' ? null : current)}
                        />

                        <LocationTag
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={getAnchorStyle(sceneConfig, 'arena')}
                            category={t(language, 'mainScene.arena_category')}
                            title={t(language, 'mainScene.arena_label')}
                            Icon={Swords}
                            tone="arena"
                            onClick={() => navigateToPoi(POI_LAYERS[4], false)}
                            active={activePoi?.id === 'arena'}
                            onHoverChange={(isHovered) => setHoveredPoi((current) => isHovered ? POI_LAYERS[4] : current?.id === 'arena' ? null : current)}
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
                            badgeCount={state.forge.isShopOpen ? totalShopVisitors : 0}
                            active={activePoi?.id === 'forge'}
                            onHoverChange={(isHovered) => setHoveredPoi((current) => isHovered ? POI_LAYERS[3] : current?.id === 'forge' ? null : current)}
                        />
                    </div>
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
