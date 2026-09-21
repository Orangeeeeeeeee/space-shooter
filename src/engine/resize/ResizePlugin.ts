import { ExtensionType } from "pixi.js";
import type {
    Application,
    ApplicationOptions,
    ExtensionMetadata,
    ResizePluginOptions,
} from "pixi.js";

import { resize } from "./resize";

export type DeepRequired<T> = Required<{
    [K in keyof T]: DeepRequired<T[K]>;
}>;

export interface CreationResizePluginOptions extends ResizePluginOptions {
    resizeOptions?: {
        minWidth?: number;

        minHeight?: number;

        letterbox?: boolean;
    };
}

export class CreationResizePlugin {
    public static extension: ExtensionMetadata = ExtensionType.Application;

    private static _resizeId: number | null;
    private static _resizeTo: Window | HTMLElement | null;
    private static _cancelResize: (() => void) | null;

    public static init(options: ApplicationOptions): void {
        const app = this as unknown as Application;

        Object.defineProperty(
            app,
            "resizeTo",

            {
                set(dom: Window | HTMLElement) {
                    globalThis.removeEventListener("resize", app.queueResize);
                    this._resizeTo = dom;
                    if (dom) {
                        globalThis.addEventListener("resize", app.queueResize);
                        app.resize();
                    }
                },
                get() {
                    return this._resizeTo;
                },
            },
        );

        app.queueResize = (): void => {
            if (!this._resizeTo) {
                return;
            }

            this._cancelResize!();

            this._resizeId = requestAnimationFrame(() => app.resize!());
        };

        app.resize = (): void => {
            if (!this._resizeTo) {
                return;
            }

            this._cancelResize!();

            let canvasWidth: number;
            let canvasHeight: number;

            if (this._resizeTo === globalThis.window) {
                canvasWidth = globalThis.innerWidth;
                canvasHeight = globalThis.innerHeight;
            } else {
                const { clientWidth, clientHeight } = this
                    ._resizeTo as HTMLElement;

                canvasWidth = clientWidth;
                canvasHeight = clientHeight;
            }

            const { width, height } = resize(
                canvasWidth,
                canvasHeight,
                app.resizeOptions.minWidth,
                app.resizeOptions.minHeight,
                app.resizeOptions.letterbox,
            );

            app.renderer.canvas.style.width = `${canvasWidth}px`;
            app.renderer.canvas.style.height = `${canvasHeight}px`;
            window.scrollTo(0, 0);

            app.renderer.resize(width, height);
        };

        this._cancelResize = (): void => {
            if (this._resizeId) {
                cancelAnimationFrame(this._resizeId);
                this._resizeId = null;
            }
        };
        this._resizeId = null;
        this._resizeTo = null;
        app.resizeOptions = {
            minWidth: 768,
            minHeight: 1024,
            letterbox: true,
            ...options.resizeOptions,
        };
        app.resizeTo =
            options.resizeTo || (null as unknown as Window | HTMLElement);
    }

    /**
     * Clean up the ticker, scoped to application
     */
    public static destroy(): void {
        const app = this as unknown as Application;

        globalThis.removeEventListener("resize", app.queueResize);
        this._cancelResize!();
        this._cancelResize = null;
        app.queueResize = null as unknown as () => void;
        app.resizeTo = null as unknown as Window | HTMLElement;
        app.resize = null as unknown as () => void;
    }
}
