
import Phaser from 'phaser';
import { getAssetUrl } from '../utils';

export default class IntroScene extends Phaser.Scene {
  add!: Phaser.GameObjects.GameObjectFactory;
  tweens!: Phaser.Tweens.TweenManager;
  cameras!: Phaser.Cameras.Scene2D.CameraManager;
  time!: Phaser.Time.Clock;
  load!: Phaser.Loader.LoaderPlugin;
  make!: Phaser.GameObjects.GameObjectCreator;

  constructor() {
    super('IntroScene');
  }

  preload() {
    // Load assets for the cutscene
    this.load.image('intro_bg', getAssetUrl('intro_bg_01.png'));
    // Load additional narrative backgrounds
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
    const centerX = width / 2;
    const centerY = height / 2;

    // --- Asset Generation (Procedural Fire) ---
    if (!this.textures.exists('intro_flame')) {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xff5500, 1);
        graphics.fillCircle(16, 16, 16);
        graphics.generateTexture('intro_flame', 32, 32);
        graphics.destroy();
    }

    // --- Layers Setup ---

    // 1. Black Base Layer
    this.add.rectangle(centerX, centerY, width, height, 0x000000).setDepth(0);

    // 2. Background Images (Layered for crossfade)
    const createBg = (key: string, depth: number) => {
        const img = this.add.image(centerX, centerY, key).setAlpha(0).setDepth(depth);
        const scaleX = width / img.width;
        const scaleY = height / img.height;
        img.setScale(Math.max(scaleX, scaleY));
        return img;
    };

    const bg1 = createBg('intro_bg', 1);
    const bg2 = createBg('intro_bg_02', 1); // Same depth, will control alpha
    const bg3 = createBg('intro_bg_03', 1);
    const bg4 = createBg('intro_bg_04', 1);
    const bg5 = createBg('intro_bg_05', 1);

    // 3. Dragon Image
    const dragon = this.add.image(centerX, 0, 'intro_dragon').setDepth(2);
    // Calculate the final target scale (full width)
    const finalDragonScale = width / dragon.width;
    
    // START SMALL: Simulate being far away/high up (20% of final size)
    dragon.setScale(finalDragonScale * 0.2);

    const dragonHeight = dragon.height * finalDragonScale;
    const startY = -dragonHeight / 2 - 50; 
    const loomY = centerY; 
    // Attack Position: Top 15% of screen
    const attackY = height * 0.15; 

    dragon.y = startY;
    // FIX: Hide dragon initially so it doesn't peek out during Step 1/2
    dragon.setVisible(false);

    // 4. Studio Text
    const devText = this.add.text(centerX, centerY, "CRYINGDEV STUDIO\nPRESENTS", {
      fontFamily: 'serif',
      fontSize: '45px',
      color: '#a8a29e',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    // 5. Narrative Texts
    const narrativeText1 = this.createNarrativeText(centerX, centerY, "FIASCO,\nA MASTER OF DISASTER...", '#ef4444');
    const narrativeText2 = this.createNarrativeText(centerX, centerY, "EVERTHING IS LOST WHAT WE LOVED...", '#ef4444');
    const narrativeText3 = this.createNarrativeText(centerX, centerY, "BUT THE HAMMER IS STILL WHAT I HAVE.", '#ef4444');
    // Text 2: The Despair (Slightly Higher)
    const textDespair = this.createNarrativeText(centerX, centerY - 40, "NEVER FORGET...", '#ef4444');
    
    // Text 3: The Vengeance (Slightly Lower, Brighter/Gold to signify the Forge)
    const textVengeance = this.createNarrativeText(centerX, centerY + 40, "AND FORGED A VENGEANCE.", '#f59e0b');

    // 6. Fire Breath Effects
    const breathOverlay = this.add.rectangle(centerX, centerY, width, height, 0xff4400)
        .setAlpha(0)
        .setDepth(5)
        .setBlendMode(Phaser.BlendModes.ADD);

    // Tracking variable for dynamic spread
    let breathSpread = 50;

    // Initial Emitter Config: Narrow beam (Pillar)
    const fireEmitter = this.add.particles(centerX, -50, 'intro_flame', {
        speedY: { min: 1200, max: 2200 }, // Very fast downward stream
        speedX: { 
            onEmit: () => Phaser.Math.Between(-breathSpread, breathSpread)
        },
        scale: { start: 6, end: 15 },     // Grow large
        alpha: { start: 1, end: 0 },
        lifespan: 1500,
        quantity: 40,                     // High density
        blendMode: 'ADD',
        emitting: false
    });
    fireEmitter.setDepth(4);

    // --- Animation Sequence ---
    
    this.tweens.chain({
      tweens: [
        // Step 1: Studio Name Fade In
        {
          targets: devText,
          alpha: 1,
          duration: 2500,
          ease: 'Power2',
        },
        // Step 1b: Hold & Shake (Earthquake starts here)
        {
            targets: devText,
            alpha: 1, 
            duration: 2000, 
            onStart: () => {
                // Shake duration covers this hold (2000) + fade out (2000) + start of next (2000)
                this.cameras.main.shake(6000, 0.005); 
            }
        },
        // Step 1c: Studio Name Fade Out
        {
          targets: devText,
          alpha: 0,
          duration: 2000,
          ease: 'Power2',
        },
        // Step 2: Fade In First Background
        {
          targets: bg1,
          alpha: 1,
          duration: 1500,
          ease: 'Linear'
        },
        // Step 3: Dragon Descent (ZOOM IN EFFECT)
        {
          targets: dragon,
          y: loomY - 200,              // Move down
          scale: finalDragonScale, // Grow to full size (Swoop effect)
          duration: 3000,
          ease: 'Sine.easeInOut',
          hold: 500, // Brief hover
          onStart: () => {
              dragon.setVisible(true); // REVEAL DRAGON HERE
              this.cameras.main.shake(3500, 0.005); 
          }
        },
        // Step 4: Dragon Ascend (Move to attack position FIRST)
        {
            targets: dragon,
            y: 0,
            scale: finalDragonScale * 0.7, 
            duration: 1000, // Move up quickly
            ease: 'Quad.easeOut'
        },
        // Step 5: BREATH ATTACK (Longer, Expanding from Center)
        {
            targets: breathOverlay,
            alpha: 0.8, // Sustained glow
            duration: 2500, // Longer attack duration
            yoyo: true, 
            hold: 100,
            onStart: () => {
                // Set emitter to dragon's mouth at the top
                fireEmitter.setPosition(centerX, attackY + 200);
                
                // Reset to narrow beam
                breathSpread = 50;
                
                fireEmitter.start();
                this.cameras.main.shake(2500, 0.03); // Shake for full duration
            },
            onUpdate: (tween: Phaser.Tweens.Tween) => {
                // Expand the beam over time
                const progress = tween.progress; // 0 to 1
                
                // Calculate spread: Start at 50, expand to 1200+
                breathSpread = 50 + (progress * 1200);
            },
            onComplete: () => {
                fireEmitter.stop();
                dragon.setVisible(false);
            }
        },
        // Step 6: Slideshow of Destruction (BG 2 & 3)
        {
            targets: bg2,
            alpha: 1,
            duration: 2000,
            hold: 2500,
            ease: 'Linear',
        },
        {
            targets: narrativeText1,
            alpha: 1,
            duration: 1000,
            hold: 3000,
            ease: 'Power2',
            offset: '-=1000',
        },
        {
            targets: narrativeText1,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
        },
        {
            targets: bg3,
            alpha: 1,
            duration: 2000,
            hold: 2500,
            ease: 'Linear'
        },
        {
            targets: narrativeText2,
            alpha: 1,
            duration: 1000,
            hold: 3000,
            ease: 'Power2',
            offset: '-=1000' // Appears while BG4 is holding
        },
        {
        targets: narrativeText2,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
        },
        // Step 7: BG 4 (Longer exposure & Lingering effect)
        {
            targets: bg4,
            alpha: 1,
            duration: 3000, // Slower fade in
            hold: 3500,     // Extended hold to let the viewer see the ruin
            ease: 'Linear',
        },
        {
            targets: narrativeText3,
            alpha: 1,
            duration: 1000,
            hold: 3000,
            ease: 'Power2',
            offset: '-=1000' // Appears while BG4 is holding
        },
        // Step 8b: Fade Out Text 3
        {
            targets: narrativeText3,
            alpha: 0,
            duration: 1000,
            ease: 'Power2'
        },
        // Step 9: Final BG (BG 5 - The Ruined Forge) - Appears AFTER tragedy text fades
        {
            targets: bg5,
            alpha: 1,
            duration: 3000, // Slow reveal
            ease: 'Linear',
        },
        // Step 10: Narrative Text 2 (Despair) - Top line
        {
            targets: textDespair,
            alpha: 1,
            duration: 2000,
            ease: 'Power2',
            delay: 500
        },
        // Step 11: Narrative Text 3 (Vengeance) - Bottom line, appears later for impact
        {
            targets: textVengeance,
            alpha: 1,
            duration: 2500, // Slow burn appearance
            ease: 'Power2',
            offset: '-=1000' // Overlaps with the end of Text 2's tween
        },
        // Step 12: Final Fade Out (Everything)
        {
          targets: [bg1, bg2, bg3, bg4, bg5, textDespair, textVengeance],
          alpha: 0,
          duration: 3000, // Slow final fade to black
          delay: 3000,    // Hold the final message for a while
          onComplete: () => {
            this.game.events.emit('intro-complete');
          }
        }
      ]
    });
  }
}
