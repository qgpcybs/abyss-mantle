import { Entity, getComponentValue } from "@latticexyz/recs";
import { encodeTypeEntity, fromEntity, hexTypeToString } from "../utils/encode";
import { Hex, hexToString } from "viem";
import { useMUD } from "../MUDContext";

export function MintCostsDisplay({ mintType }: { mintType: Hex }) {
  const { components } = useMUD();
  const { MintCosts } = components;
  const costs = getComponentValue(
    MintCosts,
    encodeTypeEntity(mintType) as Entity
  )?.costs;
  if (!costs) return null;
  return (
    <div className="flex flex-col">
      <span>Mint Costs: </span>
      <CostsDisplay costs={costs as Hex[]} />
    </div>
  );
}

export function CostsDisplay({ costs }: { costs: Hex[] }) {
  const costsInfo = costs.map((costEntity) => fromEntity(costEntity));
  return (
    <div className="flex flex-col text-sm">
      {costsInfo.map((cost, i) => (
        <div key={i}>
          {hexTypeToString(cost.type)}: {Number(cost.id)}
        </div>
      ))}
    </div>
  );
}
