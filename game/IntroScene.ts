import Phaser from 'phaser';
import { getAssetUrl } from '../utils';

export default class IntroScene extends Phaser.Scene {
  private bgs: Phaser.GameObjects.Image[] = [];
  private dragon?: Phaser.GameObjects.Image;
  private narrativeTexts: Phaser.GameObjects.Text[] = [];
  private devText?: Phaser.GameObjects.Text;
  private skipHint?: Phaser.GameObjects.Text;
  private fireEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private breathOverlay?: Phaser.GameObjects.Rectangle;

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

  private createNarrativeText(text: string, color: string = '#ef4444') {
    const t = this.add
      .text(0, 0, text, {
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
    this.narrativeTexts.push(t);
    return t;
  }

  create() {
    if (this.scale.width <= 0 || this.scale.height <= 0) return;

    if (!this.textures.exists('intro_flame')) {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xff5500, 1).fillCircle(16, 16, 16).generateTexture('intro_flame', 32, 32).destroy();
    }

    this.input.once('pointerdown', () => {
        this.game.events.emit('intro-complete');
    });

    this.skipHint = this.add.text(0, 0, 'Touch anywhere to skip', {
        fontFamily: 'sans-serif', fontSize: '12px', color: '#57534e', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(20);

    const keys = ['intro_bg', 'intro_bg_02', 'intro_bg_03', 'intro_bg_04', 'intro_bg_05'];
    keys.forEach(key => {
        const img = this.add.image(0, 0, key).setAlpha(0).setDepth(1);
        this.bgs.push(img);
    });

    this.dragon = this.add.image(0, 0, 'intro_dragon').setDepth(2).setVisible(false);

    this.devText = this.add.text(0, 0, "CRYINGDEV STUDIO\nPRESENTS", {
      fontFamily: 'serif', fontSize: '45px', color: '#a8a29e', align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    const n1 = this.createNarrativeText("FIASCO,\nA MASTER OF DISASTER...", '#ef4444');
    const n2 = this.createNarrativeText("EVERTHING WE LOVED IS LOST...", '#ef4444');
    const n3 = this.createNarrativeText("BUT THE HAMMER IS STILL HERE.", '#ef4444');
    const nDespair = this.createNarrativeText("NEVER FORGET...", '#ef4444');
    const nVengeance = this.createNarrativeText("AND FORGED A VENGEANCE.", '#f59e0b');

    this.breathOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xff4400)
        .setAlpha(0).setDepth(5).setBlendMode(Phaser.BlendModes.ADD);

    this.fireEmitter = this.add.particles(0, 0, 'intro_flame', {
        speedY: { min: 1200, max: 2200 },
        speedX: { min: -600, max: 600 },
        scale: { start: 6, end: 15 },
        alpha: { start: 1, end: 0 },
        lifespan: 1500,
        quantity: 40,
        blendMode: 'ADD',
        emitting: false
    });
    this.fireEmitter.setDepth(4);

    this.handleResize();
    this.scale.on('resize', this.handleResize, this);

    this.startSequence(n1, n2, n3, nDespair, nVengeance);
  }

  private handleResize() {
    const w = this.scale.width;
    const h = this.scale.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const isCompact = h < 450;

    // Background Image Cover Scaling
    this.bgs.forEach(img => {
        img.setPosition(centerX, centerY);
        const scale = Math.max(w / img.width, h / img.height);
        img.setScale(scale);
    });

    if (this.dragon) {
        this.dragon.setPosition(centerX, isCompact ? centerY - 100 : centerY - 200);
        const dScale = (w * 0.8) / this.dragon.width;
        this.dragon.setScale(dScale);
    }

    if (this.devText) {
        this.devText.setPosition(centerX, centerY);
        this.devText.setFontSize(isCompact ? '32px' : '45px');
    }
    
    if (this.skipHint) this.skipHint.setPosition(centerX, h - 40);
    
    if (this.breathOverlay) {
        this.breathOverlay.setPosition(centerX, centerY).setSize(w, h);
    }

    this.narrativeTexts.forEach(t => {
        t.setPosition(centerX, centerY);
        t.setFontSize(isCompact ? '28px' : '40px');
    });

    const despairIdx = this.narrativeTexts.length - 2;
    if (this.narrativeTexts[despairIdx]) this.narrativeTexts[despairIdx].y = centerY - (isCompact ? 30 : 40);
    if (this.narrativeTexts[despairIdx + 1]) this.narrativeTexts[despairIdx + 1].y = centerY + (isCompact ? 30 : 40);

    if (this.fireEmitter) this.fireEmitter.setPosition(centerX, h * 0.15 + (isCompact ? 100 : 200));
  }

  private startSequence(n1: any, n2: any, n3: any, nD: any, nV: any) {
    this.tweens.chain({
      tweens: [
        { targets: this.devText, alpha: 1, duration: 2500, ease: 'Power2' },
        { targets: this.devText, alpha: 1, duration: 2000, onStart: () => this.cameras.main.shake(6000, 0.005) },
        { targets: this.devText, alpha: 0, duration: 2000, ease: 'Power2' },
        { targets: this.bgs[0], alpha: 1, duration: 1500, ease: 'Linear' },
        {
          targets: this.dragon,
          alpha: { from: 0, to: 1 },
          duration: 3000,
          ease: 'Sine.easeInOut',
          hold: 500,
          onStart: () => {
              this.dragon!.setVisible(true);
              this.cameras.main.shake(3500, 0.005); 
          }
        },
        { targets: this.dragon, y: '-=150', scale: '*=0.7', duration: 1000, ease: 'Quad.easeOut' },
        {
            targets: this.breathOverlay,
            alpha: 0.8,
            duration: 2500,
            yoyo: true, hold: 100,
            onStart: () => {
                this.fireEmitter!.start();
                this.cameras.main.shake(2500, 0.03);
            },
            onComplete: () => {
                this.fireEmitter!.stop();
                this.dragon!.setVisible(false);
            }
        },
        { targets: this.bgs[1], alpha: 1, duration: 2000, hold: 2500, ease: 'Linear' },
        { targets: n1, alpha: 1, duration: 1000, hold: 3000, ease: 'Power2' },
        { targets: n1, alpha: 0, duration: 1000, ease: 'Power2' },
        { targets: this.bgs[2], alpha: 1, duration: 2000, hold: 2500, ease: 'Linear' },
        { targets: n2, alpha: 1, duration: 1000, hold: 3000, ease: 'Power2' },
        { targets: n2, alpha: 0, duration: 1000, ease: 'Power2' },
        { targets: this.bgs[3], alpha: 1, duration: 3000, hold: 3500, ease: 'Linear' },
        { targets: n3, alpha: 1, duration: 1000, hold: 3000, ease: 'Power2' },
        { targets: n3, alpha: 0, duration: 1000, ease: 'Power2' },
        { targets: this.bgs[4], alpha: 1, duration: 3000, ease: 'Linear' },
        { targets: nD, alpha: 1, duration: 2000, ease: 'Power2', delay: 500 },
        { targets: nV, alpha: 1, duration: 2500, ease: 'Power2' },
        {
          targets: [...this.bgs, nD, nV],
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