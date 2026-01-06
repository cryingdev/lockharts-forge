
import Phaser from 'phaser';
import { getAssetUrl } from '../utils';
import { ManualDungeonSession, RoomType } from '../types/game-state';

export interface DungeonSceneData {
    session: ManualDungeonSession;
    moveEnergy: number;
    bossEnergy: number;
    onMove: (dx: number, dy: number) => void;
}

export default class DungeonScene extends Phaser.Scene {
    public add!: Phaser.GameObjects.GameObjectFactory;
    public tweens!: Phaser.Tweens.TweenManager;
    public scale!: Phaser.Scale.ScaleManager;
    public cameras!: Phaser.Cameras.Scene2D.CameraManager;
    public input!: Phaser.Input.InputPlugin;
    public time!: Phaser.Time.Clock;
    public events!: Phaser.Events.EventEmitter;
    public load!: Phaser.Loader.LoaderPlugin;
    public textures!: Phaser.Textures.TextureManager;
    public anims!: Phaser.Animations.AnimationManager;

    private session!: ManualDungeonSession;
    private onMoveCallback!: (dx: number, dy: number) => void;
    
    private root!: Phaser.GameObjects.Container;
    private mapLayer!: Phaser.GameObjects.Container;
    private contentLayer!: Phaser.GameObjects.Container;
    private playerLayer!: Phaser.GameObjects.Container;
    
    private playerMarker!: Phaser.GameObjects.Container;
    private revealedTiles: Set<string> = new Set();
    
    private sprayEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    
    private tileWidth = 84;
    private tileGap = 8;
    private isMoving = false;

    // 드래그 관련 변수
    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;

    constructor() {
        super('DungeonScene');
    }

    init(data: DungeonSceneData) {
        this.session = data.session;
        this.onMoveCallback = data.onMove;
    }

    preload() {
        this.load.image('sparkle', getAssetUrl('particle_spark1.png'));
    }

    create() {
        this.cameras.main.setBackgroundColor(0x000000);

        this.root = this.add.container(0, 0);

        this.mapLayer = this.add.container(0, 0);
        this.contentLayer = this.add.container(0, 0);
        this.playerLayer = this.add.container(0, 0);
        
        this.root.add([this.mapLayer, this.contentLayer, this.playerLayer]);

        // 스프레이 입자 설정
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
        this.alignViewToEntrance();
        
        this.scale.on('resize', () => this.alignViewToEntrance(), this);
        this.setupDragControls();
    }

    private setupDragControls() {
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isDragging = true;
            this.dragStartX = pointer.x - this.root.x;
            this.dragStartY = pointer.y - this.root.y;
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.isDragging) return;
            this.root.setPosition(pointer.x - this.dragStartX, pointer.y - this.dragStartY);
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        this.input.on('pointerout', () => {
            this.isDragging = false;
        });
    }

    private initialRender() {
        const { grid, visited } = this.session;
        const rows = grid.length;
        const cols = grid[0].length;

        this.mapLayer.removeAll(true);
        this.contentLayer.removeAll(true);
        this.revealedTiles.clear();

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
        if (this.revealedTiles.has(key)) return;

        const tx = x * (this.tileWidth + this.tileGap);
        const ty = y * (this.tileWidth + this.tileGap);

        // 바닥 타일
        const tile = this.add.rectangle(tx, ty, this.tileWidth, this.tileWidth, 0x1c1917)
            .setStrokeStyle(2, 0x44403c)
            .setOrigin(0.5);
        this.mapLayer.add(tile);

        // 콘텐츠
        const content = this.createRoomContents(type, tx, ty);

        if (animate) {
            this.sprayEmitter.emitParticleAt(tx, ty, 15);
            tile.setAlpha(0).setScale(0.7);
            if (content) content.setAlpha(0).setScale(0.5);

            this.tweens.add({
                targets: tile,
                alpha: 1,
                scale: 1,
                duration: 600,
                ease: 'Back.easeOut'
            });

            if (content) {
                this.tweens.add({
                    targets: content,
                    alpha: 1,
                    scale: 1,
                    duration: 500,
                    delay: 200,
                    ease: 'Cubic.easeOut'
                });
            }
        }

        this.revealedTiles.add(key);
    }

    private createRoomContents(type: RoomType, x: number, y: number) {
        let content: Phaser.GameObjects.Text | null = null;
        switch (type) {
            case 'BOSS':
                content = this.add.text(x, y, '💀', { fontSize: '32px' }).setOrigin(0.5);
                if (this.session.isBossLocked && !this.session.hasKey) content.setAlpha(0.3);
                break;
            case 'KEY':
                content = this.add.text(x, y, '🔑', { fontSize: '28px' }).setOrigin(0.5);
                break;
            case 'ENTRANCE':
                content = this.add.text(x, y, '🚪', { fontSize: '28px' }).setOrigin(0.5);
                break;
        }
        if (content) {
            this.contentLayer.add(content);
        }
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

        this.tweens.add({
            targets: visual,
            y: -8,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private alignViewToEntrance() {
        const { width, height } = this.scale;
        const { grid } = this.session;
        const { x, y } = this.session.playerPos;
        
        const yOffset = -height * 0.15;
        const currentScale = 1.0;
        this.root.setScale(currentScale);

        const targetX = x * (this.tileWidth + this.tileGap);
        const targetY = y * (this.tileWidth + this.tileGap);

        this.root.setPosition((width / 2) - (targetX * currentScale), (height / 2 + yOffset) - (targetY * currentScale));
    }

    public updateSession(newSession: ManualDungeonSession) {
        this.session = newSession;
        const { x, y } = newSession.playerPos;
        const targetLocalX = x * (this.tileWidth + this.tileGap);
        const targetLocalY = y * (this.tileWidth + this.tileGap);

        this.isMoving = true;
        
        this.tweens.add({
            targets: this.playerMarker,
            x: targetLocalX,
            y: targetLocalY,
            duration: 300,
            ease: 'Cubic.out',
            onComplete: () => {
                this.isMoving = false;
                if (newSession.visited[y][x]) {
                    this.drawRevealedTile(x, y, newSession.grid[y][x], true);
                }
            }
        });
    }

    public move(dx: number, dy: number) {
        if (this.isMoving) return;
        this.onMoveCallback(dx, dy);
    }
}
