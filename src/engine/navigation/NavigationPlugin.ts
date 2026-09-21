import { ExtensionType } from "pixi.js";
import type { Application, ExtensionMetadata } from "pixi.js";

import type { CreationEngine } from "../engine";

import { Navigation } from "./navigation";

export class CreationNavigationPlugin {
    public static extension: ExtensionMetadata = ExtensionType.Application;

    private static _onResize: (() => void) | null;

    public static init(): void {
        const app = this as unknown as CreationEngine;

        app.navigation = new Navigation();
        app.navigation.init(app);
        this._onResize = () =>
            app.navigation.resize(app.renderer.width, app.renderer.height);
        app.renderer.on("resize", this._onResize);
        app.resize();
    }

    public static destroy(): void {
        const app = this as unknown as Application;
        app.navigation = null as unknown as Navigation;
    }
}
