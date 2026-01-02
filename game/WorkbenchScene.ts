import Phaser from 'phaser';
import { getAssetUrl } from '../utils';

export default class WorkbenchScene extends Phaser.Scene {
  public add!: Phaser.GameObjects.GameObjectFactory;
  public tweens!: Phaser.Tweens.TweenManager;
  public scale!: Phaser.Scale.ScaleManager;
  public input!: Phaser.Input.InputPlugin;
  public time!: Phaser.Time.Clock;

  private targetNodes: Phaser.GameObjects.Arc[] = [];
  private cursor!: Phaser.GameObjects.Rectangle;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progBg!: Phaser.GameObjects.Rectangle;
  private qualityText!: Phaser.GameObjects.Text;
  private wavePathGraphics!: Phaser.GameObjects.Graphics;
  private bgImage!: Phaser.GameObjects.Image;
  
  private cursorProgress: number = 0; 
  private cursorSpeed: number = 0.00015; 
  private confirmedProgress: number = 0; 
  private currentQuality: number = 100;
  private isFinished: boolean = false;
  private onComplete?: (score: number, bonus?: number) => void;
  private root!: Phaser.GameObjects.Container;

  constructor() {
    super('WorkbenchScene');
  }

  init(data: { onComplete: (score: number, bonus?: number) => void, difficulty: number }) {
    this.onComplete = data.onComplete;
    this.cursorSpeed = 0.00015 + (data.difficulty * 0.00002);
    this.isFinished = false;
    this.cursorProgress = 0;
    this.confirmedProgress = 0;
    this.currentQuality = 100;
  }

  preload() {
    this.load.image('workbench_table', getAssetUrl('workbench_table.png'));
  }

  create() {
    this.root = this.add.container(0, 0);
    this.bgImage = this.add.image(0, 0, 'workbench_table').setAlpha(0.6).setOrigin(0.5);

    this.progBg = this.add.rectangle(0, 0, 250, 16, 0x000000, 0.5).setStrokeStyle(2, 0x57534e);
    this.progressBar = this.add.rectangle(0, 0, 0, 12, 0x10b981).setOrigin(0, 0.5);
    this.qualityText = this.add.text(0, 0, 'PRISTINE', { fontFamily: 'monospace', fontSize: '16px', color: '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5);
    this.root.add([this.progBg, this.progressBar, this.qualityText]);

    this.wavePathGraphics = this.add.graphics();
    this.root.add(this.wavePathGraphics);

    this.cursor = this.add.rectangle(0, 0, 4, 35, 0xffffff).setDepth(10);
    this.root.add(this.cursor);

    this.handleResize(this.scale.gameSize);
    this.scale.on('resize', this.handleResize, this);
    
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
        this.targetNodes.forEach(node => {
            if (Phaser.Math.Distance.Between(p.x, p.y, node.x, node.y) < 45) this.handleHit(node);
        });
    });

    this.spawnNodes();
  }

  private handleResize(gameSize?: Phaser.Structs.Size) {
    const w = gameSize?.width ?? this.scale.width;
    const h = gameSize?.height ?? this.scale.height;
    if (w <= 0 || h <= 0) return;

    const isPortrait = h > w;
    const uiScale = isPortrait 
        ? Phaser.Math.Clamp(h / 1000, 0.6, 1.2)
        : Phaser.Math.Clamp(w / 1200, 0.7, 1.4);

    this.bgImage.setPosition(w/2, h/2);
    this.bgImage.setDisplaySize(Math.max(w, h * 1.7), Math.max(h, w / 1.7));

    const cx = w/2;
    const cy = h/2;

    if (isPortrait) {
        // 세로 모드: 진행 정보를 상단에 배치하고 패스를 중앙에 맞춤
        this.progBg.setPosition(cx, 80 * uiScale).setSize(w * 0.8, 20 * uiScale);
        this.progressBar.setPosition(cx - (w * 0.4), 80 * uiScale);
        this.qualityText.setPosition(cx, 115 * uiScale).setFontSize(Math.round(18 * uiScale));
    } else {
        // 가로 모드: 진행 정보를 상단에 배치하고 패스를 가로로 넓게 씀
        this.progBg.setPosition(cx, 40 * uiScale).setSize(w * 0.5, 18 * uiScale);
        this.progressBar.setPosition(cx - (w * 0.25), 40 * uiScale);
        this.qualityText.setPosition(cx, 75 * uiScale).setFontSize(Math.round(20 * uiScale));
    }

    this.drawPath(w, h, uiScale, isPortrait);
    this.updateNodes();
  }

  private drawPath(w: number, h: number, s: number, isPortrait: boolean) {
    this.wavePathGraphics.clear().lineStyle(4, 0x10b981, 0.3).beginPath();
    const startX = w * 0.1; const width = w * 0.8;
    const amplitude = isPortrait ? 60 * s : 100 * s;
    const centerY = h/2; // 항상 세로 중앙 기준

    for(let i=0; i<=100; i++) {
        const p = i/100;
        const x = startX + p * width;
        const y = centerY + Math.sin(p * Math.PI * 4) * amplitude;
        if(i===0) this.wavePathGraphics.moveTo(x, y); else this.wavePathGraphics.lineTo(x, y);
    }
    this.wavePathGraphics.strokePath();
  }

  private spawnNodes() {
    this.targetNodes.forEach(n => n.destroy());
    this.targetNodes = [];
    [0.15, 0.4, 0.65, 0.9].forEach(p => {
        const node = this.add.circle(0, 0, 18, 0x10b981, 0.4).setStrokeStyle(3, 0x10b981);
        (node as any).p = p; (node as any).hit = false;
        this.targetNodes.push(node);
        this.root.add(node);
    });
    this.updateNodes();
  }

  private updateNodes() {
    const w = this.scale.width; const h = this.scale.height;
    if (w <= 0 || h <= 0) return;
    const isPortrait = h > w;
    const s = isPortrait ? Phaser.Math.Clamp(h / 1000, 0.6, 1.2) : Phaser.Math.Clamp(w / 1200, 0.7, 1.4);
    
    const startX = w * 0.1; const width = w * 0.8;
    const amplitude = isPortrait ? 60 * s : 100 * s;
    const centerY = h/2;

    this.targetNodes.forEach(n => {
        const p = (n as any).p;
        n.x = startX + p * width;
        n.y = centerY + Math.sin(p * Math.PI * 4) * amplitude;
        n.setScale(s);
    });
  }

  update(time: number, delta: number) {
    if (this.isFinished) return;
    this.cursorProgress += this.cursorSpeed * delta;
    if (this.cursorProgress > 1) {
        this.cursorProgress = 0;
        this.confirmedProgress = Math.min(100, this.confirmedProgress + 25);
        this.progressBar.width = (this.confirmedProgress / 100) * this.progBg.width;
        if (this.confirmedProgress >= 100) return this.finish();
        this.spawnNodes();
    }
    
    const w = this.scale.width; const h = this.scale.height;
    if (w <= 0 || h <= 0) return;
    const isPortrait = h > w;
    const s = isPortrait ? Phaser.Math.Clamp(h / 1000, 0.6, 1.2) : Phaser.Math.Clamp(w / 1200, 0.7, 1.4);
    
    const startX = w * 0.1; const width = w * 0.8;
    const amplitude = isPortrait ? 60 * s : 100 * s;
    const centerY = h/2;

    this.cursor.x = startX + this.cursorProgress * width;
    this.cursor.y = centerY + Math.sin(this.cursorProgress * Math.PI * 4) * amplitude;
    this.cursor.setScale(s);
    this.updateNodes();
    
    this.qualityText.setText(this.getQualityLabel(this.currentQuality)).setColor(this.getLabelColor(this.currentQuality));
  }

  private handleHit(node: any) {
    if (node.hit) return;
    const diff = Math.abs(this.cursorProgress - node.p);
    if (diff < 0.08) {
        node.hit = true; node.setFillStyle(0xfbbf24, 1).setStrokeStyle(3, 0xffffff);
        this.currentQuality += 1;
        this.showFeedback('CLINCH!', 0xfbbf24, node.x, node.y);
    }
  }

  private showFeedback(text: string, color: number, x: number, y: number) {
    const fb = this.add.text(x, y, text, { fontFamily: 'monospace', fontSize: '20px', color: '#' + color.toString(16), stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    this.tweens.add({ targets: fb, y: y - 40, alpha: 0, duration: 500, onComplete: () => fb.destroy() });
  }

  private getQualityLabel(q: number): string {
    if (q >= 110) return "MASTERWORK";
    if (q >= 100) return "PRISTINE";
    if (q >= 90) return "SUPERIOR";
    if (q >= 80) return "FINE";
    return "STANDARD";
  }

  private getLabelColor(q: number): string {
    if (q >= 105) return '#fbbf24';
    if (q >= 95) return '#34d399';
    return '#a8a29e';
  }

  private finish() {
    this.isFinished = true;
    this.time.delayedCall(1000, () => this.onComplete?.(this.currentQuality));
  }
}