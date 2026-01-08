
import Phaser from 'phaser';
import { getAssetUrl } from '../utils';

export interface SmithingSceneData {
  onComplete: (score: number) => void;
  onStatusUpdate?: (temp: number) => void;
  onHeatUpRequest?: () => void;
  difficulty: number;
  initialTemp: number;
  charcoalCount: number;
}

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

  private progressBar!: Phaser.GameObjects.Rectangle;
  private comboText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private qualityText!: Phaser.GameObjects.Text;

  private ambientGlow!: Phaser.GameObjects.Arc;
  private flashOverlay!: Phaser.GameObjects.Rectangle;

  private billetContainer!: Phaser.GameObjects.Container;
  private billetImage?: Phaser.GameObjects.Image;

  private hammerHitArea!: Phaser.GameObjects.Rectangle;
  private hitPoly!: Phaser.Geom.Polygon;

  private centerX = 0;
  private centerY = 0;
  private hitX = 0;
  private hitY = 0;

  private viewW = 0;
  private viewH = 0;

  private anvilConfig = {
    heightRatio: 0.4,
    yOffset: 20,
    imageOffsetY: 20,
    hitAreaOffset: 45,
  };

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
  private charcoalCount = 0;

  private startRadius = 180;
  private targetRadius = 45;
  private currentRadius = 180;
  private shrinkDuration = 2000;
  private ringTimer = 0;

  // Ring types state
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
    this.billetContainer = this.add.container(0, 0).setDepth(3).setAngle(this.BILLET_ANGLE_DEG);
    if (this.textures.exists('billet_stage_0')) {
      this.billetImage = this.add.image(0, 0, 'billet_stage_0').setOrigin(0.5);
      this.billetContainer.add(this.billetImage);
    }
    this.root.add(this.billetContainer);
    this.hammerHitArea = this.add.rectangle(0, 0, 1, 1, 0x00ff00).setDepth(3).setAlpha(0).setAngle(this.BILLET_ANGLE_DEG);
    this.root.add(this.hammerHitArea);
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
    this.handleResize(this.scale.gameSize);
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });
    this.time.delayedCall(80, () => this.handleResize());
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, objs: any[]) => {
        const x = pointer.x; const y = pointer.y;
        if (this.isBellowsClick(objs)) { this.pumpBellows(); return; }
        if (this.isHeatUpClick(objs)) { this.requestHeatUp(); return; }
        if (!this.isPlaying) { this.handleStartTap(x, y); return; }
        if (this.isPointerInHitArea(x, y) || Phaser.Math.Distance.Between(x, y, this.hitX, this.hitY) < this.startRadius * 0.8) {
          this.handleHammerSwing(x, y);
        } else { this.handleMiss(x, y); }
      }, this
    );
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

  private placeBilletOnAnvil() {
    if (!this.anvilImage || !this.billetContainer) return;
    const anvilDispW = this.anvilImage.displayWidth; const anvilDispH = this.anvilImage.displayHeight;
    const anvilTopY = this.anvilImage.y - anvilDispH / 2; const billetY = anvilTopY + anvilDispH * 0.25;
    const currentKey = this.billetImage?.texture?.key ?? 'billet_stage_0'; const tex = this.textures.get(currentKey);
    const src = tex?.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    const baseTexW = src?.width ?? 1220; const baseTexH = src?.height ?? 300;
    const targetBilletW = anvilDispW * this.BILLET_W_ON_ANVIL; const ratio = targetBilletW / baseTexW;
    const billetScale = Phaser.Math.Clamp(ratio, 0.15, 2.0);
    this.billetContainer.setAngle(this.BILLET_ANGLE_DEG).setScale(billetScale).setPosition(this.anvilImage.x * 1.2, billetY);
    const billetDispW = baseTexW * billetScale; const billetDispH = baseTexH * billetScale;
    this.hammerHitArea.setAngle(this.BILLET_ANGLE_DEG).setSize(billetDispW * 0.6, billetDispH * 1.0);
    const rad = Phaser.Math.DegToRad(this.BILLET_ANGLE_DEG); const hitOffset = this.anvilConfig.hitAreaOffset * billetScale;
    this.hammerHitArea.setPosition(this.billetContainer.x - Math.sin(rad) * hitOffset, this.billetContainer.y + Math.cos(rad) * hitOffset);
    this.rebuildHitPoly();
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
      const anvilY = portrait ? this.centerY : this.centerY + this.anvilConfig.yOffset;
      const anvilX = portrait ? sw * 0.35 : this.centerX;
      
      this.anvilImage.setScale(anvilScale).setPosition(anvilX, anvilY + this.anvilConfig.imageOffsetY);
      if (this.ambientGlow) this.ambientGlow.setPosition(anvilX, anvilY);
      this.placeBilletOnAnvil();
      const basis = Math.min(sw, sh); this.startRadius = Phaser.Math.Clamp(basis * (portrait ? 0.28 : 0.35), 105, 240);
      
      const isCompact = sh < 450; this.repositionUI(sw, sh, portrait, isCompact);
      if (this.isPlaying) this.resetRing();
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

  private repositionUI(sw: number, sh: number, portrait: boolean, isCompact: boolean) {
    if (!this.uiContainer) return;
    const padTop = this.UI_PAD_TOP; 
    const padBottom = this.UI_PAD_BOTTOM; const gap = this.UI_GAP;
    
    // Adjusted to 18% width area for the controllers
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
    const w = this.hammerHitArea.width; const h = this.hammerHitArea.height;
    const cx = this.hammerHitArea.x; const cy = this.hammerHitArea.y;
    const rad = Phaser.Math.DegToRad(this.hammerHitArea.angle);
    const cos = Math.cos(rad); const sin = Math.sin(rad);
    const corners = [ { x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 }, ].map((p) => ({ x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos }));
    this.hitPoly = new Phaser.Geom.Polygon(corners);
  }

  private isPointerInHitArea(px: number, py: number) { return this.hitPoly && Phaser.Geom.Polygon.Contains(this.hitPoly, px, py); }

  private handleStartTap(x: number, y: number) {
    if (this.isReadyToStart) {
      this.isPlaying = true; this.infoText.setVisible(false); this.resetRing();
      this.flashOverlay.setFillStyle(0xffffff, 1).setAlpha(0.2); this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 300 });
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
      this.createSparks(30, this.currentTargetColor, 1.5, 'spark_perfect', x, y); this.showFeedback('PERFECT!', 0xffb300, 1.4, this.hitX, this.hitY); this.cameras.main.shake(150, 0.02);
    } else if (diff < this.targetRadius * 0.95) {
      this.score += Math.ceil(5 * eff); this.combo = 0; this.currentQuality = Math.max(0, this.currentQuality - 2);
      this.createSparks(15, 0xffffff, 1.1, 'spark_normal', x, y); this.showFeedback('GOOD', 0xe5e5e5, 1.1, this.hitX, this.hitY);
    } else { this.handleMiss(x, y); }
    this.updateProgressBar();
    if (this.score >= this.targetScore) this.winGame(); else this.resetRing();
  }

  private handleMiss(x?: number, y?: number) {
    this.score = Math.max(0, this.score - 5); this.combo = 0; this.currentQuality = Math.max(0, this.currentQuality - 5);
    this.cameras.main.shake(100, 0.01); this.showFeedback('MISS', 0xef4444, 1.2, x ?? this.hitX, y ?? this.hitY);
    this.updateProgressBar(); this.resetRing();
  }

  update(time: number, delta: number) {
    if (this.isFinished) return;
    if (this.isPlaying) this.handleRingLogic(delta);
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
    const stage = Math.min(5, Math.floor(progress * 6)); this.setBilletStage(stage);
    if (this.ambientGlow) this.ambientGlow.setAlpha(ratio * 0.4);
    if (this.temperature <= 0) this.currentTempStage = 'COLD';
    else if (this.temperature > 75) this.currentTempStage = 'AURA';
    else if (this.temperature > 40) this.currentTempStage = 'HOT';
    else if (this.temperature > 15) this.currentTempStage = 'WARM';
    else this.currentTempStage = 'NORMAL';
  }

  private setBilletStage(stage: number) {
    const key = `blade_stage_${stage}`; if (stage === 0) { if (this.billetImage) this.billetImage.setTexture('billet_stage_0'); return; }
    if (!this.textures.exists(key)) return;
    if (!this.billetImage) { this.billetImage = this.add.image(0, 0, key).setOrigin(0.5); this.billetContainer.add(this.billetImage); this.placeBilletOnAnvil(); return; }
    if (this.billetImage.texture.key !== key) {
      this.billetImage.setTexture(key); this.placeBilletOnAnvil();
      const sx = this.billetContainer.scaleX; const sy = this.billetContainer.scaleY;
      this.tweens.add({ targets: this.billetContainer, scaleX: sx * 1.08, scaleY: sy * 1.08, duration: 100, yoyo: true, });
    }
  }

  private handleRingLogic(delta: number) {
    this.ringTimer += delta * this.currentSpeedMult; 
    const t = Math.min(this.ringTimer / this.shrinkDuration, 1.5); 
    this.currentRadius = this.startRadius * (1 - t * t);

    // Color interpolation: Start at White (0xffffff), target Current Type Color
    const colorT = Math.min(this.ringTimer / this.shrinkDuration, 1.0);
    const targetRGB = Phaser.Display.Color.IntegerToColor(this.currentTargetColor);
    
    const r = Math.floor(255 + (targetRGB.red - 255) * colorT);
    const g = Math.floor(255 + (targetRGB.green - 255) * colorT);
    const b = Math.floor(255 + (targetRGB.blue - 255) * colorT);
    const ringColor = Phaser.Display.Color.GetColor(r, g, b);

    // Increased alpha values for better visibility
    const ringAlpha = 0.6 + (colorT * 0.3);

    this.approachRing.clear()
      .lineStyle(6, ringColor, ringAlpha)
      .strokeCircle(this.hitX, this.hitY, Math.max(0, this.currentRadius));

    if (this.currentRadius < this.targetRadius - 25) { this.combo = 0; this.resetRing(); }
  }

  private resetRing() {
    if (this.temperature <= 0) return; this.targetRing.clear(); this.approachRing.clear(); this.currentRadius = this.startRadius; this.ringTimer = 0;
    
    // Select speed and color type
    const randType = Math.random();
    if (randType < 0.2) { // SLOW
      this.currentTargetColor = 0x10b981; // Green
      this.currentSpeedMult = 0.75;
    } else if (randType < 0.75) { // NORMAL
      this.currentTargetColor = 0xfabf24; // Amber
      this.currentSpeedMult = 1.0;
    } else { // FAST
      this.currentTargetColor = 0xef4444; // Red
      this.currentSpeedMult = 1.45;
    }

    // Randomized target size: 18% to 32% of start radius
    this.targetRadius = this.startRadius * Phaser.Math.FloatBetween(0.18, 0.32);

    const w = this.hammerHitArea.width; const h = this.hammerHitArea.height;
    const u = Phaser.Math.Between(-w * 0.35, w * 0.35); const v = Phaser.Math.Between(-h * 0.25, h * 0.25);
    const rad = Phaser.Math.DegToRad(this.hammerHitArea.angle);
    this.hitX = this.hammerHitArea.x + (u * Math.cos(rad) - v * Math.sin(rad));
    this.hitY = this.hammerHitArea.y + (u * Math.sin(rad) + v * Math.cos(rad));
    
    if (this.isPlaying) { 
      this.targetRing.clear()
        .fillStyle(this.currentTargetColor, 0.2)
        .fillCircle(this.hitX, this.hitY, this.targetRadius)
        .lineStyle(4, this.currentTargetColor, 0.7)
        .strokeCircle(this.hitX, this.hitY, this.targetRadius); 
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
    // Removed isPumping check to allow immediate re-triggering for better responsiveness
    this.isPumping = true; 
    this.bellowsSprite.play('bellows_pump', true); // Force animation restart
    if (this.temperature > 0) { 
        this.temperature = Math.min(100, this.temperature + 5); 
        if (!this.isPlaying && !this.isReadyToStart) { 
            this.isReadyToStart = true; 
            this.infoText.setText('TOUCH TO START').setColor('#fbbf24'); 
        } 
    }
  }

  private requestHeatUp() { if (this.charcoalCount > 0 && this.onHeatUpRequest) { this.tweens.add({ targets: this.heatUpBtnContainer, scale: 0.9, duration: 50, yoyo: true }); this.onHeatUpRequest(); } else { this.cameras.main.shake(100, 0.005); } }

  public heatUp() { this.temperature = Math.min(100, this.temperature + 40); if (!this.isPlaying) { this.isReadyToStart = true; this.infoText.setText('TOUCH TO START').setColor('#fbbf24'); } this.flashOverlay.setFillStyle(0xff8800, 1).setAlpha(0.4); this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 400, ease: 'Cubic.easeOut' }); }
  public updateCharcoalCount(count: number) { this.charcoalCount = count; this.refreshHeatUpButton(); }
  private refreshHeatUpButton() { const bg = this.heatUpBtnContainer.getByName('btnBg') as Phaser.GameObjects.Arc; const countTxt = this.heatUpBtnContainer.getByName('countTxt') as Phaser.GameObjects.Text; if (countTxt) countTxt.setText(`x${this.charcoalCount}`); if (bg) bg.setStrokeStyle(3, this.charcoalCount > 0 ? 0xea580c : 0x292524); }
  public getTemperature() { return this.temperature; }
}
