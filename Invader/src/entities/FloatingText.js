export class FloatingText {
    constructor(text, x, y, color, size) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.life = 60; // Frames to live
        this.opacity = 1;
        this.velocity = -2; // Float up
    }

    update() {
        this.y += this.velocity;
        this.life--;
        this.opacity = this.life / 60;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = `${this.size}px Arial`; // Using Arial for now, could be pixel font if available
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}
