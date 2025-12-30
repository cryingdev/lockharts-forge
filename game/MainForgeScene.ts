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

  constructor() {
    super('MainForgeScene');
  }

  init(data: MainForgeData) {
    this.hasFurnace = data.hasFurnace;
    this.onInteract = data.onInteract;
  }

  preload() {
  }

  create() {
    const { width, height } = this.scale;
    if (width <= 0 || height <= 0) return;

    const centerX = width / 2;
    const centerY = height / 2;

    this.add.rectangle(centerX, centerY, width, height, 0x1c1917); 
    this.add.rectangle(centerX, centerY - 100, width, 300, 0x292524); 
    
    this.add.circle(centerX, centerY - 150, 200, 0x000000, 0.5);
    
    this.createAnvil(centerX - 120, centerY + 50);
    this.createFurnaceSlot(centerX + 120, centerY + 20);
    this.createDust();
  }

  private createAnvil(x: number, y: number) {
    const container = this.add.container(x, y);
    const base = this.add.rectangle(0, 40, 80, 40, 0x44403c).setStrokeStyle(2, 0x000000);
    const top = this.add.rectangle(0, 0, 100, 30, 0x57534e).setStrokeStyle(2, 0x000000);
    const horn = this.add.triangle(-60, 0, 0, 0, 20, 30, 0, 30, 0x57534e).setStrokeStyle(2, 0x000000);
    
    container.add([base, horn, top]);
    container.setSize(120, 100);
    container.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 100), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.95, yoyo: true, duration: 50 });
      this.onInteract?.('ANVIL');
    });

    this.add.text(x, y + 70, 'ANVIL', { fontFamily: 'monospace', fontSize: '12px', color: '#78716c' }).setOrigin(0.5);
  }

  private createFurnaceSlot(x: number, y: number) {
    if (this.hasFurnace) {
      const body = this.add.rectangle(x, y, 100, 140, 0x44403c).setStrokeStyle(2, 0x000000);
      const fire = this.add.circle(x, y + 20, 30, 0xea580c);
      
      this.tweens.add({
        targets: fire,
        alpha: 0.6,
        scale: 1.1,
        yoyo: true,
        repeat: -1,
        duration: 800,
        ease: 'Sine.easeInOut'
      });

      body.setInteractive();
      body.on('pointerdown', () => this.onInteract?.('FURNACE'));
      this.add.text(x, y - 80, 'FURNACE', { fontFamily: 'monospace', fontSize: '12px', color: '#ea580c' }).setOrigin(0.5);
    } else {
      const outline = this.add.rectangle(x, y, 100, 140).setStrokeStyle(2, 0x44403c, 1);
      this.add.text(x, y, 'EMPTY SLOT', { fontSize: '10px', color: '#44403c' }).setOrigin(0.5);
      outline.setInteractive();
      outline.on('pointerdown', () => this.onInteract?.('EMPTY_SLOT'));
    }
  }

  private createDust() {
    if (!this.textures.exists('white')) {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 2, 2);
        graphics.generateTexture('white', 2, 2);
        graphics.destroy();
    }

    this.add.particles(0, 0, 'white', {
      x: { min: 0, max: this.scale.width },
      y: { min: 0, max: this.scale.height },
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