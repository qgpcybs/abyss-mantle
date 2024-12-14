import { Entity, getComponentValue, setComponent } from "@latticexyz/recs";
import { SetupResult } from "./setup";
import { combineToEntity, splitFromEntity } from "../logics/move";
import { SOURCE, OBSERVER, TerrainType, TARGET } from "../constants";
import { getFirstHost, selectFirstHost } from "../logics/entity";
import { setupTileValues } from "./setupTiles";
import { getHostPosition, getPathEntityPosition } from "../logics/path";
import { Vector } from "../utils/vector";
import { setupTerrains } from "./setupTerrains";
import { setupMines } from "./setupMines";
import { mockPath } from "../logics/mock";

// issue is to initialize & update tileCoord and to update other terrains & tiles when tileCoord is changed
// tileCoord depends on which source is selected, what current targetTile is, and etc.
export function syncComputedComponents({
  components,
  systemCalls,
  network,
}: SetupResult) {
  const { TileEntity, SelectedHost, Path, TargetTile, Owner, MiningInfo } =
    components;

  const initX = 2 ** 16; // 32 * 10;
  const initY = 2 ** 16; // 32 * 10;

  let tileCoord: Vector = { x: initX, y: initY };
  // 1) if there is a targetTile, then update tileCoord to be targetTile
  const targetCoordId = getComponentValue(TargetTile, TARGET)?.value as Entity;
  // 2) else, if there is a selectedSource, then update tileCoord to be its sourceCoord (if it exists)
  const selected = getComponentValue(SelectedHost, SOURCE)?.value as Entity;
  const selectedCoord = getHostPosition(components, network, selected);
  // 3) else, if player has one source, then update tileCoord... (if it exists)
  const host = getFirstHost(components, network.playerEntity);
  const hostPath = getComponentValue(Path, host);
  const hostCoord = getHostPosition(components, network, host);
  if (targetCoordId) {
    tileCoord = splitFromEntity(targetCoordId);
  } else if (selected && selectedCoord) {
    tileCoord = selectedCoord;
  } else if (host && hostCoord) {
    tileCoord = hostCoord;
  }

  // // mock path if host has no path, but has coord
  // if (hostCoord && !hostPath) {
  //   mockPath(components, host, hostCoord);
  // }
  // console.log("syncComputedComponents", tileCoord, targetCoordId);

  setupTerrains(components, systemCalls, tileCoord);
  setupTileValues(components);
  setupMines(components, systemCalls, tileCoord);

  // set target tile when all tiles are rendered
  if (!targetCoordId) {
    setComponent(TargetTile, TARGET, {
      value: combineToEntity(tileCoord.x, tileCoord.y),
    });
  }
  if (!selected && host) {
    setComponent(SelectedHost, SOURCE, { value: host });
  }
}
