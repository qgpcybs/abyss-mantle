import { Entity } from "@latticexyz/recs";
import EntityName from "../EntityName";
import { EntityPools } from "../host/Pool";
import { Stored } from "./Stored";
import { useMUD } from "../../MUDContext";
import {
  getEntitySpecs,
  isBuildingMiner,
  isBuildingStaker,
} from "../../logics/entity";
import { EnterBuilding } from "./StoreBuilding";
import { MineBuilding } from "./MineBuilding";
import { StakeBuilding } from "./StakeBuilding";

/**
 * display building's name, pools, stored ft & nft, enterBuilding button
 */
export function Building({ building }: { building: Entity }) {
  const { components } = useMUD();
  const { ContainerSpecs } = components;
  // check if building can store ft or nfts
  const canStore = getEntitySpecs(components, ContainerSpecs, building)
    ? true
    : false;
  // check if building is miner type
  const isMiner = isBuildingMiner(components, building);
  // check if building is staking type
  const isStaker = isBuildingStaker(components, building);
  // check if building is cooking type

  // check if building has swap

  return (
    <div className="flex flex-col space-y-3 w-96 bg-white">
      <EntityName entity={building} />
      <EntityPools entity={building} />
      {canStore && (
        <div className="flex flex-col">
          <Stored building={building} />
          <EnterBuilding building={building} />
        </div>
      )}
      {isMiner && <MineBuilding building={building} />}
      {isStaker && <StakeBuilding building={building} />}
    </div>
  );
}
