import type { CreationEngine } from "../engine/engine";

let instance: CreationEngine | null = null;

export function engine(): CreationEngine {
    return instance!;
}

export function setEngine(app: CreationEngine) {
    instance = app;
}
