import { userSettings } from "../../../utils/userSettings";

/**
 * Web Audio synthesized sound effects for space shooter.
 * Provides instant, zero-asset audio for lasers, hits, and explosions.
 */
class SoundEffectsManager {
    private ctx: AudioContext | null = null;

    private initContext() {
        if (!this.ctx) {
            const AudioCtx =
                window.AudioContext ||
                (
                    window as unknown as {
                        webkitAudioContext: typeof AudioContext;
                    }
                ).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => {});
        }
    }

    private getVolume(): number {
        return userSettings.getMasterVolume() * userSettings.getSfxVolume();
    }

    /** Play a synthesized laser shot sound */
    public playLaser(): void {
        try {
            this.initContext();
            if (!this.ctx) return;
            const vol = this.getVolume();
            if (vol <= 0.001) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            const now = this.ctx.currentTime;
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

            gain.gain.setValueAtTime(0.18 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.13);
        } catch {
            // Audio context might be restricted before gesture
        }
    }

    /** Play an enemy laser shot sound */
    public playEnemyLaser(): void {
        try {
            this.initContext();
            if (!this.ctx) return;
            const vol = this.getVolume();
            if (vol <= 0.001) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            const now = this.ctx.currentTime;
            osc.type = "square";
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.14);

            gain.gain.setValueAtTime(0.12 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.15);
        } catch {
            // Ignore audio error
        }
    }

    /** Play a hit/impact sound */
    public playHit(): void {
        try {
            this.initContext();
            if (!this.ctx) return;
            const vol = this.getVolume();
            if (vol <= 0.001) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            const now = this.ctx.currentTime;
            osc.type = "triangle";
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);

            gain.gain.setValueAtTime(0.2 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.09);
        } catch {
            // Ignore audio error
        }
    }

    /** Play an explosion sound */
    public playExplosion(): void {
        try {
            this.initContext();
            if (!this.ctx) return;
            const vol = this.getVolume();
            if (vol <= 0.001) return;

            const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
            const buffer = this.ctx.createBuffer(
                1,
                bufferSize,
                this.ctx.sampleRate,
            );
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = "lowpass";
            const now = this.ctx.currentTime;
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(60, now + 0.35);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.3 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(now);
        } catch {
            // Ignore audio error
        }
    }

    /** Play a game over sound */
    public playGameOver(): void {
        try {
            this.initContext();
            if (!this.ctx) return;
            const vol = this.getVolume();
            if (vol <= 0.001) return;

            const notes = [220, 196, 174, 130];
            const now = this.ctx.currentTime;

            notes.forEach((freq, idx) => {
                const osc = this.ctx!.createOscillator();
                const gain = this.ctx!.createGain();
                const startTime = now + idx * 0.12;

                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.18 * vol, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

                osc.connect(gain);
                gain.connect(this.ctx!.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.22);
            });
        } catch {
            // Ignore audio error
        }
    }
}

export const soundEffects = new SoundEffectsManager();
