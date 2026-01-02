import Phaser from 'phaser';
import { getAssetUrl } from '../utils';

export default class IntroScene extends Phaser.Scene {
  // Fix: Explicitly declare Phaser Scene properties to resolve TypeScript "Property does not exist" errors
  public add!: Phaser.GameObjects.GameObjectFactory;
  public tweens!: Phaser.Tweens.TweenManager;
  public scale!: Phaser.Scale.ScaleManager;
  public cameras!: Phaser.Cameras.Scene2D.CameraManager;
  public input!: Phaser.Input.InputPlugin;
  public time!: Phaser.Time.Clock;
  public events!: Phaser.Events.EventEmitter;
  public load!: Phaser.Loader.LoaderPlugin;
  public textures!: Phaser.Textures.TextureManager;
  public make!: Phaser.GameObjects.GameObjectCreator;
  public game!: Phaser.Game;

  private bgs: Phaser.GameObjects.Image[] = [];
  private dragon?: Phaser.GameObjects.Image;
  private narrativeTexts: Phaser.GameObjects.Text[] = [];
  private devText?: Phaser.GameObjects.Text;
  private skipHint?: Phaser.GameObjects.Text;
  private fireEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private breathOverlay?: Phaser.GameObjects.Rectangle;

  private root!: Phaser.GameObjects.Container;

  private lastPortrait?: boolean;
  private isRelayouting = false;

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
        color,
        align: 'center',
        fontStyle: 'italic',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);

    this.root.add(t);
    this.narrativeTexts.push(t);
    return t;
  }

  create() {
    if (this.scale.width <= 0 || this.scale.height <= 0) return;

    this.root = this.add.container(0, 0);

    if (!this.textures.exists('intro_flame')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xff5500, 1).fillCircle(16, 16, 16).generateTexture('intro_flame', 32, 32).destroy();
    }

    this.input.once('pointerdown', () => {
      this.game.events.emit('intro-complete');
    });

    this.skipHint = this.add
      .text(0, 0, 'Touch anywhere to skip', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#57534e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(20);
    this.root.add(this.skipHint);

    const keys = ['intro_bg', 'intro_bg_02', 'intro_bg_03', 'intro_bg_04', 'intro_bg_05'];
    keys.forEach((key) => {
      const img = this.add.image(0, 0, key).setAlpha(0).setDepth(1);
      this.root.add(img);
      this.bgs.push(img);
    });

    this.dragon = this.add.image(0, 0, 'intro_dragon').setDepth(2).setVisible(false);
    this.root.add(this.dragon);

    this.devText = this.add
      .text(0, 0, 'CRYINGDEV STUDIO\nPRESENTS', {
        fontFamily: 'serif',
        fontSize: '45px',
        color: '#a8a29e',
        align: 'center',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);
    this.root.add(this.devText);

    const n1 = this.createNarrativeText('FIASCO,\nA MASTER OF DISASTER...', '#ef4444');
    const n2 = this.createNarrativeText('EVERTHING WE LOVED IS LOST...', '#ef4444');
    const n3 = this.createNarrativeText('BUT THE HAMMER IS STILL HERE.', '#ef4444');
    const nD = this.createNarrativeText('NEVER FORGET...', '#ef4444');
    const nV = this.createNarrativeText('AND FORGED A VENGEANCE.', '#f59e0b');

    this.breathOverlay = this.add
      .rectangle(0, 0, 10, 10, 0xff4400)
      .setAlpha(0)
      .setDepth(5)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.root.add(this.breathOverlay);

    this.fireEmitter = this.add.particles(0, 0, 'intro_flame', {
      speedY: { min: 1200, max: 2200 },
      speedX: { min: -600, max: 600 },
      scale: { start: 6, end: 15 },
      alpha: { start: 1, end: 0 },
      lifespan: 1500,
      quantity: 40,
      blendMode: 'ADD',
      emitting: false,
    });
    this.fireEmitter.setDepth(4);
    this.root.add(this.fireEmitter);

    // layout + resize listeners
    this.handleResize(this.scale.gameSize);
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });

    // iOS: 첫 렌더 직후 viewport 안정화 타이밍 보정
    this.time.delayedCall(80, () => this.handleResize());
    this.time.delayedCall(180, () => this.handleResize());

    this.startSequence(n1, n2, n3, nD, nV);
  }

  private handleResize(gameSize?: Phaser.Structs.Size) {
    const w = gameSize?.width ?? this.scale.gameSize.width;
    const h = gameSize?.height ?? this.scale.gameSize.height;

    // 카메라 viewport는 항상 실제 화면으로
    this.cameras.main.setViewport(0, 0, w, h);

    const isPortrait = h > w;

    if (this.lastPortrait === undefined) {
      this.lastPortrait = isPortrait;
      isPortrait ? this.layoutPortrait(w, h) : this.layoutLandscape(w, h);
      return;
    }

    const changed = this.lastPortrait !== isPortrait;
    this.lastPortrait = isPortrait;

    // 방향 전환 시 iOS 중간 사이즈 튐 완화: 짧은 페이드 + 지연 레이아웃
    if (changed && !this.isRelayouting) {
      this.isRelayouting = true;
      const cam = this.cameras.main;

      cam.fadeOut(120, 0, 0, 0);

      this.time.delayedCall(140, () => {
        const ww = this.scale.gameSize.width;
        const hh = this.scale.gameSize.height;

        cam.setViewport(0, 0, ww, hh);
        (hh > ww) ? this.layoutPortrait(ww, hh) : this.layoutLandscape(ww, hh);

        cam.fadeIn(120, 0, 0, 0);

        this.time.delayedCall(160, () => {
          this.isRelayouting = false;
        });
      });

      return;
    }

    isPortrait ? this.layoutPortrait(w, h) : this.layoutLandscape(w, h);
  }

  private layoutLandscape(w: number, h: number) {
    const cx = w / 2;
    const cy = h / 2;

    const uiScale = Phaser.Math.Clamp(Math.min(w, h) / 720, 0.4, 1.2);

    this.bgs.forEach((img) => {
      img.setPosition(cx, cy);
      img.setScale(Math.max(w / img.width, h / img.height));
    });

    if (this.dragon) {
      const s = Math.min((h * 0.55) / this.dragon.height, (w * 0.9) / this.dragon.width);
      this.dragon.setScale(s);
      this.dragon.setPosition(cx, cy - h * 0.22);
    }

    this.devText?.setPosition(cx, cy).setFontSize(Math.round(45 * uiScale));

    if (this.skipHint) {
      this.skipHint.setPosition(cx, h - Math.max(24, h * 0.05));
      this.skipHint.setFontSize(Math.round(12 * uiScale));
    }

    this.breathOverlay?.setPosition(cx, cy).setSize(w, h);

    this.narrativeTexts.forEach((t) => {
      t.setPosition(cx, cy);
      t.setFontSize(Math.round(40 * uiScale));
    });

    const despairIdx = this.narrativeTexts.length - 2;
    const gap = Math.max(20, h * 0.08);
    if (this.narrativeTexts[despairIdx]) this.narrativeTexts[despairIdx].y = cy - gap / 2;
    if (this.narrativeTexts[despairIdx + 1]) this.narrativeTexts[despairIdx + 1].y = cy + gap / 2;

    if (this.fireEmitter) {
      const y = this.dragon ? this.dragon.y + this.dragon.displayHeight * 0.12 : h * 0.35;
      this.fireEmitter.setPosition(cx, y);
    }
  }

  private layoutPortrait(w: number, h: number) {
    const cx = w / 2;
    const cy = h / 2;

    const uiScale = Phaser.Math.Clamp(h / 900, 0.7, 1.15);

    this.bgs.forEach((img) => {
      img.setPosition(cx, cy);
      img.setScale(Math.max(w / img.width, h / img.height));
    });

    if (this.dragon) {
      const s = Math.min((w * 0.95) / this.dragon.width, (h * 0.38) / this.dragon.height);
      this.dragon.setScale(s);
      this.dragon.setPosition(cx, h * 0.28);
    }

    this.devText?.setPosition(cx, h * 0.42).setFontSize(Math.round(40 * uiScale));

    if (this.skipHint) {
      this.skipHint.setPosition(cx, h - Math.max(28, h * 0.04));
      this.skipHint.setFontSize(Math.round(12 * uiScale));
    }

    this.breathOverlay?.setPosition(cx, cy).setSize(w, h);

    const textBaseY = h * 0.62;

    this.narrativeTexts.forEach((t) => {
      t.setPosition(cx, textBaseY);
      t.setFontSize(Math.round(34 * uiScale));
    });

    const despairIdx = this.narrativeTexts.length - 2;
    const gap = Math.max(28, h * 0.06);
    if (this.narrativeTexts[despairIdx]) this.narrativeTexts[despairIdx].y = textBaseY - gap / 2;
    if (this.narrativeTexts[despairIdx + 1]) this.narrativeTexts[despairIdx + 1].y = textBaseY + gap / 2;

    if (this.fireEmitter) {
      const y = this.dragon ? this.dragon.y + this.dragon.displayHeight * 0.12 : h * 0.35;
      this.fireEmitter.setPosition(cx, y);
    }
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
          },
        },

        { targets: this.dragon, y: '-=150', scale: '*=0.7', duration: 1000, ease: 'Quad.easeOut' },

        {
          targets: this.breathOverlay,
          alpha: 0.8,
          duration: 2500,
          yoyo: true,
          hold: 100,
          onStart: () => {
            this.fireEmitter!.start();
            this.cameras.main.shake(2500, 0.03);
          },
          onComplete: () => {
            this.fireEmitter!.stop();
            this.dragon!.setVisible(false);
          },
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
          onComplete: () => this.game.events.emit('intro-complete'),
        },
      ],
    });
  }
}