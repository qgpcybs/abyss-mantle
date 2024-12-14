import ReactDOM from "react-dom/client";
import { App } from "./App";
import { setup } from "./mud/setup";
import { MUDProvider } from "./MUDContext";
import mudConfig from "contracts/mud.config";
import "./index.css";
import { GameScene } from "./phaser/scenes/GameScene";
import { UIScene } from "./phaser/scenes/UIScene";
import config from "./phaser/phaser.config";
import { setupBots } from "./mud/setupBots";
// import { syncPools } from "./mud/syncPools";

const rootElement = document.getElementById("react-root");
if (!rootElement) throw new Error("React root not found");
const root = ReactDOM.createRoot(rootElement);

// TODO: figure out if we actually want this to be async or if we should render something else in the meantime
setup().then(async (result) => {
  // syncPools(result);
  setupBots(result);

  new Phaser.Game({
    ...config,
    scene: [new GameScene(result), new UIScene(result, config)],
  });

  root.render(
    <MUDProvider value={result}>
      <span className="font-['MedievalSharp'] opacity-0"></span>
      <span className="font-['Macondo'] opacity-0"></span>
      <span className="font-['ThaleahFat'] opacity-0"></span>
      <span className="font-['Roboto_Mono'] opacity-0"></span>
      <App />
    </MUDProvider>
  );

  // https://vitejs.dev/guide/env-and-mode.html
  if (import.meta.env.DEV) {
    const { mount: mountDevTools } = await import("@latticexyz/dev-tools");
    mountDevTools({
      config: mudConfig,
      publicClient: result.network.publicClient,
      walletClient: result.network.walletClient,
      latestBlock$: result.network.latestBlock$,
      storedBlockLogs$: result.network.storedBlockLogs$,
      worldAddress: result.network.worldContract.address,
      worldAbi: result.network.worldContract.abi,
      write$: result.network.write$,
      recsWorld: result.network.world,
    });
  }
});
