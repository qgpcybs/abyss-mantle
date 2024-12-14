import { Entity } from "@latticexyz/recs";
import { splitFromEntity } from "../../logics/move";
import {
  convertTerrainTypesToValues,
  GRID_SIZE,
  TileTerrain,
} from "../../logics/terrain";
import { useMUD } from "../../MUDContext";

/**
 * display SetTerrains button to set all terrains on a grid to PLAIN
 */
export function SetTerrains({ tile }: { tile: Entity }) {
  const {
    systemCalls: { setTerrainValues },
  } = useMUD();
  const tileCoord = splitFromEntity(tile);
  const terrainMatrix = [
    [3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3],
  ];
  const terrainTypes: TileTerrain[] = [];
  terrainMatrix.forEach((row, i) => {
    row.forEach((terrain, j) => {
      terrainTypes.push({
        i,
        j,
        terrainType: terrainMatrix[j][i],
      });
    });
  });
  const terrainValues = convertTerrainTypesToValues(terrainTypes);
  const gridCoord = {
    x: Math.floor(tileCoord.x / GRID_SIZE),
    y: Math.floor(tileCoord.y / GRID_SIZE),
  };

  return (
    <button
      className="btn-blue"
      onClick={() => setTerrainValues(gridCoord, terrainValues)}
    >
      Set Terrains to ALL PLAINs
    </button>
  );
}
