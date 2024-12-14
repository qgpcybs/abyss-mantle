import { Entity, HasValue } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { SOURCE, TARGET } from "../../constants";
import {
  getBuildingCoordToExit,
  getRoleAndHostAdjacentCoord,
  roleAndHostWithinRange,
} from "../../logics/building";
import { Hex } from "viem";
import { splitFromEntity } from "../../logics/move";
import EntityName from "../EntityName";
import { canMoveTo } from "../../logics/map";
import { canStoreERC721 } from "../../logics/container";

/**
 * display enter building button; check if 1) role is adjacent to the building, 2) role can enter the building
 */
export function EnterBuilding({ building }: { building: Entity }) {
  const { components, systemCalls } = useMUD();
  const { enterBuilding } = systemCalls;
  const { SelectedHost, StoredSize, Path } = components;
  const sourceHost = useComponentValue(SelectedHost, SOURCE)?.value as Entity;
  useComponentValue(Path, sourceHost);
  useComponentValue(StoredSize, building);
  if (!sourceHost) return null;
  const canEnter = canStoreERC721(components, sourceHost, building);
  const adjacentCoord = getRoleAndHostAdjacentCoord(
    components,
    sourceHost,
    building
  );
  if (!canEnter || !adjacentCoord) return null;
  return (
    <button
      onClick={() => enterBuilding(sourceHost as Hex, adjacentCoord)}
      className="btn-blue"
    >
      Enter
    </button>
  );
}

/**
 * display building name & exit building button if entity is in building
 */
export function InBuilding({ entity }: { entity: Entity }) {
  const { components, systemCalls } = useMUD();
  const { exitBuilding } = systemCalls;
  const { TargetTile, Owner } = components;
  const building = useComponentValue(Owner, entity)?.value as Entity;
  const tileId = useComponentValue(TargetTile, TARGET)?.value as Entity;
  const tileCoord = tileId ? splitFromEntity(tileId) : undefined;
  // check if tileCoord is valid for the entity to move to
  const canMoveToCoord = tileCoord
    ? canMoveTo(components, systemCalls, tileCoord)
    : false;
  // get the building coord that is adjacent to the tileCoord
  const buildingCoord = canMoveToCoord
    ? getBuildingCoordToExit(components, building as Hex, tileCoord!)
    : undefined;

  return (
    <div>
      <span>
        In Building: <EntityName entity={building}></EntityName>
      </span>
      <button
        onClick={() => exitBuilding(entity as Hex, buildingCoord!, tileCoord!)}
        disabled={!buildingCoord}
        className="btn-blue"
      >
        Exit
      </button>
    </div>
  );
}

// StartMining
// StopMining
// Minings
