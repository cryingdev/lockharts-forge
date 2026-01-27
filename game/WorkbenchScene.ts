
import Phaser from 'phaser';
import { getAssetUrl } from '../utils';

interface Point {
  x: number;
  y: number;
}

type RingType = 'VERY_SMALL' | 'SMALL' | 'MEDIUM';

interface Interactable {
  type: 'TAP' | 'DRAG';
  p: number;        
  endP?: number;    
  hit: boolean;
  missed: boolean;
  dragSuccessTicks: number; 
  totalTicksInRange: number; 
  graphic?: Phaser.GameObjects.Arc; 
  nailHead?: Phaser.GameObjects.Image; 
  tracedSegments?: { start: number; end: number }[]; 
  startHit?: boolean; 
  startHitPerfect?: boolean; 
  missedStart?: boolean; 
  ringType: RingType;   
}

function findPerpendicularDistance(p: Point, p1: Point, p2: Point) {
  if (p1.x === p2.x) return Math.abs(p.x - p1.x);
  const slope = (p2.y - p1.y) / (p2.x - p1.x);
  const intercept = p1.y - slope * p1.x;
  return Math.abs(slope * p.x - p.y + intercept) / Math.sqrt(Math.pow(slope, 2) + 1);
}

function rdp(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;
  let dmax = 0; let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = findPerpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > dmax) { dmax = d; index = i; }
  }
  if (dmax > epsilon) {
    const res1 = rdp(points.slice(0, index + 1), epsilon);
    const res2 = rdp(points.slice(index), epsilon);
    return [...res1.slice(0, res1.length - 1), ...res2];
  }
  return [points[0], points[points.length - 1]];
}

export default class WorkbenchScene extends Phaser.Scene {
  declare public add: Phaser.GameObjects.GameObjectFactory;
  declare public tweens: Phaser.Tweens.TweenManager;
  declare public scale: Phaser.Scale.ScaleManager;
  declare public cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare public input: Phaser.Input.InputPlugin;
  declare public time: Phaser.Time.Clock;
  declare public events: Phaser.Events.EventEmitter;
  declare public load: Phaser.Loader.LoaderPlugin;
  declare public textures: Phaser.Textures.TextureManager;
  declare public anims: Phaser.Animations.AnimationManager;
  declare public make: Phaser.GameObjects.GameObjectCreator;

  private interactables: Interactable[] = [];
  private cursor!: Phaser.GameObjects.Container;
  private cursorSprite!: Phaser.GameObjects.Image;
  private cursorBar!: Phaser.GameObjects.Rectangle;
  private hammerSprite!: Phaser.GameObjects.Image;
  private comboText!: Phaser.GameObjects.Text;
  private progBg!: Phaser.GameObjects.Rectangle;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private qualityText!: Phaser.GameObjects.Text;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private dragPathGraphics!: Phaser.GameObjects.Graphics;
  private silhouetteGraphics!: Phaser.GameObjects.Graphics;
  private itemSprite!: Phaser.GameObjects.Image;
  private bgImage!: Phaser.GameObjects.Image;
  private root!: Phaser.GameObjects.Container;

  private cursorProgress = 0;
  private cursorSpeed = 0.00012; 
  private confirmedProgress = 0;
  private currentQuality = 100;
  private combo = 0;
  private enhancementCount = 0; 
  private isFinished = false;
  private isTransitioning = false; 
  private currentPhase = 1;
  private masteryCount = 0;

  private onComplete?: (score: number, enhancementCount: number) => void;
  private itemImage: string = '';
  private subCategoryId: string = '';
  private difficulty: number = 1;
  private isLeatherWork: boolean = false;
  private centerX = 0; private centerY = 0; private viewW = 0; private viewH = 0; private uiScale = 1;

  private itemInternalData = { points: [] as Point[], width: 0, height: 0, centerX: 0, centerY: 0, texW: 0, texH: 0 };
  private worldPoints: Phaser.Math.Vector2[] = [];
  private cumulativeLengths: number[] = [];
  private totalPathLength = 0;
  private dragPenaltyTimer = 0;

  constructor() { super('WorkbenchScene'); }

  init(data: { onComplete: (score: number, enhancementCount: number) => void; difficulty: number; masteryCount?: number; subCategoryId?: string; itemImage?: string }) {
    this.onComplete = data.onComplete; this.difficulty = data.difficulty;
    this.masteryCount = data.masteryCount || 0;
    this.itemImage = data.itemImage || ''; this.subCategoryId = data.subCategoryId || '';
    const leatherCategories = ['CHESTPLATE', 'GLOVES', 'BOOTS'];
    this.isLeatherWork = leatherCategories.includes(this.subCategoryId.toUpperCase());
    this.cursorSpeed = 0.00012 + data.difficulty * 0.000020; 
    this.isFinished = false; this.isTransitioning = false; this.cursorProgress = 0; this.confirmedProgress = 0; this.currentQuality = 100; this.combo = 0; this.enhancementCount = 0; this.currentPhase = 1; this.interactables = [];
  }

  preload() {
    this.load.image('workbench_bg', getAssetUrl('workbench_bg.png', 'minigame'));
    this.load.image('niddle', getAssetUrl('niddle.png', 'minigame'));
    this.load.image('nail', getAssetUrl('nail.png', 'minigame'));
    this.load.image('nail_head', getAssetUrl('nail_head.png', 'minigame'));
    this.load.image('hammer', getAssetUrl('hammer.png'));
    this.load.image('saw', getAssetUrl('saw.png', 'minigame'));
    this.load.image('spark', getAssetUrl('particle_spark1.png', 'minigame'));
    if (this.itemImage) this.load.image('item_source', getAssetUrl(this.itemImage, 'equipments'));
  }

  private getRingColor(type: RingType): number {
    if (type === 'VERY_SMALL') return 0xef4444; 
    if (type === 'SMALL') return 0xfbbf24;      
    return 0x10b981;                            
  }

  private getRingRadius(type: RingType): number {
    if (type === 'VERY_SMALL') return 8;
    if (type === 'SMALL') return 14;
    return 22;
  }

  private getRingSpeedMultiplier(type: RingType): number {
    if (type === 'VERY_SMALL') return 2.2;
    if (type === 'SMALL') return 1.5;
    return 1.0;
  }

  create() {
    this.root = this.add.container(0, 0);
    this.bgImage = this.add.image(0, 0, 'workbench_bg').setAlpha(0.6).setOrigin(0.5); this.root.add(this.bgImage);
    this.silhouetteGraphics = this.add.graphics().setAlpha(0.2); this.root.add(this.silhouetteGraphics);
    if (this.textures.exists('item_source')) { this.itemSprite = this.add.image(0, 0, 'item_source').setAlpha(0.15); this.root.add(this.itemSprite); }
    this.pathGraphics = this.add.graphics(); this.dragPathGraphics = this.add.graphics(); this.root.add([this.pathGraphics, this.dragPathGraphics]);
    this.progBg = this.add.rectangle(0, 0, 300, 16, 0x000000, 0.5).setStrokeStyle(2, 0x57534e);
    this.progressBar = this.add.rectangle(0, 0, 0.1, 12, 0x10b981).setOrigin(0, 0.5);
    this.qualityText = this.add.text(0, 0, 'PRISTINE', { fontFamily: 'Grenze Gotisch', fontSize: '20px', color: '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5);
    this.root.add([this.progBg, this.progressBar, this.qualityText]);
    this.cursor = this.add.container(0, 0).setDepth(10);
    this.cursorSprite = this.add.image(0, 0, 'niddle').setOrigin(0.5, 0.98).setScale(0.4);
    this.cursorBar = this.add.rectangle(0, 0, 6, 40, 0xfbbf24).setOrigin(0.5, 1).setStrokeStyle(2, 0xffffff, 0.8);
    this.cursor.add([this.cursorBar, this.cursorSprite]); this.root.add(this.cursor);
    this.hammerSprite = this.add.image(0, 0, 'hammer').setOrigin(0.5, 0.9).setScale(0.35).setAlpha(0).setDepth(25); this.root.add(this.hammerSprite);
    this.comboText = this.add.text(0, 0, '', { fontFamily: 'Grenze Gotisch', fontSize: '42px', color: '#fcd34d', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setAlpha(0).setDepth(20); this.root.add(this.comboText);
    this.generatePathFromTexture(); this.handleResize(this.scale.gameSize); this.scale.on('resize', this.handleResize, this);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.isFinished || this.isTransitioning) return;
      for (let i = 0; i < this.interactables.length; i++) {
        const obj = this.interactables[i]; const nodePos = this.getPathPosition(obj.p);
        const d = Phaser.Math.Distance.Between(p.x, p.y, nodePos.x, nodePos.y); const diff = Math.abs(this.cursorProgress - obj.p);
        if (obj.type === 'TAP' && !obj.hit && !obj.missed) {
          let tapHitRadius = this.getRingRadius(obj.ringType) * 2; 
          if (d < tapHitRadius * this.uiScale) { this.handleTapHit(i, nodePos.x, nodePos.y); break; }
        }
        if (obj.type === 'DRAG' && !obj.hit && !obj.missed && !obj.startHit) {
            let hitRadius = 42;
            if (d < hitRadius * this.uiScale && diff < 0.08) {
                obj.startHit = true; obj.missedStart = false; const perfectThreshold = 0.035;
                obj.startHitPerfect = diff < perfectThreshold; obj.tracedSegments = [{ start: obj.p, end: this.cursorProgress }];
                const label = obj.startHitPerfect ? 'PERFECT!' : 'GOOD'; const color = obj.startHitPerfect ? 0xfbbf24 : this.getRingColor(obj.ringType);
                this.showFeedback(label, color, nodePos.x, nodePos.y); this.createSparks(nodePos.x, nodePos.y, color, obj.startHitPerfect ? 10 : 5);
                if (obj.startHitPerfect) { 
                    this.combo++; 
                    if (this.combo >= 8) this.handleEnhancement(nodePos.x, nodePos.y); 
                } else { 
                    this.combo = 0;
                    this.syncFutureRingsToCombo();
                }
                break;
            }
        }
      }
    });
    this.startPhase(1);
  }

  private runCountdown(callback: () => void) {
    this.isTransitioning = true;
    const labels = ['3', '2', '1', 'START!'];
    let idx = 0;
    const txt = this.add.text(this.centerX, this.centerY, '', {
        fontFamily: 'Grenze Gotisch',
        fontSize: '120px',
        color: '#fbbf24',
        stroke: '#000',
        strokeThickness: 12,
        shadow: { color: '#000', fill: true, blur: 20 }
    }).setOrigin(0.5).setDepth(1000).setAlpha(0);

    const showNext = () => {
        if (idx >= labels.length) {
            txt.destroy();
            this.isTransitioning = false;
            callback();
            return;
        }
        txt.setText(labels[idx]).setScale(2.5).setAlpha(0);
        if (labels[idx] === 'START!') txt.setColor('#10b981');

        this.tweens.add({
            targets: txt,
            scale: 1,
            alpha: 1,
            duration: 350,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(400, () => {
                    this.tweens.add({
                        targets: txt,
                        alpha: 0,
                        scale: 0.8,
                        duration: 200,
                        onComplete: () => {
                            idx++;
                            showNext();
                        }
                    });
                });
            }
        });
    };
    showNext();
  }

  private startPhase(phase: number) {
    this.currentPhase = phase; this.cursorProgress = 0; this.updateCursorTool(); this.spawnInteractablesForPhase();
    const pos = this.getPathPosition(0); this.cursor.setPosition(pos.x, pos.y);
    this.runCountdown(() => {
    });
  }

  private updateCursorTool() {
    if (!this.cursor) return; this.hammerSprite.setAlpha(0);
    if (this.isLeatherWork) { this.cursorSprite.setVisible(true).setTexture('niddle').setOrigin(0.5, 0.98).setScale(0.4); this.cursorBar.setVisible(false); }
    else {
        if (this.currentPhase === 1 || this.currentPhase === 3) { this.cursorSprite.setVisible(false); this.cursorBar.setVisible(true).setFillStyle(0xfbbf24).setAlpha(1); }
        else { this.cursorSprite.setVisible(true).setTexture('saw').setOrigin(0.05, 0.5).setScale(0.45); this.cursorBar.setVisible(false); }
    }
  }

  private generatePathFromTexture() {
    const key = 'item_source'; if (!this.textures.exists(key)) return;
    const texture = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const canvas = document.createElement('canvas'); canvas.width = texture.width; canvas.height = texture.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return;
    ctx.drawImage(texture, 0, 0); const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data; const w = canvas.width; const h = canvas.height;
    const isOpaque = (x: number, y: number) => { if (x < 0 || x >= w || y < 0 || y >= h) return false; return data[(y * w + x) * 4 + 3] > 50; };
    let startPoint: Point | null = null;
    outer: for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) { if (isOpaque(x, y)) { startPoint = { x, y }; break outer; } } }
    if (!startPoint) return;
    const path: Point[] = []; let curr = { ...startPoint }; let prev = { x: startPoint.x, y: startPoint.y - 1 };
    const neighbors = [{x:-1, y:-1}, {x:0, y:-1}, {x:1, y:-1}, {x:1, y:0}, {x:1, y:1}, {x:0, y:1}, {x:-1, y:1}, {x:-1, y:-0}];
    let iters = 0;
    while (iters < w * h) {
        const relX = prev.x - curr.x; const relY = prev.y - curr.y;
        let startIdx = neighbors.findIndex(n => n.x === relX && n.y === relY); if (startIdx === -1) startIdx = 0;
        let found = false;
        for (let i = 1; i <= 8; i++) {
            const idx = (startIdx + i) % 8; const nx = curr.x + neighbors[idx].x; const ny = curr.y + neighbors[idx].y;
            if (isOpaque(nx, ny)) { prev = { ...curr }; curr = { x: nx, y: ny }; path.push({ ...curr }); found = true; break; }
        }
        if (!found || (curr.x === startPoint.x && curr.y === startPoint.y)) break;
        iters++;
    }
    const simplified = rdp(path, 1.5);
    let minX = w, maxX = 0, minY = h, maxY = 0; simplified.forEach(p => { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; });
    const itemW = maxX - minX || 1; const itemH = maxY - minY || 1; const itemCX = (minX + maxX) / 2; const itemCY = (minY + maxY) / 2;
    this.itemInternalData = { points: simplified.map(p => ({ x: p.x - itemCX, y: p.y - itemCY })), width: itemW, height: itemH, centerX: itemCX, centerY: itemCY, texW: w, texH: h };
  }

  private handleResize(gameSize?: Phaser.Structs.Size) {
    const w = gameSize?.width ?? this.scale.width; const h = gameSize?.height ?? this.scale.height; if (w <= 0 || h <= 0) return;
    this.viewW = w; this.viewH = h; this.centerX = w / 2; this.centerY = h / 2; const isPortrait = h > w;
    this.uiScale = isPortrait ? Phaser.Math.Clamp(w / 400, 0.7, 1) : Phaser.Math.Clamp(h / 600, 0.8, 1.2);
    this.bgImage.setPosition(this.centerX, this.centerY).setDisplaySize(Math.max(w, h * 1.5), Math.max(h, w / 1.5));
    const pbY = isPortrait ? 80 : 40; this.progBg.setPosition(this.centerX, pbY * this.uiScale).setSize(Math.min(w * 0.7, 400), 18 * this.uiScale);
    this.progressBar.setPosition(this.progBg.x - this.progBg.width / 2, this.progBg.y); this.qualityText.setPosition(this.centerX, (pbY + 35) * this.uiScale);
    this.recalculateWorldPath(); this.drawGuidePath(); this.updateInteractablesVisuals(); this.updateProgressBar();
  }

  private recalculateWorldPath() {
    if (this.itemInternalData.points.length === 0) return;
    const isPortrait = this.viewH > this.viewW; const maxAreaW = this.viewW * (isPortrait ? 0.85 : 0.65); const maxAreaH = this.viewH * (isPortrait ? 0.45 : 0.6);
    const scale = Math.min(maxAreaW / this.itemInternalData.width, maxAreaH / this.itemInternalData.height);
    this.worldPoints = this.itemInternalData.points.map(p => new Phaser.Math.Vector2(this.centerX + (p.x * scale), this.centerY + (p.y * scale)));
    if (this.itemSprite) this.itemSprite.setPosition(this.centerX, this.centerY).setScale(scale).setOrigin(this.itemInternalData.centerX / this.itemInternalData.texW, this.itemInternalData.centerY / this.itemInternalData.texH);
    this.cumulativeLengths = [0]; let total = 0;
    for (let i = 0; i < this.worldPoints.length - 1; i++) { total += Phaser.Math.Distance.BetweenPoints(this.worldPoints[i], this.worldPoints[i+1]); this.cumulativeLengths.push(total); }
    this.totalPathLength = total;
  }

  private drawGuidePath(time: number = 0) {
    this.silhouetteGraphics.clear(); this.pathGraphics.clear(); this.dragPathGraphics.clear();
    if (this.worldPoints.length < 2) return;
    this.silhouetteGraphics.fillStyle(0x1a0b08, 1).beginPath().moveTo(this.worldPoints[0].x, this.worldPoints[0].y);
    for (let i = 1; i < this.worldPoints.length; i++) this.silhouetteGraphics.lineTo(this.worldPoints[i].x, this.worldPoints[i].y);
    this.silhouetteGraphics.closePath().fillPath(); this.pathGraphics.lineStyle(3, 0xfde68a, 0.4);
    const dashSize = 10, gapSize = 8;
    for (let i = 0; i < this.worldPoints.length - 1; i++) {
      const start = this.worldPoints[i], end = this.worldPoints[i+1]; const dist = Phaser.Math.Distance.BetweenPoints(start, end), angle = Phaser.Math.Angle.BetweenPoints(start, end);
      let currentDist = 0, draw = true;
      while (currentDist < dist) {
        const step = draw ? dashSize : gapSize; const nextDist = Math.min(currentDist + step, dist);
        if (draw) this.pathGraphics.lineBetween(start.x + Math.cos(angle) * currentDist, start.y + Math.sin(angle) * currentDist, start.x + Math.cos(angle) * nextDist, start.y + Math.sin(angle) * nextDist);
        currentDist = nextDist; draw = !draw;
      }
    }
    this.interactables.forEach(obj => {
        if (obj.type === 'DRAG' && obj.endP && !obj.missed) {
            this.drawPathSegment(obj.p, obj.endP, this.dragPathGraphics, 0x10b981, 0.4, 5);
            if (obj.tracedSegments) obj.tracedSegments.forEach(seg => this.drawPathSegment(seg.start, seg.end, this.dragPathGraphics, 0xfbbf24, 1.0, 8));
            if (!obj.startHit && !obj.hit) {
                const startPos = this.getPathPosition(obj.p); const ringColor = this.getRingColor(obj.ringType);
                let ringRadius = this.getRingRadius(obj.ringType);
                this.dragPathGraphics.lineStyle(4, ringColor, 1.0).strokeCircle(startPos.x, startPos.y, ringRadius * this.uiScale);
                this.dragPathGraphics.fillStyle(ringColor, 0.4).fillCircle(startPos.x, startPos.y, (ringRadius - 6) * this.uiScale);
            }
            const endPos = this.getPathPosition(obj.endP); this.dragPathGraphics.lineStyle(4, 0xfbbf24, 1).strokeCircle(endPos.x, endPos.y, 14 * this.uiScale); this.dragPathGraphics.fillStyle(0xfbbf24, 0.5).fillCircle(endPos.x, endPos.y, 8 * this.uiScale);
        }
    });
  }

  private drawPathSegment(startP: number, endP: number, graphics: Phaser.GameObjects.Graphics, color: number, alpha: number, width: number) {
    graphics.lineStyle(width, color, alpha); const stepDistancePx = 4; const segmentLengthP = endP - startP; const steps = Math.max(2, Math.ceil(segmentLengthP * this.totalPathLength / stepDistancePx));
    const stepSizeP = segmentLengthP / steps; const firstPos = this.getPathPosition(startP); graphics.beginPath().moveTo(firstPos.x, firstPos.y);
    for (let i = 1; i <= steps; i++) { const pos = this.getPathPosition(startP + stepSizeP * i); graphics.lineTo(pos.x, pos.y); }
    graphics.strokePath();
  }

  private getPathPosition(p: number): { x: number; y: number; angle: number } {
    const normalizedP = p < 0 ? 1 + (p % 1) : p % 1; const targetLen = normalizedP * this.totalPathLength;
    let seg = 0; while (seg < this.cumulativeLengths.length - 2 && this.cumulativeLengths[seg + 1] < targetLen) seg++;
    const t = (targetLen - this.cumulativeLengths[seg]) / (this.cumulativeLengths[seg + 1] - this.cumulativeLengths[seg] || 1);
    const p1 = this.worldPoints[seg], p2 = this.worldPoints[seg + 1]; return { x: Phaser.Math.Linear(p1.x, p2.x, t), y: Phaser.Math.Linear(p1.y, p2.y, t), angle: Phaser.Math.Angle.BetweenPoints(p1, p2) };
  }

  private spawnInteractablesForPhase() {
    this.interactables.forEach(obj => { this.destroyTapGraphics(obj); }); this.interactables = [];
    const isNovice = this.masteryCount < 10;

    if (this.currentPhase === 1 || this.currentPhase === 3) {
        let count = 4;
        if (this.currentPhase === 3) {
            if (this.masteryCount >= 30) count = 8;
            else if (this.masteryCount >= 10) count = 6;
            else count = 4;
        }
        for (let i = 0; i < count; i++) { const sectorWidth = 1.0 / count; this.addTap(((i * sectorWidth) + Phaser.Math.FloatBetween(sectorWidth * 0.2, sectorWidth * 0.8)) % 1.0); }
    } else {
        if (isNovice) {
            const start = Phaser.Math.FloatBetween(0.2, 0.3);
            this.addDrag(start, start + 0.4);
        } else if (this.currentPhase === 4) {
            this.addDrag(0.05, 0.45);
            this.addDrag(0.55, 0.95);
        } else {
            const start = Phaser.Math.FloatBetween(0.05, 0.1);
            this.addDrag(start, start + 0.8);
        }
    }
    this.updateInteractablesVisuals(); this.drawGuidePath();
  }

  private addTap(p: number) {
    const ringType = this.getCurrentRingTypeByCombo(); 
    const obj: Interactable = { type: 'TAP', p, hit: false, missed: false, dragSuccessTicks: 0, totalTicksInRange: 0, ringType };
    this.createTapGraphics(obj);
    this.interactables.push(obj);
  }

  private getCurrentRingTypeByCombo(): RingType {
    if (this.combo >= 6) return 'VERY_SMALL';
    if (this.combo >= 3) return 'SMALL';
    return 'MEDIUM';
  }

  private createTapGraphics(obj: Interactable) {
    const pos = this.getPathPosition(obj.p);
    const ringRadius = this.getRingRadius(obj.ringType);
    const ringColor = this.getRingColor(obj.ringType);

    const node = this.add.circle(pos.x, pos.y, ringRadius * this.uiScale, ringColor, 0.3).setStrokeStyle(3, ringColor).setDepth(8);
    this.root.add(node);
    obj.graphic = node;

    if (!this.isLeatherWork) {
        const targetSize = ringRadius * 2 * this.uiScale;
        const nailHead = this.add.image(pos.x, pos.y, 'nail_head').setDepth(7).setDisplaySize(targetSize, targetSize);
        this.root.add(nailHead);
        obj.nailHead = nailHead;
    }
  }

  private destroyTapGraphics(obj: Interactable) {
    if (obj.graphic) {
        obj.graphic.destroy();
        obj.graphic = undefined;
    }
    if (obj.nailHead) {
        obj.nailHead.destroy();
        obj.nailHead = undefined;
    }
  }

  private rebuildTapGraphics(obj: Interactable) {
    this.destroyTapGraphics(obj);
    this.createTapGraphics(obj);
  }

  private syncFutureRingsToCombo() {
      const targetType = this.getCurrentRingTypeByCombo();
      const futureRings = this.interactables.filter(o => o.type === 'TAP' && !o.hit && !o.missed && o.p > this.cursorProgress);
      futureRings.forEach(nextRing => {
          if (nextRing.ringType !== targetType) {
              nextRing.ringType = targetType;
              this.rebuildTapGraphics(nextRing);
          }
      });
  }

  private addDrag(start: number, end: number) { this.interactables.push({ type: 'DRAG', p: start, endP: end, hit: false, missed: false, dragSuccessTicks: 0, totalTicksInRange: 0, tracedSegments: [], startHit: false, startHitPerfect: false, missedStart: false, ringType: 'MEDIUM' }); }

  private updateInteractablesVisuals() {
    this.interactables.forEach((obj) => {
      // FIX: Ensure obj.graphic is not hitting null while it's being hit or being destroyed
      if (obj.type === 'TAP' && !obj.hit && !obj.missed && obj.graphic) {
        const pos = this.getPathPosition(obj.p);
        const ringRadius = this.getRingRadius(obj.ringType);
        const ringColor = this.getRingColor(obj.ringType);
        
        obj.graphic.setPosition(pos.x, pos.y).setRadius(ringRadius * this.uiScale);
        obj.graphic.setStrokeStyle(3, ringColor);
        obj.graphic.setFillStyle(ringColor, 0.3);
        
        if (obj.nailHead) {
            obj.nailHead.setPosition(pos.x, pos.y).setDisplaySize(ringRadius * 2 * this.uiScale, ringRadius * 2 * this.uiScale);
        }
      }
    });
  }

  update(time: number, delta: number) {
    if (this.isFinished || this.isTransitioning || this.worldPoints.length < 2) return;
    
    const acceleration = 1 + (this.cursorProgress * 0.5);
    let currentTickSpeed = this.cursorSpeed * acceleration;

    const activeTap = this.interactables.find(obj => 
        obj.type === 'TAP' && !obj.hit && !obj.missed && 
        Math.abs(this.cursorProgress - obj.p) < 0.05
    );
    if (activeTap) {
        currentTickSpeed *= this.getRingSpeedMultiplier(activeTap.ringType);
    }

    this.cursorProgress += currentTickSpeed * delta;

    this.interactables.forEach((obj) => { if (!obj.hit && !obj.missed) { if (this.cursorProgress > (obj.endP ?? obj.p) + 0.1) { if (obj.type === 'TAP') { obj.missed = true; const pos = this.getPathPosition(obj.p); this.handleMiss(pos.x, pos.y, obj); } else if (obj.type === 'DRAG' && !obj.startHit && !obj.missedStart) obj.missedStart = true; } } });
    this.handleDragLogic(time, delta); if (this.cursorProgress >= 1.0) this.finishPhase();
    const pos = this.getPathPosition(this.cursorProgress); this.cursor.setPosition(pos.x, pos.y);
    const rotationOffset = (!this.isLeatherWork && (this.currentPhase === 2 || this.currentPhase === 4)) ? 0 : -Math.PI / 2;
    this.cursor.angle += Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(this.cursor.rotation), Phaser.Math.RadToDeg(pos.angle + rotationOffset)) * 0.15;
    this.qualityText.setText(this.getQualityLabel(this.currentQuality)).setColor(this.getLabelColor(this.currentQuality));
    if (this.itemSprite) this.itemSprite.setAlpha(0.15 + (this.confirmedProgress / 100) * 0.7);
    this.drawGuidePath(time);
  }

  private handleDragLogic(time: number, delta: number) {
    const p = this.cursorProgress;
    this.interactables.forEach(obj => {
      if (obj.type === 'DRAG' && !obj.hit && !obj.missed) {
        if (p >= obj.p && p <= obj.endP!) {
            obj.totalTicksInRange += delta; const pointer = this.input.activePointer;
            if (pointer.isDown && Phaser.Math.Distance.Between(pointer.x, pointer.y, this.cursor.x, this.cursor.y) < 60 * this.uiScale) {
                if (!obj.startHit) { obj.startHit = true; if (!obj.tracedSegments) obj.tracedSegments = []; obj.tracedSegments.push({ start: p, end: p }); }
                obj.dragSuccessTicks += delta; this.dragPenaltyTimer = 0; if (this.cursorSprite.visible) this.cursorSprite.setTint(0xfbbf24); if (this.cursorBar.visible) this.cursorBar.setFillStyle(0xfcd34d);
                if (time % 100 < 20) this.createSparks(this.cursor.x, this.cursor.y, 0xfbbf24, 1);
                const lastSeg = obj.tracedSegments![obj.tracedSegments!.length - 1]; if (lastSeg && Math.abs(lastSeg.end - p) < 0.05) lastSeg.end = p; else obj.tracedSegments!.push({ start: p, end: p });
            } else if (obj.startHit) {
                this.dragPenaltyTimer += delta; if (this.dragPenaltyTimer > 150) { 
                    this.dragPenaltyTimer = 0; 
                    this.currentQuality = Math.max(0, this.currentQuality - 1.2); 
                    if (this.combo > 0) {
                        this.combo = 0;
                        this.syncFutureRingsToCombo();
                    }
                    this.createSparks(this.cursor.x, this.cursor.y, 0xef4444, 2); this.cameras.main.shake(40, 0.001); 
                }
            }
        }
        if (p > obj.endP! + 0.02 && obj.totalTicksInRange > 50) {
            const ratio = obj.dragSuccessTicks / obj.totalTicksInRange;
            if (ratio > 0.92 && obj.startHitPerfect && !obj.missedStart) { 
                obj.hit = true; 
                this.currentQuality = Math.min(120, this.currentQuality + 1.0); 
                this.showFeedback('PERFECT!', 0xfbbf24, this.cursor.x, this.cursor.y); 
                this.createSparks(this.cursor.x, this.cursor.y, 0xfbbf24, 15); 
            }
            else if (ratio > 0.60) { 
                obj.hit = true; 
                this.showFeedback('GOOD', 0xe5e5e5, this.cursor.x, this.cursor.y); 
            }
            else { obj.missed = true; this.handleMiss(this.cursor.x, this.cursor.y); }
        }
      }
    });
    if (!this.interactables.some(obj => obj.type === 'DRAG' && p >= obj.p && p <= obj.endP!)) { this.cursorSprite.clearTint(); if (this.cursorBar.visible) this.cursorBar.setFillStyle(0xfbbf24); }
  }

  private handleTapHit(idx: number, targetX: number, targetY: number) {
    const obj = this.interactables[idx]; const diff = Math.abs(this.cursorProgress - obj.p); const pos = this.getPathPosition(obj.p);
    if (diff < 0.07) {
      obj.hit = true; const isPerfect = diff < 0.03; const ringColor = this.getRingColor(obj.ringType);
      if (!this.isLeatherWork) { this.hammerSprite.setAlpha(1).setPosition(targetX + 40, targetY - 120).setAngle(5); this.tweens.add({ targets: this.hammerSprite, x: targetX, y: targetY + 20, angle: -30, duration: 100, ease: 'Cubic.in', onComplete: () => { this.tweens.add({ targets: this.hammerSprite, angle: -10, y: targetY + 10, alpha: 0, duration: 250, ease: 'Cubic.out' }); } }); }
      if (obj.nailHead) this.tweens.add({ targets: obj.nailHead, displayWidth: obj.nailHead.displayWidth * 0.8, displayHeight: obj.nailHead.displayHeight * 0.8, duration: 100, ease: 'Back.easeOut' });
      
      if (isPerfect) { 
          this.combo++; 
          this.currentQuality = Math.min(120, this.currentQuality + 1.0); 
          this.showFeedback('PERFECT!', 0xfbbf24, pos.x, pos.y); 
          this.createSparks(pos.x, pos.y, 0xfbbf24, 15); 
          if (this.combo >= 8) this.handleEnhancement(pos.x, pos.y); 

          this.syncFutureRingsToCombo();
      }
      else { 
          this.combo = 0; 
          this.showFeedback('GOOD', ringColor, pos.x, pos.y); 
          this.createSparks(pos.x, pos.y, ringColor, 8); 
          
          this.syncFutureRingsToCombo();
      }
      
      if (obj.graphic) { 
          const target = obj.graphic; 
          this.tweens.add({ targets: target, scale: this.uiScale * 2, alpha: 0, duration: 300, ease: 'Cubic.out', onComplete: () => target.destroy() }); 
      }
    }
  }

  private handleEnhancement(x: number, y: number) { this.enhancementCount++; const pinnedText = this.add.text(x, y, '+1', { fontFamily: 'Grenze Gotisch', fontSize: '48px', color: '#fbbf24', fontStyle: 'bold', stroke: '#000', strokeThickness: 6, shadow: { color: '#000', fill: true, blur: 10 } }).setOrigin(0.5).setDepth(15).setAlpha(0).setScale(0.5); this.root.add(pinnedText); this.tweens.add({ targets: pinnedText, alpha: 1, scale: 1, y: y - 20, duration: 400, ease: 'Back.out' }); }

  private handleMiss(x: number, y: number, obj?: Interactable) { 
      this.combo = 0; 
      this.syncFutureRingsToCombo();
      this.currentQuality = Math.max(0, this.currentQuality - 6); 
      this.showFeedback('MISS', 0xef4444, x, y); 
      this.createSparks(x, y, 0xef4444, 8); 
      this.cameras.main.shake(120, 0.005); 
      if (obj?.graphic) this.tweens.add({ targets: obj.graphic, alpha: 0, duration: 200, onComplete: () => this.destroyTapGraphics(obj) }); 
  }

  private finishPhase() {
    this.isTransitioning = true; this.confirmedProgress = Math.min(100, this.confirmedProgress + 25); this.updateProgressBar();
    this.interactables.forEach(obj => { if (obj.graphic) this.tweens.add({ targets: obj.graphic, alpha: 0, duration: 400 }); if (obj.nailHead) this.tweens.add({ targets: obj.nailHead, alpha: 0, duration: 400 }); });
    const isLastPhase = this.currentPhase >= 4;
    
    if (isLastPhase) {
        this.win();
    } else {
        this.time.delayedCall(400, () => {
            this.startPhase(this.currentPhase + 1);
        });
    }
  }

  private updateProgressBar() { this.progressBar.width = Math.max(0.1, (this.confirmedProgress / 100) * this.progBg.width); }

  private createSparks(x: number, y: number, color: number, count: number = 12) { const emitter = this.add.particles(x, y, 'spark', { lifespan: 500, speed: { min: 100, max: 250 }, scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', tint: color, gravityY: 400 }); this.root.add(emitter); emitter.explode(count); this.time.delayedCall(600, () => emitter.destroy()); }

  private showFeedback(text: string, color: number, x: number, y: number) {
    const fb = this.add.text(x, y, text, { fontFamily: 'Grenze Gotisch', fontSize: `${Math.round(24 * this.uiScale)}px`, color: '#' + color.toString(16).padStart(6, '0'), stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(30);
    this.root.add(fb); this.tweens.add({ targets: fb, y: y - 40, alpha: 0, duration: 600, onComplete: () => fb.destroy() });
    if (this.combo > 1) { this.comboText.setPosition(x, y - 70).setText(`${this.combo} COMBO!`).setAlpha(1); this.tweens.add({ targets: this.comboText, alpha: 0, scale: 1.2, duration: 800 }); }
  }

  public getQualityLabel(q: number): string { if (q >= 110) return 'MASTERWORK'; if (q >= 100) return 'PRISTINE'; if (q >= 90) return 'SUPERIOR'; if (q >= 80) return 'FINE'; if (q >= 70) return 'STANDARD'; if (q >= 60) return 'RUSTIC'; return 'CRUDE'; }
  private getLabelColor(q: number): string { if (q >= 110) return '#f59e0b'; if (q >= 100) return '#fbbf24'; if (q >= 90) return '#10b981'; if (q >= 80) return '#3b82f6'; if (q >= 70) return '#a8a29e'; if (q >= 60) return '#d97706'; return '#ef4444'; }

  private win() {
    this.isFinished = true; this.cursor.setVisible(false);
    const mask = this.add.rectangle(this.centerX, this.centerY, this.viewW, this.viewH, 0x000000).setAlpha(0).setDepth(100);
    this.root.add(mask); this.tweens.add({ targets: mask, alpha: 0.7, duration: 400 });
    const label = this.getQualityLabel(this.currentQuality);
    const txt = this.add.text(this.centerX, this.centerY, `${label}\nCRAFT!`, { fontFamily: 'Grenze Gotisch', fontSize: '48px', color: this.getLabelColor(this.currentQuality), stroke: '#000', strokeThickness: 6, align: 'center' }).setOrigin(0.5).setAlpha(0).setDepth(101).setScale(0.5);
    this.root.add(txt); this.tweens.add({ targets: txt, alpha: 1, scale: 1, duration: 600, ease: 'Back.out', onComplete: () => { this.time.delayedCall(1200, () => { if (this.onComplete) this.onComplete(this.currentQuality, this.enhancementCount); }); } });
  }
}
