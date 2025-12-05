export class Projectile {
    constructor(game, x, y, speed, direction, color = 'white') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = speed;
        this.direction = direction; // -1: 上, 1: 下
        this.color = color;
        this.markedForDeletion = false;
    }

    update() {
        this.y += this.speed * this.direction;

        if (this.y < 0 || this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        if (this.color === 'red') {
            // 敵の弾は丸く描画
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
