import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { Entity, getComponentValue, HasValue } from "@latticexyz/recs";
import { ERC20_TYPES } from "../../constants";
import { useMUD } from "../../MUDContext";
import { getEntitySpecs } from "../../logics/entity";
import { Hex, hexToString } from "viem";
import { useController } from "../../hooks/useController";
import { useState } from "react";
import {
  useBalance,
  canStoreERC20Amount,
  canStoreERC721,
} from "../../logics/container";
import { Stored } from "./Stored";
import { getHostsAdjacentCoord } from "../../logics/building";
import EntityName from "../EntityName";
import { hexTypeToString } from "../../utils/encode";

/**
 * the overal transfer component between a fromHost and a toHost, including display info & transfer action
 * check 1) is adjacent && 2) is controller of fromHost; if not, return null
 */
export function Transfer({
  fromHost,
  toHost,
}: {
  fromHost: Entity;
  toHost: Entity;
}) {
  const { components, network } = useMUD();
  // controller check, fromHost must be controlled by player
  const isController = useController(
    components,
    fromHost,
    network.playerEntity
  );
  // adjacent check, similar to EnterBuilding()
  useComponentValue(components.Path, fromHost);
  useComponentValue(components.Path, toHost);
  const adjacentInfo = getHostsAdjacentCoord(components, fromHost, toHost);
  if (!isController || !adjacentInfo) return null;
  const fromHostName =
    getComponentValue(components.HostName, fromHost)?.name ?? "building??";
  const toHostName =
    getComponentValue(components.HostName, toHost)?.name ?? "building??";
  return (
    <div className="m-1 p-1">
      <span>
        Transfer from {fromHostName} to {toHostName}
      </span>
      <div className="flex flex-row space-x-6 border border-black">
        <TransferFromHost fromHost={fromHost} toHost={toHost} />
        <Stored building={toHost} />
      </div>
    </div>
  );
}

/**
 * display the fromHost & all its content that can be transferred from; similar to Stored, except with the NFTTransfer & FTTransfercomponents
 * note: no checks in this level, most checks are done in NFTTransfer & FTTransfer
 */
export function TransferFromHost({
  fromHost,
  toHost,
}: {
  fromHost: Entity;
  toHost: Entity;
}) {
  const { components } = useMUD();
  const { Owner, ContainerSpecs, StoredSize } = components;
  const erc20Whitelist = ERC20_TYPES;
  const erc721Entities = useEntityQuery([HasValue(Owner, { value: fromHost })]);
  const storedSize = useComponentValue(StoredSize, fromHost)?.value ?? 0n;
  const capacity =
    getEntitySpecs(components, ContainerSpecs, fromHost)?.capacity ?? 0n;
  return (
    <div className="flex flex-col space-y-0 text-sm m-1 p-1 border border-black">
      <div className="space-x-4">
        <EntityName entity={fromHost} />
        <span>
          {Number(storedSize)}/{Number(capacity)}
        </span>
      </div>
      {erc20Whitelist.map((erc20Type, index) => (
        <FTTransfer
          key={index}
          from={fromHost}
          to={toHost}
          erc20Type={erc20Type}
        />
      ))}
      {erc721Entities.map((erc721Entity, index) => (
        <NFTTransfer
          key={index}
          from={fromHost}
          to={toHost}
          entity={erc721Entity}
        />
      ))}
    </div>
  );
}

/**
 * display NFT item & transfer action
 * check 1) adjacent, 2) can toHost store nft
 */
export function NFTTransfer({
  from,
  to,
  entity,
}: {
  from: Entity;
  to: Entity;
  entity: Entity;
}) {
  const { components, systemCalls } = useMUD();
  // check if the entity can be stored in toHost
  const canStore = canStoreERC721(components, entity, to);
  // check adjacent; fromHost or toHost could be a building that can have multiple positions
  const adjacentInfo = getHostsAdjacentCoord(components, from, to);
  if (!adjacentInfo || !canStore) return;
  const fromCoord = adjacentInfo.hostAPosition;
  const toCoord = adjacentInfo.hostBPosition;

  return (
    <div className="flex flex-row space-x-2">
      <EntityName entity={entity} />
      <button
        className="btn-blue"
        disabled={!canStore}
        onClick={() => {
          systemCalls.transferERC721(fromCoord, toCoord, entity as Hex);
        }}
      >
        transfer
      </button>
    </div>
  );
}

/**
 * display FT & balance & transfer action
 * check 1) adjacent, 2) can toHost store erc20 & amount, 3) can fromHost transfer erc20 & amount
 */
export function FTTransfer({
  from,
  to,
  erc20Type,
}: {
  from: Entity;
  to: Entity;
  erc20Type: Hex;
}) {
  const { components, systemCalls } = useMUD();
  const balanceFrom = useBalance(components, from, erc20Type);
  const balanceTo = useBalance(components, to, erc20Type);
  // set the amount to be transfered
  const [amount, setAmount] = useState("0");
  const canStoreAmount = canStoreERC20Amount(components, erc20Type, to);
  // check if the transfered amount can be stored in toHost
  const canStore = canStoreAmount >= BigInt(amount);
  // check if the transfered amount is less than the balance of fromHost
  const canTransfer = balanceFrom >= BigInt(amount);
  if (!balanceFrom || balanceFrom === 0n) return null;
  // check adjacent; fromHost or toHost could be a building that can have multiple positions
  const adjacentInfo = getHostsAdjacentCoord(components, from, to);
  if (!adjacentInfo) return null;
  const fromCoord = adjacentInfo.hostAPosition;
  const toCoord = adjacentInfo.hostBPosition;
  return (
    <div className="flex flex-row space-x-2">
      <span>
        {hexTypeToString(erc20Type)}x{Number(balanceFrom)}
      </span>
      <input
        type="number"
        className="w-16 border border-black"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        className="btn-blue"
        disabled={!canTransfer || !canStore}
        onClick={() => {
          systemCalls.transferERC20(
            fromCoord,
            toCoord,
            erc20Type as Hex,
            BigInt(amount)
          );
        }}
      >
        transfer {amount} {hexTypeToString(erc20Type)}
      </button>
    </div>
  );
}
