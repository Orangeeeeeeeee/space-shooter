import { Container, Graphics } from "pixi.js";

import { Laser } from "./Laser";

/**
 * Корабель гравця.
 * - Рухається виключно по горизонталі в межах екрана.
 * - Керується кнопками вліво/вправо на клавіатурі.
 * - Стріляє клавішею "Пробіл".
 * - Максимум 10 пострілів на рівень.
 */
export class Player extends Container {
    public radius = 22;
    public vx = 0;
    public speed = 460;
    public ammo = 10;
    public maxAmmo = 10;

    private shipGraphics: Graphics;
    private thrusterGraphics: Graphics;
    private animTimer = 0;

    // Клавіші керування
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

        // Корпус корабля (напрямлений вгору)
        this.shipGraphics
            .poly([
                0, -28, -8, -8, -22, 16, -14, 18, -6, 12, 0, 14, 6, 12, 14, 18,
                22, 16, 8, -8,
            ])
            .fill({ color: 0xdff9fb, alpha: 1 })
            .stroke({ width: 2, color: 0x00d2d3 });

        // Крила та деталі
        this.shipGraphics
            .poly([0, -16, -12, 10, 0, 4, 12, 10])
            .fill({ color: 0x0abde3, alpha: 0.95 });

        // Гармата по центру
        this.shipGraphics
            .rect(-2.5, -32, 5, 12)
            .fill({ color: 0x576574, alpha: 1 });

        // Кабіна пілота
        this.shipGraphics
            .roundRect(-3.5, -10, 7, 14, 3.5)
            .fill({ color: 0x0984e3, alpha: 0.95 });
    }

    private updateThruster(): void {
        this.thrusterGraphics.clear();
        const flicker = Math.random() * 6 + 10;

        // Зовнішнє полум'я
        this.thrusterGraphics
            .poly([-4, 14, 0, 14 + flicker, 4, 14])
            .fill({ color: 0xff7675, alpha: 0.85 });

        // Внутрішнє ядро
        this.thrusterGraphics
            .poly([-2, 14, 0, 14 + flicker * 0.6, 2, 14])
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

    /** Скидання позиції та набоїв для нового раунду */
    public reset(startX: number, startY: number, ammoCount = 10): void {
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

        // --- Рух лише по горизонталі кнопками вліво/вправо ---
        let dirX = 0;
        if (this.keys["ArrowLeft"] || this.keys["KeyA"]) dirX -= 1;
        if (this.keys["ArrowRight"] || this.keys["KeyD"]) dirX += 1;

        this.vx = dirX * this.speed;
        this.x += this.vx * deltaSeconds;

        // Обмеження екрану: корабель не виходить за межі екрану
        const pad = this.radius + 6;
        if (this.x < pad) {
            this.x = pad;
            this.vx = 0;
        }
        if (this.x > screenWidth - pad) {
            this.x = screenWidth - pad;
            this.vx = 0;
        }

        // Невеликий нахил при русі вліво/вправо
        const targetRotation = (this.vx / this.speed) * 0.18;
        this.rotation += (targetRotation - this.rotation) * 0.2;

        // --- Стрільба клавішею "Пробіл" (максимум 10 пострілів) ---
        if (this.spacePressed && this.fireDebounce <= 0) {
            if (this.ammo > 0) {
                this.ammo -= 1;
                this.fireDebounce = 0.22; // Невеликий інтервал між пострілами

                // Створюємо кулю перед кораблем
                const bullet = new Laser(
                    this.x,
                    this.y - this.radius - 8,
                    true,
                );
                onShoot(bullet);
            }
        }
    }
}
