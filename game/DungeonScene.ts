import Phaser from 'phaser';
import { getAssetUrl } from '../utils';
import { ManualDungeonSession, RoomType } from '../types/game-state';
import { materials } from '../data/materials';
import { rng } from '../utils/random';

export type CameraMode = 'LOCKED' | 'ADAPTIVE' | 'FREE';

export interface DungeonSceneData {
    session: ManualDungeonSession;
    moveEnergy: number;
    bossEnergy: number;
    onMove: (dx: number, dy: number) => void;
    cameraMode: CameraMode;
    initialZoom?: number;
}

export default class DungeonScene extends Phaser.Scene {
    declare public add: Phaser.GameObjects.GameObjectFactory;
    declare public tweens: Phaser.Tweens.TweenManager;
    declare public scale: Phaser.Scale.ScaleManager;
    declare public cameras: Phaser.Cameras.Scene2D.CameraManager;
    declare public input: Phaser.Input.InputPlugin;
    declare public time: Phaser.Time.Clock;
    declare public events: Phaser.Events.EventEmitter;
    declare public load: Phaser.Loader.LoaderPlugin;
    declare public textures: Phaser.Textures.TextureManager;
    declare public anims: Phaser.Animations.AnimationManager;

    private session!: ManualDungeonSession;
    private onMoveCallback!: (dx: number, dy: number) => void;
    private cameraMode: CameraMode = 'LOCKED';
    private zoom: number = 1.0;
    
    private root!: Phaser.GameObjects.Container;
    private mapLayer!: Phaser.GameObjects.Container;
    private contentLayer!: Phaser.GameObjects.Container;
    private playerLayer!: Phaser.GameObjects.Container;
    private fxLayer!: Phaser.GameObjects.Container;
    
    private playerMarker!: Phaser.GameObjects.Container;
    private playerCircle!: Phaser.GameObjects.Arc;
    private playerVisual!: Phaser.GameObjects.Container;
    
    private revealedTiles: Set<string> = new Set();
    private contentByCoord: Map<string, Phaser.GameObjects.GameObject> = new Map();
    
    private sprayEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private vignette!: Phaser.GameObjects.Graphics;
    private redFocusOverlay!: Phaser.GameObjects.Graphics;
    
    private uiCamera!: Phaser.Cameras.Scene2D.Camera;
    
    private tileWidth = 84;
    private tileGap = 8;
    private isMoving = false;

    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;

    private cameraTrackTween: Phaser.Tweens.Tween | null = null;
    private pixelateFX: any = null;

    constructor() {
        super('DungeonScene');
    }

    init(data: DungeonSceneData) {
        this.session = data.session;
        this.onMoveCallback = data.onMove;
        this.cameraMode = data.cameraMode ?? 'LOCKED';
        this.zoom = data.initialZoom ?? 1.0;
    }

    preload() {
        this.load.image('sparkle', getAssetUrl('particle_spark1.png'));
        this.load.image('red_mist', getAssetUrl('particle_spark2.png'));
        this.load.image('dungeon_tile_campfire', getAssetUrl('dungeon_tile_campfire.png', 'dungeons'));
    }

    create() {
        const { width, height } = this.scale;
        
        this.cameras.main.setBackgroundColor(0x000000);
        this.cameras.main.setZoom(this.zoom);

        this.uiCamera = this.cameras.add(0, 0, width, height).setName('HUD');
        this.uiCamera.setScroll(0, 0);
        this.uiCamera.setZoom(1);

        this.root = this.add.container(0, 0);
        this.mapLayer = this.add.container(0, 0);
        this.contentLayer = this.add.container(0, 0);
        this.playerLayer = this.add.container(0, 0);
        this.fxLayer = this.add.container(0, 0).setDepth(100);
        
        // Add layers to root so they move together
        this.root.add([this.mapLayer, this.contentLayer, this.playerLayer, this.fxLayer]);

        this.vignette = this.add.graphics().setDepth(200).setScrollFactor(0);
        this.redFocusOverlay = this.add.graphics().setDepth(210).setScrollFactor(0);
        
        this.cameras.main.ignore([this.vignette, this.redFocusOverlay]);
        this.uiCamera.ignore(this.root);

        this.sprayEmitter = this.add.particles(0, 0, 'sparkle', {
            speed: { min: 60, max: 140 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 800,
            gravityY: 80,
            blendMode: 'ADD',
            emitting: false
        });
        this.root.add(this.sprayEmitter);

        this.initialRender();
        this.createPlayer();
        this.alignViewToPlayer(); 
        
        this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
            this.uiCamera.setSize(gameSize.width, gameSize.height);
            this.alignViewToPlayer();
            this.drawRedFocus();
        }, this);
        this.setupDragControls();

        this.drawRedFocus();
    }

    public updateZoom(newZoom: number) {
        this.zoom = newZoom;
        this.cameras.main.setZoom(newZoom);
        this.alignViewToPlayer();
    }

    public setCameraMode(mode: CameraMode) {
        this.cameraMode = mode;
        if (mode === 'LOCKED' && !this.isMoving) {
            this.alignViewToPlayer(); 
        }
    }

    private drawRedFocus() {
        const { width, height } = this.scale;
        this.redFocusOverlay.clear();
        
        const isFocusNeeded = this.session.encounterStatus === 'ENCOUNTERED' || this.session.encounterStatus === 'BATTLE' || this.session.encounterStatus === 'CAMP';
        if (!isFocusNeeded) return;

        this.redFocusOverlay.setScale(1);

        const thickness = 140; 
        const color = 0x7f1d1d;
        const outerAlpha = 0.75;
        const innerAlpha = 0;

        this.redFocusOverlay.fillGradientStyle(color, color, color, color, outerAlpha, outerAlpha, innerAlpha, innerAlpha);
        this.redFocusOverlay.fillRect(0, 0, width, thickness);

        this.redFocusOverlay.fillGradientStyle(color, color, color, color, innerAlpha, innerAlpha, outerAlpha, outerAlpha);
        this.redFocusOverlay.fillRect(0, height - thickness, width, thickness);

        this.redFocusOverlay.fillGradientStyle(color, color, color, color, outerAlpha, innerAlpha, outerAlpha, innerAlpha);
        this.redFocusOverlay.fillRect(0, 0, thickness, height);

        this.redFocusOverlay.fillGradientStyle(color, color, color, color, innerAlpha, outerAlpha, innerAlpha, outerAlpha);
        this.redFocusOverlay.fillRect(width - thickness, 0, thickness, height);
    }

    public playEncounterEffect() {
        this.cameras.main.zoomTo(2.5, 2000, 'Cubic.easeInOut');
        
        if (this.cameras.main.postFX) {
            try {
                this.pixelateFX = this.cameras.main.postFX.addPixelate(2);
                this.tweens.add({
                    targets: this.pixelateFX,
                    amount: 32,
                    duration: 2000,
                    ease: 'Quad.easeIn'
                });
            } catch (e) {
                console.warn("Failed to add PixelateFX:", e);
            }
        }

        this.cameras.main.shake(2000, 0.005);
    }

    public resetEncounterEffect(targetZoom: number) {
        this.cameras.main.zoomTo(targetZoom, 1000, 'Cubic.easeOut');

        if (this.pixelateFX) {
            this.tweens.add({
                targets: this.pixelateFX,
                amount: 2,
                duration: 800,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    if (this.cameras.main.postFX) {
                        this.cameras.main.postFX.remove(this.pixelateFX);
                    }
                    this.pixelateFX = null;
                }
            });
        }
    }

    public showFloatingGold(amount: number) {
        const x = this.playerMarker.x;
        const y = this.playerMarker.y;

        const floatText = this.add.text(x, y - 40, `💰 +${amount}G`, {
            fontFamily: 'Grenze Gotisch',
            fontSize: '32px',
            color: '#fbbf24',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5,
            shadow: { color: '#000', fill: true, blur: 10 }
        }).setOrigin(0.5).setDepth(300);

        // Add to root so it moves with the map
        this.root.add(floatText);

        this.tweens.add({
            targets: floatText,
            y: y - 140,
            alpha: 0,
            scale: 1.2,
            duration: 1200,
            ease: 'Cubic.easeOut',
            onComplete: () => floatText.destroy()
        });
    }

    /**
     * 아이템 획득 시 이미지와 수량이 머리 위로 떠오르는 효과
     */
    public showFloatingItem(itemId: string, amount: number) {
        const x = this.playerMarker.x + (rng.standard(-20, 20, 0)); // 약간의 위치 편차
        const y = this.playerMarker.y;
        
        const item = materials[itemId];
        const isSkill = item?.type === 'SKILL_BOOK' || item?.type === 'SKILL_SCROLL';
        const folder = isSkill ? 'skills' : 'materials';
        const fileName = item?.image || `${itemId}.png`;
        const assetUrl = getAssetUrl(fileName, folder);

        const key = `float_loot_${itemId}`;
        const renderFloating = () => {
            const container = this.add.container(x, y - 50).setDepth(310);
            
            // Add to root so it moves with the map
            this.root.add(container);

            const icon = this.add.image(0, 0, key).setDisplaySize(42, 42);
            const text = this.add.text(25, 0, `x${amount}`, {
                fontFamily: 'Grenze Gotisch',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            
            container.add([icon, text]);
            container.setAlpha(0).setScale(0.5);

            this.tweens.add({
                targets: container,
                y: y - 160,
                alpha: { from: 0, to: 1 },
                scale: 1.2,
                duration: 400,
                ease: 'Back.out'
            });

            this.tweens.add({
                targets: container,
                y: y - 220,
                alpha: 0,
                delay: 800,
                duration: 600,
                ease: 'Cubic.in',
                onComplete: () => container.destroy()
            });
        };

        if (this.textures.exists(key)) {
            renderFloating();
        } else {
            // 텍스처가 없는 경우 동적으로 로드 후 렌더링
            this.load.image(key, assetUrl);
            this.load.once('complete', renderFloating);
            this.load.start();
        }
    }

    /**
     * 함정 밟았을 때 빨간색 깜빡임 및 흔들림 효과
     */
    public playTrapEffect() {
        if (!this.playerCircle || !this.playerVisual) return;

        // 원 색상을 빨간색으로 변경
        this.playerCircle.setFillStyle(0xef4444, 1);
        
        // 흔들림 효과 (더 빠르게 조정하여 타격감 개선)
        this.tweens.add({
            targets: this.playerVisual,
            x: { from: -8, to: 8 },
            duration: 50,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                // 위치 즉시 초기화
                this.playerVisual.setX(0);
            }
        });

        // 0.1초(100ms) 후 즉시 색상 복구 시작
        this.time.delayedCall(100, () => {
            this.tweens.add({
                targets: this.playerCircle,
                fillColor: 0x6366f1,
                duration: 100,
                ease: 'Linear'
            });
        });
    }

    private setupDragControls() {
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.session.encounterStatus === 'BATTLE' || this.session.encounterStatus === 'ENCOUNTERED' || this.session.encounterStatus === 'CAMP') return;
            this.isDragging = true;
            this.dragStartX = pointer.x - this.root.x;
            this.dragStartY = pointer.y - this.root.y;
            
            if (this.cameraTrackTween) {
                this.cameraTrackTween.stop();
                this.cameraTrackTween = null;
            }
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.isDragging) return;
            this.root.setPosition(pointer.x - this.dragStartX, pointer.y - this.dragStartY);
        });

        this.input.on('pointerup', () => { this.isDragging = false; });
    }

    private initialRender() {
        const { grid, visited } = this.session;
        const rows = grid.length;
        const cols = grid[0].length;

        this.mapLayer.removeAll(true);
        this.contentLayer.removeAll(true);
        this.revealedTiles.clear();
        this.contentByCoord.clear();

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (visited[y][x]) {
                    this.drawRevealedTile(x, y, grid[y][x], false);
                }
            }
        }
    }

    private drawRevealedTile(x: number, y: number, type: RoomType, animate: boolean) {
        const key = `${x},${y}`;
        const tx = x * (this.tileWidth + this.tileGap);
        const ty = y * (this.tileWidth + this.tileGap);

        if (!this.revealedTiles.has(key)) {
            const tile = this.add.rectangle(tx, ty, this.tileWidth, this.tileWidth, 0x1c1917)
                .setStrokeStyle(2, 0x44403c)
                .setOrigin(0.5);
            this.mapLayer.add(tile);
            if (animate) {
                this.sprayEmitter.emitParticleAt(tx, ty, 15);
                tile.setAlpha(0).setScale(0.7);
                this.tweens.add({ targets: tile, alpha: 1, scale: 1, duration: 600, ease: 'Back.easeOut' });
            }
            this.revealedTiles.add(key);
        }
        
        const content = this.createRoomContents(type, x, y, tx, ty);
        if (content) {
            this.contentByCoord.set(key, content);
            if (animate) {
                const animatedContent = content as Phaser.GameObjects.Text | Phaser.GameObjects.Image;
                animatedContent.setAlpha(0).setScale(0.5);
                this.tweens.add({ targets: animatedContent, alpha: 1, scale: 1, duration: 500, delay: 200, ease: 'Cubic.easeOut' });
            }
        }
    }

    private createRoomContents(type: RoomType, gridX: number, gridY: number, x: number, y: number) {
        let content: Phaser.GameObjects.GameObject | null = null;
        const campKey = `${this.session.currentFloor}:${gridX},${gridY}`;
        const isConsumedCamp = (this.session.consumedCampKeys || []).includes(campKey);
        switch (type) {
            case 'BOSS':
                content = this.add.text(x, y, '💀', { fontSize: '32px' }).setOrigin(0.5);
                if (this.session.isBossLocked && !this.session.hasKey) (content as Phaser.GameObjects.Text).setAlpha(0.3);
                break;
            case 'ENEMY':
                content = this.add.text(x, y, '⚔️', { fontSize: '28px' }).setOrigin(0.5);
                break;
            case 'RESOURCE':
                content = this.add.text(x, y, rng.chance(0.5) ? '💎' : '📦', { fontSize: '28px' }).setOrigin(0.5);
                break;
            case 'STAIRS':
                content = this.add.text(x, y, '🪜', { fontSize: '32px' }).setOrigin(0.5);
                break;
            case 'KEY': content = this.add.text(x, y, '🔑', { fontSize: '28px' }).setOrigin(0.5); break;
            case 'ENTRANCE': content = this.add.text(x, y, '🚪', { fontSize: '28px' }).setOrigin(0.5); break;
            case 'GOLD': content = this.add.text(x, y, '💰', { fontSize: '28px' }).setOrigin(0.5); break;
            case 'TRAP': content = this.add.text(x, y, '🕸️', { fontSize: '28px' }).setOrigin(0.5); break;
            case 'CAMP':
                if (this.textures.exists('dungeon_tile_campfire')) {
                    const campSize = this.tileWidth * 0.8;
                    const campImage = this.add.image(x, y, 'dungeon_tile_campfire').setDisplaySize(campSize, campSize).setOrigin(0.5);
                    if (isConsumedCamp) {
                        campImage.setTint(0x7a7a7a).setAlpha(0.78);
                    }
                    content = campImage;
                } else {
                    const campEmoji = this.add.text(x, y, '🔥', { fontSize: '30px' }).setOrigin(0.5);
                    if (isConsumedCamp) {
                        campEmoji.setTint(0x9a9a9a).setAlpha(0.7);
                    }
                    content = campEmoji;
                }
                break;
            case 'NPC':
                if (this.session.npcFound) return null;
                content = this.add.text(x, y, '👤', { fontSize: '30px' }).setOrigin(0.5);
                break;
        }
        if (content) this.contentLayer.add(content);
        return content;
    }

    private createPlayer() {
        const { x, y } = this.session.playerPos;
        const px = x * (this.tileWidth + this.tileGap);
        const py = y * (this.tileWidth + this.tileGap);
        
        this.playerVisual = this.add.container(0, 0);
        this.playerCircle = this.add.circle(0, 0, 26, 0x6366f1, 0.9).setStrokeStyle(3, 0xffffff);
        const icon = this.add.text(0, 0, '👤', { fontSize: '24px' }).setOrigin(0.5);
        
        this.playerVisual.add([this.playerCircle, icon]);
        this.playerMarker = this.add.container(px, py, [this.playerVisual]);
        this.playerLayer.add(this.playerMarker);
        
        this.tweens.add({ 
            targets: this.playerVisual, 
            y: -8, 
            duration: 800, 
            yoyo: true, 
            repeat: -1, 
            ease: 'Sine.easeInOut' 
        });
    }

    private alignViewToPlayer() {
        const { width, height } = this.scale;
        const { x, y } = this.session.playerPos;
        const targetX = x * (this.tileWidth + this.tileGap);
        const targetY = y * (this.tileWidth + this.tileGap);
        this.root.setPosition((width / 2) - (targetX), (height / 2) - (targetY));
    }

    public updateSession(newSession: ManualDungeonSession) {
        const oldStatus = this.session.encounterStatus;
        const oldFloor = this.session.currentFloor;
        this.session = newSession;
        
        if (oldFloor !== newSession.currentFloor) {
            this.initialRender();
        }

        if (oldStatus !== newSession.encounterStatus) this.drawRedFocus();
        const { width, height } = this.scale;
        const { x, y } = newSession.playerPos;
        const targetLocalX = x * (this.tileWidth + this.tileGap);
        const targetLocalY = y * (this.tileWidth + this.tileGap);
        this.isMoving = true;
        this.tweens.add({
            targets: this.playerMarker, x: targetLocalX, y: targetLocalY, duration: 300, ease: 'Cubic.out',
            onComplete: () => { this.isMoving = false; this.initialRender(); }
        });
        if (this.cameraMode !== 'FREE') {
            const targetRootX = (width / 2) - targetLocalX;
            const targetRootY = (height / 2) - targetLocalY;
            if (this.cameraTrackTween) this.cameraTrackTween.stop();
            this.cameraTrackTween = this.tweens.add({ targets: this.root, x: targetRootX, y: targetRootY, duration: 600, ease: 'Cubic.out' });
        }
    }

    public move(dx: number, dy: number) {
        if (this.isMoving) return;
        this.onMoveCallback(dx, dy);
    }
}
