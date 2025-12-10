
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { X, Hammer, Flame } from 'lucide-react';
import { getAssetUrl } from '../utils';
import { useGame } from '../context/GameContext';
import { MATERIALS } from '../constants';

// --- Types & Props ---
interface SmithingMinigameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  difficulty?: number; // 1 (Easy) to 5 (Hard)
}

// --- Phaser Scene Logic ---
class SmithingScene extends Phaser.Scene {
  // Explicitly declare properties to fix TS errors
  add!: Phaser.GameObjects.GameObjectFactory;
  make!: Phaser.GameObjects.GameObjectCreator;
  scale!: Phaser.Scale.ScaleManager;
  tweens!: Phaser.Tweens.TweenManager;
  time!: Phaser.Time.Clock;
  cameras!: Phaser.Cameras.Scene2D.CameraManager;
  input!: Phaser.Input.InputPlugin;
  load!: Phaser.Loader.LoaderPlugin;
  textures!: Phaser.Textures.TextureManager;

  private targetRing!: Phaser.GameObjects.Graphics;
  private approachRing!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private comboText!: Phaser.GameObjects.Text;
  private hammer!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container;
  private ingot!: Phaser.GameObjects.Image;
  private debugRing!: Phaser.GameObjects.Graphics;
  private infoText!: Phaser.GameObjects.Text;

  // Game Configuration
  private centerX: number = 0;
  private centerY: number = 0;
  
  // Ring Mechanic Config
  private hitX: number = 0;
  private hitY: number = 0;
  private ingotBounds!: Phaser.Geom.Rectangle; // Area where target can spawn

  private startRadius: number = 160; 
  private targetRadius: number = 35;
  private currentRadius: number = 160;
  
  // Easing Logic
  private shrinkDuration: number = 2000; // ms
  private ringTimer: number = 0;
  
  // State
  private score: number = 0;
  private targetScore: number = 100;
  private combo: number = 0;
  private lastHitTime: number = 0;
  private hitCooldown: number = 200; // ms
  private onComplete?: (score: number) => void;
  private isFinished: boolean = false;

  // Temperature System
  private temperature: number = 0; // Starts Cold
  private coolingRate: number = 2; // Degrees lost per second
  private currentTempStage: 'COLD' | 'AURA' | 'HOT' | 'WARM' | 'NORMAL' = 'COLD';
  private tempText!: Phaser.GameObjects.Text;

  constructor() {
    super('SmithingScene');
  }

  init(data: { onComplete: (score: number) => void, difficulty: number }) {
    this.onComplete = data.onComplete;
    
    // Difficulty adjusts shrink duration (Shorter = Faster/Harder)
    const baseDuration = 2000;
    this.shrinkDuration = Math.max(800, baseDuration - (data.difficulty * 200));
    
    // Cooling rate increases with difficulty
    this.coolingRate = 2 + (data.difficulty * 0.8);
    
    this.score = 0;
    this.combo = 0;
    this.temperature = 0; // START AT 0
    this.isFinished = false;
    this.currentTempStage = 'COLD';
  }

  preload() {
    // Important for loading external assets into WebGL textures
    this.load.crossOrigin = 'anonymous';
    
    this.load.image('bg', getAssetUrl('forge_bg.png'));
    this.load.image('anvil', getAssetUrl('anvil.png'));
    this.load.image('hammer', getAssetUrl('hammer.png'));
    
    // Ingot Variations
    this.load.image('ingot_hot_aura', getAssetUrl('ingot_hot_aura.png'));
    this.load.image('ingot_hot', getAssetUrl('ingot_hot.png'));
    this.load.image('ingot_warm', getAssetUrl('ingot_warm.png'));
    this.load.image('ingot_normal', getAssetUrl('ingot_normal.png'));
    this.load.image('ingot_cold', getAssetUrl('ingot_normal.png')); // Fallback/Tinted

    // Spark Variations
    this.load.image('spark_perfect', getAssetUrl('particle_spark1.png'));
    this.load.image('spark_normal', getAssetUrl('particle_spark2.png'));

    this.load.on('loaderror', (fileObj: any) => {
        console.warn(`[Phaser] Failed to load asset: ${fileObj.key} from ${fileObj.src}`);
    });
  }

  create() {
    const { width, height } = this.scale;
    this.centerX = width / 2;
    this.centerY = height / 2;
    
    // Set Initial Hit Center (Center of Anvil)
    this.hitX = this.centerX;
    this.hitY = this.centerY + 60;

    // Define Spawn Bounds (Fixed area on top of anvil)
    this.ingotBounds = new Phaser.Geom.Rectangle(
        this.centerX - 60, 
        this.centerY + 30, 
        120, 
        40
    );

    // --- 1. Background ---
    const hasTexture = (key: string) => this.textures.exists(key);

    if (hasTexture('bg')) {
      const bg = this.add.image(this.centerX, this.centerY, 'bg');
      const scaleX = width / bg.width;
      const scaleY = height / bg.height;
      const scale = Math.max(scaleX, scaleY);
      bg.setScale(scale).setScrollFactor(0);
      bg.setTint(0x888888);
    } else {
      this.ensureTexture('fallback_bg', (g) => {
          g.fillStyle(0x1c1917, 1);
          g.fillRect(0, 0, width, height);
      }, width, height);
      this.add.image(this.centerX, this.centerY, 'fallback_bg');
    }

    // Ambient Glow (Starts off, turns on with heat)
    const glow = this.add.circle(this.centerX, height, 400, 0xea580c, 0); // Alpha 0 initially
    glow.setName('ambientGlow');

    // --- 2. The Forge ---
    
    // Anvil
    if (hasTexture('anvil')) {
      const anvil = this.add.image(this.centerX - 50, this.centerY + 150, 'anvil');
      anvil.setScale(0.8);
    } else {
      this.add.rectangle(this.centerX, this.centerY + 50, 200, 100, 0x44403c).setOrigin(0.5);
      this.add.rectangle(this.centerX, this.centerY + 10, 240, 40, 0x57534e).setOrigin(0.5);
    }

    // Ingot (Initial State: Cold)
    if (hasTexture('ingot_hot_aura')) {
      this.ingot = this.add.image(this.centerX - 20, this.centerY + 60, 'ingot_hot_aura'); // Placeholder
      this.ingot.setScale(0.35); 
    } else {
      this.ensureTexture('ingot_fallback', (g) => {
          g.fillStyle(0xffffff, 1);
          g.fillRect(0, 0, 120, 25);
      }, 120, 25);
      this.ingot = this.add.image(this.centerX, this.centerY + 60, 'ingot_fallback');
    }
    
    // Force initial visual state
    this.updateIngotVisuals('COLD');

    // --- 3. Ring Mechanic Visuals ---
    
    // Debug Visual for Aim Range
    this.debugRing = this.add.graphics();

    // Target Ring (Dynamic Position)
    this.targetRing = this.add.graphics();
    
    // Approach Ring (Dynamic Size)
    this.approachRing = this.add.graphics();

    // Don't draw rings yet if cold
    // this.drawTargetRing();

    // Hammer (On top of rings)
    if (hasTexture('hammer')) {
      this.hammer = this.add.image(this.centerX + 120, this.centerY + 100, 'hammer');
      this.hammer.setOrigin(0.5, 1); 
      this.hammer.setScale(0.5);
      this.hammer.setRotation(0.5);
      this.hammer.setDepth(10); 
    } else {
      const handle = this.add.rectangle(0, 0, 10, 80, 0x78350f).setOrigin(0.5, 1);
      const head = this.add.rectangle(0, -80, 40, 20, 0x52525b);
      this.hammer = this.add.container(this.centerX + 120, this.centerY - 50, [handle, head]);
      (this.hammer as any).setRotation(0.5);
      this.hammer.setDepth(10);
    }

    // --- 4. UI: HUD ---
    this.add.rectangle(this.centerX, 40, 300, 16, 0x000000, 0.5).setStrokeStyle(2, 0x57534e);
    this.progressBar = this.add.rectangle(this.centerX - 150, 40, 0, 12, 0xeab308).setOrigin(0, 0.5);

    // Temp Indicator
    this.tempText = this.add.text(this.centerX + 180, 40, 'TEMP: 0%', {
        fontFamily: 'monospace', fontSize: '14px', color: '#fff'
    }).setOrigin(0, 0.5);

    this.comboText = this.add.text(this.centerX, this.centerY - 150, '', {
      fontFamily: 'Impact', fontSize: '42px', color: '#fcd34d', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);
    
    // Info Text (Tutorial)
    this.infoText = this.add.text(this.centerX, this.centerY - 100, 'FORGE IS COLD\nADD FUEL TO START', {
        fontFamily: 'monospace', fontSize: '24px', color: '#3b82f6', align: 'center', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    
    this.tweens.add({
        targets: this.infoText, alpha: 0.5, yoyo: true, repeat: -1, duration: 800
    });

    // --- Input ---
    this.input.keyboard?.on('keydown-SPACE', this.handleHit, this);
    
    // Handle Click - Explicitly checking pointer button 0 (Left Click)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.button === 0) {
            this.handleHit();
        }
    }, this);

    // Initial Randomization
    this.randomizeTargetPos();
  }

  // --- External Methods (Called by React) ---
  public heatUp() {
      if (this.isFinished) return;
      // Boost heat significantly
      this.temperature = Math.min(100, this.temperature + 40);
      this.updateTempText();
      this.createSparks(20, 0xff5500, 1.2, 'spark_normal');
      
      // Update Ambient Glow
      const glow = this.children.getByName('ambientGlow') as Phaser.GameObjects.Arc;
      if (glow) glow.setAlpha(0.2);

      // Remove tutorial text if heated
      if (this.temperature > 20 && this.infoText.visible) {
          this.infoText.setVisible(false);
      }
  }

  randomizeTargetPos() {
      if (!this.ingotBounds) return;
      
      this.hitX = Phaser.Math.Between(this.ingotBounds.left, this.ingotBounds.right);
      this.hitY = Phaser.Math.Between(this.ingotBounds.top, this.ingotBounds.bottom);
      
      this.drawTargetRing();
  }

  drawTargetRing() {
      if (!this.targetRing) return;
      this.targetRing.clear();
      
      if (this.currentTempStage === 'COLD') return;

      // Fill with semi-transparent GOLD
      this.targetRing.fillStyle(0xffaa00, 0.2);
      this.targetRing.fillCircle(this.hitX, this.hitY, this.targetRadius);
      // Stroke outline
      this.targetRing.lineStyle(4, 0xffaa00, 0.8);
      this.targetRing.strokeCircle(this.hitX, this.hitY, this.targetRadius);

      // Debug: Show actual aim tolerance area
      this.debugRing.clear();
      this.debugRing.lineStyle(1, 0x3b82f6, 0.3); // Faint Blue
      this.debugRing.strokeCircle(this.hitX, this.hitY, this.targetRadius + 60);
  }

  ensureTexture(key: string, drawFn: (graphics: Phaser.GameObjects.Graphics) => void, width?: number, height?: number) {
      if (!this.textures.exists(key)) {
          const g = this.make.graphics({ x: 0, y: 0 });
          drawFn(g);
          if (width && height) {
              g.generateTexture(key, width, height);
          } else {
              g.generateTexture(key);
          }
          g.destroy();
      }
  }

  update(time: number, delta: number) {
    if (this.isFinished) return;

    // 1. Ring Mechanic (Only works if not cold)
    if (this.currentTempStage !== 'COLD') {
        this.handleRingLogic(delta);
    }

    // 2. Temperature Logic
    this.handleTemperature(delta);
  }

  handleRingLogic(delta: number) {
      // Update Timer
      this.ringTimer += delta;

      // Calculate Progress (0 to 1)
      const t = Math.min(this.ringTimer / this.shrinkDuration, 1.5); 
      const ease = t * t; 

      // Update Radius
      this.currentRadius = this.startRadius * (1 - ease);

      // Determine Color: White if missed (too small)
      let ringColor = 0xffaa00; // Gold
      if (this.currentRadius < this.targetRadius) {
          ringColor = 0xffffff; // White
      }

      // Draw Approach Ring
      this.approachRing.clear();
      this.approachRing.fillStyle(ringColor, 0.05);
      this.approachRing.fillCircle(this.hitX, this.hitY, Math.max(0, this.currentRadius));
      this.approachRing.lineStyle(3, ringColor, 1);
      this.approachRing.strokeCircle(this.hitX, this.hitY, Math.max(0, this.currentRadius));

      // Check for Timeout (Ring too small)
      if (this.currentRadius < this.targetRadius - 15) {
          // REMOVED: triggerMiss(); 
          // Just reset without penalty or visual feedback
          this.combo = 0; // Reset combo silently
          this.resetRing();
      }
  }

  resetRing() {
      this.currentRadius = this.startRadius;
      this.ringTimer = 0;
      this.randomizeTargetPos(); 
  }

  handleTemperature(delta: number) {
      if (this.score >= this.targetScore) return;

      this.temperature = Math.max(0, this.temperature - (this.coolingRate * (delta / 1000)));
      this.updateTempText();

      let newStage: 'COLD' | 'AURA' | 'HOT' | 'WARM' | 'NORMAL' = 'NORMAL';
      
      if (this.temperature <= 0) newStage = 'COLD';
      else if (this.temperature > 75) newStage = 'AURA';
      else if (this.temperature > 40) newStage = 'HOT';
      else if (this.temperature > 15) newStage = 'WARM';
      else newStage = 'NORMAL'; // Very low heat but not 0

      if (newStage !== this.currentTempStage) {
          this.currentTempStage = newStage;
          this.updateIngotVisuals(newStage);
          
          if (newStage === 'COLD') {
             this.infoText.setVisible(true);
             this.targetRing.clear();
             this.approachRing.clear();
             const glow = this.children.getByName('ambientGlow') as Phaser.GameObjects.Arc;
             if (glow) glow.setAlpha(0);
          }
      }
  }
  
  updateTempText() {
       this.tempText.setText(`TEMP: ${Math.floor(this.temperature)}%`);
       // Change color based on heat
       if (this.temperature < 20) this.tempText.setColor('#3b82f6'); // Blue
       else if (this.temperature > 75) this.tempText.setColor('#fbbf24'); // Amber
       else this.tempText.setColor('#ffffff');
  }

  updateIngotVisuals(stage: 'COLD' | 'AURA' | 'HOT' | 'WARM' | 'NORMAL') {
      const hasTex = (key: string) => this.textures.exists(key);

      switch (stage) {
          case 'AURA':
              if (hasTex('ingot_hot_aura')) {
                  this.ingot.setTexture('ingot_hot_aura');
                  this.ingot.clearTint();
              }
              break;
          case 'HOT':
              if (hasTex('ingot_hot')) {
                   this.ingot.setTexture('ingot_hot');
                   this.ingot.clearTint();
              }
              break;
          case 'WARM':
              if (hasTex('ingot_warm')) {
                   this.ingot.setTexture('ingot_warm');
                   this.ingot.clearTint();
              }
              break;
          case 'NORMAL':
              if (hasTex('ingot_normal')) {
                   this.ingot.setTexture('ingot_normal');
                   this.ingot.clearTint();
              }
              break;
          case 'COLD':
              // Use normal texture but darkened heavily
              if (hasTex('ingot_normal')) {
                  this.ingot.setTexture('ingot_normal');
              } else {
                  this.ingot.setTexture('ingot_fallback');
              }
              this.ingot.setTint(0x334155); // Dark Slate Blue
              break;
      }
  }

  handleHit() {
    if (this.isFinished) return;
    
    const now = this.time.now;
    if (now - this.lastHitTime < this.hitCooldown) return;
    this.lastHitTime = now;

    // Hammer Animation
    if (this.hammer) {
        this.tweens.add({
            targets: this.hammer,
            x: this.hitX + 50,
            y: this.hitY,
            angle: -80,
            duration: 50,
            yoyo: true,
            ease: 'Quad.easeIn'
        });
    }

    if (this.currentTempStage === 'COLD') {
        this.triggerTooCold();
        return;
    }
    
    if (this.currentTempStage === 'NORMAL') {
        this.triggerTooCold();
        return;
    }

    // --- AIM CHECK ---
    const pointer = this.input.activePointer;
    // Use worldX/worldY to ensure correct coordinates regardless of scale
    const aimDist = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.hitX, this.hitY);
    
    // Aim Tolerance: Radius + 60px buffer (Quite generous)
    if (aimDist > this.targetRadius + 60) {
        this.triggerAimFail();
        this.resetRing();
        return;
    }

    // --- TIMING CHECK ---
    const diff = Math.abs(this.currentRadius - this.targetRadius);
    
    const perfectThreshold = 10;
    const goodThreshold = 30;

    let efficiency = 1.0;
    if (this.currentTempStage === 'AURA') efficiency = 1.5;
    else if (this.currentTempStage === 'HOT') efficiency = 1.0;
    else if (this.currentTempStage === 'WARM') efficiency = 0.5;

    if (diff < perfectThreshold) {
      this.triggerPerfect(efficiency);
    } else if (diff < goodThreshold) {
      this.triggerGood(efficiency);
    } else {
      this.triggerMiss();
    }
    
    this.resetRing();

    this.progressBar.width = Phaser.Math.Clamp(this.score / this.targetScore * 300, 0, 300);

    if (this.score >= this.targetScore) {
      this.winGame();
    }
  }

  triggerTooCold() {
      this.cameras.main.shake(50, 0.005);
      this.showFeedback("TOO COLD!", 0x3b82f6, 1.0); // Blue text
  }

  triggerAimFail() {
      this.score = Math.max(0, this.score - 5);
      this.combo = 0;
      this.cameras.main.shake(100, 0.015);
      this.showFeedback("BAD AIM!", 0xffffff, 1.2);
  }

  triggerPerfect(mult: number) {
    const points = Math.ceil(15 * mult);
    this.score += points;
    this.combo++;
    this.cameras.main.shake(100, 0.02);
    // Use spark_perfect for perfect hits
    this.createSparks(30, 0xffaa00, 1.5, 'spark_perfect');
    
    let text = 'PERFECT!';
    if (mult > 1) text += ' (MAX HEAT)';
    else if (mult < 1) text += ' (WEAK)';
    
    this.showFeedback(text, 0xffb300, 1.5);
  }

  triggerGood(mult: number) {
    const points = Math.ceil(8 * mult);
    this.score += points;
    this.combo = 0; 
    this.cameras.main.shake(50, 0.005);
    // Use spark_normal for good hits
    this.createSparks(10, 0xffffff, 1.0, 'spark_normal');
    this.showFeedback('GOOD', 0xe5e5e5, 1.0);
  }

  triggerMiss() {
    this.score = Math.max(0, this.score - 5);
    this.combo = 0;
    this.cameras.main.shake(100, 0.01);
    this.showFeedback('MISS', 0xef4444, 1.2);
  }

  createSparks(count: number, color: number, speedScale: number, textureKey: string) {
    let texture = textureKey;
    
    // Check if specific texture exists, otherwise create fallback
    if (!this.textures.exists(texture)) {
        this.ensureTexture(texture + '_fallback', (g) => {
            g.fillStyle(0xffffff, 1);
            g.fillCircle(4,4,4);
        });
        texture = texture + '_fallback';
    }

    const emitter = this.add.particles(this.hitX, this.hitY, texture, {
      lifespan: 600,
      speed: { min: 200 * speedScale, max: 500 * speedScale },
      angle: { min: 200, max: 340 },
      scale: { start: 0.5, end: 0 },
      gravityY: 800,
      blendMode: 'ADD',
      emitting: false,
      tint: color
    });
    emitter.explode(count);
  }

  showFeedback(text: string, color: number, scale: number) {
    const feedback = this.add.text(this.hitX, this.hitY - 80, text, {
      fontFamily: 'Arial',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#' + color.toString(16),
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScale(0.5).setAlpha(0);

    this.tweens.add({
      targets: feedback, y: this.hitY - 120, alpha: 1, scale: scale, duration: 200, hold: 400, yoyo: true,
      onComplete: () => feedback.destroy()
    });

    if (this.combo > 1) {
      this.comboText.setText(`${this.combo} COMBO!`);
      this.comboText.setAlpha(1);
      this.comboText.setPosition(this.centerX, this.centerY - 150); 
      this.tweens.add({
        targets: this.comboText, scale: { from: 1.5, to: 1 }, duration: 200, alpha: { from: 1, to: 0 }, delay: 500
      });
    }
  }

  winGame() {
    this.isFinished = true;
    const bg = this.add.rectangle(this.centerX, this.centerY, 1000, 1000, 0x000000, 0.8);
    bg.setAlpha(0);
    this.tweens.add({ targets: bg, alpha: 1, duration: 500 });

    const txt = this.add.text(this.centerX, this.centerY, 'ITEM FORGED!', {
      fontFamily: 'Georgia', fontSize: '48px', color: '#fbbf24', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: txt, alpha: 1, scale: { from: 0.5, to: 1.2 }, duration: 600, ease: 'Back.out',
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          if (this.onComplete) this.onComplete(100);
        });
      }
    });
  }
}

// --- React Component ---
const SmithingMinigame: React.FC<SmithingMinigameProps> = ({ onComplete, onClose, difficulty = 1 }) => {
  const { state, actions } = useGame();
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const charcoalCount = state.inventory.find(i => i.id === MATERIALS.CHARCOAL.id)?.quantity || 0;

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 600,
      backgroundColor: '#0c0a09',
      transparent: false,
      scene: [SmithingScene],
      physics: { default: 'arcade', arcade: { debug: false } },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;
    game.scene.start('SmithingScene', { onComplete, difficulty });

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [onComplete, difficulty]);

  const handleAddCharcoal = () => {
      if (charcoalCount > 0 && gameRef.current) {
          const scene = gameRef.current.scene.getScene('SmithingScene') as SmithingScene;
          if (scene) {
              actions.consumeItem(MATERIALS.CHARCOAL.id, 1);
              scene.heatUp();
          }
      }
  };

  return (
    <div className="w-full h-full flex flex-col bg-stone-950 animate-in fade-in duration-300">
        <div className="w-full h-16 shrink-0 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-6 z-10 shadow-md">
            <div className="flex items-center gap-3">
                <div className="bg-amber-900/30 p-2 rounded-full border border-amber-800">
                    <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                </div>
                <div>
                    <h2 className="text-stone-200 font-bold tracking-wide">Forging in Progress</h2>
                    <p className="text-xs text-stone-500 uppercase tracking-wider">Maintain Heat & Strike True</p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-red-900/20 text-stone-400 hover:text-red-400 rounded border border-stone-700 hover:border-red-800 transition-all"
            >
                <X className="w-4 h-4" />
                <span className="text-sm font-bold">Cancel Work</span>
            </button>
        </div>

        <div className="flex-1 w-full relative bg-stone-950 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #78350f 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            <div ref={containerRef} className="w-full h-full max-w-5xl max-h-[80vh] aspect-[4/3] shadow-2xl shadow-black rounded-lg overflow-hidden border border-stone-800" />
            
            {/* Charcoal Button Overlay */}
            <div className="absolute bottom-6 right-6 z-20">
                <button 
                    onClick={handleAddCharcoal}
                    disabled={charcoalCount <= 0}
                    className={`flex flex-col items-center justify-center w-24 h-24 rounded-full bg-stone-900 border-4 border-stone-700 hover:border-amber-500 hover:bg-stone-800 shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 ${charcoalCount > 0 ? 'animate-pulse' : ''}`}
                >
                    <Flame className="w-8 h-8 text-amber-500 mb-1 group-hover:animate-pulse" />
                    <span className="text-[10px] font-bold text-stone-300 uppercase">Add Heat</span>
                    <span className="text-xs text-stone-500 font-mono">x{charcoalCount}</span>
                </button>
            </div>
        </div>
        
        <div className="w-full py-3 bg-stone-900 border-t border-stone-800 flex justify-center items-center gap-2 text-stone-500 text-xs font-mono uppercase tracking-widest">
            <Hammer className="w-3 h-3" />
            <span>Heat the Forge, then Aim & Strike!</span>
        </div>
    </div>
  );
};

export default SmithingMinigame;
