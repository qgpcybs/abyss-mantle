import { defineEnterSystem, HasValue, runQuery } from "@latticexyz/recs";
import { SetupResult } from "./setup";
import { Bot } from "../bots/Bot";

export function setupBots(result: SetupResult) {
  const {
    components: { Commander },
    systemCalls: { move, spawnHero },
    network: { playerEntity, world },
  } = result;

  defineEnterSystem(
    world,
    [HasValue(Commander, { value: playerEntity })],
    ({ entity }) => {
      new Bot(result, entity);
    }
  );
}
