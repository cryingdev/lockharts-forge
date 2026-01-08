import Phaser from 'phaser';
import { getAssetUrl } from '../utils';

type PathType = 'WAVE' | 'GLOVE';

export default class WorkbenchScene extends Phaser.Scene {
  public add!: Phaser.GameObjects.GameObjectFactory;
  public tweens!: Phaser.Tweens.TweenManager;
  public scale!: Phaser.Scale.ScaleManager;
  public input!: Phaser.Input.InputPlugin;
  public time!: Phaser.Time.Clock;
  public load!: Phaser.Loader.LoaderPlugin;
  public events!: Phaser.Events.EventEmitter;
  public cameras!: Phaser.Cameras.Scene2D.CameraManager;

  private targetNodes: Phaser.GameObjects.Arc[] = [];
  private cursor!: Phaser.GameObjects.Image;
  private comboText!: Phaser.GameObjects.Text;

  private progBg!: Phaser.GameObjects.Rectangle;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private qualityText!: Phaser.GameObjects.Text;

  private wavePathGraphics!: Phaser.GameObjects.Graphics;
  private bgImage!: Phaser.GameObjects.Image;

  private root!: Phaser.GameObjects.Container;

  private cursorProgress = 0;
  private cursorSpeed = 0.00015;

  private confirmedProgress = 0;
  private currentQuality = 100;
  private perfectStreak = 0;
  private combo = 0;
  private isFinished = false;

  private onComplete?: (score: number, bonus?: number) => void;

  private centerX = 0;
  private centerY = 0;
  private waveStartX = 0;
  private waveWidth = 0;
  private waveAmplitude = 0;
  private uiScale = 1;
  private isPortrait = false;

  private currentPathType: PathType = 'WAVE';

  /**
   * ✅ Refined high-fidelity glove/hand outline (Enhanced for rounding)
   * - x: 0..1, y: -0.5..0.5
   * - Points adjusted to create rounder finger tips and smoother curves.
   */
  private readonly GLOVE_OUTLINE_POINTS = [
    // --- Wrist bottom (left) ---
    { x: 0.18, y: 0.52 },
    { x: 0.12, y: 0.505 },
    { x: 0.075, y: 0.47 },
    { x: 0.055, y: 0.42 },
    { x: 0.048, y: 0.34 },

    // --- Thumb (Rounded) ---
    { x: 0.060, y: 0.27 },
    { x: 0.110, y: 0.14 },
    { x: 0.155, y: 0.08 },
    { x: 0.185, y: 0.06 }, // thumb peak center
    { x: 0.215, y: 0.07 },
    { x: 0.240, y: 0.15 },
    { x: 0.250, y: 0.20 },

    // --- Webbing 1 ---
    { x: 0.260, y: 0.15 },
    { x: 0.275, y: 0.05 },

    // --- Index Finger (Rounded Top) ---
    { x: 0.300, y: -0.15 },
    { x: 0.315, y: -0.28 },
    { x: 0.332, y: -0.32 }, // Peak center
    { x: 0.350, y: -0.28 },
    { x: 0.365, y: -0.15 },
    { x: 0.380, y: 0.00 },

    // --- Middle Finger (Rounded Top) ---
    { x: 0.405, y: -0.20 },
    { x: 0.425, y: -0.38 },
    { x: 0.445, y: -0.42 }, // Peak center (tallest)
    { x: 0.465, y: -0.38 },
    { x: 0.485, y: -0.20 },
    { x: 0.505, y: 0.02 },

    // --- Ring Finger (Rounded Top) ---
    { x: 0.530, y: -0.15 },
    { x: 0.555, y: -0.30 },
    { x: 0.572, y: -0.34 }, // Peak center
    { x: 0.590, y: -0.30 },
    { x: 0.615, y: -0.15 },
    { x: 0.635, y: 0.04 },

    // --- Pinky Finger (Rounded Top) ---
    { x: 0.665, y: -0.05 },
    { x: 0.690, y: -0.18 },
    { x: 0.712, y: -0.22 }, // Peak center
    { x: 0.735, y: -0.18 },
    { x: 0.765, y: -0.05 },
    { x: 0.785, y: 0.06 },

    // --- Outer hand edge ---
    { x: 0.820, y: 0.20 },
    { x: 0.870, y: 0.35 },
    { x: 0.920, y: 0.45 },
    { x: 0.965, y: 0.50 },
    { x: 0.980, y: 0.52 },

    // --- Wrist bottom curve (Smooth Close) ---
    { x: 0.850, y: 0.550 },
    { x: 0.650, y: 0.565 },
    { x: 0.450, y: 0.565 },
    { x: 0.280, y: 0.550 },
    { x: 0.200, y: 0.535 },
  ];

  private gloveWorldPts: Phaser.Math.Vector2[] = [];
  private gloveCumLen: number[] = [];
  private gloveTotalLen = 1;
  private gloveScaleY = 0;

  constructor() {
    super('WorkbenchScene');
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

  init(data: { onComplete: (score: number, bonus?: number) => void; difficulty: number; subCategoryId?: string }) {
    this.onComplete = data.onComplete;
    this.cursorSpeed = 0.00015 + data.difficulty * 0.00002;
    this.isFinished = false;
    this.cursorProgress = 0;
    this.confirmedProgress = 0;
    this.currentQuality = 100;
    this.perfectStreak = 0;
    this.combo = 0;

    if (data.subCategoryId === 'GLOVES') {
      this.currentPathType = 'GLOVE';
    } else {
      this.currentPathType = 'WAVE';
    }
  }

  preload() {
    this.load.image('workbench_bg', getAssetUrl('workbench_bg.png'));
    this.load.image('niddle', getAssetUrl('niddle.png'));
  }

  create() {
    this.root = this.add.container(0, 0);
    this.bgImage = this.add.image(0, 0, 'workbench_bg').setAlpha(0.8).setOrigin(0.5);
    this.root.add(this.bgImage);

    this.progBg = this.add.rectangle(0, 0, 250, 16, 0x000000, 0.5).setStrokeStyle(2, 0x57534e).setName('progBg');
    this.progressBar = this.add.rectangle(0, 0, 0.1, 12, 0x10b981).setOrigin(0, 0.5);
    this.qualityText = this.add.text(0, 0, 'PRISTINE', { fontFamily: 'Grenze Gotisch', fontSize: '18px', color: '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5);
    this.root.add([this.progBg, this.progressBar, this.qualityText]);

    this.wavePathGraphics = this.add.graphics();
    this.root.add(this.wavePathGraphics);

    this.cursor = this.add.image(0, 0, 'niddle').setDepth(10).setOrigin(0.5, 0.9);
    this.root.add(this.cursor);

    this.comboText = this.add.text(0, 0, '', { fontFamily: 'Grenze Gotisch', fontSize: '42px', color: '#fcd34d', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setAlpha(0).setDepth(26);
    this.root.add(this.comboText);

    this.handleResize(this.scale.gameSize);
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.scale.off('resize', this.handleResize, this); });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.isFinished) return;
      for (const node of this.targetNodes) {
        if (Phaser.Math.Distance.Between(p.x, p.y, node.x, node.y) < 60 * this.uiScale) {
          this.handleHit(node as any);
        }
      }
    });
    this.spawnNodes();
  }

  private handleResize(gameSize?: Phaser.Structs.Size) {
    const w = gameSize?.width ?? this.scale.width;
    const h = gameSize?.height ?? this.scale.height;
    if (w <= 0 || h <= 0) return;

    this.isPortrait = h > w;
    this.uiScale = this.isPortrait ? Phaser.Math.Clamp(h / 1000, 0.75, 1.2) : Phaser.Math.Clamp(w / 1200, 0.85, 1.3);

    this.centerX = w / 2;
    this.centerY = h / 2;

    this.bgImage.setPosition(this.centerX, this.centerY);
    this.bgImage.setDisplaySize(Math.max(w, h * 1.8), Math.max(h, w / 1.8));

    if (this.isPortrait) {
      const pbW = w * 0.8;
      this.progBg.setPosition(this.centerX, 80 * this.uiScale).setSize(pbW, 20 * this.uiScale);
      this.progressBar.setPosition(this.centerX - pbW / 2, 80 * this.uiScale);
      this.qualityText.setPosition(this.centerX, 120 * this.uiScale).setFontSize(Math.round(20 * this.uiScale));
    } else {
      const pbW = w * 0.5;
      this.progBg.setPosition(this.centerX, 40 * this.uiScale).setSize(pbW, 18 * this.uiScale);
      this.progressBar.setPosition(this.centerX - pbW / 2, 40 * this.uiScale);
      this.qualityText.setPosition(this.centerX, 80 * this.uiScale).setFontSize(Math.round(22 * this.uiScale));
    }

    this.updateProgressBar();
    
    // ✅ Larger Silhouette Scale
    this.waveStartX = w * 0.05; // Margins reduced to make it larger
    this.waveWidth = w * 0.9;
    this.waveAmplitude = (this.isPortrait ? 100 : 150) * this.uiScale;

    this.buildGlovePathCache();
    this.drawPath();
    this.updateNodes();
  }

  private normalizeP(p: number) {
    return ((p % 1) + 1) % 1;
  }

  private buildGlovePathCache() {
    if (this.currentPathType !== 'GLOVE') return;

    // ✅ Larger Vertical Scale for Glove
    this.gloveScaleY = (this.isPortrait ? 300 : 420) * this.uiScale;
    const pts = this.GLOVE_OUTLINE_POINTS.map((p) => {
      const x = this.waveStartX + p.x * this.waveWidth;
      const y = this.centerY + p.y * this.gloveScaleY;
      return new Phaser.Math.Vector2(x, y);
    });

    this.gloveWorldPts = pts;
    this.gloveCumLen = [0];
    let total = 0;

    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      total += Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      this.gloveCumLen.push(total);
    }
    this.gloveTotalLen = Math.max(1, total);
  }

  private drawPath() {
    this.wavePathGraphics.clear();

    if (this.currentPathType === 'GLOVE' && this.gloveWorldPts.length > 2) {
      this.wavePathGraphics.fillStyle(0x3e2723, 0.15);
      this.wavePathGraphics.beginPath();
      this.wavePathGraphics.moveTo(this.gloveWorldPts[0].x, this.gloveWorldPts[0].y);
      for (let i = 1; i < this.gloveWorldPts.length; i++) {
        this.wavePathGraphics.lineTo(this.gloveWorldPts[i].x, this.gloveWorldPts[i].y);
      }
      this.wavePathGraphics.closePath();
      this.wavePathGraphics.fillPath();
    }

    this.wavePathGraphics.lineStyle(5, 0x2a1b18, 0.9).beginPath();
    const steps = 1000; // Even more steps for rounded precision
    const dashLen = 10; const gapLen = 8;
    let isDrawing = true; let counter = 0;

    for (let i = 0; i <= steps; i++) {
      const p = i / steps; const pos = this.getPathPosition(p);
      if (i === 0) { this.wavePathGraphics.moveTo(pos.x, pos.y); } else {
        if (isDrawing) { this.wavePathGraphics.lineTo(pos.x, pos.y); } else { this.wavePathGraphics.moveTo(pos.x, pos.y); }
      }
      counter++;
      if (isDrawing && counter >= dashLen) { isDrawing = false; counter = 0; } 
      else if (!isDrawing && counter >= gapLen) { isDrawing = true; counter = 0; }
    }
    this.wavePathGraphics.strokePath();
  }

  private spawnNodes() {
    this.targetNodes.forEach((n) => n.destroy());
    this.targetNodes = [];
    // Adjusted segments to match rounder points
    const segments = [[0.10, 0.22], [0.35, 0.47], [0.60, 0.72], [0.85, 0.95]];
    segments.forEach((range) => {
      const p = Phaser.Math.FloatBetween(range[0], range[1]);
      const node = this.add.circle(0, 0, 18, 0x10b981, 0.3).setStrokeStyle(3, 0x10b981);
      (node as any).p = p; (node as any).hit = false; (node as any).missed = false;
      this.targetNodes.push(node); this.root.add(node);
    });
    this.updateNodes();
  }

  private updateNodes() {
    if (this.scale.width <= 0 || this.scale.height <= 0) return;
    this.targetNodes.forEach((n) => {
      const p = (n as any).p as number; const pos = this.getPathPosition(p);
      n.setPosition(pos.x, pos.y).setScale(this.uiScale);
    });
  }

  private getPathPosition(p: number) {
    const pp = Phaser.Math.Clamp(p, 0, 1);
    if (this.currentPathType === 'GLOVE') return this.getGlovePathPosition(pp);
    const x = this.waveStartX + pp * this.waveWidth;
    const y = this.centerY + Math.sin(pp * Math.PI * 4) * this.waveAmplitude;
    return { x, y };
  }

  private getGlovePathPosition(p: number) {
    const pts = this.gloveWorldPts;
    if (pts.length < 2 || this.gloveCumLen.length < 2) {
      return { x: this.waveStartX + p * this.waveWidth, y: this.centerY };
    }
    const target = Phaser.Math.Clamp(p, 0, 1) * this.gloveTotalLen;
    let seg = 0;
    while (seg < this.gloveCumLen.length - 1 && this.gloveCumLen[seg + 1] < target) seg++;

    const segStartLen = this.gloveCumLen[seg];
    const segEndLen = this.gloveCumLen[seg + 1];
    const t = (target - segStartLen) / (segEndLen - segStartLen || 1);
    const a = pts[seg % pts.length];
    const b = pts[(seg + 1) % pts.length];

    return { x: Phaser.Math.Linear(a.x, b.x, t), y: Phaser.Math.Linear(a.y, b.y, t) };
  }

  update(time: number, delta: number) {
    if (this.isFinished) return;
    this.cursorProgress += this.cursorSpeed * delta;

    this.targetNodes.forEach((node: any) => {
      if (!node.hit && !node.missed && this.cursorProgress > node.p + 0.06) {
        node.missed = true; this.handleMiss(node.x, node.y);
      }
    });

    if (this.cursorProgress > 1) {
      this.cursorProgress = 0; this.confirmedProgress = Math.min(100, this.confirmedProgress + 25);
      this.updateProgressBar();
      if (this.confirmedProgress >= 100) { this.finish(); return; }
      this.spawnNodes();
    }

    const p = Phaser.Math.Clamp(this.cursorProgress, 0, 1);
    const nextP = this.normalizeP(p + 0.005);
    const pos = this.getPathPosition(p);
    const nextPos = this.getPathPosition(nextP);
    const angle = Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x);

    this.cursor.setPosition(pos.x, pos.y).setScale(this.uiScale * 0.35).setRotation(angle - Math.PI / 2);
    this.qualityText.setText(this.getQualityLabel(this.currentQuality)).setColor(this.getLabelColor(this.currentQuality));
  }

  private updateProgressBar() {
    const width = (this.confirmedProgress / 100) * this.progBg.width;
    this.progressBar.width = Math.max(0.1, width);
  }

  private handleHit(node: any) {
    if (node.hit || node.missed) return;
    const diff = Math.abs(this.cursorProgress - node.p);
    if (diff < 0.045) {
      node.hit = true; node.setFillStyle(0xfbbf24, 1).setStrokeStyle(3, 0xffffff);
      this.perfectStreak++; this.combo++;
      if (this.perfectStreak > 0 && this.perfectStreak % 8 === 0) this.currentQuality += 1;
      this.showFeedback('PERFECT!', 0xfbbf24, node.x, node.y); this.showCombo(node.x, node.y);
    } else if (diff < 0.09) {
      node.hit = true; node.setFillStyle(0xe5e5e5, 0.8).setStrokeStyle(2, 0xaaaaaa);
      this.perfectStreak = 0; this.combo = 0; this.currentQuality = Math.max(0, this.currentQuality - 2);
      this.showFeedback('GOOD', 0xe5e5e5, node.x, node.y);
    }
  }

  private handleMiss(x: number, y: number) {
    this.perfectStreak = 0; this.combo = 0; this.currentQuality = Math.max(0, this.currentQuality - 5);
    this.showFeedback('MISS', 0xef4444, x, y); this.cameras.main.shake(100, 0.005);
  }

  private showCombo(x: number, y: number) {
    if (this.combo < 2) return;
    this.comboText.setPosition(x, y - 70 * this.uiScale).setText(`${this.combo} COMBO!`).setAlpha(1).setScale(this.uiScale * 1.2);
    this.tweens.add({ targets: this.comboText, scale: this.uiScale, alpha: 0, duration: 800, ease: 'Power2' });
  }

  private showFeedback(text: string, color: number, x: number, y: number) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const fb = this.add.text(x, y, text, { fontFamily: 'Grenze Gotisch', fontSize: `${Math.round(22 * this.uiScale)}px`, color: hex, stroke: '#000', strokeThickness: Math.round(5 * this.uiScale), fontStyle: 'bold' }).setOrigin(0.5).setDepth(30);
    this.root.add(fb);
    this.tweens.add({ targets: fb, y: y - 50 * this.uiScale, alpha: 0, duration: 600, ease: 'Cubic.easeOut', onComplete: () => fb.destroy() });
  }

  private finish() {
    this.isFinished = true; this.cursor.setVisible(false);
    const bg = this.add.rectangle(this.centerX, this.centerY, this.scale.width, this.scale.height, 0x000000).setAlpha(0).setDepth(100);
    this.root.add(bg);
    this.tweens.add({ targets: bg, alpha: 0.7, duration: 400 });

    const label = this.getQualityLabel(this.currentQuality);
    const textContent = this.isPortrait ? `${label}\nCRAFT!` : `${label} CRAFT!`;
    const txt = this.add.text(this.centerX, this.centerY, textContent, { fontFamily: 'Grenze Gotisch', fontSize: `${Math.round(this.isPortrait ? 36 * this.uiScale : 42 * this.uiScale)}px`, color: this.getLabelColor(this.currentQuality), stroke: '#000', strokeThickness: 4, fontStyle: 'italic', align: 'center' }).setOrigin(0.5).setAlpha(0).setDepth(101).setScale(0.5);
    this.root.add(txt);
    this.tweens.add({ targets: txt, alpha: 1, scale: 1, duration: 500, ease: 'Back.out', onComplete: () => { this.time.delayedCall(1200, () => { this.onComplete?.(this.currentQuality); }); } });
  }
}
