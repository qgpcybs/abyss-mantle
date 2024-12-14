import { CombatSubStrategy } from "./combatSubStrategy";
import {
  RandomWalkSubStrategy,
  WalkToHostSubStrategy,
} from "./moveSubStrategy";
import {
  Strategy,
  StrategyParams,
  StrategyState,
  SubStrategy,
} from "./strategy";

export class EliminationStrategy implements Strategy {
  name = "elimination";
  subStrategies: SubStrategy[] = [
    new CombatSubStrategy(),
    new WalkToHostSubStrategy(),
    new RandomWalkSubStrategy(),
  ];

  async updateState(params: StrategyParams): Promise<StrategyState> {
    return params.state;
  }

  async execute(params: StrategyParams): Promise<StrategyState> {
    const updatedState = await this.updateState(params);
    const subStrategy = this.selectSubStrategy(updatedState);

    if (subStrategy) {
      // Execute selected sub-strategy
      return subStrategy.execute(params);
    }

    return updatedState;
  }

  private selectSubStrategy(state: StrategyState): SubStrategy | undefined {
    if (state.violence) {
      console.log("violence", state.violence);
      return this.subStrategies.find((s) => s.name === "CombatSub");
    } else if (state.target) {
      return this.subStrategies.find((s) => s.name === "WalkToHostSub");
    }
    return this.subStrategies.find((s) => s.name === "RandomWalkSub");
  }
}
