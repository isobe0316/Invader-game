export class Invader {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.markedForDeletion = false;
        this.frame = 0; // アニメーションフレーム (0 or 1)
    }

    update(dx, dy) {
        this.x += dx;
        this.y += dy;
        // 移動するたびにフレームを切り替える（簡易的）
        if (dx !== 0 || dy !== 0) {
            this.frame = this.frame === 0 ? 1 : 0;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#00ff00'; // エイリアングリーン

        // 11x8 のビットマップ (0: 空白, 1: 描画)
        // インベーダータイプ1 (カニ型)
        const sprites = [
            [
                "00100000100",
                "00010001000",
                "00111111100",
                "01101110110",
                "11111111111",
                "10111111101",
                "10100000101",
                "00011011000"
            ],
            [
                "00100000100",
                "10010001001",
                "10111111101",
                "11101110111",
                "11111111111",
                "00111111100",
                "00100000100",
                "01000000010"
            ]
        ];

        const sprite = sprites[this.frame];
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
