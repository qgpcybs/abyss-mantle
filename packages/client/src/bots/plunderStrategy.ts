import { roleAndHostWithinRange } from "../logics/building";
import { getReadyStakersInRange } from "./actions/stake";
import { WalkToHostSubStrategy } from "./moveSubStrategy";
import {
  Strategy,
  SubStrategy,
  StrategyParams,
  StrategyState,
} from "./strategy";

export class PlunderStrategy implements Strategy {
  name = "plunder";
  subStrategies: SubStrategy[] = [new WalkToHostSubStrategy()];

  async updateState(params: StrategyParams): Promise<StrategyState> {
    return params.state;
  }

  async execute(params: StrategyParams): Promise<StrategyState> {
    const { components, bot, state } = params;
    const updatedState = await this.updateState(params);
    const stakers = getReadyStakersInRange(params);
    console.log("stakers", stakers);
    if (stakers.length !== 0) {
      const inRange = roleAndHostWithinRange(
        components,
        bot.entity,
        stakers[0]
      );
      if (inRange) {
        bot.claim(stakers[0]);
      } else {
        const walkToHost = new WalkToHostSubStrategy();
        walkToHost.execute({
          ...params,
          state: { ...params.state, target: stakers[0] },
        });
      }
    } else {
      const walkToHost = new WalkToHostSubStrategy();
      walkToHost.execute(params);
    }
    return params.state;
  }
}
