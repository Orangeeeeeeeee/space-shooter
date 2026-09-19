import { Container, Graphics } from "pixi.js";

/**
 * Бос 2-го рівня, створений повністю засобами Pixi.js.
 * Має 4 HP, шкалу здоров'я над собою, чергує зупинку та горизонтальний рух,
 * і стріляє перед собою рівно кожні 2 секунди.
 */
export class Boss extends Container {
    public hp = 4;
    public readonly maxHp = 4;
    public radius = 40;

    private shipGraphics: Graphics;
    private hpBarGraphics: Graphics;

    // Стан руху: то стоїть на місці, то рухається
    private state: "IDLE" | "MOVING" = "IDLE";
    private stateTimer = 1.5; // Скільки часу триває поточний стан
    private moveSpeed = 190;
    private moveDir = 1; // 1 = вправо, -1 = вліво

    // Стрільба кожні 2 секунди
    private shootTimer = 2.0;

    // Візуальний спалах при влучанні
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

        // Основний корпус Боса
        this.shipGraphics
            .poly([
                0, 36, -20, 24, -48, 12, -44, -18, -24, -12, 0, -26, 24, -12,
                44, -18, 48, 12, 20, 24,
            ])
            .fill({ color: 0x6c1d8c, alpha: 1 })
            .stroke({ width: 2.5, color: 0xb536f5 });

        // Крила та бокові броньовані секції
        this.shipGraphics
            .poly([-40, 10, -30, -8, -14, 0, -20, 18])
            .fill({ color: 0x9b27b0, alpha: 1 });
        this.shipGraphics
            .poly([40, 10, 30, -8, 14, 0, 20, 18])
            .fill({ color: 0x9b27b0, alpha: 1 });

        // Центральна гармата (звідки вилітають кулі перед собою)
        this.shipGraphics
            .roundRect(-7, 10, 14, 28, 4)
            .fill({ color: 0x2c2d30, alpha: 1 })
            .stroke({ width: 1.5, color: 0xff3b30 });

        // Енергетичне ядро Боса
        this.shipGraphics
            .circle(0, -2, 10)
            .fill({ color: 0xff0055, alpha: 0.9 })
            .stroke({ width: 2, color: 0xffffff });
    }

    /** Малює шкалу залишку HP над Босом */
    private updateHpBar(): void {
        this.hpBarGraphics.clear();

        const barWidth = 84;
        const barHeight = 10;
        const barY = -48;

        // Рамка та темний фон шкали
        this.hpBarGraphics
            .roundRect(-barWidth * 0.5, barY, barWidth, barHeight, 3)
            .fill({ color: 0x1e1e24, alpha: 0.9 })
            .stroke({ width: 1.5, color: 0x555566 });

        // Смужка заповнення HP
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

        // Поділки на 4 HP
        for (let i = 1; i < this.maxHp; i++) {
            const segX = -barWidth * 0.5 + (i * barWidth) / this.maxHp;
            this.hpBarGraphics
                .rect(segX - 0.5, barY + 1, 1, barHeight - 2)
                .fill({ color: 0x000000, alpha: 0.6 });
        }
    }

    /**
     * При попаданні кулі гравця віднімається 1 HP.
     * Повертає true, якщо HP стало 0 (Бос переможений).
     */
    public takeDamage(): boolean {
        if (this.hp <= 0) return true;

        this.hp -= 1;
        this.updateHpBar();

        // Ефект спалаху
        this.flashTimer = 0.12;
        this.shipGraphics.tint = 0xffffff;

        return this.hp <= 0;
    }

    public update(
        deltaSeconds: number,
        screenWidth: number,
        onShoot: (x: number, y: number) => void,
    ): void {
        // Анімація спалаху при отриманні шкоди
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaSeconds;
            if (this.flashTimer <= 0) {
                this.shipGraphics.tint = 0xffffff;
            }
        }

        // --- Логіка руху (то стоїть на місці, то рухається по горизонталі) ---
        this.stateTimer -= deltaSeconds;
        if (this.stateTimer <= 0) {
            if (this.state === "IDLE") {
                // Переходимо до руху
                this.state = "MOVING";
                this.stateTimer = Math.random() * 1.5 + 1.8; // Рухається 1.8 - 3.3 секунди
                this.moveDir = Math.random() > 0.5 ? 1 : -1;
            } else {
                // Переходимо до зупинки
                this.state = "IDLE";
                this.stateTimer = Math.random() * 1.0 + 1.2; // Стоїть 1.2 - 2.2 секунди
            }
        }

        if (this.state === "MOVING") {
            this.x += this.moveDir * this.moveSpeed * deltaSeconds;

            // Обмеження екрану (не виходити за межі)
            const pad = this.radius + 15;
            if (this.x < pad) {
                this.x = pad;
                this.moveDir = 1; // змінюємо напрямок
            } else if (this.x > screenWidth - pad) {
                this.x = screenWidth - pad;
                this.moveDir = -1; // змінюємо напрямок
            }
        }

        // --- Стрільба кожні 2 секунди перед собою ---
        this.shootTimer -= deltaSeconds;
        if (this.shootTimer <= 0) {
            this.shootTimer = 2.0; // Скидаємо таймер рівно на 2 секунди
            // Стріляємо прямо перед собою з дула гармати
            onShoot(this.x, this.y + 36);
        }
    }
}
