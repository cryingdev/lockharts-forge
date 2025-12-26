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
  // Core Systems
  private backgroundTile!: Phaser.GameObjects.TileSprite;
  private bgOverlay!: Phaser.GameObjects.Rectangle;
  private anvilImage!: Phaser.GameObjects.Image;
  private anvilSurface!: Phaser.GameObjects.Graphics;
  private targetRing!: Phaser.GameObjects.Graphics;
  private approachRing!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private comboText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private ambientGlow!: Phaser.GameObjects.Arc;
  private flashOverlay!: Phaser.GameObjects.Rectangle;

  private bladeContainer!: Phaser.GameObjects.Container;
  private bladeFallbackRect!: Phaser.GameObjects.Rectangle;
  private bladeImage?: Phaser.GameObjects.Image;

  private hammerHitArea!: Phaser.GameObjects.Rectangle;
  private hitPoly!: Phaser.Geom.Polygon;

  // Layout Constants
  private centerX: number = 0;
  private centerY: number = 0;
  private hitX: number = 0;
  private hitY: number = 0;

  private anvilConfig = {
    topWidthRatio: 0.65,
    botWidthRatio: 1.1,
    heightRatio: 0.4,
    yOffset: 60,
    imageOffsetX: 0,
    imageOffsetY: 40,
    hitAreaOffset: 45, 
  };

  // Game State
  private score: number = 0;
  private targetScore: number = 100;
  private combo: number = 0;
  private lastHitTime: number = 0;
  private hitCooldown: number = 200;
  private lastStage: number = -1;
  private isFinished: boolean = false;
  private isPlaying: boolean = false;
  private isReadyToStart: boolean = false;

  // Temperature System
  private temperature: number = 0;
  private coolingRate: number = 2;
  private currentTempStage: 'COLD' | 'AURA' | 'HOT' | 'WARM' | 'NORMAL' = 'COLD';
  private charcoalCount: number = 0;

  // Ring System
  private startRadius: number = 220;
  private targetRadius: number = 55;
  private currentRadius: number = 220;
  private shrinkDuration: number = 2000;
  private ringTimer: number = 0;

  // UI
  private tempBar!: Phaser.GameObjects.Rectangle;
  private tempValueText!: Phaser.GameObjects.Text;
  private bellowsContainer!: Phaser.GameObjects.Container;
  private bellowsSprite!: Phaser.GameObjects.Sprite;
  private heatUpBtnContainer!: Phaser.GameObjects.Container;
  private uiContainer!: Phaser.GameObjects.Container;
  private isPumping: boolean = false;

  // External Callbacks
  private onComplete?: (score: number) => void;
  private onStatusUpdate?: (temp: number) => void;
  private onHeatUpRequest?: () => void;

  constructor() {
    super('SmithingScene');
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
    this.lastStage = -1;
    this.temperature = data.initialTemp || 0;
    this.isFinished = false;
    this.isPlaying = false;
    this.isReadyToStart = this.temperature > 0;
  }

  preload() {
    this.load.crossOrigin = 'anonymous';
    this.load.image('tile_forge', getAssetUrl('tile_forge.png'));
    this.load.image('anvil_img', getAssetUrl('anvil.png'));
    this.load.image('spark_perfect', getAssetUrl('particle_spark1.png'));
    this.load.image('spark_normal', getAssetUrl('particle_spark2.png'));
    this.load.image('blade_stage_0', getAssetUrl('billet_default.png'));
    this.load.image('blade_stage_1', getAssetUrl('billet_blade_01.png'));
    this.load.image('blade_stage_2', getAssetUrl('billet_blade_02.png'));
    this.load.image('blade_stage_3', getAssetUrl('billet_blade_03.png'));
    this.load.image('blade_stage_4', getAssetUrl('billet_blade_04.png'));
    this.load.image('blade_stage_5', getAssetUrl('billet_blade_05.png'));

    this.load.spritesheet('bellows', getAssetUrl('bellows_sprite.png'), {
      frameWidth: 298,
      frameHeight: 188,
    });
  }

  create() {
    if (!this.anims.exists('bellows_pump')) {
      this.anims.create({
        key: 'bellows_pump',
        frames: [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ key: 'bellows', frame: i })),
        frameRate: 18,
        repeat: 0,
      });
    }

    this.centerX = this.scale.width / 2;
    this.centerY = this.scale.height / 2;

    this.backgroundTile = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'tile_forge').setOrigin(0).setDepth(-2).setAlpha(0.7);
    this.bgOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.4).setOrigin(0).setDepth(-1);

    this.anvilImage = this.add.image(0, 0, 'anvil_img').setDepth(1).setOrigin(0.5, 0.5);
    this.anvilSurface = this.add.graphics().setDepth(2);

    this.bladeContainer = this.add.container(0, 0).setDepth(3).setAngle(-12);
    this.bladeFallbackRect = this.add.rectangle(0, 0, 600, 120, 0x57534e).setOrigin(0.5, 0.5);
    this.bladeContainer.add(this.bladeFallbackRect);

    if (this.textures.exists('blade_stage_0')) {
      this.bladeImage = this.add.image(0, 0, 'blade_stage_0').setOrigin(0.5);
      this.bladeContainer.add(this.bladeImage);
    }

    this.hammerHitArea = this.add.rectangle(0, 0, 500, 120, 0x00ff00).setDepth(3).setAlpha(0).setAngle(-12);
    this.targetRing = this.add.graphics().setDepth(5);
    this.approachRing = this.add.graphics().setDepth(5);

    this.uiContainer = this.add.container(0, 0).setDepth(20);
    this.setupUI();

    this.ambientGlow = this.add.circle(0, 0, 500, 0xea580c, 0).setFillStyle(0xea580c, 0.25).setDepth(0);
    this.flashOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffaa00, 0).setOrigin(0).setDepth(100);

    this.handleResize();

    this.input.keyboard?.on('keydown-SPACE', () => this.handleInput(), this);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, objs: any[]) => {
      if (objs.includes(this.bellowsContainer) || this.bellowsContainer.list.some(c => objs.includes(c))) {
        this.pumpBellows();
        return;
      }
      if (objs.includes(this.heatUpBtnContainer) || this.heatUpBtnContainer.list.some(c => objs.includes(c))) {
        this.requestHeatUp();
        return;
      }

      if (!this.isPlaying) {
        this.handleInput(pointer);
        return;
      }
      const px = pointer.worldX;
      const py = pointer.worldY;
      if (!this.isPointerInHitArea(px, py)) {
        this.handleOffMetalMiss();
        return;
      }
      const dist = Phaser.Math.Distance.Between(px, py, this.hitX, this.hitY);
      if (dist > this.currentRadius + 4) {
        this.handleSpatialMiss();
        return;
      }
      this.handleInput(pointer);
    }, this);

    this.scale.on('resize', this.handleResize, this);
  }

  private setupUI() {
    this.progressBar = this.add.rectangle(0, 40, 0, 12, 0xeab308).setOrigin(0, 0.5);
    this.uiContainer.add([
      this.add.rectangle(0, 40, 300, 16, 0x000000, 0.5).setStrokeStyle(2, 0x57534e).setName('progBg'),
      this.progressBar,
    ]);

    this.tempBar = this.add.rectangle(0, 0, 18, 250, 0x3b82f6).setOrigin(0.5, 1).setScale(1, 0);
    this.tempValueText = this.add.text(0, 0, '20°C', { fontFamily: 'monospace', fontSize: '18px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.uiContainer.add([
      this.add.rectangle(0, 0, 32, 260, 0x1c1917).setStrokeStyle(3, 0x57534e).setName('tempFrame'),
      this.add.rectangle(0, 0, 24, 250, 0x0c0a09).setName('tempBg'),
      this.tempBar,
      this.tempValueText,
    ]);

    this.createBellows();
    this.createHeatUpButton();

    this.comboText = this.add.text(0, 0, '', { fontFamily: 'Impact', fontSize: '48px', color: '#fcd34d', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setAlpha(0);
    this.infoText = this.add.text(0, 0, this.isReadyToStart ? 'CLICK TO START' : 'FORGE IS COLD\nADD FUEL TO HEAT', { fontFamily: 'monospace', fontSize: '28px', color: this.isReadyToStart ? '#fbbf24' : '#3b82f6', align: 'center', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
    this.uiContainer.add([this.comboText, this.infoText]);
    this.tweens.add({ targets: this.infoText, alpha: 0.5, yoyo: true, repeat: -1, duration: 800 });
  }

  private createBellows() {
    this.bellowsContainer = this.add.container(0, 0);
    this.bellowsSprite = this.add.sprite(0, 0, 'bellows').setScale(0.35);
    const txt = this.add.text(0, 25, 'PUMP', { fontSize: '10px', color: '#fde68a', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5);
    this.bellowsContainer.add([this.bellowsSprite, txt]);
    this.bellowsContainer.setInteractive(new Phaser.Geom.Rectangle(-60, -45, 120, 90), Phaser.Geom.Rectangle.Contains);
    this.bellowsSprite.on('animationcomplete-bellows_pump', () => { this.isPumping = false; });
    this.uiContainer.add(this.bellowsContainer);
  }

  private createHeatUpButton() {
    this.heatUpBtnContainer = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, 90, 70, 0x1c1917).setStrokeStyle(2, 0x57534e).setName('btnBg');
    const icon = this.add.text(0, -12, '🔥', { fontSize: '20px' }).setOrigin(0.5).setName('btnIcon');
    const label = this.add.text(0, 10, 'HEAT UP', { fontSize: '10px', color: '#fbbf24', fontStyle: 'bold', fontFamily: 'monospace' }).setOrigin(0.5);
    const countTxt = this.add.text(0, 22, `x${this.charcoalCount}`, { fontSize: '11px', color: '#78716c', fontFamily: 'monospace' }).setOrigin(0.5).setName('countTxt');
    this.heatUpBtnContainer.add([bg, icon, label, countTxt]);
    this.heatUpBtnContainer.setInteractive(new Phaser.Geom.Rectangle(-45, -35, 90, 70), Phaser.Geom.Rectangle.Contains);
    this.uiContainer.add(this.heatUpBtnContainer);
    this.refreshHeatUpButton();
  }

  private refreshHeatUpButton() {
    if (!this.heatUpBtnContainer) return;
    const bg = this.heatUpBtnContainer.getByName('btnBg') as Phaser.GameObjects.Rectangle;
    const countTxt = this.heatUpBtnContainer.getByName('countTxt') as Phaser.GameObjects.Text;
    const icon = this.heatUpBtnContainer.getByName('btnIcon') as Phaser.GameObjects.Text;
    countTxt.setText(`x${this.charcoalCount}`);
    if (this.charcoalCount > 0) {
      bg.setStrokeStyle(2, 0xea580c);
      countTxt.setColor('#a8a29e');
      icon.setAlpha(1);
    } else {
      bg.setStrokeStyle(2, 0x292524);
      countTxt.setColor('#44403c');
      icon.setAlpha(0.3);
    }
  }

  public updateCharcoalCount(count: number) {
    this.charcoalCount = count;
    this.refreshHeatUpButton();
  }

  private pumpBellows() {
    if (this.isPumping) return;
    this.isPumping = true;
    this.bellowsSprite.play('bellows_pump');

    // ONLY increase temperature if there is already heat/ignition (> 0)
    if (this.temperature > 0) {
      this.temperature = Math.min(100, this.temperature + 5);
      if (!this.isPlaying && !this.isReadyToStart) {
        this.isReadyToStart = true;
        this.infoText.setText('CLICK TO START').setColor('#fbbf24');
      }
    }
  }

  private requestHeatUp() {
    if (this.charcoalCount > 0) {
      this.tweens.add({ targets: this.heatUpBtnContainer, scale: 0.9, duration: 50, yoyo: true });
      if (this.onHeatUpRequest) this.onHeatUpRequest();
    } else {
      this.cameras.main.shake(100, 0.005);
    }
  }

  public heatUp() {
    this.temperature = Math.min(100, this.temperature + 40);
    if (!this.isPlaying) {
      this.isReadyToStart = true;
      this.infoText.setText('CLICK TO START').setColor('#fbbf24');
    }
    this.flashOverlay.setFillStyle(0xff8800, 1).setAlpha(0.4);
    this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 400, ease: 'Cubic.easeOut' });
  }

  private handleResize() {
    this.centerX = this.scale.width / 2;
    this.centerY = this.scale.height / 2;
    if (this.backgroundTile) this.backgroundTile.setSize(this.scale.width, this.scale.height);
    if (this.bgOverlay) this.bgOverlay.setSize(this.scale.width, this.scale.height);
    if (this.flashOverlay) this.flashOverlay.setSize(this.scale.width, this.scale.height);

    const surfaceH = this.scale.height * this.anvilConfig.heightRatio;
    const b = this.centerY + surfaceH / 2 + this.anvilConfig.yOffset;
    
    if (this.anvilImage && this.anvilImage.texture.key !== '__MISSING') {
      const targetWidth = this.scale.width * 1.3;
      this.anvilImage.setScale(targetWidth / this.anvilImage.width);
      this.anvilImage.setPosition(this.centerX, b + this.anvilConfig.imageOffsetY);
    }

    // Centering the ambient glow on the anvil area
    if (this.ambientGlow) {
      this.ambientGlow.setPosition(this.centerX, b);
    }

    const bladeY = b - surfaceH * 0.55; 
    this.bladeContainer.setPosition(this.centerX, bladeY);
    const rad = Phaser.Math.DegToRad(this.bladeContainer.angle);
    this.bladeContainer.x += Math.cos(rad) * 80;
    this.bladeContainer.y += Math.sin(rad) * 80;

    const ox = -Math.sin(rad) * this.anvilConfig.hitAreaOffset;
    const oy = Math.cos(rad) * this.anvilConfig.hitAreaOffset;
    this.hammerHitArea.setPosition(this.bladeContainer.x + ox, this.bladeContainer.y + oy);
    this.rebuildHitPoly();

    this.repositionUIElements();
  }

  private repositionUIElements() {
    const w = this.scale.width;
    (this.uiContainer.getByName('progBg') as any).setPosition(this.centerX, 40);
    this.progressBar.setPosition(this.centerX - 150, 40);
    const stackX = w - 70;
    const stackTopY = this.centerY - 100;
    this.tempValueText.setPosition(stackX, stackTopY - 165);
    (this.uiContainer.getByName('tempFrame') as any).setPosition(stackX, stackTopY);
    (this.uiContainer.getByName('tempBg') as any).setPosition(stackX, stackTopY);
    this.tempBar.setPosition(stackX, stackTopY + 125);
    this.bellowsContainer.setPosition(stackX, stackTopY + 205);
    this.heatUpBtnContainer.setPosition(stackX, stackTopY + 300);
    this.infoText.setPosition(this.centerX, this.centerY - 220);
    this.comboText.setPosition(this.centerX, this.centerY - 300);
  }

  private rebuildHitPoly() {
    const w = this.hammerHitArea.width * this.hammerHitArea.scaleX;
    const h = this.hammerHitArea.height * this.hammerHitArea.scaleY;
    const cx = this.hammerHitArea.x;
    const cy = this.hammerHitArea.y;
    const rad = Phaser.Math.DegToRad(this.hammerHitArea.angle);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const corners = [
      { x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 },
      { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 },
    ].map((p) => ({ x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos }));
    this.hitPoly = new Phaser.Geom.Polygon(corners);
  }

  private isPointerInHitArea(px: number, py: number) {
    return this.hitPoly && Phaser.Geom.Polygon.Contains(this.hitPoly, px, py);
  }

  private handleInput(pointer?: Phaser.Input.Pointer) {
    if (this.isFinished) return;
    if (!this.isPlaying) {
      if (this.isReadyToStart) { 
        this.isPlaying = true; 
        this.infoText.setVisible(false); 
        this.resetRing(); 
        this.flashOverlay.setFillStyle(0xffffff, 1).setAlpha(0.2);
        this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 300 });
      } else { this.cameras.main.shake(50, 0.005); this.showFeedback('TOO COLD!', 0x3b82f6, 1.0); }
      return;
    }
    if (this.time.now - this.lastHitTime < this.hitCooldown) return;
    this.lastHitTime = this.time.now;
    const swingX = pointer ? pointer.worldX : this.hitX;
    const swingY = pointer ? pointer.worldY : this.hitY;
    if (this.currentTempStage === 'COLD' || this.currentTempStage === 'NORMAL') { this.showFeedback('TOO COLD!', 0x3b82f6, 1.0); return; }
    
    const diff = Math.abs(this.currentRadius - this.targetRadius);
    const eff = this.currentTempStage === 'AURA' ? 1.5 : this.currentTempStage === 'HOT' ? 1.0 : 0.5;
    
    if (diff < 18) {
      this.score += Math.ceil(8 * eff); this.combo++; this.createSparks(40, 0xffaa00, 2.0, 'spark_perfect', swingX, swingY); this.showFeedback('PERFECT!', 0xffb300, 1.5, swingX, swingY); this.cameras.main.shake(200, 0.025);
    } else if (diff < 55) {
      this.score += Math.ceil(5 * eff); this.combo = 0; this.createSparks(20, 0xffffff, 1.3, 'spark_normal', swingX, swingY); this.showFeedback('GOOD', 0xe5e5e5, 1.0, swingX, swingY);
    } else {
      this.score = Math.max(0, this.score - 5); this.combo = 0; this.showFeedback('MISS', 0xef4444, 1.2, swingX, swingY); this.cameras.main.shake(120, 0.012);
    }
    this.updateProgressBar();
    if (this.score >= this.targetScore) this.winGame(); else this.resetRing();
  }

  private handleOffMetalMiss() {
    this.score = Math.max(0, this.score - 5); this.combo = 0; this.cameras.main.shake(100, 0.015);
    this.showFeedback('OFF METAL!', 0xffffff, 1.2); this.updateProgressBar(); this.resetRing();
  }

  private handleSpatialMiss() {
    this.score = Math.max(0, this.score - 5); this.combo = 0; this.cameras.main.shake(120, 0.012);
    this.showFeedback('MISS', 0xef4444, 1.2); this.updateProgressBar(); this.resetRing();
  }

  update(time: number, delta: number) {
    if (this.isFinished) return;
    if (this.isPlaying) this.handleRingLogic(delta);
    this.temperature = Math.max(0, this.temperature - this.coolingRate * (delta / 1000));
    this.refreshVisuals();
    if (!this.isPlaying && this.isReadyToStart && this.temperature <= 0) {
      this.isReadyToStart = false;
      this.infoText.setText('FORGE IS COLD\nADD FUEL TO HEAT').setColor('#3b82f6');
    }
  }

  private refreshVisuals() {
    const ratio = this.temperature / 100;
    this.tempBar.scaleY = ratio;
    this.tempValueText.setText(`${Math.floor(20 + ratio * 1480)}°C`);
    const current = Phaser.Display.Color.Interpolate.ColorWithColor(new Phaser.Display.Color(63, 63, 70), new Phaser.Display.Color(253, 230, 138), 100, ratio * 100);
    const color = Phaser.Display.Color.GetColor(current.r, current.g, current.b);
    this.bladeFallbackRect.setFillStyle(color, 1);
    if (this.bladeImage) this.bladeImage.setTint(color);
    const progress = Phaser.Math.Clamp(this.score / this.targetScore, 0, 1);
    const stage = Math.min(5, Math.floor(progress * 6));
    if (stage !== this.lastStage) { this.setBladeStage(stage); this.lastStage = stage; }
    if (this.ambientGlow) this.ambientGlow.setAlpha(ratio * 0.4);
    if (this.temperature <= 0) this.currentTempStage = 'COLD';
    else if (this.temperature > 75) this.currentTempStage = 'AURA';
    else if (this.temperature > 40) this.currentTempStage = 'HOT';
    else if (this.temperature > 15) this.currentTempStage = 'WARM';
    else this.currentTempStage = 'NORMAL';
  }

  private setBladeStage(stage: number) {
    const key = `blade_stage_${stage}`;
    if (this.textures.exists(key)) {
      if (!this.bladeImage) { this.bladeImage = this.add.image(0, 0, key).setOrigin(0.5); this.bladeContainer.add(this.bladeImage); } 
      else this.bladeImage.setTexture(key);
      this.bladeImage.setVisible(true);
      this.bladeFallbackRect.setVisible(true).setAlpha(0.15);
      if (this.lastStage !== -1) {
          this.createOmniBurst(70, 0xffcc00, 2.5, 'spark_perfect', this.bladeContainer.x, this.bladeContainer.y);
          this.flashOverlay.setFillStyle(0xffcc00, 1).setAlpha(0.35);
          this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 250, ease: 'Quad.easeOut' });
          this.tweens.add({ targets: this.bladeContainer, scale: 1.15, duration: 100, yoyo: true, ease: 'Quad.easeOut' });
      }
    }
  }

  private handleRingLogic(delta: number) {
    this.ringTimer += delta;
    const t = Math.min(this.ringTimer / this.shrinkDuration, 1.5);
    this.currentRadius = this.startRadius * (1 - t * t);
    const ringColor = this.currentRadius < this.targetRadius ? 0xffffff : 0xfabf24;
    this.approachRing.clear().lineStyle(8, ringColor, 0.6).strokeCircle(this.hitX, this.hitY, Math.max(0, this.currentRadius));
    if (this.currentRadius < this.targetRadius - 30) { this.combo = 0; this.resetRing(); }
  }

  private resetRing() {
    if (this.temperature <= 0) {
      this.isPlaying = false; this.isReadyToStart = false;
      this.targetRing.clear(); this.approachRing.clear();
      this.infoText.setVisible(true).setText('FORGE IS COLD\nADD FUEL TO HEAT').setColor('#3b82f6');
      return;
    }
    this.currentRadius = this.startRadius; this.ringTimer = 0;
    const w = this.hammerHitArea.width * this.hammerHitArea.scaleX;
    const h = this.hammerHitArea.height * this.hammerHitArea.scaleY;
    const u = Phaser.Math.Between(-w * 0.35, w * 0.35);
    const v = Phaser.Math.Between(-h * 0.25, h * 0.25);
    const rad = Phaser.Math.DegToRad(this.hammerHitArea.angle);
    this.hitX = this.hammerHitArea.x + (u * Math.cos(rad) - v * Math.sin(rad));
    this.hitY = this.hammerHitArea.y + (u * Math.sin(rad) + v * Math.cos(rad));
    if (this.isPlaying) {
      this.targetRing.clear().fillStyle(0xfabf24, 0.1).fillCircle(this.hitX, this.hitY, this.targetRadius).lineStyle(5, 0xfabf24, 0.4).strokeCircle(this.hitX, this.hitY, this.targetRadius);
    }
  }

  private updateProgressBar() { this.progressBar.width = Phaser.Math.Clamp((this.score / this.targetScore) * 300, 0, 300); }

  private createSparks(count: number, color: number, scale: number, key: string, x: number, y: number) {
    const emitter = this.add.particles(x, y, this.textures.exists(key) ? key : 'white', { lifespan: 800, speed: { min: 300 * scale, max: 700 * scale }, angle: { min: 230, max: 310 }, scale: { start: 0.7, end: 0 }, gravityY: 1200, blendMode: 'ADD', tint: color });
    emitter.explode(count);
  }

  private createOmniBurst(count: number, color: number, scale: number, key: string, x: number, y: number) {
    const emitter = this.add.particles(x, y, this.textures.exists(key) ? key : 'white', { lifespan: 1200, speed: { min: 200 * scale, max: 500 * scale }, angle: { min: 0, max: 360 }, scale: { start: 0.8, end: 0 }, gravityY: 400, blendMode: 'ADD', tint: color });
    emitter.explode(count);
  }

  private showFeedback(text: string, color: number, scale: number, x?: number, y?: number) {
    const fx = x ?? this.hitX; const fy = y ?? this.hitY;
    const fb = this.add.text(fx, fy - 140, text, { fontFamily: 'Arial', fontSize: '36px', fontStyle: 'bold', color: '#' + color.toString(16).padStart(6, '0'), stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setScale(0.5).setAlpha(0).setDepth(25);
    this.tweens.add({ targets: fb, y: fy - 200, alpha: 1, scale: scale, duration: 250, hold: 400, yoyo: true, onComplete: () => fb.destroy() });
    if (this.combo > 1) { this.comboText.setText(`${this.combo} COMBO!`).setAlpha(1); this.tweens.add({ targets: this.comboText, scale: { from: 1.5, to: 1 }, duration: 200, alpha: { from: 1, to: 0 }, delay: 500 }); }
  }

  private winGame() {
    this.isFinished = true; this.isPlaying = false; this.targetRing.clear(); this.approachRing.clear();
    if (this.onStatusUpdate) this.onStatusUpdate(this.temperature);
    const bg = this.add.rectangle(this.centerX, this.centerY, this.scale.width, this.scale.height, 0x000000).setAlpha(0).setDepth(100);
    this.tweens.add({ targets: bg, alpha: 0.85, duration: 500 });
    const txt = this.add.text(this.centerX, this.centerY, 'BLADE FORGED!', { fontFamily: 'Georgia', fontSize: '72px', color: '#fbbf24', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setAlpha(0).setDepth(101);
    this.tweens.add({ targets: txt, alpha: 1, scale: { from: 0.5, to: 1.2 }, duration: 600, ease: 'Back.out', onComplete: () => { this.time.delayedCall(1000, () => { if (this.onComplete) this.onComplete(100); }); } });
  }

  public getTemperature() { return this.temperature; }
}
