import { Graphics } from "pixi.js";

const ASTEROID_DEFAULT_RADIUS = 24;
const ROTATION_SPEED_RANGE = 1.5;
const SHAPE_POINT_COUNT = 8;

export class Asteroid extends Graphics {
    public radius: number;
    public rotSpeed: number;

    constructor(x: number, y: number, radius = ASTEROID_DEFAULT_RADIUS) {
        super();
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.rotSpeed = (Math.random() - 0.5) * ROTATION_SPEED_RANGE;

        this.drawAsteroid();
    }

    private drawAsteroid(): void {
        this.clear();
        const points: number[] = [];
        const numPoints = SHAPE_POINT_COUNT;
        const r = this.radius;
        const offsets = [1.0, 0.85, 1.1, 0.9, 1.05, 0.8, 1.15, 0.95];
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const curR = r * offsets[i];
            points.push(Math.cos(angle) * curR, Math.sin(angle) * curR);
        }

        this.poly(points)
            .fill({ color: 0x5a5c6e, alpha: 1 })
            .stroke({ width: 2, color: 0x8b8d9e });

        this.circle(-r * 0.3, -r * 0.2, r * 0.22).fill({
            color: 0x414352,
            alpha: 0.85,
        });
        this.circle(r * 0.25, r * 0.25, r * 0.25).fill({
            color: 0x414352,
            alpha: 0.85,
        });
        this.circle(r * 0.2, -r * 0.35, r * 0.15).fill({
            color: 0x414352,
            alpha: 0.85,
        });
    }

    public update(deltaSeconds: number): void {
        this.rotation += this.rotSpeed * deltaSeconds;
    }
}
