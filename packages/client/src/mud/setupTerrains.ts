import {
  Entity,
  runQuery,
  Has,
  removeComponent,
  getComponentValue,
  setComponent,
} from "@latticexyz/recs";
import { combine, combineToEntity } from "../logics/move";
import { GRID_SIZE, compileGridTerrainValues } from "../logics/terrain";
import { Vector } from "../utils/vector";
import { ClientComponents } from "./createClientComponents";
import { SystemCalls } from "./createSystemCalls";

export function setupTerrains(
  components: ClientComponents,
  systemCalls: SystemCalls,
  tileCoord: Vector
) {
  // map size to display & update
  const width = 8;
  const height = 6;

  const { TerrainValues, TileValue } = components;
  const x = tileCoord.x; //?? width;
  const y = tileCoord.y; // ?? height;
  const gridCoord = {
    x: Math.floor(x / GRID_SIZE),
    y: Math.floor(y / GRID_SIZE),
  };
  const currGridIds: Entity[] = [];
  for (let i = Math.max(0, gridCoord.x - width); i < gridCoord.x + width; i++) {
    for (
      let j = Math.max(0, gridCoord.y - height);
      j < gridCoord.y + height;
      j++
    ) {
      currGridIds.push(combineToEntity(i, j));
    }
  }

  const prevGridIds = [...runQuery([Has(TerrainValues)])];
  prevGridIds.forEach((prev) => {
    if (!currGridIds.includes(prev)) removeComponent(TerrainValues, prev);
  });
  currGridIds.forEach((curr) => {
    if (!getComponentValue(TerrainValues, curr)?.value) {
      const terrainValues = compileGridTerrainValues(
        components,
        systemCalls,
        curr
      );
      setComponent(TerrainValues, curr, { value: terrainValues });
      // if (!getComponentValue(TerrainValues, curr)?.value) {
      //   const string = localStorage.getItem(curr);
      //   console.log("terrainValues", string);
      //   const terrainValues = string
      //     ? BigInt(string)
      //     : compileGridTerrainValues(components, systemCalls, curr);
      //   setComponent(TerrainValues, curr, { value: terrainValues });
      //   string || localStorage.setItem(curr, terrainValues.toString());
      // }
    }
  });
}
