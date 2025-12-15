
import Phaser from 'phaser';

export interface SmithingSceneData {
  onComplete: (quality: number) => void;
  difficulty?: number;
}

export default class SmithingScene extends Phaser.Scene {
  // Explicitly declare properties to fix TS errors
  add!: Phaser.GameObjects.GameObjectFactory;
  make!: Phaser.GameObjects.GameObjectCreator;
  scale!: Phaser.Scale.ScaleManager;
  tweens!: Phaser.Tweens.TweenManager;
  time!: Phaser.Time.Clock;
  cameras!: Phaser.Cameras.Scene2D.CameraManager;
  input!: Phaser.Input.InputPlugin;

  private cursor!: Phaser.GameObjects.Rectangle;
  private targetZone!: Phaser.GameObjects.Rectangle;
  private progressBar!: Phaser.GameObjects.Rectangle;
  
  // Game State
  private score: number = 0;
  private targetScore: number = 100;
  private cursorSpeed: number = 0.004;
  private amplitude: number = 140;
  private centerX: number = 0;
  private centerY: number = 0;
  private onComplete?: (quality: number) => void;
  private isHitCooldown: boolean = false;

  constructor() {
    super('SmithingScene');
  }

  init(data: SmithingSceneData) {
    this.onComplete = data.onComplete;
    this.score = 0;
    this.isHitCooldown = false;
    // Increase speed slightly based on difficulty (default 1)
    this.cursorSpeed = 0.003 + ((data.difficulty || 1) * 0.001);
  }

  preload() {
    // Assets loading if any (moved texture gen to create)
  }

  create() {
    const { width, height } = this.scale;
    this.centerX = width / 2;
    this.centerY = height / 2;

    // Generate a simple circular texture for sparks in create (safe context)
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffaa00, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('spark', 8, 8);
    graphics.destroy();

    // --- Visuals: The Forge ---
    // Background (Darker part of the modal)
    this.add.rectangle(this.centerX, this.centerY, width, height, 0x1c1917);

    // Anvil (Trapezoid-ish shape using simple rects for now)
    this.add.rectangle(this.centerX, this.centerY + 50, 200, 100, 0x44403c).setOrigin(0.5); // Base
    this.add.rectangle(this.centerX, this.centerY + 10, 240, 40, 0x57534e).setOrigin(0.5); // Top

    // Ingot (Glowing Red)
    const ingot = this.add.rectangle(this.centerX, this.centerY - 20, 120, 25, 0xea580c);
    
    // Ingot Glow Tween
    this.tweens.add({
      targets: ingot,
      alpha: 0.7,
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut'
    });

    // --- UI: Timing Bar ---
    const barY = height - 80;
    // Bar Background
    this.add.rectangle(this.centerX, barY, 320, 20, 0x292524).setStrokeStyle(2, 0x78716c);
    
    // Target Zone (Green area) - Width 60
    this.targetZone = this.add.rectangle(this.centerX, barY, 50, 18, 0x15803d); // Green 700
    
    // Perfect Center Marker
    this.add.rectangle(this.centerX, barY, 4, 20, 0x86efac); // Light Green

    // Cursor (White indicator)
    this.cursor = this.add.rectangle(this.centerX, barY, 6, 30, 0xffffff);

    // --- UI: Progress ---
    this.add.text(this.centerX, 40, 'FORGING...', { 
      fontFamily: 'monospace', fontSize: '20px', color: '#fbbf24' 
    }).setOrigin(0.5);
    
    // Progress Bar Background
    this.add.rectangle(this.centerX, 80, 200, 12, 0x292524).setStrokeStyle(1, 0x57534e);
    // Progress Bar Fill
    this.progressBar = this.add.rectangle(this.centerX - 100, 80, 0, 12, 0xf59e0b).setOrigin(0, 0.5);

    // --- Inputs ---
    this.input.keyboard?.on('keydown-SPACE', this.handleHit, this);
    this.input.on('pointerdown', this.handleHit, this);

    // Instructions
    this.add.text(this.centerX, height - 30, '[SPACE] or [CLICK] to Strike', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#a8a29e'
    }).setOrigin(0.5);
  }

  update(time: number, delta: number) {
    if (this.score >= this.targetScore) return;

    // Move cursor back and forth
    // x = center + amplitude * sin(time * speed)
    const x = this.centerX + Math.sin(time * this.cursorSpeed) * this.amplitude;
    this.cursor.x = x;
  }

  handleHit() {
    if (this.score >= this.targetScore || this.isHitCooldown) return;

    this.isHitCooldown = true;
    this.time.delayedCall(200, () => this.isHitCooldown = false);

    const diff = Math.abs(this.cursor.x - this.targetZone.x);
    const zoneHalfWidth = this.targetZone.width / 2;

    let points = 0;
    let text = '';
    let color = '';
    let scale = 1;

    if (diff < 8) {
      // PERFECT
      points = 15;
      text = 'PERFECT!!';
      color = '#fbbf24'; // Amber
      scale = 1.5;
      this.createSparks(30, 0xffaa00, 1.5);
      this.cameras.main.shake(100, 0.01);
    } else if (diff < zoneHalfWidth) {
      // GOOD
      points = 8;
      text = 'GOOD';
      color = '#e7e5e4'; // Stone 200
      scale = 1.0;
      this.createSparks(10, 0xffffff, 1.0);
    } else {
      // MISS
      points = 0;
      text = 'MISS';
      color = '#ef4444'; // Red
      scale = 0.8;
      this.cameras.main.shake(100, 0.005);
    }

    // Update Score
    this.score = Math.min(this.score + points, this.targetScore);
    
    // Update Progress Bar
    const progressPct = this.score / this.targetScore;
    this.progressBar.width = 200 * progressPct;

    // Show feedback text
    this.showFloatingText(text, color, scale);

    // Animate Hammer Strike Visual (Simple scale punch)
    this.tweens.add({
      targets: this.cursor,
      scaleY: 1.5,
      duration: 50,
      yoyo: true
    });

    // Check Completion
    if (this.score >= this.targetScore) {
      this.completeGame();
    }
  }

  createSparks(count: number, tint: number, speedMult: number) {
    const emitter = this.add.particles(this.centerX, this.centerY + 10, 'spark', {
        speed: { min: 100 * speedMult, max: 300 * speedMult },
        angle: { min: 180, max: 360 }, // Upwards
        scale: { start: 0.5, end: 0 },
        blendMode: 'ADD',
        lifespan: 400,
        tint: tint,
        quantity: count,
        emitting: false
    });
    emitter.explode(count);
  }

  showFloatingText(message: string, color: string, scale: number) {
    const txt = this.add.text(this.centerX, this.centerY - 50, message, {
      fontFamily: 'monospace',
      fontSize: '24px',
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setScale(scale);

    this.tweens.add({
      targets: txt,
      y: this.centerY - 100,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => txt.destroy()
    });
  }

  completeGame() {
    this.add.rectangle(this.centerX, this.centerY, 1000, 1000, 0x000000, 0.5);
    const txt = this.add.text(this.centerX, this.centerY, 'COMPLETE!', {
      fontFamily: 'serif',
      fontSize: '48px',
      color: '#fbbf24',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: txt,
      alpha: 1,
      scale: 1.2,
      duration: 500,
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          if (this.onComplete) this.onComplete(100);
        });
      }
    });
  }
}
