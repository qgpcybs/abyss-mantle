import { Entity } from "@latticexyz/recs";
import { getEntitiesinRange } from "../../logics/map";
import { getPosition } from "../../logics/path";
import { hasReadyStaking, hasStaking } from "../../logics/stake";
import { StrategyParams } from "../strategy";

// return buildings that have stakings ready to claim
export const getReadyStakersInRange = (
  params: StrategyParams,
  range = 5
): Entity[] => {
  const { components, bot } = params;
  const { Creator } = components;
  const currCoord = getPosition(components, bot.entity);
  if (!currCoord) return [];
  const entities = getEntitiesinRange(components, currCoord, range);
  const buildings = entities.filter((entity) => {
    return hasReadyStaking(components, entity);
  });
  return buildings;
};
