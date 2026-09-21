import type { PlayOptions, Sound } from "@pixi/sound";
import { sound } from "@pixi/sound";
import { animate } from "motion";

export class BGM {
    public currentAlias?: string;

    public current?: Sound;

    private volume = 1;

    public async play(alias: string, options?: PlayOptions) {
        if (this.currentAlias === alias) return;

        if (this.current) {
            const current = this.current;
            animate(
                current,
                { volume: 0 },
                { duration: 1, ease: "linear" },
            ).then(() => {
                current.stop();
            });
        }

        this.current = sound.find(alias);

        this.currentAlias = alias;
        this.current.play({ loop: true, ...options });
        this.current.volume = 0;
        animate(
            this.current,
            { volume: this.volume },
            { duration: 1, ease: "linear" },
        );
    }

    public getVolume() {
        return this.volume;
    }

    public setVolume(v: number) {
        this.volume = v;
        if (this.current) this.current.volume = this.volume;
    }
}

export class SFX {
    private volume = 1;

    public play(alias: string, options?: PlayOptions) {
        const volume = this.volume * (options?.volume ?? 1);
        sound.play(alias, { ...options, volume });
    }

    public getVolume() {
        return this.volume;
    }

    public setVolume(v: number) {
        this.volume = v;
    }
}
