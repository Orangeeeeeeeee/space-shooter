export function waitFor(delayInSecs = 1): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), delayInSecs * 1000);
    });
}
