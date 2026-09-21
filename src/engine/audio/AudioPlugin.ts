import { sound } from "@pixi/sound";
import { ExtensionType } from "pixi.js";
import type { Application, ExtensionMetadata } from "pixi.js";

import { BGM, SFX } from "./audio";

export class CreationAudioPlugin {
    public static extension: ExtensionMetadata = ExtensionType.Application;

    public static init(): void {
        const app = this as unknown as Application;

        app.audio = {
            bgm: new BGM(),
            sfx: new SFX(),
            getMasterVolume: () => sound.volumeAll,
            setMasterVolume: (volume: number) => {
                sound.volumeAll = volume;
                if (!volume) {
                    sound.muteAll();
                } else {
                    sound.unmuteAll();
                }
            },
        };
    }

    public static destroy(): void {
        const app = this as unknown as Application;
        app.audio = null as unknown as Application["audio"];
    }
}
