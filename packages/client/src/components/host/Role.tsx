import { Entity, getComponentValue } from "@latticexyz/recs";
import EntityName from "../EntityName";
import { EntityPools } from "./Pool";
import { Bag } from "./Bag";
import { useMUD } from "../../MUDContext";
import { useComponentValue } from "@latticexyz/react";
import { useCanExit } from "../../logics/building";
import { InBuilding } from "../building/StoreBuilding";
import { Mining, StartMining } from "./Mining";
import { Craft } from "./Craft";
import { Bot } from "./Bot";

/**
 * display role's name, pools, bag, inBuilding, startMining, mining
 */
export function Role({ role }: { role: Entity }) {
  const { components, network } = useMUD();
  const { Commander, HostName } = components;
  const isPlayer =
    (useComponentValue(Commander, role)?.value as Entity) ===
    network.playerEntity;
  const canExit = useCanExit(components, role);
  const hostName = getComponentValue(HostName, role)?.name as string;

  return (
    <div className="flex flex-col space-y-3 w-96 bg-white">
      {/* <EntityName entity={role} /> */}
      <div className="text-lg">{hostName}</div>
      <Bot bot={role} />
      <EntityPools entity={role} />
      <Bag host={role} />
      {isPlayer && <Craft host={role} />}
      {/* {isPlayer && canExit && <InBuilding entity={role} />}
      {isPlayer && <StartMining role={role} />}
      {isPlayer && <Craft host={role} />}
      <Mining role={role} /> */}
    </div>
  );
}

// position
