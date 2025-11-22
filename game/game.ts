import Phaser from 'phaser';
import { SoundSys } from '../utils/audio';
import { gameEvents, EVENTS } from './events';

// --- Assets & Config ---

const COLORS = {
    player: 0x00e0ff, // Cyan
    playerEngine: 0xffaa00,
    enemy: 0xff0055, // Neon Red
    enemyCore: 0xffffff,
    bullet: 0xffff00, // Yellow
    exp: 0x00ff88, // Green
    god: 0xffd700
};

// --- Boot Scene: Generates Procedural Textures ---
class BootScene extends Phaser.Scene {
    textures!: Phaser.Textures.TextureManager;
    make!: Phaser.GameObjects.GameObjectCreator;
    scene!: Phaser.Scenes.ScenePlugin;

    constructor() { super('BootScene'); }

    create() {
        const makeTexture = (key: string, width: number, height: number, drawFn: (g: Phaser.GameObjects.Graphics) => void) => {
            if (this.textures.exists(key)) return;
            // Ensure dimensions are valid integers >= 1 to prevent Framebuffer Incomplete Attachment errors
            const w = Math.floor(Math.max(1, width));
            const h = Math.floor(Math.max(1, height));
            
            // add: false prevents adding to the scene graph, improving safety during boot
            const g = this.make.graphics({ x: 0, y: 0 }, false);
            drawFn(g);
            g.generateTexture(key, w, h);
            g.destroy();
        };

        // Player: Sci-fi Fighter Jet
        makeTexture('player', 64, 64, (g) => {
            // Engine Trails
            g.fillStyle(COLORS.playerEngine, 0.5);
            g.fillTriangle(20, 55, 44, 55, 32, 64);
            
            // Main Body Wings
            g.fillStyle(0x050510);
            g.lineStyle(2, COLORS.player);
            g.beginPath();
            g.moveTo(32, 0); // Nose
            g.lineTo(60, 40); // Right Wing tip
            g.lineTo(60, 50); 
            g.lineTo(40, 45); 
            g.lineTo(40, 55); // Right Engine
            g.lineTo(24, 55); // Left Engine
            g.lineTo(24, 45);
            g.lineTo(4, 50); 
            g.lineTo(4, 40); // Left Wing tip
            g.closePath();
            g.fillPath();
            g.strokePath();

            // Cockpit
            g.fillStyle(0xffffff, 0.9);
            g.fillEllipse(32, 25, 4, 8);
            
            // Details
            g.lineStyle(1, COLORS.player, 0.5);
            g.lineBetween(32, 10, 32, 40);
            g.lineBetween(24, 45, 40, 45);
        });

        // Enemy: Rotating Hex Drone
        makeTexture('enemy', 64, 64, (g) => {
            g.lineStyle(2, COLORS.enemy);
            g.fillStyle(0x200010);
            
            // Outer Ring (Broken Circle)
            g.beginPath();
            g.arc(32, 32, 26, 0, Math.PI * 0.3);
            g.strokePath();
            g.beginPath();
            g.arc(32, 32, 26, Math.PI, Math.PI * 1.3);
            g.strokePath();

            // Hexagon Body
            g.beginPath();
            for(let i=0; i<6; i++) {
                const angle = (Math.PI / 3) * i;
                const x = 32 + 18 * Math.cos(angle);
                const y = 32 + 18 * Math.sin(angle);
                if(i===0) g.moveTo(x, y);
                else g.lineTo(x, y);
            }
            g.closePath();
            g.fillPath();
            g.strokePath();

            // Glowing Core
            g.fillStyle(COLORS.enemy);
            g.fillCircle(32, 32, 6);
            g.fillStyle(COLORS.enemyCore);
            g.fillCircle(32, 32, 3);
        });

        // Bullet: High Energy Plasma
        makeTexture('bullet', 32, 32, (g) => {
            g.fillStyle(COLORS.bullet);
            // Core
            g.fillRoundedRect(13, 4, 6, 24, 3);
            // Glow aura
            g.lineStyle(2, COLORS.bullet, 0.4);
            g.strokeRoundedRect(10, 0, 12, 32, 6);
        });

        // Particle: Spark
        makeTexture('particle', 16, 16, (g) => {
            g.fillStyle(0xffffff);
            g.fillCircle(8, 8, 4);
        });

        // Drop: Data Cube
        makeTexture('drop', 32, 32, (g) => {
            // Isometric Cube-ish look
            g.lineStyle(2, COLORS.exp);
            g.fillStyle(0x002211);
            
            g.beginPath();
            g.moveTo(16, 4);
            g.lineTo(28, 10);
            g.lineTo(28, 22);
            g.lineTo(16, 28);
            g.lineTo(4, 22);
            g.lineTo(4, 10);
            g.closePath();
            g.fillPath();
            g.strokePath();
            
            // Inner symbol
            g.fillStyle(COLORS.exp);
            g.fillCircle(16, 16, 4);
        });

        // God Drop: Golden Artifact
        makeTexture('drop_god', 48, 48, (g) => {
            g.lineStyle(3, COLORS.god);
            g.fillStyle(0x332200);
            g.beginPath();
            g.moveTo(24, 2);
            g.lineTo(46, 24);
            g.lineTo(24, 46);
            g.lineTo(2, 24);
            g.closePath();
            g.fillPath();
            g.strokePath();
            
            g.fillStyle(COLORS.god);
            g.fillCircle(24, 24, 8);
        });

        // Grid Texture
        makeTexture('grid_tile', 100, 100, (g) => {
            g.lineStyle(1, 0x0044ff, 0.2);
            // Draw slightly inside to prevent edge artifacts
            g.strokeRect(1, 1, 98, 98); 
            g.fillStyle(0x0044ff, 0.05);
            g.fillCircle(50, 50, 2);
        });

        this.scene.start('GameScene');
    }
}

// --- Game Scene ---
class GameScene extends Phaser.Scene {
    physics!: Phaser.Physics.Arcade.ArcadePhysics;
    add!: Phaser.GameObjects.GameObjectFactory;
    input!: Phaser.Input.InputPlugin;
    scale!: Phaser.Scale.ScaleManager;
    time!: Phaser.Time.Clock;
    cameras!: Phaser.Cameras.Scene2D.CameraManager;
    tweens!: Phaser.Tweens.TweenManager;

    player!: Phaser.Physics.Arcade.Sprite;
    bullets!: Phaser.Physics.Arcade.Group;
    enemies!: Phaser.Physics.Arcade.Group;
    drops!: Phaser.Physics.Arcade.Group;
    mouseSensor!: Phaser.Physics.Arcade.Image;
    emitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    repelEffect!: Phaser.GameObjects.Arc;
    bgTile!: Phaser.GameObjects.TileSprite;

    // State
    score = 0;
    gameTime = 0;
    startTime = 0;
    skillEnergy = 0;
    maxEnergy = 3;
    isGameOver = false;
    isPaused = false;
    godSkillReady = false;

    stats = {
        attackDelay: 200,
        lastFire: 0,
        damage: 15,
        bulletCount: 1,
        pierce: false,
        hasRepel: false,
        hp: 100,
        maxHp: 100,
        speed: 1
    };

    constructor() { super('GameScene'); }

    create() {
        this.score = 0;
        this.gameTime = 0;
        this.startTime = this.time.now;
        this.skillEnergy = 0;
        this.godSkillReady = false;
        this.isGameOver = false;
        this.isPaused = false;
        
        // Reset stats
        this.stats = {
            attackDelay: 250, lastFire: 0, damage: 15, 
            bulletCount: 1, pierce: false, hasRepel: false, 
            hp: 100, maxHp: 100, speed: 1
        };

        // Background
        this.createBackground();

        // Groups
        this.bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 300 });
        this.enemies = this.physics.add.group({ defaultKey: 'enemy', maxSize: 200 });
        this.drops = this.physics.add.group({ defaultKey: 'drop' });

        // Player
        this.player = this.physics.add.sprite(this.scale.width/2, this.scale.height/2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.body.setCircle(20, 12, 12);
        this.player.setDepth(10);
        
        // Engine glow effect - wrap in try/catch just in case of context loss
        try {
            this.player.postFX.addGlow(COLORS.player, 1, 0, false, 0.1, 10);
        } catch (e) { console.warn('FX not supported', e); }

        // Effects
        this.repelEffect = this.add.circle(0, 0, 150)
            .setStrokeStyle(4, 0x00ff88, 0.5)
            .setVisible(false)
            .setDepth(5);
        
        this.emitter = this.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 200 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 300,
            blendMode: 'ADD'
        });

        // Mouse Controller - Use physics.add.image ensuring texture key exists
        this.mouseSensor = this.physics.add.image(0, 0, 'particle') 
            .setVisible(false)
            .setCircle(60); // Pickup range
        
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if(this.isPaused) return;
            this.mouseSensor.setPosition(pointer.x, pointer.y);
            // Player follows mouse with drag
            this.physics.moveToObject(this.player, pointer, 450);
        });

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, undefined, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, undefined, this);
        this.physics.add.overlap(this.player, this.drops, this.collectDrop, undefined, this); 

        // Timers
        this.time.addEvent({ delay: 600, callback: this.spawnEnemy, callbackScope: this, loop: true });

        // Event Listeners
        gameEvents.on(EVENTS.RESUME_GAME, () => {
            this.resumeGame();
        }, this);
        
        gameEvents.on(EVENTS.APPLY_UPGRADE, this.applyUpgrade, this);

        this.emitUpdate();
    }

    createBackground() {
        // Deep space
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x020205, 0x020205, 0x0a0a1a, 0x0a0a1a, 1);
        // Ensure we fill at least a 1x1 rect
        bg.fillRect(0, 0, Math.max(1, this.scale.width), Math.max(1, this.scale.height));
        bg.setDepth(-2);

        // Moving Cyber Grid
        this.bgTile = this.add.tileSprite(this.scale.width/2, this.scale.height/2, this.scale.width, this.scale.height, 'grid_tile');
        this.bgTile.setAlpha(0.3);
        this.bgTile.setDepth(-1);
        
        // Stars
        for(let i=0; i<100; i++) {
            const x = Phaser.Math.Between(0, this.scale.width);
            const y = Phaser.Math.Between(0, this.scale.height);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.5);
            this.add.circle(x, y, size, 0xffffff, alpha);
        }
    }

    update(time: number, delta: number) {
        if (this.isPaused || this.isGameOver) return;

        this.gameTime = (time - this.startTime) / 1000;

        // Grid scrolling effect based on player movement
        if (this.player.body) {
            this.bgTile.tilePositionX += this.player.body.velocity.x * 0.001;
            this.bgTile.tilePositionY += this.player.body.velocity.y * 0.001;
            
            // Rotate player towards velocity if moving, else towards mouse
            if (this.player.body.velocity.length() > 10) {
                const targetRotation = this.player.body.velocity.angle() + Math.PI/2;
                this.player.rotation = Phaser.Math.Angle.RotateTo(this.player.rotation, targetRotation, 0.1);
            }

            // Player movement dampening (stop jitter at target)
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.input.activePointer.x, this.input.activePointer.y);
            if (dist < 15) {
                this.player.body.reset(this.player.x, this.player.y);
            }
        }

        // Auto Fire
        this.autoAimAndFire(time);

        // Repel Field
        if (this.stats.hasRepel) {
            this.repelEffect.setPosition(this.player.x, this.player.y).setVisible(true);
            this.repelEffect.setScale(1 + Math.sin(time/150)*0.1);
            this.repelEffect.setAlpha(0.3 + Math.sin(time/300)*0.2);
            
            this.enemies.getChildren().forEach((e: any) => {
                if (Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < 160) {
                    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, e.x, e.y);
                    e.setVelocity(Math.cos(angle) * 180, Math.sin(angle) * 180);
                }
            });
        }

        // God Skill Spawn (45s)
        if (!this.godSkillReady && this.gameTime > 45) {
            this.godSkillReady = true;
            this.spawnDrop(this.scale.width/2, 100, true);
            gameEvents.emit(EVENTS.SHOW_TOAST, "ANOMALY DETECTED: GOD ENERGY");
        }

        // Cleanup
        this.bullets.children.each((b: any) => {
            if (b.active && !Phaser.Geom.Rectangle.Overlaps(this.physics.world.bounds, b.getBounds())) {
                b.setActive(false).setVisible(false);
            }
            return true;
        });

        // Enemy tracking
        this.enemies.children.each((e: any) => {
            if (e.active) {
                this.physics.moveToObject(e, this.player, e.speed);
                e.rotation += 0.05; // Spin drones
            }
            return true;
        });

        // UI Sync
        this.emitUpdate();
    }

    emitUpdate() {
        gameEvents.emit(EVENTS.UPDATE_HUD, {
            score: Math.floor(this.score),
            hp: this.stats.hp,
            maxHp: this.stats.maxHp,
            energy: this.skillEnergy,
            maxEnergy: this.maxEnergy,
            time: this.gameTime
        });
    }

    spawnEnemy() {
        if (this.isGameOver || this.isPaused) return;
        const enemy = this.enemies.get();
        if (!enemy) return;

        const rect = new Phaser.Geom.Rectangle(-50, -50, this.scale.width + 100, this.scale.height + 100);
        const p = Phaser.Geom.Rectangle.Random(rect, new Phaser.Geom.Point());
        // Ensure outside screen
        if (p.x > 0 && p.x < this.scale.width && p.y > 0 && p.y < this.scale.height) p.x = -50;

        const difficulty = 1 + this.gameTime / 45; // Slower ramping
        enemy.enableBody(true, p.x, p.y, true, true);
        const scale = Phaser.Math.FloatBetween(0.8, 1.3);
        enemy.setScale(scale);
        enemy.hp = 25 * difficulty * scale;
        enemy.maxHp = enemy.hp;
        enemy.speed = Phaser.Math.Between(50, 100) + difficulty * 3;
        enemy.scoreVal = Math.floor(10 * difficulty);
        enemy.body.setCircle(24);
        enemy.clearTint();
    }

    autoAimAndFire(time: number) {
        if (time < this.stats.lastFire + this.stats.attackDelay) return;

        let closest: any = null;
        let minDist = 10000;
        this.enemies.children.each((e: any) => {
            if (e.active) {
                const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
                if (d < minDist) { minDist = d; closest = e; }
            }
            return true;
        });

        if (closest) {
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, closest.x, closest.y);
            
            const count = this.stats.bulletCount;
            const spread = 0.15;
            const startAngle = angle - (count - 1) * spread / 2;

            for (let i = 0; i < count; i++) {
                const bullet = this.bullets.get();
                if (bullet) {
                    bullet.enableBody(true, this.player.x, this.player.y, true, true);
                    const fireAngle = startAngle + i * spread;
                    this.physics.velocityFromRotation(fireAngle, 900, bullet.body.velocity);
                    bullet.setRotation(fireAngle + Math.PI / 2);
                    bullet.pierceList = [];
                    bullet.setScale(1);
                    
                    if(this.stats.pierce) {
                        bullet.setTint(0xffaa00);
                        bullet.postFX.clear();
                        try {
                           bullet.postFX.addGlow(0xff0000, 2, 0, false, 0.1, 10);
                        } catch(e) {}
                    } else {
                        bullet.clearTint();
                        bullet.postFX.clear();
                    }
                }
            }
            SoundSys.shoot();
            this.stats.lastFire = time;
        }
    }

    hitEnemy(bullet: any, enemy: any) {
        if (!bullet.active || !enemy.active) return;

        if (this.stats.pierce) {
            if (bullet.pierceList.includes(enemy)) return;
            bullet.pierceList.push(enemy);
        } else {
            bullet.setActive(false).setVisible(false);
            // Impact FX
            this.emitter.setPosition(bullet.x, bullet.y);
            this.emitter.explode(8);
        }

        enemy.hp -= this.stats.damage;
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => { if (enemy.active) enemy.clearTint(); });

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        } else {
            SoundSys.hit();
        }
    }

    killEnemy(enemy: any) {
        enemy.setActive(false).setVisible(false);
        SoundSys.explode();
        
        // Big explosion
        const p = this.add.particles(enemy.x, enemy.y, 'particle', {
            speed: { min: 100, max: 300 },
            lifespan: 500, 
            scale: { start: 1.5, end: 0 }, 
            quantity: 15, 
            tint: COLORS.enemy, 
            blendMode: 'ADD'
        });
        this.time.delayedCall(500, () => p.destroy());

        this.score += enemy.scoreVal;
        this.cameras.main.shake(50, 0.005);
        
        if (Math.random() < 0.15) this.spawnDrop(enemy.x, enemy.y, false);
    }

    hitPlayer(player: any, enemy: any) {
        if (!enemy.active) return;
        this.killEnemy(enemy);

        this.stats.hp -= 15;
        this.cameras.main.shake(200, 0.02);
        this.cameras.main.flash(200, 255, 0, 0);

        if (this.stats.hp <= 0) {
            this.stats.hp = 0;
            this.isGameOver = true;
            this.physics.pause();
            this.player.setTint(0x333333);
            this.player.postFX.clear(); // remove glow
            gameEvents.emit(EVENTS.GAME_OVER, Math.floor(this.score));
        }
    }

    spawnDrop(x: number, y: number, isGod: boolean) {
        const drop = this.drops.get();
        if (drop) {
            drop.enableBody(true, x, y, true, true);
            drop.isGod = isGod;
            drop.setTexture(isGod ? 'drop_god' : 'drop');
            drop.setScale(1);
            drop.setRotation(0);
            
            // Floating animation
            this.tweens.add({
                targets: drop,
                y: y - 10,
                angle: 45,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    collectDrop(player: any, drop: any) {
        if (!drop.active) return;
        drop.setActive(false).setVisible(false);
        
        if (drop.isGod) {
            this.triggerGodSkill();
        } else {
            SoundSys.collect();
            this.skillEnergy++;
            if (this.skillEnergy >= this.maxEnergy) {
                this.skillEnergy = 0;
                this.pauseForLevelUp();
            }
        }
    }

    triggerGodSkill() {
        SoundSys.god();
        this.cameras.main.flash(1000, 255, 255, 255);
        this.cameras.main.shake(2000, 0.02);

        // Screen wipe effect
        this.enemies.children.each((e: any) => {
            if (e.active) {
                const explosion = this.add.circle(e.x, e.y, 10, 0xffffff);
                this.tweens.add({
                    targets: explosion, scale: 8, alpha: 0, duration: 400, onComplete: () => explosion.destroy()
                });
                e.setActive(false).setVisible(false);
                this.score += e.scoreVal * 2;
            }
            return true;
        });
        gameEvents.emit(EVENTS.SHOW_TOAST, "SYSTEM OVERLOAD: OBLITERATION");
    }

    pauseForLevelUp() {
        this.isPaused = true;
        this.physics.pause();
        gameEvents.emit(EVENTS.LEVEL_UP);
    }

    resumeGame() {
        this.isPaused = false;
        this.physics.resume();
    }

    applyUpgrade(upgradeId: string) {
        // Wrap in try-catch to ensure modal closes even if audio/logic throws
        try {
            SoundSys.upgrade();
            switch(upgradeId) {
                case 'rapid': this.stats.attackDelay *= 0.7; break;
                case 'dmg': this.stats.damage *= 1.5; break;
                case 'multi': this.stats.bulletCount = Math.min(9, this.stats.bulletCount + 2); break;
                case 'pierce': this.stats.pierce = true; break;
                case 'repel': this.stats.hasRepel = true; break;
                case 'heal': this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 50); break;
            }
        } catch (e) {
            console.error("Upgrade error", e);
        } finally {
            // CRITICAL: Always resume so modal closes
            gameEvents.emit(EVENTS.RESUME_GAME);
        }
    }
}

// Config with safe defaults to prevent Incomplete Attachment errors
export const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: Math.max(320, window.innerWidth || 1024),
        height: Math.max(240, window.innerHeight || 768),
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    backgroundColor: '#020205',
    scene: [BootScene, GameScene]
};