import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { X, Scissors } from 'lucide-react';
import { getAssetUrl } from '../../../utils';

interface WorkbenchMinigameProps {
  onComplete: (score: number, bonus?: number) => void;
  onClose: () => void;
  difficulty?: number;
}

class WorkbenchScene extends Phaser.Scene {
  private targetNodes: Phaser.GameObjects.Arc[] = [];
  private cursor!: Phaser.GameObjects.Rectangle;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progBg!: Phaser.GameObjects.Rectangle;
  private cycleText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private wavePathGraphics!: Phaser.GameObjects.Graphics;
  
  private centerX: number = 0;
  private centerY: number = 0;
  private waveWidth: number = 600;
  private waveAmplitude: number = 60;
  private wavePeriods: number = 2; 
  private cursorProgress: number = 0; 
  private cursorSpeed: number = 0.00015; 
  private currentCycle: number = 1;
  private totalNodesSpawned: number = 0;
  private totalNodesHit: number = 0;
  private hitsInCurrentCycle: number = 0;
  private confirmedProgress: number = 0; 
  private perfectCombo: number = 0;
  private bonusStats: number = 0;
  private persistentElements: (Phaser.GameObjects.GameObject)[] = [];
  private isFinished: boolean = false;
  private onComplete?: (score: number, bonus?: number) => void;

  private root!: Phaser.GameObjects.Container;
  private virtualW = 0;
  private virtualH = 0;
  private isPortrait = false;

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
  }

  preload() {
    this.load.image('workbench_table', getAssetUrl('workbench_table.png'));
  }

  private toVirtual(sx: number, sy: number) {
    if (!this.isPortrait) return { x: sx, y: sy };
    return { x: sy, y: this.virtualH - sx };
  }

  create() {
    if (this.scale.width <= 0 || this.scale.height <= 0) return;

    this.root = this.add.container(0, 0);

    if (this.textures.exists('workbench_table')) {
        const bgImg = this.add.image(0, 0, 'workbench_table').setName('bgImg').setScale(1.2).setAlpha(0.6);
        this.root.add(bgImg);
    }

    this.progBg = this.add.rectangle(0, 0, 250, 16, 0x000000, 0.5).setStrokeStyle(2, 0x57534e);
    this.progressBar = this.add.rectangle(0, 0, 0, 12, 0x10b981).setOrigin(0, 0.5);
    this.cycleText = this.add.text(0, 0, `PROGRESS: 0%`, { fontFamily: 'monospace', fontSize: '16px', color: '#10b981', fontStyle: 'bold' }).setOrigin(0.5);
    this.root.add([this.progBg, this.progressBar, this.cycleText]);

    this.wavePathGraphics = this.add.graphics().setDepth(1);
    this.root.add(this.wavePathGraphics);

    this.cursor = this.add.rectangle(0, 0, 4, 35, 0xffffff).setDepth(10).setStrokeStyle(1, 0xcccccc);
    this.root.add(this.cursor);

    this.comboText = this.add.text(0, 0, '', { fontFamily: 'Impact', fontSize: '32px', color: '#10b981', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setAlpha(0).setDepth(20);
    this.instructionText = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '12px', color: '#10b981', stroke: '#000', strokeThickness: 2, align: 'center' }).setOrigin(0.5);
    this.root.add([this.comboText, this.instructionText]);

    this.handleResize(this.scale.gameSize);
    this.scale.on('resize', this.handleResize, this);
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const virtual = this.toVirtual(pointer.x, pointer.y);
        this.handleScreenClick(virtual.x, virtual.y);
    });

    this.spawnSegmentedNodes();
  }

  private handleScreenClick(vx: number, vy: number) {
    if (this.isFinished) return;
    // Find closest node to virtual tap
    for (const node of this.targetNodes) {
        if (Phaser.Geom.Circle.Contains(new Phaser.Geom.Circle(node.x, node.y, 40), vx, vy)) {
            this.handleNodeClick(node);
            return;
        }
    }
  }

  private handleResize(gameSize?: Phaser.Structs.Size) {
    const screenW = gameSize?.width ?? this.scale.gameSize.width;
    const screenH = gameSize?.height ?? this.scale.gameSize.height;

    this.isPortrait = screenH > screenW;
    this.virtualW = this.isPortrait ? screenH : screenW;
    this.virtualH = this.isPortrait ? screenW : screenH;

    if (this.isPortrait) {
      this.root.setRotation(Math.PI / 2);
      this.root.setPosition(this.virtualH, 0);
    } else {
      this.root.setRotation(0);
      this.root.setPosition(0, 0);
    }

    const w = this.virtualW;
    const h = this.virtualH;
    this.centerX = w / 2;
    this.centerY = h / 2;
    const isCompact = h < 450;

    this.waveAmplitude = isCompact ? 50 : 80;
    this.waveWidth = w * 0.85;

    const bg = this.children.getByName('bgImg') as Phaser.GameObjects.Image;
    if (bg) {
        bg.setPosition(this.centerX, this.centerY);
        bg.setScale(Math.max(w / bg.width, h / bg.height) * 1.1);
    }

    const progW = Math.min(w * 0.7, 300);
    this.progBg.setPosition(this.centerX, 40).setSize(progW, 18);
    this.progressBar.setPosition(this.centerX - progW / 2, 40).width = (this.confirmedProgress / 100) * progW;
    
    this.cycleText.setPosition(this.centerX, 70).setFontSize(isCompact ? '14px' : '18px');
    this.comboText.setPosition(this.centerX, this.centerY - (isCompact ? 100 : 150));
    this.instructionText.setPosition(this.centerX, h - 40).setText(isCompact ? 'STITCH UNTIL 100%' : 'STITCH UNTIL PROGRESS REACHES 100%');

    this.drawWavePath();
    this.repositionNodes();
  }

  private repositionNodes() {
    const startX = this.centerX - (this.waveWidth / 2);
    this.targetNodes.forEach((node: any) => {
        const p = node.progressPos;
        const nx = startX + (p * this.waveWidth);
        const ny = this.centerY + Math.sin(p * Math.PI * 2 * this.wavePeriods) * this.waveAmplitude;
        node.setPosition(nx, ny);
        if (node.xMark) node.xMark.setPosition(nx, ny);
    });
  }

  drawWavePath() {
    this.wavePathGraphics.clear().lineStyle(3, 0x10b981, 0.15).beginPath();
    const startX = this.centerX - (this.waveWidth / 2);
    for (let i = 0; i <= 100; i++) {
        const p = i / 100;
        const x = startX + (p * this.waveWidth);
        const y = this.centerY + Math.sin(p * Math.PI * 2 * this.wavePeriods) * this.waveAmplitude;
        if (i === 0) this.wavePathGraphics.moveTo(x, y); else this.wavePathGraphics.lineTo(x, y);
    }
    this.wavePathGraphics.strokePath();
  }

  update(time: number, delta: number) {
    if (this.isFinished) return;
    this.cursorProgress += this.cursorSpeed * delta;
    
    this.targetNodes.forEach((node: any) => {
        if (!node.isHit && !node.isMissed && this.cursorProgress > node.progressPos + 0.06) this.handleMiss(node);
    });

    if (this.cursorProgress > 1) {
        this.cursorProgress = 0;
        if (this.hitsInCurrentCycle > 0) {
            this.confirmedProgress = Math.min(100, this.confirmedProgress + 20);
            this.progressBar.width = (this.confirmedProgress / 100) * this.progBg.width;
            this.cycleText.setText(`PROGRESS: ${this.confirmedProgress}%`);
        }
        if (this.confirmedProgress >= 100) { this.finishGame(); return; }
        this.currentCycle++; this.hitsInCurrentCycle = 0; this.spawnSegmentedNodes(); 
    }
    
    const startX = this.centerX - (this.waveWidth / 2);
    const x = startX + (this.cursorProgress * this.waveWidth);
    const y = this.centerY + Math.sin(this.cursorProgress * Math.PI * 2 * this.wavePeriods) * this.waveAmplitude;
    const freq = Math.PI * 2 * this.wavePeriods;
    const angle = Math.atan((this.waveAmplitude * freq / this.waveWidth) * Math.cos(this.cursorProgress * freq));
    this.cursor.setPosition(x, y).setRotation(angle + Math.PI / 2);
  }

  spawnSegmentedNodes() {
    this.targetNodes.forEach((n: any) => { if (n.xMark) n.xMark.destroy(); n.destroy(); });
    this.targetNodes = [];
    this.persistentElements.forEach(el => el.destroy());
    this.persistentElements = [];

    const segments = [{ min: 0.1, max: 0.25 }, { min: 0.35, max: 0.5 }, { min: 0.6, max: 0.75 }, { min: 0.85, max: 0.95 }];
    segments.forEach((seg, idx) => {
        const p = seg.min + Math.random() * (seg.max - seg.min);
        const node = this.add.circle(0, 0, 20, 0x10b981, 0.2).setStrokeStyle(3, 0x10b981).setDepth(5);
        (node as any).progressPos = p; (node as any).isHit = false; (node as any).isMissed = false;
        this.targetNodes.push(node);
        this.tweens.add({ targets: node, scale: { from: 0, to: 1 }, duration: 300, delay: idx * 50, ease: 'Back.out' });
        this.root.add(node);
    });
    this.repositionNodes();
  }

  handleNodeClick(node: Phaser.GameObjects.Arc) {
    if (this.isFinished || (node as any).isHit || (node as any).isMissed) return;
    const diff = Math.abs(this.cursorProgress - (node as any).progressPos);
    if (diff < 0.08) {
        const isPerfect = (1 - (diff / 0.08)) > 0.8;
        (node as any).isHit = true; this.totalNodesHit++; this.hitsInCurrentCycle++;
        if (isPerfect) {
            this.perfectCombo++; this.showFeedback('PERFECT!', 0xfbbf24, node.x, node.y);
            if (this.perfectCombo >= 8) {
                this.bonusStats++;
                const bonusTxt = this.add.text(node.x, node.y, '+1', { fontFamily: 'monospace', fontSize: '18px', color: '#fbbf24', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
                this.root.add(bonusTxt);
                this.persistentElements.push(bonusTxt);
            }
        } else { this.perfectCombo = 0; this.showFeedback('GOOD!', 0x10b981, node.x, node.y); }
        this.cameras.main.shake(100, 0.005);
        this.tweens.add({ targets: node, scale: 0.4, duration: 200, onStart: () => { node.setFillStyle(isPerfect ? 0xfbbf24 : 0x10b981, 1); node.setStrokeStyle(0); } });
    } else this.handleMiss(node);
  }

  handleMiss(node: Phaser.GameObjects.Arc) {
      if ((node as any).isMissed || (node as any).isHit) return;
      (node as any).isMissed = true; this.perfectCombo = 0;
      node.setFillStyle(0xef4444, 1).setStrokeStyle(0);
      const xMark = this.add.text(node.x, node.y, '×', { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
      this.root.add(xMark);
      (node as any).xMark = xMark; 
      this.tweens.add({ targets: node, scale: 0.4, duration: 200 });
      this.showFeedback('MISS', 0xef4444, node.x, node.y);
      this.cameras.main.shake(100, 0.005);
  }

  showFeedback(text: string, color: number, x: number, y: number) {
      const fb = this.add.text(x, y - 40, text, { fontFamily: 'Arial Black', fontSize: '24px', fontStyle: 'bold', color: '#' + color.toString(16).padStart(6, '0'), stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(20);
      this.root.add(fb);
      this.tweens.add({ targets: fb, y: fb.y - 30, alpha: 0, duration: 600, onComplete: () => fb.destroy() });
      if (this.perfectCombo > 1) {
          this.comboText.setText(`${this.perfectCombo} PERFECT!`).setAlpha(1).setColor(this.perfectCombo >= 8 ? '#fbbf24' : '#10b981');
          this.tweens.add({ targets: this.comboText, alpha: 0, duration: 800, delay: 500 });
      }
  }

  finishGame() {
      this.isFinished = true; this.cursor.setVisible(false);
      const quality = Math.round((this.totalNodesSpawned > 0 ? (this.totalNodesHit / this.totalNodesSpawned) : 0) * 100);
      const label = this.getQualityLabel(quality);
      const bg = this.add.rectangle(this.centerX, this.centerY, this.virtualW, this.virtualH, 0x000000, 0.85).setAlpha(0).setDepth(50);
      this.root.add(bg);
      const txt = this.add.text(this.centerX, this.centerY - 40, quality < 30 ? 'DEFECTIVE' : `${label} CRAFT!`, { fontFamily: 'serif', fontSize: '40px', color: quality < 30 ? '#ef4444' : '#10b981', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setAlpha(0).setDepth(51);
      this.root.add(txt);
      this.tweens.add({ targets: [bg, txt], alpha: 1, duration: 500, onComplete: () => { this.time.delayedCall(1500, () => { if (this.onComplete) this.onComplete(quality, this.bonusStats); }); } });
  }
}

const WorkbenchMinigame: React.FC<WorkbenchMinigameProps> = ({ onComplete, onClose, difficulty = 1 }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkSize = () => {
        if (containerRef.current && containerRef.current.clientWidth > 0 && containerRef.current.clientHeight > 0) setIsReady(true);
        else requestAnimationFrame(checkSize);
    };
    checkSize();
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current) return;
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO, parent: containerRef.current,
      width: containerRef.current.clientWidth, height: containerRef.current.clientHeight,
      backgroundColor: '#0c0a09', scene: [WorkbenchScene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
    };
    const game = new Phaser.Game(config);
    gameRef.current = game;
    game.scene.start('WorkbenchScene', { onComplete, difficulty });

    const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            if (game && game.scale && width > 0 && height > 0) {
                game.scale.resize(width, height);
            }
        }
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => { 
        resizeObserver.disconnect();
        if (gameRef.current) gameRef.current.destroy(true); 
    };
  }, [isReady, onComplete, difficulty]);

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
        <div className="flex-1 w-full relative flex items-center justify-center bg-[#1c1917] overflow-hidden">
            <div 
              ref={containerRef} 
              style={{ width: '100%', height: '100dvh' }}
              className="overflow-hidden" 
            />
        </div>
    </div>
  );
};

export default WorkbenchMinigame;