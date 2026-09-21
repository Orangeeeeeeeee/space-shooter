import { Graphics } from "pixi.js";

const PLAYER_LASER_SPEED = -750;
const PLAYER_LASER_RADIUS = 5;
const BOSS_LASER_SPEED = 350;
const BOSS_LASER_RADIUS = 7;

export class Laser extends Graphics {
    public vx = 0;
    public vy = 0;
    public isPlayer: boolean;
    public radius = PLAYER_LASER_RADIUS;

    constructor(x: number, y: number, isPlayer = true, vy?: number) {
        super();
        this.x = x;
        this.y = y;
        this.isPlayer = isPlayer;

        if (isPlayer) {
            this.vy = vy ?? PLAYER_LASER_SPEED;
            this.radius = PLAYER_LASER_RADIUS;

            this.circle(0, 0, 6).fill({ color: 0x00f5ff, alpha: 0.5 });

            this.circle(0, 0, 3.5).fill({ color: 0xffffff, alpha: 1 });

            this.rect(-1.5, 0, 3, 10).fill({ color: 0x00e5ff, alpha: 0.8 });
        } else {
            this.vy = vy ?? BOSS_LASER_SPEED;
            this.radius = BOSS_LASER_RADIUS;

            this.circle(0, 0, 9).fill({ color: 0xff1744, alpha: 0.5 });

            this.circle(0, 0, 5).fill({ color: 0xfff0f0, alpha: 1 });

            this.rect(-2, -10, 4, 10).fill({ color: 0xff5252, alpha: 0.8 });
        }
    }

    public update(deltaSeconds: number): void {
        this.x += this.vx * deltaSeconds;
        this.y += this.vy * deltaSeconds;
    }
}
