import { Entity, getComponentValue } from "@latticexyz/recs";
import { StrategyParams } from "../strategy";
import { getPosition } from "../../logics/path";
import { Vector } from "../../utils/vector";
import { getEntitiesinRange, getEntityOnCoord } from "../../logics/map";

export const getEnemiesInRange = (
  params: StrategyParams,
  range = 5
): Entity[] => {
  const { components, bot } = params;
  const { Commander } = components;
  const commander = getComponentValue(Commander, bot.entity)?.value;
  if (!commander) return [];
  const currCoord = getPosition(components, bot.entity);
  if (!currCoord) return [];
  const entities = getEntitiesinRange(components, currCoord, range);
  const enemies = entities.filter((entity) => {
    const player = getComponentValue(Commander, entity)?.value;
    return player && player !== commander;
  });
  return enemies;
};
