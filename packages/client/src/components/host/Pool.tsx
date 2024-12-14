import { Entity } from "@latticexyz/recs";
import { Hex, hexToString } from "viem";
import { useMUD } from "../../MUDContext";
import { useEntityPools, usePoolAmount } from "../../logics/pool";
import { hexTypeToString } from "../../utils/encode";

/**
 * display all pools of an entity
 */
export function EntityPools({ entity }: { entity: Entity }) {
  const { components } = useMUD();
  const pools = useEntityPools(components, entity);
  return (
    <div className="flex flex-col space-y-0 text-sm">
      {/* <div className="text-sm font-bold">Pool Stats:</div> */}
      {pools.map(({ type, capacity }) => (
        <div key={type} className="flex flex-row">
          <span>{hexTypeToString(type)}: </span>
          <PoolAmount entity={entity} poolType={type} />
          <span>/{capacity}</span>
        </div>
      ))}
    </div>
  );
}

export function PoolAmount({
  entity,
  poolType,
}: {
  entity: Entity;
  poolType: Hex;
}) {
  const { components } = useMUD();
  const amount = usePoolAmount(components, entity, poolType);
  return <span>{amount}</span>;
}
