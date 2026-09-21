import { Container, Graphics } from "pixi.js";

import { PLAYER_START_AMMO } from "./gameConfig";
import { Laser } from "./Laser";

const PLAYER_RADIUS = 22;
const PLAYER_SPEED = 460;
const SCREEN_EDGE_PADDING = 6;
const THRUSTER_FLICKER_MIN = 10;
const THRUSTER_FLICKER_RANGE = 6;
const THRUSTER_CORE_RATIO = 0.6;
const TILT_FACTOR = 0.18;
const TILT_SMOOTHING = 0.2;
const FIRE_COOLDOWN_SECONDS = 0.22;
const BULLET_SPAWN_OFFSET = 8;

export class Player extends Container {
    public radius = PLAYER_RADIUS;
    public vx = 0;
    public speed = PLAYER_SPEED;
    public ammo = PLAYER_START_AMMO;
    public maxAmmo = PLAYER_START_AMMO;

    private shipGraphics: Graphics;
    private thrusterGraphics: Graphics;
    private animTimer = 0;

    private keys: Record<string, boolean> = {};
    private spacePressed = false;
    private fireDebounce = 0;

    constructor() {
        super();

        this.thrusterGraphics = new Graphics();
        this.shipGraphics = new Graphics();

        this.addChild(this.thrusterGraphics);
        this.addChild(this.shipGraphics);

        this.drawShip();
        this.setupInputs();
    }

    private drawShip(): void {
        this.shipGraphics.clear();

        this.shipGraphics
            .poly([
                0, -28, -8, -8, -22, 16, -14, 18, -6, 12, 0, 14, 6, 12, 14, 18,
                22, 16, 8, -8,
            ])
            .fill({ color: 0xdff9fb, alpha: 1 })
            .stroke({ width: 2, color: 0x00d2d3 });

        this.shipGraphics
            .poly([0, -16, -12, 10, 0, 4, 12, 10])
            .fill({ color: 0x0abde3, alpha: 0.95 });

        this.shipGraphics
            .rect(-2.5, -32, 5, 12)
            .fill({ color: 0x576574, alpha: 1 });

        this.shipGraphics
            .roundRect(-3.5, -10, 7, 14, 3.5)
            .fill({ color: 0x0984e3, alpha: 0.95 });
    }

    private updateThruster(): void {
        this.thrusterGraphics.clear();
        const flicker =
            Math.random() * THRUSTER_FLICKER_RANGE + THRUSTER_FLICKER_MIN;

        this.thrusterGraphics
            .poly([-4, 14, 0, 14 + flicker, 4, 14])
            .fill({ color: 0xff7675, alpha: 0.85 });

        this.thrusterGraphics
            .poly([-2, 14, 0, 14 + flicker * THRUSTER_CORE_RATIO, 2, 14])
            .fill({ color: 0x74b9ff, alpha: 0.95 });
    }

    private setupInputs(): void {
        const onKeyDown = (e: KeyboardEvent) => {
            this.keys[e.code] = true;
            if (e.code === "Space") {
                this.spacePressed = true;
                e.preventDefault();
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            this.keys[e.code] = false;
            if (e.code === "Space") {
                this.spacePressed = false;
            }
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        this.on("destroyed", () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        });
    }

    public reset(
        startX: number,
        startY: number,
        ammoCount = PLAYER_START_AMMO,
    ): void {
        this.x = startX;
        this.y = startY;
        this.vx = 0;
        this.ammo = ammoCount;
        this.maxAmmo = ammoCount;
        this.spacePressed = false;
        this.fireDebounce = 0;
        this.visible = true;
        this.alpha = 1;
    }

    public update(
        deltaSeconds: number,
        screenWidth: number,
        onShoot: (laser: Laser) => void,
    ): void {
        this.animTimer += deltaSeconds;
        this.updateThruster();

        if (this.fireDebounce > 0) {
            this.fireDebounce -= deltaSeconds;
        }

        let dirX = 0;
        if (this.keys["ArrowLeft"] || this.keys["KeyA"]) dirX -= 1;
        if (this.keys["ArrowRight"] || this.keys["KeyD"]) dirX += 1;

        this.vx = dirX * this.speed;
        this.x += this.vx * deltaSeconds;

        const pad = this.radius + SCREEN_EDGE_PADDING;
        if (this.x < pad) {
            this.x = pad;
            this.vx = 0;
        }
        if (this.x > screenWidth - pad) {
            this.x = screenWidth - pad;
            this.vx = 0;
        }

        const targetRotation = (this.vx / this.speed) * TILT_FACTOR;
        this.rotation += (targetRotation - this.rotation) * TILT_SMOOTHING;

        if (this.spacePressed && this.fireDebounce <= 0) {
            if (this.ammo > 0) {
                this.ammo -= 1;
                this.fireDebounce = FIRE_COOLDOWN_SECONDS;

                const bullet = new Laser(
                    this.x,
                    this.y - this.radius - BULLET_SPAWN_OFFSET,
                    true,
                );
                onShoot(bullet);
            }
        }
    }
}
