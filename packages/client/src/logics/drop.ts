import { Entity, getComponentValue } from "@latticexyz/recs";
import { DROP } from "../contract/constants";
import { castToBytes32, encodeTypeEntity } from "../utils/encode";
import {
  canStoreERC20Amount,
  canStoreERC721,
  getERC20Balances,
  getERC721s,
  useERC721s,
} from "./container";
import { ClientComponents } from "../mud/createClientComponents";
import useRerender from "../hooks/useRerender";
import { useComponentValue } from "@latticexyz/react";
import { SOURCE } from "../constants";
import { getTopHost } from "./entity";
import { SetupNetworkResult } from "../mud/setupNetwork";
import { getPositionFromPath } from "./path";
import { splitFromEntity } from "./move";
import { withinRange } from "./position";
import { Hex, pad } from "viem";

// assume pickup amount is 1
export const useCanPickupERC20 = (
  components: ClientComponents,
  erc20Type: Hex,
  tile: Entity,
  toHost: Entity
) => {
  const { StoredSize } = components;
  const toStoredSize = useComponentValue(StoredSize, toHost)?.value;
  const inRange = useCanPickupRange(components, toHost, tile);
  if (!toHost) return false;
  if (!inRange) return false;
  if (!toStoredSize) return false;
  const canStore = canStoreERC20Amount(components, erc20Type, toHost) > 0n;
  // if (!canStore) return false;
  return true;
};

export const getCanPickupERC20 = (
  components: ClientComponents,
  erc20Type: Hex,
  tile: Entity,
  toHost: Entity
) => {
  const { StoredSize } = components;
  const toStoredSize = getComponentValue(StoredSize, toHost)?.value;
  const inRange = getCanPickupRange(components, toHost, tile);
  if (!toHost) return false;
  if (!inRange) return false;
  if (!toStoredSize) return false;
  const canStore = canStoreERC20Amount(components, erc20Type, toHost) > 0n;
  if (!canStore) return false;
  return true;
};

// store check & range check
export const useCanPickupERC721 = (
  components: ClientComponents,
  entity: Entity,
  tile: Entity,
  toHost: Entity
) => {
  const { StoredSize } = components;
  const toStoredSize = useComponentValue(StoredSize, toHost)?.value;
  const inRange = useCanPickupRange(components, toHost, tile);
  if (!toHost) return false;
  if (!inRange) return false;
  if (!toStoredSize) return false;
  const canStore = canStoreERC721(components, entity, toHost);
  // if (!canStore) return false;
  return true;
};

// range check
export const useCanPickupRange = (
  components: ClientComponents,
  toHost: Entity,
  tile: Entity
) => {
  const { Path } = components;
  const toPath = useComponentValue(Path, toHost);
  if (!toPath) return false;
  const toCoord = getPositionFromPath(toPath);
  const fromCoord = splitFromEntity(tile);
  const inRange = withinRange(fromCoord, toCoord, 1);
  if (!inRange) return false;
  return true;
};

export const getCanPickupRange = (
  components: ClientComponents,
  toHost: Entity,
  tile: Entity
) => {
  const { Path } = components;
  const toPath = getComponentValue(Path, toHost);
  if (!toPath) return false;
  const toCoord = getPositionFromPath(toPath);
  const fromCoord = splitFromEntity(tile);
  const inRange = withinRange(fromCoord, toCoord, 1);
  if (!inRange) return false;
  return true;
};

// check host needs to be in space
export const useInSpace = (
  components: ClientComponents,
  network: SetupNetworkResult,
  host: Entity
) => {
  const { Owner } = components;
  const owner = useComponentValue(Owner, host)?.value as Hex;
  const space = pad(network.worldContract.address);
  return owner === space;
};

export const getERC721Drops = (
  components: ClientComponents,
  tileX: number,
  tileY: number
) => {
  const dropId = getDropContainer(tileX, tileY);
  return getERC721s(components, dropId as Entity);
};

export const useERC721Drops = (
  components: ClientComponents,
  tileX: number,
  tileY: number
) => {
  const dropId = getDropContainer(tileX, tileY);
  return useERC721s(components, dropId as Entity);
};

export const getERC20Drops = (
  components: ClientComponents,
  tileX: number,
  tileY: number
) => {
  const dropId = getDropContainer(tileX, tileY);
  return getERC20Balances(components, dropId);
};

// depend on ERC20_TYPES whitelist
export const useERC20Drops = (
  components: ClientComponents,
  tileX: number,
  tileY: number
) => {
  useRerender();
  return getERC20Drops(components, tileX, tileY);
};

export const isDropContainer = (entity: Entity) => {
  const { drop } = splitDropContainer(BigInt(entity));
  return drop === BigInt(DROP);
};

export const getDropContainer = (tileX: number, tileY: number) => {
  const result =
    (BigInt(DROP) << BigInt(128)) |
    (BigInt(tileX) << BigInt(64)) |
    BigInt(tileY);
  return castToBytes32(result);
};

export const splitDropContainer = (container: bigint) => {
  const drop = container >> 128n;
  const xy = container & 0xffffffffffffffffffffffffffffffffn;
  const tileX = Number(xy >> 64n);
  const tileY = Number(xy & 0xffffffffffffffffn);
  // console.log({ drop, tileX, tileY });
  return { drop, tileX, tileY };
};
