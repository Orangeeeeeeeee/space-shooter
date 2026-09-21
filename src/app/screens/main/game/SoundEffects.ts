import { userSettings } from "../../../utils/userSettings";

const AUDIBLE_VOLUME_THRESHOLD = 0.001;

const LASER_SOUND = {
    startFreq: 880,
    endFreq: 110,
    rampDuration: 0.12,
    gain: 0.18,
    stopDelay: 0.13,
};

const ENEMY_LASER_SOUND = {
    startFreq: 320,
    endFreq: 80,
    rampDuration: 0.14,
    gain: 0.12,
    stopDelay: 0.15,
};

const HIT_SOUND = {
    startFreq: 220,
    endFreq: 50,
    rampDuration: 0.08,
    gain: 0.2,
    stopDelay: 0.09,
};

const EXPLOSION_SOUND = {
    duration: 0.35,
    startFilterFreq: 800,
    endFilterFreq: 60,
    gain: 0.3,
};

const GAME_OVER_SOUND = {
    notes: [220, 196, 174, 130],
    noteSpacing: 0.12,
    gain: 0.18,
    noteDuration: 0.2,
    stopDelay: 0.22,
};

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

    public playLaser(): void {
        try {
            this.initContext();
            if (!this.ctx) return;
            const vol = this.getVolume();
            if (vol <= AUDIBLE_VOLUME_THRESHOLD) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(LASER_SOUND.startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(
                LASER_SOUND.endFreq,
                now + LASER_SOUND.rampDuration,
            );

            gain.gain.setValueAtTime(LASER_SOUND.gain * vol, now);
            gain.gain.exponentialRampToValueAtTime(
                AUDIBLE_VOLUME_THRESHOLD,
                now + LASER_SOUND.rampDuration,
            );

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + LASER_SOUND.stopDelay);
        } catch {}
    }

    public playEnemyLaser(): void {
        try {
            this.initContext();
            if (!this.ctx) return;
            const vol = this.getVolume();
            if (vol <= AUDIBLE_VOLUME_THRESHOLD) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;
            osc.type = "square";
            osc.frequency.setValueAtTime(ENEMY_LASER_SOUND.startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(
                ENEMY_LASER_SOUND.endFreq,
                now + ENEMY_LASER_SOUND.rampDuration,
            );

            gain.gain.setValueAtTime(ENEMY_LASER_SOUND.gain * vol, now);
            gain.gain.exponentialRampToValueAtTime(
                AUDIBLE_VOLUME_THRESHOLD,
                now + ENEMY_LASER_SOUND.rampDuration,
            );

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + ENEMY_LASER_SOUND.stopDelay);
        } catch {}
    }

    public playHit(): void {
        try {
            this.initContext();
            if (!this.ctx) return;
            const vol = this.getVolume();
            if (vol <= AUDIBLE_VOLUME_THRESHOLD) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;
            osc.type = "triangle";
            osc.frequency.setValueAtTime(HIT_SOUND.startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(
                HIT_SOUND.endFreq,
                now + HIT_SOUND.rampDuration,
            );

            gain.gain.setValueAtTime(HIT_SOUND.gain * vol, now);
            gain.gain.exponentialRampToValueAtTime(
                AUDIBLE_VOLUME_THRESHOLD,
                now + HIT_SOUND.rampDuration,
            );

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + HIT_SOUND.stopDelay);
        } catch {}
    }

    public playExplosion(): void {
        try {
            this.initContext();
            if (!this.ctx) return;
            const vol = this.getVolume();
            if (vol <= AUDIBLE_VOLUME_THRESHOLD) return;

            const bufferSize = Math.floor(
                this.ctx.sampleRate * EXPLOSION_SOUND.duration,
            );
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
            filter.frequency.setValueAtTime(
                EXPLOSION_SOUND.startFilterFreq,
                now,
            );
            filter.frequency.exponentialRampToValueAtTime(
                EXPLOSION_SOUND.endFilterFreq,
                now + EXPLOSION_SOUND.duration,
            );

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(EXPLOSION_SOUND.gain * vol, now);
            gain.gain.exponentialRampToValueAtTime(
                AUDIBLE_VOLUME_THRESHOLD,
                now + EXPLOSION_SOUND.duration,
            );

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(now);
        } catch {}
    }

    public playGameOver(): void {
        try {
            this.initContext();
            if (!this.ctx) return;
            const vol = this.getVolume();
            if (vol <= AUDIBLE_VOLUME_THRESHOLD) return;

            const now = this.ctx.currentTime;

            GAME_OVER_SOUND.notes.forEach((freq, idx) => {
                const osc = this.ctx!.createOscillator();
                const gain = this.ctx!.createGain();
                const startTime = now + idx * GAME_OVER_SOUND.noteSpacing;

                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(GAME_OVER_SOUND.gain * vol, startTime);
                gain.gain.exponentialRampToValueAtTime(
                    AUDIBLE_VOLUME_THRESHOLD,
                    startTime + GAME_OVER_SOUND.noteDuration,
                );

                osc.connect(gain);
                gain.connect(this.ctx!.destination);

                osc.start(startTime);
                osc.stop(startTime + GAME_OVER_SOUND.stopDelay);
            });
        } catch {}
    }
}

export const soundEffects = new SoundEffectsManager();
