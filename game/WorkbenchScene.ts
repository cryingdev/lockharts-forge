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

  // layout cache
  private centerX = 0;
  private centerY = 0;
  private waveStartX = 0;
  private waveWidth = 0;
  private waveAmplitude = 0;
  private uiScale = 1;
  private isPortrait = false;

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

  init(data: { onComplete: (score: number, bonus?: number) => void; difficulty: number }) {
    this.onComplete = data.onComplete;
    this.cursorSpeed = 0.00015 + data.difficulty * 0.00002;

    this.isFinished = false;
    this.cursorProgress = 0;
    this.confirmedProgress = 0;
    this.currentQuality = 100;
    this.perfectStreak = 0;
    this.combo = 0;
  }

  preload() {
    this.load.image('workbench_table', getAssetUrl('workbench_table.png'));
  }

  create() {
    this.root = this.add.container(0, 0);

    this.bgImage = this.add.image(0, 0, 'workbench_table').setAlpha(0.6).setOrigin(0.5);
    this.root.add(this.bgImage);

    this.progBg = this.add.rectangle(0, 0, 250, 16, 0x000000, 0.5).setStrokeStyle(2, 0x57534e).setName('progBg');
    this.progressBar = this.add.rectangle(0, 0, 0.1, 12, 0x10b981).setOrigin(0, 0.5);
    this.qualityText = this.add
      .text(0, 0, 'PRISTINE', { fontFamily: 'monospace', fontSize: '16px', color: '#fbbf24', fontStyle: 'bold' })
      .setOrigin(0.5);

    this.root.add([this.progBg, this.progressBar, this.qualityText]);

    this.wavePathGraphics = this.add.graphics();
    this.root.add(this.wavePathGraphics);

    this.cursor = this.add.rectangle(0, 0, 4, 35, 0xffffff).setDepth(10);
    this.root.add(this.cursor);

    this.comboText = this.add.text(0, 0, '', { 
        fontFamily: 'Impact', 
        fontSize: '42px', 
        color: '#fcd34d', 
        stroke: '#000', 
        strokeThickness: 6 
    }).setOrigin(0.5).setAlpha(0).setDepth(26);
    this.root.add(this.comboText);

    this.handleResize(this.scale.gameSize);
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.isFinished) return;
      for (const node of this.targetNodes) {
        // 노드 타격 영역 판정
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

    this.uiScale = this.isPortrait
      ? Phaser.Math.Clamp(h / 1000, 0.75, 1.2)
      : Phaser.Math.Clamp(w / 1200, 0.85, 1.3);

    this.centerX = w / 2;
    this.centerY = h / 2;

    this.bgImage.setPosition(this.centerX, this.centerY);
    this.bgImage.setDisplaySize(Math.max(w, h * 1.8), Math.max(h, w / 1.8));

    if (this.isPortrait) {
      const pbW = w * 0.8;
      this.progBg.setPosition(this.centerX, 80 * this.uiScale).setSize(pbW, 20 * this.uiScale);
      this.progressBar.setPosition(this.centerX - pbW / 2, 80 * this.uiScale);
      this.qualityText.setPosition(this.centerX, 120 * this.uiScale).setFontSize(Math.round(18 * this.uiScale));
    } else {
      const pbW = w * 0.5;
      this.progBg.setPosition(this.centerX, 40 * this.uiScale).setSize(pbW, 18 * this.uiScale);
      this.progressBar.setPosition(this.centerX - pbW / 2, 40 * this.uiScale);
      this.qualityText.setPosition(this.centerX, 80 * this.uiScale).setFontSize(Math.round(20 * this.uiScale));
    }

    this.updateProgressBar();

    this.waveStartX = w * 0.1;
    this.waveWidth = w * 0.8;
    this.waveAmplitude = (this.isPortrait ? 80 : 120) * this.uiScale;

    this.drawPath();
    this.updateNodes();
  }

  private drawPath() {
    this.wavePathGraphics.clear().lineStyle(4, 0x10b981, 0.25).beginPath();
    for (let i = 0; i <= 100; i++) {
      const p = i / 100;
      const pos = this.getPathPosition(p);
      if (i === 0) this.wavePathGraphics.moveTo(pos.x, pos.y);
      else this.wavePathGraphics.lineTo(pos.x, pos.y);
    }
    this.wavePathGraphics.strokePath();
  }

  private spawnNodes() {
    this.targetNodes.forEach((n) => n.destroy());
    this.targetNodes = [];

    // 구간 내 랜덤 위치 생성 (0.1~0.25, 0.35~0.5, 0.6~0.75, 0.85~0.95)
    const segments = [
        [0.10, 0.22],
        [0.35, 0.47],
        [0.60, 0.72],
        [0.85, 0.95]
    ];

    segments.forEach((range) => {
      const p = Phaser.Math.FloatBetween(range[0], range[1]);
      const node = this.add.circle(0, 0, 18, 0x10b981, 0.3).setStrokeStyle(3, 0x10b981);
      (node as any).p = p;
      (node as any).hit = false;
      (node as any).missed = false;
      this.targetNodes.push(node);
      this.root.add(node);
    });

    this.updateNodes();
  }

  private updateNodes() {
    if (this.scale.width <= 0 || this.scale.height <= 0) return;
    this.targetNodes.forEach((n) => {
      const p = (n as any).p as number;
      const pos = this.getPathPosition(p);
      n.setPosition(pos.x, pos.y);
      n.setScale(this.uiScale);
    });
  }

  private getPathPosition(p: number) {
    const x = this.waveStartX + p * this.waveWidth;
    const y = this.centerY + Math.sin(p * Math.PI * 4) * this.waveAmplitude;
    return { x, y };
  }

  update(time: number, delta: number) {
    if (this.isFinished) return;

    this.cursorProgress += this.cursorSpeed * delta;

    // MISS 체크: 커서가 노드 위치를 일정 이상 지났을 때
    this.targetNodes.forEach((node: any) => {
      if (!node.hit && !node.missed && this.cursorProgress > node.p + 0.06) {
        node.missed = true;
        this.handleMiss(node.x, node.y);
      }
    });

    if (this.cursorProgress > 1) {
      this.cursorProgress = 0;
      // 1사이클당 25%씩 증가
      this.confirmedProgress = Math.min(100, this.confirmedProgress + 25);
      this.updateProgressBar();

      if (this.confirmedProgress >= 100) {
        this.finish();
        return;
      }
      this.spawnNodes();
    }

    const pos = this.getPathPosition(this.cursorProgress);
    const nextPos = this.getPathPosition(this.cursorProgress + 0.005);
    
    // 경로의 기울기에 따라 커서 회전 (Tangent follow)
    const angle = Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x);
    this.cursor.setPosition(pos.x, pos.y).setScale(this.uiScale).setRotation(angle + Math.PI / 2);

    this.qualityText
      .setText(this.getQualityLabel(this.currentQuality))
      .setColor(this.getLabelColor(this.currentQuality));
  }

  private updateProgressBar() {
    const width = (this.confirmedProgress / 100) * this.progBg.width;
    this.progressBar.width = Math.max(0.1, width);
  }

  private handleHit(node: any) {
    if (node.hit || node.missed) return;

    const diff = Math.abs(this.cursorProgress - node.p);
    
    if (diff < 0.045) { // PERFECT
      node.hit = true;
      node.setFillStyle(0xfbbf24, 1).setStrokeStyle(3, 0xffffff);
      this.perfectStreak++;
      this.combo++;
      
      // 8연속 퍼펙트 시 퀄리티 보너스 (+1) - SmithingScene 로직 차용
      if (this.perfectStreak > 0 && this.perfectStreak % 8 === 0) {
        this.currentQuality += 1;
      }
      
      this.showFeedback('PERFECT!', 0xfbbf24, node.x, node.y);
      this.showCombo(node.x, node.y);
    } else if (diff < 0.09) { // GOOD
      node.hit = true;
      node.setFillStyle(0xe5e5e5, 0.8).setStrokeStyle(2, 0xaaaaaa);
      this.perfectStreak = 0;
      this.combo = 0;
      this.currentQuality = Math.max(0, this.currentQuality - 2);
      this.showFeedback('GOOD', 0xe5e5e5, node.x, node.y);
    }
  }

  private handleMiss(x: number, y: number) {
    this.perfectStreak = 0;
    this.combo = 0;
    this.currentQuality = Math.max(0, this.currentQuality - 5);
    this.showFeedback('MISS', 0xef4444, x, y);
    this.cameras.main.shake(100, 0.005);
  }

  private showCombo(x: number, y: number) {
      if (this.combo < 2) return;
      
      this.comboText.setPosition(x, y - 70 * this.uiScale)
          .setText(`${this.combo} COMBO!`)
          .setAlpha(1)
          .setScale(this.uiScale * 1.2);
          
      this.tweens.add({
          targets: this.comboText,
          scale: this.uiScale,
          alpha: 0,
          duration: 800,
          ease: 'Power2'
      });
  }

  private showFeedback(text: string, color: number, x: number, y: number) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const fb = this.add
      .text(x, y, text, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(22 * this.uiScale)}px`,
        color: hex,
        stroke: '#000',
        strokeThickness: Math.round(5 * this.uiScale),
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.root.add(fb);

    this.tweens.add({
      targets: fb,
      y: y - 50 * this.uiScale,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => fb.destroy(),
    });
  }

  private finish() {
    this.isFinished = true;
    this.cursor.setVisible(false);
    
    const bg = this.add.rectangle(this.centerX, this.centerY, this.scale.width, this.scale.height, 0x000000).setAlpha(0).setDepth(100);
    this.root.add(bg);
    this.tweens.add({ targets: bg, alpha: 0.7, duration: 400 });

    const txt = this.add.text(this.centerX, this.centerY, `${this.getQualityLabel(this.currentQuality)} CRAFT!`, {
      fontFamily: 'serif',
      fontSize: `${Math.round(42 * this.uiScale)}px`,
      color: this.getLabelColor(this.currentQuality),
      stroke: '#000',
      strokeThickness: 4,
      fontStyle: 'italic'
    }).setOrigin(0.5).setAlpha(0).setDepth(101).setScale(0.5);

    this.root.add(txt);
    this.tweens.add({
      targets: txt,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: 'Back.out',
      onComplete: () => {
        this.time.delayedCall(1200, () => {
          this.onComplete?.(this.currentQuality);
        });
      }
    });
  }
}