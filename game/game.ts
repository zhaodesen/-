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
    god: 0xffd700,
    hpBarBg: 0x220000,
    hpBarFg: 0xff0044
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
            // Fix: Ensure safe dimensions to prevent Framebuffer Incomplete Attachment error
            const w = Math.floor(Math.max(4, width));
            const h = Math.floor(Math.max(4, height));
            
            try {
                const g = this.make.graphics({ x: 0, y: 0 }, false);
                drawFn(g);
                g.generateTexture(key, w, h);
                g.destroy();
            } catch (e) {
                console.warn(`Texture generation failed for ${key}:`, e);
            }
        };

        // Player
        makeTexture('player', 64, 64, (g) => {
            g.fillStyle(COLORS.playerEngine, 0.5);
            g.fillTriangle(20, 55, 44, 55, 32, 64);
            g.fillStyle(0x050510);
            g.lineStyle(2, COLORS.player);
            g.beginPath();
            g.moveTo(32, 0);
            g.lineTo(60, 40); 
            g.lineTo(60, 50); 
            g.lineTo(40, 45); 
            g.lineTo(40, 55); 
            g.lineTo(24, 55); 
            g.lineTo(24, 45);
            g.lineTo(4, 50); 
            g.lineTo(4, 40); 
            g.closePath();
            g.fillPath();
            g.strokePath();
            g.fillStyle(0xffffff, 0.9);
            g.fillEllipse(32, 25, 4, 8);
            g.lineStyle(1, COLORS.player, 0.5);
            g.lineBetween(32, 10, 32, 40);
            g.lineBetween(24, 45, 40, 45);
        });

        // Enemy
        makeTexture('enemy', 64, 64, (g) => {
            g.lineStyle(2, COLORS.enemy);
            g.fillStyle(0x200010);
            g.beginPath();
            g.arc(32, 32, 26, 0, Math.PI * 0.3);
            g.strokePath();
            g.beginPath();
            g.arc(32, 32, 26, Math.PI, Math.PI * 1.3);
            g.strokePath();
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
            g.fillStyle(COLORS.enemy);
            g.fillCircle(32, 32, 6);
            g.fillStyle(COLORS.enemyCore);
            g.fillCircle(32, 32, 3);
        });

        // Bullet
        makeTexture('bullet', 32, 32, (g) => {
            g.fillStyle(COLORS.bullet);
            g.fillRoundedRect(13, 4, 6, 24, 3);
            g.lineStyle(2, COLORS.bullet, 0.4);
            g.strokeRoundedRect(10, 0, 12, 32, 6);
        });

        // Missile / Rocket
        makeTexture('missile', 24, 48, (g) => {
            g.fillStyle(0xff4400);
            g.fillTriangle(12, 0, 24, 20, 0, 20);
            g.fillStyle(0x888888);
            g.fillRect(6, 20, 12, 20);
            g.fillStyle(0xffaa00);
            g.fillTriangle(6, 40, 18, 40, 12, 48);
        });

        // Blade (Orbital)
        makeTexture('blade', 48, 48, (g) => {
            g.lineStyle(2, 0x00ffff);
            g.fillStyle(0x00ffff, 0.3);
            g.beginPath();
            g.arc(24, 24, 20, 0, Math.PI * 0.5);
            g.arc(24, 24, 20, Math.PI, Math.PI * 1.5);
            g.strokePath();
            g.fillPath();
        });

        // Particle
        makeTexture('particle', 16, 16, (g) => {
            g.fillStyle(0xffffff);
            g.fillCircle(8, 8, 4);
        });

        // Drop
        makeTexture('drop', 32, 32, (g) => {
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
            g.fillStyle(COLORS.exp);
            g.fillCircle(16, 16, 4);
        });

        // God Drop
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

        // Grid
        makeTexture('grid_tile', 100, 100, (g) => {
            g.lineStyle(1, 0x0044ff, 0.2);
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
    missiles!: Phaser.Physics.Arcade.Group;
    orbitals!: Phaser.Physics.Arcade.Group;
    enemies!: Phaser.Physics.Arcade.Group;
    drops!: Phaser.Physics.Arcade.Group;
    emitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    repelEffect!: Phaser.GameObjects.Arc;
    bgTile!: Phaser.GameObjects.TileSprite;
    hpGraphics!: Phaser.GameObjects.Graphics;

    // State
    score = 0;
    gameTime = 0;
    startTime = 0;
    skillEnergy = 0;
    maxEnergy = 30; // Start higher to avoid instant spam
    isGameOver = false;
    isPaused = false;
    
    // Stats structure
    stats = {
        // Offensive
        attackDelay: 250, 
        lastFire: 0, 
        damage: 15, 
        bulletCount: 1, 
        bulletSpeed: 900,
        pierce: 0, 
        projectileSize: 1,
        critChance: 0.05, 
        critDmg: 1.5,
        
        // Defensive / Utility
        hp: 100, 
        maxHp: 100, 
        moveSpeed: 1, 
        regen: 0, 
        leech: 0, 
        dodge: 0, 
        armor: 0, 
        pickupRange: 150,

        // Tech / Specials
        hasRepel: false,
        homing: false,
        sideGuns: 0, 
        rearGuns: 0, 
        missileLauncher: 0, 
        orbitals: 0, 
        nova: 0, 
        deathBomb: false,
        freeze: false,
        chainLightning: 0, 
        execute: 0, 
        bounce: 0, 
        doubleShot: 0, 
        thorns: 0,
    };

    lastRegen = 0;
    lastNova = 0;

    constructor() { super('GameScene'); }

    create() {
        this.score = 0;
        this.gameTime = 0;
        this.startTime = this.time.now;
        this.skillEnergy = 0;
        this.maxEnergy = 30;
        this.isGameOver = false;
        this.isPaused = false;
        
        // Reset Stats
        this.stats = {
            attackDelay: 300, lastFire: 0, damage: 20, bulletCount: 1, bulletSpeed: 800,
            pierce: 0, projectileSize: 1, critChance: 0.05, critDmg: 1.5,
            hp: 100, maxHp: 100, moveSpeed: 1, regen: 0, leech: 0, dodge: 0, armor: 0, pickupRange: 150,
            hasRepel: false, homing: false, sideGuns: 0, rearGuns: 0, missileLauncher: 0, 
            orbitals: 0, nova: 0, deathBomb: false, freeze: false, chainLightning: 0, execute: 0,
            bounce: 0, doubleShot: 0, thorns: 0
        };

        // Background
        this.createBackground();

        // Groups
        this.bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 300 });
        this.missiles = this.physics.add.group({ defaultKey: 'missile', maxSize: 50 });
        this.enemies = this.physics.add.group({ defaultKey: 'enemy', maxSize: 200 });
        this.drops = this.physics.add.group({ defaultKey: 'drop' });
        this.orbitals = this.physics.add.group({ defaultKey: 'blade' });

        // Player
        this.player = this.physics.add.sprite(this.scale.width/2, this.scale.height/2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.body.setCircle(20, 12, 12);
        this.player.setDepth(10);
        
        try {
            this.player.postFX.addGlow(COLORS.player, 1, 0, false, 0.1, 10);
        } catch (e) {}

        // Effects
        this.repelEffect = this.add.circle(0, 0, 150).setStrokeStyle(4, 0x00ff88, 0.5).setVisible(false).setDepth(5);
        this.emitter = this.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 200 }, scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 }, lifespan: 300, blendMode: 'ADD'
        });
        this.hpGraphics = this.add.graphics().setDepth(8);

        // Inputs
        this.input.addPointer(2); // Support multi-touch
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if(this.isPaused) return;
            this.physics.moveToObject(this.player, pointer, 450 * this.stats.moveSpeed);
        });

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, undefined, this);
        this.physics.add.overlap(this.missiles, this.enemies, this.hitEnemyMissile, undefined, this);
        this.physics.add.overlap(this.orbitals, this.enemies, this.hitEnemyOrbital, undefined, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, undefined, this);
        this.physics.add.overlap(this.player, this.drops, this.collectDrop, undefined, this); 

        // Timers
        this.time.addEvent({ delay: 600, callback: this.spawnEnemy, callbackScope: this, loop: true });

        gameEvents.on(EVENTS.RESUME_GAME, () => this.resumeGame(), this);
        gameEvents.on(EVENTS.APPLY_UPGRADE, this.applyUpgrade, this);

        this.emitUpdate();
    }

    createBackground() {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x020205, 0x020205, 0x0a0a1a, 0x0a0a1a, 1);
        bg.fillRect(0, 0, Math.max(1, this.scale.width), Math.max(1, this.scale.height));
        bg.setDepth(-2);

        this.bgTile = this.add.tileSprite(this.scale.width/2, this.scale.height/2, this.scale.width, this.scale.height, 'grid_tile');
        this.bgTile.setAlpha(0.3);
        this.bgTile.setDepth(-1);
    }

    update(time: number, delta: number) {
        if (this.isPaused || this.isGameOver) return;

        this.gameTime = (time - this.startTime) / 1000;

        // Mobile/Mouse Movement Deadzone to prevent jitter
        const distToInput = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.input.activePointer.x, this.input.activePointer.y);
        // Increase deadzone for mobile comfort
        if (distToInput < 30) {
            this.player.setVelocity(0);
        }

        // BG Scroll
        if (this.player.body) {
            this.bgTile.tilePositionX += this.player.body.velocity.x * 0.001;
            this.bgTile.tilePositionY += this.player.body.velocity.y * 0.001;
            
            if (this.player.body.velocity.length() > 10) {
                const targetRotation = this.player.body.velocity.angle() + Math.PI/2;
                this.player.rotation = Phaser.Math.Angle.RotateTo(this.player.rotation, targetRotation, 0.1);
            }
        }

        // Auto Fire
        this.autoAimAndFire(time);

        // Auto Collect Drops
        this.drops.children.each((drop: any) => {
            if (drop.active) {
                const d = Phaser.Math.Distance.Between(drop.x, drop.y, this.player.x, this.player.y);
                if (d < this.stats.pickupRange) {
                    this.physics.moveToObject(drop, this.player, 800);
                }
            }
            return true;
        });

        // Regen
        if (this.stats.regen > 0 && time > this.lastRegen + 1000) {
            if (this.stats.hp < this.stats.maxHp) {
                this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + this.stats.regen);
            }
            this.lastRegen = time;
        }

        // Nova
        if (this.stats.nova > 0 && time > this.lastNova + 3000) {
            this.triggerNova();
            this.lastNova = time;
        }

        // Orbitals Logic
        this.updateOrbitals(time);

        // Homing Bullets & Missiles
        this.updateProjectiles(time);

        // Repel Field
        if (this.stats.hasRepel) {
            this.repelEffect.setPosition(this.player.x, this.player.y).setVisible(true);
            this.repelEffect.setScale(1 + Math.sin(time/150)*0.1);
            this.repelEffect.setAlpha(0.3 + Math.sin(time/300)*0.2);
            
            this.enemies.getChildren().forEach((e: any) => {
                if (Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < 160) {
                    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, e.x, e.y);
                    e.setVelocity(Math.cos(angle) * 180, Math.sin(angle) * 180);
                    if (this.stats.thorns > 0 && time % 20 < 1) {
                        this.damageEnemy(e, this.stats.thorns, false);
                    }
                }
            });
        }

        // Draw Health Bars
        this.drawHealthBars();

        // Cleanup
        this.cleanupObjects();

        this.emitUpdate();
    }

    drawHealthBars() {
        this.hpGraphics.clear();
        this.enemies.children.each((e: any) => {
            // Only draw if damaged to reduce clutter
            if (e.active && e.hp < e.maxHp && e.hp > 0) {
                const pct = Math.max(0, e.hp / e.maxHp);
                const w = 40;
                const h = 3;
                const x = e.x - w/2;
                const y = e.y - e.height/2 - 12;
                
                // Background
                this.hpGraphics.fillStyle(COLORS.hpBarBg, 0.8);
                this.hpGraphics.fillRect(x, y, w, h);
                // Foreground
                this.hpGraphics.fillStyle(COLORS.hpBarFg, 0.9);
                this.hpGraphics.fillRect(x, y, w * pct, h);
            }
            return true;
        });
    }

    updateOrbitals(time: number) {
        const count = this.stats.orbitals;
        if (count <= 0) return;
        
        while (this.orbitals.getLength() < count) {
            const b = this.orbitals.get(this.player.x, this.player.y, 'blade');
            if(b) {
                b.enableBody(true, this.player.x, this.player.y, true, true);
                b.setCircle(24);
            }
        }

        const speed = time * 0.003;
        const radius = 100;
        let idx = 0;
        this.orbitals.children.each((b: any) => {
            if (idx < count) {
                b.setActive(true).setVisible(true);
                const angle = speed + (idx * (Math.PI * 2) / count);
                b.x = this.player.x + Math.cos(angle) * radius;
                b.y = this.player.y + Math.sin(angle) * radius;
                b.rotation += 0.2;
                idx++;
            } else {
                b.setActive(false).setVisible(false);
            }
            return true;
        });
    }

    updateProjectiles(time: number) {
         if (this.stats.homing) {
            this.bullets.children.each((b: any) => {
                if (b.active) {
                    const closest = this.physics.closest(b, this.enemies.getChildren()) as any;
                    if (closest) {
                        const angle = Phaser.Math.Angle.Between(b.x, b.y, closest.x, closest.y);
                        const curAngle = b.body.velocity.angle();
                        const newAngle = Phaser.Math.Angle.RotateTo(curAngle, angle, 0.08); // Snappier homing
                        this.physics.velocityFromRotation(newAngle, this.stats.bulletSpeed, b.body.velocity);
                        b.rotation = newAngle + Math.PI/2;
                    }
                }
                return true;
            });
        }

        this.missiles.children.each((m: any) => {
            if (m.active) {
                const closest = this.physics.closest(m, this.enemies.getChildren()) as any;
                if (closest) {
                    const angle = Phaser.Math.Angle.Between(m.x, m.y, closest.x, closest.y);
                    const curAngle = m.body.velocity.angle();
                    const newAngle = Phaser.Math.Angle.RotateTo(curAngle, angle, 0.04);
                    this.physics.velocityFromRotation(newAngle, 500, m.body.velocity); 
                    m.rotation = newAngle + Math.PI/2;
                }
                m.body.velocity.scale(1.02);
            }
            return true;
        });
    }

    triggerNova() {
        const range = 150 + (this.stats.nova * 20);
        const nova = this.add.circle(this.player.x, this.player.y, 10, 0x00ffff, 0.5);
        this.tweens.add({
            targets: nova,
            scale: range / 5, 
            alpha: 0,
            duration: 300,
            onComplete: () => nova.destroy()
        });
        
        this.enemies.children.each((e: any) => {
            if (e.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) < range) {
                this.damageEnemy(e, this.stats.damage * (0.5 + this.stats.nova * 0.2), false);
                e.speed = 10; 
            }
            return true;
        });
    }

    cleanupObjects() {
        this.bullets.children.each((b: any) => {
            if (b.active && !Phaser.Geom.Rectangle.Overlaps(this.physics.world.bounds, b.getBounds())) {
                b.setActive(false).setVisible(false);
            }
            return true;
        });
        this.missiles.children.each((m: any) => {
            if (m.active && !Phaser.Geom.Rectangle.Overlaps(this.physics.world.bounds, m.getBounds())) {
                m.setActive(false).setVisible(false);
            }
            return true;
        });
        this.enemies.children.each((e: any) => {
            if (e.active) {
                this.physics.moveToObject(e, this.player, e.speed);
                e.rotation += 0.05;
            }
            return true;
        });
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
        // Ensure it spawns outside
        if (p.x > 0 && p.x < this.scale.width && p.y > 0 && p.y < this.scale.height) {
            if (Math.random() > 0.5) p.x = -50; else p.y = -50;
        }

        const difficulty = 1 + this.gameTime / 45;
        enemy.enableBody(true, p.x, p.y, true, true);
        const scale = Phaser.Math.FloatBetween(0.8, 1.3);
        enemy.setScale(scale);
        enemy.hp = 30 * difficulty * scale;
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
            this.fireBulletGroup(angle);

            if (Math.random() < this.stats.doubleShot) {
                this.time.delayedCall(100, () => {
                    if (!this.isGameOver && !this.isPaused) this.fireBulletGroup(angle);
                });
            }

            if (this.stats.missileLauncher > 0 && Math.random() < (0.1 + this.stats.missileLauncher * 0.1)) {
                 this.fireMissile();
            }

            if (this.stats.sideGuns > 0) {
                const dmg = 0.5 + (this.stats.sideGuns * 0.1);
                this.fireBullet(angle + Math.PI/2, dmg); 
                this.fireBullet(angle - Math.PI/2, dmg);
            }

            if (this.stats.rearGuns > 0) {
                 const dmg = 0.5 + (this.stats.rearGuns * 0.1);
                this.fireBullet(angle + Math.PI, dmg);
            }

            SoundSys.shoot();
            this.stats.lastFire = time;
        }
    }

    fireBulletGroup(baseAngle: number) {
        const count = this.stats.bulletCount;
        const spread = 0.15;
        const startAngle = baseAngle - (count - 1) * spread / 2;

        for (let i = 0; i < count; i++) {
            this.fireBullet(startAngle + i * spread, 1.0);
        }
    }

    fireBullet(angle: number, damageMult: number) {
        const bullet = this.bullets.get();
        if (!bullet) return;
        bullet.enableBody(true, this.player.x, this.player.y, true, true);
        this.physics.velocityFromRotation(angle, this.stats.bulletSpeed, bullet.body.velocity);
        bullet.setRotation(angle + Math.PI / 2);
        bullet.pierceCount = this.stats.pierce;
        bullet.pierceList = [];
        bullet.bounceCount = this.stats.bounce;
        bullet.setScale(this.stats.projectileSize);
        bullet.damageMult = damageMult; 
        
        if(this.stats.pierce > 0) {
            bullet.setTint(0xffaa00);
        } else {
            bullet.clearTint();
        }
    }

    fireMissile() {
        const missile = this.missiles.get();
        if(!missile) return;
        missile.enableBody(true, this.player.x, this.player.y, true, true);
        const angle = Phaser.Math.FloatBetween(0, Math.PI*2);
        this.physics.velocityFromRotation(angle, 200, missile.body.velocity);
        missile.setRotation(angle + Math.PI/2);
        SoundSys.play(200, 'sawtooth', 0.3);
    }

    hitEnemyMissile(missile: any, enemy: any) {
        if(!missile.active || !enemy.active) return;
        missile.setActive(false).setVisible(false);
        
        const boom = this.add.circle(missile.x, missile.y, 60, 0xff4400, 0.7);
        this.tweens.add({ targets: boom, alpha: 0, scale: 2, duration: 200, onComplete: () => boom.destroy() });
        SoundSys.explode();

        this.enemies.children.each((e: any) => {
            if (e.active && Phaser.Math.Distance.Between(missile.x, missile.y, e.x, e.y) < 80) {
                this.damageEnemy(e, this.stats.damage * 2, false);
            }
            return true;
        });
    }

    hitEnemyOrbital(orbital: any, enemy: any) {
        if (!enemy.active) return;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        enemy.x += Math.cos(angle) * 5;
        enemy.y += Math.sin(angle) * 5;
        this.damageEnemy(enemy, this.stats.damage * 0.3, false);
    }

    hitEnemy(bullet: any, enemy: any) {
        if (!bullet.active || !enemy.active) return;

        if (bullet.pierceCount > 0) {
            if (bullet.pierceList.includes(enemy)) return;
            bullet.pierceList.push(enemy);
            bullet.pierceCount--;
        } else if (bullet.bounceCount > 0) {
            const closest = this.physics.closest(enemy, this.enemies.getChildren().filter(e => e !== enemy)) as any;
            if (closest) {
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, closest.x, closest.y);
                this.physics.velocityFromRotation(angle, this.stats.bulletSpeed, bullet.body.velocity);
                bullet.rotation = angle + Math.PI/2;
                bullet.bounceCount--;
                bullet.pierceList = [enemy]; 
            } else {
                bullet.setActive(false).setVisible(false);
            }
        } else {
            bullet.setActive(false).setVisible(false);
            this.emitter.setPosition(bullet.x, bullet.y);
            this.emitter.explode(8);
        }

        let dmg = this.stats.damage * (bullet.damageMult || 1);
        let isCrit = false;
        if (Math.random() < this.stats.critChance) {
            dmg *= this.stats.critDmg;
            isCrit = true;
        }

        if (this.stats.execute > 0 && enemy.hp < enemy.maxHp * this.stats.execute) {
            dmg *= 3;
            isCrit = true;
            gameEvents.emit(EVENTS.SHOW_TOAST, "斩杀!");
        }

        this.damageEnemy(enemy, dmg, isCrit);

        if (this.stats.chainLightning > 0 && Math.random() < this.stats.chainLightning) {
             this.triggerChainLightning(enemy, 3);
        }
    }

    triggerChainLightning(target: any, jumps: number) {
        if (jumps <= 0) return;
        const closest = this.physics.closest(target, this.enemies.getChildren().filter(e => e !== target && e.active)) as any;
        if (closest && Phaser.Math.Distance.Between(target.x, target.y, closest.x, closest.y) < 200) {
            const graphics = this.add.graphics();
            graphics.lineStyle(2, 0x00ffff);
            graphics.lineBetween(target.x, target.y, closest.x, closest.y);
            this.tweens.add({ targets: graphics, alpha: 0, duration: 150, onComplete: () => graphics.destroy() });
            
            this.damageEnemy(closest, this.stats.damage * 0.5, false);
            this.triggerChainLightning(closest, jumps - 1);
        }
    }

    damageEnemy(enemy: any, dmg: number, isCrit: boolean) {
        enemy.hp -= dmg;
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => { if (enemy.active) enemy.clearTint(); });
        
        if (this.stats.freeze) {
            enemy.speed *= 0.85; 
        }

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        } else {
            SoundSys.hit();
        }
    }

    killEnemy(enemy: any) {
        enemy.setActive(false).setVisible(false);
        SoundSys.explode();
        
        if (this.stats.deathBomb) {
            const boom = this.add.circle(enemy.x, enemy.y, 60, 0xffaa00, 0.6);
            this.tweens.add({ targets: boom, alpha: 0, scale: 1.5, duration: 200, onComplete: () => boom.destroy() });
            this.enemies.children.each((e: any) => {
                if(e.active && Phaser.Math.Distance.Between(e.x, e.y, enemy.x, enemy.y) < 80) {
                    this.damageEnemy(e, this.stats.damage, false);
                }
                return true;
            });
        }

        if (this.stats.leech > 0 && Math.random() < this.stats.leech) {
             this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 1);
        }

        const p = this.add.particles(enemy.x, enemy.y, 'particle', {
            speed: { min: 100, max: 300 }, lifespan: 500, scale: { start: 1.5, end: 0 }, quantity: 15, tint: COLORS.enemy, blendMode: 'ADD'
        });
        this.time.delayedCall(500, () => p.destroy());

        this.score += enemy.scoreVal;
        
        // Increased Drop Rate to 25% (from 5%)
        if (Math.random() < 0.25) this.spawnDrop(enemy.x, enemy.y, false);
    }

    hitPlayer(player: any, enemy: any) {
        if (!enemy.active) return;
        
        if (Math.random() < this.stats.dodge) {
            this.tweens.add({ targets: player, alpha: 0.2, duration: 100, yoyo: true, repeat: 1 });
            return;
        }

        this.killEnemy(enemy);

        let incomingDmg = Math.max(10, 30 - this.stats.armor);
        this.stats.hp -= incomingDmg;
        
        this.cameras.main.shake(200, 0.02);
        this.cameras.main.flash(200, 255, 0, 0);

        if (this.stats.hp <= 0) {
            this.stats.hp = 0;
            this.isGameOver = true;
            this.physics.pause();
            this.player.setTint(0x333333);
            this.player.postFX.clear(); 
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
            
            this.tweens.add({
                targets: drop, y: y - 10, angle: 45, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
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
            // Adjusted Energy Gain
            this.skillEnergy += 10; 
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
        this.enemies.children.each((e: any) => {
            if (e.active) {
                const explosion = this.add.circle(e.x, e.y, 10, 0xffffff);
                this.tweens.add({ targets: explosion, scale: 8, alpha: 0, duration: 400, onComplete: () => explosion.destroy() });
                e.setActive(false).setVisible(false);
                this.score += e.scoreVal * 2;
            }
            return true;
        });
        gameEvents.emit(EVENTS.SHOW_TOAST, "系统过载：毁灭打击");
    }

    pauseForLevelUp() {
        this.isPaused = true;
        this.physics.pause();
        // Slight increase in max energy to curve progression
        this.maxEnergy += 5;
        gameEvents.emit(EVENTS.LEVEL_UP);
    }

    resumeGame() {
        this.isPaused = false;
        this.physics.resume();
    }

    // --- Massive Upgrade Handler ---
    applyUpgrade(upgradeId: string) {
        try {
            SoundSys.upgrade();
            
            // Safe logic to prevent crashes
            if (!upgradeId) return;

            // Dynamic Stats Parsing (e.g. dmg_1, dmg_2)
            if (upgradeId.startsWith('dmg_')) this.stats.damage += 5 * parseInt(upgradeId.split('_')[1]);
            else if (upgradeId.startsWith('spd_')) this.stats.attackDelay = Math.max(50, this.stats.attackDelay * (1 - (0.05 * parseInt(upgradeId.split('_')[1]))));
            else if (upgradeId.startsWith('mov_')) this.stats.moveSpeed += 0.1 * parseInt(upgradeId.split('_')[1]);
            else if (upgradeId.startsWith('hp_')) {
                const amt = 30 * parseInt(upgradeId.split('_')[1]);
                this.stats.maxHp += amt;
                this.stats.hp += amt;
            }
            else if (upgradeId.startsWith('crit_')) this.stats.critChance += 0.05 * parseInt(upgradeId.split('_')[1]);
            else if (upgradeId.startsWith('arm_')) this.stats.armor += 2 * parseInt(upgradeId.split('_')[1]);
            else if (upgradeId.startsWith('reg_')) this.stats.regen += 1 * parseInt(upgradeId.split('_')[1]);

            // Mechanics
            switch(upgradeId) {
                case 'w_multi': this.stats.bulletCount++; break;
                case 'w_multi_2': this.stats.bulletCount += 2; break;
                case 'w_side': this.stats.sideGuns++; break;
                case 'w_rear': this.stats.rearGuns++; break;
                case 'w_missile': this.stats.missileLauncher++; break;
                case 'w_orbit': this.stats.orbitals++; break;
                case 'u_heal': this.stats.hp = this.stats.maxHp; break;
                case 'u_magnet': this.stats.pickupRange += 100; break;
                case 'e_pierce': this.stats.pierce++; break;
                case 'e_bounce': this.stats.bounce++; break;
                case 'e_size': this.stats.projectileSize += 0.25; break;
                case 'e_freeze': this.stats.freeze = true; break;
                case 'e_shock': this.stats.chainLightning += 0.2; break;
                case 'e_nova': this.stats.nova++; break;
                case 'e_repel': this.stats.hasRepel = true; break;
                case 'e_bomb': this.stats.deathBomb = true; break;
                case 'e_homing': this.stats.homing = true; break;
                case 'e_thorns': this.stats.thorns += 5; this.stats.hasRepel = true; break;
                case 'e_exec': this.stats.execute += 0.15; break;
                case 'e_dodge': this.stats.dodge += 0.1; break;
                case 'e_leech': this.stats.leech += 0.1; break;
                
                // Cursed
                case 'c_glass': 
                    this.stats.damage *= 2; 
                    this.stats.maxHp = Math.floor(this.stats.maxHp * 0.5); 
                    this.stats.hp = Math.min(this.stats.hp, this.stats.maxHp);
                    break;
                case 'c_wild':
                    this.stats.bulletCount += 3;
                    this.stats.attackDelay *= 0.5;
                    this.stats.critChance = 0;
                    break;
                case 'c_heavy':
                    this.stats.damage *= 1.5;
                    this.stats.moveSpeed *= 0.7;
                    break;
                case 'c_blood':
                    this.stats.leech += 0.3;
                    this.stats.regen -= 5;
                    break;
            }

        } catch (e) {
            console.error("Upgrade error", e);
        } finally {
            gameEvents.emit(EVENTS.RESUME_GAME);
        }
    }
}

export const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: Math.max(320, window.innerWidth || 1024),
        height: Math.max(240, window.innerHeight || 768),
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: { default: 'arcade', arcade: { debug: false } },
    backgroundColor: '#020205',
    scene: [BootScene, GameScene]
};