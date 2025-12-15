
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { X, Hammer, Flame, Wind } from 'lucide-react';
import { getAssetUrl } from '../../../utils';
import { useGame } from '../../../context/GameContext';
import { MATERIALS } from '../../../data/materials';

// --- Types & Props ---
interface SmithingMinigameProps {
  onComplete: (score: number) => void;
  onClose: () => void; // This will now handle the "Cancel" logic (refund)
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
  scene!: Phaser.Scenes.ScenePlugin;
  sys!: Phaser.Scenes.Systems;

  private targetRing!: Phaser.GameObjects.Graphics;
  private approachRing!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private comboText!: Phaser.GameObjects.Text;
  private hammer!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container;
  private ingot!: Phaser.GameObjects.Image;
  private infoText!: Phaser.GameObjects.Text;
  private ambientGlow!: Phaser.GameObjects.Arc;

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
  private onStatusUpdate?: (temp: number) => void; // Callback to save temp
  private isFinished: boolean = false;
  
  // Flow Control
  private isPlaying: boolean = false;
  private isReadyToStart: boolean = false;

  // Temperature System
  private temperature: number = 0; // Starts Cold
  private coolingRate: number = 2; // Degrees lost per second
  private currentTempStage: 'COLD' | 'AURA' | 'HOT' | 'WARM' | 'NORMAL' = 'COLD';
  
  // New Temperature Visuals
  private tempBar!: Phaser.GameObjects.Rectangle;
  private tempBarBg!: Phaser.GameObjects.Rectangle;
  private tempValueText!: Phaser.GameObjects.Text;
  
  // Bellows
  private bellowsContainer!: Phaser.GameObjects.Container;
  private isPumping: boolean = false;

  constructor() {
    super('SmithingScene');
  }

  init(data: { onComplete: (score: number) => void, difficulty: number, initialTemp: number, onStatusUpdate: (temp: number) => void }) {
    this.onComplete = data.onComplete;
    this.onStatusUpdate = data.onStatusUpdate;
    
    // Difficulty adjusts shrink duration (Shorter = Faster/Harder)
    const baseDuration = 2000;
    this.shrinkDuration = Math.max(800, baseDuration - (data.difficulty * 200));
    
    // Cooling rate increases with difficulty
    this.coolingRate = 2 + (data.difficulty * 0.8);
    
    this.score = 0;
    this.combo = 0;
    this.temperature = data.initialTemp || 0; // Initialize with residual heat
    this.isFinished = false;
    this.isPlaying = false;
    
    // Auto-ready if already hot enough from residual heat
    if (this.temperature > 0) {
        this.isReadyToStart = true;
    } else {
        this.isReadyToStart = false;
    }
    
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
    this.load.image('particle_smoke', getAssetUrl('particle_smoke.png')); // Optional smoke

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
    
    // Ensure dimensions are valid for fallback texture generation
    const w = Math.floor(width) || 800;
    const h = Math.floor(height) || 600;

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
          g.fillRect(0, 0, w, h);
      }, w, h);
      this.add.image(this.centerX, this.centerY, 'fallback_bg');
    }
    // --- 2. The Forge ---
    
    // Anvil
    if (hasTexture('anvil')) {
      const anvil = this.add.image(this.centerX - 50, this.centerY + 150, 'anvil');
      anvil.setScale(0.8);
    } else {
      this.add.rectangle(this.centerX, this.centerY + 50, 200, 100, 0x44403c).setOrigin(0.5);
      this.add.rectangle(this.centerX, this.centerY + 10, 240, 40, 0x57534e).setOrigin(0.5);
    }

    // Ingot (Initial State: Depends on Temp)
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
    
    // Force initial visual state based on Residual Heat
    this.updateTempStage();
    this.updateIngotVisuals(this.currentTempStage);

    // --- 3. Ring Mechanic Visuals ---
    
    // Target Ring (Dynamic Position)
    this.targetRing = this.add.graphics();
    
    // Approach Ring (Dynamic Size)
    this.approachRing = this.add.graphics();

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
    // Top Progress Bar
    this.add.rectangle(this.centerX, 40, 300, 16, 0x000000, 0.5).setStrokeStyle(2, 0x57534e);
    this.progressBar = this.add.rectangle(this.centerX - 150, 40, 0, 12, 0xeab308).setOrigin(0, 0.5);

    // --- Thermometer (Right Side) ---
    const termX = width - 60;
    const termY = this.centerY - 50; // Centered vertically relative to gauge area
    const termHeight = 250;
    const termWidth = 24;

    // Thermometer Background (Container)
    this.tempBarBg = this.add.rectangle(termX, termY, termWidth + 8, termHeight + 8, 0x1c1917).setStrokeStyle(3, 0x57534e).setDepth(1);
    // Dark inner background
    this.add.rectangle(termX, termY, termWidth, termHeight, 0x292524).setDepth(1);
    
    // Thermometer Fill logic changed to ScaleY based approach to fix direction
    const bottomEdgeY = termY + (termHeight / 2);
    const topEdgeY = termY - (termHeight / 2);

    // Initialize with full height but scaleY = 0
    // Origin at (0.5, 1) means pivot is at bottom center.
    // Increasing scaleY will make it grow UPWARDS from the bottom.
    this.tempBar = this.add.rectangle(termX, bottomEdgeY, termWidth - 6, termHeight, 0x3b82f6);
    this.tempBar.setOrigin(0.5, 1);
    this.tempBar.scaleY = 0; 
    this.tempBar.setDepth(2); // Ensure it is above background

    // Ticks on Thermometer
    for (let i = 1; i < 5; i++) {
        const yPos = bottomEdgeY - (termHeight * (i/5));
        this.add.rectangle(termX, yPos, termWidth + 4, 2, 0x000000, 0.5).setDepth(3);
    }

    // Labels
    this.add.text(termX, topEdgeY - 15, 'HOT', { fontFamily: 'monospace', fontSize: '10px', color: '#ef4444' }).setOrigin(0.5).setDepth(4);
    this.add.text(termX, bottomEdgeY + 15, 'COLD', { fontFamily: 'monospace', fontSize: '10px', color: '#3b82f6' }).setOrigin(0.5).setDepth(4);

    // Current Temp Value (Fixed at top of gauge)
    this.tempValueText = this.add.text(termX, topEdgeY - 35, '20°C', {
        fontFamily: 'monospace', fontSize: '16px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4);

    // --- Bellows (Pump) ---
    const bellowsX = termX;
    const bellowsY = bottomEdgeY + 80; // Position relative to bottom of gauge
    
    this.createBellows(bellowsX, bellowsY);

    this.updateTemperatureDisplay(); // Set initial visual state

    // Combo Text
    this.comboText = this.add.text(this.centerX, this.centerY - 150, '', {
      fontFamily: 'Impact', fontSize: '42px', color: '#fcd34d', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);
    
    // Info Text (Tutorial)
    // Initial text depends on whether we have residual heat
    const initialMsg = this.isReadyToStart ? 'CLICK TO START' : 'FORGE IS COLD\nADD FUEL TO HEAT';
    const initialColor = this.isReadyToStart ? '#fbbf24' : '#3b82f6';

    this.infoText = this.add.text(this.centerX, this.centerY - 100, initialMsg, {
        fontFamily: 'monospace', fontSize: '24px', color: initialColor, align: 'center', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    
    this.tweens.add({
        targets: this.infoText, alpha: 0.5, yoyo: true, repeat: -1, duration: 800
    });

    // --- Input ---
    this.input.keyboard?.on('keydown-SPACE', this.handleInput, this);
    
    // Handle Click
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, gameObjects: any[]) => {
        if (pointer.button === 0) {
            // Check if clicked bellows
            // We need to check if the clicked object is part of the bellows container
            if (gameObjects.includes(this.bellowsContainer) || this.bellowsContainer.list.some(child => gameObjects.includes(child))) {
                this.pumpBellows();
            } else {
                this.handleInput();
            }
        }
    }, this);

    // Ambient Glow (Starts off, alpha managed by temp display)
    this.ambientGlow = this.add.circle(this.centerX, height, 400, 0xea580c, 0);
    this.ambientGlow.setFillStyle(0xea580c, 0.25); // <-- 이게 핵심
    this.ambientGlow.setAlpha(1);
    this.ambientGlow.setDepth(999);
    this.ambientGlow.setY(this.scale.height - 80);
    // Don't draw the first ring yet; wait for player to Start.
    // this.randomizeTargetPos(); 
  }

  createBellows(x: number, y: number) {
      this.bellowsContainer = this.add.container(x, y);
      
      // Visuals for Bellows
      // Top Plate
      const topPlate = this.add.rectangle(0, -15, 60, 12, 0x78350f).setStrokeStyle(2, 0x451a03);
      // Bottom Plate
      const bottomPlate = this.add.rectangle(0, 15, 60, 12, 0x78350f).setStrokeStyle(2, 0x451a03);
      // Leather Bag (Accordion style)
      const bag = this.add.rectangle(0, 0, 56, 30, 0xa16207);
      // Nozzle (Pointing left towards forge?) No, pointing somewhere logical. Let's say straight up towards gauge for abstraction.
      const nozzle = this.add.rectangle(0, -30, 10, 15, 0x525252);
      
      // Handles
      const handleTop = this.add.rectangle(0, -25, 20, 10, 0x78350f);
      
      this.bellowsContainer.add([nozzle, bag, topPlate, bottomPlate, handleTop]);
      
      // Interactive Zone
      const hitArea = new Phaser.Geom.Rectangle(-35, -35, 70, 70);
      this.bellowsContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
      
      // Label
      this.add.text(x, y + 40, 'PUMP', { 
          fontSize: '12px', color: '#a8a29e', fontFamily: 'monospace', fontStyle: 'bold'
      }).setOrigin(0.5);
  }

  pumpBellows() {
      if (this.isPumping) return;
      this.isPumping = true;

      // Visual Animation (Squash)
      this.tweens.add({
          targets: this.bellowsContainer,
          scaleY: 0.7,
          duration: 80,
          yoyo: true,
          onComplete: () => { this.isPumping = false; }
      });

      // Logic: Add Heat
      // Works if there is at least a spark (temp > 0)
      if (this.temperature > 0) {
          const boost = 8; // Increased boost
          this.temperature = Math.min(100, this.temperature + boost);
          this.updateTemperatureDisplay();
          
          // FX
          this.createSparks(8, 0xffaa00, 0.5, 'spark_normal'); 
          
          // If we pump it back up from low, allow starting
          if (!this.isPlaying && this.temperature > 0 && !this.isReadyToStart) {
              this.isReadyToStart = true;
              this.infoText.setText('CLICK TO START');
              this.infoText.setColor('#fbbf24');
          }
      } else {
          // Feedback for "No fire to fan"
          this.cameras.main.shake(30, 0.005);
          const feedback = this.add.text(this.bellowsContainer.x, this.bellowsContainer.y - 50, 'NEED FUEL', {
              fontSize: '14px', color: '#94a3b8', stroke: '#000', strokeThickness: 2, fontStyle: 'bold'
          }).setOrigin(0.5);
          this.tweens.add({ targets: feedback, y: feedback.y - 20, alpha: 0, duration: 800, onComplete: () => feedback.destroy() });
      }
  }

  // --- External Methods (Called by React) ---
  public heatUp() {
      if (this.isFinished) return;
      // Boost heat significantly (Charcoal)
      this.temperature = Math.min(100, this.temperature + 40);
      this.updateTemperatureDisplay();
      this.createSparks(20, 0xff5500, 1.2, 'spark_normal');
      
      // Update Ambient Glow (handled in updateTemperatureDisplay now, but instant feedback is good)
      // Transition to Ready State if not playing
      if (!this.isPlaying && this.temperature > 0) {
          this.isReadyToStart = true;
          this.infoText.setText('CLICK TO START');
          this.infoText.setColor('#fbbf24'); // Amber
      }
  }

  // Called when unmounting/closing to save state
  public getTemperature() {
      return this.temperature;
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
      
      // Only draw if the game is actively playing.
      // This prevents "leftover" rings from appearing before the user clicks Start.
      if (!this.isPlaying) return;

      if (this.currentTempStage === 'COLD') return;

      // Fill with semi-transparent GOLD
      this.targetRing.fillStyle(0xffaa00, 0.2);
      this.targetRing.fillCircle(this.hitX, this.hitY, this.targetRadius);
      // Stroke outline
      this.targetRing.lineStyle(4, 0xffaa00, 0.8);
      this.targetRing.strokeCircle(this.hitX, this.hitY, this.targetRadius);
  }

  ensureTexture(key: string, drawFn: (graphics: Phaser.GameObjects.Graphics) => void, width?: number, height?: number) {
      if (!this.textures.exists(key)) {
          const g = this.make.graphics({ x: 0, y: 0 });
          drawFn(g);
          
          const w = width && width > 0 ? Math.floor(width) : 32;
          const h = height && height > 0 ? Math.floor(height) : 32;

          g.generateTexture(key, w, h);
          g.destroy();
      }
  }

  update(time: number, delta: number) {
    if (this.isFinished) return;

    // 1. Ring Mechanic (Only works if playing and not cold)
    if (this.isPlaying && this.currentTempStage !== 'COLD') {
        this.handleRingLogic(delta);
    }

    // 2. Temperature Logic
    this.handleTemperature(delta);

    // If waiting to start and it gets cold again, revert prompt
    if (!this.isPlaying && this.isReadyToStart && this.currentTempStage === 'COLD') {
        this.isReadyToStart = false;
        this.infoText.setText('FORGE IS COLD\nADD FUEL TO HEAT');
        this.infoText.setColor('#3b82f6');
    }
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
          // Silent miss / Reset
          this.combo = 0; 
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
      this.updateTemperatureDisplay();

      const prevStage = this.currentTempStage;
      this.updateTempStage();

      if (this.currentTempStage !== prevStage) {
          this.updateIngotVisuals(this.currentTempStage);
          
          if (this.currentTempStage === 'COLD') {
             if (!this.isPlaying) {
                 this.infoText.setVisible(true);
             } else {
                 this.showFeedback("TOO COLD!", 0x3b82f6, 1.0);
             }
             
             this.targetRing.clear();
             this.approachRing.clear();
             // Glow alpha handled in updateTemperatureDisplay now
          }
      }
  }

  updateTempStage() {
      if (this.temperature <= 0) this.currentTempStage = 'COLD';
      else if (this.temperature > 75) this.currentTempStage = 'AURA';
      else if (this.temperature > 40) this.currentTempStage = 'HOT';
      else if (this.temperature > 15) this.currentTempStage = 'WARM';
      else this.currentTempStage = 'NORMAL';
  }
  
  updateTemperatureDisplay() {
       const maxTemp = 100;
       const current = Phaser.Math.Clamp(this.temperature, 0, maxTemp);
       const ratio = current / maxTemp;

       // 1. Text Update: Map 0-100% to 20°C - 1500°C
       const displayTemp = Math.floor(20 + (ratio * 1480));
       this.tempValueText.setText(`${displayTemp}°C`);

       // 2. Bar Height/Scale Update
       // Use scaleY to grow upwards from bottom anchor (0.5, 1)
       this.tempBar.scaleY = ratio;

       // 3. Bar Color Update (Interpolate Blue -> Yellow -> Red)
       const startColor = new Phaser.Display.Color(59, 130, 246); // Blue
       const midColor = new Phaser.Display.Color(234, 179, 8);   // Yellow
       const endColor = new Phaser.Display.Color(239, 68, 68);   // Red

       let r, g, b;
       
       if (ratio < 0.5) {
           // Blue to Yellow
           const localRatio = ratio * 2;
           const c = Phaser.Display.Color.Interpolate.ColorWithColor(startColor, midColor, 100, localRatio * 100);
           r = c.r; g = c.g; b = c.b;
       } else {
           // Yellow to Red
           const localRatio = (ratio - 0.5) * 2;
           const c = Phaser.Display.Color.Interpolate.ColorWithColor(midColor, endColor, 100, localRatio * 100);
           r = c.r; g = c.g; b = c.b;
       }
       
       this.tempBar.setFillStyle(Phaser.Display.Color.GetColor(r, g, b));
       
       // Update text color based on temp for feedback
      if (current < 20) this.tempValueText.setColor('#3b82f6');
       else if (current > 75) this.tempValueText.setColor('#ef4444');
       else this.tempValueText.setColor('#ffffff');

      // 4. Update Ambient Glow Visibility + Size based on heat
      if (this.ambientGlow) {
        const glowA = ratio * 0.3;

        // ✅ 알파는 fillAlpha로 (안 보이는 문제 방지)
        this.ambientGlow.setFillStyle(0xea580c, glowA);
        this.ambientGlow.setAlpha(1);

        // ✅ 온도에 따라 크기(반경) 증가
        const minR = 280;  // 차가울 때 반경
        const maxR = 520;  // 뜨거울 때 반경

        // 살짝 이징 주면 자연스러움(선택)
        const eased = Phaser.Math.Easing.Quadratic.Out(ratio);
        const targetR = Phaser.Math.Linear(minR, maxR, eased);

        // 부드럽게 변화(선택) - 튀는 느낌 방지
        const currentR = (this.ambientGlow as any).radius ?? minR;
        const nextR = Phaser.Math.Linear(currentR, targetR, 0.08);

        this.ambientGlow.setRadius(nextR);

        // 바닥에 걸친 반원 느낌 유지(중심을 화면 아래 경계에 고정)
        this.ambientGlow.setPosition(this.centerX, this.scale.height);
      }
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

  handleInput() {
    if (this.isFinished) return;

    // --- PHASE 1: START GAME CHECK ---
    if (!this.isPlaying) {
        if (this.isReadyToStart) {
            // START THE GAME
            this.isPlaying = true;
            this.infoText.setVisible(false);
            
            // Generate the first ring immediately upon starting
            this.resetRing();
            
            this.cameras.main.flash(200, 255, 255, 255);
        } else {
            // Not ready (too cold)
            this.triggerTooCold();
        }
        return;
    }

    // --- PHASE 2: GAMEPLAY ---
    
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
    
    // Update score logic
    this.progressBar.width = Phaser.Math.Clamp(this.score / this.targetScore * 300, 0, 300);

    if (this.score >= this.targetScore) {
      this.winGame();
      // Do NOT resetRing here. We are done.
    } else {
      this.resetRing();
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
        }, 8, 8); // Explicitly pass 8x8 for fallback sparks
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
    this.isPlaying = false; // Stop update loop logic
    
    // Clear any active rings immediately to prevent ghost visuals
    if (this.targetRing) this.targetRing.clear();
    if (this.approachRing) this.approachRing.clear();
    
    // Save state before finishing visual
    if (this.onStatusUpdate) {
        this.onStatusUpdate(this.temperature);
    }

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

  // Calculate residual temperature
  // Cooling Rate Estimate: ~5 degrees per second while offline/idle
  const GLOBAL_COOLING_RATE_PER_SEC = 5; 
  const timeDiffSec = (Date.now() - (state.lastForgeTime || 0)) / 1000;
  const coolingAmount = timeDiffSec * GLOBAL_COOLING_RATE_PER_SEC;
  const initialTemp = Math.max(0, (state.forgeTemperature || 0) - coolingAmount);

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
    
    // Pass callback to update status
    game.scene.start('SmithingScene', { 
        onComplete, 
        difficulty, 
        initialTemp,
        onStatusUpdate: (temp: number) => {
            actions.updateForgeStatus(temp);
        }
    });

    return () => {
        // Attempt to capture state on unmount if possible, though React cleanup might be too late for Phaser scene data access sometimes.
        // Better handled inside Phaser scene logic (winGame, or explicit save method)
        // If user Cancels via X button, we should grab temp.
        if (gameRef.current) {
             const scene = gameRef.current.scene.getScene('SmithingScene') as SmithingScene;
             if (scene && scene.sys.isActive()) {
                 const currentTemp = scene.getTemperature();
                 // We can't use 'actions' here reliably if component unmounts, but we can try.
                 // Actually, it's safer to have the Cancel button trigger the save explicitly.
             }
             game.destroy(true);
             gameRef.current = null;
        }
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

  const handleManualClose = () => {
      // Save temperature before closing
      if (gameRef.current) {
          const scene = gameRef.current.scene.getScene('SmithingScene') as SmithingScene;
          if (scene) {
             actions.updateForgeStatus(scene.getTemperature());
          }
      }
      onClose(); // Call prop which handles Refund logic if not complete
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
                onClick={handleManualClose}
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
                <div className="text-[10px] text-stone-500 text-center mt-2 bg-stone-900/80 px-2 py-1 rounded">
                    Use bellows (on right) to sustain heat
                </div>
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
