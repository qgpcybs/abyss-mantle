import { Entity } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { useAllMinings } from "../../logics/mining";
import EntityName from "../EntityName";
import { MiningInfo } from "../host/Mining";

/**
 * display mining info of a building, including all mining happening in the building;
 * TODO: add other info
 */
export function MineBuilding({ building }: { building: Entity }) {
  const { components } = useMUD();
  const miningRoleIds = useAllMinings(components, building);
  return (
    <div className="flex flex-col space-y-3 w-96 bg-white">
      {miningRoleIds.map((roleId) => (
        <div key={roleId} className="flex flex-row space-x-2">
          <EntityName entity={roleId} />
          <MiningInfo role={roleId} />
        </div>
      ))}
    </div>
  );
}
