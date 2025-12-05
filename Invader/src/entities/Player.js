import { Projectile } from './Projectile.js';

export class Player {
    constructor(game) {
        this.game = game;
        this.width = 50;
        this.height = 30;
        this.x = this.game.width * 0.5 - this.width * 0.5;
        this.y = this.game.height - this.height - 10;
        this.speed = 5;
        this.maxSpeed = 10;
        this.vx = 0;
        this.projectiles = [];
        this.shootTimer = 0;
        this.shootInterval = 20; // 発射間隔（フレーム数）
    }

    update(input) {
        // 水平移動
        if (input.includes('ArrowRight')) this.vx = this.speed;
        else if (input.includes('ArrowLeft')) this.vx = -this.speed;
        else this.vx = 0;

        this.x += this.vx;

        // 画面端の判定
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;

        // 発射処理
        if (this.shootTimer > 0) this.shootTimer--;
        if (input.includes(' ') && this.shootTimer === 0) {
            this.shoot();
            this.shootTimer = this.shootInterval;
        }
    }

    shoot() {
        this.game.projectiles.push(new Projectile(this.game, this.x + this.width * 0.5 - 2, this.y, 10, -1));
        this.game.sound.playShoot();
    }

    draw(ctx) {
        ctx.fillStyle = '#00ffff'; // シアン色の船

        // 11x8 のビットマップ (0: 空白, 1: 描画)
        // かっこいい宇宙船
        const sprite = [
            "00000100000",
            "00001110000",
            "00001110000",
            "01101110110",
            "11111111111",
            "11111111111",
            "11111111111",
            "11000000011"
        ];

        const pixelSize = this.width / 11;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 11; c++) {
                if (sprite[r][c] === '1') {
                    ctx.fillRect(this.x + c * pixelSize, this.y + r * pixelSize, pixelSize, pixelSize);
                }
            }
        }
    }
}
