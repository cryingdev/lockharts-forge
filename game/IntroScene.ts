
import Phaser from 'phaser';
import { getAssetUrl } from '../utils';

export default class IntroScene extends Phaser.Scene {
  declare public add: Phaser.GameObjects.GameObjectFactory;
  declare public tweens: Phaser.Tweens.TweenManager;
  declare public scale: Phaser.Scale.ScaleManager;
  declare public cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare public input: Phaser.Input.InputPlugin;
  declare public time: Phaser.Time.Clock;
  declare public events: Phaser.Events.EventEmitter;
  declare public load: Phaser.Loader.LoaderPlugin;
  declare public textures: Phaser.Textures.TextureManager;
  declare public make: Phaser.GameObjects.GameObjectCreator;
  declare public game: Phaser.Game;

  private bgs: Phaser.GameObjects.Image[] = [];
  private dragon?: Phaser.GameObjects.Image;
  private flyingDragon?: Phaser.GameObjects.Image;
  private dragonGlow?: Phaser.GameObjects.Arc;
  private narrativeTexts: Phaser.GameObjects.Text[] = [];
  private devText?: Phaser.GameObjects.Text;
  private skipHint?: Phaser.GameObjects.Text;
  private fireEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private boilingFireEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private embersEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
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
    this.load.image('intro_dragon', getAssetUrl('dragon_front.png'));
    this.load.image('dragon_top', getAssetUrl('dragon_top.png'));
  }

  private createNarrativeText(text: string, color: string = '#b91c1c') {
    const t = this.add
      .text(0, 0, text, {
        fontFamily: '"Grenze Gotisch"',
        fontSize: '40px',
        color,
        align: 'center',
        fontStyle: '900',
        stroke: '#000000',
        strokeThickness: 5,
        shadow: { color: '#000', fill: true, offsetX: 0, offsetY: 4, blur: 15 },
        wordWrap: { width: 320, useAdvancedWrap: true }
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

    if (!this.textures.exists('intro_ember')) {
        const g = this.make.graphics({ x: 0, y: 0 });
        g.fillStyle(0xffaa00, 1).fillCircle(4, 4, 4).generateTexture('intro_ember', 8, 8).destroy();
    }

    this.input.once('pointerdown', () => {
      this.game.events.emit('intro-complete');
    });

    this.skipHint = this.add
      .text(0, 0, 'TOUCH TO SKIP', {
        fontFamily: '"Grenze"',
        fontSize: '14px',
        color: '#a8a29e',
        fontStyle: 'bold',
        letterSpacing: 2,
        shadow: { color: '#000', fill: true, blur: 6 }
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

    this.dragon = this.add.image(0, 0, 'intro_dragon').setDepth(2).setVisible(false).setAlpha(1);
    this.root.add(this.dragon);

    this.flyingDragon = this.add.image(0, 0, 'dragon_top').setDepth(6).setVisible(false).setAlpha(1);
    this.root.add(this.flyingDragon);

    this.dragonGlow = this.add.circle(0, 0, 100, 0xff0000, 0.4).setDepth(1.5).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.root.add(this.dragonGlow);

    this.devText = this.add
      .text(0, 0, '', { //CRYINGDEV STUDIO\nPRESENTS
        fontFamily: '"Grenze Gotisch"',
        fontSize: '48px',
        color: '#f5f5f4',
        align: 'center',
        fontStyle: '900',
        stroke: '#000000',
        strokeThickness: 6,
        shadow: { color: '#000', fill: true, blur: 20 }
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);
    this.root.add(this.devText);

    const n1 = this.createNarrativeText('FIASCO,\nA MASTER OF DISASTER...', '#b91c1c');
    const n2 = this.createNarrativeText('EVERYTHING WE LOVED\nIS LOST...', '#b91c1c');
    const n3 = this.createNarrativeText('BUT THE HAMMER\nIS STILL HERE.', '#b91c1c');
    const nD = this.createNarrativeText('NEVER FORGET...', '#b91c1c');
    const nV = this.createNarrativeText('AND FORGED\nA VENGEANCE.', '#d97706');

    this.breathOverlay = this.add
      .rectangle(0, 0, 10, 10, 0xff4400)
      .setAlpha(0)
      .setDepth(5)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.root.add(this.breathOverlay);

    // 드래곤 브레스 파티클 (집중적)
    this.fireEmitter = this.add.particles(0, 0, 'intro_flame', {
      speedY: { min: 1400, max: 3200 },
      speedX: { min: -1800, max: 1800 },
      scale: { start: 10, end: 32 },
      alpha: { start: 1, end: 0 },
      lifespan: 1800,
      quantity: 100,
      blendMode: 'ADD',
      emitting: false,
    });
    this.fireEmitter.setDepth(4);
    this.root.add(this.fireEmitter);

    // 화면 전체 불길 이미터 (들끓는 효과)
    this.boilingFireEmitter = this.add.particles(0, 0, 'intro_flame', {
        x: { min: 0, max: 1280 },
        y: 720,
        speedY: { min: -200, max: -800 },
        speedX: { min: -100, max: 100 },
        scale: { start: 8, end: 20 },
        alpha: { start: 0.6, end: 0 },
        lifespan: { min: 1000, max: 2500 },
        frequency: 50,
        blendMode: 'ADD',
        emitting: false,
    });
    this.boilingFireEmitter.setDepth(4.5);
    this.root.add(this.boilingFireEmitter);

    // 화면 전체 불씨 이미터
    this.embersEmitter = this.add.particles(0, 0, 'intro_ember', {
        x: { min: 0, max: 1280 },
        y: { min: 0, max: 720 },
        speedY: { min: -50, max: -150 },
        speedX: { min: -50, max: 50 },
        scale: { start: 1, end: 2.5 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 2000, max: 4000 },
        frequency: 30,
        blendMode: 'ADD',
        emitting: false,
    });
    this.embersEmitter.setDepth(7);
    this.root.add(this.embersEmitter);

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });

    this.handleResize(this.scale.gameSize);

    this.startSequence(n1, n2, n3, nD, nV);
  }

  private handleResize(gameSize?: Phaser.Structs.Size) {
    const w = gameSize?.width ?? this.scale.gameSize.width;
    const h = gameSize?.height ?? this.scale.gameSize.height;
    this.cameras.main.setViewport(0, 0, w, h);
    const isPortrait = h > w;

    if (this.lastPortrait === undefined) {
      this.lastPortrait = isPortrait;
      isPortrait ? this.layoutPortrait(w, h) : this.layoutLandscape(w, h);
      return;
    }

    const changed = this.lastPortrait !== isPortrait;
    this.lastPortrait = isPortrait;

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
        this.time.delayedCall(160, () => { this.isRelayouting = false; });
      });
      return;
    }
    isPortrait ? this.layoutPortrait(w, h) : this.layoutLandscape(w, h);
  }

  private layoutLandscape(w: number, h: number) {
    const cx = w / 2;
    const cy = h / 2;
    const uiScale = Phaser.Math.Clamp(Math.min(w, h) / 720, 0.6, 1.2);
    this.bgs.forEach((img) => {
      img.setPosition(cx, cy);
      img.setScale(Math.max(w / img.width, h / img.height));
    });
    
    if (this.dragon) {
      const targetY = h / 7;
      const s = (w * 1.5) / this.dragon.width;
      this.dragon.setScale(s);
      this.dragon.setPosition(cx, targetY);
      const postionMouthY = targetY + this.dragon.displayHeight * 0.65;
      this.dragonGlow?.setPosition(cx, postionMouthY).setRadius(w * 0.5);
      
      if (this.fireEmitter) {
        this.fireEmitter.setPosition(cx, postionMouthY);
      }
    }

    if (this.boilingFireEmitter) {
        this.boilingFireEmitter.setPosition(0, h);
        this.boilingFireEmitter.setEmitZone({ type: 'random', source: new Phaser.Geom.Rectangle(0, 0, w, 20) } as any);
    }
    if (this.embersEmitter) {
        this.embersEmitter.setEmitZone({ type: 'random', source: new Phaser.Geom.Rectangle(0, 0, w, h) } as any);
    }

    if (this.flyingDragon) {
      const s = (w * 1.8) / this.flyingDragon.width;
      this.flyingDragon.setScale(s);
      this.flyingDragon.setPosition(cx, -1000);
    }
    
    this.devText?.setPosition(cx, cy).setFontSize(Math.round(48 * uiScale));
    if (this.skipHint) {
      this.skipHint.setPosition(cx, h - 24);
      this.skipHint.setFontSize(Math.round(14 * uiScale));
    }
    this.breathOverlay?.setPosition(cx, cy).setSize(w, h);

    // 일반 서사 텍스트 정렬
    this.narrativeTexts.forEach((t, i) => {
      // 마지막 두 문장(nD, nV)은 겹치지 않게 분리 정렬
      if (i === 3) { // nD: "NEVER FORGET..."
        t.setPosition(cx, cy - 50 * uiScale);
      } else if (i === 4) { // nV: "AND FORGED A VENGEANCE."
        t.setPosition(cx, cy + 50 * uiScale);
      } else {
        t.setPosition(cx, cy);
      }
      t.setFontSize(Math.round(40 * uiScale));
      t.setWordWrapWidth(w * 0.75);
    });
  }

  private layoutPortrait(w: number, h: number) {
    const cx = w / 2;
    const cy = h / 2;
    const uiScale = Phaser.Math.Clamp(w / 400, 0.7, 1.0);
    this.bgs.forEach((img) => {
      img.setPosition(cx, cy);
      img.setScale(Math.max(w / img.width, h / img.height));
    });
    
  if (this.dragon) {
      const targetY = h / 7;
      const s = (w * 1.5) / this.dragon.height;
      this.dragon.setScale(s);
      this.dragon.setPosition(cx, targetY);
      const postionMouthY = targetY + this.dragon.displayHeight * 0.65;
      this.dragonGlow?.setPosition(cx, postionMouthY).setRadius(w * 0.5);
      
      if (this.fireEmitter) {
        this.fireEmitter.setPosition(cx, postionMouthY);
      }
    }

    if (this.boilingFireEmitter) {
        this.boilingFireEmitter.setPosition(0, h);
        this.boilingFireEmitter.setEmitZone({ type: 'random', source: new Phaser.Geom.Rectangle(0, 0, w, 20) } as any);
    }
    if (this.embersEmitter) {
        this.embersEmitter.setEmitZone({ type: 'random', source: new Phaser.Geom.Rectangle(0, 0, w, h) } as any);
    }

    if (this.flyingDragon) {
      const s = (w * 2.0) / this.flyingDragon.width;
      this.flyingDragon.setScale(s * 2.0);
      this.flyingDragon.setPosition(cx, -1000);
    }
    
    this.devText?.setPosition(cx, h * 0.45).setFontSize(Math.round(44 * uiScale));
    if (this.skipHint) {
      this.skipHint.setPosition(cx, h - 36);
      this.skipHint.setFontSize(Math.round(14 * uiScale));
    }
    this.breathOverlay?.setPosition(cx, cy).setSize(w, h);
    
    this.narrativeTexts.forEach((t, i) => {
      if (i === 3) { // nD
        t.setPosition(cx, cy - 70 * uiScale);
      } else if (i === 4) { // nV
        t.setPosition(cx, cy + 70 * uiScale);
      } else {
        t.setPosition(cx, cy);
      }
      t.setFontSize(Math.round(36 * uiScale));
      t.setWordWrapWidth(w * 0.9);
    });
  }

  private startSequence(n1: any, n2: any, n3: any, nD: any, nV: any) {
    const h = this.scale.height;
    const targetY = h / 6;
    
    this.tweens.chain({
      tweens: [
        { targets: this.devText, alpha: 1, duration: 0, ease: 'Power2' },
        { targets: this.devText, alpha: 1, duration: 0, onStart: () => this.cameras.main.shake(6000, 0.005) },
        { targets: this.devText, alpha: 0, duration: 0, ease: 'Power2' },
        { targets: this.bgs[0], alpha: 1, duration: 1500, ease: 'Linear' },
        {
          targets: this.dragon,
          alpha: { from: 1, to: 1 },
          y: { from: -1000, to: targetY },
          scale: { from: this.dragon!.scaleX * 0.6, to: this.dragon!.scaleX },
          duration: 3800,
          ease: 'Back.easeOut',
          onStart: () => {
            this.dragon!.setVisible(true);
            this.cameras.main.shake(4000, 0.009);
          },
        },
        {
          targets: this.dragonGlow,
          alpha: { from: 0, to: 1 },
          scale: { from: 0.2, to: 1.6 },
          duration: 1300,
          onStart: () => this.dragonGlow!.setVisible(true),
          ease: 'Sine.easeInOut'
        },
        {
          targets: this.breathOverlay,
          alpha: 1,
          duration: 2500,
          yoyo: true,
          hold: 1000,
          onStart: () => {
            this.fireEmitter!.start();
            this.cameras.main.shake(3000, 0.07);
            this.dragonGlow!.setVisible(false);
          },
          onComplete: () => {
            this.fireEmitter!.stop();
            this.dragon!.setVisible(false);
            
            // "들끓는 불길" 효과 시작
            this.boilingFireEmitter!.start();
            this.embersEmitter!.start();
            
            // 오버레이가 사라지지 않고 미세하게 펄스하며 열기 유도
            this.tweens.add({
                targets: this.breathOverlay,
                alpha: { from: 0.2, to: 0.4 },
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // 지속적인 미세 진동
            this.cameras.main.shake(60000, 0.002);
          },
        },
        {
          targets: this.flyingDragon,
          y: { from: -800, to: h + 800 },
          duration: 2800,
          ease: 'Sine.easeInOut',
          onStart: () => {
            this.flyingDragon!.setVisible(true);
            this.cameras.main.shake(2500, 0.004);
          },
          onComplete: () => {
            this.flyingDragon!.setVisible(false);
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
          targets: [...this.bgs, nD, nV, this.breathOverlay],
          alpha: 0,
          duration: 3000,
          delay: 3000,
          onComplete: () => {
            this.boilingFireEmitter!.stop();
            this.embersEmitter!.stop();
            this.game.events.emit('intro-complete');
          },
        },
      ],
    });
  }
}
