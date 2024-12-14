import { Entity, getComponentValue, Has, runQuery } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { Hex } from "viem";
import { Costs } from "../tile/BurnTerrain";
import { hasCosts } from "../../logics/cost";
import { decodeTypeEntity, hexTypeToString } from "../../utils/encode";

// display all crafting recipes inside Role.tsx
export function Craft({ host }: { host: Entity }) {
  const { components } = useMUD();
  const { CookSpecs } = components;
  // get all cook specs
  const craftTypes = [...runQuery([Has(CookSpecs)])];

  return (
    <div>
      CRAFT MENU
      {craftTypes.map((cookType) => (
        <div key={cookType}>
          <CraftERC721 host={host} outputType={cookType} />
        </div>
      ))}
    </div>
  );
}

export function CraftERC721({
  host,
  outputType,
}: {
  host: Entity;
  outputType: Entity;
}) {
  const { components, systemCalls } = useMUD();
  const { CookSpecs } = components;
  const { craft } = systemCalls;
  const cookSpec = getComponentValue(CookSpecs, outputType);
  if (!cookSpec) return null;

  const { inputs } = cookSpec;
  const hasInputs = hasCosts(components, host as Hex, inputs as Hex[]);
  // check if host has stored size

  return (
    <div className="text-sm">
      <Costs costs={inputs as Hex[]} />
      <button
        className="btn-blue"
        disabled={!hasInputs}
        onClick={() =>
          craft(host as Hex, decodeTypeEntity(outputType as Hex) as Hex)
        }
      >
        Craft {hexTypeToString(outputType as Hex)}
      </button>
    </div>
  );
}
