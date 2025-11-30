
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { X, Hammer, Flame } from 'lucide-react';

// --- Types & Props ---
interface SmithingMinigameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  difficulty?: number; // 1 (Easy) to 5 (Hard)
}

// --- Phaser Scene Logic ---
class SmithingScene extends Phaser.Scene {
  private cursor!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private targetZone!: Phaser.GameObjects.Rectangle;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private comboText!: Phaser.GameObjects.Text;
  private hammer!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container;

  // Game Configuration
  private centerX: number = 0;
  private centerY: number = 0;
  private barY: number = 0;
  private amplitude: number = 200;
  private baseSpeed: number = 0.003;
  
  // State
  private score: number = 0;
  private targetScore: number = 100;
  private combo: number = 0;
  private lastHitTime: number = 0;
  private hitCooldown: number = 400; // ms
  private onComplete?: (score: number) => void;
  private isFinished: boolean = false;

  constructor() {
    super('SmithingScene');
  }

  init(data: { onComplete: (score: number) => void, difficulty: number }) {
    this.onComplete = data.onComplete;
    this.baseSpeed = 0.003 + (data.difficulty * 0.0005);
    this.score = 0;
    this.combo = 0;
    this.isFinished = false;
  }

  preload() {
    // [FIX] Use explicit relative paths with cache busting
    // This assumes files are in 'public/assets/' folder
    const timestamp = Date.now();
    
    this.load.setPath('assets/');
    
    this.load.image('bg', `forge_bg.png?v=${timestamp}`);
    this.load.image('anvil', `anvil.png?v=${timestamp}`);
    this.load.image('hammer', `hammer.png?v=${timestamp}`);
    this.load.image('ingot_hot', `ingot_hot.png?v=${timestamp}`);
    this.load.image('cursor', `cursor_pointer.png?v=${timestamp}`);
    this.load.image('spark', `particle_spark.png?v=${timestamp}`);

    // Debug: Log errors if files are truly missing
    this.load.on('loaderror', (fileObj: any) => {
        console.warn(`[Phaser] Failed to load asset: ${fileObj.key} from ${fileObj.src}`);
    });
  }

  create() {
    const { width, height } = this.scale;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.barY = height - 80;

    // --- 1. Background ---
    if (this.textures.exists('bg')) {
      const bg = this.add.image(this.centerX, this.centerY, 'bg');
      // Cover logic
      const scaleX = width / bg.width;
      const scaleY = height / bg.height;
      const scale = Math.max(scaleX, scaleY);
      bg.setScale(scale).setScrollFactor(0);
      bg.setTint(0x888888); // Darken the background slightly
    } else {
      // [FALLBACK] Draw Dark Rectangle if image fails
      this.add.rectangle(this.centerX, this.centerY, width, height, 0x1c1917);
    }

    // Ambient Glow (Always present)
    const glow = this.add.circle(this.centerX, height, 400, 0xea580c, 0.2);
    this.tweens.add({
      targets: glow, alpha: 0.1, scale: 1.1, yoyo: true, repeat: -1, duration: 3000, ease: 'Sine.easeInOut'
    });

    // --- 2. The Forge (Visuals) ---
    
    // Anvil
    if (this.textures.exists('anvil')) {
      const anvil = this.add.image(this.centerX, this.centerY + 50, 'anvil');
      anvil.setScale(0.8);
    } else {
      // [FALLBACK] Draw Anvil Shapes
      this.add.rectangle(this.centerX, this.centerY + 50, 200, 100, 0x44403c).setOrigin(0.5);
      this.add.rectangle(this.centerX, this.centerY + 10, 240, 40, 0x57534e).setOrigin(0.5);
      this.add.text(this.centerX, this.centerY + 50, 'ANVIL', { fontSize: '12px', color: '#000' }).setOrigin(0.5);
    }

    // Hot Ingot
    if (this.textures.exists('ingot_hot')) {
      const ingot = this.add.image(this.centerX, this.centerY - 20, 'ingot_hot');
      ingot.setScale(0.25);
      this.addInotGlow(ingot);
    } else {
      // [FALLBACK] Draw Ingot Shape
      const ingot = this.add.rectangle(this.centerX, this.centerY - 20, 120, 25, 0xea580c);
      this.addInotGlow(ingot);
    }

    // Hammer
    if (this.textures.exists('hammer')) {
      this.hammer = this.add.image(this.centerX + 120, this.centerY - 50, 'hammer');
      this.hammer.setOrigin(0.5, 1); 
      this.hammer.setScale(0.6);
      this.hammer.setRotation(0.5);
    } else {
      // [FALLBACK] Draw Hammer Shape
      const handle = this.add.rectangle(0, 0, 10, 80, 0x78350f).setOrigin(0.5, 1);
      const head = this.add.rectangle(0, -80, 40, 20, 0x52525b);
      this.hammer = this.add.container(this.centerX + 120, this.centerY - 50, [handle, head]);
      (this.hammer as any).setRotation(0.5);
    }

    // --- 3. UI: Timing Bar ---
    this.add.rectangle(this.centerX, this.barY, 440, 30, 0x1c1917).setStrokeStyle(2, 0x44403c);
    
    // Target Zone
    this.targetZone = this.add.rectangle(this.centerX, this.barY, 60, 26, 0x16a34a);
    this.targetZone.setAlpha(0.8);
    this.add.rectangle(this.centerX, this.barY, 4, 30, 0x86efac);

    // Cursor
    if (this.textures.exists('cursor')) {
      this.cursor = this.add.image(this.centerX, this.barY, 'cursor');
      this.cursor.setScale(0.8);
    } else {
      // [FALLBACK] Draw Cursor Shape
      this.cursor = this.add.rectangle(this.centerX, this.barY, 10, 30, 0xffffff);
    }

    // --- 4. UI: HUD ---
    this.add.rectangle(this.centerX, 40, 300, 16, 0x000000, 0.5).setStrokeStyle(2, 0x57534e);
    this.progressBar = this.add.rectangle(this.centerX - 150, 40, 0, 12, 0xeab308).setOrigin(0, 0.5);

    this.comboText = this.add.text(this.centerX, this.centerY - 150, '', {
      fontFamily: 'Impact', fontSize: '42px', color: '#fcd34d', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);

    // --- Input ---
    this.input.keyboard?.on('keydown-SPACE', this.handleHit, this);
    this.input.on('pointerdown', this.handleHit, this);
  }

  addInotGlow(target: Phaser.GameObjects.GameObject) {
    this.tweens.add({
      targets: target,
      alpha: 0.9,
      scale: (target as any).scale ? (target as any).scale * 1.05 : 1.05,
      tint: 0xffddaa,
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut'
    });
  }

  update(time: number, delta: number) {
    if (this.isFinished) return;
    const sinValue = Math.sin(time * this.baseSpeed);
    this.cursor.x = this.centerX + (sinValue * this.amplitude);
  }

  handleHit() {
    if (this.isFinished) return;
    
    const now = this.time.now;
    if (now - this.lastHitTime < this.hitCooldown) return;
    this.lastHitTime = now;

    const distance = Math.abs(this.cursor.x - this.targetZone.x);
    const perfectThreshold = 12;
    const goodThreshold = 40; 

    // Hammer Animation
    if (this.hammer) {
        this.tweens.add({
            targets: this.hammer,
            angle: -80,
            duration: 50,
            yoyo: true,
            ease: 'Quad.easeIn'
        });
    }

    if (distance < perfectThreshold) {
      this.triggerPerfect();
    } else if (distance < goodThreshold) {
      this.triggerGood();
    } else {
      this.triggerMiss();
    }

    this.progressBar.width = Phaser.Math.Clamp(this.score / this.targetScore * 300, 0, 300);

    if (this.score >= this.targetScore) {
      this.winGame();
    }
  }

  triggerPerfect() {
    this.score += 15;
    this.combo++;
    this.cameras.main.shake(100, 0.02);
    this.createSparks(30, 0xffaa00, 1.5);
    this.showFeedback('PERFECT!', 0xffb300, 1.5);
  }

  triggerGood() {
    this.score += 8;
    this.combo = 0; 
    this.cameras.main.shake(50, 0.005);
    this.createSparks(10, 0xffffff, 1.0);
    this.showFeedback('GOOD', 0xe5e5e5, 1.0);
  }

  triggerMiss() {
    this.score = Math.max(0, this.score - 5);
    this.combo = 0;
    this.cameras.main.shake(100, 0.01);
    this.showFeedback('MISS', 0xef4444, 1.2);
  }

  createSparks(count: number, color: number, speedScale: number) {
    let texture = 'spark';
    // Fallback if spark image didn't load
    if (!this.textures.exists('spark')) {
        if (!this.textures.exists('fallback_spark')) {
            const g = this.make.graphics({x:0, y:0});
            g.fillStyle(0xffffff, 1);
            g.fillCircle(4,4,4);
            g.generateTexture('fallback_spark', 8, 8);
        }
        texture = 'fallback_spark';
    }

    const emitter = this.add.particles(this.centerX, this.centerY + 20, texture, {
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
    const feedback = this.add.text(this.centerX, this.centerY - 100, text, {
      fontFamily: 'Arial',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#' + color.toString(16),
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScale(0.5).setAlpha(0);

    this.tweens.add({
      targets: feedback, y: this.centerY - 140, alpha: 1, scale: scale, duration: 200, hold: 400, yoyo: true,
      onComplete: () => feedback.destroy()
    });

    if (this.combo > 1) {
      this.comboText.setText(`${this.combo} COMBO!`);
      this.comboText.setAlpha(1);
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
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="w-full h-full flex flex-col bg-stone-950 animate-in fade-in duration-300">
        <div className="w-full h-16 shrink-0 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-6 z-10 shadow-md">
            <div className="flex items-center gap-3">
                <div className="bg-amber-900/30 p-2 rounded-full border border-amber-800">
                    <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                </div>
                <div>
                    <h2 className="text-stone-200 font-bold tracking-wide">Forging in Progress</h2>
                    <p className="text-xs text-stone-500 uppercase tracking-wider">Difficulty Level {difficulty}</p>
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
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at center, #78350f 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            <div ref={containerRef} className="w-full h-full max-w-5xl max-h-[80vh] aspect-[4/3] shadow-2xl shadow-black rounded-lg overflow-hidden border border-stone-800" />
        </div>
        
        <div className="w-full py-3 bg-stone-900 border-t border-stone-800 flex justify-center items-center gap-2 text-stone-500 text-xs font-mono uppercase tracking-widest">
            <Hammer className="w-3 h-3" />
            <span>Strike when the white cursor is in the green zone</span>
        </div>
    </div>
  );
};

export default SmithingMinigame;
