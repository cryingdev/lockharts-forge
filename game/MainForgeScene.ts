
import Phaser from 'phaser';

export interface MainForgeData {
  hasFurnace: boolean;
  onInteract: (type: 'ANVIL' | 'FURNACE' | 'EMPTY_SLOT') => void;
}

export default class MainForgeScene extends Phaser.Scene {
  declare public add: Phaser.GameObjects.GameObjectFactory;
  declare public tweens: Phaser.Tweens.TweenManager;
  declare public scale: Phaser.Scale.ScaleManager;

  private onInteract?: (type: 'ANVIL' | 'FURNACE' | 'EMPTY_SLOT') => void;
  private hasFurnace: boolean = false;
  private root!: Phaser.GameObjects.Container;
  private anvil!: Phaser.GameObjects.Container;
  private furnace!: Phaser.GameObjects.Container;

  constructor() {
    super('MainForgeScene');
  }

  init(data: MainForgeData) {
    this.hasFurnace = data.hasFurnace;
    this.onInteract = data.onInteract;
  }

  create() {
    this.root = this.add.container(0, 0);
    this.add.rectangle(0, 0, 2000, 2000, 0x1c1917).setOrigin(0).setDepth(-10);
    
    this.createAnvil();
    this.createFurnace();

    this.handleResize(this.scale.gameSize);
    this.scale.on('resize', this.handleResize, this);
  }

  private handleResize(gameSize?: Phaser.Structs.Size) {
    const w = gameSize?.width ?? this.scale.width;
    const h = gameSize?.height ?? this.scale.height;
    const isPortrait = h > w;
    const s = Phaser.Math.Clamp(Math.min(w, h) / 720, 0.7, 1.3);

    if (isPortrait) {
        this.anvil.setPosition(w/2, h * 0.4).setScale(s * 1.2);
        this.furnace.setPosition(w/2, h * 0.7).setScale(s * 1.2);
    } else {
        this.anvil.setPosition(w * 0.35, h/2).setScale(s * 1.5);
        this.furnace.setPosition(w * 0.65, h/2).setScale(s * 1.5);
    }
  }

  private createAnvil() {
    this.anvil = this.add.container(0, 0);
    const base = this.add.rectangle(0, 20, 100, 40, 0x44403c).setStrokeStyle(2, 0x000);
    const top = this.add.rectangle(0, -10, 120, 30, 0x57534e).setStrokeStyle(2, 0x000);
    this.anvil.add([base, top]).setSize(120, 80).setInteractive().on('pointerdown', () => this.onInteract?.('ANVIL'));
    this.anvil.add(this.add.text(0, 50, 'ANVIL', { fontFamily: 'monospace', fontSize: '14px', color: '#78716c' }).setOrigin(0.5));
    this.root.add(this.anvil);
  }

  private createFurnace() {
    this.furnace = this.add.container(0, 0);
    if (this.hasFurnace) {
        const body = this.add.rectangle(0, 0, 120, 160, 0x333).setStrokeStyle(2, 0x000);
        const fire = this.add.circle(0, 20, 30, 0xea580c).setAlpha(0.6);
        this.tweens.add({ targets: fire, scale: 1.2, alpha: 0.8, yoyo: true, repeat: -1 });
        this.furnace.add([body, fire, this.add.text(0, -90, 'FURNACE', { fontSize: '14px', color: '#ea580c' }).setOrigin(0.5)]);
        body.setInteractive().on('pointerdown', () => this.onInteract?.('FURNACE'));
    } else {
        const outline = this.add.rectangle(0, 0, 120, 160).setStrokeStyle(2, 0x444);
        this.furnace.add([outline, this.add.text(0, 0, 'EMPTY SLOT', { fontSize: '12px', color: '#444' }).setOrigin(0.5)]);
        outline.setInteractive().on('pointerdown', () => this.onInteract?.('EMPTY_SLOT'));
    }
    this.root.add(this.furnace);
  }
}
