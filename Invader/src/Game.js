import { Player } from './entities/Player.js';
import { InputHandler } from './InputHandler.js';
import { Invader } from './entities/Invader.js';
import { SoundManager } from './SoundManager.js';
import { Projectile } from './entities/Projectile.js';
import { UFO } from './entities/UFO.js';
import { FloatingText } from './entities/FloatingText.js';
import { Particle } from './entities/Particle.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width = 800;
        this.height = this.canvas.height = 600;

        this.input = new InputHandler();
        this.sound = new SoundManager();
        this.player = new Player(this);
        this.invaders = [];
        this.projectiles = [];
        this.floatingTexts = [];
        this.particles = [];
        this.score = 0;
        this.highScore = 0; // Reset on new session (reload/new tab)
        this.level = 1;
        this.paused = false;
        this.gameOver = false;
        this.levelClear = false;
        this.levelClearTimer = 0;
        this.enemyShootTimer = 0;
        this.enemyShootInterval = 3000; // 敵の攻撃間隔(ms)

        this.ufo = null;
        this.ufoTimer = 2000; // 2 seconds initial delay (appears quickly)
        this.lastTime = 0;
        this.screenShake = 0;

        this.invaderSpeed = 2;
        this.invaderDirection = 1; // 1: 右, -1: 左
        this.invaderDrop = false;

        this.initInvaders();
    }

    initInvaders() {
        const rows = 4;
        const cols = 8;
        const invaderWidth = 40;
        const invaderHeight = 30;
        const padding = 20;
        const startX = 50;
        const startY = 100; // Moved down to avoid title overlap

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = startX + c * (invaderWidth + padding);
                const y = startY + r * (invaderHeight + padding);
                this.invaders.push(new Invader(this, x, y));
            }
        }
    }

    update(deltaTime) {
        // Toggle Pause
        if (this.input.keys.has('p') || this.input.keys.has('P') || this.input.keys.has('Escape') || this.input.keys.has('Pause')) {
            if (!this.pauseKeyDown) {
                this.paused = !this.paused;
                this.pauseKeyDown = true;
                if (this.paused) {
                    this.sound.suspend();
                } else {
                    this.sound.resume();
                }
            }
        } else {
            this.pauseKeyDown = false;
        }

        if (this.paused) return;

        if (this.gameOver) {
            if (this.input.keys.has('Enter')) {
                this.resetGame();
            }
            // Update floating texts even in game over for effect
            this.floatingTexts.forEach(text => text.update());
            this.floatingTexts = this.floatingTexts.filter(text => text.life > 0);
            return;
        }

        if (this.levelClear) {
            this.levelClearTimer -= deltaTime;
            if (this.levelClearTimer <= 0) {
                this.nextLevel();
            }
            return;
        }

        const inputKeys = Array.from(this.input.keys);
        if (inputKeys.length > 0) {
            this.sound.resume();
            this.sound.startBGM();
        }
        this.player.update(inputKeys);

        // 発射体の更新
        this.projectiles.forEach(proj => proj.update());
        this.projectiles = this.projectiles.filter(proj => !proj.markedForDeletion);

        // フローティングテキストの更新
        this.floatingTexts.forEach(text => text.update());
        this.floatingTexts = this.floatingTexts.filter(text => text.life > 0);

        // パーティクルの更新
        this.particles.forEach(particle => particle.update());
        this.particles = this.particles.filter(particle => !particle.markedForDeletion);

        if (this.screenShake > 0) {
            this.screenShake--;
        }

        // インベーダーの更新
        let hitWall = false;
        this.invaders.forEach(invader => {
            invader.update(this.invaderSpeed * this.invaderDirection, 0);
            if (invader.x + invader.width > this.width || invader.x < 0) {
                hitWall = true;
            }
        });

        // 敵の攻撃
        this.enemyShootTimer -= deltaTime;
        if (this.enemyShootTimer <= 0 && this.invaders.length > 0) {
            this.enemyShootTimer = this.enemyShootInterval - (this.level * 50); // レベルが上がると攻撃頻度アップ
            if (this.enemyShootTimer < 200) this.enemyShootTimer = 200;

            // ランダムなインベーダーが発射
            const shooter = this.invaders[Math.floor(Math.random() * this.invaders.length)];
            this.projectiles.push(new Projectile(this, shooter.x + shooter.width / 2, shooter.y + shooter.height, 5, 1, 'red'));
        }

        // UFO Logic
        if (!this.ufo) {
            this.ufoTimer -= deltaTime;
            if (this.ufoTimer <= 0) {
                this.ufo = new UFO(this);
                this.sound.startUFOAlert();
                this.ufoTimer = Math.random() * 10000 + 5000; // Next UFO in 5-15 seconds
            }
        } else {
            this.ufo.update();
            if (this.ufo.markedForDeletion) {
                this.ufo = null;
                this.sound.stopUFOAlert();
            }
        }

        // 移動音
        if (this.invaders.length > 0 && (this.invaders[0].x % 10 === 0)) { // 簡易的なタイミング制御
            // this.sound.playMove(0); // 頻繁すぎるので調整が必要だが一旦コメントアウト
        }

        if (hitWall) {
            this.invaderDirection *= -1;
            this.invaders.forEach(invader => {
                invader.update(0, 20); // 一段下げる
            });
        }

        // 衝突判定
        this.checkCollisions();

        // ゲームオーバー判定
        if (this.invaders.length === 0) {
            // 勝利条件 - レベルクリア演出へ
            this.levelClear = true;
            this.levelClearTimer = 2000; // 2秒
            this.sound.playLevelClear();
        }

        // インベーダーが底に到達
        this.invaders.forEach(invader => {
            if (invader.y + invader.height >= this.player.y) {
                this.gameOver = true;
                this.sound.stopBGM();
            }
        });
    }

    checkCollisions() {
        this.projectiles.forEach(proj => {
            if (proj.markedForDeletion) return;

            if (proj.direction === -1) {
                // Player Projectile
                // Vs Invaders
                for (const invader of this.invaders) {
                    if (!invader.markedForDeletion &&
                        proj.x < invader.x + invader.width &&
                        proj.x + proj.width > invader.x &&
                        proj.y < invader.y + invader.height &&
                        proj.y + proj.height > invader.y
                    ) {
                        invader.markedForDeletion = true;
                        proj.markedForDeletion = true;
                        this.score += 100;
                        if (this.score > this.highScore) {
                            this.highScore = this.score;
                        }
                        this.sound.playExplosion();
                        break; // One bullet hits one invader
                    }
                }

                // Vs UFO
                if (!proj.markedForDeletion && this.ufo && !this.ufo.markedForDeletion) {
                    if (
                        proj.x < this.ufo.x + this.ufo.width &&
                        proj.x + proj.width > this.ufo.x &&
                        proj.y < this.ufo.y + this.ufo.height &&
                        proj.y + proj.height > this.ufo.y
                    ) {
                        this.ufo.markedForDeletion = true;
                        proj.markedForDeletion = true;

                        // Random Score (Gacha feel)
                        const scores = [100, 300, 500, 1000];
                        const score = scores[Math.floor(Math.random() * scores.length)];
                        this.score += score;
                        if (this.score > this.highScore) {
                            this.highScore = this.score;
                        }

                        this.sound.playUFOExplosion();

                        // Visual Feedback
                        this.screenShake = 20;
                        for (let i = 0; i < 50; i++) {
                            this.particles.push(new Particle(this, this.ufo.x + this.ufo.width / 2, this.ufo.y + this.ufo.height / 2, ['red', 'orange', 'yellow', 'white'][Math.floor(Math.random() * 4)]));
                        }

                        this.floatingTexts.push(new FloatingText("BAAAM!!", this.ufo.x, this.ufo.y, 'orange', 30));
                        this.floatingTexts.push(new FloatingText(score.toString(), this.ufo.x + 20, this.ufo.y + 30, 'yellow', 20));
                    }
                }

            } else if (proj.direction === 1) {
                // Enemy Projectile Vs Player
                if (
                    proj.x < this.player.x + this.player.width &&
                    proj.x + proj.width > this.player.x &&
                    proj.y < this.player.y + this.player.height &&
                    proj.y + proj.height > this.player.y
                ) {
                    this.gameOver = true;
                    this.sound.stopBGM();
                    this.sound.playGameOver();
                }
            }
        });

        this.invaders = this.invaders.filter(invader => !invader.markedForDeletion);
    }

    resetGame() {
        this.player = new Player(this);
        this.invaders = [];
        this.projectiles = [];
        this.floatingTexts = [];
        this.particles = [];
        this.score = 0;
        // highScore is preserved
        this.level = 1;
        this.gameOver = false;
        this.invaderSpeed = 2;
        this.invaderDirection = 1;
        this.initInvaders();
        this.sound.startBGM();
    }

    nextLevel() {
        this.level++;
        this.levelClear = false;
        this.invaderSpeed += 0.5; // 難易度アップ
        this.invaders = [];
        this.projectiles = [];
        this.invaderDirection = 1;
        this.initInvaders();
        // プレイヤーの位置はリセットしない、またはリセットする（好みで）
        // this.player.x = ...
    }

    draw() {
        this.ctx.save();
        if (this.screenShake > 0) {
            this.ctx.translate(Math.random() * 10 - 5, Math.random() * 10 - 5);
        }
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.player.draw(this.ctx);
        this.invaders.forEach(invader => invader.draw(this.ctx));
        if (this.ufo) this.ufo.draw(this.ctx);
        this.projectiles.forEach(proj => proj.draw(this.ctx));
        this.particles.forEach(particle => particle.draw(this.ctx));
        this.floatingTexts.forEach(text => text.draw(this.ctx));

        this.ctx.restore(); // Restore context after shake

        this.drawUI();
    }

    drawUI() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Score: ' + this.score, 10, 30);
        this.ctx.fillText('HI: ' + this.highScore, 150, 30);
        this.ctx.fillText('Level: ' + this.level, this.width - 100, 30);

        this.ctx.font = '14px Arial';
        this.ctx.fillText("Press 'P' to Pause", 20, this.height - 20);

        // Game Title
        this.ctx.save();
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SPACE INVADER', this.width / 2, 40); // Moved back to top
        this.ctx.restore();

        if (this.levelClear) {
            this.ctx.fillStyle = 'yellow';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('LEVEL CLEARED!', this.width * 0.5, this.height * 0.5);
            this.ctx.textAlign = 'left';
        }

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(50, 0, 0, 0.7)'; // 赤黒い背景
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = 'red';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width * 0.5, this.height * 0.5);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press Enter to Restart', this.width * 0.5, this.height * 0.5 + 40);
            this.ctx.textAlign = 'left';
        }

        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.width * 0.5, this.height * 0.5);
            this.ctx.textAlign = 'left';
        }
    }

    start() {
        this.loop(0);
    }

    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }
}
