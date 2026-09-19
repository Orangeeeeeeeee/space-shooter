import { Container, Graphics } from "pixi.js";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    decay: number;
    color: number;
}

export class ParticleSystem extends Container {
    private graphics: Graphics;
    private particles: Particle[] = [];

    constructor() {
        super();
        this.graphics = new Graphics();
        this.addChild(this.graphics);
    }

    public burst(
        x: number,
        y: number,
        colors: number[] = [0xffffff, 0xffa500, 0xff4500, 0x00ffff],
        count = 16,
        speedMax = 220,
    ): void {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * speedMax + 30;
            const color = colors[Math.floor(Math.random() * colors.length)];

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 2,
                alpha: 1,
                decay: Math.random() * 1.5 + 1.2,
                color,
            });
        }
    }

    public update(deltaSeconds: number): void {
        this.graphics.clear();
        if (this.particles.length === 0) return;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaSeconds;
            p.y += p.vy * deltaSeconds;
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.alpha -= p.decay * deltaSeconds;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.graphics
                .rect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size)
                .fill({ color: p.color, alpha: p.alpha });
        }
    }

    public clearAll(): void {
        this.particles = [];
        this.graphics.clear();
    }
}
