class TankGame extends Phaser.Scene {
    constructor() {
        super({ key: 'TankGame' });
        
        // Game constants
        this.GRID_SIZE = 15;
        this.TILE_SIZE = 32;
        this.TANK_SIZE = 24;
        this.TANK_SPEED = 120;
        this.BULLET_SPEED = 200;
        this.BULLET_SIZE = 4;
        this.ENEMY_SPEED = 80;
        this.ENEMY_SHOOT_RANGE = 150;
        this.ENEMY_SHOOT_COOLDOWN = 1500;
        
        // Game objects
        this.playerTank = null;
        this.cursors = null;
        this.spaceKey = null;
        this.playerBullet = null;
        
        // Terrain groups
        this.brickWalls = null;
        this.steelWalls = null;
        this.rivers = null;
        this.bushes = null;
        this.allSolids = null;
        
        // Visual Effects
        this.particleEmitters = {};
        this.explosionPools = {};
        this.screenShakeIntensity = 0;
        this.trackMarks = null;
        
        // Game state
        this.playerLives = 3;
        this.playerHP = 3;
        this.maxHP = 3;
        this.gameTime = 180;
        this.gameTimer = null;
        this.eagleBase = null;
        this.gameOver = false;
        this.gameWon = false;
        
        // UI elements
        this.uiContainer = null;
        this.livesText = null;
        this.hpText = null;
        this.timerText = null;
        this.healthBar = null;
        
        // Respawn
        this.isRespawning = false;
        this.respawnEffect = null;
        
        // Enemy system
        this.enemyTanks = null;
        this.enemyBullets = null;
        this.spawnPoints = [];
        this.enemiesDestroyed = 0;
        this.maxEnemies = 20;
        this.activeEnemies = 0;
        this.maxActiveEnemies = 4;
        
        // Power-up system
        this.powerUps = null;
        this.playerBulletPower = 1;
        this.starPowerUpsSpawned = 0;
        this.maxStarPowerUps = 3;
        this.shovelPowerUpsSpawned = 0;
        this.maxShovelPowerUps = 2;
        this.eagleBaseReinforced = false;
        this.eagleReinforceTimer = null;
        this.originalEagleWalls = [];
        
        // Scoring system
        this.score = 0;
        
        // Map boundaries
        this.mapWidth = this.GRID_SIZE * this.TILE_SIZE;
        this.mapHeight = this.GRID_SIZE * this.TILE_SIZE;
    }
    
    preload() {
        // Create simple colored rectangles as sprites
        this.createTankSprites();
        this.createEffectSprites();
    }
    
    create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
        
        // Create visual effects system
        this.createVisualEffects();
        
        // Create grid background
        this.createGrid();
        
        // Create terrain and obstacles
        this.createTerrain();
        this.createEagleBase();
        this.createSampleMap();
        
        // Create player tank
        this.createPlayerTank();
        
        // Set up collisions
        this.setupCollisions();
        
        // Create UI
        this.createUI();
        
        // Create enemy system
        this.createEnemySystem();
        
        // Create power-up system
        this.createPowerUpSystem();
        
        // Start game timer
        this.startGameTimer();
        
        // Set up input controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Set up camera with shake capability
        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.cameras.main.startFollow(this.playerTank);
    }
    
    update(time, delta) {
        if (this.gameOver || this.gameWon || this.isRespawning) return;
        
        this.handlePlayerInput(delta);
        this.updateBullets();
        this.updateEnemies(time, delta);
        this.updatePowerUps();
        this.updateUI();
        this.updateVisualEffects();
    }
    
    createEffectSprites() {
        // Explosion animation frames (5 frames)
        for (let i = 0; i < 5; i++) {
            const size = 20 + (i * 10);
            const graphics = this.add.graphics();
            
            // Outer flame
            graphics.fillGradientStyle(0xff4500, 0xff4500, 0xff0000, 0xff0000, 1);
            graphics.fillCircle(size/2, size/2, size/2);
            
            // Inner flame
            graphics.fillGradientStyle(0xffff00, 0xffff00, 0xff4500, 0xff4500, 0.8);
            graphics.fillCircle(size/2, size/2, size/3);
            
            // Hot center
            graphics.fillStyle(0xffffff, 0.6);
            graphics.fillCircle(size/2, size/2, size/5);
            
            graphics.generateTexture(`explosion_frame_${i}`, size, size);
            graphics.destroy();
        }
        
        // Particle sprites
        const sparkGraphics = this.add.graphics();
        sparkGraphics.fillStyle(0xffff00);
        sparkGraphics.fillCircle(2, 2, 2);
        sparkGraphics.generateTexture('spark', 4, 4);
        sparkGraphics.destroy();
        
        const smokeGraphics = this.add.graphics();
        smokeGraphics.fillStyle(0x666666, 0.7);
        smokeGraphics.fillCircle(4, 4, 4);
        smokeGraphics.generateTexture('smoke', 8, 8);
        smokeGraphics.destroy();
        
        const debrisGraphics = this.add.graphics();
        debrisGraphics.fillStyle(0x8B4513);
        debrisGraphics.fillRect(0, 0, 3, 3);
        debrisGraphics.generateTexture('debris', 3, 3);
        debrisGraphics.destroy();
        
        const leafGraphics = this.add.graphics();
        leafGraphics.fillStyle(0x32CD32);
        leafGraphics.fillCircle(2, 2, 2);
        leafGraphics.generateTexture('leaf', 4, 4);
        leafGraphics.destroy();
        
        const waterDropGraphics = this.add.graphics();
        waterDropGraphics.fillStyle(0x4169E1, 0.8);
        waterDropGraphics.fillCircle(2, 2, 2);
        waterDropGraphics.generateTexture('waterDrop', 4, 4);
        waterDropGraphics.destroy();
        
        const glowGraphics = this.add.graphics();
        glowGraphics.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 1, 0);
        glowGraphics.fillCircle(8, 8, 8);
        glowGraphics.generateTexture('glow', 16, 16);
        glowGraphics.destroy();
    }
    
    createVisualEffects() {
        // Create explosion animations
        this.anims.create({
            key: 'tank_explosion',
            frames: [
                { key: 'explosion_frame_0' },
                { key: 'explosion_frame_1' },
                { key: 'explosion_frame_2' },
                { key: 'explosion_frame_3' },
                { key: 'explosion_frame_4' }
            ],
            frameRate: 15,
            repeat: 0
        });
        
        // Create particle emitters
        this.createParticleEmitters();
        
        // Track marks group
        this.trackMarks = this.add.group();
    }
    
    createParticleEmitters() {
        // Spark emitter for metal impacts
        this.particleEmitters.sparks = this.add.particles(0, 0, 'spark', {
            speed: { min: 50, max: 150 },
            scale: { start: 1, end: 0 },
            lifespan: 300,
            quantity: 8,
            emitting: false
        });
        
        // Smoke emitter for explosions
        this.particleEmitters.smoke = this.add.particles(0, 0, 'smoke', {
            speed: { min: 20, max: 60 },
            scale: { start: 0.5, end: 1.5 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 1000,
            quantity: 15,
            gravityY: -30,
            emitting: false
        });
        
        // Debris emitter for brick destruction
        this.particleEmitters.debris = this.add.particles(0, 0, 'debris', {
            speed: { min: 40, max: 120 },
            scale: { start: 1, end: 0.5 },
            lifespan: 800,
            quantity: 12,
            gravityY: 100,
            bounce: 0.3,
            emitting: false
        });
        
        // Leaf emitter for bush impacts
        this.particleEmitters.leaves = this.add.particles(0, 0, 'leaf', {
            speed: { min: 20, max: 80 },
            scale: { start: 0.8, end: 0.3 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            quantity: 6,
            gravityY: 30,
            emitting: false
        });
        
        // Water splash emitter
        this.particleEmitters.water = this.add.particles(0, 0, 'waterDrop', {
            speed: { min: 30, max: 80 },
            scale: { start: 0.8, end: 0.2 },
            alpha: { start: 1, end: 0 },
            lifespan: 400,
            quantity: 8,
            gravityY: 50,
            emitting: false
        });
        
        // Power-up collection sparkles
        this.particleEmitters.sparkles = this.add.particles(0, 0, 'glow', {
            speed: { min: 20, max: 60 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 800,
            quantity: 12,
            emitting: false,
            tint: 0xffd700
        });
        
        // Set depths for particle effects
        Object.values(this.particleEmitters).forEach(emitter => {
            emitter.setDepth(15);
        });
    }
    
    createTankExplosion(x, y, isArmored = false) {
        // Screen shake for explosions
        const shakeIntensity = isArmored ? 8 : 5;
        const shakeDuration = isArmored ? 300 : 200;
        this.cameras.main.shake(shakeDuration, shakeIntensity);
        
        // Create explosion sprite animation
        const explosion = this.add.sprite(x, y, 'explosion_frame_0');
        explosion.setDepth(20);
        explosion.setScale(isArmored ? 1.5 : 1);
        
        explosion.play('tank_explosion');
        explosion.on('animationcomplete', () => {
            explosion.destroy();
        });
        
        // Emit smoke particles
        this.particleEmitters.smoke.setPosition(x, y);
        this.particleEmitters.smoke.explode(isArmored ? 20 : 15);
        
        // Emit sparks
        this.particleEmitters.sparks.setPosition(x, y);
        this.particleEmitters.sparks.explode(isArmored ? 12 : 8);
        
        // Create expanding shockwave ring
        const shockwave = this.add.graphics();
        shockwave.lineStyle(3, 0xffffff, 1);
        shockwave.strokeCircle(x, y, 5);
        shockwave.setDepth(19);
        
        this.tweens.add({
            targets: shockwave,
            scaleX: isArmored ? 6 : 4,
            scaleY: isArmored ? 6 : 4,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => shockwave.destroy()
        });
    }
    
    createBulletImpactEffect(x, y, surfaceType) {
        switch (surfaceType) {
            case 'brick':
                // Debris particles
                this.particleEmitters.debris.setPosition(x, y);
                this.particleEmitters.debris.explode(10);
                
                // Small sparks
                this.particleEmitters.sparks.setPosition(x, y);
                this.particleEmitters.sparks.explode(6);
                break;
                
            case 'steel':
                // Bright sparks with ricochet effect
                this.particleEmitters.sparks.setPosition(x, y);
                this.particleEmitters.sparks.explode(15);
                
                // Create ricochet flash
                const flash = this.add.graphics();
                flash.fillStyle(0xffffff, 0.8);
                flash.fillCircle(x, y, 8);
                flash.setDepth(18);
                
                this.tweens.add({
                    targets: flash,
                    alpha: 0,
                    scale: 2,
                    duration: 150,
                    onComplete: () => flash.destroy()
                });
                break;
                
            case 'river':
                // Water splash and ripples
                this.particleEmitters.water.setPosition(x, y);
                this.particleEmitters.water.explode(8);
                
                this.createWaterRipple(x, y);
                break;
                
            case 'bush':
                // Leaf particles
                this.particleEmitters.leaves.setPosition(x, y);
                this.particleEmitters.leaves.explode(6);
                
                // Bush shake effect
                const nearbyBushes = this.bushes.children.entries.filter(bush => 
                    Phaser.Math.Distance.Between(bush.x, bush.y, x, y) < this.TILE_SIZE
                );
                
                nearbyBushes.forEach(bush => this.shakeBush(bush));
                break;
        }
    }
    
    createWaterRipple(x, y) {
        const ripple1 = this.add.graphics();
        const ripple2 = this.add.graphics();
        const ripple3 = this.add.graphics();
        
        [ripple1, ripple2, ripple3].forEach((ripple, index) => {
            ripple.lineStyle(2, 0x4169E1, 0.6);
            ripple.strokeCircle(x, y, 5);
            ripple.setDepth(16);
            
            this.tweens.add({
                targets: ripple,
                scaleX: 4,
                scaleY: 4,
                alpha: 0,
                duration: 800,
                delay: index * 150,
                ease: 'Power2',
                onComplete: () => ripple.destroy()
            });
        });
    }
    
    shakeBush(bush) {
        const originalX = bush.x;
        
        this.tweens.add({
            targets: bush,
            x: originalX - 2,
            duration: 50,
            yoyo: true,
            repeat: 3,
            ease: 'Power2'
        });
    }
    
    createPowerUpCollectionEffect(tank, powerUp) {
        // Tank glow effect
        const glow = this.add.sprite(tank.x, tank.y, 'glow');
        glow.setDepth(17);
        glow.setScale(2);
        glow.setTint(powerUp.powerUpType === 'star' ? 0xffd700 : 0x8B4513);
        
        this.tweens.add({
            targets: glow,
            alpha: 0,
            scale: 3,
            duration: 500,
            onComplete: () => glow.destroy()
        });
        
        // Tank flash effect
        this.tweens.add({
            targets: tank,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 4
        });
        
        // Sparkle burst
        this.particleEmitters.sparkles.setPosition(tank.x, tank.y);
        this.particleEmitters.sparkles.setTint(powerUp.powerUpType === 'star' ? 0xffd700 : 0x8B4513);
        this.particleEmitters.sparkles.explode(15);
    }
    
    createTrackMark(x, y, rotation) {
        // Limit track marks to prevent performance issues
        if (this.trackMarks.children.size > 100) {
            const oldestTrack = this.trackMarks.getFirst();
            if (oldestTrack) {
                this.trackMarks.remove(oldestTrack);
                oldestTrack.destroy();
            }
        }
        
        const track = this.add.graphics();
        track.fillStyle(0x4a3c28, 0.3);
        track.fillRect(-2, -1, 4, 2);
        track.setPosition(x, y);
        track.setRotation(rotation);
        track.setDepth(0.5);
        
        this.trackMarks.add(track);
        
        // Fade out track mark over time
        this.tweens.add({
            targets: track,
            alpha: 0,
            duration: 5000,
            onComplete: () => {
                this.trackMarks.remove(track);
                track.destroy();
            }
        });
    }
    
    updateVisualEffects() {
        // Update screen shake
        if (this.screenShakeIntensity > 0) {
            this.screenShakeIntensity *= 0.9;
            if (this.screenShakeIntensity < 0.1) {
                this.screenShakeIntensity = 0;
            }
        }
    }
    
    createTankSprites() {
        // Create player tank sprite (green rectangle)
        this.add.graphics()
            .fillStyle(0x00ff00)
            .fillRect(0, 0, this.TANK_SIZE, this.TANK_SIZE)
            .generateTexture('playerTank', this.TANK_SIZE, this.TANK_SIZE);
            
        // Create tank direction indicator (small rectangle at front)
        this.add.graphics()
            .fillStyle(0x004400)
            .fillRect(this.TANK_SIZE - 4, this.TANK_SIZE / 2 - 2, 4, 4)
            .generateTexture('tankDirection', 4, 4);
            
        // Create bullet sprite (yellow small rectangle)
        this.add.graphics()
            .fillStyle(0xffff00)
            .fillRect(0, 0, this.BULLET_SIZE, this.BULLET_SIZE)
            .generateTexture('bullet', this.BULLET_SIZE, this.BULLET_SIZE);
            
        // Create Eagle Base sprite (red with eagle symbol)
        this.add.graphics()
            .fillStyle(0xff0000)
            .fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE)
            .fillStyle(0xffff00)
            .fillCircle(this.TILE_SIZE/2, this.TILE_SIZE/2, 8)
            .fillStyle(0xff0000)
            .fillCircle(this.TILE_SIZE/2, this.TILE_SIZE/2, 4)
            .generateTexture('eagleBase', this.TILE_SIZE, this.TILE_SIZE);
            
        // Create Basic Enemy Tank (gray)
        this.add.graphics()
            .fillStyle(0x808080)
            .fillRect(0, 0, this.TANK_SIZE, this.TANK_SIZE)
            .fillStyle(0x404040)
            .fillRect(this.TANK_SIZE - 4, this.TANK_SIZE / 2 - 2, 4, 4)
            .generateTexture('basicEnemyTank', this.TANK_SIZE, this.TANK_SIZE);
            
        // Create Armored Enemy Tank (dark red)
        this.add.graphics()
            .fillStyle(0x8B0000)
            .fillRect(0, 0, this.TANK_SIZE, this.TANK_SIZE)
            .lineStyle(2, 0x654321)
            .strokeRect(1, 1, this.TANK_SIZE - 2, this.TANK_SIZE - 2)
            .fillStyle(0x400000)
            .fillRect(this.TANK_SIZE - 4, this.TANK_SIZE / 2 - 2, 4, 4)
            .generateTexture('armoredEnemyTank', this.TANK_SIZE, this.TANK_SIZE);
            
        // Create Enemy Bullet (red)
        this.add.graphics()
            .fillStyle(0xff0000)
            .fillRect(0, 0, this.BULLET_SIZE, this.BULLET_SIZE)
            .generateTexture('enemyBullet', this.BULLET_SIZE, this.BULLET_SIZE);
            
        // Create Star Power-up (yellow star)
        this.add.graphics()
            .fillStyle(0xffff00)
            .fillRect(0, 0, 16, 16)
            .fillStyle(0xffd700)
            .fillCircle(8, 8, 6)
            .fillStyle(0xffff00)
            .fillCircle(8, 4, 2)
            .fillCircle(8, 12, 2)
            .fillCircle(4, 8, 2)
            .fillCircle(12, 8, 2)
            .generateTexture('starPowerUp', 16, 16);
            
        // Create Shovel Power-up (brown shovel)
        this.add.graphics()
            .fillStyle(0x8B4513)
            .fillRect(0, 0, 16, 16)
            .fillStyle(0xA0522D)
            .fillRect(6, 2, 4, 12)
            .fillStyle(0x654321)
            .fillRect(4, 2, 8, 4)
            .generateTexture('shovelPowerUp', 16, 16);
            
        // Create terrain sprites
        // Brick wall (brown)
        this.add.graphics()
            .fillStyle(0x8B4513)
            .fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE)
            .lineStyle(2, 0x654321)
            .strokeRect(1, 1, this.TILE_SIZE - 2, this.TILE_SIZE - 2)
            .generateTexture('brickWall', this.TILE_SIZE, this.TILE_SIZE);
            
        // Steel wall (gray)
        this.add.graphics()
            .fillStyle(0x708090)
            .fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE)
            .lineStyle(2, 0x2F4F4F)
            .strokeRect(1, 1, this.TILE_SIZE - 2, this.TILE_SIZE - 2)
            .generateTexture('steelWall', this.TILE_SIZE, this.TILE_SIZE);
            
        // River (blue)
        this.add.graphics()
            .fillStyle(0x4169E1)
            .fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE)
            .fillStyle(0x1E90FF)
            .fillRect(4, 4, this.TILE_SIZE - 8, this.TILE_SIZE - 8)
            .generateTexture('river', this.TILE_SIZE, this.TILE_SIZE);
            
        // Bush (dark green)
        this.add.graphics()
            .fillStyle(0x228B22)
            .fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE)
            .fillStyle(0x32CD32)
            .fillCircle(this.TILE_SIZE/4, this.TILE_SIZE/4, 6)
            .fillCircle(3*this.TILE_SIZE/4, this.TILE_SIZE/4, 6)
            .fillCircle(this.TILE_SIZE/4, 3*this.TILE_SIZE/4, 6)
            .fillCircle(3*this.TILE_SIZE/4, 3*this.TILE_SIZE/4, 6)
            .fillCircle(this.TILE_SIZE/2, this.TILE_SIZE/2, 8)
            .generateTexture('bush', this.TILE_SIZE, this.TILE_SIZE);
    }
    
    createGrid() {
        // Create visual grid for reference
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x333333, 0.3);
        
        // Vertical lines
        for (let x = 0; x <= this.GRID_SIZE; x++) {
            graphics.moveTo(x * this.TILE_SIZE, 0);
            graphics.lineTo(x * this.TILE_SIZE, this.mapHeight);
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.GRID_SIZE; y++) {
            graphics.moveTo(0, y * this.TILE_SIZE);
            graphics.lineTo(this.mapWidth, y * this.TILE_SIZE);
        }
        
        graphics.strokePath();
        
        // Create background
        const bg = this.add.graphics();
        bg.fillStyle(0x8B4513); // Brown dirt color
        bg.fillRect(0, 0, this.mapWidth, this.mapHeight);
        bg.setDepth(-2);
        
        // Grid goes on top of background but below everything else
        graphics.setDepth(-1);
    }
    
    createPlayerTank() {
        // Calculate starting position (bottom-center)
        const startX = (this.GRID_SIZE * this.TILE_SIZE) / 2;
        const startY = (this.GRID_SIZE - 2) * this.TILE_SIZE + this.TILE_SIZE / 2;
        
        // Create player tank sprite
        this.playerTank = this.physics.add.sprite(startX, startY, 'playerTank');
        this.playerTank.setCollideWorldBounds(true);
        this.playerTank.setSize(this.TANK_SIZE, this.TANK_SIZE);
        this.playerTank.setOrigin(0.5, 0.5);
        
        // Add direction indicator as a child
        this.tankDirection = this.add.sprite(0, 0, 'tankDirection');
        this.tankDirection.setOrigin(0, 0.5);
        this.playerTank.addChild(this.tankDirection);
        this.tankDirection.setPosition(this.TANK_SIZE/2 - 2, 0);
        
        // Set initial properties
        this.playerTank.currentDirection = 0; // 0=right, 90=down, 180=left, 270=up
        this.playerTank.targetRotation = 0;
        this.playerTank.isMoving = false;
        this.playerTank.setDepth(5); // Above terrain, below bushes
        this.playerTank.lastTrackTime = 0;
    }
    
    handlePlayerInput(delta) {
        if (!this.playerTank) return;
        
        const speed = this.TANK_SPEED * (delta / 1000);
        let moving = false;
        let newDirection = this.playerTank.currentDirection;
        
        // Handle directional input
        if (this.cursors.left.isDown) {
            newDirection = 180;
            this.playerTank.setVelocityX(-this.TANK_SPEED);
            this.playerTank.setVelocityY(0);
            moving = true;
        } else if (this.cursors.right.isDown) {
            newDirection = 0;
            this.playerTank.setVelocityX(this.TANK_SPEED);
            this.playerTank.setVelocityY(0);
            moving = true;
        } else if (this.cursors.up.isDown) {
            newDirection = 270;
            this.playerTank.setVelocityX(0);
            this.playerTank.setVelocityY(-this.TANK_SPEED);
            moving = true;
        } else if (this.cursors.down.isDown) {
            newDirection = 90;
            this.playerTank.setVelocityX(0);
            this.playerTank.setVelocityY(this.TANK_SPEED);
            moving = true;
        } else {
            // No movement
            this.playerTank.setVelocityX(0);
            this.playerTank.setVelocityY(0);
            moving = false;
        }
        
        // Update direction if changed
        if (newDirection !== this.playerTank.currentDirection) {
            this.playerTank.currentDirection = newDirection;
            this.playerTank.targetRotation = Phaser.Math.DegToRad(newDirection);
        }
        
        // Smooth rotation towards target
        const currentRotation = this.playerTank.rotation;
        const targetRotation = this.playerTank.targetRotation;
        
        if (Math.abs(currentRotation - targetRotation) > 0.1) {
            const rotationSpeed = 8 * (delta / 1000);
            this.playerTank.rotation = Phaser.Math.Angle.RotateTo(
                currentRotation, 
                targetRotation, 
                rotationSpeed
            );
        } else {
            this.playerTank.rotation = targetRotation;
        }
        
        this.playerTank.isMoving = moving;
        
        // Create track marks when moving
        if (moving && this.time.now - this.playerTank.lastTrackTime > 100) {
            this.createTrackMark(
                this.playerTank.x - Math.cos(this.playerTank.rotation) * 8,
                this.playerTank.y - Math.sin(this.playerTank.rotation) * 8,
                this.playerTank.rotation
            );
            this.playerTank.lastTrackTime = this.time.now;
        }
        
        // Handle shooting input
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.shootBullet();
        }
    }
    
    createEagleBase() {
        // Eagle Base position (bottom-center)
        const eagleX = (this.GRID_SIZE * this.TILE_SIZE) / 2;
        const eagleY = (this.GRID_SIZE - 2) * this.TILE_SIZE + this.TILE_SIZE / 2;
        
        // Create the Eagle Base
        this.eagleBase = this.add.sprite(eagleX, eagleY, 'eagleBase');
        this.physics.add.existing(this.eagleBase, true);
        this.eagleBase.setDepth(1);
        this.eagleBase.isDestroyed = false;
        
        // Create protective brick walls (2 layers)
        const protectionTiles = [
            // Inner layer (around eagle)
            { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
            { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 },
            
            // Outer layer
            { x: -2, y: -2 }, { x: -1, y: -2 }, { x: 0, y: -2 }, { x: 1, y: -2 }, { x: 2, y: -2 },
            { x: -2, y: -1 }, { x: 2, y: -1 },
            { x: -2, y: 0 }, { x: 2, y: 0 },
            { x: -2, y: 1 }, { x: 2, y: 1 },
            { x: -2, y: 2 }, { x: -1, y: 2 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
        ];
        
        const eagleGridX = Math.floor(eagleX / this.TILE_SIZE);
        const eagleGridY = Math.floor(eagleY / this.TILE_SIZE);
        
        protectionTiles.forEach(offset => {
            const tileX = (eagleGridX + offset.x) * this.TILE_SIZE + this.TILE_SIZE / 2;
            const tileY = (eagleGridY + offset.y) * this.TILE_SIZE + this.TILE_SIZE / 2;
            
            // Only place bricks if within map bounds
            if (tileX >= this.TILE_SIZE/2 && tileX < this.mapWidth - this.TILE_SIZE/2 &&
                tileY >= this.TILE_SIZE/2 && tileY < this.mapHeight - this.TILE_SIZE/2) {
                
                const brick = this.add.sprite(tileX, tileY, 'brickWall');
                this.physics.add.existing(brick, true);
                this.brickWalls.add(brick);
                this.allSolids.add(brick);
                brick.armor = 1;
                brick.setDepth(1);
                brick.isEagleProtection = true;
            }
        });
    }
    
    shootBullet() {
        // Only shoot if no bullet is currently active
        if (this.playerBullet && this.playerBullet.active) {
            return;
        }
        
        // Calculate bullet starting position (at tank's front)
        const tankX = this.playerTank.x;
        const tankY = this.playerTank.y;
        const tankRotation = this.playerTank.rotation;
        
        // Calculate offset to spawn bullet at tank's front
        const offsetDistance = this.TANK_SIZE / 2 + 2;
        const bulletX = tankX + Math.cos(tankRotation) * offsetDistance;
        const bulletY = tankY + Math.sin(tankRotation) * offsetDistance;
        
        // Create or reuse bullet
        if (!this.playerBullet) {
            this.playerBullet = this.physics.add.sprite(bulletX, bulletY, 'bullet');
            this.playerBullet.setSize(this.BULLET_SIZE, this.BULLET_SIZE);
            this.playerBullet.setCollideWorldBounds(true);
            
            // Destroy bullet when it hits world bounds
            this.playerBullet.body.onWorldBounds = true;
            this.physics.world.on('worldbounds', (event, body) => {
                if (body.gameObject === this.playerBullet) {
                    this.destroyBullet();
                }
            });
        } else {
            // Reposition existing bullet
            this.playerBullet.setPosition(bulletX, bulletY);
            this.playerBullet.setActive(true);
            this.playerBullet.setVisible(true);
        }
        
        // Set bullet velocity based on tank direction
        const velocityX = Math.cos(tankRotation) * this.BULLET_SPEED;
        const velocityY = Math.sin(tankRotation) * this.BULLET_SPEED;
        
        this.playerBullet.setVelocity(velocityX, velocityY);
        this.playerBullet.setRotation(tankRotation);
        this.playerBullet.setDepth(8);
    }
    
    createTerrain() {
        // Create terrain groups
        this.brickWalls = this.physics.add.staticGroup();
        this.steelWalls = this.physics.add.staticGroup();
        this.rivers = this.physics.add.staticGroup();
        this.bushes = this.add.group(); // Non-physics group for bushes
        
        // Create combined group for solid obstacles
        this.allSolids = this.physics.add.staticGroup();
    }
    
    createSampleMap() {
        // Define a sample map layout (15x15 grid)
        // 0 = empty, 1 = brick, 2 = steel, 3 = river, 4 = bush
        // Note: Eagle Base area (bottom-center) will be handled separately
        const mapData = [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,0,2,2,2,0,3,3,0,1,1,4,0],
            [0,1,1,0,2,2,2,0,3,3,0,1,1,4,0],
            [0,0,0,0,0,0,0,0,3,3,0,0,0,0,0],
            [4,4,1,1,0,0,4,4,3,3,4,4,0,2,2],
            [4,4,1,1,0,0,4,4,0,0,4,4,0,2,2],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,0,3,3,3,3,0,2,2,2,2,0,1,1],
            [1,1,0,3,3,3,3,0,2,2,2,2,0,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [2,2,4,4,0,1,1,1,1,0,4,4,3,3,0],
            [2,2,4,4,0,1,1,1,1,0,4,4,3,3,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Eagle Base protection area - keep clear
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Eagle Base protection area - keep clear
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]  // Eagle Base protection area - keep clear
        ];
        
        // Create terrain based on map data
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const tileType = mapData[row][col];
                const x = col * this.TILE_SIZE + this.TILE_SIZE / 2;
                const y = row * this.TILE_SIZE + this.TILE_SIZE / 2;
                
                // Skip Eagle Base area (will be handled separately)
                const eagleAreaMinX = 5;
                const eagleAreaMaxX = 9;
                const eagleAreaMinY = 11;
                const eagleAreaMaxY = 14;
                
                if (col >= eagleAreaMinX && col <= eagleAreaMaxX && 
                    row >= eagleAreaMinY && row <= eagleAreaMaxY) {
                    continue; // Skip this area
                }
                
                switch (tileType) {
                    case 1: // Brick wall
                        const brick = this.add.sprite(x, y, 'brickWall');
                        this.physics.add.existing(brick, true); // true = static body
                        this.brickWalls.add(brick);
                        this.allSolids.add(brick);
                        brick.armor = 1;
                        brick.setDepth(1);
                        break;
                        
                    case 2: // Steel wall
                        const steel = this.add.sprite(x, y, 'steelWall');
                        this.physics.add.existing(steel, true);
                        this.steelWalls.add(steel);
                        this.allSolids.add(steel);
                        steel.armor = 3;
                        steel.setDepth(1);
                        break;
                        
                    case 3: // River
                        const river = this.add.sprite(x, y, 'river');
                        this.physics.add.existing(river, true);
                        this.rivers.add(river);
                        this.allSolids.add(river);
                        river.setDepth(1);
                        break;
                        
                    case 4: // Bush
                        const bush = this.add.sprite(x, y, 'bush');
                        this.bushes.add(bush);
                        bush.setDepth(10); // High depth so bushes appear on top of tanks
                        break;
                }
            }
        }
    }
    
    setupCollisions() {
        // Tank collisions with solid obstacles
        this.physics.add.collider(this.playerTank, this.allSolids);
        this.physics.add.collider(this.enemyTanks, this.allSolids);
        this.physics.add.collider(this.playerTank, this.enemyTanks);
        this.physics.add.collider(this.enemyTanks, this.enemyTanks);
        
        // Player bullet collisions
        this.physics.add.overlap(this.playerBullet, this.brickWalls, this.bulletHitBrick, null, this);
        this.physics.add.overlap(this.playerBullet, this.steelWalls, this.bulletHitSteel, null, this);
        this.physics.add.overlap(this.playerBullet, this.rivers, this.bulletHitRiver, null, this);
        this.physics.add.overlap(this.playerBullet, this.eagleBase, this.bulletHitEagle, null, this);
        this.physics.add.overlap(this.playerBullet, this.enemyTanks, this.playerBulletHitEnemy, null, this);
        
        // Enemy bullet collisions
        this.physics.add.overlap(this.enemyBullets, this.brickWalls, this.enemyBulletHitBrick, null, this);
        this.physics.add.overlap(this.enemyBullets, this.steelWalls, this.enemyBulletHitSteel, null, this);
        this.physics.add.overlap(this.enemyBullets, this.rivers, this.enemyBulletHitRiver, null, this);
        this.physics.add.overlap(this.enemyBullets, this.eagleBase, this.enemyBulletHitEagle, null, this);
        this.physics.add.overlap(this.enemyBullets, this.playerTank, this.enemyBulletHitPlayer, null, this);
        
        // Power-up collisions
        this.physics.add.overlap(this.playerTank, this.powerUps, this.collectPowerUp, null, this);
    }
    
    bulletHitEagle(bullet, eagle) {
        if (this.gameOver || this.gameWon) return;
        
        this.destroyBullet();
        this.eagleBase.isDestroyed = true;
        
        // Change eagle appearance to destroyed
        this.eagleBase.setTint(0x666666);
        
        // Create massive explosion effect
        this.createTankExplosion(eagle.x, eagle.y, true);
        
        // Game Over - Eagle destroyed
        this.triggerGameOver('Eagle Base Destroyed!');
    }
    
    bulletHitBrick(bullet, brick) {
        // Brick walls are destroyed by bullets with enough power
        this.destroyBullet();
        
        // Create impact effect before removing brick
        this.createBulletImpactEffect(brick.x, brick.y, 'brick');
        
        // Remove brick from game
        this.brickWalls.remove(brick);
        this.allSolids.remove(brick);
        brick.destroy();
    }
    
    bulletHitSteel(bullet, steel) {
        // Steel walls require high power bullets (power 3) to be damaged
        if (this.playerBulletPower >= 3) {
            // Destroy steel wall with power 3 bullets
            this.destroyBullet();
            this.createBulletImpactEffect(steel.x, steel.y, 'brick');
            this.steelWalls.remove(steel);
            this.allSolids.remove(steel);
            steel.destroy();
        } else {
            // Steel walls block lower power bullets
            this.destroyBullet();
            this.createBulletImpactEffect(steel.x, steel.y, 'steel');
        }
    }
    
    bulletHitRiver(bullet, river) {
        this.destroyBullet();
        this.createBulletImpactEffect(river.x, river.y, 'river');
    }
    
    createImpactEffect(x, y, type) {
        // Deprecated - use createBulletImpactEffect instead
        this.createBulletImpactEffect(x, y, type);
    }
    
    createUI() {
        // Create UI container in HTML
        const gameContainer = document.getElementById('game');
        
        this.uiContainer = document.createElement('div');
        this.uiContainer.className = 'game-ui';
        this.uiContainer.innerHTML = `
            <div class="ui-row">Score: <span id="score-display">0</span></div>
            <div class="ui-row">Lives: <span id="lives-display">3</span></div>
            <div class="ui-row">HP: <span id="hp-display">3</span><div class="health-bar"><div class="health-fill" id="health-fill"></div></div></div>
            <div class="ui-row">Power: <span id="power-display">1</span></div>
            <div class="ui-row">Level: 1</div>
            <div class="ui-row">Time: <span id="timer-display">3:00</span></div>
            <div class="ui-row">Enemies: <span id="enemies-display">0/20</span></div>
        `;
        
        gameContainer.appendChild(this.uiContainer);
        
        // Store references to UI elements
        this.scoreDisplay = document.getElementById('score-display');
        this.livesDisplay = document.getElementById('lives-display');
        this.hpDisplay = document.getElementById('hp-display');
        this.powerDisplay = document.getElementById('power-display');
        this.timerDisplay = document.getElementById('timer-display');
        this.healthFill = document.getElementById('health-fill');
        this.enemiesDisplay = document.getElementById('enemies-display');
        
        this.updateUI();
    }
    
    updateUI() {
        if (!this.livesDisplay) return;
        
        this.scoreDisplay.textContent = this.score;
        this.livesDisplay.textContent = this.playerLives;
        this.hpDisplay.textContent = this.playerHP;
        this.powerDisplay.textContent = this.playerBulletPower;
        
        // Update health bar
        const healthPercent = (this.playerHP / this.maxHP) * 100;
        this.healthFill.style.width = healthPercent + '%';
        
        // Update timer
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        this.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Update enemies counter
        this.enemiesDisplay.textContent = `${this.enemiesDestroyed}/${this.maxEnemies}`;
    }
    
    startGameTimer() {
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.gameTime--;
                if (this.gameTime <= 0) {
                    this.triggerVictory();
                }
            },
            loop: true
        });
    }
    
    takeDamage(amount = 1) {
        if (this.gameOver || this.gameWon || this.isRespawning) return;
        
        this.playerHP -= amount;
        
        // Create damage flash effect
        this.tweens.add({
            targets: this.playerTank,
            tint: 0xff0000,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.playerTank.setTint(0xffffff);
            }
        });
        
        if (this.playerHP <= 0) {
            this.playerLives--;
            
            if (this.playerLives <= 0) {
                this.triggerGameOver('All Lives Lost!');
            } else {
                this.respawnPlayer();
            }
        }
        
        this.updateUI();
    }
    
    respawnPlayer() {
        this.isRespawning = true;
        this.playerHP = this.maxHP;
        
        // Create explosion at current position
        this.createTankExplosion(this.playerTank.x, this.playerTank.y, false);
        
        // Hide tank during respawn
        this.playerTank.setVisible(false);
        this.playerTank.setVelocity(0, 0);
        
        // Move tank to respawn position (near Eagle Base)
        const respawnX = this.eagleBase.x;
        const respawnY = this.eagleBase.y - this.TILE_SIZE * 3;
        this.playerTank.setPosition(respawnX, respawnY);
        
        // Create expanding circle respawn effect
        this.createRespawnEffect(respawnX, respawnY);
    }
    
    createRespawnEffect(x, y) {
        // Create expanding circle effect
        const circle = this.add.graphics();
        circle.lineStyle(4, 0x00ff00);
        circle.strokeCircle(x, y, 5);
        circle.setDepth(15);
        
        // Expand and fade animation
        this.tweens.add({
            targets: circle,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                circle.destroy();
                // Show tank again
                this.playerTank.setVisible(true);
                this.playerTank.setAlpha(0);
                
                // Fade in tank
                this.tweens.add({
                    targets: this.playerTank,
                    alpha: 1,
                    duration: 500,
                    onComplete: () => {
                        this.isRespawning = false;
                        this.updateUI();
                    }
                });
            }
        });
    }
    
    triggerGameOver(reason) {
        if (this.gameOver) return;
        
        this.gameOver = true;
        
        // Stop timer
        if (this.gameTimer) {
            this.gameTimer.destroy();
        }
        
        // Stop tank movement
        this.playerTank.setVelocity(0, 0);
        
        // Create game over screen
        const gameContainer = document.getElementById('game');
        const gameOverScreen = document.createElement('div');
        gameOverScreen.className = 'game-over-screen';
        gameOverScreen.innerHTML = `
            <h2>GAME OVER</h2>
            <p>${reason}</p>
            <p>Press F5 to restart</p>
        `;
        
        gameContainer.appendChild(gameOverScreen);
    }
    
    triggerVictory() {
        if (this.gameWon || this.gameOver) return;
        
        this.gameWon = true;
        
        // Stop timer
        if (this.gameTimer) {
            this.gameTimer.destroy();
        }
        
        // Stop tank movement
        this.playerTank.setVelocity(0, 0);
        
        // Create victory screen
        const gameContainer = document.getElementById('game');
        const victoryScreen = document.createElement('div');
        victoryScreen.className = 'victory-screen';
        victoryScreen.innerHTML = `
            <h2>VICTORY!</h2>
            <p>You protected the Eagle Base!</p>
            <p>Final Score: ${this.score}</p>
            <p>Lives Remaining: ${this.playerLives}</p>
            <p>HP Remaining: ${this.playerHP}</p>
            <p>Press F5 to play again</p>
        `;
        
        gameContainer.appendChild(victoryScreen);
    }
    
    createEnemySystem() {
        // Create enemy groups
        this.enemyTanks = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        
        // Define spawn points (top corners and top-center)
        this.spawnPoints = [
            { x: this.TILE_SIZE, y: this.TILE_SIZE },                    // Top-left
            { x: this.mapWidth / 2, y: this.TILE_SIZE },                 // Top-center
            { x: this.mapWidth - this.TILE_SIZE, y: this.TILE_SIZE }     // Top-right
        ];
        
        // Start spawning enemies
        this.spawnEnemyTimer = this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        // Spawn first enemy immediately
        this.spawnEnemy();
    }
    
    spawnEnemy() {
        if (this.enemiesDestroyed >= this.maxEnemies || this.activeEnemies >= this.maxActiveEnemies) {
            return;
        }
        
        // Choose random spawn point
        const spawnPoint = Phaser.Utils.Array.GetRandom(this.spawnPoints);
        
        // Check if spawn point is clear
        const existingTank = this.enemyTanks.children.entries.find(tank => 
            Phaser.Math.Distance.Between(tank.x, tank.y, spawnPoint.x, spawnPoint.y) < this.TANK_SIZE * 2
        );
        
        if (existingTank) return; // Spawn point blocked
        
        // Determine tank type (50/50 split between basic and armored)
        const isArmored = Math.random() < 0.5;
        const texture = isArmored ? 'armoredEnemyTank' : 'basicEnemyTank';
        
        // Create enemy tank
        const enemy = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, texture);
        enemy.setCollideWorldBounds(true);
        enemy.setSize(this.TANK_SIZE, this.TANK_SIZE);
        enemy.setDepth(5);
        
        // Set enemy properties
        enemy.hp = isArmored ? 3 : 1;
        enemy.maxHP = enemy.hp;
        enemy.bulletPower = isArmored ? 2 : 1;
        enemy.isArmored = isArmored;
        enemy.lastShot = 0;
        enemy.moveTimer = 0;
        enemy.currentTarget = null;
        enemy.stuck = false;
        enemy.stuckTimer = 0;
        enemy.lastPosition = { x: spawnPoint.x, y: spawnPoint.y };
        enemy.lastTrackTime = 0;
        
        this.enemyTanks.add(enemy);
        this.activeEnemies++;
        
        // Create spawn effect
        this.createRespawnEffect(spawnPoint.x, spawnPoint.y);
    }
    
    updateEnemies(time, delta) {
        this.enemyTanks.children.entries.forEach(enemy => {
            this.updateEnemyAI(enemy, time, delta);
        });
        
        this.updateEnemyBullets();
    }
    
    updateEnemyAI(enemy, time, delta) {
        // Check if stuck
        const distanceMoved = Phaser.Math.Distance.Between(
            enemy.x, enemy.y, enemy.lastPosition.x, enemy.lastPosition.y
        );
        
        if (distanceMoved < 5) {
            enemy.stuckTimer += delta;
            if (enemy.stuckTimer > 1000) { // Stuck for 1 second
                enemy.stuck = true;
            }
        } else {
            enemy.stuckTimer = 0;
            enemy.stuck = false;
            enemy.lastPosition.x = enemy.x;
            enemy.lastPosition.y = enemy.y;
        }
        
        // Choose target (player tank or Eagle Base)
        const distanceToPlayer = Phaser.Math.Distance.Between(
            enemy.x, enemy.y, this.playerTank.x, this.playerTank.y
        );
        const distanceToEagle = Phaser.Math.Distance.Between(
            enemy.x, enemy.y, this.eagleBase.x, this.eagleBase.y
        );
        
        const target = distanceToPlayer < distanceToEagle ? this.playerTank : this.eagleBase;
        
        // Movement AI
        let isMoving = false;
        if (enemy.stuck) {
            // Random movement when stuck
            const randomAngle = Math.random() * Math.PI * 2;
            const moveX = Math.cos(randomAngle) * this.ENEMY_SPEED;
            const moveY = Math.sin(randomAngle) * this.ENEMY_SPEED;
            enemy.setVelocity(moveX, moveY);
            enemy.rotation = randomAngle;
            isMoving = true;
        } else {
            // Move toward target
            const angleToTarget = Phaser.Math.Angle.Between(
                enemy.x, enemy.y, target.x, target.y
            );
            
            const moveX = Math.cos(angleToTarget) * this.ENEMY_SPEED;
            const moveY = Math.sin(angleToTarget) * this.ENEMY_SPEED;
            
            enemy.setVelocity(moveX, moveY);
            enemy.rotation = angleToTarget;
            isMoving = true;
        }
        
        // Create track marks for moving enemies
        if (isMoving && time - enemy.lastTrackTime > 150) {
            this.createTrackMark(
                enemy.x - Math.cos(enemy.rotation) * 8,
                enemy.y - Math.sin(enemy.rotation) * 8,
                enemy.rotation
            );
            enemy.lastTrackTime = time;
        }
        
        // Shooting AI
        if (time - enemy.lastShot > this.ENEMY_SHOOT_COOLDOWN) {
            const distanceToPlayer = Phaser.Math.Distance.Between(
                enemy.x, enemy.y, this.playerTank.x, this.playerTank.y
            );
            
            if (distanceToPlayer < this.ENEMY_SHOOT_RANGE) {
                // Check line of sight to player
                if (this.hasLineOfSight(enemy, this.playerTank)) {
                    this.enemyShoot(enemy, time);
                }
            }
        }
    }
    
    hasLineOfSight(fromTank, toTank) {
        // Simple line of sight check - could be improved with raycasting
        const distance = Phaser.Math.Distance.Between(fromTank.x, fromTank.y, toTank.x, toTank.y);
        return distance < this.ENEMY_SHOOT_RANGE; // Simplified check
    }
    
    enemyShoot(enemy, time) {
        enemy.lastShot = time;
        
        // Calculate bullet starting position
        const offsetDistance = this.TANK_SIZE / 2 + 2;
        const bulletX = enemy.x + Math.cos(enemy.rotation) * offsetDistance;
        const bulletY = enemy.y + Math.sin(enemy.rotation) * offsetDistance;
        
        // Create bullet
        const bullet = this.physics.add.sprite(bulletX, bulletY, 'enemyBullet');
        bullet.setSize(this.BULLET_SIZE, this.BULLET_SIZE);
        bullet.setCollideWorldBounds(true);
        bullet.power = enemy.bulletPower;
        bullet.setDepth(8);
        
        // Set bullet velocity
        const velocityX = Math.cos(enemy.rotation) * this.BULLET_SPEED;
        const velocityY = Math.sin(enemy.rotation) * this.BULLET_SPEED;
        bullet.setVelocity(velocityX, velocityY);
        bullet.setRotation(enemy.rotation);
        
        this.enemyBullets.add(bullet);
        
        // Auto-destroy bullet after time
        this.time.delayedCall(3000, () => {
            if (bullet.active) {
                bullet.destroy();
            }
        });
    }
    
    updateEnemyBullets() {
        this.enemyBullets.children.entries.forEach(bullet => {
            // Check bounds
            if (bullet.x < 0 || bullet.x > this.mapWidth || 
                bullet.y < 0 || bullet.y > this.mapHeight) {
                bullet.destroy();
            }
        });
    }
    
    playerBulletHitEnemy(bullet, enemy) {
        this.destroyBullet();
        
        enemy.hp -= this.playerBulletPower;
        
        // Create hit effect
        this.createBulletImpactEffect(enemy.x, enemy.y, 'steel');
        
        if (enemy.hp <= 0) {
            this.destroyEnemy(enemy);
        } else {
            // Enemy damage flash
            this.tweens.add({
                targets: enemy,
                tint: 0xff0000,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    enemy.setTint(0xffffff);
                }
            });
        }
    }
    
    destroyEnemy(enemy) {
        // Create explosion effect
        this.createTankExplosion(enemy.x, enemy.y, enemy.isArmored);
        
        // Add score based on enemy type
        if (enemy.isArmored) {
            this.score += 200; // Armored Tank
        } else {
            this.score += 100; // Basic Tank
        }
        
        this.activeEnemies--;
        this.enemiesDestroyed++;
        
        enemy.destroy();
    }
    
    enemyBulletHitBrick(bullet, brick) {
        // Remove brick and bullet
        this.createBulletImpactEffect(brick.x, brick.y, 'brick');
        this.brickWalls.remove(brick);
        this.allSolids.remove(brick);
        brick.destroy();
        bullet.destroy();
    }
    
    enemyBulletHitSteel(bullet, steel) {
        bullet.destroy();
        this.createBulletImpactEffect(steel.x, steel.y, 'steel');
    }
    
    enemyBulletHitRiver(bullet, river) {
        bullet.destroy();
        this.createBulletImpactEffect(river.x, river.y, 'river');
    }
    
    enemyBulletHitEagle(bullet, eagle) {
        bullet.destroy();
        
        if (!this.eagleBase.isDestroyed) {
            this.eagleBase.isDestroyed = true;
            this.eagleBase.setTint(0x666666);
            this.createTankExplosion(eagle.x, eagle.y, true);
            this.triggerGameOver('Eagle Base Destroyed by Enemy!');
        }
    }
    
    enemyBulletHitPlayer(bullet, player) {
        bullet.destroy();
        
        // Create hit effect
        this.createBulletImpactEffect(player.x, player.y, 'steel');
        
        // Damage player
        this.takeDamage(bullet.power || 1);
    }
    
    createPowerUpSystem() {
        // Create power-up group
        this.powerUps = this.physics.add.group();
        
        // Start power-up spawn timer
        this.powerUpTimer = this.time.addEvent({
            delay: 15000, // Spawn power-ups every 15 seconds
            callback: this.spawnPowerUp,
            callbackScope: this,
            loop: true
        });
        
        // Spawn first power-up after 10 seconds
        this.time.delayedCall(10000, () => {
            this.spawnPowerUp();
        });
    }
    
    spawnPowerUp() {
        // Check if we can spawn more power-ups
        if (this.starPowerUpsSpawned >= this.maxStarPowerUps && 
            this.shovelPowerUpsSpawned >= this.maxShovelPowerUps) {
            return; // No more power-ups to spawn
        }
        
        // Determine power-up type
        let powerUpType;
        if (this.starPowerUpsSpawned < this.maxStarPowerUps && 
            this.shovelPowerUpsSpawned < this.maxShovelPowerUps) {
            // Both types available, choose randomly
            powerUpType = Math.random() < 0.6 ? 'star' : 'shovel'; // 60% chance for star
        } else if (this.starPowerUpsSpawned < this.maxStarPowerUps) {
            powerUpType = 'star';
        } else {
            powerUpType = 'shovel';
        }
        
        // Find random empty spot
        const maxAttempts = 20;
        let attempts = 0;
        let spawnX, spawnY;
        let validSpawn = false;
        
        while (!validSpawn && attempts < maxAttempts) {
            // Random position on grid
            const gridX = Math.floor(Math.random() * (this.GRID_SIZE - 2)) + 1;
            const gridY = Math.floor(Math.random() * (this.GRID_SIZE - 4)) + 1; // Avoid Eagle Base area
            
            spawnX = gridX * this.TILE_SIZE + this.TILE_SIZE / 2;
            spawnY = gridY * this.TILE_SIZE + this.TILE_SIZE / 2;
            
            // Check if spot is clear (no terrain, no enemies, no other power-ups)
            const hasObstacle = this.allSolids.children.entries.some(solid => 
                Phaser.Math.Distance.Between(solid.x, solid.y, spawnX, spawnY) < this.TILE_SIZE
            );
            
            const hasEnemy = this.enemyTanks.children.entries.some(enemy => 
                Phaser.Math.Distance.Between(enemy.x, enemy.y, spawnX, spawnY) < this.TILE_SIZE * 2
            );
            
            const hasPowerUp = this.powerUps.children.entries.some(powerUp => 
                Phaser.Math.Distance.Between(powerUp.x, powerUp.y, spawnX, spawnY) < this.TILE_SIZE * 2
            );
            
            if (!hasObstacle && !hasEnemy && !hasPowerUp) {
                validSpawn = true;
            }
            
            attempts++;
        }
        
        if (!validSpawn) return; // Couldn't find a valid spawn location
        
        // Create power-up
        const texture = powerUpType === 'star' ? 'starPowerUp' : 'shovelPowerUp';
        const powerUp = this.physics.add.sprite(spawnX, spawnY, texture);
        powerUp.setDepth(6);
        powerUp.powerUpType = powerUpType;
        powerUp.setSize(16, 16);
        
        // Add pulsing animation
        this.tweens.add({
            targets: powerUp,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add floating glow effect
        const glow = this.add.sprite(spawnX, spawnY, 'glow');
        glow.setDepth(5);
        glow.setScale(1.5);
        glow.setTint(powerUpType === 'star' ? 0xffd700 : 0x8B4513);
        glow.setAlpha(0.3);
        
        this.tweens.add({
            targets: glow,
            alpha: 0.6,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Link glow to power-up for cleanup
        powerUp.glowEffect = glow;
        
        this.powerUps.add(powerUp);
        
        // Update spawn counters
        if (powerUpType === 'star') {
            this.starPowerUpsSpawned++;
        } else {
            this.shovelPowerUpsSpawned++;
        }
        
        // Auto-destroy power-up after 30 seconds
        this.time.delayedCall(30000, () => {
            if (powerUp.active) {
                if (powerUp.glowEffect) {
                    powerUp.glowEffect.destroy();
                }
                powerUp.destroy();
            }
        });
    }
    
    updatePowerUps() {
        // Power-ups handle their own animations via tweens
        // This method can be used for additional power-up logic if needed
    }
    
    collectPowerUp(player, powerUp) {
        // Add score for collecting power-up
        this.score += 50;
        
        // Apply power-up effect
        if (powerUp.powerUpType === 'star') {
            this.collectStarPowerUp();
        } else if (powerUp.powerUpType === 'shovel') {
            this.collectShovelPowerUp();
        }
        
        // Create collection effects
        this.createPowerUpCollectionEffect(player, powerUp);
        
        // Clean up glow effect
        if (powerUp.glowEffect) {
            powerUp.glowEffect.destroy();
        }
        
        // Remove power-up
        powerUp.destroy();
    }
    
    collectStarPowerUp() {
        // Increase bullet power (max level 3)
        if (this.playerBulletPower < 3) {
            this.playerBulletPower++;
        }
    }
    
    collectShovelPowerUp() {
        // Reinforce Eagle Base walls
        this.reinforceEagleBase();
    }
    
    reinforceEagleBase() {
        if (this.eagleBaseReinforced) return; // Already reinforced
        
        this.eagleBaseReinforced = true;
        
        // Store original walls for restoration
        this.originalEagleWalls = [];
        
        // Find all Eagle Base protection walls
        this.brickWalls.children.entries.forEach(brick => {
            if (brick.isEagleProtection) {
                this.originalEagleWalls.push({
                    x: brick.x,
                    y: brick.y
                });
            }
        });
        
        // Convert brick walls around Eagle Base to steel
        const bricksToReplace = [];
        this.brickWalls.children.entries.forEach(brick => {
            if (brick.isEagleProtection) {
                bricksToReplace.push(brick);
            }
        });
        
        bricksToReplace.forEach(brick => {
            const x = brick.x;
            const y = brick.y;
            
            // Remove brick
            this.brickWalls.remove(brick);
            this.allSolids.remove(brick);
            brick.destroy();
            
            // Create steel wall with reinforcement effect
            const steel = this.add.sprite(x, y, 'steelWall');
            this.physics.add.existing(steel, true);
            this.steelWalls.add(steel);
            this.allSolids.add(steel);
            steel.armor = 3;
            steel.setDepth(1);
            steel.isEagleProtection = true;
            steel.isReinforced = true;
            
            // Add reinforcement flash effect
            this.tweens.add({
                targets: steel,
                tint: 0xffffff,
                duration: 100,
                yoyo: true,
                repeat: 3
            });
        });
        
        // Set timer to revert after 20 seconds
        this.eagleReinforceTimer = this.time.delayedCall(20000, () => {
            this.revertEagleBase();
        });
    }
    
    revertEagleBase() {
        this.eagleBaseReinforced = false;
        
        // Remove reinforced steel walls
        const steelsToRevert = [];
        this.steelWalls.children.entries.forEach(steel => {
            if (steel.isReinforced) {
                steelsToRevert.push(steel);
            }
        });
        
        steelsToRevert.forEach(steel => {
            this.steelWalls.remove(steel);
            this.allSolids.remove(steel);
            steel.destroy();
        });
        
        // Restore original brick walls (even if they were destroyed)
        this.originalEagleWalls.forEach(wallData => {
            const brick = this.add.sprite(wallData.x, wallData.y, 'brickWall');
            this.physics.add.existing(brick, true);
            this.brickWalls.add(brick);
            this.allSolids.add(brick);
            brick.armor = 1;
            brick.setDepth(1);
            brick.isEagleProtection = true;
        });
        
        this.originalEagleWalls = [];
    }
    
    createCollectionEffect(player, powerUp) {
        // Deprecated - use createPowerUpCollectionEffect instead
        this.createPowerUpCollectionEffect(player, powerUp);
    }
    
    updateBullets() {
        // Check if bullet exists and is active
        if (this.playerBullet && this.playerBullet.active) {
            // Check if bullet is out of bounds (additional safety check)
            const bounds = this.physics.world.bounds;
            if (this.playerBullet.x < bounds.x - 10 || 
                this.playerBullet.x > bounds.x + bounds.width + 10 ||
                this.playerBullet.y < bounds.y - 10 || 
                this.playerBullet.y > bounds.y + bounds.height + 10) {
                this.destroyBullet();
            }
        }
        
        // Check for bullet impacts with bushes (visual only, no collision)
        if (this.playerBullet && this.playerBullet.active) {
            this.bushes.children.entries.forEach(bush => {
                if (Phaser.Math.Distance.Between(
                    this.playerBullet.x, this.playerBullet.y, bush.x, bush.y
                ) < this.TILE_SIZE / 2) {
                    this.createBulletImpactEffect(bush.x, bush.y, 'bush');
                }
            });
        }
    }
    
    destroyBullet() {
        if (this.playerBullet) {
            this.playerBullet.setActive(false);
            this.playerBullet.setVisible(false);
            this.playerBullet.setVelocity(0, 0);
        }
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 15 * 32, // 15 tiles * 32 pixels
    height: 15 * 32,
    parent: 'game',
    backgroundColor: '#2c3e50',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: TankGame,
    fps: {
        target: 60,
        forceSetTimeOut: true
    }
};

// Start the game
const game = new Phaser.Game(config);