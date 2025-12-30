import Phaser from 'phaser';
import { getAssetUrl } from '../utils';

export default class IntroScene extends Phaser.Scene {
  add!: Phaser.GameObjects.GameObjectFactory;
  tweens!: Phaser.Tweens.TweenManager;
  cameras!: Phaser.Cameras.Scene2D.CameraManager;
  time!: Phaser.Time.Clock;
  load!: Phaser.Loader.LoaderPlugin;
  make!: Phaser.GameObjects.GameObjectCreator;
  scale!: Phaser.Scale.ScaleManager;
  textures!: Phaser.Textures.TextureManager;
  input!: Phaser.Input.InputPlugin;
  game!: Phaser.Game;

  constructor() {
    super('IntroScene');
  }

  preload() {
    this.load.image('intro_bg', getAssetUrl('intro_bg_01.png'));
    this.load.image('intro_bg_02', getAssetUrl('intro_bg_02.png'));
    this.load.image('intro_bg_03', getAssetUrl('intro_bg_03.png'));
    this.load.image('intro_bg_04', getAssetUrl('intro_bg_04.png'));
    this.load.image('intro_bg_05', getAssetUrl('intro_bg_05.png'));
    this.load.image('intro_dragon', getAssetUrl('intro_dragon_02.png'));
  }
  
  private createNarrativeText(x: number, y: number, text: string, color: string = '#ef4444') {
    return this.add
      .text(x, y, text, {
        fontFamily: 'serif',
        fontSize: '40px',
        color: color,
        align: 'center',
        fontStyle: 'italic',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);
  }

  create() {
    const { width, height } = this.scale;
    if (width <= 0 || height <= 0) return; // Prevent WebGL initialization issues

    const centerX = width / 2;
    const centerY = height / 2;

    // --- Global Fallback Textures ---
    if (!this.textures.exists('white')) {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 2, 2);
        graphics.generateTexture('white', 2, 2);
        graphics.destroy();
    }

    // --- Asset Generation (Procedural Fire) ---
    if (!this.textures.exists('intro_flame')) {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xff5500, 1);
        graphics.fillCircle(16, 16, 16);
        graphics.generateTexture('intro_flame', 32, 32);
        graphics.destroy();
    }

    this.input.once('pointerdown', () => {
        this.game.events.emit('intro-complete');
    });

    const skipHint = this.add.text(centerX, height - 40, 'Touch anywhere to skip', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#57534e',
        fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(20);

    this.tweens.add({
        targets: skipHint,
        alpha: { from: 0, to: 0.5 },
        duration: 1000,
        delay: 1000,
        hold: 2000,
        yoyo: true
    });

    this.add.rectangle(centerX, centerY, width, height, 0x000000).setDepth(0);

    const createBg = (key: string, depth: number) => {
        const img = this.add.image(centerX, centerY, key).setAlpha(0).setDepth(depth);
        const scaleX = width / img.width;
        const scaleY = height / img.height;
        img.setScale(Math.max(scaleX, scaleY));
        return img;
    };

    const bg1 = createBg('intro_bg', 1);
    const bg2 = createBg('intro_bg_02', 1);
    const bg3 = createBg('intro_bg_03', 1);
    const bg4 = createBg('intro_bg_04', 1);
    const bg5 = createBg('intro_bg_05', 1);

    const dragon = this.add.image(centerX, 0, 'intro_dragon').setDepth(2);
    const finalDragonScale = width / dragon.width;
    dragon.setScale(finalDragonScale * 0.2);
    const loomY = centerY; 
    const attackY = height * 0.15; 
    dragon.y = -dragon.height;
    dragon.setVisible(false);

    const devText = this.add.text(centerX, centerY, "CRYINGDEV STUDIO\nPRESENTS", {
      fontFamily: 'serif',
      fontSize: '45px',
      color: '#a8a29e',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    const narrativeText1 = this.createNarrativeText(centerX, centerY, "FIASCO,\nA MASTER OF DISASTER...", '#ef4444');
    const narrativeText2 = this.createNarrativeText(centerX, centerY, "EVERTHING WE LOVED IS LOST...", '#ef4444');
    const narrativeText3 = this.createNarrativeText(centerX, centerY, "BUT THE HAMMER IS STILL HERE.", '#ef4444');
    const textDespair = this.createNarrativeText(centerX, centerY - 40, "NEVER FORGET...", '#ef4444');
    const textVengeance = this.createNarrativeText(centerX, centerY + 40, "AND FORGED A VENGEANCE.", '#f59e0b');

    const breathOverlay = this.add.rectangle(centerX, centerY, width, height, 0xff4400)
        .setAlpha(0)
        .setDepth(5)
        .setBlendMode(Phaser.BlendModes.ADD);

    let breathSpread = 50;
    const fireEmitter = this.add.particles(centerX, -50, 'intro_flame', {
        speedY: { min: 1200, max: 2200 },
        speedX: { onEmit: () => Phaser.Math.Between(-breathSpread, breathSpread) },
        scale: { start: 6, end: 15 },
        alpha: { start: 1, end: 0 },
        lifespan: 1500,
        quantity: 40,
        blendMode: 'ADD',
        emitting: false
    });
    fireEmitter.setDepth(4);

    this.tweens.chain({
      tweens: [
        { targets: devText, alpha: 1, duration: 2500, ease: 'Power2' },
        { targets: devText, alpha: 1, duration: 2000, onStart: () => this.cameras.main.shake(6000, 0.005) },
        { targets: devText, alpha: 0, duration: 2000, ease: 'Power2' },
        { targets: bg1, alpha: 1, duration: 1500, ease: 'Linear' },
        {
          targets: dragon,
          y: loomY - 200,
          scale: finalDragonScale,
          duration: 3000,
          ease: 'Sine.easeInOut',
          hold: 500,
          onStart: () => {
              dragon.setVisible(true);
              this.cameras.main.shake(3500, 0.005); 
          }
        },
        { targets: dragon, y: 0, scale: finalDragonScale * 0.7, duration: 1000, ease: 'Quad.easeOut' },
        {
            targets: breathOverlay,
            alpha: 0.8,
            duration: 2500,
            yoyo: true, 
            hold: 100,
            onStart: () => {
                fireEmitter.setPosition(centerX, attackY + 200);
                breathSpread = 50;
                fireEmitter.start();
                this.cameras.main.shake(2500, 0.03);
            },
            onUpdate: (tween: Phaser.Tweens.Tween) => {
                breathSpread = 50 + (tween.progress * 1200);
            },
            onComplete: () => {
                fireEmitter.stop();
                dragon.setVisible(false);
            }
        },
        { targets: bg2, alpha: 1, duration: 2000, hold: 2500, ease: 'Linear' },
        { targets: narrativeText1, alpha: 1, duration: 1000, hold: 3000, ease: 'Power2', offset: '-=1000' },
        { targets: narrativeText1, alpha: 0, duration: 1000, ease: 'Power2' },
        { targets: bg3, alpha: 1, duration: 2000, hold: 2500, ease: 'Linear' },
        { targets: narrativeText2, alpha: 1, duration: 1000, hold: 3000, ease: 'Power2', offset: '-=1000' },
        { targets: narrativeText2, alpha: 0, duration: 1000, ease: 'Power2' },
        { targets: bg4, alpha: 1, duration: 3000, hold: 3500, ease: 'Linear' },
        { targets: narrativeText3, alpha: 1, duration: 1000, hold: 3000, ease: 'Power2', offset: '-=1000' },
        { targets: narrativeText3, alpha: 0, duration: 1000, ease: 'Power2' },
        { targets: bg5, alpha: 1, duration: 3000, ease: 'Linear' },
        { targets: textDespair, alpha: 1, duration: 2000, ease: 'Power2', delay: 500 },
        { targets: textVengeance, alpha: 1, duration: 2500, ease: 'Power2', offset: '-=1000' },
        {
          targets: [bg1, bg2, bg3, bg4, bg5, textDespair, textVengeance],
          alpha: 0,
          duration: 3000,
          delay: 3000,
          onComplete: () => {
            this.game.events.emit('intro-complete');
          }
        }
      ]
    });
  }
}