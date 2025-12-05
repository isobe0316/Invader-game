export class UFO {
    constructor(game) {
        this.game = game;
        this.width = 60;
        this.height = 30;
        this.x = -this.width; // Start off-screen left
        this.y = 40; // Top of the screen
        this.speed = 3;
        this.markedForDeletion = false;
        this.scoreValue = Math.floor(Math.random() * 3 + 1) * 100; // Random score 100, 200, 300
    }

    update() {
        this.x += this.speed;
        if (this.x > this.game.width) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'red';

        // Retro UFO Pixel Art (16x8 grid approximately)
        // 0: empty, 1: red
        const sprite = [
            "0000011111100000",
            "0001111111111000",
            "0011111111111100",
            "0110110110110110",
            "1111111111111111",
            "0011100110011100",
            "0001000000001000",
            "0000000000000000"
        ];

        const pixelSize = this.width / 16;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 16; c++) {
                if (sprite[r][c] === '1') {
                    ctx.fillRect(this.x + c * pixelSize, this.y + r * pixelSize, pixelSize, pixelSize);
                }
            }
        }
    }
}
