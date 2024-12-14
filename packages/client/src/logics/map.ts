import { TerrainType, terrainTypeMapping } from "../constants";
import { SystemCalls } from "../mud/createSystemCalls";
import { ClientComponents } from "../mud/createClientComponents";
import { Entity, getComponentValue } from "@latticexyz/recs";
import { castToBytes32, encodeTypeEntity } from "../utils/encode";
import { combine } from "./move";
import { getTerrainType } from "./terrain";
import { Vector } from "../utils/vector";

export const getEntityOnCoord = (
  components: ClientComponents,
  position: Vector
) => {
  const coordId = getCoordId(position.x, position.y) as Entity;
  return getComponentValue(components.TileEntity, coordId)?.value as Entity;
};

export const canMoveTo = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  position: Vector
) => {
  const { TileEntity, TerrainSpecs } = components;
  const terrain = getTerrainType(components, systemCalls, position);
  const terrainType = terrainTypeMapping[terrain];
  const terrainTypeEntity = encodeTypeEntity(terrainType) as Entity;
  const terrainCanMove =
    getComponentValue(TerrainSpecs, terrainTypeEntity)?.canMove ?? true;

  const hasEntity = hasEntityOnCoord(components, position);
  // console.log("hasEntity", coordId, hasEntity);
  // console.log("canMoveTo", position, terrainType, terrainCanMove, hasEntity);
  return terrainCanMove && !hasEntity;
};

export function getCoordId(x: number, y: number) {
  const id = (BigInt(x) << BigInt(128)) | BigInt(y);
  return castToBytes32(id);
}

export const hasEntityOnCoord = (
  components: ClientComponents,
  position: Vector
) => {
  const coordId = getCoordId(position.x, position.y) as Entity;
  return getComponentValue(components.TileEntity, coordId) ? true : false;
};

// return coords that is in range with the given vector
export const getCoordsInRange = (vector: Vector, range = 5): Vector[] => {
  const coords = [];
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (dx !== 0 || dy !== 0) {
        coords.push({ x: vector.x + dx, y: vector.y + dy });
      }
    }
  }
  return coords;
};

// return entities that is in range with the given vector
export const getEntitiesinRange = (
  components: ClientComponents,
  position: Vector,
  range = 5
): Entity[] => {
  const coords = getCoordsInRange(position, range);
  const entities = coords
    .map((coord) => getEntityOnCoord(components, coord))
    .filter((entity): entity is Entity => !!entity);
  return entities;
  // return entities.filter(
  //   (entity, index, self) => self.indexOf(entity) === index
  // );
};
