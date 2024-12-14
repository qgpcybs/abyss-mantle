import { Hex } from "viem";
import { ClientComponents } from "../mud/createClientComponents";
import { getBurnData, getCraftData } from "./convert";
import {
  Entity,
  getComponentValue,
  Has,
  HasValue,
  runQuery,
} from "@latticexyz/recs";
import { decodeTypeEntity, encodeTypeEntity } from "../utils/encode";
import { getCoordsWithinRadius, Vector } from "../utils/vector";
import { getEntitySpecs, getTopHost } from "./entity";
import { SystemCalls } from "../mud/createSystemCalls";
import { getTerrainEntityType, getTerrainType } from "./terrain";
import { getCoordId } from "./map";
import {
  getHostPosition,
  getPathEntityPosition,
  getTileEntityPositions,
} from "./path";
import { getFourCoords, splitFromEntity } from "./move";
import { adjacent } from "./position";
import { SetupNetworkResult } from "../mud/setupNetwork";
import { canStoreERC721 } from "./container";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";

export const roleAndHostWithinRange = (
  components: ClientComponents,
  role: Entity,
  host: Entity,
  range?: number
) => {
  range = range ?? 1;
  const coord = getRoleAndHostAdjacentCoord(components, role, host);
  if (!coord) return false;
  return true;
};

// use to get coords to transfer; can also adapted to get coords to enter, to stake, to cook?
export const getHostsAdjacentCoord = (
  components: ClientComponents,
  hostA: Entity,
  hostB: Entity
) => {
  const hostAPositions = getTileEntityPositions(components, hostA);
  const hostBPositions = getTileEntityPositions(components, hostB);
  if (!hostAPositions || !hostBPositions) return;
  const adjacentPositions = hostAPositions.flatMap((hostAPosition) =>
    hostBPositions
      .filter((hostBPosition) => adjacent(hostAPosition, hostBPosition))
      .map((hostBPosition) => ({ hostAPosition, hostBPosition }))
  );
  return adjacentPositions.length > 0 ? adjacentPositions[0] : undefined;
};

// used to get coord to enter building, to stake, & to cook
export const getRoleAndHostAdjacentCoord = (
  components: ClientComponents,
  role: Entity,
  host: Entity
) => {
  const rolePosition = getPathEntityPosition(components, role);
  const hostPositions = getTileEntityPositions(components, host);
  if (!rolePosition || !hostPositions) return;
  return hostPositions.find((hostPosition) =>
    adjacent(rolePosition, hostPosition)
  );
};

// check if building can store role, which means if role can enter building
export const canRoleEnter = (
  components: ClientComponents,
  role: Entity,
  building: Entity
) => {
  return canStoreERC721(components, role, building);
};

// can only exit when owner is a TileEntity value
export const canExit = (components: ClientComponents, entity: Entity) => {
  const { Owner, TileEntity } = components;
  const owner = getComponentValue(Owner, entity)?.value;
  const tileIds = [...runQuery([HasValue(TileEntity, { value: owner })])];
  return tileIds.length > 0;
};

export const useCanExit = (components: ClientComponents, entity: Entity) => {
  const { Owner, TileEntity } = components;
  const owner = useComponentValue(Owner, entity)?.value;
  const tileIds = useEntityQuery([HasValue(TileEntity, { value: owner })]);
  return tileIds.length > 0;
};

// return an building coord that is adjacent (range=1) to a tile coord;
// so that player can call exitBuilding()
// for example, building is at (2,2) & (2,3), tile is at (3,2), return (2,2)
export const getBuildingCoordToExit = (
  components: ClientComponents,
  building: Hex,
  exitCoord: Vector
) => {
  const tileIds = getAllBuildingTileIds(components, building);
  const tileCoords = tileIds.map((tileId) => splitFromEntity(tileId));
  const adjacentCoord = tileCoords.find((coord) => adjacent(coord, exitCoord));
  if (!adjacentCoord) return;
  return adjacentCoord;
};

export const getAllBuildingTileIds = (
  components: ClientComponents,
  building: Hex
) => {
  const { TileEntity } = components;
  return [...runQuery([HasValue(TileEntity, { value: building })])];
};

// if top host is role, it has path; it top host is building, it has no path
export const getNestedHostPosition = (
  components: ClientComponents,
  network: SetupNetworkResult,
  host: Entity
) => {
  const topHost = getTopHost(components, network, host) as Entity;
  if (!topHost) return;
  const position = getPathEntityPosition(components, topHost);
  if (position) return position;
  const coordIds = getAllBuildingTileIds(components, topHost as Hex);
  if (!coordIds.length) return;
  return splitFromEntity(coordIds[0]);
};

export const getAllBuildingTypes = (components: ClientComponents) => {
  const buildingTypes = runQuery([Has(components.BuildingSpecs)]);
  return [...buildingTypes].map(
    (entity) => decodeTypeEntity(entity as Hex) as Hex
  );
};

export const getHasCostBuildingTypes = (
  components: ClientComponents,
  role: Hex
) => {
  const allBuildingTypes = getAllBuildingTypes(components);
  return allBuildingTypes.filter((buildingType) => {
    const data = getBuildingTypeData(components, role, buildingType);
    return data.craftData.hasCosts;
  });
};

// this return building info like burnData, craftData
export const getBuildingTypeData = (
  components: ClientComponents,
  role: Hex = "" as Hex,
  buildingType: Hex
) => {
  const craftData = getCraftData(components, role, buildingType);
  const burnData = getBurnData(components, role, buildingType);
  // TODO: add upgrade info; and building specific functionalities?
  return { craftData, burnData };
};

// return which host's adjacent tile coord player can build building
// if cannot, return undefined
export const canBuildFromHost = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  role: Entity,
  lowerCoord: Vector,
  buildingType: Hex
) => {
  const coord = getPathEntityPosition(components, role);
  if (!coord) return;
  const fourCoords = getFourCoords(coord);
  return fourCoords.find((coord) =>
    canBuildFromLowerCoord(
      components,
      systemCalls,
      coord,
      lowerCoord,
      buildingType
    )
  );
};

// check if building type can be built on the rectangle starting from lower coord
// similar to logics in contract
export const canBuildFromLowerCoord = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  coord: Vector,
  lowerCoord: Vector,
  buildingType: Hex
) => {
  const { BuildingSpecs } = components;
  const width = getComponentValue(
    BuildingSpecs,
    encodeTypeEntity(buildingType) as Entity
  )?.width;
  const height = getComponentValue(
    BuildingSpecs,
    encodeTypeEntity(buildingType) as Entity
  )?.height;
  if (!width || !height) return false;
  const tileCoords = getRectangleCoordsStrict(coord, lowerCoord, width, height);
  if (!tileCoords) return false;
  return canBuildOnTiles(components, systemCalls, tileCoords, buildingType);
};

// get all coords that player can build building, {lowerCoord, adjacentCoord}[]
export const getBuildableCoordsInfo = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  role: Entity,
  buildingType: Hex
) => {
  const coord = getPathEntityPosition(components, role);
  if (!coord) return;
  const buildingSpecs = getComponentValue(
    components.BuildingSpecs,
    encodeTypeEntity(buildingType) as Entity
  );
  if (!buildingSpecs) return;
  const { width, height } = buildingSpecs;
  const lowerCoords = getCoordsWithinRadius(coord, Math.max(width, height));
  const coordsInfo = lowerCoords
    .map((lowerCoord) => ({
      lowerCoord,
      adjacentCoord: canBuildFromHost(
        components,
        systemCalls,
        role,
        lowerCoord,
        buildingType
      ),
    }))
    .filter(({ adjacentCoord }) => adjacentCoord);
  return coordsInfo;
};

export const getRectangleCoordsStrict = (
  coord: Vector,
  lowerCoord: Vector,
  width: number,
  height: number
) => {
  const upperCoord = {
    x: lowerCoord.x + width - 1,
    y: lowerCoord.y + height - 1,
  };
  const tileCoords = [];
  let isWithin = false;
  for (let x = lowerCoord.x; x <= upperCoord.x; x++) {
    for (let y = lowerCoord.y; y <= upperCoord.y; y++) {
      if (x === coord.x && y === coord.y) {
        isWithin = true;
      }
      tileCoords.push({ x, y });
    }
  }
  if (!isWithin) return;
  return tileCoords;
};

export const canBuildOnTiles = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  tileCoords: Vector[],
  buildingType: Hex
) => {
  return tileCoords.every((tileCoord) =>
    canBuildOnTile(components, systemCalls, tileCoord, buildingType)
  );
};

// check if building type can be built on tile id
// diff from contract, this also checks TileEntity table
export const canBuildOnTile = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  tileCoord: Vector,
  buildingType: Hex
) => {
  const terrainEntityType = getTerrainEntityType(
    components,
    systemCalls,
    tileCoord
  );
  const tileEntity = getTileEntity(components, tileCoord);
  if (tileEntity) return false;
  return canBuildingOnTerrain(components, terrainEntityType, buildingType);
};

export const getTileEntity = (
  components: ClientComponents,
  tileCoord: Vector
) => {
  const coordId = getCoordId(tileCoord.x, tileCoord.y) as Entity;
  const tileEntity = getComponentValue(components.TileEntity, coordId)?.value;
  return tileEntity;
};

// check if building type can be built on terrain type
export const canBuildingOnTerrain = (
  components: ClientComponents,
  terrainType: Hex,
  buildingType: Hex
) => {
  const buildingTypeEntity = encodeTypeEntity(buildingType) as Entity;
  return (
    (getComponentValue(components.BuildingSpecs, buildingTypeEntity)
      ?.terrainType as Hex) === terrainType
  );
};

export const canMoveToBuilding = (
  components: ClientComponents,
  building: Entity,
  entity?: Entity
) => {
  const canMove = getEntitySpecs(
    components,
    components.BuildingSpecs,
    building
  )?.canMove;
  return canMove ? true : false;
};
