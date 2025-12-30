
import Phaser from 'phaser';

export interface MainForgeData {
  hasFurnace: boolean;
  onInteract: (type: 'ANVIL' | 'FURNACE' | 'EMPTY_SLOT') => void;
}

export default class MainForgeScene extends Phaser.Scene {
  add!: Phaser.GameObjects.GameObjectFactory;
  scale!: Phaser.Scale.ScaleManager;
  tweens!: Phaser.Tweens.TweenManager;
  textures!: Phaser.Textures.TextureManager;
  make!: Phaser.GameObjects.GameObjectCreator;

  private onInteract?: (type: 'ANVIL' | 'FURNACE' | 'EMPTY_SLOT') => void;
  private hasFurnace: boolean = false;

  private floor?: Phaser.GameObjects.Rectangle;
  private bg?: Phaser.GameObjects.Rectangle;
  private glow?: Phaser.GameObjects.Arc;
  private anvilContainer?: Phaser.GameObjects.Container;
  private anvilText?: Phaser.GameObjects.Text;
  private furnaceObj?: any;

  constructor() {
    super('MainForgeScene');
  }

  init(data: MainForgeData) {
    this.hasFurnace = data.hasFurnace;
    this.onInteract = data.onInteract;
  }

  create() {
    if (this.scale.width <= 0 || this.scale.height <= 0) return;

    if (!this.textures.exists('white')) {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff, 1).fillRect(0, 0, 2, 2).generateTexture('white', 2, 2).destroy();
    }

    this.bg = this.add.rectangle(0, 0, 0, 0, 0x1c1917); 
    this.floor = this.add.rectangle(0, 0, 0, 0, 0x292524); 
    this.glow = this.add.circle(0, 0, 200, 0x000000, 0.5);
    
    this.createAnvil();
    this.createFurnaceSlot();
    this.createDust();

    this.handleResize();
    this.scale.on('resize', this.handleResize, this);
  }

  private handleResize() {
    const w = this.scale.width;
    const h = this.scale.height;
    const centerX = w / 2;
    const centerY = h / 2;

    if (this.bg) {
        this.bg.setPosition(centerX, centerY).setSize(w, h);
    }
    if (this.floor) {
        this.floor.setPosition(centerX, centerY - (h * 0.1)).setSize(w, h * 0.6);
    }
    if (this.glow) {
        this.glow.setPosition(centerX, centerY - (h * 0.2)).setRadius(h * 0.4);
    }

    if (this.anvilContainer) {
        this.anvilContainer.setPosition(centerX - (w * 0.2), centerY + (h * 0.1));
        if (this.anvilText) this.anvilText.setPosition(this.anvilContainer.x, this.anvilContainer.y + 70);
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
    
    this.anvilContainer.add([base, horn, top]);
    this.anvilContainer.setSize(120, 100);
    this.anvilContainer.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 100), Phaser.Geom.Rectangle.Contains);
    this.anvilContainer.on('pointerdown', () => {
      this.tweens.add({ targets: this.anvilContainer, scale: 0.95, yoyo: true, duration: 50 });
      this.onInteract?.('ANVIL');
    });

    this.anvilText = this.add.text(0, 0, 'ANVIL', { fontFamily: 'monospace', fontSize: '12px', color: '#78716c' }).setOrigin(0.5);
  }

  private createFurnaceSlot() {
    this.furnaceObj = {};
    if (this.hasFurnace) {
      this.furnaceObj.body = this.add.rectangle(0, 0, 100, 140, 0x44403c).setStrokeStyle(2, 0x000000);
      this.furnaceObj.fire = this.add.circle(0, 0, 30, 0xea580c);
      
      this.tweens.add({
        targets: this.furnaceObj.fire, alpha: 0.6, scale: 1.1, yoyo: true, repeat: -1, duration: 800, ease: 'Sine.easeInOut'
      });

      this.furnaceObj.body.setInteractive();
      this.furnaceObj.body.on('pointerdown', () => this.onInteract?.('FURNACE'));
      this.furnaceObj.text = this.add.text(0, 0, 'FURNACE', { fontFamily: 'monospace', fontSize: '12px', color: '#ea580c' }).setOrigin(0.5);
    } else {
      this.furnaceObj.outline = this.add.rectangle(0, 0, 100, 140).setStrokeStyle(2, 0x44403c, 1);
      this.furnaceObj.text = this.add.text(0, 0, 'EMPTY SLOT', { fontSize: '10px', color: '#44403c' }).setOrigin(0.5);
      this.furnaceObj.outline.setInteractive();
      this.furnaceObj.outline.on('pointerdown', () => this.onInteract?.('EMPTY_SLOT'));
    }
  }

  private createDust() {
    this.add.particles(0, 0, 'white', {
      x: { min: 0, max: 2000 },
      y: { min: 0, max: 2000 },
      lifespan: 4000,
      speedY: { min: 5, max: 20 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.5, end: 0 },
      quantity: 1,
      frequency: 500,
      tint: 0xa8a29e
    });
  }
}
