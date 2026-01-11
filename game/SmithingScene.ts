import Phaser from 'phaser';
import { getAssetUrl } from '../utils';

export interface SmithingSceneData {
  onComplete: (score: number) => void;
  onStatusUpdate?: (temp: number) => void;
  onHeatUpRequest?: () => void;
  difficulty: number;
  initialTemp: number;
  charcoalCount: number | string;
}

interface Point {
  x: number;
  y: number;
}

type SmithingTool = 'HAMMER' | 'TONGS';

export default class SmithingScene extends Phaser.Scene {
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

  private backgroundTile!: Phaser.GameObjects.TileSprite;
  private bgOverlay!: Phaser.GameObjects.Rectangle;
  private anvilImage!: Phaser.GameObjects.Image;

  private targetRing!: Phaser.GameObjects.Graphics;
  private approachRing!: Phaser.GameObjects.Graphics;
  private targetOutlineGraphics!: Phaser.GameObjects.Graphics;

  private progressBar!: Phaser.GameObjects.Rectangle;
  private comboText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private qualityText!: Phaser.GameObjects.Text;

  private ambientGlow!: Phaser.GameObjects.Arc;
  private flashOverlay!: Phaser.GameObjects.Rectangle;

  private billetContainer!: Phaser.GameObjects.Container;
  private billetImage?: Phaser.GameObjects.Image;
  private manualControlsContainer!: Phaser.GameObjects.Container;
  
  // Tool Switcher UI
  private toolSwitcherContainer!: Phaser.GameObjects.Container;
  private hammerBtn!: Phaser.GameObjects.Container;
  private tongsBtn!: Phaser.GameObjects.Container;
  private currentTool: SmithingTool = 'HAMMER';

  // Gizmo dragging state
  private isRotatingManual = false;
  private isMovingManualX = false;
  private isMovingManualY = false;
  private startPointerPos = { x: 0, y: 0 };
  private startBilletPos = { x: 0, y: 0 };
  private startPointerAngle = 0;
  private startBilletRotation = 0;
  private isSnapped = false;
  private snapTween?: Phaser.Tweens.Tween;

  // Outline based hit area
  private hitPoly!: Phaser.Geom.Polygon;
  private outlineCache: Map<string, Point[]> = new Map();

  private centerX = 0;
  private centerY = 0;
  private hitX = 0;
  private hitY = 0;

  private viewW = 0;
  private viewH = 0;

  private score = 0;
  private targetScore = 100;
  private combo = 0;
  private lastHitTime = 0;
  private hitCooldown = 200;
  private isFinished = false;
  private isPlaying = false;
  private isReadyToStart = false;

  private currentQuality = 100;
  private perfectCount = 0;

  private temperature = 0;
  private coolingRate = 2;
  private currentTempStage: 'COLD' | 'AURA' | 'HOT' | 'WARM' | 'NORMAL' = 'COLD';
  private charcoalCount: number | string = 0;

  private startRadius = 180;
  private targetRadius = 45;
  private currentRadius = 180;
  private shrinkDuration = 2000;
  private ringTimer = 0;

  private currentTargetColor = 0xfabf24;
  private currentSpeedMult = 1.0;

  private readonly UI_PAD_TOP = 18;
  private readonly UI_PAD_SIDE = 12; 
  private readonly UI_PAD_BOTTOM = 24;
  private readonly UI_GAP = 14;

  private readonly TEMP_GAUGE_H_MIN = 110;

  private tempBar!: Phaser.GameObjects.Rectangle;
  private tempValueText!: Phaser.GameObjects.Text;

  private bellowsContainer!: Phaser.GameObjects.Container;
  private bellowsSprite!: Phaser.GameObjects.Sprite;

  private heatUpBtnContainer!: Phaser.GameObjects.Container;
  private uiContainer!: Phaser.GameObjects.Container;
  private isPumping = false;

  private onComplete?: (score: number) => void;
  private onStatusUpdate?: (temp: number) => void;
  private onHeatUpRequest?: () => void;

  private root!: Phaser.GameObjects.Container;

  private isPortrait = false;
  private lastPortrait?: boolean;
  private isRelayouting = false;

  private readonly BILLET_W_ON_ANVIL = 0.80; 
  private readonly BILLET_ANGLE_DEG = -12;

  // 마그넷 스냅 임계값
  private readonly SNAP_DIST_THRESHOLD = 25;
  private readonly SNAP_ANGLE_THRESHOLD = Phaser.Math.DegToRad(6);

  // 모루 타격 지점 상수 (원본 이미지 크기: 1024x559 기준)
  private readonly ANVIL_ORIGINAL_W = 1024;
  private readonly ANVIL_ORIGINAL_H = 559;
  private readonly ANVIL_HIT_X = 630;
  private readonly ANVIL_HIT_Y = 140;

  constructor() {
    super('SmithingScene');
  }

  public getQualityLabel(q: number): string {
    if (q >= 110) return 'MASTERWORK';
    if (q >= 100) return 'PRISTINE';
    if (q >= 90) return 'SUPERIOR';
    if (q >= 80) return 'FINE';
    if (q >= 70) return 'STANDARD';
    if (q >= 60) return 'RUSTIC';
    return 'CRUDE';
  }

  private getLabelColor(q: number): string {
    if (q >= 110) return '#f59e0b';
    if (q >= 100) return '#fbbf24';
    if (q >= 90) return '#10b981';
    if (q >= 80) return '#3b82f6';
    if (q >= 70) return '#a8a29e';
    if (q >= 60) return '#d97706';
    return '#ef4444';
  }

  init(data: SmithingSceneData) {
    this.onComplete = data.onComplete;
    this.onStatusUpdate = data.onStatusUpdate;
    this.onHeatUpRequest = data.onHeatUpRequest;
    this.charcoalCount = data.charcoalCount;
    this.shrinkDuration = Math.max(800, 2000 - data.difficulty * 200);
    this.coolingRate = 2 + data.difficulty * 0.8;
    this.score = 0;
    this.combo = 0;
    this.temperature = data.initialTemp || 0;
    this.isFinished = false;
    this.isPlaying = false;
    this.isReadyToStart = this.temperature > 0;
    this.currentQuality = 100;
    this.perfectCount = 0;
    this.outlineCache.clear();
    this.currentTool = 'HAMMER';
    this.isSnapped = true;
  }

  preload() {
    this.load.image('tile_forge', getAssetUrl('tile_forge.png'));
    this.load.image('anvil_img', getAssetUrl('anvil.png'));
    this.load.image('spark_perfect', getAssetUrl('particle_spark1.png'));
    this.load.image('spark_normal', getAssetUrl('particle_spark2.png'));
    this.load.image('billet_stage_0', getAssetUrl('billet_default.png'));
    this.load.image('blade_stage_1', getAssetUrl('billet_blade_01.png'));
    this.load.image('blade_stage_2', getAssetUrl('billet_blade_02.png'));
    this.load.image('blade_stage_3', getAssetUrl('billet_blade_03.png'));
    this.load.image('blade_stage_4', getAssetUrl('billet_blade_04.png'));
    this.load.image('blade_stage_5', getAssetUrl('billet_blade_05.png'));
    this.load.spritesheet('bellows', getAssetUrl('bellows_sprite.png'), { frameWidth: 298, frameHeight: 188 });
    
    // Tools UI assets
    this.load.image('icon_hammer', getAssetUrl('hammer.png'));
    this.load.image('icon_tongs', getAssetUrl('tongs.png'));
  }

  create() {
    if (this.scale.width <= 0 || this.scale.height <= 0) return;
    this.root = this.add.container(0, 0);
    if (!this.anims.exists('bellows_pump')) {
      this.anims.create({
        key: 'bellows_pump',
        frames: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ key: 'bellows', frame: i })),
        frameRate: 18,
        repeat: 0,
      });
    }
    this.backgroundTile = this.add.tileSprite(0, 0, 1280, 720, 'tile_forge').setOrigin(0).setDepth(-2).setAlpha(0.7);
    this.root.add(this.backgroundTile);
    this.bgOverlay = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.4).setOrigin(0).setDepth(-1);
    this.root.add(this.bgOverlay);
    this.anvilImage = this.add.image(0, 0, 'anvil_img').setDepth(1).setOrigin(0.5, 0.5);
    this.root.add(this.anvilImage);

    this.targetOutlineGraphics = this.add.graphics().setDepth(2).setAlpha(0.6);
    this.root.add(this.targetOutlineGraphics);

    this.billetContainer = this.add.container(0, 0).setDepth(3).setAngle(this.BILLET_ANGLE_DEG);
    
    if (this.textures.exists('billet_stage_0')) {
      this.billetImage = this.add.image(0, 0, 'billet_stage_0').setOrigin(0.5);
      this.billetContainer.add(this.billetImage);
    }
    this.root.add(this.billetContainer);
    
    this.targetRing = this.add.graphics().setDepth(5);
    this.approachRing = this.add.graphics().setDepth(5);
    this.root.add([this.targetRing, this.approachRing]);
    this.uiContainer = this.add.container(0, 0).setDepth(20);
    this.root.add(this.uiContainer);
    this.ambientGlow = this.add.circle(0, 0, 500, 0xea580c, 0).setFillStyle(0xea580c, 0.25).setDepth(0);
    this.root.add(this.ambientGlow);
    this.flashOverlay = this.add.rectangle(0, 0, 1280, 720, 0xffaa00, 0).setOrigin(0).setDepth(100);
    this.root.add(this.flashOverlay);
    
    this.setupUI();
    this.setupManualControls();
    this.setupToolSwitcher();
    
    this.handleResize(this.scale.gameSize);
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });
    this.time.delayedCall(80, () => this.handleResize());
    
    this.setBilletStage(0);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, objs: any[]) => {
        const x = pointer.x; const y = pointer.y;
        
        if (this.isBellowsClick(objs)) { this.pumpBellows(); return; }
        if (this.isHeatUpClick(objs)) { this.requestHeatUp(); return; }
        if (objs.some(obj => obj.parentContainer === this.toolSwitcherContainer || obj === this.toolSwitcherContainer)) return;

        if (!this.isPlaying) { this.handleStartTap(x, y); return; }

        if (this.currentTool === 'HAMMER') {
          // 아웃라인 내부 타격 여부 체크
          if (this.isPointerInHitArea(x, y)) {
            this.handleHammerSwing(x, y);
          } else { 
            // 아웃라인 밖을 때렸을 때 (모루 위인지 배경인지에 따라 피드백 다르게 가능)
            const isOnAnvil = this.anvilImage.getBounds().contains(x, y);
            this.handleMiss(x, y, isOnAnvil ? 'STRUCK ANVIL' : 'MISS'); 
          }
        }
      }, this
    );

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (this.isSnapped) return;

        if (this.isRotatingManual) {
            const currentAngle = Phaser.Math.Angle.Between(this.billetContainer.x, this.billetContainer.y, pointer.x, pointer.y);
            const delta = currentAngle - this.startPointerAngle;
            this.billetContainer.rotation = this.startBilletRotation + delta;
            this.checkMagnetSnap();
        } 
        else if (this.isMovingManualX) {
            const dx = pointer.x - this.startPointerPos.x;
            this.billetContainer.x = this.startBilletPos.x + dx;
            this.checkMagnetSnap();
        }
        else if (this.isMovingManualY) {
            const dy = pointer.y - this.startPointerPos.y;
            this.billetContainer.y = this.startBilletPos.y + dy;
            this.checkMagnetSnap();
        }

        if (this.isRotatingManual || this.isMovingManualX || this.isMovingManualY) {
            this.rebuildHitPoly();
            if (this.currentTool === 'TONGS') {
                this.drawTargetGuidelineFixed();
            }
        }
    });

    this.input.on('pointerup', () => {
        this.isRotatingManual = false;
        this.isMovingManualX = false;
        this.isMovingManualY = false;
    });

    this.switchTool('HAMMER');
  }

  private setupToolSwitcher() {
    this.toolSwitcherContainer = this.add.container(0, 0).setDepth(30);
    this.root.add(this.toolSwitcherContainer);

    const createToolBtn = (x: number, y: number, key: string, tool: SmithingTool) => {
        const size = 64;
        const bg = this.add.circle(0, 0, size/2, 0x1c1917, 0.85).setStrokeStyle(3, 0x57534e).setInteractive({ useHandCursor: true });
        const icon = this.add.image(0, 0, key).setDisplaySize(size * 0.6, size * 0.6);
        const container = this.add.container(x, y, [bg, icon]);
        
        bg.on('pointerdown', (p: any, lx: any, ly: any, event: any) => {
            event.stopPropagation();
            if (this.currentTool === tool && tool === 'HAMMER') {
                this.resetRing(); 
            } else {
                this.switchTool(tool);
            }
            this.tweens.add({ targets: container, scale: 0.9, duration: 60, yoyo: true });
        });

        return container;
    };

    this.hammerBtn = createToolBtn(0, 0, 'icon_hammer', 'HAMMER');
    this.tongsBtn = createToolBtn(75, 0, 'icon_tongs', 'TONGS');
    this.toolSwitcherContainer.add([this.hammerBtn, this.tongsBtn]);
  }

  private switchTool(tool: SmithingTool) {
    this.currentTool = tool;
    
    const hamBg = this.hammerBtn.list[0] as Phaser.GameObjects.Arc;
    const tonBg = this.tongsBtn.list[0] as Phaser.GameObjects.Arc;

    if (tool === 'HAMMER') {
        hamBg.setStrokeStyle(4, 0xfbbf24);
        hamBg.setFillStyle(0x451a03, 1);
        tonBg.setStrokeStyle(3, 0x57534e);
        tonBg.setFillStyle(0x1c1917, 0.85);

        if (this.manualControlsContainer) this.manualControlsContainer.setVisible(false);
        this.targetRing.setVisible(this.isPlaying);
        this.approachRing.setVisible(this.isPlaying);
        if (this.isPlaying) this.resetRing();
        this.targetOutlineGraphics.setVisible(false);
    } else {
        tonBg.setStrokeStyle(4, 0xfbbf24);
        tonBg.setFillStyle(0x451a03, 1);
        hamBg.setStrokeStyle(3, 0x57534e);
        hamBg.setFillStyle(0x1c1917, 0.85);

        if (this.manualControlsContainer) this.manualControlsContainer.setVisible(true);
        this.targetRing.setVisible(false);
        this.approachRing.setVisible(false);
        this.targetOutlineGraphics.setVisible(true);
        this.drawTargetGuidelineFixed();
    }
  }

  private setupManualControls() {
    this.manualControlsContainer = this.add.container(0, 0).setDepth(10);
    this.billetContainer.add(this.manualControlsContainer);

    const createBtn = (x: number, y: number, label: string, mode: 'X' | 'Y' | 'ROT') => {
        const size = 52;
        const isRot = mode === 'ROT';
        const bg = this.add.circle(0, 0, size/2, 0x1c1917, 0.8)
            .setStrokeStyle(2, isRot ? 0x3b82f6 : 0xfbbf24, 0.8)
            .setInteractive({ useHandCursor: true });
        
        const txt = this.add.text(0, 0, label, { fontSize: '24px', color: isRot ? '#60a5fa' : '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5);
        const btn = this.add.container(x, y, [bg, txt]);
        
        bg.on('pointerdown', (p: Phaser.Input.Pointer, lx: any, ly: any, event: any) => {
            event.stopPropagation();
            if (this.isSnapped) this.isSnapped = false;
            
            this.startPointerPos = { x: p.x, y: p.y };
            this.startBilletPos = { x: this.billetContainer.x, y: this.billetContainer.y };
            
            if (isRot) {
                this.isRotatingManual = true;
                this.startPointerAngle = Phaser.Math.Angle.Between(this.billetContainer.x, this.billetContainer.y, p.x, p.y);
                this.startBilletRotation = this.billetContainer.rotation;
            } else if (mode === 'X') {
                this.isMovingManualX = true;
            } else if (mode === 'Y') {
                this.isMovingManualY = true;
            }
            
            this.tweens.add({ targets: btn, scale: 0.8, duration: 100 });
        });

        bg.on('pointerup', () => {
            this.tweens.add({ targets: btn, scale: 1, duration: 100 });
        });

        return btn;
    };

    const offsetX = 280;
    const offsetY = 120;

    const btnL = createBtn(-offsetX, 0, '←', 'X');
    const btnR = createBtn(offsetX, 0, '→', 'X');
    const btnU = createBtn(0, -offsetY, '↑', 'Y');
    const btnD = createBtn(0, offsetY, '↓', 'Y');

    const btnRotTL = createBtn(-offsetX, -offsetY, '🔄', 'ROT');
    const btnRotBR = createBtn(offsetX, offsetY, '🔄', 'ROT');

    this.manualControlsContainer.add([btnL, btnR, btnU, btnD, btnRotTL, btnRotBR]);
    this.manualControlsContainer.setVisible(false);
  }

  private checkMagnetSnap() {
    // TONGS 모드가 아니면 자석 효과를 적용하지 않음
    if (this.currentTool !== 'TONGS') return;
    if (this.isSnapped || (this.snapTween && this.snapTween.isPlaying())) return;

    const anvilScale = this.anvilImage.scaleX;
    const offsetX = (this.ANVIL_HIT_X - this.ANVIL_ORIGINAL_W / 2) * anvilScale;
    const offsetY = (this.ANVIL_HIT_Y - this.ANVIL_ORIGINAL_H / 2) * anvilScale;
    const targetX = this.anvilImage.x + offsetX;
    const targetY = this.anvilImage.y + offsetY;
    const targetRot = Phaser.Math.DegToRad(this.BILLET_ANGLE_DEG);

    const dist = Phaser.Math.Distance.Between(this.billetContainer.x, this.billetContainer.y, targetX, targetY);
    const angleDiff = Math.abs(Phaser.Math.Angle.ShortestBetween(this.billetContainer.rotation, targetRot));

    if (dist < this.SNAP_DIST_THRESHOLD && angleDiff < this.SNAP_ANGLE_THRESHOLD) {
        this.isSnapped = true;
        
        this.isRotatingManual = false;
        this.isMovingManualX = false;
        this.isMovingManualY = false;

        this.snapTween = this.tweens.add({
            targets: this.billetContainer,
            x: targetX,
            y: targetY,
            rotation: targetRot,
            duration: 150,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.rebuildHitPoly();
                this.drawTargetGuidelineFixed();
                this.createSparks(25, 0x10b981, 1.4, 'spark_perfect', targetX, targetY);
            }
        });
    }
  }

  private applyKickback(intensity: number) {
      if (!this.billetContainer) return;
      
      // 타격 시 스냅 상태 해제
      this.isSnapped = false;
      
      const posRange = intensity * 15;
      const angleRange = intensity * 8;
      const dx = Phaser.Math.FloatBetween(-posRange, posRange);
      const dy = Phaser.Math.FloatBetween(-posRange, posRange);
      const da = Phaser.Math.FloatBetween(-angleRange, angleRange);
      
      this.tweens.add({ 
        targets: this.billetContainer, 
        x: this.billetContainer.x + dx, 
        y: this.billetContainer.y + dy, 
        angle: this.billetContainer.angle + da, 
        duration: 150, 
        ease: 'Cubic.easeOut', 
        onUpdate: () => this.rebuildHitPoly() 
      });
  }

  private isBellowsClick(objs: any[]) { return objs.includes(this.bellowsContainer) || this.bellowsContainer.list.some((c) => objs.includes(c)); }
  private isHeatUpClick(objs: any[]) { return objs.includes(this.heatUpBtnContainer) || this.heatUpBtnContainer.list.some((c) => objs.includes(c)); }

  private setupUI() {
    this.progressBar = this.add.rectangle(0, 25, 0.1, 14, 0xeab308).setOrigin(0, 0.5);
    const progBg = this.add.rectangle(0, 25, 250, 18, 0x000000, 0.5).setStrokeStyle(2, 0x57534e).setName('progBg').setOrigin(0, 0.5);
    this.qualityText = this.add.text(0, 55, 'PRISTINE', { fontFamily: 'Grenze Gotisch', fontSize: '18px', color: '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5);
    this.uiContainer.add([progBg, this.progressBar, this.qualityText]);
    this.tempBar = this.add.rectangle(0, 0, 16, 200, 0x3b82f6).setOrigin(0.5, 1).setScale(1, 0);
    this.tempValueText = this.add.text(0, 0, '20°C', { fontFamily: 'Grenze', fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.uiContainer.add([
      this.add.rectangle(0, 0, 28, 210, 0x1c1917).setStrokeStyle(3, 0x57534e).setName('tempFrame'),
      this.add.rectangle(0, 0, 22, 200, 0x0c0a09).setName('tempBg'),
      this.tempBar, this.tempValueText,
    ]);
    this.bellowsContainer = this.add.container(0, 0);
    this.bellowsSprite = this.add.sprite(0, 0, 'bellows').setScale(1); 
    const pumpTxt = this.add.text(0, 22, 'PUMP', { fontSize: '10px', color: '#fde68a', fontFamily: 'Grenze', fontStyle: 'bold' }).setOrigin(0.5);
    this.bellowsContainer.add([this.bellowsSprite, pumpTxt]).setInteractive(new Phaser.Geom.Rectangle(-149, -94, 298, 188), Phaser.Geom.Rectangle.Contains);
    this.bellowsSprite.on('animationcomplete-bellows_pump', () => { this.isPumping = false; });
    this.heatUpBtnContainer = this.add.container(0, 0);
    const r = 35; 
    const btnBg = this.add.circle(0, 0, r, 0x1c1917, 1).setStrokeStyle(3, 0x57534e).setName('btnBg');
    const btnIcon = this.add.text(0, -8, '🔥', { fontSize: '18px' }).setOrigin(0.5).setName('btnIcon');
    const btnLabel = this.add.text(0, 8, 'HEAT', { fontSize: '10px', color: '#fbbf24', fontStyle: 'bold', fontFamily: 'Grenze' }).setOrigin(0.5);
    const countTxt = this.add.text(0, 22, `x${this.charcoalCount}`, { fontSize: '12px', color: '#78716c', fontFamily: 'Grenze' }).setOrigin(0.5).setName('countTxt');
    this.heatUpBtnContainer.add([btnBg, btnIcon, btnLabel, countTxt]).setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains);
    this.uiContainer.add([this.bellowsContainer, this.heatUpBtnContainer]);
    this.comboText = this.add.text(0, 0, '', { fontFamily: 'Grenze Gotisch', fontSize: '36px', color: '#fcd34d', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setAlpha(0).setDepth(26);
    this.infoText = this.add.text(0, 0, this.isReadyToStart ? 'TOUCH TO START' : 'FORGE IS COLD\nADD FUEL', {
        fontFamily: 'Grenze Gotisch', fontSize: '24px', color: this.isReadyToStart ? '#fbbf24' : '#3b82f6', align: 'center', stroke: '#000', strokeThickness: 5,
      }).setOrigin(0.5);
    this.uiContainer.add([this.comboText, this.infoText]);
    this.tweens.add({ targets: this.infoText, alpha: 0.5, yoyo: true, repeat: -1, duration: 800 });
  }

  private generateOutlinePoints(key: string): Point[] {
    if (this.outlineCache.has(key)) return this.outlineCache.get(key)!;
    const texture = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = texture.width; canvas.height = texture.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    ctx.drawImage(texture, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data; const w = canvas.width; const h = canvas.height;
    const isOpaque = (x: number, y: number) => {
        if (x < 0 || x >= w || y < 0 || y >= h) return false;
        return data[(y * w + x) * 4 + 3] > 50;
    };
    let startPoint: Point | null = null;
    outer: for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) { if (isOpaque(x, y)) { startPoint = { x, y }; break outer; } }
    }
    if (!startPoint) return [];
    const path: Point[] = []; let curr = { ...startPoint }; let prev = { x: startPoint.x, y: startPoint.y - 1 };
    const neighbors = [{x:-1, y:-1}, {x:0, y:-1}, {x:1, y:-1}, {x:1, y:0}, {x:1, y:1}, {x:0, y:1}, {x:-1, y:1}, {x:-1, y:0}];
    let iters = 0;
    while (iters < w * h) {
        const relX = prev.x - curr.x; const relY = prev.y - curr.y;
        let startIdx = neighbors.findIndex(n => n.x === relX && n.y === relY);
        if (startIdx === -1) startIdx = 0;
        let found = false;
        for (let i = 1; i <= 8; i++) {
            const idx = (startIdx + i) % 8; const nx = curr.x + neighbors[idx].x; const ny = curr.y + neighbors[idx].y;
            if (isOpaque(nx, ny)) { prev = { ...curr }; curr = { x: nx, y: ny }; path.push({ ...curr }); found = true; break; }
        }
        if (!found || (curr.x === startPoint.x && curr.y === startPoint.y)) break;
        iters++;
    }
    const simplified: Point[] = [];
    const step = Math.max(1, Math.floor(path.length / 50));
    for (let i = 0; i < path.length; i += step) { simplified.push({ x: path[i].x - w/2, y: path[i].y - h/2 }); }
    this.outlineCache.set(key, simplified);
    return simplified;
  }

  private drawTargetGuidelineFixed() {
    if (!this.targetOutlineGraphics || !this.billetImage) return;
    this.targetOutlineGraphics.clear();
    const currentKey = this.billetImage.texture.key;
    const localPoints = this.generateOutlinePoints(currentKey);
    const rad = Phaser.Math.DegToRad(this.BILLET_ANGLE_DEG);
    const cos = Math.cos(rad); const sin = Math.sin(rad);
    const scale = this.billetContainer.scaleX;
    const anvilScale = this.anvilImage.scaleX;
    const offsetX = (this.ANVIL_HIT_X - this.ANVIL_ORIGINAL_W / 2) * anvilScale;
    const offsetY = (this.ANVIL_HIT_Y - this.ANVIL_ORIGINAL_H / 2) * anvilScale;
    const targetX = this.anvilImage.x + offsetX;
    const targetY = this.anvilImage.y + offsetY;
    const transformed = localPoints.map(p => ({ x: targetX + (p.x * scale * cos - p.y * scale * sin), y: targetY + (p.x * scale * sin + p.y * scale * cos) }));
    this.targetOutlineGraphics.lineStyle(2, this.isSnapped ? 0x10b981 : 0xfbbf24, this.isSnapped ? 0.8 : 0.4);
    const dashLen = 8; const gapLen = 5;
    for (let i = 0; i < transformed.length; i++) {
        const p1 = transformed[i]; const p2 = transformed[(i + 1) % transformed.length];
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        const angle = Phaser.Math.Angle.Between(p1.x, p1.y, p2.x, p2.y);
        let curDist = 0; let draw = true;
        while (curDist < dist) {
            const step = draw ? dashLen : gapLen; const nextDist = Math.min(curDist + step, dist);
            if (draw) this.targetOutlineGraphics.lineBetween(p1.x + Math.cos(angle) * curDist, p1.y + Math.sin(angle) * curDist, p1.x + Math.cos(angle) * nextDist, p1.y + Math.sin(angle) * nextDist);
            curDist = nextDist; draw = !draw;
        }
    }
  }

  private placeBilletOnAnvil() {
    if (!this.anvilImage || !this.billetContainer) return;
    const currentKey = this.billetImage?.texture?.key ?? 'billet_stage_0'; 
    const tex = this.textures.get(currentKey);
    const src = tex?.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    const baseTexW = src?.width ?? 1220;
    const targetBilletW = this.anvilImage.displayWidth * this.BILLET_W_ON_ANVIL; 
    const ratio = targetBilletW / baseTexW;
    const billetScale = Phaser.Math.Clamp(ratio, 0.15, 2.0);
    
    const anvilScale = this.anvilImage.scaleX;
    const offsetX = (this.ANVIL_HIT_X - this.ANVIL_ORIGINAL_W / 2) * anvilScale;
    const offsetY = (this.ANVIL_HIT_Y - this.ANVIL_ORIGINAL_H / 2) * anvilScale;
    
    const targetX = this.anvilImage.x + offsetX;
    const targetY = this.anvilImage.y + offsetY;

    if (!this.isPlaying || (this.currentTool === 'HAMMER' && !this.isRotatingManual && !this.isMovingManualX && !this.isMovingManualY)) {
        this.billetContainer
            .setRotation(Phaser.Math.DegToRad(this.BILLET_ANGLE_DEG))
            .setScale(billetScale)
            .setPosition(targetX, targetY);
        this.isSnapped = true;
    }

    this.rebuildHitPoly();
    if (this.currentTool === 'TONGS') {
        this.drawTargetGuidelineFixed();
    }
  }

  private handleResize(gameSize?: Phaser.Structs.Size) {
    const w = gameSize?.width ?? this.scale.gameSize.width; const h = gameSize?.height ?? this.scale.gameSize.height;
    if (w <= 0 || h <= 0) return;
    const nextPortrait = h > w; this.cameras.main.setViewport(0, 0, w, h);
    if (this.root) { this.root.setRotation(0); this.root.setPosition(0, 0); }
    const apply = (sw: number, sh: number, portrait: boolean) => {
      this.viewW = sw; this.viewH = sh; this.centerX = sw / 2; this.centerY = sh / 2;
      if (this.backgroundTile) this.backgroundTile.setSize(sw, sh);
      if (this.bgOverlay) this.bgOverlay.setSize(sw, sh);
      if (this.flashOverlay) this.flashOverlay.setSize(sw, sh);
      
      const anvilW = sw * 1.2; 
      const anvilScale = anvilW / this.anvilImage.width;
      const forgeCenterX = sw * 0.4;
      this.anvilImage.setScale(anvilScale).setPosition(forgeCenterX, this.centerY);
      
      if (this.ambientGlow) this.ambientGlow.setPosition(forgeCenterX, this.centerY);
      this.placeBilletOnAnvil();
      
      const basis = Math.min(sw, sh); 
      this.startRadius = Phaser.Math.Clamp(basis * (portrait ? 0.28 : 0.35), 105, 240);
      
      const isCompact = sh < 450; 
      this.repositionUI(sw, sh, portrait, isCompact);
      if (this.isPlaying && this.currentTool === 'HAMMER') this.resetRing();

      if (this.manualControlsContainer) {
          const invScale = 1 / (this.billetContainer.scaleX || 1);
          this.manualControlsContainer.setScale(invScale * (this.uiScale || 1.0));
      }

      const swX = this.UI_PAD_SIDE + 40;
      const swY = sh - this.UI_PAD_BOTTOM - 20;
      this.toolSwitcherContainer.setPosition(swX, swY).setScale(this.uiScale || 1.0);
    };
    if (this.lastPortrait === undefined) { this.lastPortrait = nextPortrait; this.isPortrait = nextPortrait; apply(w, h, nextPortrait); return; }
    const changed = this.lastPortrait !== nextPortrait; this.lastPortrait = nextPortrait; this.isPortrait = nextPortrait;
    if (changed && !this.isRelayouting) {
      this.isRelayouting = true; const cam = this.cameras.main; cam.fadeOut(120, 0, 0, 0);
      this.time.delayedCall(140, () => {
        const ww = this.scale.gameSize.width; const hh = this.scale.gameSize.height; cam.setViewport(0, 0, ww, hh);
        apply(ww, hh, this.isPortrait); cam.fadeIn(120, 0, 0, 0);
        this.time.delayedCall(160, () => (this.isRelayouting = false));
      });
      return;
    }
    apply(w, h, nextPortrait);
  }

  private get uiScale(): number {
      return Math.min(this.viewW, this.viewH) / 720;
  }

  private repositionUI(sw: number, sh: number, portrait: boolean, isCompact: boolean) {
    if (!this.uiContainer) return;
    const padTop = this.UI_PAD_TOP; 
    const padBottom = this.UI_PAD_BOTTOM; const gap = this.UI_GAP;
    const sideAreaWidth = Math.min(sw, sh) * 0.18;
    const rightX = sw - (sideAreaWidth / 2) - this.UI_PAD_SIDE;
    const progBg = this.uiContainer.getByName('progBg') as Phaser.GameObjects.Rectangle;
    const progWidth = Math.min(sw * (portrait ? 0.72 : 0.6), 340);
    const progX = this.centerX - progWidth / 2;
    progBg.setPosition(progX, padTop + 10).setSize(progWidth, 18);
    this.progressBar.setPosition(progX, padTop + 10);
    this.updateProgressBar();
    this.qualityText.setPosition(this.centerX, padTop + 40).setFontSize(isCompact ? '16px' : '18px');
    const bellowsScale = sideAreaWidth / 298;
    this.bellowsContainer.setScale(bellowsScale);
    const heatScale = sideAreaWidth / 70;
    this.heatUpBtnContainer.setScale(heatScale);
    const bellowsH = 188 * bellowsScale;
    const heatUpH = 70 * heatScale;
    const heatUpY = sh - padBottom - (heatUpH / 2);
    const bellowsY = heatUpY - (heatUpH / 2) - gap - (bellowsH / 2);
    this.heatUpBtnContainer.setPosition(rightX, heatUpY); 
    this.bellowsContainer.setPosition(rightX, bellowsY);
    const tFrame = this.uiContainer.getByName('tempFrame') as Phaser.GameObjects.Rectangle;
    const tBg = this.uiContainer.getByName('tempBg') as Phaser.GameObjects.Rectangle;
    const gaugeTop = padTop + 70; const gaugeBottomLimit = bellowsY - (bellowsH / 2) - gap;
    const availableH = Math.max(0, gaugeBottomLimit - gaugeTop);
    let gaugeH = Math.min(availableH, sh * 0.6);
    if (availableH >= this.TEMP_GAUGE_H_MIN) { gaugeH = Math.max(gaugeH, this.TEMP_GAUGE_H_MIN); } else { gaugeH = availableH; }
    const gaugeCenterY = gaugeTop + gaugeH / 2;
    tFrame.setPosition(rightX, gaugeCenterY).setSize(28, gaugeH + 10);
    tBg.setPosition(rightX, gaugeCenterY).setSize(22, gaugeH);
    this.tempBar.setSize(16, gaugeH); this.tempBar.setPosition(rightX, gaugeCenterY + gaugeH / 2);
    this.tempValueText.setPosition(rightX, gaugeCenterY - gaugeH / 2 - 16).setFontSize(isCompact ? '12px' : '14px');
    const infoY = portrait ? sh * 0.3 : this.centerY - (isCompact ? 80 : 140);
    this.infoText.setPosition(this.centerX, infoY).setFontSize(portrait ? (isCompact ? '20px' : '24px') : (isCompact ? '20px' : '26px'));
  }

  private rebuildHitPoly() {
    const currentKey = this.billetImage?.texture?.key;
    if (!currentKey) return;
    const localPoints = this.generateOutlinePoints(currentKey);
    const rad = Phaser.Math.DegToRad(this.billetContainer.angle);
    const cos = Math.cos(rad); 
    const sin = Math.sin(rad);
    const scale = this.billetContainer.scaleX;
    const cx = this.billetContainer.x;
    const cy = this.billetContainer.y;
    const transformed = localPoints.map(p => ({ x: cx + (p.x * scale * cos - p.y * scale * sin), y: cy + (p.x * scale * sin + p.y * scale * cos) }));
    this.hitPoly = new Phaser.Geom.Polygon(transformed);
  }

  private isPointerInHitArea(px: number, py: number) { return this.hitPoly && Phaser.Geom.Polygon.Contains(this.hitPoly, px, py); }

  private handleStartTap(x: number, y: number) {
    if (this.isReadyToStart) {
      this.isPlaying = true; this.infoText.setVisible(false);
      this.flashOverlay.setFillStyle(0xffffff, 1).setAlpha(0.2); this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 300 });
      if (this.currentTool === 'HAMMER') { this.resetRing(); this.targetRing.setVisible(true); this.approachRing.setVisible(true); }
    } else { this.cameras.main.shake(50, 0.005); this.showFeedback('TOO COLD!', 0x3b82f6, 1.0, x, y); }
  }

  private handleHammerSwing(x: number, y: number) {
    if (this.isFinished) return; if (this.time.now - this.lastHitTime < this.hitCooldown) return;
    this.lastHitTime = this.time.now;
    if (this.currentTempStage === 'COLD' || this.currentTempStage === 'NORMAL') { this.showFeedback('TOO COLD!', 0x3b82f6, 1.0, x, y); return; }
    const diff = Math.abs(this.currentRadius - this.targetRadius);
    const eff = this.currentTempStage === 'AURA' ? 1.5 : this.currentTempStage === 'HOT' ? 1.0 : 0.5;
    if (diff < this.targetRadius * 0.35) {
      this.score += Math.ceil(8 * eff); this.combo++; this.perfectCount++;
      if (this.perfectCount >= 6) { this.currentQuality += 1; }
      this.createSparks(30, this.currentTargetColor, 1.5, 'spark_perfect', x, y); this.showFeedback('PERFECT!', 0xffb300, 1.4, x, y); this.cameras.main.shake(150, 0.02);
      this.applyKickback(0.05); 
    } else if (diff < this.targetRadius * 0.95) {
      this.score += Math.ceil(5 * eff); this.combo = 0; this.currentQuality = Math.max(0, this.currentQuality - 2);
      this.createSparks(15, 0xffffff, 1.1, 'spark_normal', x, y); this.showFeedback('GOOD', 0xe5e5e5, 1.1, x, y);
      this.applyKickback(0.4); 
    } else { this.handleMiss(x, y); }
    this.updateProgressBar();
    if (this.score >= this.targetScore) this.winGame(); else this.resetRing();
  }

  private handleMiss(x?: number, y?: number, customText?: string) {
    this.score = Math.max(0, this.score - 5); this.combo = 0; this.currentQuality = Math.max(0, this.currentQuality - 5);
    this.cameras.main.shake(100, 0.01); this.showFeedback(customText ?? 'MISS', 0xef4444, 1.0, x ?? this.hitX, y ?? this.hitY);
    this.applyKickback(1.5); 
    this.updateProgressBar(); this.resetRing();
  }

  update(time: number, delta: number) {
    if (this.isFinished) return;
    if (this.isPlaying && this.currentTool === 'HAMMER') this.handleRingLogic(delta);
    this.temperature = Math.max(0, this.temperature - this.coolingRate * (delta / 1000));
    this.refreshVisuals();
    if (!this.isPlaying && this.isReadyToStart && this.temperature <= 0) {
      this.isReadyToStart = false; this.infoText.setText('FORGE IS COLD\nADD FUEL').setColor('#3b82f6');
    }
  }

  private refreshVisuals() {
    this.qualityText.setText(this.getQualityLabel(this.currentQuality)).setColor(this.getLabelColor(this.currentQuality));
    const ratio = this.temperature / 100; this.tempBar.scaleY = ratio; this.tempValueText.setText(`${Math.floor(20 + ratio * 1480)}°C`);
    let barColor = 0xeab308; if (ratio < 0.4) barColor = 0x3b82f6; else if (ratio > 0.7) barColor = 0xef4444;
    this.tempBar.setFillStyle(barColor);
    const progress = Phaser.Math.Clamp(this.score / this.targetScore, 0, 1);
    const stage = Math.min(5, Math.floor(progress * 6)); 
    this.setBilletStage(stage);
    if (this.ambientGlow) this.ambientGlow.setAlpha(ratio * 0.4);
    if (this.temperature <= 0) this.currentTempStage = 'COLD';
    else if (this.temperature > 75) this.currentTempStage = 'AURA';
    else if (this.temperature > 40) this.currentTempStage = 'HOT';
    else if (this.temperature > 15) this.currentTempStage = 'WARM';
    else this.currentTempStage = 'NORMAL';
  }

  private setBilletStage(stage: number) {
    const key = `blade_stage_${stage}`; if (stage === 0) { if (this.billetImage) this.billetImage.setTexture('billet_stage_0'); this.placeBilletOnAnvil(); return; }
    if (!this.textures.exists(key)) return;
    if (!this.billetImage) { 
        this.billetImage = this.add.image(0, 0, key).setOrigin(0.5); 
        this.billetContainer.add(this.billetImage); 
        this.placeBilletOnAnvil(); 
        return; 
    }
    if (this.billetImage.texture.key !== key) {
      this.billetImage.setTexture(key); 
      this.placeBilletOnAnvil();
      const sx = this.billetContainer.scaleX; const sy = this.billetContainer.scaleY;
      this.tweens.add({ targets: this.billetContainer, scaleX: sx * 1.08, scaleY: sy * 1.08, duration: 100, yoyo: true, });
    }
  }

  private handleRingLogic(delta: number) {
    this.ringTimer += delta * this.currentSpeedMult; 
    const t = Math.min(this.ringTimer / this.shrinkDuration, 1.5); 
    this.currentRadius = this.startRadius * (1 - t * t);
    const colorT = Math.min(this.ringTimer / this.shrinkDuration, 1.0);
    const targetRGB = Phaser.Display.Color.IntegerToColor(this.currentTargetColor);
    const r = Math.floor(255 + (targetRGB.red - 255) * colorT);
    const g = Math.floor(255 + (targetRGB.green - 255) * colorT);
    const b = Math.floor(255 + (targetRGB.blue - 255) * colorT);
    const ringColor = Phaser.Display.Color.GetColor(r, g, b);
    const ringAlpha = 0.6 + (colorT * 0.3);
    this.approachRing.clear().lineStyle(6, ringColor, ringAlpha).strokeCircle(this.hitX, this.hitY, Math.max(0, this.currentRadius));
    if (this.currentRadius < this.targetRadius - 25) { this.combo = 0; this.resetRing(); }
  }

  private resetRing() {
    if (this.temperature <= 0 || !this.hitPoly) return; 
    this.targetRing.clear(); 
    this.approachRing.clear(); 
    this.currentRadius = this.startRadius; 
    this.ringTimer = 0;
    const randType = Math.random();
    if (randType < 0.2) { this.currentTargetColor = 0x10b981; this.currentSpeedMult = 0.75; } 
    else if (randType < 0.75) { this.currentTargetColor = 0xfabf24; this.currentSpeedMult = 1.0; } 
    else { this.currentTargetColor = 0xef4444; this.currentSpeedMult = 1.45; }
    this.targetRadius = this.startRadius * Phaser.Math.FloatBetween(0.18, 0.32);
    const rect = Phaser.Geom.Polygon.GetAABB(this.hitPoly);
    let found = false; let attempts = 0;
    while (!found && attempts < 15) {
        const tx = Phaser.Math.FloatBetween(rect.left, rect.right);
        const ty = Phaser.Math.FloatBetween(rect.top, rect.bottom);
        if (Phaser.Geom.Polygon.Contains(this.hitPoly, tx, ty)) { this.hitX = tx; this.hitY = ty; found = true; }
        attempts++;
    }
    if (this.isPlaying && this.currentTool === 'HAMMER') { 
      this.targetRing.clear().fillStyle(this.currentTargetColor, 0.2).fillCircle(this.hitX, this.hitY, this.targetRadius).lineStyle(4, this.currentTargetColor, 0.7).strokeCircle(this.hitX, this.hitY, this.targetRadius); 
    }
  }

  private updateProgressBar() {
    const progBg = this.uiContainer.getByName('progBg') as Phaser.GameObjects.Rectangle;
    if (!progBg) return; this.progressBar.width = Math.max(0.1, Phaser.Math.Clamp((this.score / this.targetScore) * progBg.width, 0, progBg.width));
  }

  private createSparks(count: number, color: number, scale: number, key: string, x: number, y: number) {
    const emitter = this.add.particles(x, y, this.textures.exists(key) ? key : 'spark_normal', { lifespan: 600, speed: { min: 200 * scale, max: 500 * scale }, angle: { min: 230, max: 310 }, scale: { start: 0.6, end: 0 }, gravityY: 1000, blendMode: 'ADD', tint: color, });
    this.root.add(emitter); emitter.explode(count);
  }

  private showFeedback(text: string, color: number, scale: number, x: number, y: number) {
    const fb = this.add.text(x, y, text, { fontFamily: 'Grenze Gotisch', fontSize: '32px', fontStyle: 'bold', color: '#' + color.toString(16).padStart(6, '0'), stroke: '#000', strokeThickness: 7, }).setOrigin(0.5).setScale(0.5).setAlpha(0).setDepth(25);
    this.root.add(fb); this.tweens.add({ targets: fb, y: y - 40, alpha: 1, scale: scale, duration: 250, hold: 400, yoyo: true, onComplete: () => fb.destroy(), });
    if (this.combo > 1) { this.comboText.setPosition(x, y - 75).setText(`${this.combo} COMBO!`).setAlpha(1).setScale(1.2); this.tweens.add({ targets: this.comboText, scale: { from: 1.4, to: 1 }, duration: 200, alpha: { from: 1, to: 0 }, delay: 700, }); }
  }

  private winGame() {
    this.isFinished = true; this.isPlaying = false; this.targetRing.clear(); this.approachRing.clear();
    if (this.manualControlsContainer) this.manualControlsContainer.setVisible(false);
    if (this.toolSwitcherContainer) this.toolSwitcherContainer.setVisible(false);
    if (this.onStatusUpdate) this.onStatusUpdate(this.temperature);
    const bg = this.add.rectangle(this.centerX, this.centerY, this.viewW, this.viewH, 0x000000).setAlpha(0).setDepth(100);
    this.root.add(bg); this.tweens.add({ targets: bg, alpha: 0.8, duration: 500 });
    const label = this.getQualityLabel(this.currentQuality);
    const textContent = this.isPortrait ? `${label}\nCRAFT!` : `${label} CRAFT!`;
    const fontSize = this.isPortrait ? `${Math.min(36, this.viewW * 0.08)}px` : '48px';
    const txt = this.add.text(this.centerX, this.centerY, textContent, { fontFamily: 'Grenze Gotisch', fontSize: fontSize, color: this.getLabelColor(this.currentQuality), stroke: '#000', strokeThickness: 4, align: 'center', }).setOrigin(0.5).setAlpha(0).setDepth(101);
    this.root.add(txt); this.tweens.add({ targets: txt, alpha: 1, scale: { from: 0.5, to: this.isPortrait ? 1.0 : 1.1 }, duration: 600, ease: 'Back.out', onComplete: () => { this.time.delayedCall(1000, () => { if (this.onComplete) this.onComplete(this.currentQuality); }); }, });
  }

  private pumpBellows() {
    this.isPumping = true; 
    this.bellowsSprite.play('bellows_pump', true); 
    if (this.temperature > 0) { this.temperature = Math.min(100, this.temperature + 5); if (!this.isPlaying && !this.isReadyToStart) { this.isReadyToStart = true; this.infoText.setText('TOUCH TO START').setColor('#fbbf24'); } }
  }

  private requestHeatUp() { 
    const hasCharcoal = this.charcoalCount === '∞' || (typeof this.charcoalCount === 'number' && this.charcoalCount > 0);
    if (hasCharcoal && this.onHeatUpRequest) { this.tweens.add({ targets: this.heatUpBtnContainer, scale: 0.9, duration: 50, yoyo: true }); this.onHeatUpRequest(); } else { this.cameras.main.shake(100, 0.005); } 
  }

  public heatUp() { this.temperature = Math.min(100, this.temperature + 40); if (!this.isPlaying) { this.isReadyToStart = true; this.infoText.setText('TOUCH TO START').setColor('#fbbf24'); } this.flashOverlay.setFillStyle(0xff8800, 1).setAlpha(0.4); this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 400, ease: 'Cubic.easeOut' }); }
  public updateCharcoalCount(count: number | string) { this.charcoalCount = count; this.refreshHeatUpButton(); }
  private refreshHeatUpButton() { 
    const bg = this.heatUpBtnContainer.getByName('btnBg') as Phaser.GameObjects.Arc; 
    const countTxt = this.heatUpBtnContainer.getByName('countTxt') as Phaser.GameObjects.Text; 
    if (countTxt) countTxt.setText(`x${this.charcoalCount}`); 
    const hasCharcoal = this.charcoalCount === '∞' || (typeof this.charcoalCount === 'number' && this.charcoalCount > 0);
    if (bg) bg.setStrokeStyle(3, hasCharcoal ? 0xea580c : 0x292524); 
  }
  public getTemperature() { return this.temperature; }
}
