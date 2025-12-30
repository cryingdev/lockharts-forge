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

  // ✅ Debug HUD
  private debugBg?: Phaser.GameObjects.Rectangle;
  private debugText?: Phaser.GameObjects.Text;
  private debugEnabled = true;

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

    this.narrativeTexts.push(t);
    return t;
  }

  create() {
    if (this.scale.width <= 0 || this.scale.height <= 0) return;

    // particle texture
    if (!this.textures.exists('intro_flame')) {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xff5500, 1).fillCircle(16, 16, 16).generateTexture('intro_flame', 32, 32).destroy();
    }

    // skip
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

    const keys = ['intro_bg', 'intro_bg_02', 'intro_bg_03', 'intro_bg_04', 'intro_bg_05'];
    keys.forEach((key) => {
      const img = this.add.image(0, 0, key).setAlpha(0).setDepth(1);
      this.bgs.push(img);
    });

    this.dragon = this.add.image(0, 0, 'intro_dragon').setDepth(2).setVisible(false);

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

    const n1 = this.createNarrativeText('FIASCO,\nA MASTER OF DISASTER...', '#ef4444');
    const n2 = this.createNarrativeText('EVERTHING WE LOVED IS LOST...', '#ef4444');
    const n3 = this.createNarrativeText('BUT THE HAMMER IS STILL HERE.', '#ef4444');
    const nD = this.createNarrativeText('NEVER FORGET...', '#ef4444');
    const nV = this.createNarrativeText('AND FORGED A VENGEANCE.', '#f59e0b');

    this.breathOverlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0xff4400)
      .setAlpha(0)
      .setDepth(5)
      .setBlendMode(Phaser.BlendModes.ADD);

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

    // ✅ Debug HUD 생성
    this.createDebugHUD();
    this.updateDebugHUD('create()');

    // resize
    this.handleResize(this.scale.gameSize);
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.handleResize(gameSize);
      this.updateDebugHUD('scale.resize');
    });

    // window events (Scene 종료 시 제거)
    window.addEventListener('orientationchange', this.onOrientationChange);
    window.addEventListener('resize', this.onWindowResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('orientationchange', this.onOrientationChange);
      window.removeEventListener('resize', this.onWindowResize);
    });

    // HUD 토글 (두 손가락 탭 등으로 바꾸고 싶으면 여기 수정)
    this.input.keyboard?.on('keydown-D', () => {
      this.debugEnabled = !this.debugEnabled;
      this.debugBg?.setVisible(this.debugEnabled);
      this.debugText?.setVisible(this.debugEnabled);
      this.updateDebugHUD('toggle');
    });

    this.startSequence(n1, n2, n3, nD, nV);
  }

  // ===== Debug HUD =====
  private createDebugHUD() {
    const pad = 8;
    const w = 520;
    const h = 120;

    this.debugBg = this.add
      .rectangle(pad, pad, w, h, 0x000000, 0.65)
      .setOrigin(0, 0)
      .setDepth(99999);

    this.debugText = this.add
      .text(pad + 10, pad + 8, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        lineSpacing: 4,
      })
      .setDepth(100000);

    // 카메라와 무관하게 화면 고정
    this.debugBg.setScrollFactor(0);
    this.debugText.setScrollFactor(0);
  }

  private updateDebugHUD(tag: string) {
    if (!this.debugEnabled || !this.debugText) return;

    const gsW = Math.round(this.scale.gameSize.width);
    const gsH = Math.round(this.scale.gameSize.height);

    const scW = Math.round(this.scale.width);
    const scH = Math.round(this.scale.height);

    const ww = Math.round(window.innerWidth);
    const wh = Math.round(window.innerHeight);

    const vvw = Math.round(window.visualViewport?.width ?? 0);
    const vvh = Math.round(window.visualViewport?.height ?? 0);

    const dpr = (window.devicePixelRatio ?? 1).toFixed(2);
    const orient = gsH > gsW ? 'portrait' : 'landscape';

    this.debugText.setText([
      `[${tag}]`,
      `phaser gameSize: ${gsW}x${gsH} (${orient})`,
      `phaser scale:    ${scW}x${scH}`,
      `window:         ${ww}x${wh}`,
      `visualViewport: ${vvw}x${vvh}`,
      `dpr:            ${dpr}`,
    ].join('\n'));
  }

  private onOrientationChange = () => {
    // orientationchange 직후 값이 늦게 바뀌는 브라우저 대응
    this.updateDebugHUD('orientationchange');
    this.time.delayedCall(60, () => this.updateDebugHUD('orientation+60ms'));
    this.time.delayedCall(180, () => this.updateDebugHUD('orientation+180ms'));
  };

  private onWindowResize = () => {
    this.updateDebugHUD('window.resize');
    this.time.delayedCall(60, () => this.updateDebugHUD('resize+60ms'));
  };

  // ===== Responsive layout =====
  private handleResize(gameSize?: Phaser.Structs.Size) {
    const w = gameSize?.width ?? this.scale.gameSize.width;
    const h = gameSize?.height ?? this.scale.gameSize.height;
    const cx = w / 2;
    const cy = h / 2;

    const isPortrait = h > w;
    const uiScale = Phaser.Math.Clamp(Math.min(w, h) / 720, 0.55, 1.15);

    // BG cover
    this.bgs.forEach((img) => {
      img.setPosition(cx, cy);
      const s = Math.max(w / img.width, h / img.height);
      img.setScale(s);
    });

    // dragon: portrait면 조금 더 위로/작게
    if (this.dragon) {
      const maxW = w * 0.9;
      const maxH = isPortrait ? h * 0.42 : h * 0.55;
      const s = Math.min(maxW / this.dragon.width, maxH / this.dragon.height);
      this.dragon.setScale(s);
      this.dragon.setPosition(cx, cy - h * (isPortrait ? 0.22 : 0.18));
    }

    if (this.devText) {
      this.devText.setPosition(cx, cy);
      this.devText.setFontSize(Math.round(45 * uiScale));
    }

    if (this.skipHint) {
      this.skipHint.setPosition(cx, h - Math.max(28, h * 0.06));
      this.skipHint.setFontSize(Math.round(12 * uiScale));
    }

    if (this.breathOverlay) {
      this.breathOverlay.setPosition(cx, cy).setSize(w, h);
    }

    this.narrativeTexts.forEach((t) => {
      t.setPosition(cx, cy);
      t.setFontSize(Math.round(40 * uiScale));
    });

    // despair / vengeance split
    const despairIdx = this.narrativeTexts.length - 2;
    const gap = Math.max(24, h * 0.06);
    if (this.narrativeTexts[despairIdx]) this.narrativeTexts[despairIdx].y = cy - gap / 2;
    if (this.narrativeTexts[despairIdx + 1]) this.narrativeTexts[despairIdx + 1].y = cy + gap / 2;

    // fire origin
    if (this.fireEmitter) {
      const mouthY = this.dragon ? this.dragon.y + this.dragon.displayHeight * 0.1 : h * 0.35;
      this.fireEmitter.setPosition(cx, mouthY);
    }

    // debug HUD는 상단 고정이라 따로 위치 조정 필요 없음
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