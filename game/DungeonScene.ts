import Phaser from 'phaser';
import { getAssetUrl } from '../utils';
import { ManualDungeonSession, RoomType } from '../types/game-state';

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
    private revealedTiles: Set<string> = new Set();
    private contentByCoord: Map<string, Phaser.GameObjects.Text> = new Map();
    
    private sprayEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private vignette!: Phaser.GameObjects.Graphics;
    private redFocusOverlay!: Phaser.GameObjects.Graphics;
    
    private tileWidth = 84;
    private tileGap = 8;
    private isMoving = false;

    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;

    private cameraTrackTween: Phaser.Tweens.Tween | null = null;

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
    }

    create() {
        this.cameras.main.setBackgroundColor(0x000000);
        this.cameras.main.setZoom(this.zoom);

        this.root = this.add.container(0, 0);

        this.mapLayer = this.add.container(0, 0);
        this.contentLayer = this.add.container(0, 0);
        this.playerLayer = this.add.container(0, 0);
        this.fxLayer = this.add.container(0, 0).setDepth(100);
        
        this.root.add([this.mapLayer, this.contentLayer, this.playerLayer]);

        this.vignette = this.add.graphics().setDepth(200).setScrollFactor(0);
        this.redFocusOverlay = this.add.graphics().setDepth(210).setScrollFactor(0);
        
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
        
        this.scale.on('resize', () => {
            this.alignViewToPlayer();
            this.drawRedFocus();
        }, this);
        this.setupDragControls();

        this.drawRedFocus();
    }

    public updateZoom(newZoom: number) {
        this.zoom = newZoom;
        this.cameras.main.setZoom(newZoom);
        // 줌 변경 후 즉시 화면 중앙 정렬
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
        
        const isFocusNeeded = this.session.encounterStatus === 'ENCOUNTERED' || this.session.encounterStatus === 'BATTLE';
        if (!isFocusNeeded) return;

        const thickness = 60;
        this.redFocusOverlay.fillStyle(0x7f1d1d, 0.4);
        
        this.redFocusOverlay.fillRect(0, 0, width, thickness);
        this.redFocusOverlay.fillRect(0, height - thickness, width, thickness);
        this.redFocusOverlay.fillRect(0, thickness, thickness, height - thickness * 2);
        this.redFocusOverlay.fillRect(width - thickness, thickness, thickness, height - thickness * 2);

        if (Math.random() > 0.7) {
            const rx = Math.random() * width;
            const ry = Math.random() * height;
            if (rx < thickness || rx > width - thickness || ry < thickness || ry > height - thickness) {
                this.add.particles(rx, ry, 'red_mist', {
                    speed: { min: 10, max: 30 },
                    scale: { start: 0.8, end: 0 },
                    alpha: { start: 0.4, end: 0 },
                    lifespan: 2000,
                    tint: 0xef4444,
                    blendMode: 'ADD'
                }).explode(3);
            }
        }
    }

    private setupDragControls() {
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.session.encounterStatus === 'BATTLE') return;
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
        
        const content = this.createRoomContents(type, tx, ty);
        if (content) {
            this.contentByCoord.set(key, content);
            if (animate) {
                content.setAlpha(0).setScale(0.5);
                this.tweens.add({ targets: content, alpha: 1, scale: 1, duration: 500, delay: 200, ease: 'Cubic.easeOut' });
            }
        }
    }

    private createRoomContents(type: RoomType, x: number, y: number) {
        let content: Phaser.GameObjects.Text | null = null;
        switch (type) {
            case 'BOSS':
                content = this.add.text(x, y, '💀', { fontSize: '32px' }).setOrigin(0.5);
                if (this.session.isBossLocked && !this.session.hasKey) content.setAlpha(0.3);
                break;
            case 'KEY': content = this.add.text(x, y, '🔑', { fontSize: '28px' }).setOrigin(0.5); break;
            case 'ENTRANCE': content = this.add.text(x, y, '🚪', { fontSize: '28px' }).setOrigin(0.5); break;
            case 'GOLD': content = this.add.text(x, y, '💰', { fontSize: '28px' }).setOrigin(0.5); break;
            case 'TRAP': content = this.add.text(x, y, '🕸️', { fontSize: '28px' }).setOrigin(0.5); break;
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
        const visual = this.add.container(0, 0);
        const circle = this.add.circle(0, 0, 26, 0x6366f1, 0.9).setStrokeStyle(3, 0xffffff);
        const icon = this.add.text(0, 0, '👤', { fontSize: '24px' }).setOrigin(0.5);
        visual.add([circle, icon]);
        this.playerMarker = this.add.container(px, py, [visual]);
        this.playerLayer.add(this.playerMarker);
        this.tweens.add({ targets: visual, y: -8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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
        this.session = newSession;
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