import { Entity, setComponent } from "@latticexyz/recs";
import { splitFromEntity } from "../../logics/move";
import {
  canBuildFromHost,
  getAllBuildingTypes,
  getHasCostBuildingTypes,
} from "../../logics/building";
import { useMUD } from "../../MUDContext";
import { useComponentValue } from "@latticexyz/react";
import { Hex, hexToString } from "viem";
import { TARGET } from "../../constants";
import ItemContainer from "../ItemContainer";
import { MintCostsDisplay } from "../Costs";
import { hexTypeToString } from "../../utils/encode";

/**
 * display all buildable types for a selectedHost & a selected tile (the lowerX & lowerY of the building)
 * note: rn, buildable depends on tile to check for getCoord's adjacency; if taking tile out, need to add useHook Path change for selectedHost
 */
export function Buildable({
  tile,
  selectedHost,
}: {
  tile: Entity;
  selectedHost: Entity;
}) {
  const { components, systemCalls } = useMUD();
  const { StoredSize, ToBuildType } = components;
  const { buildBuilding } = systemCalls;
  const tileCoord = splitFromEntity(tile);
  const allBuildingTypes = getAllBuildingTypes(components);
  useComponentValue(StoredSize, selectedHost);
  // useComponentValue instead of a local useState so as to communicate data to phaser
  const toBuildType = useComponentValue(ToBuildType, TARGET)?.value as Hex;
  const canBuildTypes = getHasCostBuildingTypes(
    components,
    selectedHost as Hex
  );

  // calculate the building coord that is adjacent to the player
  const getCoord = (buildingType: Hex) => {
    return canBuildFromHost(
      components,
      systemCalls,
      selectedHost,
      tileCoord,
      buildingType
    );
  };

  const BuildButton = () => {
    if (!toBuildType) return;
    const coord = getCoord(toBuildType);
    if (!coord) return;
    return (
      <button
        className="btn-blue"
        onClick={() => {
          const coord = getCoord(toBuildType);
          // console.log("coord:", coord);
          if (!coord) return;
          buildBuilding(selectedHost as Hex, toBuildType, coord, tileCoord);
        }}
      >
        Build
      </button>
    );
  };

  return (
    <div className="flex flex-col">
      <span>Buildable Types</span>
      <div className="grid grid-cols-3 gap-2">
        {allBuildingTypes.map((buildingType, index) => {
          const selected = buildingType === toBuildType;
          const coord = getCoord(buildingType);
          // console.log(
          //   hexToString(buildingType)
          //     .toLowerCase()
          //     .replace(/[^\x20-\x7E]/g, "")
          //     .trim(),
          //   coord
          // );
          const canBuild = canBuildTypes.includes(buildingType) && coord;
          return (
            <ItemContainer
              key={index}
              selected={selected}
              disabled={!canBuild}
              onClick={() =>
                setComponent(ToBuildType, TARGET, {
                  value: buildingType as Entity,
                })
              }
            >
              {hexTypeToString(buildingType)}
            </ItemContainer>
          );
        })}
      </div>
      {toBuildType && <MintCostsDisplay mintType={toBuildType} />}
      <BuildButton />
    </div>
  );
}
