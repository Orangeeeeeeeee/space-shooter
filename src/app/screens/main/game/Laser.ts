import { Graphics } from "pixi.js";

/**
 * Куля, створена виключно графічними засобами Pixi.js (new Graphics()),
 * без використання зовнішніх графічних файлів.
 */
export class Laser extends Graphics {
    public vx = 0;
    public vy = 0;
    public isPlayer: boolean;
    public radius = 5;

    constructor(x: number, y: number, isPlayer = true, vy?: number) {
        super();
        this.x = x;
        this.y = y;
        this.isPlayer = isPlayer;

        if (isPlayer) {
            // Куля гравця (летить вгору)
            this.vy = vy ?? -750;
            this.radius = 5;

            // Зовнішнє світіння
            this.circle(0, 0, 6).fill({ color: 0x00f5ff, alpha: 0.5 });
            // Ядро кулі
            this.circle(0, 0, 3.5).fill({ color: 0xffffff, alpha: 1 });
            // Невеликий хвостик кулі
            this.rect(-1.5, 0, 3, 10).fill({ color: 0x00e5ff, alpha: 0.8 });
        } else {
            // Куля Боса (летить вниз)
            this.vy = vy ?? 350;
            this.radius = 7;

            // Зовнішнє червоне світіння
            this.circle(0, 0, 9).fill({ color: 0xff1744, alpha: 0.5 });
            // Ядро кулі
            this.circle(0, 0, 5).fill({ color: 0xfff0f0, alpha: 1 });
            // Хвостик кулі вгору
            this.rect(-2, -10, 4, 10).fill({ color: 0xff5252, alpha: 0.8 });
        }
    }

    public update(deltaSeconds: number): void {
        this.x += this.vx * deltaSeconds;
        this.y += this.vy * deltaSeconds;
    }
}
