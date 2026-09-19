import { Container, Graphics } from "pixi.js";

interface Star {
    x: number;
    y: number;
    size: number;
    speed: number;
    alpha: number;
    color: number;
}

export class Starfield extends Container {
    private graphics: Graphics;
    private stars: Star[] = [];
    private fieldWidth = 800;
    private fieldHeight = 600;

    constructor() {
        super();
        this.graphics = new Graphics();
        this.addChild(this.graphics);
        this.initStars(120);
    }

    private initStars(count: number) {
        this.stars = [];
        const colors = [0xffffff, 0xd0e8ff, 0xafe9ff, 0xfff0f5];

        for (let i = 0; i < count; i++) {
            const layer = Math.random();
            let size = 1.5;
            let speed = 40;
            let alpha = 0.4;

            if (layer > 0.8) {
                size = 3;
                speed = 220;
                alpha = 0.9;
            } else if (layer > 0.5) {
                size = 2.2;
                speed = 110;
                alpha = 0.7;
            }

            this.stars.push({
                x: Math.random() * this.fieldWidth,
                y: Math.random() * this.fieldHeight,
                size,
                speed,
                alpha,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }
    }

    public update(deltaSeconds: number) {
        this.graphics.clear();

        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            star.y += star.speed * deltaSeconds;

            if (star.y > this.fieldHeight) {
                star.y = 0;
                star.x = Math.random() * this.fieldWidth;
            }

            this.graphics
                .rect(star.x, star.y, star.size, star.size)
                .fill({ color: star.color, alpha: star.alpha });
        }
    }

    public resize(width: number, height: number) {
        const oldW = this.fieldWidth;
        const oldH = this.fieldHeight;
        this.fieldWidth = width;
        this.fieldHeight = height;

        // Scale existing star positions to new dimensions
        if (oldW > 0 && oldH > 0) {
            for (const star of this.stars) {
                star.x = (star.x / oldW) * width;
                star.y = (star.y / oldH) * height;
            }
        }
    }
}
