import Phaser from 'phaser';

interface Enemy {
  container: Phaser.GameObjects.Container;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'basic' | 'fast' | 'tank' | 'elite';
  points: number;
}

interface Bullet {
  graphics: Phaser.GameObjects.Graphics;
  velocityX: number;
  velocityY: number;
}

export class GameScene extends Phaser.Scene {
  private turret!: Phaser.GameObjects.Container;
  private turretBarrel!: Phaser.GameObjects.Graphics;
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private gridGraphics!: Phaser.GameObjects.Graphics;

  private score = 0;
  private wave = 1;
  private health = 3;
  private maxHealth = 3;

  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private healthContainer!: Phaser.GameObjects.Container;

  private isFiring = false;
  private lastFireTime = 0;
  private fireRate = 150;

  private isInvulnerable = false;
  private invulnerabilityDuration = 1500;

  private waveEnemiesSpawned = 0;
  private waveEnemiesKilled = 0;
  private totalWaveEnemies = 0;
  private isWaveActive = false;
  private spawnTimer?: Phaser.Time.TimerEvent;

  private isGameOver = false;

  private enemyPatterns: { [key: string]: number[][] } = {
    basic: [
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 0, 1, 0]
    ],
    fast: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 0, 1, 0],
      [1, 0, 0, 0, 1]
    ],
    tank: [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1]
    ],
    elite: [
      [1, 0, 1, 0, 1],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0]
    ]
  };

  private enemyColors: { [key: string]: number } = {
    basic: 0x00ffff,
    fast: 0x00ff66,
    tank: 0xff8800,
    elite: 0xff00ff
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Reset game state
    this.score = 0;
    this.wave = 1;
    this.health = 3;
    this.bullets = [];
    this.enemies = [];
    this.isGameOver = false;
    this.isInvulnerable = false;

    // Create background
    this.createBackground();

    // Create starfield
    this.createStarfield();

    // Create turret
    this.createTurret(centerX, centerY);

    // Create UI
    this.createUI();

    // Setup input
    this.setupInput();

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Start first wave
    this.time.delayedCall(1000, () => this.startWave());
  }

  private createBackground(): void {
    const { width, height } = this.cameras.main;

    // Background color
    this.cameras.main.setBackgroundColor('#0a0a0a');

    // Grid
    this.gridGraphics = this.add.graphics();
    this.drawGrid(0.15);

    // Animate grid
    this.tweens.add({
      targets: { alpha: 0.15 },
      alpha: 0.25,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      onUpdate: (tween) => {
        this.drawGrid(tween.getValue());
      }
    });
  }

  private drawGrid(alpha: number): void {
    const { width, height } = this.cameras.main;
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0x00ffff, alpha);

    const gridSize = 40;

    for (let x = 0; x <= width; x += gridSize) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, height);
    }

    for (let y = 0; y <= height; y += gridSize) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(width, y);
    }

    this.gridGraphics.strokePath();
  }

  private createStarfield(): void {
    const { width, height } = this.cameras.main;

    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(0.5, 1.5);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.8);

      const star = this.add.graphics();
      star.fillStyle(0xffffff, alpha);
      star.fillCircle(x, y, size);

      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.1, 0.4),
        duration: Phaser.Math.Between(500, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }
  }

  private createTurret(x: number, y: number): void {
    this.turret = this.add.container(x, y);

    // Base glow
    const baseGlow = this.add.graphics();
    baseGlow.fillStyle(0x00ffff, 0.2);
    baseGlow.fillCircle(0, 0, 50);
    this.turret.add(baseGlow);

    // Turret base
    const base = this.add.graphics();
    base.fillStyle(0x333333, 1);
    base.fillCircle(0, 0, 35);
    base.lineStyle(3, 0x00ffff, 1);
    base.strokeCircle(0, 0, 35);
    this.turret.add(base);

    // Turret inner circle
    const inner = this.add.graphics();
    inner.fillStyle(0x1a1a1a, 1);
    inner.fillCircle(0, 0, 25);
    inner.lineStyle(2, 0xff00ff, 0.8);
    inner.strokeCircle(0, 0, 25);
    this.turret.add(inner);

    // Turret barrel (separate for rotation reference)
    this.turretBarrel = this.add.graphics();
    this.turretBarrel.fillStyle(0x444444, 1);
    this.turretBarrel.fillRect(-6, -50, 12, 35);
    this.turretBarrel.lineStyle(2, 0x00ffff, 1);
    this.turretBarrel.strokeRect(-6, -50, 12, 35);
    this.turret.add(this.turretBarrel);

    // Barrel tip
    const tip = this.add.graphics();
    tip.fillStyle(0xffff00, 0.8);
    tip.fillCircle(0, -50, 4);
    this.turret.add(tip);
  }

  private createUI(): void {
    const { width } = this.cameras.main;

    // Score
    this.add.text(20, 20, 'SCORE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#666666'
    });

    this.scoreText = this.add.text(20, 38, '0', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#00ffff'
    });

    // Wave
    this.add.text(width - 20, 20, 'WAVE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#666666'
    }).setOrigin(1, 0);

    this.waveText = this.add.text(width - 20, 38, '1', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#ff00ff'
    }).setOrigin(1, 0);

    // Health
    this.healthContainer = this.add.container(width / 2, 30);
    this.updateHealthDisplay();
  }

  private updateHealthDisplay(): void {
    this.healthContainer.removeAll(true);

    const heartSpacing = 30;
    const startX = -((this.maxHealth - 1) * heartSpacing) / 2;

    for (let i = 0; i < this.maxHealth; i++) {
      const heart = this.add.graphics();
      const x = startX + i * heartSpacing;

      if (i < this.health) {
        heart.fillStyle(0xff0044, 1);
      } else {
        heart.fillStyle(0x333333, 1);
      }

      // Draw heart shape
      heart.fillTriangle(x, -5, x - 8, -12, x + 8, -12);
      heart.fillCircle(x - 5, -12, 6);
      heart.fillCircle(x + 5, -12, 6);

      this.healthContainer.add(heart);
    }
  }

  private setupInput(): void {
    this.input.on('pointerdown', () => {
      this.isFiring = true;
    });

    this.input.on('pointerup', () => {
      this.isFiring = false;
    });

    this.input.on('pointerout', () => {
      this.isFiring = false;
    });
  }

  private startWave(): void {
    this.isWaveActive = true;
    this.waveEnemiesSpawned = 0;
    this.waveEnemiesKilled = 0;
    this.totalWaveEnemies = 5 + this.wave * 3;

    // Show wave announcement
    const { width, height } = this.cameras.main;
    const waveAnnounce = this.add.text(width / 2, height / 2 - 100, `WAVE ${this.wave}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '32px',
      color: '#ff00ff'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: waveAnnounce,
      alpha: 1,
      duration: 500,
      yoyo: true,
      hold: 1000,
      onComplete: () => waveAnnounce.destroy()
    });

    // Start spawning enemies
    this.spawnTimer = this.time.addEvent({
      delay: Math.max(500, 2000 - this.wave * 100),
      callback: () => this.spawnEnemy(),
      repeat: this.totalWaveEnemies - 1
    });
  }

  private spawnEnemy(): void {
    if (this.isGameOver) return;

    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Determine enemy type based on wave
    let type: 'basic' | 'fast' | 'tank' | 'elite' = 'basic';
    const rand = Math.random();

    if (this.wave >= 5 && rand < 0.1) {
      type = 'elite';
    } else if (this.wave >= 3 && rand < 0.25) {
      type = 'tank';
    } else if (this.wave >= 2 && rand < 0.4) {
      type = 'fast';
    }

    // Spawn from edge
    const side = Phaser.Math.Between(0, 3);
    let x: number, y: number;

    switch (side) {
      case 0: x = Phaser.Math.Between(0, width); y = -30; break;
      case 1: x = width + 30; y = Phaser.Math.Between(0, height); break;
      case 2: x = Phaser.Math.Between(0, width); y = height + 30; break;
      default: x = -30; y = Phaser.Math.Between(0, height); break;
    }

    const pattern = this.enemyPatterns[type];
    const color = this.enemyColors[type];
    const container = this.createPixelatedEnemy(x, y, pattern, color);

    const enemy: Enemy = {
      container,
      health: type === 'tank' ? 3 : type === 'elite' ? 4 : 1,
      maxHealth: type === 'tank' ? 3 : type === 'elite' ? 4 : 1,
      speed: type === 'fast' ? 2.5 : type === 'tank' ? 0.8 : type === 'elite' ? 1.5 : 1.2,
      type,
      points: type === 'elite' ? 500 : type === 'tank' ? 200 : type === 'fast' ? 150 : 100
    };

    this.enemies.push(enemy);
    this.waveEnemiesSpawned++;
  }

  private createPixelatedEnemy(
    x: number,
    y: number,
    pattern: number[][],
    color: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const pixelSize = 5;
    const offset = (pattern.length * pixelSize) / 2;

    pattern.forEach((row, rowIndex) => {
      row.forEach((pixel, colIndex) => {
        if (pixel) {
          const rect = this.add.graphics();
          rect.fillStyle(color, 1);
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

  private fire(): void {
    const now = this.time.now;
    if (now - this.lastFireTime < this.fireRate) return;
    this.lastFireTime = now;

    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Get turret angle
    const angle = this.turret.rotation - Math.PI / 2;

    // Create bullet
    const bulletX = centerX + Math.cos(angle) * 55;
    const bulletY = centerY + Math.sin(angle) * 55;

    const bullet = this.add.graphics();
    bullet.fillStyle(0xffff00, 1);
    bullet.fillCircle(0, 0, 4);
    bullet.setPosition(bulletX, bulletY);

    const speed = 12;
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;

    this.bullets.push({
      graphics: bullet,
      velocityX,
      velocityY
    });

    // Recoil animation
    this.tweens.add({
      targets: this.turret,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 50,
      yoyo: true
    });

  }

  update(): void {
    if (this.isGameOver) return;

    // Rotate turret toward mouse
    const pointer = this.input.activePointer;
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    const targetAngle = Phaser.Math.Angle.Between(
      centerX,
      centerY,
      pointer.x,
      pointer.y
    ) + Math.PI / 2;

    // Smooth rotation lerping
    const currentAngle = this.turret.rotation;
    let angleDiff = targetAngle - currentAngle;

    // Normalize angle difference
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    this.turret.rotation += angleDiff * 0.15;

    // Fire if mouse held
    if (this.isFiring) {
      this.fire();
    }

    // Update bullets
    this.updateBullets();

    // Update enemies
    this.updateEnemies();

    // Check collisions
    this.checkCollisions();

    // Check wave completion
    if (this.isWaveActive && this.waveEnemiesKilled >= this.totalWaveEnemies) {
      this.completeWave();
    }
  }

  private updateBullets(): void {
    const { width, height } = this.cameras.main;

    this.bullets = this.bullets.filter(bullet => {
      // Move bullet
      bullet.graphics.x += bullet.velocityX;
      bullet.graphics.y += bullet.velocityY;

      // Remove if off screen
      if (
        bullet.graphics.x < -20 ||
        bullet.graphics.x > width + 20 ||
        bullet.graphics.y < -20 ||
        bullet.graphics.y > height + 20
      ) {
        bullet.graphics.destroy();
        return false;
      }

      return true;
    });
  }

  private updateEnemies(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    this.enemies.forEach(enemy => {
      // Move toward center
      const angle = Phaser.Math.Angle.Between(
        enemy.container.x,
        enemy.container.y,
        centerX,
        centerY
      );

      enemy.container.x += Math.cos(angle) * enemy.speed;
      enemy.container.y += Math.sin(angle) * enemy.speed;

      // Rotate enemy slightly
      enemy.container.rotation = angle + Math.PI / 2;
    });
  }

  private checkCollisions(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Bullet vs Enemy
    this.bullets = this.bullets.filter(bullet => {
      let bulletAlive = true;

      this.enemies = this.enemies.filter(enemy => {
        const dist = Phaser.Math.Distance.Between(
          bullet.graphics.x,
          bullet.graphics.y,
          enemy.container.x,
          enemy.container.y
        );

        if (dist < 20) {
          enemy.health--;
          bulletAlive = false;

          // Hit effect
          this.createHitParticles(enemy.container.x, enemy.container.y, this.enemyColors[enemy.type]);

          if (enemy.health <= 0) {
            // Enemy destroyed
            this.createExplosion(enemy.container.x, enemy.container.y, this.enemyColors[enemy.type]);
            this.addScore(enemy.points, enemy.container.x, enemy.container.y);
            enemy.container.destroy();
            this.waveEnemiesKilled++;
            return false;
          }

          // Flash enemy
          this.tweens.add({
            targets: enemy.container,
            alpha: 0.3,
            duration: 50,
            yoyo: true
          });
        }

        return true;
      });

      if (!bulletAlive) {
        bullet.graphics.destroy();
      }

      return bulletAlive;
    });

    // Enemy vs Turret
    this.enemies = this.enemies.filter(enemy => {
      const dist = Phaser.Math.Distance.Between(
        enemy.container.x,
        enemy.container.y,
        centerX,
        centerY
      );

      if (dist < 40) {
        // Enemy reached turret
        this.createExplosion(enemy.container.x, enemy.container.y, this.enemyColors[enemy.type]);
        enemy.container.destroy();
        this.waveEnemiesKilled++;

        if (!this.isInvulnerable) {
          this.takeDamage();
        }

        return false;
      }

      return true;
    });
  }

  private createHitParticles(x: number, y: number, color: number): void {
    for (let i = 0; i < 5; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 2);
      particle.setPosition(x, y);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(2, 5);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed * 20,
        y: y + Math.sin(angle) * speed * 20,
        alpha: 0,
        duration: 300,
        onComplete: () => particle.destroy()
      });
    }
  }

  private createExplosion(x: number, y: number, color: number): void {
    // Screen shake
    this.cameras.main.shake(100, 0.01);

    // Explosion ring
    const ring = this.add.graphics();
    ring.lineStyle(3, color, 1);
    ring.strokeCircle(0, 0, 5);
    ring.setPosition(x, y);

    this.tweens.add({
      targets: ring,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.destroy()
    });

    // Particles
    for (let i = 0; i < 12; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillRect(-3, -3, 6, 6);
      particle.setPosition(x, y);

      const angle = (i / 12) * Math.PI * 2;
      const speed = Phaser.Math.FloatBetween(3, 8);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed * 30,
        y: y + Math.sin(angle) * speed * 30,
        alpha: 0,
        rotation: Phaser.Math.FloatBetween(-3, 3),
        duration: 500,
        onComplete: () => particle.destroy()
      });
    }
  }

  private addScore(points: number, x: number, y: number): void {
    this.score += points;
    this.scoreText.setText(this.score.toString());

    // Floating score popup
    const popup = this.add.text(x, y, `+${points}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ffff00'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => popup.destroy()
    });
  }

  private takeDamage(): void {
    this.health--;
    this.updateHealthDisplay();

    // Screen flash
    this.cameras.main.flash(200, 255, 0, 0);
    this.cameras.main.shake(200, 0.02);

    // Turret damage effect
    this.tweens.add({
      targets: this.turret,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 5
    });

    if (this.health <= 0) {
      this.gameOver();
      return;
    }

    // Invulnerability frames
    this.isInvulnerable = true;
    this.time.delayedCall(this.invulnerabilityDuration, () => {
      this.isInvulnerable = false;
    });
  }

  private completeWave(): void {
    this.isWaveActive = false;

    // Wave completion bonus
    const bonus = this.wave * 500;
    this.score += bonus;
    this.scoreText.setText(this.score.toString());

    // Show bonus
    const { width, height } = this.cameras.main;
    const bonusText = this.add.text(width / 2, height / 2, `WAVE ${this.wave} COMPLETE!\n+${bonus} BONUS`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      color: '#00ff66',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: bonusText,
      alpha: 1,
      duration: 500,
      yoyo: true,
      hold: 1500,
      onComplete: () => {
        bonusText.destroy();
        this.wave++;
        this.waveText.setText(this.wave.toString());
        this.startWave();
      }
    });
  }

  private gameOver(): void {
    this.isGameOver = true;

    // Stop spawning
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }

    // Destroy remaining enemies
    this.enemies.forEach(e => e.container.destroy());
    this.enemies = [];

    // Show game over screen
    const { width, height } = this.cameras.main;

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, width, height);
    overlay.setAlpha(0);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 500
    });

    // Game over text
    const gameOverText = this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '36px',
      color: '#ff0044'
    }).setOrigin(0.5).setAlpha(0);

    const scoreLabel = this.add.text(width / 2, height / 2 - 20, 'FINAL SCORE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#666666'
    }).setOrigin(0.5).setAlpha(0);

    const finalScore = this.add.text(width / 2, height / 2 + 10, this.score.toString(), {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      color: '#00ffff'
    }).setOrigin(0.5).setAlpha(0);

    const waveLabel = this.add.text(width / 2, height / 2 + 50, `WAVE REACHED: ${this.wave}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#ff00ff'
    }).setOrigin(0.5).setAlpha(0);

    const restartText = this.add.text(width / 2, height / 2 + 100, 'CLICK TO RESTART', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0);

    // Animate in
    this.tweens.add({
      targets: [gameOverText, scoreLabel, finalScore, waveLabel],
      alpha: 1,
      duration: 500,
      delay: 500
    });

    // Blinking restart text
    this.time.delayedCall(1000, () => {
      this.tweens.add({
        targets: restartText,
        alpha: 1,
        duration: 500,
        yoyo: true,
        repeat: -1
      });

      // Enable restart
      this.input.once('pointerdown', () => {
        this.cameras.main.flash(300, 255, 255, 255);
        this.time.delayedCall(300, () => {
          this.scene.restart();
        });
      });
    });
  }
}

