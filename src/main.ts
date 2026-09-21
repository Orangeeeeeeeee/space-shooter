import { setEngine } from "./app/getEngine";
import { LoadScreen } from "./app/screens/LoadScreen";
import { MainScreen } from "./app/screens/main/MainScreen";
import { userSettings } from "./app/utils/userSettings";
import { CreationEngine } from "./engine/engine";

import "@pixi/sound";

const engine = new CreationEngine();
setEngine(engine);

(async () => {
    await engine.init({
        background: "#080914",
        resizeOptions: { minWidth: 768, minHeight: 1024, letterbox: false },
    });

    userSettings.init();

    await engine.navigation.showScreen(LoadScreen);

    await engine.navigation.showScreen(MainScreen);
})();
