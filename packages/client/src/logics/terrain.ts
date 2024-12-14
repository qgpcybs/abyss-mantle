import { Hex } from "viem";
import { ClientComponents } from "../mud/createClientComponents";
import { getBurnData, getCraftData, getInteractData } from "./convert";
import {
  Entity,
  HasValue,
  getComponentValue,
  runQuery,
} from "@latticexyz/recs";
import {
  decodeTypeEntity,
  encodeTypeEntity,
  fromEntity,
} from "../utils/encode";
import { SOURCE, terrainTypeMapping, TerrainType, TARGET } from "../constants";
import {
  combine,
  combineToEntity,
  getDirectionCoord,
  getTerrainOnDirection,
  splitFromEntity,
} from "./move";
import { SystemCalls } from "../mud/createSystemCalls";
import { Vector } from "../utils/vector";
import { getCoordId, getEntityOnCoord } from "./map";
import { PERLIN_DENOM } from "../contract/constants";

export const GRID_SIZE = 8;

export const getPerlin = (systemCalls: SystemCalls, position: Vector) => {
  return systemCalls.getNoise(position.x, position.y, PERLIN_DENOM);
};

export const noiseToTerrainType = (noise: number) => {
  if (25 <= noise && noise < 30) return TerrainType.MOUNTAIN;
  if (44 <= noise && noise < 55) return TerrainType.OCEAN;
  if (65 <= noise && noise < 70) return TerrainType.FOREST;
  // this is client part to render mud
  if (noise < 10 || (35 <= noise && noise < 40) || (57 <= noise && noise < 61))
    return TerrainType.MUD;
  return TerrainType.PLAIN;
};

export const noiseToTerrainEntity = (noise: number) => {
  const terrain = noiseToTerrainType(noise);
  return terrainTypeMapping[terrain];
};

export const getTerrainType = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  position: Vector
): TerrainType => {
  const terrain = getTerrainFromTable(components, systemCalls, position);
  if (terrain !== TerrainType.NONE) return terrain;
  return noiseToTerrainType(getPerlin(systemCalls, position));
};

// get terrain type from Terrain table
export const getTerrainFromTable = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  position: Vector
): TerrainType => {
  const { Terrain } = components;
  const gridX = Math.floor(position.x / GRID_SIZE);
  const gridY = Math.floor(position.y / GRID_SIZE);
  const gridId = getCoordId(gridX, gridY) as Entity;
  const terrainValues = getComponentValue(Terrain, gridId)?.value ?? 0n;

  const offsetX = position.x % GRID_SIZE;
  const offsetY = position.y % GRID_SIZE;
  const shift = offsetX + offsetY * GRID_SIZE;
  const terrainValue = ((terrainValues as bigint) >> BigInt(shift * 4)) & 15n;
  return Number(terrainValue) as TerrainType;
  // const jsonStr = localStorage.getItem(coordId);
  // if (jsonStr) return JSON.parse(jsonStr).terrain ?? TerrainType.NONE;
  // const noise = getPerlin(systemCalls, position);
  // const terrain = noiseToTerrainType(noise) as number;
  // localStorage.setItem(coordId, JSON.stringify({ terrain }));
  // return terrain;
};

export const enumToEntityType = (terrainType: TerrainType) => {
  return terrainTypeMapping[terrainType];
};

export const getTerrainEntityType = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  coord: Vector
) => {
  return enumToEntityType(getTerrainType(components, systemCalls, coord));
};

// ----------------- localStorage & clientComponent -----------------
// i, j are tile's position in 8x8 grid
export type TileTerrain = { i: number; j: number; terrainType: number };
// x, y are tile's position in the whole map
export type TileTerrainMap = { x: number; y: number; terrainType: number };

/**
 * get tile's terrain from TerrainValues table; might not be accurate when Terrain table changes value, use getTerrainType() instead
 */
export const getTileTerrain = (
  components: ClientComponents,
  tileCoord: Vector
) => {
  const gridCoord = {
    x: Math.floor(tileCoord.x / GRID_SIZE),
    y: Math.floor(tileCoord.y / GRID_SIZE),
  };
  const gridId = combineToEntity(gridCoord.x, gridCoord.y);
  const terrainValues =
    getComponentValue(components.TerrainValues, gridId)?.value ?? 0n;
  const offsetX = tileCoord.x % GRID_SIZE;
  const offsetY = tileCoord.y % GRID_SIZE;
  const shift = offsetX + offsetY * GRID_SIZE;
  const terrainValue = ((terrainValues as bigint) >> BigInt(shift * 4)) & 15n;
  return Number(terrainValue);
};

export const getGridTileIds = (gridCoord: Vector) => {
  const tileIds: Entity[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      tileIds.push(
        combineToEntity(
          gridCoord.x * GRID_SIZE + i,
          gridCoord.y * GRID_SIZE + j
        )
      );
    }
  }
  return tileIds;
};

// decode terrainValues to terrain maps for 1 grid
export const getGridTerrains = (
  components: ClientComponents,
  gridId: Entity
): TileTerrainMap[] => {
  const { x, y } = splitFromEntity(gridId);
  const terrainValues = getComponentValue(
    components.TerrainValues,
    gridId
  )?.value;
  const terrainTypes = decodeGridTerrainValues(terrainValues ?? 0n);
  return terrainTypes.map(({ i, j, terrainType }) => {
    return { x: x * GRID_SIZE + i, y: y * GRID_SIZE + j, terrainType };
  });
};

// decode terrainValues to terrain maps for 1 grid
export const decodeGridTerrainValues = (terrainValues: bigint) => {
  const terrainTypes: TileTerrain[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const shift = i + j * GRID_SIZE;
      const terrainType = Number((terrainValues >> BigInt(shift * 4)) & 15n);
      terrainTypes.push({ i, j, terrainType });
    }
  }
  return terrainTypes;
};

// compile uint256 terrain type values for 1 grid; so that it can be stored in TerrainValues; also used to set in contract
export const compileGridTerrainValues = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  gridId: Entity
): bigint => {
  const terrainTypes = compileGridTerrainTypes(components, systemCalls, gridId);
  return convertTerrainTypesToValues(terrainTypes);
};

export const convertTerrainTypesToValues = (terrainTypes: TileTerrain[]) => {
  let terrainValues: bigint = 0n;
  terrainTypes.forEach(({ i, j, terrainType }) => {
    const shift = i + j * GRID_SIZE;
    terrainValues |= BigInt(terrainType) << BigInt(shift * 4);
  });
  return terrainValues;
};

// compile 8x8 terrain types for 1 grid from perlin & Terrain table
export const compileGridTerrainTypes = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  gridId: Entity
) => {
  const terrainValues = getComponentValue(components.Terrain, gridId)?.value;
  // console.log("terrainValues", gridId, terrainValues);
  const gridCoord = splitFromEntity(gridId);
  const tileTerrains: TileTerrain[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const shift = i + j * GRID_SIZE;
      const tileCoord = {
        x: gridCoord.x * GRID_SIZE + i,
        y: gridCoord.y * GRID_SIZE + j,
      };
      const terrain = Number(
        ((terrainValues ?? 0n) >> BigInt(shift * 4)) & 15n
      );
      // terrain !== Number(TerrainType.NONE) &&
      //   console.log("terrain", terrain, tileCoord);
      // terrainValues !== undefined &&
      //   console.log("terrainValues", terrainValues, tileCoord);
      const terrainType =
        terrain === Number(TerrainType.NONE)
          ? noiseToTerrainType(getPerlin(systemCalls, tileCoord))
          : terrain;
      tileTerrains.push({
        i,
        j,
        terrainType,
      });
    }
  }
  return tileTerrains;
};

export interface TileData {
  targetCoord: {
    x: number;
    y: number;
  };
  terrainType: TerrainType;
  coordEntity: Entity;
  commander: Entity;
  creator: Entity;
}

// get source host's target tile terrain data
export const getTargetTerrainData = (
  components: ClientComponents,
  systemCalls: SystemCalls
): TileData | undefined => {
  const tileId = getComponentValue(components.TargetTile, TARGET)?.value;
  if (!tileId) return;
  const targetCoord = splitFromEntity(tileId);
  return {
    ...getTerrainData(components, systemCalls, targetCoord),
    targetCoord,
  };
};

// get terrain data from tables instead of clientside table TerrainValues; thus, no MUD or BUILDING type
export const getTerrainData = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  coord: Vector
) => {
  const terrainType = getTerrainType(components, systemCalls, coord);
  const coordEntity = getEntityOnCoord(components, coord);
  // const { type, id } = fromEntity(coordEntity as Hex);
  const commander = getComponentValue(components.Commander, coordEntity)
    ?.value as Entity;
  const creator = getComponentValue(components.Creator, coordEntity)
    ?.value as Entity;
  return { terrainType, coordEntity, commander, creator };
};

// ----------------------------------

// depreciated
// assumes host's direction is the selected terrain
export const getSelectedTerrainData = (components: ClientComponents) => {
  const { SelectedHost, Moves } = components;
  const host = getComponentValue(SelectedHost, SOURCE)?.value as Entity;
  const toPosition = getDirectionCoord(components, host);
  const terrainValue = getTerrainOnDirection(components, host) ?? 0;
  const terrainType = terrainTypeMapping[terrainValue as TerrainType];
  const terrainTypeData = getTerrainTypeData(
    components,
    host as Hex,
    terrainType
  );
  return { terrainTypeData, toPosition, terrainValue, host };
};

export const getTerrainFromTerrainValue = (
  components: ClientComponents,
  position: Vector
) => {
  // TODO: coordId is not the same as TerrainValue's coordId
  const coordId = getCoordId(position.x, position.y) as Entity;
  return getComponentValue(
    components.TerrainValue,
    combine(position.x, position.y) as Entity
  )?.value;
};

export const getTerrainTypeData = (
  components: ClientComponents,
  role: Hex = "" as Hex,
  terrainType: Hex
) => {
  const interactData = getInteractData(components, role, terrainType);
  const canBurn = terrainCanBurn(components, terrainType);
  const canMoveOn = terrainCanMoveOn(components, terrainType);
  const burnData = getBurnData(components, role, terrainType);
  const buildableTypes = getBuildableOnTerrain(components, terrainType);
  return { interactData, canBurn, burnData, buildableTypes, canMoveOn };
};

export const terrainCanBurn = (
  components: ClientComponents,
  terrainType: Hex
) => {
  const terrainTypeEntity = encodeTypeEntity(terrainType) as Entity;
  return (
    getComponentValue(components.TerrainSpecs, terrainTypeEntity)?.canBurn ??
    false
  );
};

export const terrainCanMoveOn = (
  components: ClientComponents,
  terrainType: Hex
) => {
  const terrainTypeEntity = encodeTypeEntity(terrainType) as Entity;
  return (
    getComponentValue(components.TerrainSpecs, terrainTypeEntity)?.canMove ??
    false
  );
};

export const getBuildableOnTerrain = (
  components: ClientComponents,
  terrainType: Hex
) => {
  const buildingTypeEntities = [
    ...runQuery([HasValue(components.BuildingSpecs, { terrainType })]),
  ];
  const buildingTypes = buildingTypeEntities.map((entity) =>
    decodeTypeEntity(entity as Hex)
  ) as Hex[];
  return buildingTypes;
};
