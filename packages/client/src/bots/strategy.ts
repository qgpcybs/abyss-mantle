// strategy-selector

import { Entity } from "@latticexyz/recs";
import { ClientComponents } from "../mud/createClientComponents";
import { Bot } from "./Bot";
import { CombatSubStrategy } from "./combatSubStrategy";
import {
  RandomWalkSubStrategy,
  WalkToCoordSubStrategy,
  WalkToHostSubStrategy,
} from "./moveSubStrategy";
import { Vector } from "../utils/vector";
import { SystemCalls } from "../mud/createSystemCalls";
import { SetupResult } from "../mud/setup";
import { getPosition } from "../logics/path";
import { EliminationStrategy } from "./attackStrategy";
import { PlunderStrategy } from "./plunderStrategy";

export const updateInterval = 2;

export interface StrategyState {
  currStrategy?: string;
  prevStrategy?: string;
  strategies?: Strategy[];
  phase?: string;
  target?: Entity;
  targetCoord?: Vector;
  violence?: boolean;
  lastUpdated?: number;
}

export interface StrategyParams {
  components: ClientComponents;
  systemCalls: SystemCalls;
  bot: Bot;
  state: StrategyState;
}

export interface SubStrategy {
  name: string;
  execute: (params: StrategyParams) => Promise<StrategyState>;
}

export interface Strategy {
  name: string;
  // Collection of sub-strategies
  subStrategies: SubStrategy[];

  // Core method to update strategy state
  updateState: (params: StrategyParams) => Promise<StrategyState>;

  // Execute the current strategy
  execute: (params: StrategyParams) => Promise<StrategyState>;
}

export class ExplorationStrategy implements Strategy {
  name = "exploration";
  // subStrategies: SubStrategy[] = [new RandomWalkSubStrategy()];
  subStrategies: SubStrategy[] = [
    new WalkToCoordSubStrategy(),
    new WalkToHostSubStrategy(),
    new RandomWalkSubStrategy(),
  ];

  async updateState(params: StrategyParams): Promise<StrategyState> {
    // console.log("update state", bot.entity);
    // Logic to determine the next state based on current conditions
    const { state } = params;
    if (!state.targetCoord) {
      // If no target, set a random exploration target
      return {
        ...state,
        phase: "randomWalk",
      };
    }

    // Check if current target is reached or invalid
    // TODO

    return state;
  }

  async execute(params: StrategyParams): Promise<StrategyState> {
    const { components, systemCalls, bot, state } = params;
    // Update state first
    const updatedState = await this.updateState(params);

    // Select appropriate sub-strategy
    const subStrategy = this.selectSubStrategy(updatedState);

    if (subStrategy) {
      // Execute selected sub-strategy
      return subStrategy.execute(params);
    }

    return updatedState;
  }

  private selectSubStrategy(state: StrategyState): SubStrategy | undefined {
    // Logic to select the most appropriate sub-strategy
    console.log("select sub strategy", state);
    if (state.target) {
      console.log("target", state.target);
      return this.subStrategies.find((s) => s.name === "WalkToHostSub");
    } else if (state.targetCoord) {
      return this.subStrategies.find((s) => s.name === "WalkToCoordSub");
    }
    return this.subStrategies.find((s) => s.name === "RandomWalkSub");
  }

  // // Utility method to add a new sub-strategy
  // addSubStrategy(strategy: SubStrategy) {
  //   this.subStrategies.push(strategy);
  // }
}

export const strategyMapping = {
  exploration: ExplorationStrategy,
  elimination: EliminationStrategy,
  plunder: PlunderStrategy,
};
export function stringToStrategy(strategyName: string): Strategy | undefined {
  const StrategyClass =
    strategyMapping[strategyName as keyof typeof strategyMapping];
  if (StrategyClass) {
    return new StrategyClass();
  }
  return undefined;
}
