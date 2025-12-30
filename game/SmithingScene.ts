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
  private backgroundTile!: Phaser.GameObjects.TileSprite;
  private bgOverlay!: Phaser.GameObjects.Rectangle;
  private anvilImage!: Phaser.GameObjects.Image;
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

  private centerX: number = 0;
  private centerY: number = 0;
  private hitX: number = 0;
  private hitY: number = 0;

  private anvilConfig = {
    heightRatio: 0.4,
    yOffset: 20,
    imageOffsetY: 20,
    hitAreaOffset: 45, 
  };

  private score: number = 0;
  private targetScore: number = 100;
  private combo: number = 0;
  private lastHitTime: number = 0;
  private hitCooldown: number = 200;
  private lastStage: number = -1;
  private isFinished: boolean = false;
  private isPlaying: boolean = false;
  private isReadyToStart: boolean = false;
  private currentQuality: number = 100;
  private perfectCount: number = 0;
  private qualityText!: Phaser.GameObjects.Text;
  private temperature: number = 0;
  private coolingRate: number = 2;
  private currentTempStage: 'COLD' | 'AURA' | 'HOT' | 'WARM' | 'NORMAL' = 'COLD';
  private charcoalCount: number = 0;
  
  private startRadius: number = 180;
  private targetRadius: number = 45;
  private currentRadius: number = 180;
  private shrinkDuration: number = 2000;
  private ringTimer: number = 0;
  
  private tempBar!: Phaser.GameObjects.Rectangle;
  private tempValueText!: Phaser.GameObjects.Text;
  private bellowsContainer!: Phaser.GameObjects.Container;
  private bellowsSprite!: Phaser.GameObjects.Sprite;
  private heatUpBtnContainer!: Phaser.GameObjects.Container;
  private uiContainer!: Phaser.GameObjects.Container;
  private isPumping: boolean = false;
  
  private onComplete?: (score: number) => void;
  private onStatusUpdate?: (temp: number) => void;
  private onHeatUpRequest?: () => void;

  constructor() {
    super('SmithingScene');
  }

  public getQualityLabel(q: number): string {
    if (q >= 110) return "MASTERWORK";
    if (q >= 100) return "PRISTINE";
    if (q >= 90) return "SUPERIOR";
    if (q >= 80) return "FINE";
    if (q >= 70) return "STANDARD";
    if (q >= 60) return "RUSTIC";
    return "CRUDE";
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
    this.lastStage = -1;
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
    this.load.image('blade_stage_0', getAssetUrl('billet_default.png'));
    this.load.image('blade_stage_1', getAssetUrl('billet_blade_01.png'));
    this.load.image('blade_stage_2', getAssetUrl('billet_blade_02.png'));
    this.load.image('blade_stage_3', getAssetUrl('billet_blade_03.png'));
    this.load.image('blade_stage_4', getAssetUrl('billet_blade_04.png'));
    this.load.image('blade_stage_5', getAssetUrl('billet_blade_05.png'));
    this.load.spritesheet('bellows', getAssetUrl('bellows_sprite.png'), { frameWidth: 298, frameHeight: 188 });
  }

  create() {
    if (this.scale.width <= 0 || this.scale.height <= 0) return;

    if (!this.anims.exists('bellows_pump')) {
      this.anims.create({
        key: 'bellows_pump',
        frames: [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ key: 'bellows', frame: i })),
        frameRate: 18,
        repeat: 0,
      });
    }

    this.backgroundTile = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'tile_forge').setOrigin(0).setDepth(-2).setAlpha(0.7);
    this.bgOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.4).setOrigin(0).setDepth(-1);
    this.anvilImage = this.add.image(0, 0, 'anvil_img').setDepth(1).setOrigin(0.5, 0.5);
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
    this.ambientGlow = this.add.circle(0, 0, 500, 0xea580c, 0).setFillStyle(0xea580c, 0.25).setDepth(0);
    this.flashOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffaa00, 0).setOrigin(0).setDepth(100);

    this.setupUI();
    this.handleResize();
    this.scale.on('resize', this.handleResize, this);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, objs: any[]) => {
      if (this.isBellowsClick(objs)) { this.pumpBellows(); return; }
      if (this.isHeatUpClick(objs)) { this.requestHeatUp(); return; }
      if (!this.isPlaying) { this.handleInput(pointer); return; }
      
      if (this.isPointerInHitArea(pointer.worldX, pointer.worldY) || Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.hitX, this.hitY) < this.startRadius * 0.8) {
          this.handleInput(pointer);
      } else {
          this.handleMiss(pointer.worldX, pointer.worldY);
      }
    }, this);
  }

  private isBellowsClick(objs: any[]) { return objs.includes(this.bellowsContainer) || this.bellowsContainer.list.some(c => objs.includes(c)); }
  private isHeatUpClick(objs: any[]) { return objs.includes(this.heatUpBtnContainer) || this.heatUpBtnContainer.list.some(c => objs.includes(c)); }

  private setupUI() {
    this.progressBar = this.add.rectangle(0, 25, 0.1, 14, 0xeab308).setOrigin(0, 0.5);
    const progBg = this.add.rectangle(0, 25, 250, 18, 0x000000, 0.5).setStrokeStyle(2, 0x57534e).setName('progBg').setOrigin(0, 0.5);
    this.qualityText = this.add.text(0, 55, 'PRISTINE', { fontFamily: 'monospace', fontSize: '16px', color: '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5);
    this.uiContainer.add([progBg, this.progressBar, this.qualityText]);

    this.tempBar = this.add.rectangle(0, 0, 16, 200, 0x3b82f6).setOrigin(0.5, 1).setScale(1, 0);
    this.tempValueText = this.add.text(0, 0, '20°C', { fontFamily: 'monospace', fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.uiContainer.add([
      this.add.rectangle(0, 0, 28, 210, 0x1c1917).setStrokeStyle(3, 0x57534e).setName('tempFrame'),
      this.add.rectangle(0, 0, 22, 200, 0x0c0a09).setName('tempBg'),
      this.tempBar,
      this.tempValueText
    ]);

    this.bellowsContainer = this.add.container(0, 0);
    this.bellowsSprite = this.add.sprite(0, 0, 'bellows').setScale(0.3);
    const pumpTxt = this.add.text(0, 22, 'PUMP', { fontSize: '10px', color: '#fde68a', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5);
    this.bellowsContainer.add([this.bellowsSprite, pumpTxt]).setInteractive(new Phaser.Geom.Rectangle(-50, -40, 100, 80), Phaser.Geom.Rectangle.Contains);
    this.bellowsSprite.on('animationcomplete-bellows_pump', () => { this.isPumping = false; });

    this.heatUpBtnContainer = this.add.container(0, 0);
    const btnBg = this.add.rectangle(0, 0, 80, 60, 0x1c1917).setStrokeStyle(3, 0x57534e).setName('btnBg');
    const btnIcon = this.add.text(0, -10, '🔥', { fontSize: '18px' }).setOrigin(0.5).setName('btnIcon');
    const btnLabel = this.add.text(0, 10, 'HEAT UP', { fontSize: '10px', color: '#fbbf24', fontStyle: 'bold', fontFamily: 'monospace' }).setOrigin(0.5);
    const countTxt = this.add.text(0, 22, `x${this.charcoalCount}`, { fontSize: '12px', color: '#78716c', fontFamily: 'monospace' }).setOrigin(0.5).setName('countTxt');
    this.heatUpBtnContainer.add([btnBg, btnIcon, btnLabel, countTxt]).setInteractive(new Phaser.Geom.Rectangle(-40, -30, 80, 60), Phaser.Geom.Rectangle.Contains);
    this.uiContainer.add([this.bellowsContainer, this.heatUpBtnContainer]);

    this.comboText = this.add.text(0, 0, '', { fontFamily: 'Impact', fontSize: '36px', color: '#fcd34d', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setAlpha(0).setDepth(26);
    this.infoText = this.add.text(0, 0, this.isReadyToStart ? 'TOUCH TO START' : 'FORGE IS COLD\nADD FUEL', { fontFamily: 'monospace', fontSize: '24px', color: this.isReadyToStart ? '#fbbf24' : '#3b82f6', align: 'center', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
    this.uiContainer.add([this.comboText, this.infoText]);
    this.tweens.add({ targets: this.infoText, alpha: 0.5, yoyo: true, repeat: -1, duration: 800 });
  }

  private handleResize() {
    this.centerX = this.scale.width / 2;
    this.centerY = this.scale.height / 2;
    const w = this.scale.width;
    const h = this.scale.height;
    const isCompact = h < 450;

    if (this.backgroundTile) this.backgroundTile.setSize(w, h);
    if (this.bgOverlay) this.bgOverlay.setSize(w, h);
    if (this.flashOverlay) this.flashOverlay.setSize(w, h);

    const anvilY = this.centerY + (isCompact ? 20 : this.anvilConfig.yOffset);
    this.startRadius = Phaser.Math.Clamp(h * 0.35, 120, 240);
    this.targetRadius = this.startRadius * 0.25;

    if (this.anvilImage) {
      const targetWidth = w * (isCompact ? 1.2 : 1.4);
      this.anvilImage.setScale(targetWidth / this.anvilImage.width);
      this.anvilImage.setPosition(this.centerX, anvilY + this.anvilConfig.imageOffsetY);
    }
    if (this.ambientGlow) this.ambientGlow.setPosition(this.centerX, anvilY);
    
    const surfaceH = h * this.anvilConfig.heightRatio;
    const bladeY = anvilY - surfaceH * 0.4; 
    this.bladeContainer.setPosition(this.centerX, bladeY);
    const rad = Phaser.Math.DegToRad(this.bladeContainer.angle);
    this.bladeContainer.x += Math.cos(rad) * 60;
    this.bladeContainer.y += Math.sin(rad) * 60;
    
    this.hammerHitArea.setPosition(this.bladeContainer.x - Math.sin(rad) * this.anvilConfig.hitAreaOffset, this.bladeContainer.y + Math.cos(rad) * this.anvilConfig.hitAreaOffset);
    this.rebuildHitPoly();
    this.repositionUIElements(isCompact);
    if (this.isPlaying) this.resetRing(); // 리사이즈 시 판정 링도 재배치
  }

  private repositionUIElements(isCompact: boolean) {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const progBg = this.uiContainer.getByName('progBg') as Phaser.GameObjects.Rectangle;
    const progWidth = Math.min(w * 0.6, 300);
    const progX = this.centerX - progWidth / 2;
    progBg.setPosition(progX, 25).setSize(progWidth, 18);
    this.progressBar.setPosition(progX, 25);
    this.updateProgressBar();
    this.qualityText.setPosition(this.centerX, 55).setFontSize(isCompact ? '14px' : '16px');

    const sideX = w - (isCompact ? 40 : 60);
    // Fixed: centerY was used instead of this.centerY
    const sideY = isCompact ? h * 0.4 : this.centerY - 40;
    const barH = isCompact ? 120 : 200;

    const tFrame = this.uiContainer.getByName('tempFrame') as Phaser.GameObjects.Rectangle;
    const tBg = this.uiContainer.getByName('tempBg') as Phaser.GameObjects.Rectangle;
    tFrame.setPosition(sideX, sideY).setSize(28, barH + 10);
    tBg.setPosition(sideX, sideY).setSize(22, barH);
    this.tempBar.setPosition(sideX, sideY + barH/2).setSize(16, barH);
    this.tempValueText.setPosition(sideX, sideY - barH/2 - 20).setFontSize(isCompact ? '12px' : '14px');

    const ctrlGap = isCompact ? 65 : 85;
    this.bellowsContainer.setPosition(sideX, sideY + barH/2 + 45).setScale(isCompact ? 0.8 : 1);
    this.heatUpBtnContainer.setPosition(sideX, sideY + barH/2 + 45 + ctrlGap).setScale(isCompact ? 0.8 : 1);
    
    this.infoText.setPosition(this.centerX, this.centerY - (isCompact ? 100 : 180)).setFontSize(isCompact ? '18px' : '24px');
  }

  private rebuildHitPoly() {
    const w = this.hammerHitArea.width; const h = this.hammerHitArea.height;
    const cx = this.hammerHitArea.x; const cy = this.hammerHitArea.y;
    const rad = Phaser.Math.DegToRad(this.hammerHitArea.angle);
    const cos = Math.cos(rad); const sin = Math.sin(rad);
    const corners = [{ x: -w/2, y: -h/2 }, { x: w/2, y: -h/2 }, { x: w/2, y: h/2 }, { x: -w/2, y: h/2 }].map((p) => ({ x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos }));
    this.hitPoly = new Phaser.Geom.Polygon(corners);
  }

  private isPointerInHitArea(px: number, py: number) { return this.hitPoly && Phaser.Geom.Polygon.Contains(this.hitPoly, px, py); }

  private handleInput(pointer?: Phaser.Input.Pointer) {
    if (this.isFinished) return;
    if (!this.isPlaying) {
      if (this.isReadyToStart) { this.isPlaying = true; this.infoText.setVisible(false); this.resetRing(); this.flashOverlay.setFillStyle(0xffffff, 1).setAlpha(0.2); this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 300 }); } 
      else { this.cameras.main.shake(50, 0.005); this.showFeedback('TOO COLD!', 0x3b82f6, 1.0, this.centerX, this.centerY); }
      return;
    }
    if (this.time.now - this.lastHitTime < this.hitCooldown) return;
    this.lastHitTime = this.time.now;
    const swingX = pointer ? pointer.worldX : this.hitX;
    const swingY = pointer ? pointer.worldY : this.hitY;
    if (this.currentTempStage === 'COLD' || this.currentTempStage === 'NORMAL') { this.showFeedback('TOO COLD!', 0x3b82f6, 1.0, swingX, swingY); return; }
    
    const diff = Math.abs(this.currentRadius - this.targetRadius);
    const eff = this.currentTempStage === 'AURA' ? 1.5 : this.currentTempStage === 'HOT' ? 1.0 : 0.5;
    if (diff < this.targetRadius * 0.35) {
      this.score += Math.ceil(8 * eff); this.combo++; this.perfectCount++;
      if (this.perfectCount >= 6) { this.currentQuality += 1; this.showFeedback('QUALITY UP!', 0xfbbf24, this.hitX, this.hitY - 60); }
      this.createSparks(30, 0xffaa00, 1.5, 'spark_perfect', swingX, swingY); 
      this.showFeedback('PERFECT!', 0xffb300, 1.4, this.hitX, this.hitY); this.cameras.main.shake(150, 0.02);
    } else if (diff < this.targetRadius * 0.95) {
      this.score += Math.ceil(5 * eff); this.combo = 0; this.currentQuality = Math.max(0, this.currentQuality - 2);
      this.createSparks(15, 0xffffff, 1.1, 'spark_normal', swingX, swingY); this.showFeedback('GOOD', 0xe5e5e5, 1.1, this.hitX, this.hitY);
    } else { this.handleMiss(swingX, swingY); }
    this.updateProgressBar(); if (this.score >= this.targetScore) this.winGame(); else this.resetRing();
  }

  private handleMiss(x?: number, y?: number) {
    this.score = Math.max(0, this.score - 5); this.combo = 0; this.currentQuality = Math.max(0, this.currentQuality - 5);
    this.cameras.main.shake(100, 0.01); this.showFeedback('MISS', 0xef4444, 1.2, x ?? this.hitX, y ?? this.hitY); this.updateProgressBar(); this.resetRing();
  }

  update(time: number, delta: number) {
    if (this.isFinished) return;
    if (this.isPlaying) this.handleRingLogic(delta);
    this.temperature = Math.max(0, this.temperature - this.coolingRate * (delta / 1000));
    this.refreshVisuals();
    if (!this.isPlaying && this.isReadyToStart && this.temperature <= 0) { this.isReadyToStart = false; this.infoText.setText('FORGE IS COLD\nADD FUEL').setColor('#3b82f6'); }
  }

  private refreshVisuals() {
    this.qualityText.setText(this.getQualityLabel(this.currentQuality)).setColor(this.getLabelColor(this.currentQuality));
    const ratio = this.temperature / 100;
    this.tempBar.scaleY = ratio;
    this.tempValueText.setText(`${Math.floor(20 + ratio * 1480)}°C`);

    let barColor = 0xeab308; 
    if (ratio < 0.4) barColor = 0x3b82f6; else if (ratio > 0.7) barColor = 0xef4444;
    this.tempBar.setFillStyle(barColor);

    const stage = Math.min(5, Math.floor(Phaser.Math.Clamp(this.score / this.targetScore, 0, 1) * 6));
    if (stage !== this.lastStage) { this.setBladeStage(stage); this.lastStage = stage; }
    if (this.ambientGlow) this.ambientGlow.setAlpha(ratio * 0.4);
    if (this.temperature <= 0) this.currentTempStage = 'COLD'; else if (this.temperature > 75) this.currentTempStage = 'AURA'; else if (this.temperature > 40) this.currentTempStage = 'HOT'; else if (this.temperature > 15) this.currentTempStage = 'WARM'; else this.currentTempStage = 'NORMAL';
  }

  private setBladeStage(stage: number) {
    const key = `blade_stage_${stage}`;
    if (this.textures.exists(key)) {
      if (!this.bladeImage) { this.bladeImage = this.add.image(0, 0, key).setOrigin(0.5); this.bladeContainer.add(this.bladeImage); } else this.bladeImage.setTexture(key);
      if (this.lastStage !== -1) { this.tweens.add({ targets: this.bladeContainer, scale: 1.1, duration: 100, yoyo: true }); }
    }
  }

  private handleRingLogic(delta: number) {
    this.ringTimer += delta; const t = Math.min(this.ringTimer / this.shrinkDuration, 1.5); this.currentRadius = this.startRadius * (1 - t * t);
    this.approachRing.clear().lineStyle(6, this.currentRadius < this.targetRadius ? 0xffffff : 0xfabf24, 0.5).strokeCircle(this.hitX, this.hitY, Math.max(0, this.currentRadius));
    if (this.currentRadius < this.targetRadius - 25) { this.combo = 0; this.resetRing(); }
  }

  private resetRing() {
    if (this.temperature <= 0) return;
    this.currentRadius = this.startRadius; this.ringTimer = 0;
    const w = this.hammerHitArea.width; const h = this.hammerHitArea.height;
    const u = Phaser.Math.Between(-w * 0.35, w * 0.35); const v = Phaser.Math.Between(-h * 0.25, h * 0.25);
    const rad = Phaser.Math.DegToRad(this.hammerHitArea.angle);
    this.hitX = this.hammerHitArea.x + (u * Math.cos(rad) - v * Math.sin(rad)); this.hitY = this.hammerHitArea.y + (u * Math.sin(rad) + v * Math.cos(rad));
    if (this.isPlaying) this.targetRing.clear().fillStyle(0xfabf24, 0.1).fillCircle(this.hitX, this.hitY, this.targetRadius).lineStyle(4, 0xfabf24, 0.4).strokeCircle(this.hitX, this.hitY, this.targetRadius);
  }

  private updateProgressBar() { 
    const progBg = this.uiContainer.getByName('progBg') as Phaser.GameObjects.Rectangle;
    if (progBg) this.progressBar.width = Math.max(0.1, Phaser.Math.Clamp((this.score / this.targetScore) * progBg.width, 0, progBg.width));
  }

  private createSparks(count: number, color: number, scale: number, key: string, x: number, y: number) {
    const emitter = this.add.particles(x, y, this.textures.exists(key) ? key : 'white', { lifespan: 600, speed: { min: 200 * scale, max: 500 * scale }, angle: { min: 230, max: 310 }, scale: { start: 0.6, end: 0 }, gravityY: 1000, blendMode: 'ADD', tint: color });
    emitter.explode(count);
  }

  private showFeedback(text: string, color: number, scale: number, x: number, y: number) {
    const fb = this.add.text(x, y, text, { fontFamily: 'Arial Black', fontSize: '32px', fontStyle: 'bold', color: '#' + color.toString(16).padStart(6, '0'), stroke: '#000', strokeThickness: 7 }).setOrigin(0.5).setScale(0.5).setAlpha(0).setDepth(25);
    this.tweens.add({ targets: fb, y: y - 40, alpha: 1, scale: scale, duration: 250, hold: 400, yoyo: true, onComplete: () => fb.destroy() });
    if (this.combo > 1) { 
        this.comboText.setPosition(x, y - 75).setText(`${this.combo} COMBO!`).setAlpha(1).setScale(1.2); 
        this.tweens.add({ targets: this.comboText, scale: { from: 1.4, to: 1 }, duration: 200, alpha: { from: 1, to: 0 }, delay: 700 }); 
    }
  }

  private winGame() {
    this.isFinished = true; this.isPlaying = false; this.targetRing.clear(); this.approachRing.clear();
    if (this.onStatusUpdate) this.onStatusUpdate(this.temperature);
    const bg = this.add.rectangle(this.centerX, this.centerY, this.scale.width, this.scale.height, 0x000000).setAlpha(0).setDepth(100);
    this.tweens.add({ targets: bg, alpha: 0.8, duration: 500 });
    const txt = this.add.text(this.centerX, this.centerY, `${this.getQualityLabel(this.currentQuality)} CRAFT!`, { fontFamily: 'Georgia', fontSize: '48px', color: this.getLabelColor(this.currentQuality), stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setAlpha(0).setDepth(101);
    this.tweens.add({ targets: txt, alpha: 1, scale: { from: 0.5, to: 1.1 }, duration: 600, ease: 'Back.out', onComplete: () => { this.time.delayedCall(1000, () => { if (this.onComplete) this.onComplete(this.currentQuality); }); } });
  }

  private pumpBellows() {
    if (this.isPumping) return;
    this.isPumping = true; this.bellowsSprite.play('bellows_pump');
    if (this.temperature > 0) {
      this.temperature = Math.min(100, this.temperature + 5);
      if (!this.isPlaying && !this.isReadyToStart) { this.isReadyToStart = true; this.infoText.setText('TOUCH TO START').setColor('#fbbf24'); }
    }
  }

  private requestHeatUp() {
    if (this.charcoalCount > 0 && this.onHeatUpRequest) {
      this.tweens.add({ targets: this.heatUpBtnContainer, scale: 0.9, duration: 50, yoyo: true });
      this.onHeatUpRequest();
    } else { this.cameras.main.shake(100, 0.005); }
  }

  public heatUp() {
    this.temperature = Math.min(100, this.temperature + 40);
    if (!this.isPlaying) { this.isReadyToStart = true; this.infoText.setText('TOUCH TO START').setColor('#fbbf24'); }
    this.flashOverlay.setFillStyle(0xff8800, 1).setAlpha(0.4);
    this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 400, ease: 'Cubic.easeOut' });
  }

  public updateCharcoalCount(count: number) { this.charcoalCount = count; this.refreshHeatUpButton(); }

  private refreshHeatUpButton() {
    const bg = this.heatUpBtnContainer.getByName('btnBg') as Phaser.GameObjects.Rectangle;
    const countTxt = this.heatUpBtnContainer.getByName('countTxt') as Phaser.GameObjects.Text;
    const icon = this.heatUpBtnContainer.getByName('btnIcon') as Phaser.GameObjects.Text;
    if (countTxt) countTxt.setText(`x${this.charcoalCount}`);
    if (bg) bg.setStrokeStyle(3, this.charcoalCount > 0 ? 0xea580c : 0x292524);
  }

  public getTemperature() { return this.temperature; }
}