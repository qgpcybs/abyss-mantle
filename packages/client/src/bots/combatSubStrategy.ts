// combat strategy

import { ClientComponents } from "../mud/createClientComponents";
import { getEnemiesInRange } from "./actions/attack";
import { Bot } from "./Bot";
import { WalkToHostSubStrategy } from "./moveSubStrategy";
import { StrategyParams, StrategyState, SubStrategy } from "./strategy";

export class CombatSubStrategy implements SubStrategy {
  name = "CombatSub";
  async execute(params: StrategyParams) {
    const enemies = getEnemiesInRange(params);
    const walkToHost = new WalkToHostSubStrategy();
    if (enemies.length === 0) return walkToHost.execute(params);
    walkToHost.execute({
      ...params,
      state: { ...params.state, target: enemies[0] },
    });
    if (!params.state.target) return params.state;
    console.log("executing combatsub", enemies[0]);

    params.bot.attack(enemies[0]);
    return params.state;
  }
}
