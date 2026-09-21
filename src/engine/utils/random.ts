function xmur3(str: string): () => number {
    let h = 1779033703 ^ str.length;

    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }

    return (): number => {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);

        return (h ^= h >>> 16) >>> 0;
    };
}

function mulberry32(a: number): () => number {
    return (): number => {
        let t = (a += 0x6d2b79f5);

        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const HASH_CHARSET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function randomSeeded(seed: string): () => number {
    return mulberry32(xmur3(seed)());
}

export function randomColor(random = Math.random): number {
    const r = Math.floor(0xff * random());
    const g = Math.floor(0xff * random());
    const b = Math.floor(0xff * random());
    return (r << 16) | (g << 8) | b;
}

export function randomRange(
    min: number,
    max: number,
    random = Math.random,
): number {
    const a = Math.min(min, max);
    const b = Math.max(min, max);
    const v = a + (b - a) * random();

    return v;
}

export function randomItem<T>(obj: T, random = Math.random): T[keyof T] {
    if (Array.isArray(obj)) {
        return obj[Math.floor(random() * obj.length)];
    }

    const keys = Object.keys(obj as Record<string, unknown>);
    const key = keys[Math.floor(random() * keys.length)];
    return obj[key as keyof T];
}

export function randomBool(weight = 0.5, random = Math.random): boolean {
    return random() < weight;
}

export function randomShuffle<T>(array: T[], random = Math.random): T[] {
    let currentIndex = array.length;
    let temporaryValue;
    let randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

export function randomHash(
    length: number,
    random = Math.random,
    charset = HASH_CHARSET,
): string {
    const charsetLength = charset.length;
    let result = "";

    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(random() * charsetLength));
    }

    return result;
}

export function randomFloat(min: number, max: number, random = Math.random) {
    return random() * (max - min) + min;
}

export function randomInt(min: number, max: number, random = Math.random) {
    return Math.floor(random() * (max - min + 1)) + min;
}
