import {
  Entity,
  getComponentValue,
  Has,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { ClientComponents } from "./createClientComponents";
import { combineToEntity, splitFromEntity } from "../logics/move";
import { getGridTileIds, getTerrainType, GRID_SIZE } from "../logics/terrain";
import { terrainMapping, TerrainType } from "../constants";
import {
  getNeighborCoordIds,
  getNeighborTerrains,
  terrainToTileValue,
} from "../logics/tile";
import { Vector } from "../utils/vector";
import { SystemCalls } from "./createSystemCalls";

// update neighbor tiles AFTER a tile's terrain value changes
// each neighbor tile depends on its neighbor's terrain values
// note: systemCalls is not used meaning terrainValues client component needs to be updated first
export function updateNeighborGrids(
  components: ClientComponents,
  gridId: Entity
) {
  const { Terrain, TerrainValues } = components;
  const terrains: Record<Entity, TerrainType> = {};
  const gridCoord = splitFromEntity(gridId);
  const gridIds = getNeighborCoordIds(gridCoord);
  gridIds.push(gridId);
  // loop gridIds to get each tile's terrain value & tileId
  gridIds.forEach((gridId) => {
    const gridCoord = splitFromEntity(gridId);
    const terrainValues = getComponentValue(TerrainValues, gridId)?.value ?? 0n;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const shift = i + j * GRID_SIZE;
        const tileCoord = {
          x: gridCoord.x * GRID_SIZE + i,
          y: gridCoord.y * GRID_SIZE + j,
        };
        const tileId = combineToEntity(tileCoord.x, tileCoord.y);
        const terrain = Number((terrainValues >> BigInt(shift * 4)) & 15n);
        terrains[tileId] = terrain;
      }
    }
  });

  const neighborTileIds = gridIds.flatMap((gridId) =>
    getGridTileIds(splitFromEntity(gridId))
  );
  neighborTileIds.forEach((tileId) => {
    updateTileValue(components, terrains, tileId as Entity);
  });
}

export function updateTileValue(
  components: ClientComponents,
  terrains: Record<Entity, TerrainType>,
  tileId: Entity
) {
  const { TileValue } = components;
  const tileCoord = splitFromEntity(tileId);
  const neighbors = getNeighborTerrains(terrains, tileCoord);
  if (neighbors.includes(TerrainType.NONE)) {
    // console.log("skip tile", tileCoord, neighbors);
    return;
  }
  const terrain = terrains[tileId];
  const tileValue = terrainToTileValue(terrain, neighbors, tileId);
  const prev = getComponentValue(TileValue, tileId)?.value;
  if (JSON.stringify(prev) === JSON.stringify(tileValue)) return;
  setComponent(TileValue, tileId, { value: tileValue });
  // console.log("updateTileValue", tileCoord, prev, tileValue);
}

// tile values depend on a complete of terrain values
export function setupTileValues(components: ClientComponents) {
  const { TerrainValues, TileValue } = components;
  // tileCoord -> terrain value
  const terrains: Record<Entity, TerrainType> = {};
  const currTileIds = new Set<Entity>();
  const prevTileIds = runQuery([Has(TileValue)]);
  const gridIds = [...runQuery([Has(TerrainValues)])];
  // loop gridIds to get each tile's terrain value & tileId
  gridIds.forEach((gridId) => {
    const gridCoord = splitFromEntity(gridId);
    const terrainValues = getComponentValue(TerrainValues, gridId)!.value;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const shift = i + j * GRID_SIZE;
        const tileCoord = {
          x: gridCoord.x * GRID_SIZE + i,
          y: gridCoord.y * GRID_SIZE + j,
        };
        const tileId = combineToEntity(tileCoord.x, tileCoord.y);
        const terrain = Number((terrainValues >> BigInt(shift * 4)) & 15n);
        terrains[tileId] = terrain;
        currTileIds.add(tileId);
      }
    }
  });

  // remove tiles that are not in current TileValue
  prevTileIds.difference(currTileIds).forEach((tileId) => {
    removeComponent(TileValue, tileId);
  });
  // add tiles that are not in previous TileValue
  currTileIds.difference(prevTileIds).forEach((tileId) => {
    updateTileValue(components, terrains, tileId);
  });
  // console.log("setupTileValues", terrains, currTileIds, prevTileIds);
}
