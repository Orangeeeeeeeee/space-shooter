import type { TextOptions, TextStyleOptions } from "pixi.js";
import { Text } from "pixi.js";

const defaultLabelStyle: Partial<TextStyleOptions> = {
    fontFamily: "Arial Rounded MT Bold",
    align: "center",
};

export type LabelOptions = typeof defaultLabelStyle;

export class Label extends Text {
    constructor(opts?: TextOptions) {
        const style = { ...defaultLabelStyle, ...opts?.style };
        super({ ...opts, style });

        this.anchor.set(0.5);
    }
}
