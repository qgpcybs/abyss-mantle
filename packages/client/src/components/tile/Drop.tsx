import { Entity, HasValue } from "@latticexyz/recs";
import { Hex, hexToString } from "viem";
import { splitFromEntity } from "../../logics/move";
import {
  getDropContainer,
  useCanPickupERC20,
  useCanPickupERC721,
  useCanPickupRange,
} from "../../logics/drop";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { ERC20_TYPES, SOURCE } from "../../constants";
import { useMUD } from "../../MUDContext";
import { isHost, isRole } from "../../logics/entity";
import EntityName from "../EntityName";
import { EntityPools } from "../host/Pool";
import { useBalance } from "../../logics/container";

/**
 * everything in the drop container; complex because host could be a nested component
 */
export function Drop({ tile }: { tile: Entity }) {
  const { x, y } = splitFromEntity(tile);
  const dropId = getDropContainer(x, y) as Entity;
  return (
    <div>
      <HostLoot host={dropId} tile={tile} />
    </div>
  );
}

/**
 * display the host in a recursive manner; to start, the drop container itself is a host;
 * if there is dead role in the drop container, all its loots will be displayed & for player to take
 */
export function HostLoot({ host, tile }: { host: Entity; tile: Entity }) {
  const { components, systemCalls } = useMUD();
  const { Owner, StoredSize, SelectedHost } = components;
  const { revive } = systemCalls;
  const toHost = useComponentValue(SelectedHost, SOURCE)?.value as Entity;
  const inRange = useCanPickupRange(components, toHost, tile);
  // TODO: add tokens requirement to revive
  const isRoleType = isRole(components, host);

  const erc20Whitelist = ERC20_TYPES;
  const entities = useEntityQuery([HasValue(Owner, { value: host })]);
  const hostEntities = entities.filter((entity) => isHost(components, entity));
  const nftEntities = entities.filter(
    (entity) => !hostEntities.includes(entity)
  );
  const noLoots = (useComponentValue(StoredSize, host)?.value ?? 0n) === 0n;
  // note: freshly spawned role has no loots
  // if (noLoots) return null;

  return (
    <div className="flex flex-col space-y-0 text-sm">
      {!noLoots && <div className="text-lg">Loots:</div>}
      {isRoleType && (
        <button
          className="btn-blue"
          disabled={!inRange}
          onClick={() => revive(toHost as Hex, host as Hex)}
        >
          revive
        </button>
      )}
      {erc20Whitelist.map((erc20Type, index) => (
        <FTLoot key={index} host={host} erc20Type={erc20Type} tile={tile} />
      ))}
      {nftEntities.map((erc721Entity, index) => (
        <NFTLoot key={index} entity={erc721Entity} tile={tile} />
      ))}
      {hostEntities.map((hostEntity, index) => (
        <HostLoot key={index} host={hostEntity} tile={tile} />
      ))}
    </div>
  );
}

// similar structure as FTItem
export function FTLoot({
  host,
  erc20Type,
  tile,
}: {
  host: Entity;
  erc20Type: Hex;
  tile: Entity;
}) {
  const { components, systemCalls } = useMUD();
  const { SelectedHost } = components;
  const { pickupERC20 } = systemCalls;
  const toHost = useComponentValue(SelectedHost, SOURCE)?.value as Entity;
  const balance = useBalance(components, host, erc20Type);

  const canPickup = useCanPickupERC20(components, erc20Type, tile, toHost);
  const { x, y } = splitFromEntity(tile);
  const dropId = getDropContainer(x, y);

  if (!balance || balance === 0n) return null;
  return (
    <div className="flex flex-row space-x-2">
      <span>
        {hexToString(erc20Type)}x{Number(balance)}
      </span>
      <button
        className="btn-blue"
        disabled={!canPickup}
        onClick={() =>
          pickupERC20(toHost as Hex, host as Hex, erc20Type, 1n, x, y)
        }
      >
        pickup
      </button>
    </div>
  );
}

// similar structure as NFTItem
export function NFTLoot({ entity, tile }: { entity: Entity; tile: Entity }) {
  const { components, systemCalls } = useMUD();
  const { SelectedHost } = components;
  const { pickupERC721 } = systemCalls;
  const toHost = useComponentValue(SelectedHost, SOURCE)?.value as Entity;
  const canPickup = useCanPickupERC721(components, entity, tile, toHost);
  const { x, y } = splitFromEntity(tile);
  const dropId = getDropContainer(x, y);

  return (
    <div className="flex flex-row space-x-2">
      <EntityName entity={entity} />
      <EntityPools entity={entity} />
      <button
        className="btn-blue"
        disabled={!canPickup}
        onClick={() => pickupERC721(toHost as Hex, dropId, entity as Hex, x, y)}
      >
        pickup
      </button>
    </div>
  );
}
