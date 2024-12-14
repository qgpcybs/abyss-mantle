import { Hex } from "viem";
import { ClientComponents } from "../mud/createClientComponents";
import {
  Entity,
  getComponentValue,
  HasValue,
  runQuery,
} from "@latticexyz/recs";
import { SystemCalls } from "../mud/createSystemCalls";
import {
  DOWN_LIMIT_MINE,
  PERLIN_DENOM_MINE,
  UP_LIMIT_MINE,
  PERCENTAGE_MINE,
  GRID_SIZE_MINE,
  DECIMALS,
  MINING_RATE,
} from "../contract/constants";
import { Vector } from "../utils/vector";
import { getCoordId } from "./map";
import { random } from "../utils/random";
import { getAllBuildingTileIds } from "./building";
import { splitFromEntity } from "./move";
import { inCustodian } from "./custodian";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { isBuildingMiner } from "./entity";
import { unixTimeSecond } from "../utils/time";
import useRerender from "../hooks/useRerender";

// checks if a role is mining, i.e., if its mininginfo's buildingId matches its owner custodian
export const isMining = (components: ClientComponents, role: Hex): boolean => {
  const { MiningInfo, Owner } = components;
  const buildingId = getComponentValue(MiningInfo, role as Entity)?.buildingId;
  if (!buildingId) return false;
  return inCustodian(components, buildingId as Entity, role as Entity);
};

/**
 * use all minings in a building
 */
export const useAllMinings = (
  components: ClientComponents,
  building: Entity
) => {
  const { MiningInfo } = components;
  const roleIds = useEntityQuery([
    HasValue(MiningInfo, { buildingId: building }),
  ]);
  return roleIds;
};

export const getAllMinings = (
  components: ClientComponents,
  building: Entity
) => {
  const { MiningInfo } = components;
  const roleIds = [
    ...runQuery([HasValue(MiningInfo, { buildingId: building })]),
  ];
  return roleIds;
};

export const useMiningInfo = (components: ClientComponents, role: Entity) => {
  return useComponentValue(components.MiningInfo, role);
};

export const useMinedAmount = (components: ClientComponents, role: Entity) => {
  useRerender();
  return getMinedAmount(components, role);
};

export const getMinedAmount = (components: ClientComponents, role: Entity) => {
  const miningRate = MINING_RATE;
  const decimals = DECIMALS;
  const miningInfo = getComponentValue(components.MiningInfo, role);
  if (!miningInfo) return;
  const { lastUpdated } = miningInfo;
  const duration = unixTimeSecond() - lastUpdated;
  return (miningRate * duration) / 10 ** decimals;
};

// TODO:
export const getMiningInfo = (components: ClientComponents, role: Hex) => {};

export const getPerlin = (systemCalls: SystemCalls, position: Vector) => {
  return systemCalls.getNoise(position.x, position.y, PERLIN_DENOM_MINE);
};

// returns the tileId of the mine if the role can start mining
export const useStartMineTile = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  role: Entity
) => {
  const { Owner } = components;
  const owner = useComponentValue(Owner, role)?.value as Entity;
  const isMinerType = isBuildingMiner(components, owner);
  if (!isMinerType) return;
  const tileIds = getAllBuildingTileIds(components, owner as Hex);
  const tileId = tileIds.filter((tileId) =>
    hasMineFromTile(systemCalls, splitFromEntity(tileId))
  )[0];
  if (!tileId) return;
  return tileId;
};

export const hasMineFromTile = (
  systemCalls: SystemCalls,
  tileCoord: Vector
) => {
  const gridCoord = {
    x: Math.floor(tileCoord.x / GRID_SIZE_MINE),
    y: Math.floor(tileCoord.y / GRID_SIZE_MINE),
  };
  return hasMineFromGrid(systemCalls, gridCoord);
};

export const hasMineFromGrid = (
  systemCalls: SystemCalls,
  gridCoord: Vector
) => {
  const coordId = getCoordId(gridCoord.x, gridCoord.y);
  const perlin = getPerlin(systemCalls, gridCoord);
  const randomInt = random(coordId, 100);
  return (
    perlin >= DOWN_LIMIT_MINE &&
    perlin <= UP_LIMIT_MINE &&
    randomInt < PERCENTAGE_MINE
  );
};

// return one of the tile coords of the building
export const getMiningHostPosition = (
  components: ClientComponents,
  host: Entity
) => {
  const building = getComponentValue(components.MiningInfo, host)
    ?.buildingId as Hex;
  const coordIds = getAllBuildingTileIds(components, building);
  if (!coordIds.length) return;
  return splitFromEntity(coordIds[0]);
};
