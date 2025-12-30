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

  // ===== Debug Console UI =====
  private debugConsole?: Phaser.GameObjects.Container;
  private debugBg?: Phaser.GameObjects.Rectangle;
  private debugHeader?: Phaser.GameObjects.Rectangle;
  private debugTitle?: Phaser.GameObjects.Text;
  private debugTextObj?: Phaser.GameObjects.Text;

  private debugLines: string[] = [];
  private debugMaxLines = 18;
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

    // Create particle texture if missing
    if (!this.textures.exists('intro_flame')) {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics
        .fillStyle(0xff5500, 1)
        .fillCircle(16, 16, 16)
        .generateTexture('intro_flame', 32, 32)
        .destroy();
    }

    // Skip on first tap
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

    // Backgrounds
    const keys = ['intro_bg', 'intro_bg_02', 'intro_bg_03', 'intro_bg_04', 'intro_bg_05'];
    keys.forEach((key) => {
      const img = this.add.image(0, 0, key).setAlpha(0).setDepth(1);
      this.bgs.push(img);
    });

    // Dragon
    this.dragon = this.add.image(0, 0, 'intro_dragon').setDepth(2).setVisible(false);

    // Dev text
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

    // Narrative texts
    const n1 = this.createNarrativeText('FIASCO,\nA MASTER OF DISASTER...', '#ef4444');
    const n2 = this.createNarrativeText('EVERTHING WE LOVED IS LOST...', '#ef4444');
    const n3 = this.createNarrativeText('BUT THE HAMMER IS STILL HERE.', '#ef4444');
    const nDespair = this.createNarrativeText('NEVER FORGET...', '#ef4444');
    const nVengeance = this.createNarrativeText('AND FORGED A VENGEANCE.', '#f59e0b');

    // Fire breath overlay
    this.breathOverlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0xff4400)
      .setAlpha(0)
      .setDepth(5)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Fire emitter
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

    // Initial layout + resize hook
    this.handleResize(this.scale.gameSize);
    this.scale.on('resize', this.handleResize, this);

    // ===== Debug Console =====
    this.createDebugConsole();
    this.debugLog('IntroScene created');
    this.debugSnapshot();

    this.scale.on(
      'resize',
      () => {
        this.debugLog('resize event');
        this.debugSnapshot();
      },
      this
    );

    window.addEventListener('orientationchange', this.onOrientationChange);
    window.addEventListener('resize', this.onWindowResize);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('orientationchange', this.onOrientationChange);
      window.removeEventListener('resize', this.onWindowResize);
    });

    // Start sequence
    this.startSequence(n1, n2, n3, nDespair, nVengeance);
  }

  // ===== Resize / Layout =====
  private handleResize(gameSize?: Phaser.Structs.Size) {
    const w = gameSize?.width ?? this.scale.gameSize.width;
    const h = gameSize?.height ?? this.scale.gameSize.height;
    const centerX = w / 2;
    const centerY = h / 2;

    // Keep camera viewport aligned to wrapper/canvas
    this.cameras.main.setViewport(0, 0, w, h);

    // Continuous UI scale
    const uiScale = Phaser.Math.Clamp(Math.min(w, h) / 720, 0.6, 1.2);

    // BG: "height-fit" (vertical always matches, horizontal may crop)
    this.bgs.forEach((img) => {
      img.setPosition(centerX, centerY);
      const scale = h / img.height; // height-fit
      img.setScale(scale);
    });

    // Dragon: prefer height-fit but prevent overflow by width
    if (this.dragon) {
      const dScaleByHeight = (h * 0.55) / this.dragon.height;
      const dScaleByWidth = (w * 0.9) / this.dragon.width;
      const dScale = Math.min(dScaleByHeight, dScaleByWidth);
      this.dragon.setScale(dScale);
      this.dragon.setPosition(centerX, centerY - h * 0.18);
    }

    if (this.devText) {
      this.devText.setPosition(centerX, centerY);
      this.devText.setFontSize(Math.round(45 * uiScale));
    }

    if (this.skipHint) {
      this.skipHint.setPosition(centerX, h - Math.max(24, h * 0.05));
      this.skipHint.setFontSize(Math.round(12 * uiScale));
    }

    if (this.breathOverlay) {
      this.breathOverlay.setPosition(centerX, centerY).setSize(w, h);
    }

    this.narrativeTexts.forEach((t) => {
      t.setPosition(centerX, centerY);
      t.setFontSize(Math.round(40 * uiScale));
    });

    // Separate last two lines with ratio-based gap
    const despairIdx = this.narrativeTexts.length - 2;
    const gap = Math.max(24, h * 0.06);
    if (this.narrativeTexts[despairIdx]) this.narrativeTexts[despairIdx].y = centerY - gap / 2;
    if (this.narrativeTexts[despairIdx + 1]) this.narrativeTexts[despairIdx + 1].y = centerY + gap / 2;

    // Fire emitter near dragon "mouth"
    if (this.fireEmitter) {
      if (this.dragon) {
        const mouthY = this.dragon.y + this.dragon.displayHeight * 0.1;
        this.fireEmitter.setPosition(centerX, mouthY);
      } else {
        this.fireEmitter.setPosition(centerX, h * 0.35);
      }
    }

    // Keep debug console pinned
    this.layoutDebugConsole();
  }

  // ===== Tween Sequence =====
  private startSequence(n1: any, n2: any, n3: any, nD: any, nV: any) {
    this.tweens.chain({
      tweens: [
        { targets: this.devText, alpha: 1, duration: 2500, ease: 'Power2' },
        {
          targets: this.devText,
          alpha: 1,
          duration: 2000,
          onStart: () => this.cameras.main.shake(6000, 0.005),
        },
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
          onComplete: () => {
            this.game.events.emit('intro-complete');
          },
        },
      ],
    });
  }

  // ===== Debug Console: Window events =====
  private onOrientationChange = () => {
    this.debugLog('window orientationchange');
    this.time.delayedCall(50, () => this.debugSnapshot());
  };

  private onWindowResize = () => {
    this.debugLog('window resize');
    this.time.delayedCall(50, () => this.debugSnapshot());
  };

  // ===== Debug Console UI =====
  private createDebugConsole() {
    if (this.debugConsole) return;

    const w = this.scale.gameSize.width;
    const h = this.scale.gameSize.height;

    const panelH = Math.floor(h * 0.4);
    const panelW = Math.min(w - 20, 520);

    const x = 10;
    const y = h - panelH - 10;

    this.debugBg = this.add
      .rectangle(x, y, panelW, panelH, 0x000000, 0.65)
      .setOrigin(0, 0)
      .setDepth(10000);

    const headerH = 26;
    this.debugHeader = this.add
      .rectangle(x, y, panelW, headerH, 0x111827, 0.85)
      .setOrigin(0, 0)
      .setDepth(10001);

    this.debugTitle = this.add
      .text(x + 10, y + 5, 'DEBUG CONSOLE (3-finger tap to toggle)', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#a7f3d0',
      })
      .setDepth(10002);

    this.debugTextObj = this.add
      .text(x + 10, y + headerH + 8, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#e5e7eb',
        wordWrap: { width: panelW - 20, useAdvancedWrap: true },
      })
      .setDepth(10002);

    this.debugConsole = this.add
      .container(0, 0, [this.debugBg, this.debugHeader, this.debugTitle, this.debugTextObj])
      .setDepth(10000);

    // 3-finger tap toggle
    this.input.on('pointerdown', () => {
      const activePointers = this.input.manager.pointers.filter((pt) => pt.isDown).length;
      if (activePointers >= 3) {
        this.debugEnabled = !this.debugEnabled;
        this.debugConsole?.setVisible(this.debugEnabled);
        this.debugLog(this.debugEnabled ? 'console ON' : 'console OFF');
      }
    });

    this.renderDebug();
  }

  private layoutDebugConsole() {
    if (!this.debugBg || !this.debugHeader || !this.debugTitle || !this.debugTextObj) return;
    if (!this.debugConsole) return;

    const w = this.scale.gameSize.width;
    const h = this.scale.gameSize.height;

    const panelH = Math.floor(h * 0.4);
    const panelW = Math.min(w - 20, 520);

    const x = 10;
    const y = h - panelH - 10;

    this.debugBg.setPosition(x, y).setSize(panelW, panelH);

    const headerH = 26;
    this.debugHeader.setPosition(x, y).setSize(panelW, headerH);
    this.debugTitle.setPosition(x + 10, y + 5);

    this.debugTextObj.setPosition(x + 10, y + headerH + 8);
    this.debugTextObj.setWordWrapWidth(panelW - 20);

    this.debugConsole.setVisible(this.debugEnabled);
  }

  private debugLog(msg: string) {
    if (!this.debugEnabled) return;

    const t = new Date();
    const ts = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(
      2,
      '0'
    )}:${String(t.getSeconds()).padStart(2, '0')}`;

    this.debugLines.push(`[${ts}] ${msg}`);

    if (this.debugLines.length > this.debugMaxLines) {
      this.debugLines.splice(0, this.debugLines.length - this.debugMaxLines);
    }

    this.renderDebug();
  }

  private debugSnapshot() {
    const gsW = Math.round(this.scale.gameSize.width);
    const gsH = Math.round(this.scale.gameSize.height);

    const sW = Math.round(this.scale.width);
    const sH = Math.round(this.scale.height);

    const ww = Math.round(window.innerWidth);
    const wh = Math.round(window.innerHeight);

    const vvw = Math.round(window.visualViewport?.width ?? 0);
    const vvh = Math.round(window.visualViewport?.height ?? 0);

    const dpr = (window.devicePixelRatio ?? 1).toFixed(2);
    const orient = gsH > gsW ? 'PORTRAIT' : 'LANDSCAPE';

    this.debugLog(`Phaser gameSize=${gsW}x${gsH} (${orient}) scale=${sW}x${sH}`);
    this.debugLog(`window=${ww}x${wh} visualViewport=${vvw}x${vvh} dpr=${dpr}`);

    this.layoutDebugConsole();
  }

  private renderDebug() {
    if (!this.debugTextObj) return;
    this.debugTextObj.setText(this.debugLines.join('\n'));
  }
}