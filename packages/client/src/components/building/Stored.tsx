import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { Entity, HasValue } from "@latticexyz/recs";
import { ERC20_TYPES } from "../../constants";
import { useMUD } from "../../MUDContext";
import { FTItem, NFTItem } from "../host/Bag";
import { getEntitySpecs } from "../../logics/entity";
import EntityName from "../EntityName";

/**
 * display all nfts & fts stored in the building
 * refactor from Bag, which display stuffs in a role
 * note: stored entity is actually a host (not just building), used in Transfer
 */
export function Stored({ building }: { building: Entity }) {
  const { components } = useMUD();
  const { Owner, ContainerSpecs, StoredSize } = components;
  const erc20Whitelist = ERC20_TYPES;
  const erc721Entities = useEntityQuery([HasValue(Owner, { value: building })]);
  const storedSize = useComponentValue(StoredSize, building)?.value ?? 0n;
  const capacity =
    getEntitySpecs(components, ContainerSpecs, building)?.capacity ?? 0n;
  // Add equipment?
  return (
    <div className="flex flex-col space-y-0 text-sm m-1 p-1 border border-black">
      <div className="space-x-4">
        <EntityName entity={building} />
        <span>
          {Number(storedSize)}/{Number(capacity)}
        </span>
      </div>
      {erc20Whitelist.map((erc20Type, index) => (
        <FTItem key={index} host={building} erc20Type={erc20Type} />
      ))}
      {erc721Entities.map((erc721Entity, index) => (
        <NFTItem key={index} host={building} entity={erc721Entity} />
      ))}
    </div>
  );
}
