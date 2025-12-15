import Phaser from 'phaser';

export default class IntroScene extends Phaser.Scene {
  add!: Phaser.GameObjects.GameObjectFactory;
  tweens!: Phaser.Tweens.TweenManager;
  cameras!: Phaser.Cameras.Scene2D.CameraManager;
  time!: Phaser.Time.Clock;

  constructor() {
    super('IntroScene');
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Black Background
    this.add.rectangle(centerX, centerY, width, height, 0x000000);

    // 2. "A CryingDev Production"
    const devText = this.add.text(centerX, centerY, 'A CryingDev Production', {
      fontFamily: 'serif',
      fontSize: '24px',
      color: '#a8a29e', // Stone 400
    }).setOrigin(0.5).setAlpha(0);

    // 3. Game Title "Lockhart's Forge"
    const titleText = this.add.text(centerX, centerY, "LOCKHART'S FORGE", {
      fontFamily: 'serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#d97706', // Amber 600
      stroke: '#78350f',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setScale(0.8);

    // Use chain for sequential animations (Phaser 3.60+)
    this.tweens.chain({
      tweens: [
        // Fade In Dev Text
        {
          targets: devText,
          alpha: 1,
          duration: 1000,
          hold: 1000,
          ease: 'Power2'
        },
        // Fade Out Dev Text
        {
          targets: devText,
          alpha: 0,
          duration: 800,
          ease: 'Power2'
        },
        // Fade In Title + Scale Up + Shake
        {
          targets: titleText,
          alpha: 1,
          scale: 1,
          duration: 500,
          ease: 'Back.out',
          onStart: () => {
              // Simulate Anvil Strike Sound/Impact
              this.cameras.main.shake(200, 0.01); 
          }
        },
        // Hold Title then finish
        {
          targets: titleText,
          duration: 2000,
          onComplete: () => {
            this.game.events.emit('intro-complete');
          }
        }
      ]
    });
  }
}