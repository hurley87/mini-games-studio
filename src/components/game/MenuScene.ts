import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private stars: Phaser.GameObjects.Graphics[] = [];
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private turretPreview!: Phaser.GameObjects.Container;
  private floatingEnemies: Phaser.GameObjects.Container[] = [];
  private startButton!: Phaser.GameObjects.Container;
  private blinkText!: Phaser.GameObjects.Text;
  private pulseRings: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create animated grid background
    this.createGridBackground();

    // Create twinkling starfield
    this.createStarfield();

    // Create corner bracket decorations
    this.createCornerBrackets();

    // Create side accent bars
    this.createSideAccents();

    // Create floating enemy invaders
    this.createFloatingEnemies();

    // Create turret preview with glow rings
    this.createTurretPreview(centerX, centerY + 20);

    // Create title
    this.createTitle(centerX);

    // Create start button
    this.createStartButton(centerX, height - 120);

    // Create blinking text
    this.createBlinkingText(centerX, height - 70);

    // Create instructions
    this.createInstructions(centerX, height - 40);

    // Handle click to start
    this.input.on('pointerdown', () => {
      this.startGame();
    });
  }

  private createGridBackground(): void {
    this.gridGraphics = this.add.graphics();
    const { width, height } = this.cameras.main;

    // Animate grid pulsing
    this.tweens.add({
      targets: { alpha: 0.15 },
      alpha: 0.25,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      onUpdate: (tween) => {
        const alpha = tween.getValue();
        this.drawGrid(alpha);
      }
    });

    this.drawGrid(0.15);
  }

  private drawGrid(alpha: number): void {
    const { width, height } = this.cameras.main;
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0x00ffff, alpha);

    const gridSize = 40;

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, height);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(width, y);
    }

    this.gridGraphics.strokePath();
  }

  private createStarfield(): void {
    const { width, height } = this.cameras.main;

    for (let i = 0; i < 150; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);

      const star = this.add.graphics();
      star.fillStyle(0xffffff, alpha);
      star.fillCircle(x, y, size);

      // Twinkling animation
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.1, 0.5),
        duration: Phaser.Math.Between(500, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });

      this.stars.push(star);
    }
  }

  private createCornerBrackets(): void {
    const { width, height } = this.cameras.main;
    const bracketSize = 30;
    const offset = 20;
    const thickness = 3;

    const corners = [
      { x: offset, y: offset, rotations: [0, Math.PI / 2] },
      { x: width - offset, y: offset, rotations: [-Math.PI / 2, Math.PI] },
      { x: offset, y: height - offset, rotations: [Math.PI / 2, Math.PI] },
      { x: width - offset, y: height - offset, rotations: [Math.PI, -Math.PI / 2] }
    ];

    corners.forEach((corner, index) => {
      const bracket = this.add.graphics();
      bracket.lineStyle(thickness, 0x00ffff, 0.8);

      if (index === 0) {
        bracket.moveTo(corner.x, corner.y + bracketSize);
        bracket.lineTo(corner.x, corner.y);
        bracket.lineTo(corner.x + bracketSize, corner.y);
      } else if (index === 1) {
        bracket.moveTo(corner.x - bracketSize, corner.y);
        bracket.lineTo(corner.x, corner.y);
        bracket.lineTo(corner.x, corner.y + bracketSize);
      } else if (index === 2) {
        bracket.moveTo(corner.x, corner.y - bracketSize);
        bracket.lineTo(corner.x, corner.y);
        bracket.lineTo(corner.x + bracketSize, corner.y);
      } else {
        bracket.moveTo(corner.x - bracketSize, corner.y);
        bracket.lineTo(corner.x, corner.y);
        bracket.lineTo(corner.x, corner.y - bracketSize);
      }

      bracket.strokePath();

      // Pulse animation
      this.tweens.add({
        targets: bracket,
        alpha: 0.4,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        delay: index * 200
      });
    });
  }

  private createSideAccents(): void {
    const { width, height } = this.cameras.main;
    const accentWidth = 4;
    const accentHeight = 100;

    // Left accent
    const leftAccent = this.add.graphics();
    leftAccent.fillStyle(0xff00ff, 0.6);
    leftAccent.fillRect(10, height / 2 - accentHeight / 2, accentWidth, accentHeight);

    // Right accent
    const rightAccent = this.add.graphics();
    rightAccent.fillStyle(0xff00ff, 0.6);
    rightAccent.fillRect(width - 14, height / 2 - accentHeight / 2, accentWidth, accentHeight);

    // Animate
    [leftAccent, rightAccent].forEach((accent, i) => {
      this.tweens.add({
        targets: accent,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1,
        delay: i * 400
      });
    });
  }

  private createFloatingEnemies(): void {
    const { width, height } = this.cameras.main;
    const enemyPatterns = [
      // Basic enemy pattern
      [
        [0, 1, 0, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 0, 1, 0]
      ],
      // Alternative pattern
      [
        [1, 0, 1, 0, 1],
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [1, 0, 1, 0, 1]
      ]
    ];

    const colors = [0x00ffff, 0x00ff66, 0xff8800, 0xff00ff];

    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(100, height - 150);
      const pattern = enemyPatterns[i % 2];
      const color = colors[i % colors.length];

      const enemy = this.createPixelatedEnemy(x, y, pattern, color, 0.15);
      this.floatingEnemies.push(enemy);

      // Floating animation
      this.tweens.add({
        targets: enemy,
        y: y + Phaser.Math.Between(-30, 30),
        x: x + Phaser.Math.Between(-50, 50),
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Fade animation
      this.tweens.add({
        targets: enemy,
        alpha: 0.08,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1
      });
    }
  }

  private createPixelatedEnemy(
    x: number,
    y: number,
    pattern: number[][],
    color: number,
    alpha: number = 1
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const pixelSize = 6;
    const offset = (pattern.length * pixelSize) / 2;

    pattern.forEach((row, rowIndex) => {
      row.forEach((pixel, colIndex) => {
        if (pixel) {
          const rect = this.add.graphics();
          rect.fillStyle(color, alpha);
          rect.fillRect(
            colIndex * pixelSize - offset,
            rowIndex * pixelSize - offset,
            pixelSize - 1,
            pixelSize - 1
          );
          container.add(rect);
        }
      });
    });

    return container;
  }

  private createTurretPreview(x: number, y: number): void {
    this.turretPreview = this.add.container(x, y);

    // Pulsing glow rings
    for (let i = 0; i < 3; i++) {
      const ring = this.add.graphics();
      ring.lineStyle(2, 0x00ffff, 0.3 - i * 0.08);
      ring.strokeCircle(0, 0, 60 + i * 20);
      this.turretPreview.add(ring);
      this.pulseRings.push(ring);

      this.tweens.add({
        targets: ring,
        scaleX: 1.2,
        scaleY: 1.2,
        alpha: 0,
        duration: 2000,
        repeat: -1,
        delay: i * 600
      });
    }

    // Turret base
    const base = this.add.graphics();
    base.fillStyle(0x333333, 1);
    base.fillCircle(0, 0, 35);
    base.lineStyle(3, 0x00ffff, 1);
    base.strokeCircle(0, 0, 35);
    this.turretPreview.add(base);

    // Turret inner circle
    const inner = this.add.graphics();
    inner.fillStyle(0x1a1a1a, 1);
    inner.fillCircle(0, 0, 25);
    inner.lineStyle(2, 0xff00ff, 0.8);
    inner.strokeCircle(0, 0, 25);
    this.turretPreview.add(inner);

    // Turret barrel
    const barrel = this.add.graphics();
    barrel.fillStyle(0x444444, 1);
    barrel.fillRect(-6, -50, 12, 35);
    barrel.lineStyle(2, 0x00ffff, 1);
    barrel.strokeRect(-6, -50, 12, 35);
    this.turretPreview.add(barrel);

    // Barrel tip glow
    const tipGlow = this.add.graphics();
    tipGlow.fillStyle(0xffff00, 0.8);
    tipGlow.fillCircle(0, -50, 4);
    this.turretPreview.add(tipGlow);

    // Rotate turret
    this.tweens.add({
      targets: this.turretPreview,
      angle: 360,
      duration: 10000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  private createTitle(centerX: number): void {
    // Shadow layers for depth
    const shadowOffsets = [
      { x: 4, y: 4, color: '#000000', alpha: 0.5 },
      { x: 2, y: 2, color: '#003333', alpha: 0.7 }
    ];

    shadowOffsets.forEach(shadow => {
      this.add.text(centerX + shadow.x, 65 + shadow.y, 'BALLISTIC', {
        fontFamily: '"Press Start 2P"',
        fontSize: '48px',
        color: shadow.color
      }).setOrigin(0.5).setAlpha(shadow.alpha);
    });

    // Main title
    const title = this.add.text(centerX, 65, 'BALLISTIC', {
      fontFamily: '"Press Start 2P"',
      fontSize: '48px',
      color: '#00ffff'
    }).setOrigin(0.5);

    // Title glow effect
    this.tweens.add({
      targets: title,
      alpha: 0.8,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Subtitle
    const subtitle = this.add.text(centerX, 115, 'TURRET DEFENSE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '18px',
      color: '#ff00ff'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: subtitle,
      alpha: 0.6,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      delay: 300
    });
  }

  private createStartButton(x: number, y: number): void {
    this.startButton = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(0x003311, 0.8);
    bg.fillRoundedRect(-120, -25, 240, 50, 8);
    bg.lineStyle(2, 0x00ff66, 1);
    bg.strokeRoundedRect(-120, -25, 240, 50, 8);
    this.startButton.add(bg);

    // Button text
    const buttonText = this.add.text(0, 0, '[ START GAME ]', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#00ff66'
    }).setOrigin(0.5);
    this.startButton.add(buttonText);

    // Pulse animation
    this.tweens.add({
      targets: this.startButton,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createBlinkingText(x: number, y: number): void {
    this.blinkText = this.add.text(x, y, 'CLICK ANYWHERE TO PLAY', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Blink animation
    this.tweens.add({
      targets: this.blinkText,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  private createInstructions(x: number, y: number): void {
    this.add.text(x, y, 'AIM WITH MOUSE • CLICK TO FIRE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#666666'
    }).setOrigin(0.5);
  }

  private startGame(): void {
    // Flash effect
    this.cameras.main.flash(500, 255, 255, 255);

    // Fade to game scene
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.time.delayedCall(500, () => {
      this.scene.start('GameScene');
    });
  }
}

