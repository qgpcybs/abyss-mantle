// movement strategy - a sub strategy

import { subVectors, Vector, vectorToMagnitude } from "../utils/vector";
import { ClientComponents } from "../mud/createClientComponents";
import { Bot } from "./Bot";
import { getPosition } from "../logics/path";
import { randomInt } from "../utils/random";
import { StrategyParams, StrategyState, SubStrategy } from "./strategy";
import { unixTimeSecond } from "../utils/time";
import { SystemCalls } from "../mud/createSystemCalls";
import { Entity } from "@latticexyz/recs";
import { calculatePathToTargetCoord } from "../logics/move";
import { arrivedTargetCoord, calcNextCoord } from "./actions/move";

/**
 * components: include all game states
 */
export interface MoveSubStrategy extends SubStrategy {
  execute(params: StrategyParams): Promise<StrategyState>;
  calculateNextPosition(params: StrategyParams): Vector | undefined;
}

export class RandomWalkSubStrategy implements MoveSubStrategy {
  name = "RandomWalkSub";
  async execute(params: StrategyParams) {
    const { components, bot, state } = params;
    const maxAttempts = 3;
    for (let i = 0; i < maxAttempts; i++) {
      const nextPosition = this.calculateNextPosition(params);
      if (!nextPosition) continue;
      try {
        await bot.move(nextPosition);
        return state;
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
      }
    }
    return state;
  }

  calculateNextPosition(params: StrategyParams) {
    const { components, bot } = params;
    const position = getPosition(components, bot.entity);
    if (!position) return;
    const x = position.x + Math.floor(Math.random() * 11) - 5;
    const y = position.y + Math.floor(Math.random() * 11) - 5;
    return { x, y };
  }
}

export class WalkToCoordSubStrategy implements MoveSubStrategy {
  name = "WalkToCoordSub";
  async execute(params: StrategyParams) {
    const { components, systemCalls, bot, state } = params;
    const position = getPosition(components, bot.entity);
    if (!position) return state;
    const targetCoord = state.targetCoord;
    if (!targetCoord) return state;
    const nextPosition = this.calculateNextPosition(params);
    if (nextPosition === position) return state;
    if (!nextPosition) {
      return new RandomWalkSubStrategy().execute(params);
    }
    try {
      await bot.move(nextPosition);
      return state;
    } catch (error) {
      console.error(error);
    }

    return state;
  }

  calculateNextPosition(params: StrategyParams): Vector | undefined {
    const {
      components,
      systemCalls,
      bot,
      state: { targetCoord },
    } = params;
    if (!targetCoord) return;
    const currCoord = getPosition(components, bot.entity);
    if (!currCoord) return;
    const s = subVectors(targetCoord, currCoord);
    const magnitude = vectorToMagnitude(s);
    const dS =
      magnitude > 15
        ? {
            x: Math.floor((s.x / magnitude) * 15),
            y: Math.floor((s.y / magnitude) * 15),
          }
        : s;
    for (const dx of [0, 1, -1, 2, -2]) {
      for (const dy of [0, 1, -1, 2, -2]) {
        const nextPosition = {
          x: currCoord.x + dS.x + dx,
          y: currCoord.y + dS.y + dy,
        };
        const path = calculatePathToTargetCoord(
          components,
          systemCalls,
          bot.entity,
          nextPosition
        );
        if (path !== undefined) {
          return nextPosition;
        }
      }
    }
    return undefined;
  }
}

export class WalkToHostSubStrategy implements MoveSubStrategy {
  name = "WalkToHostSub";
  async execute(params: StrategyParams) {
    const { components, systemCalls, bot, state } = params;
    const currPosition = getPosition(components, bot.entity);
    const nextPosition = this.calculateNextPosition(params);
    // arrived!
    if (nextPosition === currPosition) return state;
    if (!nextPosition) {
      console.log("No path found, random walk");
      return new RandomWalkSubStrategy().execute(params);
    }
    try {
      await bot.move(nextPosition);
      return state;
    } catch (error) {
      console.error(error);
    }

    return state;
  }

  calculateNextPosition(params: StrategyParams): Vector | undefined {
    const { components, bot, state } = params;
    if (!state.target) return;
    const position = getPosition(components, bot.entity);
    if (!position) return;
    const hostCoord = getPosition(components, state.target);
    if (!hostCoord) return;
    const neighborCoords = [
      { x: hostCoord.x, y: hostCoord.y + 1 },
      { x: hostCoord.x, y: hostCoord.y - 1 },
      { x: hostCoord.x + 1, y: hostCoord.y },
      { x: hostCoord.x - 1, y: hostCoord.y },
    ];
    // arrived!
    for (const coord of neighborCoords) {
      console.log("coord", coord, position);
      if (
        arrivedTargetCoord({
          ...params,
          state: {
            targetCoord: coord,
          },
        })
      ) {
        console.log("arrived at host");
        return position;
      }
    }
    for (const coord of neighborCoords) {
      const nextCoord = calcNextCoord({
        ...params,
        state: { targetCoord: coord },
      });
      if (nextCoord) return nextCoord;
    }
    return;
  }
}
