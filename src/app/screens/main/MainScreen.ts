import { FancyButton } from "@pixi/ui";
import type { Ticker } from "pixi.js";
import { Container, Graphics } from "pixi.js";

import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { SettingsPopup } from "../../popups/SettingsPopup";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Label";
import { RoundedBox } from "../../ui/RoundedBox";

import { Asteroid } from "./game/Asteroid";
import { Boss } from "./game/Boss";
import {
    BOSS_MAX_HP,
    DEFAULT_SCREEN_HEIGHT,
    DEFAULT_SCREEN_WIDTH,
    LEVEL_TIME_SECONDS,
    PLAYER_START_AMMO,
} from "./game/gameConfig";
import { Laser } from "./game/Laser";
import { ParticleSystem } from "./game/ParticleSystem";
import { Player } from "./game/Player";
import { soundEffects } from "./game/SoundEffects";
import { Starfield } from "./game/Starfield";

const ASTEROID_COUNT = 6;
const ASTEROID_SPAWN_MARGIN_X = 80;
const ASTEROID_SPAWN_BASE_Y = 110;
const ASTEROID_SPAWN_ROW_SPACING = 90;
const ASTEROID_SPAWN_JITTER_X = 60;
const ASTEROID_SPAWN_JITTER_Y = 30;
const ASTEROID_SPAWN_RADIUS_MIN = 22;
const ASTEROID_SPAWN_RADIUS_RANGE = 6;
const BOSS_START_Y = 120;
const BOSS_LASER_SPEED = 360;
const LEVEL_TRANSITION_DURATION_SECONDS = 2.0;
const PLAYER_Y_OFFSET_FROM_BOTTOM = 80;
const LASER_OFFSCREEN_MARGIN = 30;
const TIME_WARNING_THRESHOLD_SECONDS = 10;
const AMMO_WARNING_THRESHOLD = 2;
const ASTEROID_HIT_BURST = { count: 18, speedMax: 180 };
const LASER_COLLISION_BURST = { count: 10, speedMax: 120 };
const PLAYER_DEATH_BURST = { count: 26, speedMax: 240 };
const BOSS_DEATH_BURST = { count: 40, speedMax: 300 };
const BOSS_HIT_BURST = { count: 10, speedMax: 120 };

export class MainScreen extends Container {
    public static assetBundles = ["main"];

    private screenWidth = DEFAULT_SCREEN_WIDTH;
    private screenHeight = DEFAULT_SCREEN_HEIGHT;

    private starfield: Starfield;
    private gameLayer: Container;
    private uiLayer: Container;

    private player: Player;
    private playerLasers: Laser[] = [];
    private bossLasers: Laser[] = [];
    private asteroids: Asteroid[] = [];
    private boss: Boss | null = null;
    private particleSystem: ParticleSystem;

    private currentLevel: 1 | 2 = 1;
    private timeLeft = LEVEL_TIME_SECONDS;
    private isGameOver = false;
    private isPaused = false;

    private timerLabel: Label;
    private ammoLabel: Label;
    private levelLabel: Label;
    private pauseButton: FancyButton;
    private settingsButton: FancyButton;

    private levelTransitionBanner: Container;
    private transitionLabel: Label;
    private transitionTimer = 0;

    private resultModal: Container;
    private resultTitle: Label;
    private resultSubtext: Label;
    private restartButton: Button;

    constructor() {
        super();

        this.starfield = new Starfield();
        this.addChild(this.starfield);

        this.gameLayer = new Container();
        this.addChild(this.gameLayer);

        this.particleSystem = new ParticleSystem();
        this.gameLayer.addChild(this.particleSystem);

        this.player = new Player();
        this.gameLayer.addChild(this.player);

        this.uiLayer = new Container();
        this.addChild(this.uiLayer);

        this.timerLabel = new Label({
            text: `TIME: ${LEVEL_TIME_SECONDS}s`,
            style: {
                fontSize: 24,
                fill: 0xffffff,
                fontWeight: "bold",
            },
        });
        this.uiLayer.addChild(this.timerLabel);

        // Залишок набоїв (створено через PIXI.js)
        this.ammoLabel = new Label({
            text: `AMMO: ${PLAYER_START_AMMO}/${PLAYER_START_AMMO}`,
            style: {
                fontSize: 24,
                fill: 0x00f5d4,
                fontWeight: "bold",
            },
        });
        this.uiLayer.addChild(this.ammoLabel);

        // Індикатор рівня
        this.levelLabel = new Label({
            text: "LEVEL 1: ASTEROIDS",
            style: {
                fontSize: 20,
                fill: 0xf1f2f6,
            },
        });
        this.uiLayer.addChild(this.levelLabel);

        // Кнопки Паузи та Налаштувань
        const buttonAnimations = {
            hover: { props: { scale: { x: 1.1, y: 1.1 } }, duration: 100 },
            pressed: { props: { scale: { x: 0.9, y: 0.9 } }, duration: 100 },
        };

        this.pauseButton = new FancyButton({
            defaultView: "icon-pause.png",
            anchor: 0.5,
            animations: buttonAnimations,
        });
        this.pauseButton.onPress.connect(() =>
            engine().navigation.presentPopup(PausePopup),
        );
        this.uiLayer.addChild(this.pauseButton);

        this.settingsButton = new FancyButton({
            defaultView: "icon-settings.png",
            anchor: 0.5,
            animations: buttonAnimations,
        });
        this.settingsButton.onPress.connect(() =>
            engine().navigation.presentPopup(SettingsPopup),
        );
        this.uiLayer.addChild(this.settingsButton);

        // Банер повідомлення про перехід на другий рівень
        this.levelTransitionBanner = new Container();
        this.levelTransitionBanner.visible = false;
        this.uiLayer.addChild(this.levelTransitionBanner);

        const bannerBg = new Graphics();
        bannerBg.roundRect(-220, -35, 440, 70, 12).fill({
            color: 0x000000,
            alpha: 0.75,
        });
        this.levelTransitionBanner.addChild(bannerBg);

        this.transitionLabel = new Label({
            text: "LEVEL 2: BOSS FIGHT!",
            style: {
                fontSize: 28,
                fill: 0xffbe76,
                fontWeight: "bold",
            },
        });
        this.levelTransitionBanner.addChild(this.transitionLabel);

        // Модальне вікно результату гри (YOU WIN / YOU LOSE)
        this.resultModal = new Container();
        this.resultModal.visible = false;
        this.uiLayer.addChild(this.resultModal);

        const modalBox = new RoundedBox({ width: 440, height: 320 });
        this.resultModal.addChild(modalBox);

        // Заголовок "YOU WIN" або "YOU LOSE" (створено засобами PIXI.js)
        this.resultTitle = new Label({
            text: "YOU WIN",
            style: {
                fontSize: 46,
                fill: 0x2ed573,
                fontWeight: "bold",
            },
        });
        this.resultTitle.y = -80;
        this.resultModal.addChild(this.resultTitle);

        // Підпис причини поразки або вітання
        this.resultSubtext = new Label({
            text: "",
            style: {
                fontSize: 20,
                fill: 0xdcdde1,
            },
        });
        this.resultSubtext.y = -18;
        this.resultModal.addChild(this.resultSubtext);

        // Кнопка рестарту
        this.restartButton = new Button({
            text: "PLAY AGAIN",
            width: 260,
            height: 75,
            fontSize: 22,
        });
        this.restartButton.y = 70;
        this.restartButton.onPress.connect(() => this.startLevel1());
        this.resultModal.addChild(this.restartButton);
    }

    /** Запуск 1-го рівня гри з астероїдами */
    public startLevel1(): void {
        this.currentLevel = 1;
        this.timeLeft = LEVEL_TIME_SECONDS;
        this.isGameOver = false;
        this.resultModal.visible = false;
        this.levelTransitionBanner.visible = false;

        // Очищення куль та сутностей
        this.clearLasers();
        this.clearAsteroids();
        this.clearBoss();
        this.particleSystem.clearAll();

        // Гравець: тільки горизонтальний рух, позиція внизу, 10 набоїв
        this.player.reset(
            this.screenWidth * 0.5,
            this.screenHeight - PLAYER_Y_OFFSET_FROM_BOTTOM,
            PLAYER_START_AMMO,
        );

        // Довільна розстановка астероїдів
        this.spawnAsteroids();

        this.updateHUD();
    }

    /** Створення та довільна розстановка астероїдів у верхній половині екрану */
    private spawnAsteroids(): void {
        const asteroidCount = ASTEROID_COUNT; // Оскільки у гравця 10 пострілів, 6 астероїдів - чесний виклик
        const marginX = ASTEROID_SPAWN_MARGIN_X;
        const availableWidth = this.screenWidth - marginX * 2;

        for (let i = 0; i < asteroidCount; i++) {
            // Довільні координати у верхній половині екрану
            const col = i % 3;
            const row = Math.floor(i / 3);
            const baseX = marginX + col * (availableWidth / 2.5);
            const baseY =
                ASTEROID_SPAWN_BASE_Y + row * ASTEROID_SPAWN_ROW_SPACING;

            // Додаємо випадкове зміщення
            const randX =
                baseX + (Math.random() - 0.5) * ASTEROID_SPAWN_JITTER_X;
            const randY =
                baseY + (Math.random() - 0.5) * ASTEROID_SPAWN_JITTER_Y;

            const asteroid = new Asteroid(
                randX,
                randY,
                Math.random() * ASTEROID_SPAWN_RADIUS_RANGE +
                    ASTEROID_SPAWN_RADIUS_MIN,
            );
            this.asteroids.push(asteroid);
            this.gameLayer.addChild(asteroid);
        }
    }

    /** Перехід на 2-й рівень з Босом */
    public startLevel2(): void {
        this.currentLevel = 2;
        this.timeLeft = LEVEL_TIME_SECONDS; // Знов час обмежений 60 секундами
        this.clearLasers();
        this.clearAsteroids();

        // У гравця знов доступно 10 пострілів
        this.player.ammo = PLAYER_START_AMMO;
        this.player.maxAmmo = PLAYER_START_AMMO;

        // Створюємо Боса
        this.boss = new Boss(this.screenWidth * 0.5, BOSS_START_Y);
        this.gameLayer.addChild(this.boss);

        // Банер переходу
        this.transitionTimer = LEVEL_TRANSITION_DURATION_SECONDS;
        this.levelTransitionBanner.visible = true;

        this.updateHUD();
    }

    private clearLasers(): void {
        for (const laser of this.playerLasers) {
            this.gameLayer.removeChild(laser);
            laser.destroy();
        }
        this.playerLasers = [];

        for (const laser of this.bossLasers) {
            this.gameLayer.removeChild(laser);
            laser.destroy();
        }
        this.bossLasers = [];
    }

    private clearAsteroids(): void {
        for (const asteroid of this.asteroids) {
            this.gameLayer.removeChild(asteroid);
            asteroid.destroy();
        }
        this.asteroids = [];
    }

    private clearBoss(): void {
        if (this.boss) {
            this.gameLayer.removeChild(this.boss);
            this.boss.destroy();
            this.boss = null;
        }
    }

    private updateHUD(): void {
        // Оновлюємо таймер
        const seconds = Math.max(0, Math.ceil(this.timeLeft));
        this.timerLabel.text = `TIME: ${seconds}s`;
        this.timerLabel.style.fill =
            seconds <= TIME_WARNING_THRESHOLD_SECONDS ? 0xff4757 : 0xffffff;

        // Оновлюємо лічильник набоїв
        this.ammoLabel.text = `AMMO: ${this.player.ammo}/${PLAYER_START_AMMO}`;
        this.ammoLabel.style.fill =
            this.player.ammo <= AMMO_WARNING_THRESHOLD ? 0xff6b81 : 0x00f5d4;

        // Назва рівня
        if (this.currentLevel === 1) {
            this.levelLabel.text = `LEVEL 1: ASTEROIDS (${this.asteroids.length} left)`;
        } else {
            const bossHp = this.boss ? this.boss.hp : 0;
            this.levelLabel.text = `LEVEL 2: BOSS (HP: ${bossHp}/${BOSS_MAX_HP})`;
        }
    }

    /** Завершення гри з виведенням "YOU WIN" або "YOU LOSE" */
    private endGame(isWin: boolean, reason?: string): void {
        if (this.isGameOver) return;
        this.isGameOver = true;

        if (isWin) {
            this.resultTitle.text = "YOU WIN";
            this.resultTitle.style.fill = 0x2ed573;
            this.resultSubtext.text = "Congratulations! You beat the Boss!";
            soundEffects.playHit();
        } else {
            this.resultTitle.text = "YOU LOSE";
            this.resultTitle.style.fill = 0xff4757;
            this.resultSubtext.text = reason || "Mission Failed";
            soundEffects.playGameOver();
        }

        this.resultModal.visible = true;
    }

    /** Головний ігровий цикл (update) */
    public update(time: Ticker): void {
        const deltaSeconds = Math.min(time.deltaTime / 60, 0.1);

        // Фонове зоряне поле та частинки оновлюються завжди
        this.starfield.update(deltaSeconds);
        this.particleSystem.update(deltaSeconds);

        if (this.isPaused || this.isGameOver) {
            return;
        }

        // Зворотний відлік 60 секунд
        this.timeLeft -= deltaSeconds;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.updateHUD();
            this.endGame(false, "Time Expired! (60s limit)");
            return;
        }

        // Банер зміни рівня
        if (this.transitionTimer > 0) {
            this.transitionTimer -= deltaSeconds;
            if (this.transitionTimer <= 0) {
                this.levelTransitionBanner.visible = false;
            }
        }

        // Оновлення корабля гравця (рух тільки по горизонталі, стрільба Пробілом)
        this.player.update(deltaSeconds, this.screenWidth, (laser) => {
            this.playerLasers.push(laser);
            this.gameLayer.addChild(laser);
            soundEffects.playLaser();
            this.updateHUD();
        });

        // Оновлення куль гравця
        for (let i = this.playerLasers.length - 1; i >= 0; i--) {
            const laser = this.playerLasers[i];
            laser.update(deltaSeconds);

            // Видаляємо кулі, що вилетіли за екран
            if (laser.y < -LASER_OFFSCREEN_MARGIN) {
                this.gameLayer.removeChild(laser);
                laser.destroy();
                this.playerLasers.splice(i, 1);
            }
        }

        // Оновлення куль Боса
        for (let i = this.bossLasers.length - 1; i >= 0; i--) {
            const laser = this.bossLasers[i];
            laser.update(deltaSeconds);

            // Видаляємо кулі, що вилетіли за екран
            if (laser.y > this.screenHeight + LASER_OFFSCREEN_MARGIN) {
                this.gameLayer.removeChild(laser);
                laser.destroy();
                this.bossLasers.splice(i, 1);
            }
        }

        // ==========================================
        // ЛОГІКА РІВНЯ 1: АСТЕРОЇДИ
        // ==========================================
        if (this.currentLevel === 1) {
            // Оновлюємо астероїди
            for (const asteroid of this.asteroids) {
                asteroid.update(deltaSeconds);
            }

            // Перевірка колізій: Куля гравця vs Астероїд
            for (let p = this.playerLasers.length - 1; p >= 0; p--) {
                const pLaser = this.playerLasers[p];

                for (let a = this.asteroids.length - 1; a >= 0; a--) {
                    const asteroid = this.asteroids[a];
                    const dx = pLaser.x - asteroid.x;
                    const dy = pLaser.y - asteroid.y;
                    const hitDist = pLaser.radius + asteroid.radius;

                    if (dx * dx + dy * dy <= hitDist * hitDist) {
                        // Зберігаємо координати перед видаленням/знищенням
                        const astX = asteroid.x;
                        const astY = asteroid.y;

                        // При попаданні кулі в астероїд обидва об'єкти знищуються!
                        this.gameLayer.removeChild(pLaser);
                        pLaser.destroy();
                        this.playerLasers.splice(p, 1);

                        this.gameLayer.removeChild(asteroid);
                        asteroid.destroy();
                        this.asteroids.splice(a, 1);

                        soundEffects.playExplosion();
                        this.particleSystem.burst(
                            astX,
                            astY,
                            [0x8b8d9e, 0x5a5c6e, 0xffa502, 0xffffff],
                            ASTEROID_HIT_BURST.count,
                            ASTEROID_HIT_BURST.speedMax,
                        );

                        this.updateHUD();

                        // Якщо знищено останній астероїд -> перехід на другий рівень гри з Босом!
                        if (this.asteroids.length === 0) {
                            this.startLevel2();
                            return;
                        }
                        break;
                    }
                }
            }

            // Перевірка поразки: снаряди закінчились, куль у польоті немає, астероїди не всі знищені
            if (
                this.player.ammo === 0 &&
                this.playerLasers.length === 0 &&
                this.asteroids.length > 0
            ) {
                this.endGame(false, "Out of Ammo! (10 shots limit)");
                return;
            }
        }

        // ==========================================
        // ЛОГІКА РІВНЯ 2: БОС
        // ==========================================
        else if (this.currentLevel === 2 && this.boss) {
            // Оновлення Боса (рух, стрільба кожні 2 секунди)
            this.boss.update(deltaSeconds, this.screenWidth, (bx, by) => {
                const bLaser = new Laser(bx, by, false, BOSS_LASER_SPEED);
                this.bossLasers.push(bLaser);
                this.gameLayer.addChild(bLaser);
                soundEffects.playEnemyLaser();
            });

            // 1. Колізія: Куля Боса зустрічається з кулею гравця -> обидві знищуються!
            for (let p = this.playerLasers.length - 1; p >= 0; p--) {
                const pLaser = this.playerLasers[p];

                for (let b = this.bossLasers.length - 1; b >= 0; b--) {
                    const bLaser = this.bossLasers[b];
                    const dx = pLaser.x - bLaser.x;
                    const dy = pLaser.y - bLaser.y;
                    const hitDist = pLaser.radius + bLaser.radius;

                    if (dx * dx + dy * dy <= hitDist * hitDist) {
                        const hitX = bLaser.x;
                        const hitY = bLaser.y;

                        this.gameLayer.removeChild(pLaser);
                        pLaser.destroy();
                        this.playerLasers.splice(p, 1);

                        this.gameLayer.removeChild(bLaser);
                        bLaser.destroy();
                        this.bossLasers.splice(b, 1);

                        soundEffects.playHit();
                        this.particleSystem.burst(
                            hitX,
                            hitY,
                            [0x00f5ff, 0xff1744, 0xffffff],
                            LASER_COLLISION_BURST.count,
                            LASER_COLLISION_BURST.speedMax,
                        );
                        break;
                    }
                }
            }

            // 2. Колізія: Куля Боса попадає в корабель гравця -> YOU LOSE!
            for (let b = this.bossLasers.length - 1; b >= 0; b--) {
                const bLaser = this.bossLasers[b];
                const dx = bLaser.x - this.player.x;
                const dy = bLaser.y - this.player.y;
                const hitDist = bLaser.radius + this.player.radius;

                if (dx * dx + dy * dy <= hitDist * hitDist) {
                    const playerX = this.player.x;
                    const playerY = this.player.y;

                    this.gameLayer.removeChild(bLaser);
                    bLaser.destroy();
                    this.bossLasers.splice(b, 1);

                    this.particleSystem.burst(
                        playerX,
                        playerY,
                        [0xff4757, 0xffa502, 0xffffff],
                        PLAYER_DEATH_BURST.count,
                        PLAYER_DEATH_BURST.speedMax,
                    );
                    this.player.visible = false;
                    this.endGame(false, "Ship Destroyed by Boss!");
                    return;
                }
            }

            // 3. Колізія: Куля гравця попадає у Боса -> -1 HP, якщо HP === 0 -> YOU WIN!
            if (this.boss) {
                for (let p = this.playerLasers.length - 1; p >= 0; p--) {
                    if (!this.boss) break;
                    const pLaser = this.playerLasers[p];
                    const dx = pLaser.x - this.boss.x;
                    const dy = pLaser.y - this.boss.y;
                    const hitDist = pLaser.radius + this.boss.radius;

                    if (dx * dx + dy * dy <= hitDist * hitDist) {
                        const hitX = pLaser.x;
                        const hitY = pLaser.y;
                        const bossX = this.boss.x;
                        const bossY = this.boss.y;

                        this.gameLayer.removeChild(pLaser);
                        pLaser.destroy();
                        this.playerLasers.splice(p, 1);

                        const isBossDead = this.boss.takeDamage();
                        this.updateHUD();

                        if (isBossDead) {
                            soundEffects.playExplosion();
                            this.particleSystem.burst(
                                bossX,
                                bossY,
                                [0xb536f5, 0xff0055, 0xffffff, 0xffa502],
                                BOSS_DEATH_BURST.count,
                                BOSS_DEATH_BURST.speedMax,
                            );
                            this.gameLayer.removeChild(this.boss);
                            this.boss.destroy();
                            this.boss = null;

                            this.endGame(true); // Перемога над босом -> YOU WIN!
                            return;
                        } else {
                            soundEffects.playHit();
                            this.particleSystem.burst(
                                hitX,
                                hitY,
                                [0x00f5ff, 0xffffff],
                                BOSS_HIT_BURST.count,
                                BOSS_HIT_BURST.speedMax,
                            );
                        }
                        break;
                    }
                }
            }

            // Перевірка поразки на 2-му рівні: постріли закінчилися, куль немає, бос живий -> YOU LOSE
            if (
                this.player.ammo === 0 &&
                this.playerLasers.length === 0 &&
                this.boss &&
                this.boss.hp > 0
            ) {
                this.endGame(false, "Out of Ammo on Boss! (10 shots limit)");
                return;
            }
        }

        this.updateHUD();
    }

    public async pause(): Promise<void> {
        this.isPaused = true;
    }

    public async resume(): Promise<void> {
        this.isPaused = false;
    }

    public reset(): void {
        this.startLevel1();
    }

    public resize(width: number, height: number): void {
        this.screenWidth = width;
        this.screenHeight = height;

        this.starfield.resize(width, height);

        // Розміщення HUD
        this.pauseButton.x = 42;
        this.pauseButton.y = 42;

        this.settingsButton.x = width - 42;
        this.settingsButton.y = 42;

        this.timerLabel.x = width * 0.5 - 110;
        this.timerLabel.y = 35;

        this.ammoLabel.x = width * 0.5 + 110;
        this.ammoLabel.y = 35;

        this.levelLabel.x = width * 0.5;
        this.levelLabel.y = 65;

        // Центрування модального вікна та банера
        this.resultModal.x = width * 0.5;
        this.resultModal.y = height * 0.5;

        this.levelTransitionBanner.x = width * 0.5;
        this.levelTransitionBanner.y = height * 0.4;

        // Позиція гравця на фіксованій горизонталі внизу
        this.player.y = height - PLAYER_Y_OFFSET_FROM_BOTTOM;
        if (this.player.x > width - this.player.radius) {
            this.player.x = width - this.player.radius;
        }
    }

    public async show(): Promise<void> {
        engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.4 });
        this.startLevel1();
    }

    public async hide(): Promise<void> {
        engine().audio.bgm.current?.stop();
    }

    public blur(): void {
        if (!engine().navigation.currentPopup && !this.isGameOver) {
            engine().navigation.presentPopup(PausePopup);
        }
    }
}
