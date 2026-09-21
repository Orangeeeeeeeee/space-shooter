import { Container, Graphics } from "pixi.js";

const DEFAULT_BURST_COUNT = 16;
const DEFAULT_BURST_SPEED_MAX = 220;
const PARTICLE_SPEED_MIN = 30;
const PARTICLE_SIZE_MIN = 2;
const PARTICLE_SIZE_RANGE = 3;
const PARTICLE_DECAY_MIN = 1.2;
const PARTICLE_DECAY_RANGE = 1.5;
const VELOCITY_DAMPING = 0.97;

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
        count = DEFAULT_BURST_COUNT,
        speedMax = DEFAULT_BURST_SPEED_MAX,
    ): void {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * speedMax + PARTICLE_SPEED_MIN;
            const color = colors[Math.floor(Math.random() * colors.length)];

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * PARTICLE_SIZE_RANGE + PARTICLE_SIZE_MIN,
                alpha: 1,
                decay:
                    Math.random() * PARTICLE_DECAY_RANGE + PARTICLE_DECAY_MIN,
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
            p.vx *= VELOCITY_DAMPING;
            p.vy *= VELOCITY_DAMPING;
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
