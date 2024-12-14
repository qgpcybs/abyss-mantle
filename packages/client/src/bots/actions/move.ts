import { Entity } from "@latticexyz/recs";
import { calculatePathToTargetCoord } from "../../logics/move";
import { getPosition } from "../../logics/path";
import { ClientComponents } from "../../mud/createClientComponents";
import { SystemCalls } from "../../mud/createSystemCalls";
import { subVectors, Vector } from "../../utils/vector";
import { StrategyParams } from "../strategy";

// check if has arrived to targetCoord
export const arrivedTargetCoord = (
  params: StrategyParams
): boolean | undefined => {
  const {
    components,
    bot,
    state: { targetCoord },
  } = params;
  if (!targetCoord) return;
  const currCoord = getPosition(components, bot.entity);
  if (!currCoord) return;
  if (targetCoord.x === currCoord.x && targetCoord.y === currCoord.y)
    return true;
  return false;
};

// check if within max moves for 1 move() to complete
export const withinMaxMoves = (params: StrategyParams): boolean | undefined => {
  const {
    components,
    bot,
    state: { targetCoord },
  } = params;
  if (!targetCoord) return;
  const currCoord = getPosition(components, bot.entity);
  if (!currCoord) return;
  const dVector = subVectors(targetCoord, currCoord);
  const movesAmount = Math.abs(dVector.x) + Math.abs(dVector.y);
  if (movesAmount > 20) return false;
  return true;
};

// estimate next position to got to when movesAmount > 20
export const estimateNextCoord = (
  params: StrategyParams
): Vector | undefined => {
  const {
    components,
    systemCalls,
    bot,
    state: { targetCoord },
  } = params;
  if (!targetCoord) return;
  const currCoord = getPosition(components, bot.entity);
  if (!currCoord) return;
  const dVector = subVectors(targetCoord, currCoord);
  const movesAmount = Math.abs(dVector.x) + Math.abs(dVector.y);

  if (movesAmount > 20) {
    const scale = 20 / movesAmount;
    dVector.x = Math.round(dVector.x * scale);
    dVector.y = Math.round(dVector.y * scale);
  }

  return {
    x: currCoord.x + dVector.x,
    y: currCoord.y + dVector.y,
  };
};

// assume targetCoord is within max moves
export const calcNextCoordWithin = (
  params: StrategyParams,
  iterations = 3
): Vector | undefined => {
  const {
    components,
    systemCalls,
    bot,
    state: { targetCoord },
  } = params;
  if (!targetCoord) return;
  const currCoord = getPosition(components, bot.entity);
  if (!currCoord) return;
  const dVector = subVectors(targetCoord, currCoord);
  for (
    let dx = 0, i = 0;
    Math.abs(dx) < Math.abs(dVector.x) && i < iterations;
    dx += Math.sign(dVector.x), i++
  ) {
    for (
      let dy = 0, j = 0;
      Math.abs(dy) <= Math.abs(dVector.y) && j < iterations;
      dy += Math.sign(dVector.y), j++
    ) {
      const nextCoord = {
        x: targetCoord.x - dx,
        y: targetCoord.y - dy,
      };
      const path = calculatePathToTargetCoord(
        components,
        systemCalls,
        bot.entity,
        nextCoord
      );
      if (path) {
        return nextCoord;
      }
    }
  }
  return undefined;
};

// calc next position to got to
export const calcNextCoord = (params: StrategyParams): Vector | undefined => {
  if (arrivedTargetCoord(params) !== false) return;

  const withinMax = withinMaxMoves(params);
  if (withinMax) {
    return calcNextCoordWithin(params);
  }
  const nextCoord = estimateNextCoord(params);
  if (!nextCoord) return;
  return calcNextCoordWithin({ ...params, state: { targetCoord: nextCoord } });
};
