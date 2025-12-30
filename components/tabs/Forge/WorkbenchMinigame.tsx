import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { X, Wrench, Scissors } from 'lucide-react';
import { getAssetUrl } from '../../../utils';

interface WorkbenchMinigameProps {
  onComplete: (score: number, bonus?: number) => void;
  onClose: () => void;
  difficulty?: number;
}

class WorkbenchScene extends Phaser.Scene {
  add!: Phaser.GameObjects.GameObjectFactory;
  make!: Phaser.GameObjects.GameObjectCreator;
  scale!: Phaser.Scale.ScaleManager;
  tweens!: Phaser.Tweens.TweenManager;
  time!: Phaser.Time.Clock;
  cameras!: Phaser.Cameras.Scene2D.CameraManager;
  input!: Phaser.Input.InputPlugin;
  load!: Phaser.Loader.LoaderPlugin;
  textures!: Phaser.Textures.TextureManager;

  private targetNodes: Phaser.GameObjects.Arc[] = [];
  private cursor!: Phaser.GameObjects.Rectangle;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private cycleText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private wavePathGraphics!: Phaser.GameObjects.Graphics;
  
  private centerX: number = 0;
  private centerY: number = 0;
  
  // Wave Config
  private waveWidth: number = 600;
  private waveAmplitude: number = 60;
  private wavePeriods: number = 2; 
  private cursorProgress: number = 0; 
  private cursorSpeed: number = 0.00015; 
  
  // Scoring & Cycles
  private currentCycle: number = 1;
  private totalNodesSpawned: number = 0;
  private totalNodesHit: number = 0;
  private hitsInCurrentCycle: number = 0;
  private confirmedProgress: number = 0; // 0 to 100
  
  // Bonus System
  private perfectCombo: number = 0;
  private bonusStats: number = 0;
  private persistentElements: (Phaser.GameObjects.GameObject)[] = [];
  
  private isFinished: boolean = false;
  private onComplete?: (score: number, bonus?: number) => void;

  constructor() {
    super('WorkbenchScene');
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

  init(data: { onComplete: (score: number, bonus?: number) => void, difficulty: number }) {
    this.onComplete = data.onComplete;
    this.cursorSpeed = 0.00015 + (data.difficulty * 0.00002);
    this.currentCycle = 1;
    this.totalNodesSpawned = 0;
    this.totalNodesHit = 0;
    this.hitsInCurrentCycle = 0;
    this.confirmedProgress = 0;
    this.perfectCombo = 0;
    this.bonusStats = 0;
    this.isFinished = false;
    this.cursorProgress = 0;
    this.persistentElements = [];
  }

  preload() {
    this.load.crossOrigin = 'anonymous';
    this.load.image('workbench_table', getAssetUrl('workbench_table.png'));
  }

  create() {
    const { width, height } = this.scale;
    this.centerX = width / 2;
    this.centerY = height / 2;

    const isCompact = height < 450;
    this.waveAmplitude = isCompact ? 50 : 80;
    this.waveWidth = width * 0.8;

    // Background
    if (this.textures.exists('workbench_table')) {
        this.add.image(this.centerX, this.centerY, 'workbench_table').setScale(1.2).setAlpha(0.6);
    } else {
        this.add.rectangle(this.centerX, this.centerY, width, height, 0x1c1917); 
    }

    // UI: Progress
    this.add.rectangle(this.centerX, 30, 250, 14, 0x000000, 0.5).setStrokeStyle(2, 0x57534e);
    this.progressBar = this.add.rectangle(this.centerX - 125, 30, 0, 10, 0x10b981).setOrigin(0, 0.5);

    // Progress Value Text
    this.cycleText = this.add.text(this.centerX, 55, `PROGRESS: 0%`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#10b981', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Wave Path Preview
    this.wavePathGraphics = this.add.graphics();
    this.drawWavePath();

    // The Needle
    this.cursor = this.add.rectangle(0, 0, 3, 30, 0xffffff).setDepth(10);
    this.cursor.setStrokeStyle(1, 0xcccccc);

    // Initial Nodes
    this.spawnSegmentedNodes();

    // Feedback
    this.comboText = this.add.text(this.centerX, this.centerY - (isCompact ? 90 : 130), '', {
        fontFamily: 'Impact', fontSize: '28px', color: '#10b981', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);

    // Instructions
    this.add.text(this.centerX, height - 40, isCompact ? 'STITCH UNTIL 100%' : 'PERFECT COMBO (8+) ADDS BONUS STATS (+1)\nSTITCH UNTIL PROGRESS REACHES 100%', {
        fontFamily: 'monospace', fontSize: isCompact ? '10px' : '12px', color: '#10b981', stroke: '#000', strokeThickness: 2, align: 'center'
    }).setOrigin(0.5);
  }

  drawWavePath() {
    this.wavePathGraphics.clear();
    this.wavePathGraphics.lineStyle(2, 0x10b981, 0.1);
    this.wavePathGraphics.beginPath();
    const startX = this.centerX - (this.waveWidth / 2);
    for (let i = 0; i <= 100; i++) {
        const p = i / 100;
        const x = startX + (p * this.waveWidth);
        const y = this.centerY + Math.sin(p * Math.PI * 2 * this.wavePeriods) * this.waveAmplitude;
        if (i === 0) this.wavePathGraphics.moveTo(x, y);
        else this.wavePathGraphics.lineTo(x, y);
    }
    this.wavePathGraphics.strokePath();
  }

  update(time: number, delta: number) {
    if (this.isFinished) return;

    this.cursorProgress += this.cursorSpeed * delta;
    
    // Check for missed nodes (Needle passed)
    this.targetNodes.forEach((node: any) => {
        if (!node.isHit && !node.isMissed && this.cursorProgress > node.progressPos + 0.05) {
            this.handleMiss(node);
        }
    });

    // Cycle complete (Needle reached right end)
    if (this.cursorProgress > 1) {
        this.cursorProgress = 0;
        
        if (this.hitsInCurrentCycle > 0) {
            this.confirmedProgress = Math.min(100, this.confirmedProgress + 20);
            this.progressBar.width = (this.confirmedProgress / 100) * 250;
            this.cycleText.setText(`PROGRESS: ${this.confirmedProgress}%`);
            
            this.tweens.add({
                targets: this.progressBar,
                alpha: 0.5,
                yoyo: true,
                duration: 100
            });
        } else {
            this.showFeedback("MISSING ACTION!", 0xef4444, this.centerX, 80);
        }

        if (this.confirmedProgress >= 100) {
            this.finishGame();
            return;
        }

        this.currentCycle++;
        this.hitsInCurrentCycle = 0;
        this.spawnSegmentedNodes(); 
    }
    
    const startX = this.centerX - (this.waveWidth / 2);
    const x = startX + (this.cursorProgress * this.waveWidth);
    const y = this.centerY + Math.sin(this.cursorProgress * Math.PI * 2 * this.wavePeriods) * this.waveAmplitude;
    
    const freq = Math.PI * 2 * this.wavePeriods;
    const slope = (this.waveAmplitude * freq / this.waveWidth) * Math.cos(this.cursorProgress * freq);
    const angle = Math.atan(slope);
    
    this.cursor.setPosition(x, y);
    this.cursor.setRotation(angle + Math.PI / 2);
  }

  spawnSegmentedNodes() {
    this.targetNodes.forEach((n: any) => {
        if (n.xMark) n.xMark.destroy();
        n.destroy();
    });
    this.targetNodes = [];
    this.persistentElements.forEach(el => el.destroy());
    this.persistentElements = [];

    const startX = this.centerX - (this.waveWidth / 2);
    const segments = [{ min: 0.1, max: 0.25 }, { min: 0.35, max: 0.5 }, { min: 0.6, max: 0.75 }, { min: 0.85, max: 0.95 }];

    segments.forEach((seg, idx) => {
        const p = seg.min + Math.random() * (seg.max - seg.min);
        const nx = startX + (p * this.waveWidth);
        const ny = this.centerY + Math.sin(p * Math.PI * 2 * this.wavePeriods) * this.waveAmplitude;
        
        const node = this.add.circle(nx, ny, 16, 0x10b981, 0.2).setStrokeStyle(2, 0x10b981);
        node.setInteractive();
        
        (node as any).progressPos = p;
        (node as any).isHit = false;
        (node as any).isMissed = false;
        this.targetNodes.push(node);
        this.totalNodesSpawned++;
        
        node.on('pointerdown', () => this.handleNodeClick(node));
        node.setScale(0);
        this.tweens.add({ targets: node, scale: 1, duration: 300, delay: idx * 50, ease: 'Back.out' });
    });
  }

  handleNodeClick(node: Phaser.GameObjects.Arc) {
    if (this.isFinished || (node as any).isHit || (node as any).isMissed) return;

    const progressPos = (node as any).progressPos;
    const diff = Math.abs(this.cursorProgress - progressPos);
    const tolerance = 0.08; 

    if (diff < tolerance) {
        const precision = 1 - (diff / tolerance);
        const isPerfect = precision > 0.8;

        (node as any).isHit = true;
        this.totalNodesHit++;
        this.hitsInCurrentCycle++;
        node.disableInteractive();
        
        let stitchColor = 0x10b981; 
        if (isPerfect) {
            this.perfectCombo++;
            stitchColor = 0xfbbf24; 
            this.showFeedback('PERFECT!', 0xfbbf24, node.x, node.y);
            
            if (this.perfectCombo >= 8) {
                this.bonusStats++;
                const bonusTxt = this.add.text(node.x, node.y, '+1', {
                    fontFamily: 'monospace', fontSize: '14px', color: '#fbbf24', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
                }).setOrigin(0.5).setDepth(5);
                this.persistentElements.push(bonusTxt);
                this.tweens.add({ targets: bonusTxt, scale: 1.2, duration: 100, yoyo: true });
            }
        } else {
            this.perfectCombo = 0;
            this.showFeedback('GOOD!', 0x10b981, node.x, node.y);
        }

        this.cameras.main.shake(100, 0.005);
        this.tweens.add({ targets: node, scale: 0.3, duration: 200, onStart: () => { node.setFillStyle(stitchColor, 1); node.setStrokeStyle(0); } });
    } else {
        this.handleMiss(node);
    }
  }

  handleMiss(node: Phaser.GameObjects.Arc) {
      if ((node as any).isMissed || (node as any).isHit) return;
      (node as any).isMissed = true;
      this.perfectCombo = 0;
      node.disableInteractive();
      node.setFillStyle(0xef4444, 1);
      node.setStrokeStyle(0);
      const xMark = this.add.text(node.x, node.y, '×', { fontFamily: 'Arial', fontSize: '12px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(6);
      (node as any).xMark = xMark; 
      this.tweens.add({ targets: node, scale: 0.3, duration: 200 });
      this.showFeedback('MISS', 0xef4444, node.x, node.y);
      this.cameras.main.shake(100, 0.005);
  }

  showFeedback(text: string, color: number, x: number, y: number) {
      const fb = this.add.text(x, y - 30, text, {
          fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: '#' + color.toString(16).padStart(6, '0'),
          stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5);
      this.tweens.add({ targets: fb, y: fb.y - 20, alpha: 0, duration: 500, onComplete: () => fb.destroy() });
      if (this.perfectCombo > 1) {
          this.comboText.setText(`${this.perfectCombo} PERFECT!`);
          this.comboText.setAlpha(1);
          this.comboText.setColor(this.perfectCombo >= 8 ? '#fbbf24' : '#10b981');
          this.tweens.add({ targets: this.comboText, alpha: 0, duration: 800, delay: 500 });
      }
  }

  finishGame() {
      this.isFinished = true;
      this.cursor.setVisible(false);
      const hitRatio = this.totalNodesSpawned > 0 ? (this.totalNodesHit / this.totalNodesSpawned) : 0;
      const finalQuality = Math.round(hitRatio * 100);
      const label = this.getQualityLabel(finalQuality);
      const bg = this.add.rectangle(this.centerX, this.centerY, this.scale.width, this.scale.height, 0x000000, 0.8).setAlpha(0).setDepth(50);
      this.tweens.add({ targets: bg, alpha: 1, duration: 500 });

      const isDefective = finalQuality < 30;
      const resultText = isDefective ? 'PIECE DEFECTIVE' : `${label} CRAFT!`;
      const resultColor = isDefective ? '#ef4444' : '#10b981';

      const txt = this.add.text(this.centerX, this.centerY - 30, resultText, { fontFamily: 'serif', fontSize: '32px', color: resultColor, stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setAlpha(0).setDepth(51);
      const statsTxt = this.add.text(this.centerX, this.centerY + 20, `Quality: ${finalQuality}%`, { fontFamily: 'monospace', fontSize: '14px', color: '#fff' }).setOrigin(0.5).setAlpha(0).setDepth(51);
      const bonusTxt = this.add.text(this.centerX, this.centerY + 50, `Bonus Potential: +${this.bonusStats}`, { fontFamily: 'monospace', fontSize: '16px', color: '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0).setDepth(51);

      this.tweens.add({ targets: [txt, statsTxt, bonusTxt], alpha: 1, duration: 800, onComplete: () => { this.time.delayedCall(1500, () => { if (this.onComplete) this.onComplete(finalQuality, this.bonusStats); }); } });
  }
}

const WorkbenchMinigame: React.FC<WorkbenchMinigameProps> = ({ onComplete, onClose, difficulty = 1 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#0c0a09',
      scene: [WorkbenchScene],
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
    };
    const game = new Phaser.Game(config);
    game.scene.start('WorkbenchScene', { onComplete, difficulty });
    return () => { game.destroy(true); };
  }, [onComplete, difficulty]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-stone-950 animate-in fade-in duration-300 overflow-hidden">
        <div className="w-full h-10 md:h-14 shrink-0 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-4 z-10 shadow-lg">
            <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-emerald-400" />
                <span className="text-stone-200 font-bold text-xs md:text-sm tracking-wide">Workbench</span>
            </div>
            <button onClick={onClose} className="flex items-center gap-1 px-3 py-1 bg-stone-800 hover:bg-red-900/20 text-stone-400 hover:text-red-400 rounded border border-stone-700 transition-all text-[10px] font-bold">
                <X className="w-3 h-3" /> CANCEL
            </button>
        </div>
        <div className="flex-1 w-full relative flex items-center justify-center bg-[#1c1917]">
            <div ref={containerRef} className="w-full h-full" />
        </div>
    </div>
  );
};

export default WorkbenchMinigame;