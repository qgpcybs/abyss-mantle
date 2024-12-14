import { Entity } from "@latticexyz/recs";
import { Vector } from "matter";
import { terrainMapping, TerrainType } from "../constants";
import { combineToEntity } from "./move";
import { ClientComponents } from "../mud/createClientComponents";
import { SystemCalls } from "../mud/createSystemCalls";

// neighours are ordered as [left, down, right, up, up-left, down-left, down-right, up-right]
export const getNeighborTerrains = (
  terrains: Record<Entity, TerrainType>,
  position: Vector
) => {
  const coordIds = getNeighborCoordIds(position);
  const neighbors = coordIds.map((id) => terrains[id] ?? TerrainType.NONE);
  return neighbors;
};

export const getNeighborCoordIds = (position: Vector) => {
  const neighbors = [
    combineToEntity(position.x - 1, position.y),
    combineToEntity(position.x, position.y + 1),
    combineToEntity(position.x + 1, position.y),
    combineToEntity(position.x, position.y - 1),
    combineToEntity(position.x - 1, position.y - 1),
    combineToEntity(position.x - 1, position.y + 1),
    combineToEntity(position.x + 1, position.y + 1),
    combineToEntity(position.x + 1, position.y - 1),
  ];
  return neighbors;
};

export type TileType =
  | "grass_0"
  | "wall_0"
  | "mud_0"
  | "ocean"
  | "forest"
  | "mountain";
export type NeighborType =
  | "left"
  | "down"
  | "right"
  | "up"
  | "up-left"
  | "down-left"
  | "down-right"
  | "up-right"
  | "up-left-corner"
  | "down-left-corner"
  | "down-right-corner"
  | "up-right-corner"
  | "up-right-cross"
  | "up-left-cross"
  | "none"
  | "same"
  | "edge";

// export type PropsType = "pine_12" |

// compare neighbors against terrainType to determine the neighbor type
export const getNeighborType = (
  terrain: TerrainType,
  neighbors: TerrainType[]
): NeighborType => {
  const [left, down, right, up, upLeft, downLeft, downRight, upRight] =
    neighbors;
  if (neighbors.every((neighbor) => neighbor === terrain)) return "same";
  if (terrain != left && terrain != up) return "up-left";
  if (terrain != left && terrain != down) return "down-left";
  if (terrain != right && terrain != down) return "down-right";
  if (terrain != right && terrain != up) return "up-right";
  if (terrain != left) return "left";
  if (terrain != down) return "down";
  if (terrain != right) return "right";
  if (terrain != up) return "up";
  if (terrain !== upRight && terrain !== downLeft) return "up-right-cross";
  if (terrain !== upLeft && terrain !== downRight) return "up-left-cross";
  if (terrain !== upLeft) return "up-left-corner";
  if (terrain !== downLeft) return "down-left-corner";
  if (terrain !== downRight) return "down-right-corner";
  if (terrain !== upRight) return "up-right-corner";
  return "none";
};

export const terrainToTileValue = (
  terrainType: TerrainType,
  neighbors: TerrainType[],
  tileId: Entity
): string[] => {
  const layer = [];
  const layer0 =
    terrainType === TerrainType.OCEAN ? "ocean" : "grass_boundary&down-right";
  layer.push(layer0);
  const neighborType = getNeighborType(terrainType, neighbors);

  const tree = handleTree(terrainType);
  if (tree) return tree;
  if (neighborType === "same") {
    const sameLayer = handleSame(terrainType, BigInt(tileId));
    if (sameLayer) return sameLayer;
    return layer;
  }
  if (neighborType === "none") return layer;

  const boundaryLayer = handleBoundary(terrainType, neighborType);
  if (boundaryLayer) return boundaryLayer;

  return layer;
};

// for forest terrain, neighor doesn't matter, just return tree
export const handleTree = (terrainType: TerrainType) => {
  if (terrainType === TerrainType.FOREST) {
    const layer1 = "pine_12";
    return ["grass_boundary&down-right", layer1];
  }
  return;
};

// for plain when neighbor is same, do some biomes, like mud, or plant small trees
// for mountain, return same mountain tile; or throw some random rock on?
export const handleSame = (terrainType: TerrainType, tileId: bigint) => {
  if (terrainType === TerrainType.MOUNTAIN) {
    const layer1 = "gravel_0&same";
    return ["grass_boundary&down-right", layer1];
  }
  if (terrainType === TerrainType.MUD) {
    const layer1 = "grass_2&same";
    return ["grass_boundary&down-right", layer1];
  }
  return;
};

// for ocean & mountain when neighbor not same or none; key&frame
// base layer is grass_boundary&down-right
export const handleBoundary = (
  terrainType: TerrainType,
  neighborType: NeighborType
) => {
  if (terrainType === TerrainType.OCEAN) {
    const layer1 = "ocean_boundary&" + neighborType;
    return ["grass_boundary&down-right", layer1];
  } else if (terrainType === TerrainType.MOUNTAIN) {
    const layer1 = "mountain_boundary&" + neighborType;
    return ["grass_boundary&down-right", layer1];
  } else if (terrainType === TerrainType.MUD) {
    const layer1 = "grass_2&" + neighborType;
    // console.log("mud", neighborType);
    return ["grass_boundary&down-right", layer1];
  }
  return;
};
