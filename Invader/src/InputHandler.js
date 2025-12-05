export class InputHandler {
    constructor() {
        this.keys = new Set();

        window.addEventListener('keydown', (e) => {
            // console.log(e.key, e.code); // For debugging
            this.keys.add(e.key); // Use e.key for 'p', 'P', 'Escape', 'Pause'
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.key);
        });
    }

    isDown(code) {
        return this.keys.has(code);
    }
}
