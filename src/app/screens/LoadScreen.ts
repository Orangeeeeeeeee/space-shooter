import { CircularProgressBar } from "@pixi/ui";
import { animate } from "motion";
import type { ObjectTarget } from "motion/react";
import { Container, Sprite, Texture } from "pixi.js";

export class LoadScreen extends Container {
    public static assetBundles = ["preload"];

    private pixiLogo: Sprite;

    private progressBar: CircularProgressBar;

    constructor() {
        super();

        this.progressBar = new CircularProgressBar({
            backgroundColor: "#3d3d3d",
            fillColor: "#e72264",
            radius: 100,
            lineWidth: 15,
            value: 20,
            backgroundAlpha: 0.5,
            fillAlpha: 0.8,
            cap: "round",
        });

        this.progressBar.x += this.progressBar.width / 2;
        this.progressBar.y += -this.progressBar.height / 2;

        this.addChild(this.progressBar);

        this.pixiLogo = new Sprite({
            texture: Texture.from("logo.svg"),
            anchor: 0.5,
            scale: 0.2,
        });
        this.addChild(this.pixiLogo);
    }

    public onLoad(progress: number) {
        this.progressBar.progress = progress;
    }

    public resize(width: number, height: number) {
        this.pixiLogo.position.set(width * 0.5, height * 0.5);
        this.progressBar.position.set(width * 0.5, height * 0.5);
    }

    public async show() {
        this.alpha = 1;
    }

    public async hide() {
        await animate(this, { alpha: 0 } as ObjectTarget<this>, {
            duration: 0.3,
            ease: "linear",
            delay: 1,
        });
    }
}
