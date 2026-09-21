import { sound } from "@pixi/sound";
import type {
    ApplicationOptions,
    DestroyOptions,
    RendererDestroyOptions,
} from "pixi.js";
import { Application, Assets, extensions, ResizePlugin } from "pixi.js";
import "pixi.js/app";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - This is a dynamically generated file by AssetPack
import manifest from "../manifest.json";

import { CreationAudioPlugin } from "./audio/AudioPlugin";
import { CreationNavigationPlugin } from "./navigation/NavigationPlugin";
import { CreationResizePlugin } from "./resize/ResizePlugin";
import { getResolution } from "./utils/getResolution";

extensions.remove(ResizePlugin);
extensions.add(CreationResizePlugin);
extensions.add(CreationAudioPlugin);
extensions.add(CreationNavigationPlugin);

export class CreationEngine extends Application {
    public async init(opts: Partial<ApplicationOptions>): Promise<void> {
        opts.resizeTo ??= window;
        opts.resolution ??= getResolution();

        await super.init(opts);

        document.getElementById("pixi-container")!.appendChild(this.canvas);

        document.addEventListener("visibilitychange", this.visibilityChange);

        await Assets.init({ manifest, basePath: "assets" });
        await Assets.loadBundle("preload");

        const allBundles = manifest.bundles.map((item) => item.name);

        Assets.backgroundLoadBundle(allBundles);
    }

    public override destroy(
        rendererDestroyOptions: RendererDestroyOptions = false,
        options: DestroyOptions = false,
    ): void {
        document.removeEventListener("visibilitychange", this.visibilityChange);
        super.destroy(rendererDestroyOptions, options);
    }

    protected visibilityChange = () => {
        if (document.hidden) {
            sound.pauseAll();
            this.navigation.blur();
        } else {
            sound.resumeAll();
            this.navigation.focus();
        }
    };
}
