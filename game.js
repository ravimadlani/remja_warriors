// Game Engine Class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Game state
        this.state = 'loading'; // loading, menu, playing, paused, gameover, levelcomplete
        this.currentLevel = 1;
        this.score = 0;
        this.health = 3;
        this.levelDistance = 0;
        this.levelGoal = 42000; // Distance to complete each level (at least 1 minute per level)

        // Survival time and speed scaling
        this.survivalTime = 0;
        this.speedMultiplier = 1;
        this.lastSpeedIncreaseTime = 0;

        // Time management
        this.lastTime = 0;
        this.deltaTime = 0;

        // Game objects
        this.ninja = null;
        this.obstacles = [];
        this.enemies = [];
        this.items = [];
        this.projectiles = [];
        this.effects = [];
        this.background = null;

        // Level configuration
        this.levelConfig = {
            1: { speed: 300, spawnRate: 2000, enemySpeed: 150, bgImage: 'level1.png' },
            2: { speed: 350, spawnRate: 1800, enemySpeed: 175, bgImage: 'level2.png' },
            3: { speed: 400, spawnRate: 1600, enemySpeed: 200, bgImage: 'level3.png' },
            4: { speed: 450, spawnRate: 1400, enemySpeed: 225, bgImage: 'level4.png' },
            5: { speed: 500, spawnRate: 1200, enemySpeed: 250, bgImage: 'level5.png' },
            6: { speed: 550, spawnRate: 1000, enemySpeed: 275, bgImage: 'level6.png' },
            7: { speed: 600, spawnRate: 800, enemySpeed: 300, bgImage: 'level7.png' },
            8: { speed: 650, spawnRate: 700, enemySpeed: 325, bgImage: 'level8.png' },
            9: { speed: 700, spawnRate: 600, enemySpeed: 350, bgImage: 'level9.png' }
        };

        // Spawn timers
        this.lastObstacleSpawn = 0;
        this.lastEnemySpawn = 0;
        this.lastItemSpawn = 0;

        // Assets
        this.assets = {
            backgrounds: {},
            characters: {},
            obstacles: {},
            items: {},
            effects: {}
        };

        // Debug settings
        this.debug = {
            showHitboxes: false,       // Show collision boxes for all objects
            showObstacleHitboxes: false, // Show hitboxes for obstacles specifically
            showPlayerHitbox: false,   // Show hitbox for player
            showEnemyHitboxes: false   // Show hitboxes for enemies
        };

        // Initialize
        this.init();
    }

    resizeCanvas() {
        const maxWidth = 1024;
        const maxHeight = 576;
        const aspectRatio = 16 / 9;

        let width = window.innerWidth;
        let height = window.innerHeight;

        if (width / height > aspectRatio) {
            width = height * aspectRatio;
        } else {
            height = width / aspectRatio;
        }

        width = Math.min(width, maxWidth);
        height = Math.min(height, maxHeight);

        this.canvas.width = width;
        this.canvas.height = height;

        this.groundY = this.canvas.height * 0.75;
    }

    async init() {
        await this.loadAssets();
        this.setupEventListeners();
        this.ninja = new Ninja(this);
        this.background = new Background(this);
        this.showStartScreen();
        this.gameLoop();
    }

    async loadAssets() {
        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.warn(`Failed to load: ${src}`);
                    resolve(null);
                };
                img.src = src;
            });
        };

        // Load individual sprite frames
        const characterFrames = {
            run: ['Run__000', 'Run__001', 'Run__002', 'Run__003', 'Run__004', 'Run__005', 'Run__006', 'Run__007', 'Run__008', 'Run__009'],
            jump: ['Jump__000', 'Jump__001', 'Jump__002', 'Jump__003', 'Jump__004', 'Jump__005', 'Jump__006', 'Jump__007', 'Jump__008', 'Jump__009'],
            slide: ['Slide__000', 'Slide__001', 'Slide__002', 'Slide__003', 'Slide__004', 'Slide__005', 'Slide__006', 'Slide__007', 'Slide__008', 'Slide__009'],
            idle: ['Idle__000', 'Idle__001', 'Idle__002', 'Idle__003', 'Idle__004', 'Idle__005', 'Idle__006', 'Idle__007', 'Idle__008', 'Idle__009']
        };

        // Load enemy sprite frames
        const enemyFrames = {
            run: ['Run__000', 'Run__001', 'Run__002', 'Run__003', 'Run__004', 'Run__005', 'Run__006', 'Run__007', 'Run__008', 'Run__009']
        };

        const assetList = {
            backgrounds: ['level1', 'level2', 'level3', 'level4', 'level5', 'level6', 'level7', 'level8', 'level9'],
            obstacles: ['spikes', 'branch', 'enemy', 'fire', 'rock', 'wall'],
            items: ['scroll', 'coin'],
            effects: ['dust_jump', 'dust_slide']
        };

        // Calculate total assets to load
        let totalCharacterFrames = 0;
        for (const frames of Object.values(characterFrames)) {
            totalCharacterFrames += frames.length;
        }
        for (const frames of Object.values(enemyFrames)) {
            totalCharacterFrames += frames.length;
        }

        let loaded = 0;
        const total = Object.values(assetList).flat().length + totalCharacterFrames;

        // Load character animations
        this.assets.characters = {};
        for (const [animation, frames] of Object.entries(characterFrames)) {
            this.assets.characters[animation] = [];
            for (const frame of frames) {
                const path = `assets/characters/${frame}.png`;
                const img = await loadImage(path);
                if (img) {
                    this.assets.characters[animation].push(img);
                }
                loaded++;
                this.updateLoadingProgress(Math.floor((loaded / total) * 100));
            }
        }

        // Load enemy animations
        this.assets.enemies = {};
        for (const [animation, frames] of Object.entries(enemyFrames)) {
            this.assets.enemies[animation] = [];
            for (const frame of frames) {
                const path = `assets/characters/enemy/${frame}.png`;
                const img = await loadImage(path);
                if (img) {
                    this.assets.enemies[animation].push(img);
                }
                loaded++;
                this.updateLoadingProgress(Math.floor((loaded / total) * 100));
            }
        }

        // Load other assets
        for (const [category, files] of Object.entries(assetList)) {
            for (const file of files) {
                const path = `assets/${category}/${file}.png`;
                this.assets[category][file] = await loadImage(path);
                loaded++;
                this.updateLoadingProgress(Math.floor((loaded / total) * 100));
            }
        }

        document.getElementById('loadingScreen').style.display = 'none';
    }

    updateLoadingProgress(percent) {
        document.getElementById('loadingProgress').textContent = `${percent}%`;
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.state !== 'playing') return;

            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.ninja.jump();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.ninja.startSlide();
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    this.ninja.attack();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.state !== 'playing') return;

            if (e.key === 'ArrowDown') {
                this.ninja.endSlide();
            }
        });

        // Touch/Swipe controls for mobile
        let touchStartY = 0;
        let touchStartX = 0;
        let touchStartTime = 0;
        let isSliding = false;
        let gestureTriggered = false;
        const touchHint = document.getElementById('touchHint');

        const showTouchHint = (text) => {
            touchHint.textContent = text;
            touchHint.classList.add('show');
            setTimeout(() => touchHint.classList.remove('show'), 300);
        };

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            touchStartTime = Date.now();
            gestureTriggered = false;
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.state !== 'playing' || gestureTriggered) return;

            const touchCurrentY = e.touches[0].clientY;
            const touchCurrentX = e.touches[0].clientX;
            const deltaY = touchStartY - touchCurrentY;
            const deltaX = Math.abs(touchStartX - touchCurrentX);

            const swipeThreshold = 30;

            // Check if it's a vertical swipe
            if (Math.abs(deltaY) > swipeThreshold && Math.abs(deltaY) > deltaX) {
                gestureTriggered = true;
                if (deltaY > 0) {
                    // Swipe up - Jump
                    this.ninja.jump();
                    showTouchHint('JUMP');
                } else {
                    // Swipe down - Start sliding (hold until release)
                    this.ninja.startSlide();
                    isSliding = true;
                    showTouchHint('SLIDE');
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();

            // End slide when finger releases
            if (isSliding) {
                this.ninja.endSlide();
                isSliding = false;
                return;
            }

            if (this.state !== 'playing') return;

            const touchEndY = e.changedTouches[0].clientY;
            const touchEndX = e.changedTouches[0].clientX;
            const touchDuration = Date.now() - touchStartTime;
            const deltaY = Math.abs(touchStartY - touchEndY);
            const deltaX = Math.abs(touchStartX - touchEndX);

            const tapThreshold = 15;

            // If no gesture was triggered and it's a tap - Attack
            if (!gestureTriggered && deltaY < tapThreshold && deltaX < tapThreshold && touchDuration < 300) {
                this.ninja.attack();
                showTouchHint('ATTACK');
            }
        }, { passive: false });

        // Menu buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
    }

    showStartScreen() {
        this.state = 'menu';
        document.getElementById('startScreen').style.display = 'block';
    }

    startGame() {
        this.state = 'playing';
        this.currentLevel = 1;
        this.score = 0;
        this.health = 3;
        this.levelDistance = 0;
        this.survivalTime = 0;
        this.speedMultiplier = 1;
        this.lastSpeedIncreaseTime = 0;
        this.loadLevel(this.currentLevel);
        document.getElementById('startScreen').style.display = 'none';
        this.updateUI();
    }

    pauseGame() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pauseScreen').style.display = 'block';
        }
    }

    resumeGame() {
        this.state = 'playing';
        document.getElementById('pauseScreen').style.display = 'none';
    }

    restartGame() {
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('pauseScreen').style.display = 'none';
        this.obstacles = [];
        this.enemies = [];
        this.items = [];
        this.projectiles = [];
        this.effects = [];
        this.startGame();
    }

    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel > 9) {
            this.winGame();
        } else {
            // Clear all game objects for a fresh start
            this.obstacles = [];
            this.enemies = [];
            this.items = [];
            this.projectiles = [];
            this.effects = [];

            this.levelDistance = 0;
            this.loadLevel(this.currentLevel);
            document.getElementById('levelCompleteScreen').style.display = 'none';
            this.state = 'playing';
        }
    }

    loadLevel(level) {
        const config = this.levelConfig[level];
        this.background.setImage(this.assets.backgrounds[config.bgImage.replace('.png', '')]);
        this.ninja.reset();
        this.updateUI();
    }

    gameLoop(currentTime = 0) {
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (this.deltaTime > 0.1) this.deltaTime = 0.016;

        if (this.state === 'playing') {
            this.update(this.deltaTime);
            this.render();
        } else if (this.state === 'menu' || this.state === 'paused') {
            this.render();
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(dt) {
        // Update survival time and score
        this.survivalTime += dt;
        this.score = Math.floor(this.survivalTime);

        // Speed up by 10% and increase level every 30 seconds
        if (this.survivalTime - this.lastSpeedIncreaseTime >= 30) {
            this.speedMultiplier *= 1.1;
            this.lastSpeedIncreaseTime = this.survivalTime;
            this.currentLevel = Math.min(this.currentLevel + 1, 9);
            this.updateUI();
        }

        // Update level distance with speed multiplier
        const config = this.levelConfig[this.currentLevel];
        const currentSpeed = config.speed * this.speedMultiplier;
        this.levelDistance += currentSpeed * dt;

        // Check level completion
        if (this.levelDistance >= this.levelGoal) {
            this.levelComplete();
            return;
        }

        // Spawn objects
        this.spawnObjects();

        // Update game objects
        this.background.update(dt, currentSpeed);
        this.ninja.update(dt);

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].update(dt, currentSpeed);
            if (this.obstacles[i].x < -100) {
                this.obstacles.splice(i, 1);
            } else if (this.checkCollision(this.ninja, this.obstacles[i])) {
                this.takeDamage();
                this.obstacles.splice(i, 1);
            }
        }

        // Update enemies
        const currentEnemySpeed = config.enemySpeed * this.speedMultiplier;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update(dt, currentEnemySpeed);
            if (this.enemies[i].x < -100) {
                this.enemies.splice(i, 1);
            } else if (this.checkCollision(this.ninja, this.enemies[i])) {
                this.takeDamage();
                this.enemies.splice(i, 1);
            }
        }

        // Update items
        for (let i = this.items.length - 1; i >= 0; i--) {
            this.items[i].update(dt, currentSpeed);
            if (this.items[i].x < -50) {
                this.items.splice(i, 1);
            } else if (this.checkCollision(this.ninja, this.items[i])) {
                this.collectItem(this.items[i]);
                this.items.splice(i, 1);
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(dt);
            if (this.projectiles[i].x > this.canvas.width) {
                this.projectiles.splice(i, 1);
            } else {
                // Check projectile-enemy collision
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    if (this.checkCollision(this.projectiles[i], this.enemies[j])) {
                        this.enemies.splice(j, 1);
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // Update effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].update(dt);
            if (this.effects[i].lifetime <= 0) {
                this.effects.splice(i, 1);
            }
        }

        // Update UI to show current survival time
        this.updateUI();
    }

    spawnObjects() {
        const currentTime = Date.now();
        const config = this.levelConfig[this.currentLevel];
        const adjustedSpawnRate = config.spawnRate / this.speedMultiplier;

        // Spawn obstacles
        if (currentTime - this.lastObstacleSpawn > adjustedSpawnRate) {
            this.lastObstacleSpawn = currentTime;
            const types = ['spikes', 'branch', 'fire', 'rock'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.obstacles.push(new Obstacle(this, type));
        }

        // Spawn enemies (more frequently)
        if (currentTime - this.lastEnemySpawn > adjustedSpawnRate * 0.8) {
            this.lastEnemySpawn = currentTime;
            if (Math.random() < 0.7) {
                this.enemies.push(new Enemy(this));
            }
        }

        // Spawn items
        if (currentTime - this.lastItemSpawn > adjustedSpawnRate * 2) {
            this.lastItemSpawn = currentTime;
            if (Math.random() < 0.3) {
                const type = Math.random() < 0.7 ? 'coin' : 'scroll';
                this.items.push(new Item(this, type));
            }
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    takeDamage() {
        this.health--;
        this.updateUI();

        if (this.health <= 0) {
            this.gameOver();
        }
    }

    collectItem(item) {
        // Items collected but score is now survival time
        // Could add bonus effects here in future (e.g., health restore)
    }

    levelComplete() {
        this.state = 'levelcomplete';
        document.getElementById('levelScore').textContent = this.score;
        document.getElementById('levelCompleteScreen').style.display = 'block';
    }

    gameOver() {
        this.state = 'gameover';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.currentLevel;
        document.getElementById('gameOverScreen').style.display = 'block';
    }

    winGame() {
        this.state = 'gameover';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = 'ALL LEVELS COMPLETE!';
        document.getElementById('gameOverScreen').style.display = 'block';
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.currentLevel;

        const hearts = document.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            if (index >= this.health) {
                heart.classList.add('lost');
            } else {
                heart.classList.remove('lost');
            }
        });
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.background.draw(this.ctx);

        // Draw ground line
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

        // Draw game objects
        this.items.forEach(item => item.draw(this.ctx));
        this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.projectiles.forEach(projectile => projectile.draw(this.ctx));
        this.effects.forEach(effect => effect.draw(this.ctx));
        this.ninja.draw(this.ctx);

        // Draw progress bar
        if (this.state === 'playing') {
            const progress = this.levelDistance / this.levelGoal;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(10, this.canvas.height - 30, this.canvas.width - 20, 20);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillRect(10, this.canvas.height - 30, (this.canvas.width - 20) * progress, 20);
        }
    }

    addProjectile(x, y) {
        this.projectiles.push(new Projectile(this, x, y));
    }

    addEffect(type, x, y) {
        this.effects.push(new Effect(this, type, x, y));
    }
}

// Ninja Class
class Ninja {
    constructor(game) {
        this.game = game;
        this.width = 120;  // Adjusted for sprite size
        this.height = 140; // Adjusted for sprite size
        this.x = 100;
        this.groundY = game.groundY - this.height;  // Store the ground position
        this.y = this.groundY;  // Start at ground level

        // Physics
        this.velocityY = 0;
        this.gravity = 2500;  // Increased gravity for more realistic arc
        this.jumpPower = -1100;  // Much stronger jump power for visible jumps

        // States
        this.isJumping = false;
        this.isSliding = false;
        this.isAttacking = false;
        this.currentAnimation = 'run';

        // Animation
        this.frameX = 0;
        this.frameTimer = 0;
        this.frameInterval = 60; // Faster animation
        this.maxFrames = 10; // 10 frames per animation

        // Attack cooldown
        this.attackCooldown = 0;
    }

    update(dt) {
        // Scale physics with game speed so jumps complete faster at higher speeds
        const speedScale = this.game.speedMultiplier;

        // Update physics - ALWAYS update physics for jumping
        if (this.isJumping) {
            this.velocityY += this.gravity * speedScale * dt;
            this.y += this.velocityY * dt;

            // Check if landed
            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.isJumping = false;
                this.velocityY = 0;
            }
        }

        // Update current animation state
        if (this.isSliding) {
            this.currentAnimation = 'slide';
        } else if (this.isJumping) {
            this.currentAnimation = 'jump';
        } else if (this.isAttacking) {
            // Keep current animation when attacking
        } else {
            this.currentAnimation = 'run';
        }

        // Update animation frame (faster at higher speeds)
        this.frameTimer += dt * 1000 * speedScale;
        if (this.frameTimer > this.frameInterval) {
            this.frameTimer = 0;
            this.frameX = (this.frameX + 1) % this.maxFrames;
        }

        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        // Update hitbox for sliding - but DON'T override Y position if jumping!
        if (this.isSliding && !this.isJumping) {
            this.height = 60;  // Much smaller hitbox when sliding (was 100, now 60)
            this.y = this.groundY + 80;  // Lower to ground when sliding (140 - 60 = 80 difference)
        } else if (!this.isJumping) {
            // Only reset to ground if not jumping
            this.height = 140;
            this.y = this.groundY;
        } else {
            // When jumping, just update the height for hitbox
            this.height = this.isSliding ? 60 : 140;
        }
    }

    draw(ctx) {
        // Get the current animation sprites
        const sprites = this.game.assets.characters[this.currentAnimation];

        if (sprites && sprites[this.frameX]) {
            // Draw the actual ninja sprite
            ctx.drawImage(
                sprites[this.frameX],
                this.x,
                this.y,
                this.width,
                this.height
            );
        } else {
            // Fallback to placeholder if sprites not loaded
            ctx.fillStyle = this.isSliding ? '#444' : '#333';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            ctx.fillStyle = '#ffd700';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.currentAnimation.toUpperCase(), this.x + this.width/2, this.y + this.height/2);
        }

        // Debug: Show hitbox
        if (this.game.debug.showHitboxes || this.game.debug.showPlayerHitbox) {
            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // Show dimensions and state
            ctx.fillStyle = 'lime';
            ctx.font = '10px Arial';
            ctx.fillText(`${this.width}x${this.height}${this.isSliding ? ' SLIDE' : ''}`, this.x + this.width/2, this.y - 5);
        }
    }

    jump() {
        if (!this.isJumping && !this.isSliding) {
            this.isJumping = true;
            // Scale jump power with game speed so jumps complete faster
            this.velocityY = this.jumpPower * this.game.speedMultiplier;
            this.game.addEffect('dust_jump', this.x, this.groundY + this.height);
        }
    }

    startSlide() {
        if (!this.isJumping && !this.isSliding) {
            this.isSliding = true;
            this.game.addEffect('dust_slide', this.x, this.groundY + this.height);
        }
    }

    endSlide() {
        this.isSliding = false;
    }

    attack() {
        if (this.attackCooldown <= 0 && !this.isSliding) {
            this.isAttacking = true;
            this.attackCooldown = 0.5;
            this.game.addProjectile(this.x + this.width, this.y + this.height/2);
            setTimeout(() => this.isAttacking = false, 200);
        }
    }

    reset() {
        this.x = 100;
        this.groundY = this.game.groundY - this.height;  // Recalculate ground position
        this.y = this.groundY;
        this.velocityY = 0;
        this.isJumping = false;
        this.isSliding = false;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.currentAnimation = 'run';
        this.frameX = 0;
        this.frameTimer = 0;
    }
}

// Background Class
class Background {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.x2 = game.canvas.width;
        this.image = null;
    }

    setImage(image) {
        this.image = image;
    }

    update(dt, speed) {
        this.x -= speed * dt * 0.5;
        this.x2 -= speed * dt * 0.5;

        if (this.x <= -this.game.canvas.width) {
            this.x = this.game.canvas.width;
        }
        if (this.x2 <= -this.game.canvas.width) {
            this.x2 = this.game.canvas.width;
        }
    }

    draw(ctx) {
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.game.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D8E8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        // Draw background images if loaded
        if (this.image) {
            ctx.drawImage(this.image, this.x, 0, this.game.canvas.width, this.game.canvas.height);
            ctx.drawImage(this.image, this.x2, 0, this.game.canvas.width, this.game.canvas.height);
        }
    }
}

// Obstacle Class
class Obstacle {
    constructor(game, type) {
        this.game = game;
        this.type = type;
        this.x = game.canvas.width;

        // Set properties based on type
        switch(type) {
            case 'spikes':
                this.width = 60;
                this.height = 40;
                this.y = game.groundY - this.height;
                this.color = '#888';
                break;
            case 'branch':
                this.width = 80;
                this.height = 30;
                this.y = game.groundY - 150;  // Raised to 150 pixels above ground for clear sliding clearance
                this.color = '#8B4513';
                break;
            case 'fire':
                this.width = 60;
                this.height = 60;
                this.y = game.groundY - this.height;
                this.color = '#FF4500';
                break;
            case 'rock':
                this.width = 45;
                this.height = 45;
                this.y = game.groundY - this.height;
                this.color = '#696969';
                break;
            default:
                this.width = 50;
                this.height = 50;
                this.y = game.groundY - this.height;
                this.color = '#666';
        }
    }

    update(dt, speed) {
        this.x -= speed * dt;
    }

    draw(ctx) {
        // Try to draw actual obstacle image
        const image = this.game.assets.obstacles[this.type];
        if (image) {
            ctx.drawImage(image, this.x, this.y, this.width, this.height);
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Draw type indicator
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.type.toUpperCase(), this.x + this.width/2, this.y + this.height/2);
        }

        // Debug: Show obstacle hitbox
        if (this.game.debug.showHitboxes || this.game.debug.showObstacleHitboxes) {
            ctx.strokeStyle = this.type === 'branch' ? 'yellow' : 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // Show type label and dimensions
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.fillText(`${this.type} ${this.width}x${this.height}`, this.x, this.y - 5);
        }
    }
}

// Enemy Class - Adventurer running left
class Enemy {
    constructor(game) {
        this.game = game;
        this.width = 100;  // Similar to player ninja
        this.height = 120; // Similar to player ninja
        this.x = game.canvas.width;
        this.y = game.groundY - this.height;
        this.speed = 100; // Enemy moves towards player

        // Animation
        this.frameX = 0;
        this.frameTimer = 0;
        this.frameInterval = 80;
        this.maxFrames = 10;

        // Load enemy sprite frames (use dedicated enemy sprites)
        this.sprites = game.assets.enemies ? game.assets.enemies.run : null;
    }

    update(dt, speed) {
        // Move towards player
        this.x -= (speed + this.speed) * dt;

        // Update animation
        this.frameTimer += dt * 1000;
        if (this.frameTimer > this.frameInterval) {
            this.frameTimer = 0;
            this.frameX = (this.frameX + 1) % this.maxFrames;
        }
    }

    draw(ctx) {
        ctx.save();

        // If we have the sprite, draw it flipped horizontally
        if (this.sprites && this.sprites[this.frameX]) {
            // Flip horizontally to face left (running towards player)
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.sprites[this.frameX],
                -this.x - this.width,  // Negate x position for flip
                this.y,
                this.width,
                this.height
            );
        } else {
            // Fallback to colored rectangle if no sprite
            ctx.fillStyle = '#8B4513';  // Brown color for adventurer
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Draw "ENEMY" text
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ENEMY', this.x + this.width/2, this.y + this.height/2);
        }

        ctx.restore();

        // Debug: Show enemy hitbox
        if (this.game.debug.showHitboxes || this.game.debug.showEnemyHitboxes) {
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Item Class
class Item {
    constructor(game, type) {
        this.game = game;
        this.type = type;
        this.width = 30;
        this.height = 30;
        this.x = game.canvas.width;
        this.y = game.groundY - 60 - Math.random() * 100;
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    update(dt, speed) {
        this.x -= speed * dt;
        this.bobOffset += dt * 3;
        this.y += Math.sin(this.bobOffset) * 0.5;
    }

    draw(ctx) {
        if (this.type === 'coin') {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('$', this.x + this.width/2, this.y + this.height/2 + 5);
        } else if (this.type === 'scroll') {
            ctx.fillStyle = '#DEB887';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('S', this.x + this.width/2, this.y + this.height/2 + 5);
        }
    }
}

// Projectile Class
class Projectile {
    constructor(game, x, y) {
        this.game = game;
        this.width = 20;
        this.height = 10;
        this.x = x;
        this.y = y - this.height/2;
        this.speed = 800;
        this.rotation = 0;
    }

    update(dt) {
        this.x += this.speed * dt;
        this.rotation += dt * 10;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);

        // Draw shuriken (ninja star shape)
        ctx.fillStyle = '#C0C0C0';
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 1;

        // Draw 4-pointed star
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2);
            const outerX = Math.cos(angle) * 12;
            const outerY = Math.sin(angle) * 12;

            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }

            const innerAngle = angle + Math.PI / 4;
            const innerX = Math.cos(innerAngle) * 5;
            const innerY = Math.sin(innerAngle) * 5;
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Add center circle
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#606060';
        ctx.fill();

        ctx.restore();
    }
}

// Effect Class
class Effect {
    constructor(game, type, x, y) {
        this.game = game;
        this.type = type;
        this.x = x;
        this.y = y;
        this.lifetime = 0.5;
        this.particles = [];

        // Create particles
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: -Math.random() * 200,
                size: Math.random() * 5 + 2
            });
        }
    }

    update(dt) {
        this.lifetime -= dt;

        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 500 * dt; // gravity
            p.size *= 0.98;
        });
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(139, 69, 19, ${this.lifetime * 2})`;
        this.particles.forEach(p => {
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new Game();
});