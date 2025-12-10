import Phaser from 'phaser';

export interface MainForgeData {
  hasFurnace: boolean;
  onInteract: (type: 'ANVIL' | 'FURNACE' | 'EMPTY_SLOT') => void;
}

export default class MainForgeScene extends Phaser.Scene {
  // Explicitly declare properties to fix TS errors
  add!: Phaser.GameObjects.GameObjectFactory;
  scale!: Phaser.Scale.ScaleManager;
  tweens!: Phaser.Tweens.TweenManager;

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
    // We will use procedural graphics for now
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // --- 1. Background (Atmosphere) ---
    // Floor
    this.add.rectangle(centerX, centerY, width, height, 0x1c1917); // Stone 900
    // Wall
    this.add.rectangle(centerX, centerY - 100, width, 300, 0x292524); // Stone 800
    
    // Ambient Light (Simulated)
    const light = this.add.circle(centerX, centerY - 150, 200, 0x000000, 0.5);
    

    // --- 2. The Anvil (Always Present) ---
    this.createAnvil(centerX - 120, centerY + 50);

    // --- 3. The Furnace Slot ---
    this.createFurnaceSlot(centerX + 120, centerY + 20);

    // --- 5. Dust Particles (Atmosphere) ---
    this.createDust();
  }

  private createAnvil(x: number, y: number) {
    const container = this.add.container(x, y);
    
    // Base
    const base = this.add.rectangle(0, 40, 80, 40, 0x44403c).setStrokeStyle(2, 0x000000);
    // Top
    const top = this.add.rectangle(0, 0, 100, 30, 0x57534e).setStrokeStyle(2, 0x000000);
    // Horn
    const horn = this.add.triangle(-60, 0, 0, 0, 20, 30, 0, 30, 0x57534e).setStrokeStyle(2, 0x000000);
    
    container.add([base, horn, top]);
    container.setSize(120, 100);
    
    // Interaction
    container.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 100), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.95, yoyo: true, duration: 50 });
      this.onInteract?.('ANVIL');
    });

    // Label
    this.add.text(x, y + 70, 'ANVIL', { fontFamily: 'monospace', fontSize: '12px', color: '#78716c' }).setOrigin(0.5);
  }

  private createFurnaceSlot(x: number, y: number) {
    if (this.hasFurnace) {
      // Active Furnace
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

      // Interactive
      body.setInteractive();
      body.on('pointerdown', () => this.onInteract?.('FURNACE'));

      this.add.text(x, y - 80, 'FURNACE', { fontFamily: 'monospace', fontSize: '12px', color: '#ea580c' }).setOrigin(0.5);

    } else {
      // Empty Slot (Outline)
      const outline = this.add.rectangle(x, y, 100, 140).setStrokeStyle(2, 0x44403c, 1);
      const text = this.add.text(x, y, 'EMPTY SLOT', { 
        fontSize: '10px', color: '#44403c' 
      }).setOrigin(0.5);

      outline.setInteractive();
      outline.on('pointerdown', () => this.onInteract?.('EMPTY_SLOT'));
    }
  }

  private createDust() {
    const particles = this.add.particles(0, 0, 'spark', {
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