
import Phaser from 'phaser';
import { getAssetUrl } from '../utils';
import { SmithingTutorialHandler } from './SmithingTutorialHandler';
import { SMITHING_CONFIG } from '../config/smithing-config';

export interface SmithingSceneData {
  onComplete: (score: number, enhancementCount: number) => void;
  onStatusUpdate?: (temp: number) => void;
  onHeatUpRequest?: () => void;
  onTutorialTargetUpdate?: (rect: { x: number, y: number, w: number, h: number } | null) => void;
  onTutorialAction?: (action: 'FIRST_HIT_DONE' | 'CRAFT_FINISHED') => void;
  difficulty: number;
  initialTemp: number;
  charcoalCount: number | string;
  isTutorial?: boolean;
}

interface Point {
  x: number;
  y: number;
}

type SmithingTool = 'HAMMER' | 'TONGS';

const MAX_TEMP = 1500;
const IDLE_TEMP = 10;

export default class SmithingScene extends Phaser.Scene {
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
  declare public make: Phaser.GameObjects.GameObjectCreator;
  declare public game: Phaser.Game;

  private backgroundTile!: Phaser.GameObjects.TileSprite;
  private bgOverlay!: Phaser.GameObjects.Rectangle;
  private anvilImage!: Phaser.GameObjects.Image;

  private targetRing!: Phaser.GameObjects.Graphics;
  private approachRing!: Phaser.GameObjects.Graphics;
  private targetOutlineGraphics!: Phaser.GameObjects.Graphics;

  private progressBar!: Phaser.GameObjects.Graphics;
  private progBg!: Phaser.GameObjects.Graphics;
  private comboText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private qualityText!: Phaser.GameObjects.Text;

  private ambientGlow!: Phaser.GameObjects.Arc;
  private flashOverlay!: Phaser.GameObjects.Rectangle;

  private billetContainer!: Phaser.GameObjects.Container;
  private billetImage?: Phaser.GameObjects.Image;
  private manualControlsContainer!: Phaser.GameObjects.Container;
  
  private toolSwitcherContainer!: Phaser.GameObjects.Container;
  private hammerBtn!: Phaser.GameObjects.Container;
  private tongsBtn!: Phaser.GameObjects.Container;
  private currentTool: SmithingTool = 'HAMMER';
  private hammerSprite!: Phaser.GameObjects.Image;

  private isRotatingManual = false;
  private isMovingManualX = false;
  private isMovingManualY = false;
  private startPointerPos = { x: 0, y: 0 };
  private startBilletPos = { x: 0, y: 0 };
  private startPointerAngle = 0;
  private startBilletRotation = 0;
  private isSnapped = false;
  private snapTween?: Phaser.Tweens.Tween;

  private hitPoly!: Phaser.Geom.Polygon;
  private spawnPoly!: Phaser.Geom.Polygon; 
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
  private enhancementCount = 0; 
  private pinnedTexts: Phaser.GameObjects.Text[] = [];

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
  private readonly UI_PAD_SIDE = 16; 
  private readonly UI_PAD_BOTTOM = 28;
  private readonly UI_GAP = 18;

  private readonly TEMP_GAUGE_H_MIN = 80;

  private tempBarGraphics!: Phaser.GameObjects.Graphics;
  private tempBgGraphics!: Phaser.GameObjects.Graphics;
  private tempValueText!: Phaser.GameObjects.Text;

  private bellowsContainer!: Phaser.GameObjects.Container;
  private bellowsSprite!: Phaser.GameObjects.Sprite;
  private bellowsBg!: Phaser.GameObjects.Arc;

  private heatUpBtnContainer!: Phaser.GameObjects.Container;
  private uiContainer!: Phaser.GameObjects.Container;
  private isPumping = false;

  private onComplete?: (score: number, enhancementCount: number) => void;
  private onStatusUpdate?: (temp: number) => void;
  private onHeatUpRequest?: () => void;
  private onTutorialTargetUpdate?: (rect: { x: number, y: number, w: number, h: number } | null) => void;
  private onTutorialAction?: (action: 'FIRST_HIT_DONE' | 'CRAFT_FINISHED') => void;
  private isTutorial = false;

  private root!: Phaser.GameObjects.Container;

  private isPortrait = false;
  private lastPortrait?: boolean;
  private isRelayouting = false;

  private readonly BILLET_W_ON_ANVIL = 0.80; 
  private readonly BILLET_ANGLE_DEG = -12;

  private readonly SNAP_DIST_THRESHOLD = 25;
  private readonly SNAP_ANGLE_THRESHOLD = Phaser.Math.DegToRad(6);

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
    this.onTutorialTargetUpdate = data.onTutorialTargetUpdate;
    this.onTutorialAction = data.onTutorialAction;
    this.isTutorial = !!data.isTutorial;
    this.charcoalCount = data.charcoalCount;
    this.shrinkDuration = Math.max(800, 2000 - data.difficulty * 200);
    this.coolingRate = 2 + data.difficulty * 0.8;
    this.score = 0;
    this.combo = 0;
    this.enhancementCount = 0;
    this.pinnedTexts = [];
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
    this.load.image('tile_forge', getAssetUrl('tile_forge.png', 'minigame'));
    this.load.image('anvil_img', getAssetUrl('anvil.png'));
    this.load.image('spark_perfect', getAssetUrl('particle_spark1.png', 'minigame'));
    this.load.image('spark_normal', getAssetUrl('particle_spark2.png', 'minigame'));
    this.load.image('billet_stage_0', getAssetUrl('billet_default.png', 'minigame'));
    this.load.image('blade_stage_1', getAssetUrl('billet_blade_01.png', 'minigame'));
    this.load.image('blade_stage_2', getAssetUrl('billet_blade_02.png', 'minigame'));
    this.load.image('blade_stage_3', getAssetUrl('billet_blade_03.png', 'minigame'));
    this.load.image('blade_stage_4', getAssetUrl('billet_blade_04.png', 'minigame'));
    this.load.image('blade_stage_5', getAssetUrl('billet_blade_05.png', 'minigame'));
    this.load.spritesheet('bellows', getAssetUrl('bellows_sprite.png', 'minigame'), { frameWidth: 298, frameHeight: 188 });
    this.load.image('icon_hammer', getAssetUrl('hammer.png'));
    this.load.image('icon_tongs', getAssetUrl('tongs.png', 'minigame'));
    this.load.image('hammer_strike', getAssetUrl('hammer.png', 'minigame'));
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

    this.hammerSprite = this.add.image(0, 0, 'hammer_strike').setOrigin(0.5, 0.9).setScale(0.5).setAlpha(0).setDepth(30);
    this.root.add(this.hammerSprite);
    
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
        const isBellowsClick = this.isBellowsClick(objs);
        const isHeatUpClick = this.isHeatUpClick(objs);
        const isSwitcherClick = objs.some(obj => obj.parentContainer === this.toolSwitcherContainer || obj === this.toolSwitcherContainer);
        
        if (isBellowsClick) { this.pumpBellows(); return; }
        if (isHeatUpClick) { this.requestHeatUp(); return; }
        if (isSwitcherClick) return;

        if (!this.isPlaying) { this.handleStartTap(x, y); return; }

        if (this.currentTool === 'HAMMER') {
          if (this.isPointerInHitArea(x, y)) {
            this.handleHammerSwing(x, y);
          } else { 
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

  private triggerHammerAnimation(x: number, y: number) {
    this.hammerSprite.setAlpha(1).setPosition(x + 50, y - 150).setAngle(15).setScale(0.5 * this.uiScale);
    this.tweens.add({
      targets: this.hammerSprite,
      x: x,
      y: y + 20,
      angle: -25,
      duration: 100,
      ease: 'Cubic.in',
      onComplete: () => {
        this.tweens.add({
          targets: this.hammerSprite,
          angle: -10,
          y: y + 10,
          alpha: 0,
          duration: 200,
          ease: 'Cubic.out'
        });
      }
    });
  }

  private setupToolSwitcher() {
    this.toolSwitcherContainer = this.add.container(0, 0).setDepth(30);
    this.root.add(this.toolSwitcherContainer);
    const createToolBtn = (x: number, y: number, key: string, tool: SmithingTool) => {
        const size = 110; 
        const bg = this.add.circle(0, 0, size/2, 0x1c1917, 0.9).setStrokeStyle(5, 0x57534e).setInteractive({ useHandCursor: true });
        const icon = this.add.image(0, 0, key).setDisplaySize(size * 0.65, size * 0.65);
        const container = this.add.container(x, y, [bg, icon]);
        bg.on('pointerdown', (p: any, lx: any, ly: any, event: any) => {
            event.stopPropagation();
            if (this.currentTool === tool && tool === 'HAMMER') {
                this.resetRing(); 
            } else {
                this.switchTool(tool);
            }
            this.tweens.add({ targets: container, scale: 0.85, duration: 80, yoyo: true });
        });
        return container;
    };
    this.hammerBtn = createToolBtn(0, 0, 'icon_hammer', 'HAMMER');
    this.tongsBtn = createToolBtn(125, 0, 'icon_tongs', 'TONGS'); 
    this.toolSwitcherContainer.add([this.hammerBtn, this.tongsBtn]);
  }

  private switchTool(tool: SmithingTool) {
    this.currentTool = tool;
    const hamBg = this.hammerBtn.list[0] as Phaser.GameObjects.Arc;
    const tonBg = this.tongsBtn.list[0] as Phaser.GameObjects.Arc;
    if (tool === 'HAMMER') {
        hamBg.setStrokeStyle(6, 0xfbbf24).setFillStyle(0x451a03, 1);
        tonBg.setStrokeStyle(4, 0x57534e).setFillStyle(0x1c1917, 0.9);
        if (this.manualControlsContainer) this.manualControlsContainer.setVisible(false);
        this.targetRing.setVisible(this.isPlaying);
        this.approachRing.setVisible(this.isPlaying);
        if (this.isPlaying) this.resetRing();
        this.targetOutlineGraphics.setVisible(false);
    } else {
        tonBg.setStrokeStyle(6, 0xfbbf24).setFillStyle(0x451a03, 1);
        hamBg.setStrokeStyle(4, 0x57534e).setFillStyle(0x1c1917, 0.9);
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
        const bg = this.add.circle(0, 0, size/2, 0x1c1917, 0.8).setStrokeStyle(2, isRot ? 0x3b82f6 : 0xfbbf24, 0.8).setInteractive({ useHandCursor: true });
        const icon = this.add.text(0, 0, label, { fontSize: '24px', color: isRot ? '#60a5fa' : '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5);
        const btn = this.add.container(x, y, [bg, icon]);
        bg.on('pointerdown', (p: Phaser.Input.Pointer, lx: any, ly: any, event: any) => {
            event.stopPropagation();
            if (this.isSnapped) this.isSnapped = false;
            this.startPointerPos = { x: p.x, y: p.y };
            this.startBilletPos = { x: this.billetContainer.x, y: this.billetContainer.y };
            if (isRot) {
                this.isRotatingManual = true;
                this.startPointerAngle = Phaser.Math.Angle.Between(this.billetContainer.x, this.billetContainer.y, p.x, p.y);
                this.startBilletRotation = this.startBilletRotation;
            } else if (mode === 'X') {
                this.isMovingManualX = true;
            } else if (mode === 'Y') {
                this.isMovingManualY = true;
            }
            this.tweens.add({ targets: btn, scale: 0.8, duration: 100 });
        });
        bg.on('pointerup', () => { this.tweens.add({ targets: btn, scale: 1, duration: 100 }); });
        return btn;
    };
    const offsetX = 280; const offsetY = 120;
    const btnL = createBtn(-offsetX, 0, '←', 'X');
    const btnR = createBtn(offsetX, 0, '→', 'X');
    const btnU = createBtn(0, -offsetY, '↑', 'Y');
    const btnD = createBtn(0, offsetY, '↓', 'Y');
    const btnRotTL = createBtn(-offsetX, -offsetY, '🔄', 'ROT');
    const btnRotBR = createBtn(offsetX, offsetY, '🔄', 'ROT');
    this.manualControlsContainer.add([btnL, btnR, btnU, btnD, btnRotTL, btnRotBR]).setVisible(false);
  }

  private checkMagnetSnap() {
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
        this.isSnapped = true; this.isRotatingManual = false; this.isMovingManualX = false; this.isMovingManualY = false;
        this.snapTween = this.tweens.add({
            targets: this.billetContainer, x: targetX, y: targetY, rotation: targetRot, duration: 150, ease: 'Back.easeOut',
            onComplete: () => { this.rebuildHitPoly(); this.drawTargetGuidelineFixed(); this.createSparks(25, 0x10b981, 1.4, 'spark_perfect', targetX, targetY); }
        });
    }
  }

  private applyKickback(intensity: number) {
      if (!this.billetContainer) return;
      this.isSnapped = false;
      const posRange = intensity * 15; const angleRange = intensity * 8;
      const dx = Phaser.Math.FloatBetween(-posRange, posRange); const dy = Phaser.Math.FloatBetween(-posRange, posRange); const da = Phaser.Math.FloatBetween(-angleRange, angleRange);
      this.tweens.add({ targets: this.billetContainer, x: this.billetContainer.x + dx, y: this.billetContainer.y + dy, angle: this.billetContainer.angle + da, duration: 150, ease: 'Cubic.easeOut', onUpdate: () => this.rebuildHitPoly() });
  }

  private isBellowsClick(objs: any[]) { return objs.includes(this.bellowsContainer) || this.bellowsContainer.list.some((c) => objs.includes(c)); }
  private isHeatUpClick(objs: any[]) { return objs.includes(this.heatUpBtnContainer) || this.heatUpBtnContainer.list.some((c) => objs.includes(c)); }

  private setupUI() {
    this.progBg = this.add.graphics(); this.progressBar = this.add.graphics();
    this.qualityText = this.add.text(0, 55, 'PRISTINE', { fontFamily: 'Grenze Gotisch', fontSize: '18px', color: '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5);
    this.uiContainer.add([this.progBg, this.progressBar, this.qualityText]);
    this.tempBgGraphics = this.add.graphics(); this.tempBarGraphics = this.add.graphics();
    this.tempValueText = this.add.text(0, 0, '10°C', { fontFamily: 'Grenze', fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.uiContainer.add([this.tempBgGraphics, this.tempBarGraphics, this.tempValueText]);
    const r = 48; 
    this.bellowsContainer = this.add.container(0, 0);
    this.bellowsBg = this.add.circle(0, 0, r, 0x1c1917, 1).setStrokeStyle(3, 0x10b981).setName('btnBg');
    this.bellowsSprite = this.add.sprite(0, 0, 'bellows').setScale(0.28); 
    const pumpTxt = this.add.text(0, 30, 'PUMP', { fontSize: '12px', color: '#fde68a', fontFamily: 'Grenze', fontStyle: 'bold' }).setOrigin(0.5);
    this.bellowsContainer.add([this.bellowsBg, this.bellowsSprite, pumpTxt]).setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains);
    this.bellowsSprite.on('animationcomplete-bellows_pump', () => { this.isPumping = false; });
    this.heatUpBtnContainer = this.add.container(0, 0);
    const btnBg = this.add.circle(0, 0, r, 0x1c1917, 1).setStrokeStyle(3, 0x57534e).setName('btnBg');
    const btnIcon = this.add.text(0, -10, '🔥', { fontSize: '24px' }).setOrigin(0.5).setName('btnIcon');
    const btnLabel = this.add.text(0, 10, 'HEAT', { fontSize: '12px', color: '#fbbf24', fontStyle: 'bold', fontFamily: 'Grenze' }).setOrigin(0.5);
    const countTxt = this.add.text(0, 30, `x${this.charcoalCount}`, { fontSize: '12px', color: '#78716c', fontFamily: 'Grenze' }).setOrigin(0.5).setName('countTxt');
    this.heatUpBtnContainer.add([btnBg, btnIcon, btnLabel, countTxt]).setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains);
    this.uiContainer.add([this.bellowsContainer, this.heatUpBtnContainer]);
    this.comboText = this.add.text(0, 0, '', { fontFamily: 'Grenze Gotisch', fontSize: '36px', color: '#fcd34d', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setAlpha(0).setDepth(26);
    this.infoText = this.add.text(0, 0, this.isReadyToStart ? 'TOUCH TO START' : 'FORGE IS COLD\nADD FUEL', { fontFamily: 'Grenze Gotisch', fontSize: '24px', color: this.isReadyToStart ? '#fbbf24' : '#3b82f6', align: 'center', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
    this.uiContainer.add([this.comboText, this.infoText]);
    this.tweens.add({ targets: this.infoText, alpha: 0.5, yoyo: true, repeat: -1, duration: 800 });
  }

  private generateOutlinePoints(key: string): Point[] {
    if (this.outlineCache.has(key)) return this.outlineCache.get(key)!;
    const texture = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const canvas = document.createElement('canvas'); canvas.width = texture.width; canvas.height = texture.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return [];
    ctx.drawImage(texture, 0, 0); const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data; const w = canvas.width; const h = canvas.height;
    const isOpaque = (x: number, y: number) => { if (x < 0 || x >= w || y < 0 || y >= h) return false; return data[(y * w + x) * 4 + 3] > 50; };
    let startPoint: Point | null = null;
    outer: for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) { if (isOpaque(x, y)) { startPoint = { x, y }; break outer; } } }
    if (!startPoint) return [];
    const path: Point[] = []; let curr = { ...startPoint }; let prev = { x: startPoint.x, y: startPoint.y - 1 };
    const neighbors = [{x:-1, y:-1}, {x:0, y:-1}, {x:1, y:-1}, {x:1, y:0}, {x:1, y:1}, {x:0, y:1}, {x:-1, y:1}, {x:-1, y:-0}];
    let iters = 0;
    while (iters < w * h) {
        const relX = prev.x - curr.x; const relY = prev.y - curr.y;
        let startIdx = neighbors.findIndex(n => n.x === relX && n.y === relY); if (startIdx === -1) startIdx = 0;
        let found = false;
        for (let i = 1; i <= 8; i++) {
            const idx = (startIdx + i) % 8; const nx = curr.x + neighbors[idx].x; const ny = curr.y + neighbors[idx].y;
            if (isOpaque(nx, ny)) { prev = { ...curr }; curr = { x: nx, y: ny }; path.push({ ...curr }); found = true; break; }
        }
        if (!found || (curr.x === startPoint.x && curr.y === startPoint.y)) break;
        iters++;
    }
    const simplified: Point[] = []; const step = Math.max(1, Math.floor(path.length / 50));
    for (let i = 0; i < path.length; i += step) { simplified.push({ x: path[i].x - w/2, y: path[i].y - h/2 }); }
    this.outlineCache.set(key, simplified); return simplified;
  }

  private drawTargetGuidelineFixed() {
    if (!this.targetOutlineGraphics || !this.billetImage) return;
    this.targetOutlineGraphics.clear();
    const currentKey = this.billetImage.texture.key; const localPoints = this.generateOutlinePoints(currentKey);
    const rad = Phaser.Math.DegToRad(this.BILLET_ANGLE_DEG); const cos = Math.cos(rad); const sin = Math.sin(rad);
    const scale = this.billetContainer.scaleX; const anvilScale = this.anvilImage.scaleX;
    const offsetX = (this.ANVIL_HIT_X - this.ANVIL_ORIGINAL_W / 2) * anvilScale;
    const offsetY = (this.ANVIL_HIT_Y - this.ANVIL_ORIGINAL_H / 2) * anvilScale;
    const targetX = this.anvilImage.x + offsetX; const targetY = this.anvilImage.y + offsetY;
    const transformed = localPoints.map(p => ({ x: targetX + (p.x * scale * cos - p.y * scale * sin), y: targetY + (p.x * scale * sin + p.y * scale * cos) }));
    this.targetOutlineGraphics.lineStyle(2, this.isSnapped ? 0x10b981 : 0xfbbf24, this.isSnapped ? 0.8 : 0.4);
    const dashLen = 8; const gapLen = 5;
    for (let i = 0; i < transformed.length; i++) {
        const p1 = transformed[i]; const p2 = transformed[(i + 1) % transformed.length];
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        const angle = Phaser.Math.Angle.Between(p1.x, p1.y, p2.x, p2.y);
        let currentDist = 0; let draw = true;
        while (currentDist < dist) {
            const stepSize = draw ? dashLen : gapLen; const nextDist = Math.min(currentDist + stepSize, dist);
            if (draw) this.targetOutlineGraphics.lineBetween(p1.x + Math.cos(angle) * currentDist, p1.y + Math.sin(angle) * currentDist, p1.x + Math.cos(angle) * nextDist, p1.y + Math.sin(angle) * nextDist);
            currentDist = nextDist; draw = !draw;
        }
    }
  }

  private placeBilletOnAnvil() {
    if (!this.anvilImage || !this.billetContainer) return;
    const currentKey = this.billetImage?.texture?.key ?? 'billet_stage_0'; 
    const src = this.textures.get(currentKey)?.getSourceImage() as HTMLImageElement;
    const baseTexW = src?.width ?? 1220; const targetBilletW = this.anvilImage.displayWidth * this.BILLET_W_ON_ANVIL; 
    const billetScale = Phaser.Math.Clamp(targetBilletW / baseTexW, 0.15, 2.0);
    const anvilScale = this.anvilImage.scaleX;
    const offsetX = (this.ANVIL_HIT_X - this.ANVIL_ORIGINAL_W / 2) * anvilScale;
    const offsetY = (this.ANVIL_HIT_Y - this.ANVIL_ORIGINAL_H / 2) * anvilScale;
    const targetX = this.anvilImage.x + offsetX; const targetY = this.anvilImage.y + offsetY;
    if (!this.isPlaying || (this.currentTool === 'HAMMER' && !this.isRotatingManual && !this.isMovingManualX && !this.isMovingManualY)) {
        this.billetContainer.setRotation(Phaser.Math.DegToRad(this.BILLET_ANGLE_DEG)).setScale(billetScale).setPosition(targetX, targetY);
        this.isSnapped = true;
    }
    this.rebuildHitPoly();
    if (this.currentTool === 'TONGS') this.drawTargetGuidelineFixed();
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
      const anvilW = sw * 1.2; const anvilScale = anvilW / this.anvilImage.width;
      const forgeCenterX = sw * 0.4; this.anvilImage.setScale(anvilScale).setPosition(forgeCenterX, this.centerY);
      if (this.anvilImage) {
        if (this.ambientGlow) this.ambientGlow.setPosition(forgeCenterX, this.centerY);
      }
      this.placeBilletOnAnvil();
      const basis = Math.min(sw, sh); 
      this.startRadius = Phaser.Math.Clamp(basis * (portrait ? 0.28 : 0.35), 105, 240);
      const isCompact = sh < 500; this.repositionUI(sw, sh, portrait, isCompact);
      if (this.isPlaying && this.currentTool === 'HAMMER') this.resetRing();
      if (this.manualControlsContainer) {
          const invScale = 1 / (this.billetContainer.scaleX || 1);
          this.manualControlsContainer.setScale(invScale * (this.uiScale || 1.0));
      }
      const swX = this.UI_PAD_SIDE + 65; const swY = sh - this.UI_PAD_BOTTOM - 40;
      this.toolSwitcherContainer.setPosition(swX, swY).setScale(this.uiScale || 1.0);
    };
    if (this.lastPortrait === undefined) { this.lastPortrait = nextPortrait; this.isPortrait = nextPortrait; apply(w, h, nextPortrait); return; }
    const changed = this.lastPortrait !== nextPortrait; this.lastPortrait = nextPortrait; this.isPortrait = nextPortrait;
    if (changed && !this.isRelayouting) {
      this.isRelayouting = true; const cam = this.cameras.main; cam.fadeOut(120, 0, 0, 0);
      this.time.delayedCall(140, () => {
        const ww = this.scale.gameSize.width; const hh = this.scale.gameSize.height; cam.setViewport(0, 0, ww, hh);
        apply(ww, hh, this.isPortrait); cam.fadeIn(120, 0, 0, 0);
        this.time.delayedCall(160, () => { this.isRelayouting = false; });
      });
      return;
    }
    apply(w, h, nextPortrait);
  }

  private get uiScale(): number { return Math.min(this.viewW, this.viewH) / 720; }

  private repositionUI(sw: number, sh: number, portrait: boolean, isCompact: boolean) {
    if (!this.uiContainer) return;
    this.updateProgressBar(); this.qualityText.setPosition(this.centerX, this.UI_PAD_TOP + 45 + 10).setFontSize(isCompact ? '16px' : '18px');
    const sideAreaWidth = Math.min(sw, sh) * 0.18; const rightX = sw - (sideAreaWidth / 2) - this.UI_PAD_SIDE;
    const panelStartY = sh * 0.45; const panelEndY = sh - this.UI_PAD_BOTTOM;
    const btnScale = sideAreaWidth / 100; const btnH = 100 * btnScale;
    const heatUpY = panelEndY - (btnH / 2); const bellowsY = heatUpY - (btnH / 2) - this.UI_GAP - (btnH / 2);
    this.heatUpBtnContainer.setPosition(rightX, heatUpY).setScale(btnScale); this.bellowsContainer.setPosition(rightX, bellowsY).setScale(btnScale);
    const gaugeTopLimit = panelStartY + 35; const gaugeBottomLimit = bellowsY - (btnH / 2) - this.UI_GAP;
    const gaugeH = Math.max(this.TEMP_GAUGE_H_MIN, gaugeBottomLimit - gaugeTopLimit); const gaugeCenterY = gaugeTopLimit + (gaugeH / 2);
    this.tempValueText.setPosition(rightX, gaugeCenterY - gaugeH / 2 - 25).setFontSize(isCompact ? '12px' : '14px');
    this.refreshTempGaugeVisuals(rightX, gaugeCenterY, gaugeH);
    const infoY = portrait ? sh * 0.3 : this.centerY - (isCompact ? 80 : 140);
    this.infoText.setPosition(this.centerX, infoY).setFontSize(portrait ? (isCompact ? '20px' : '24px') : (isCompact ? '20px' : '26px'));
  }

  private refreshTempGaugeVisuals(x: number, y: number, h: number) {
      const ratio = this.temperature / 100;
      this.tempBgGraphics.clear().fillStyle(0x1c1917, 1).fillRoundedRect(x - 15, y - (h + 10) / 2, 30, h + 10, 15).lineStyle(3, 0x57534e, 1).strokeRoundedRect(x - 15, y - (h + 10) / 2, 30, h + 10, 15).fillStyle(0x0c0a09, 1).fillRoundedRect(x - 11, y - h / 2, 22, h, 11);
      this.tempBarGraphics.clear();
      if (ratio > 0) {
          const barH = h * ratio; let barColor = 0xeab308; 
          if (ratio < 0.4) barColor = 0x3b82f6; else if (ratio > 0.7) barColor = 0xef4444;
          this.tempBarGraphics.fillStyle(barColor, 1).fillRoundedRect(x - 8, y + h / 2 - barH, 16, barH, 8); 
      }
  }

  private rebuildHitPoly() {
    if (!this.billetImage) return;
    const currentKey = this.billetImage.texture.key; 
    const localPoints = this.generateOutlinePoints(currentKey); 
    
    const rad = Phaser.Math.DegToRad(this.billetContainer.angle);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const visualScale = this.billetContainer.scaleX;
    const cx = this.billetContainer.x;
    const cy = this.billetContainer.y;

    const hitDetectionScale = visualScale * 1.15;
    const transformedPoints = localPoints.map(p => ({
        x: cx + (p.x * hitDetectionScale * cos - p.y * hitDetectionScale * sin),
        y: cy + (p.x * hitDetectionScale * sin + p.y * hitDetectionScale * cos)
    }));
    this.hitPoly = new Phaser.Geom.Polygon(transformedPoints);
    
    const spawnPoints = localPoints.map(p => ({
        x: cx + (p.x * visualScale * cos - p.y * visualScale * sin),
        y: cy + (p.x * visualScale * sin + p.y * visualScale * cos)
    }));
    this.spawnPoly = new Phaser.Geom.Polygon(spawnPoints);
  }

  private isPointerInHitArea(px: number, py: number) { 
      if (this.hitPoly && Phaser.Geom.Polygon.Contains(this.hitPoly, px, py)) return true;
      if (Phaser.Math.Distance.Between(px, py, this.hitX, this.hitY) < (this.targetRadius + 15) * this.uiScale) return true;
      return false;
  }

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
    
    this.triggerHammerAnimation(x, y);

    const diff = Math.abs(this.currentRadius - this.targetRadius);
    const eff = this.currentTempStage === 'AURA' ? 1.5 : this.currentTempStage === 'HOT' ? 1.0 : 0.5;
    
    if (diff < this.targetRadius * SMITHING_CONFIG.JUDGMENT.PERFECT_THRESHOLD) {
      this.score += Math.ceil(8 * eff); this.combo++; this.perfectCount++;
      if (this.perfectCount >= 6) { this.currentQuality += 1; }
      if (this.combo > 0 && this.combo % 5 === 0) this.handleEnhancement(x, y);
      this.createSparks(30, this.currentTargetColor, 1.5, 'spark_perfect', x, y); this.showFeedback('PERFECT!', 0xffb300, 1.4, x, y); this.cameras.main.shake(150, 0.02);
      this.applyKickback(0.05); 
      
      // 튜토리얼 체크: 첫 번째 타격 성공 시 React에 알림
      if (this.isTutorial && this.perfectCount === 1 && this.onTutorialAction) {
          this.onTutorialAction('FIRST_HIT_DONE');
          // 튜토리얼 일시정지를 위해 즉시 반환 (resetRing 호출 안함)
          this.targetRing.clear(); // 링 그래픽 명시적 제거
          this.approachRing.clear(); // 링 그래픽 명시적 제거
          this.updateProgressBar();
          return;
      }
    } else if (diff < this.targetRadius * SMITHING_CONFIG.JUDGMENT.GOOD_THRESHOLD) {
      this.score += Math.ceil(5 * eff); this.combo = 0; this.currentQuality = Math.max(0, this.currentQuality - 2);
      this.createSparks(15, 0xffffff, 1.1, 'spark_normal', x, y); this.showFeedback('GOOD', 0xe5e5e5, 1.1, x, y);
      this.applyKickback(0.4); 
    } else { this.handleMiss(x, y); }
    this.updateProgressBar();
    if (this.score >= this.targetScore) this.winGame(); else this.resetRing();
  }

  /**
   * 튜토리얼 중 리액트의 확인 신호를 받고 다음 단계를 재개합니다.
   */
  public resumeTutorialCrafting() {
      if (this.isTutorial && this.perfectCount === 1) {
          this.resetRing();
      }
  }

  private handleEnhancement(x: number, y: number) {
    this.enhancementCount++;
    const pinnedText = this.add.text(x, y, '+1', { fontFamily: 'Grenze Gotisch', fontSize: '48px', color: '#fbbf24', fontStyle: 'bold', stroke: '#000', strokeThickness: 6, shadow: { color: '#000', fill: true, blur: 10 } }).setOrigin(0.5).setDepth(15).setAlpha(0).setScale(0.5);
    this.root.add(pinnedText); this.pinnedTexts.push(pinnedText);
    this.tweens.add({ targets: pinnedText, alpha: 1, scale: 1, y: y - 20, duration: 400, ease: 'Back.out' });
  }

  private handleMiss(x?: number, y?: number, customText?: string) {
    this.score = Math.max(0, this.score - 5); this.combo = 0; this.currentQuality = Math.max(0, this.currentQuality - 5);
    this.cameras.main.shake(100, 0.01); this.showFeedback(customText ?? 'MISS', 0xef4444, 1.0, x ?? this.hitX, y ?? this.hitY);
    if (x !== undefined && y !== undefined) this.triggerHammerAnimation(x, y);
    this.applyKickback(1.5); this.updateProgressBar(); this.resetRing();
  }

  update(time: number, delta: number) {
    if (this.isFinished) return;

    const currentStep = (this.game as any).tutorialStep;
    // 튜토리얼 단계 중 'FIRST_HIT_DIALOG' 등 대화가 출력되는 동안은 링 로직 일시 중지
    const isTutorialDialogueActive = this.isTutorial && (currentStep === 'FIRST_HIT_DIALOG' || currentStep?.includes('_DIALOG'));

    if (this.isPlaying && this.currentTool === 'HAMMER' && !isTutorialDialogueActive) {
        this.handleRingLogic(delta);
    }
    
    const floorVal = SmithingTutorialHandler.getTemperatureFloor(this.isTutorial);
    
    // 튜토리얼 중이며 아직 본격적인 제작(망치질)을 시작하기 위해 화면을 탭하지 않은 상태일 때,
    // 온도가 정점(98% 이상)에 도달했다면 냉각을 정지하여 유저가 여유롭게 TOUCH TO START를 할 수 있게 함.
    const isPeakInTutorialWait = this.isTutorial && !this.isPlaying && this.temperature >= 98;
    
    if (!isPeakInTutorialWait) {
        this.temperature = Math.max(floorVal, this.temperature - this.coolingRate * (delta / 1000));
    }
    
    this.refreshVisuals();

    if (this.onStatusUpdate) this.onStatusUpdate(this.temperature);

    if (!this.isPlaying && this.isReadyToStart && this.temperature <= floorVal + 0.1 && !this.isTutorial) {
      this.isReadyToStart = false; this.infoText.setText('FORGE IS COLD\nADD FUEL').setColor('#3b82f6');
    }

    if (this.isTutorial && this.onTutorialTargetUpdate) {
        const activeRect = SmithingTutorialHandler.getHighlightRect(this.isTutorial, currentStep, this.isPlaying, {
          heatUpBtn: this.heatUpBtnContainer,
          bellowsBtn: this.bellowsContainer,
          hitX: this.hitX,
          hitY: this.hitY,
          targetRadius: this.targetRadius
        });
        this.onTutorialTargetUpdate(activeRect);
    }
  }

  private refreshVisuals() {
    this.qualityText.setText(this.getQualityLabel(this.currentQuality)).setColor(this.getLabelColor(this.currentQuality));
    const ratio = this.temperature / 100; 
    this.tempValueText.setText(`${Math.round(IDLE_TEMP + ratio * (MAX_TEMP - IDLE_TEMP))}°C`);
    
    if (this.tempBarGraphics) {
        const sideAreaWidth = Math.min(this.viewW, this.viewH) * 0.18; const rightX = this.viewW - (sideAreaWidth / 2) - this.UI_PAD_SIDE;
        const panelStartY = this.viewH * 0.45; const btnScale = sideAreaWidth / 100; const btnH = 100 * btnScale;
        const heatUpY = (this.viewH - this.UI_PAD_BOTTOM) - (btnH / 2); const bellowsY = heatUpY - (btnH / 2) - this.UI_GAP - (btnH / 2);
        const gaugeTopLimit = panelStartY + 35; const gaugeBottomLimit = bellowsY - (btnH / 2) - this.UI_GAP;
        const gaugeH = Math.max(this.TEMP_GAUGE_H_MIN, gaugeBottomLimit - gaugeTopLimit); const gaugeCenterY = gaugeTopLimit + (gaugeH / 2);
        this.refreshTempGaugeVisuals(rightX, gaugeCenterY, gaugeH);
    }
    const progress = Phaser.Math.Clamp(this.score / this.targetScore, 0, 1);
    this.setBilletStage(Math.min(5, Math.floor(progress * 6)));
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
    if (!this.billetImage) { this.billetImage = this.add.image(0, 0, key).setOrigin(0.5); this.billetContainer.add(this.billetImage); this.placeBilletOnAnvil(); return; }
    if (this.billetImage.texture.key !== key) {
      this.billetImage.setTexture(key); this.placeBilletOnAnvil();
      this.tweens.add({ targets: this.billetContainer, scaleX: this.billetContainer.scaleX * 1.08, scaleY: this.billetContainer.scaleY * 1.08, duration: 100, yoyo: true });
    }
  }

  private handleRingLogic(delta: number) {
    const tutorialStep = (this.game as any).tutorialStep;
    const speedFactor = SmithingTutorialHandler.getRingSpeedFactor(this.isTutorial, tutorialStep, this.perfectCount);
    
    this.ringTimer += delta * this.currentSpeedMult * speedFactor; 
    const t = Math.min(this.ringTimer / this.shrinkDuration, 1.5); this.currentRadius = this.startRadius * (1 - t * t);
    const colorT = Math.min(this.ringTimer / this.shrinkDuration, 1.0);
    const targetRGB = Phaser.Display.Color.IntegerToColor(this.currentTargetColor);
    const ringColor = Phaser.Display.Color.GetColor(Math.floor(255 + (targetRGB.red - 255) * colorT), Math.floor(255 + (targetRGB.green - 255) * colorT), Math.floor(255 + (targetRGB.blue - 255) * colorT));
    const ringAlpha = 0.6 + (colorT * 0.3);
    this.approachRing.clear().lineStyle(6, ringColor, ringAlpha).fillStyle(ringColor, ringAlpha * 0.15).fillCircle(this.hitX, this.hitY, Math.max(0, this.currentRadius)).strokeCircle(this.hitX, this.hitY, Math.max(0, this.currentRadius));
    
    if (this.currentRadius < this.targetRadius - 30) { 
        this.handleMiss(this.hitX, this.hitY, 'TOO LATE'); 
    }
  }

  private resetRing() {
    if (this.temperature <= 0 || !this.spawnPoly) return; 
    this.targetRing.clear(); this.approachRing.clear(); this.currentRadius = this.startRadius; this.ringTimer = 0;
    
    // Check for forced tutorial difficulty
    const tutorialStep = (this.game as any).tutorialStep;
    const forced = SmithingTutorialHandler.getForcedDifficulty(this.isTutorial, tutorialStep, this.perfectCount);

    if (forced) {
        this.currentTargetColor = forced.color;
        this.currentSpeedMult = forced.speedMult;
    } else {
        // 신규 밸런싱 로직 적용
        const bias = SMITHING_CONFIG.BALANCING;
        const redBias = Math.min(bias.MAX_RED_BIAS, this.combo * bias.BIAS_PER_COMBO); 
        const randType = Math.random();
        
        const diffCfg = SMITHING_CONFIG.DIFFICULTY;
        
        // 추첨 로직: EASY -> NORMAL -> HARD 순으로 범위 판정
        const easyThreshold = Math.max(bias.MIN_GREEN_PROB, diffCfg.EASY.baseProbability - (redBias * bias.EASY_REDUCTION_FACTOR));
        const normalThreshold = easyThreshold + (1.0 - easyThreshold - redBias);

        if (randType < easyThreshold) { 
            this.currentTargetColor = diffCfg.EASY.color; 
            this.currentSpeedMult = diffCfg.EASY.speedMult; 
        } 
        else if (randType < normalThreshold) { 
            this.currentTargetColor = diffCfg.NORMAL.color; 
            this.currentSpeedMult = diffCfg.NORMAL.speedMult; 
        } 
        else { 
            this.currentTargetColor = diffCfg.HARD.color; 
            this.currentSpeedMult = diffCfg.HARD.speedMult; 
        }
    }

    this.targetRadius = this.startRadius * Phaser.Math.FloatBetween(0.18, 0.32);
    
    const rect = Phaser.Geom.Polygon.GetAABB(this.spawnPoly);
    let found = false; let attempts = 0;
    while (!found && attempts < 200) {
        const tx = Phaser.Math.FloatBetween(rect.left, rect.right); 
        const ty = Phaser.Math.FloatBetween(rect.top, rect.bottom);
        if (Phaser.Geom.Polygon.Contains(this.spawnPoly, tx, ty)) { 
            this.hitX = tx; this.hitY = ty; found = true; 
        }
        attempts++;
    }
    
    if (!found && this.spawnPoly.points.length > 0) {
        const p = this.spawnPoly.points[Math.floor(Math.random() * this.spawnPoly.points.length)];
        this.hitX = p.x; this.hitY = p.y;
    }

    if (this.isPlaying && this.currentTool === 'HAMMER') { 
        this.targetRing.clear().fillStyle(this.currentTargetColor, 0.25).fillCircle(this.hitX, this.hitY, this.targetRadius).lineStyle(5, this.currentTargetColor, 0.8) .strokeCircle(this.hitX, this.hitY, this.targetRadius); 
    }
  }

  private updateProgressBar() {
    if (!this.progBg || !this.progressBar) return;
    const progWidth = Math.min(this.viewW * (this.isPortrait ? 0.72 : 0.6), 340); const progX = this.centerX - progWidth / 2; const padTop = this.UI_PAD_TOP + 10;
    this.progBg.clear().fillStyle(0x1c1917, 1).fillRoundedRect(progX, padTop, progWidth, 18, 9).lineStyle(2, 0x57534e, 1).strokeRoundedRect(progX, padTop, progWidth, 18, 9);
    this.progressBar.clear(); const ratio = Phaser.Math.Clamp(this.score / this.targetScore, 0, 1);
    if (ratio > 0) this.progressBar.fillStyle(0xeab308, 1).fillRoundedRect(progX + 2, padTop + 2, (progWidth - 4) * ratio, 14, 7); 
  }

  private createSparks(count: number, color: number, scale: number, key: string, x: number, y: number) {
    const emitter = this.add.particles(x, y, this.textures.exists(key) ? key : 'spark_normal', { lifespan: 600, speed: { min: 200 * scale, max: 500 * scale }, angle: { min: 230, max: 310 }, scale: { start: 0.6, end: 0 }, gravityY: 1000, blendMode: 'ADD', tint: color });
    this.root.add(emitter); emitter.explode(count);
  }

  private showFeedback(text: string, color: number, scale: number, x: number, y: number) {
    const fb = this.add.text(x, y, text, { fontFamily: 'Grenze Gotisch', fontSize: '32px', fontStyle: 'bold', color: '#' + color.toString(16).padStart(6, '0'), stroke: '#000', strokeThickness: 7 }).setOrigin(0.5).setScale(0.5).setAlpha(0).setDepth(25);
    this.root.add(fb); this.tweens.add({ targets: fb, y: y - 40, alpha: 1, scale: scale, duration: 250, hold: 400, yoyo: true, onComplete: () => fb.destroy() });
    if (this.combo > 1) { this.comboText.setPosition(x, y - 75).setText(`${this.combo} COMBO!`).setAlpha(1).setScale(1.2); this.tweens.add({ targets: this.comboText, scale: { from: 1.4, to: 1 }, duration: 200, alpha: { from: 1, to: 0 }, delay: 700 }); }
  }

  private winGame() {
    this.isFinished = true; this.isPlaying = false; this.targetRing.clear(); this.approachRing.clear();
    
    // 튜토리얼 체크: 제작 완료 시 React에 알림
    if (this.isTutorial && this.onTutorialAction) {
        this.onTutorialAction('CRAFT_FINISHED');
    }

    if (this.onStatusUpdate) this.onStatusUpdate(this.temperature);
    const bg = this.add.rectangle(this.centerX, this.centerY, this.viewW, this.viewH, 0x000000).setAlpha(0).setDepth(100);
    this.root.add(bg); this.tweens.add({ targets: bg, alpha: 0.8, duration: 500 });
    const label = this.getQualityLabel(this.currentQuality);
    const txt = this.add.text(this.centerX, this.centerY, this.isPortrait ? `${label}\nCRAFT!` : `${label} CRAFT!`, { fontFamily: 'Grenze Gotisch', fontSize: this.isPortrait ? `${Math.min(36, this.viewW * 0.08)}px` : '48px', color: this.getLabelColor(this.currentQuality), stroke: '#000', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setAlpha(0).setDepth(101);
    this.root.add(txt); this.tweens.add({ targets: txt, alpha: 1, scale: { from: 0.5, to: this.isPortrait ? 1.0 : 1.1 }, duration: 600, ease: 'Back.out', onComplete: () => { this.time.delayedCall(1000, () => { if (this.onComplete) this.onComplete(this.currentQuality, this.enhancementCount); }); } });
  }

  private pumpBellows() {
    this.isPumping = true; this.bellowsSprite.play('bellows_pump', true); 
    this.tweens.add({ targets: this.bellowsBg, alpha: { from: 1, to: 0.7 }, scale: { from: 1, to: 1.1 }, duration: 150, yoyo: true, ease: 'Cubic.out' });
    if (this.temperature > 0) { 
        this.temperature = Math.min(100, this.temperature + 5.5); 
        if (!this.isPlaying && !this.isReadyToStart) { this.isReadyToStart = true; this.infoText.setText('TOUCH TO START').setColor('#fbbf24'); } 
    }
  }

  private requestHeatUp() { 
    const hasCharcoal = this.charcoalCount === '∞' || (typeof this.charcoalCount === 'number' && this.charcoalCount > 0);
    if (hasCharcoal && this.onHeatUpRequest) { this.tweens.add({ targets: this.heatUpBtnContainer, scale: 0.9, duration: 50, yoyo: true }); this.onHeatUpRequest(); } else { this.cameras.main.shake(100, 0.005); } 
  }

  public heatUp() {
    // 튜토리얼이든 아니든 온도가 고정되는 대신 더해지도록 수정
    // 기본 온도가 너무 낮으면 40으로 끌어올리고, 이미 높으면 점진적으로 추가
    this.temperature = Math.min(100, Math.max(this.temperature + 20, 40)); 

    if (!this.isPlaying) { 
        this.isReadyToStart = true; 
        this.infoText.setText('TOUCH TO START').setColor('#fbbf24'); 
    } 
    this.flashOverlay.setFillStyle(0xff8800, 1).setAlpha(0.4); 
    this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 400, ease: 'Cubic.easeOut' });
  }
  public updateCharcoalCount(count: number | string) { this.charcoalCount = count; this.refreshHeatUpButton(); }
  private refreshHeatUpButton() { 
    if (!this.heatUpBtnContainer) return;
    const bg = this.heatUpBtnContainer.getByName('btnBg') as Phaser.GameObjects.Arc; 
    const countTxt = this.heatUpBtnContainer.getByName('countTxt') as Phaser.GameObjects.Text; if (countTxt) countTxt.setText(`x${this.charcoalCount}`); 
    const hasCharcoal = this.charcoalCount === '∞' || (typeof this.charcoalCount === 'number' && this.charcoalCount > 0);
    if (bg) bg.setStrokeStyle(3, hasCharcoal ? 0xea580c : 0x292524); 
  }
  public getTemperature() { return this.temperature; }
}
