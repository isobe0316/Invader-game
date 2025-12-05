export class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    suspend() {
        if (this.ctx.state === 'running') {
            this.ctx.suspend();
        }
    }

    playTone(freq, type, duration) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playShoot() {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playExplosion() {
        if (!this.enabled) return;
        const bufferSize = this.ctx.sampleRate * 0.2; // 0.2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        noise.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    playMove(step) {
        // 4種類の音程で移動音を表現
        const freqs = [180, 170, 160, 150];
        this.playTone(freqs[step % 4], 'square', 0.05);
    }

    playLevelClear() {
        if (!this.enabled) return;
        const now = this.ctx.currentTime;
        // ファンファーレ: ド-ミ-ソ-ド
        this.playToneAt(523.25, now, 0.1);       // C5
        this.playToneAt(659.25, now + 0.1, 0.1); // E5
        this.playToneAt(783.99, now + 0.2, 0.1); // G5
        this.playToneAt(1046.50, now + 0.3, 0.4);// C6
    }

    playGameOver() {
        if (!this.enabled) return;
        const now = this.ctx.currentTime;
        // 残念なメロディ: ミ-ド-ラ-ファ#
        this.playToneAt(329.63, now, 0.3);       // E4
        this.playToneAt(261.63, now + 0.3, 0.3); // C4
        this.playToneAt(220.00, now + 0.6, 0.3); // A3
        this.playToneAt(185.00, now + 0.9, 1.0); // F#3
    }

    playToneAt(freq, time, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
    }

    startBGM() {
        if (!this.enabled || this.isPlayingBGM) return;
        this.isPlayingBGM = true;
        this.beatCount = 0;
        this.tempo = 180; // BPM
        this.secondsPerBeat = 60 / this.tempo;
        this.nextNoteTime = this.ctx.currentTime;
        this.schedule();
    }

    schedule() {
        if (!this.isPlayingBGM) return;

        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.playBeat(this.nextNoteTime, this.beatCount);
            this.nextNoteTime += this.secondsPerBeat / 2; // 8分音符
            this.beatCount++;
        }

        this.timerID = requestAnimationFrame(this.schedule.bind(this));
    }

    playBeat(time, beat) {
        // 明るいコード進行 (C Major: C -> G -> Am -> F)
        // C3, G2, A2, F2
        const bassPattern = [
            130.81, 130.81, // C3
            98.00, 98.00,  // G2
            110.00, 110.00, // A2
            87.31, 87.31   // F2
        ];

        // 16ステップでループ
        const step = beat % 16;
        const bassFreq = bassPattern[Math.floor(step / 4) % 4];

        // ベース音 (裏打ちで軽快に)
        if (step % 2 === 1) {
            this.playBass(bassFreq, time, 0.1);
        }

        // メロディ (ランダムアルペジオ風)
        if (step % 2 === 0) {
            // C Major scale notes: C, D, E, F, G, A, B
            const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
            const note = scale[Math.floor(Math.random() * scale.length)];
            this.playTone(note, 'triangle', 0.1);
        }

        // ドラム (キック: 4つ打ち, ハイハット: 8分裏)
        if (step % 4 === 0) {
            this.playKick(time);
        }
        // ハイハットを増やしてアップテンポ感を出す
        if (step % 2 === 1) {
            this.playHihat(time);
        }
    }

    playBass(freq, time, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        // フィルターで少しこもらせる
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, time);

        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + duration);
    }

    playKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    playHihat(time) {
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(time);
    }

    stopBGM() {
        this.isPlayingBGM = false;
        if (this.timerID) {
            cancelAnimationFrame(this.timerID);
        }
    }

    startUFOAlert() {
        if (!this.enabled || this.ufoOsc) return;

        this.ufoOsc = this.ctx.createOscillator();
        this.ufoGain = this.ctx.createGain();

        this.ufoOsc.type = 'sawtooth';
        this.ufoOsc.frequency.setValueAtTime(400, this.ctx.currentTime);
        // Siren effect
        this.ufoOsc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.1);
        this.ufoOsc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.2);

        // Loop the frequency modulation
        // Note: Web Audio API doesn't have a simple "loop ramp" for parameters without custom nodes or scheduling.
        // For simplicity, we'll use an LFO (Low Frequency Oscillator) to modulate the frequency.

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 8; // 8 Hz (fast/uptempo)

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 200; // Modulation depth

        lfo.connect(lfoGain);
        lfoGain.connect(this.ufoOsc.frequency);
        lfo.start();
        this.ufoLFO = lfo;

        this.ufoGain.gain.value = 0.05;

        this.ufoOsc.connect(this.ufoGain);
        this.ufoGain.connect(this.ctx.destination);

        this.ufoOsc.start();
    }

    stopUFOAlert() {
        if (this.ufoOsc) {
            this.ufoOsc.stop();
            this.ufoOsc.disconnect();
            this.ufoOsc = null;
        }
        if (this.ufoLFO) {
            this.ufoLFO.stop();
            this.ufoLFO.disconnect();
            this.ufoLFO = null;
        }
        if (this.ufoGain) {
            this.ufoGain.disconnect();
            this.ufoGain = null;
        }
    }

    playUFOExplosion() {
        if (!this.enabled) return;
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds (longer)
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime); // Louder
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        // Lowpass filter for "heavy" sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }
}
