import {
  Entity,
  Has,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { GRID_SIZE_MINE } from "../contract/constants";
import { GRID_SIZE } from "../logics/terrain";
import { Vector } from "../utils/vector";
import { ClientComponents } from "./createClientComponents";
import { SystemCalls } from "./createSystemCalls";
import { combineToEntity, splitFromEntity } from "../logics/move";
import { hasMineFromGrid } from "../logics/mining";

export function setupMines(
  components: ClientComponents,
  systemCalls: SystemCalls,
  tileCoord: Vector
) {
  const { MineValue } = components;
  const width = Math.floor((8 * GRID_SIZE) / GRID_SIZE_MINE);
  const height = Math.floor((6 * GRID_SIZE) / GRID_SIZE_MINE);
  const gridCoord = {
    x: Math.floor(tileCoord.x / GRID_SIZE_MINE),
    y: Math.floor(tileCoord.y / GRID_SIZE_MINE),
  };

  const currGridIds = new Set<Entity>();
  for (let i = Math.max(0, gridCoord.x - width); i < gridCoord.x + width; i++) {
    for (
      let j = Math.max(0, gridCoord.y - height);
      j < gridCoord.y + height;
      j++
    ) {
      currGridIds.add(combineToEntity(i, j));
    }
  }
  const prevGridIds = runQuery([Has(MineValue)]);
  // remove grid mine value that are not in current MineValue
  prevGridIds.difference(currGridIds).forEach((prevGridId) => {
    removeComponent(MineValue, prevGridId);
  });
  // add
  currGridIds.difference(prevGridIds).forEach((currGridId) => {
    //
    const hasMine = hasMineFromGrid(systemCalls, splitFromEntity(currGridId));
    if (!hasMine) return;
    setComponent(MineValue, currGridId, { value: true });
  });
}
