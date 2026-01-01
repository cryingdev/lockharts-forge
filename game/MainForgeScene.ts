
import Phaser from 'phaser';

export interface MainForgeData {
  hasFurnace: boolean;
  onInteract: (type: 'ANVIL' | 'FURNACE' | 'EMPTY_SLOT') => void;
}

export default class MainForgeScene extends Phaser.Scene {
  public add!: Phaser.GameObjects.GameObjectFactory;
  public tweens!: Phaser.Tweens.TweenManager;
  public scale!: Phaser.Scale.ScaleManager;

  private onInteract?: (type: 'ANVIL' | 'FURNACE' | 'EMPTY_SLOT') => void;
  private hasFurnace: boolean = false;
  private floor?: Phaser.GameObjects.Rectangle;
  private bg?: Phaser.GameObjects.Rectangle;
  private glow?: Phaser.GameObjects.Arc;
  private anvilContainer?: Phaser.GameObjects.Container;
  private anvilText?: Phaser.GameObjects.Text;
  private furnaceObj?: any;

  private root!: Phaser.GameObjects.Container;
  private virtualW = 0;
  private virtualH = 0;
  private isPortrait = false;

  constructor() {
    super('MainForgeScene');
  }

  init(data: MainForgeData) {
    this.hasFurnace = data.hasFurnace;
    this.onInteract = data.onInteract;
  }

  create() {
    if (this.scale.width <= 0 || this.scale.height <= 0) return;

    this.root = this.add.container(0, 0);

    this.bg = this.add.rectangle(0, 0, 0, 0, 0x1c1917);
    this.root.add(this.bg);
    
    this.floor = this.add.rectangle(0, 0, 0, 0, 0x292524);
    this.root.add(this.floor);
    
    this.glow = this.add.circle(0, 0, 200, 0x000000, 0.5);
    this.root.add(this.glow);
    
    this.createAnvil();
    this.createFurnaceSlot();

    this.handleResize(this.scale.gameSize);
    this.scale.on('resize', this.handleResize, this);
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
    const centerX = w / 2;
    const centerY = h / 2;
    const isCompact = h < 450;

    if (this.bg) this.bg.setPosition(centerX, centerY).setSize(w, h);
    if (this.floor) this.floor.setPosition(centerX, centerY - (h * 0.1)).setSize(w, h * 0.6);
    if (this.glow) this.glow.setPosition(centerX, centerY - (h * 0.2)).setRadius(h * 0.4);

    if (this.anvilContainer) {
        this.anvilContainer.setPosition(centerX - (w * 0.2), centerY + (h * 0.1));
        if (this.anvilText) this.anvilText.setPosition(this.anvilContainer.x, this.anvilContainer.y + (isCompact ? 50 : 70));
    }

    if (this.furnaceObj) {
        const fx = centerX + (w * 0.2);
        const fy = centerY + (h * 0.05);
        if (this.furnaceObj.body) this.furnaceObj.body.setPosition(fx, fy);
        if (this.furnaceObj.fire) this.furnaceObj.fire.setPosition(fx, fy + 20);
        if (this.furnaceObj.text) this.furnaceObj.text.setPosition(fx, fy + (this.hasFurnace ? -80 : 0));
        if (this.furnaceObj.outline) this.furnaceObj.outline.setPosition(fx, fy);
    }
  }

  private createAnvil() {
    this.anvilContainer = this.add.container(0, 0);
    const base = this.add.rectangle(0, 40, 80, 40, 0x44403c).setStrokeStyle(2, 0x000000);
    const top = this.add.rectangle(0, 0, 100, 30, 0x57534e).setStrokeStyle(2, 0x000000);
    const horn = this.add.triangle(-60, 0, 0, 0, 20, 30, 0, 30, 0x57534e).setStrokeStyle(2, 0x000000);
    
    this.anvilContainer.add([base, horn, top]).setSize(120, 100);
    this.anvilContainer.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 100), Phaser.Geom.Rectangle.Contains);
    this.anvilContainer.on('pointerdown', () => {
      this.tweens.add({ targets: this.anvilContainer, scale: 0.95, yoyo: true, duration: 50 });
      this.onInteract?.('ANVIL');
    });

    this.anvilText = this.add.text(0, 0, 'ANVIL', { fontFamily: 'monospace', fontSize: '12px', color: '#78716c' }).setOrigin(0.5);
    this.root.add([this.anvilContainer, this.anvilText]);
  }

  private createFurnaceSlot() {
    this.furnaceObj = {};
    if (this.hasFurnace) {
      this.furnaceObj.body = this.add.rectangle(0, 0, 100, 140, 0x44403c).setStrokeStyle(2, 0x000000);
      this.furnaceObj.fire = this.add.circle(0, 0, 30, 0xea580c);
      this.tweens.add({ targets: this.furnaceObj.fire, alpha: 0.6, scale: 1.1, yoyo: true, repeat: -1, duration: 800, ease: 'Sine.easeInOut' });
      this.furnaceObj.body.setInteractive().on('pointerdown', () => this.onInteract?.('FURNACE'));
      this.furnaceObj.text = this.add.text(0, 0, 'FURNACE', { fontFamily: 'monospace', fontSize: '12px', color: '#ea580c' }).setOrigin(0.5);
      this.root.add([this.furnaceObj.body, this.furnaceObj.fire, this.furnaceObj.text]);
    } else {
      this.furnaceObj.outline = this.add.rectangle(0, 0, 100, 140).setStrokeStyle(2, 0x44403c, 1);
      this.furnaceObj.text = this.add.text(0, 0, 'EMPTY SLOT', { fontSize: '10px', color: '#44403c' }).setOrigin(0.5);
      this.furnaceObj.outline.setInteractive().on('pointerdown', () => this.onInteract?.('EMPTY_SLOT'));
      this.root.add([this.furnaceObj.outline, this.furnaceObj.text]);
    }
  }
}
