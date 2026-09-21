import { Container, Graphics } from "pixi.js";

import { BOSS_MAX_HP } from "./gameConfig";

const BOSS_RADIUS = 40;
const INITIAL_STATE_TIMER = 1.5;
const MOVE_SPEED = 190;
const SHOOT_INTERVAL_SECONDS = 2.0;
const HIT_FLASH_DURATION = 0.12;
const SCREEN_EDGE_PADDING = 15;
const MOVE_DURATION_MIN = 1.8;
const MOVE_DURATION_RANGE = 1.5;
const IDLE_DURATION_MIN = 1.2;
const IDLE_DURATION_RANGE = 1.0;
const MUZZLE_OFFSET_Y = 36;
const HP_BAR_WIDTH = 84;
const HP_BAR_HEIGHT = 10;
const HP_BAR_Y_OFFSET = -48;

export class Boss extends Container {
    public hp = BOSS_MAX_HP;
    public readonly maxHp = BOSS_MAX_HP;
    public radius = BOSS_RADIUS;

    private shipGraphics: Graphics;
    private hpBarGraphics: Graphics;

    private state: "IDLE" | "MOVING" = "IDLE";
    private stateTimer = INITIAL_STATE_TIMER;
    private moveSpeed = MOVE_SPEED;
    private moveDir = 1;

    private shootTimer = SHOOT_INTERVAL_SECONDS;

    private flashTimer = 0;

    constructor(startX: number, startY: number) {
        super();
        this.x = startX;
        this.y = startY;

        this.shipGraphics = new Graphics();
        this.hpBarGraphics = new Graphics();

        this.addChild(this.shipGraphics);
        this.addChild(this.hpBarGraphics);

        this.drawShip();
        this.updateHpBar();
    }

    private drawShip(): void {
        this.shipGraphics.clear();

        this.shipGraphics
            .poly([
                0, 36, -20, 24, -48, 12, -44, -18, -24, -12, 0, -26, 24, -12,
                44, -18, 48, 12, 20, 24,
            ])
            .fill({ color: 0x6c1d8c, alpha: 1 })
            .stroke({ width: 2.5, color: 0xb536f5 });

        this.shipGraphics
            .poly([-40, 10, -30, -8, -14, 0, -20, 18])
            .fill({ color: 0x9b27b0, alpha: 1 });
        this.shipGraphics
            .poly([40, 10, 30, -8, 14, 0, 20, 18])
            .fill({ color: 0x9b27b0, alpha: 1 });

        this.shipGraphics
            .roundRect(-7, 10, 14, 28, 4)
            .fill({ color: 0x2c2d30, alpha: 1 })
            .stroke({ width: 1.5, color: 0xff3b30 });

        this.shipGraphics
            .circle(0, -2, 10)
            .fill({ color: 0xff0055, alpha: 0.9 })
            .stroke({ width: 2, color: 0xffffff });
    }

    private updateHpBar(): void {
        this.hpBarGraphics.clear();

        const barWidth = HP_BAR_WIDTH;
        const barHeight = HP_BAR_HEIGHT;
        const barY = HP_BAR_Y_OFFSET;

        this.hpBarGraphics
            .roundRect(-barWidth * 0.5, barY, barWidth, barHeight, 3)
            .fill({ color: 0x1e1e24, alpha: 0.9 })
            .stroke({ width: 1.5, color: 0x555566 });

        const currentWidth = Math.max(
            0,
            (this.hp / this.maxHp) * (barWidth - 4),
        );
        const hpColor =
            this.hp > 2 ? 0x2ed573 : this.hp === 2 ? 0xffa502 : 0xff4757;

        if (currentWidth > 0) {
            this.hpBarGraphics
                .roundRect(
                    -barWidth * 0.5 + 2,
                    barY + 2,
                    currentWidth,
                    barHeight - 4,
                    2,
                )
                .fill({ color: hpColor, alpha: 1 });
        }

        for (let i = 1; i < this.maxHp; i++) {
            const segX = -barWidth * 0.5 + (i * barWidth) / this.maxHp;
            this.hpBarGraphics
                .rect(segX - 0.5, barY + 1, 1, barHeight - 2)
                .fill({ color: 0x000000, alpha: 0.6 });
        }
    }

    public takeDamage(): boolean {
        if (this.hp <= 0) return true;

        this.hp -= 1;
        this.updateHpBar();

        this.flashTimer = HIT_FLASH_DURATION;
        this.shipGraphics.tint = 0xffffff;

        return this.hp <= 0;
    }

    public update(
        deltaSeconds: number,
        screenWidth: number,
        onShoot: (x: number, y: number) => void,
    ): void {
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaSeconds;
            if (this.flashTimer <= 0) {
                this.shipGraphics.tint = 0xffffff;
            }
        }

        this.stateTimer -= deltaSeconds;
        if (this.stateTimer <= 0) {
            if (this.state === "IDLE") {
                this.state = "MOVING";
                this.stateTimer =
                    Math.random() * MOVE_DURATION_RANGE + MOVE_DURATION_MIN;
                this.moveDir = Math.random() > 0.5 ? 1 : -1;
            } else {
                this.state = "IDLE";
                this.stateTimer =
                    Math.random() * IDLE_DURATION_RANGE + IDLE_DURATION_MIN;
            }
        }

        if (this.state === "MOVING") {
            this.x += this.moveDir * this.moveSpeed * deltaSeconds;

            const pad = this.radius + SCREEN_EDGE_PADDING;
            if (this.x < pad) {
                this.x = pad;
                this.moveDir = 1;
            } else if (this.x > screenWidth - pad) {
                this.x = screenWidth - pad;
                this.moveDir = -1;
            }
        }

        this.shootTimer -= deltaSeconds;
        if (this.shootTimer <= 0) {
            this.shootTimer = SHOOT_INTERVAL_SECONDS;

            onShoot(this.x, this.y + MUZZLE_OFFSET_Y);
        }
    }
}
