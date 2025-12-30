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

    this.time.delayedCall(0, () => this.handleResize());
  }

  private handleResize() {
    // gameSize 기준이 더 안전합니다 (RESIZE에서 특히)
    const w = this.scale.gameSize.width;
    const h = this.scale.gameSize.height;

    const cx = w / 2;
    const cy = h / 2;

    // 화면 크기에 따라 0.6 ~ 1.2 사이로 연속 스케일
    const short = Math.min(w, h);
    const uiScale = Phaser.Math.Clamp(short / 720, 0.6, 1.2);

    // --- BG: cover ---
    this.bgs.forEach(img => {
      img.setPosition(cx, cy);
      const cover = Math.max(w / img.width, h / img.height);
      img.setScale(cover);
    });

    // --- Dragon: 양축 기준으로 "화면 안에 들어오게" ---
    if (this.dragon) {
      // 드래곤이 화면을 너무 꽉 채우지 않도록 0.85 정도
      const fit = Math.min((w * 0.85) / this.dragon.width, (h * 0.70) / this.dragon.height);
      this.dragon.setScale(fit);

      // y 오프셋도 픽셀 고정 대신 비율 기반
      const yOffset = -h * 0.18; // 화면 높이의 18% 위
      this.dragon.setPosition(cx, cy + yOffset);
    }

    // --- Dev Text ---
    if (this.devText) {
      this.devText.setPosition(cx, cy);
      this.devText.setFontSize(Math.round(45 * uiScale));
    }

    // --- Skip hint (노치/홈바 때문에 너무 아래로 가지 않게) ---
    if (this.skipHint) {
      this.skipHint.setPosition(cx, h - Math.max(24, h * 0.05));
      this.skipHint.setFontSize(Math.round(12 * uiScale));
    }

    // --- Overlay ---
    if (this.breathOverlay) {
      this.breathOverlay.setPosition(cx, cy).setSize(w, h);
    }

    // --- Narrative Texts ---
    this.narrativeTexts.forEach(t => {
      t.setPosition(cx, cy);
      t.setFontSize(Math.round(40 * uiScale));
    });

    // 마지막 2줄(NEVER FORGET / AND FORGED...)은 세로 간격도 비율로
    const despairIdx = this.narrativeTexts.length - 2;
    const gap = Math.max(24, h * 0.06); // 최소 24px, 아니면 화면 높이 6%

    if (this.narrativeTexts[despairIdx]) this.narrativeTexts[despairIdx].y = cy - gap / 2;
    if (this.narrativeTexts[despairIdx + 1]) this.narrativeTexts[despairIdx + 1].y = cy + gap / 2;

    // --- Fire emitter: 드래곤 기준으로 붙이는 게 제일 안정적 ---
    if (this.fireEmitter) {
      if (this.dragon) {
        // 드래곤의 “대략 입 위치”를 비율로 잡음
        const mouthY = this.dragon.y + this.dragon.displayHeight * 0.10;
        this.fireEmitter.setPosition(cx, mouthY);
      } else {
        this.fireEmitter.setPosition(cx, h * 0.35);
      }
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