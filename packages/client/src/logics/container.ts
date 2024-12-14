import {
  Entity,
  getComponentValue,
  HasValue,
  runQuery,
} from "@latticexyz/recs";
import { ClientComponents } from "../mud/createClientComponents";
import { getEntitySpecs, isPoolType } from "./entity";
import { SetupNetworkResult } from "../mud/setupNetwork";
import { Hex, pad } from "viem";
import { encodeEntity, singletonEntity } from "@latticexyz/store-sync/recs";
import { getPool } from "../contract/hashes";
import { encodeTypeEntity, splitBytes32 } from "../utils/encode";
import { ERC20_TYPES } from "../constants";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";

export function canStoreOutputs(
  components: ClientComponents,
  store: Entity,
  outputs: Hex[]
) {
  const outputsSize = getOutputsSize(components, outputs);
  const storedRemained = getStoreRemainedCapacity(components, store);
  return outputsSize <= storedRemained;
}

/**
 * get the total size of outputs, including erc721s
 */
export function getOutputsSize(components: ClientComponents, outputs: Hex[]) {
  const { SizeSpecs } = components;
  const outputsData = outputs.map((output) => splitBytes32(output));
  const sizes = outputsData.map((output) => {
    const size = Number(
      getComponentValue(SizeSpecs, output.type as Entity)?.size ?? 0
    );
    // if amount is zero, it means it's an erc721
    return output.amount === 0 ? size : size * output.amount;
  });
  return sizes.reduce((a, b) => a + b, 0);
}

/**
 * get store's remained capacity
 */
export function getStoreRemainedCapacity(
  components: ClientComponents,
  store: Entity
) {
  const { StoredSize, ContainerSpecs } = components;
  const storedSize = getComponentValue(StoredSize, store)?.value ?? 0n;
  const capacity =
    getEntitySpecs(components, ContainerSpecs, store)?.capacity ?? 0n;
  return Number(capacity - storedSize);
}

export function canStoreERC721(
  components: ClientComponents,
  entity: Entity,
  store: Entity
) {
  const { SizeSpecs } = components;
  const size = getEntitySpecs(components, SizeSpecs, entity)?.size;
  return canIncreaseStoredSize(components, store, size ?? 0n);
}

export function canStoreERC20Amount(
  components: ClientComponents,
  resourceType: Hex,
  store: Entity
) {
  const { StoredSize, ContainerSpecs, SizeSpecs } = components;
  const storedSize = getComponentValue(StoredSize, store)?.value ?? 0n;
  const resourceSize = getComponentValue(
    SizeSpecs,
    encodeTypeEntity(resourceType) as Entity
  )?.size;
  const capacity = getEntitySpecs(components, ContainerSpecs, store)?.capacity;
  if (!resourceSize || !capacity) return 0n;
  return (capacity - storedSize) / resourceSize;
}

export function canIncreaseStoredSize(
  components: ClientComponents,
  store: Entity,
  increaseSize: bigint,
  network?: SetupNetworkResult
) {
  if (network) {
    const space = pad(network.worldContract.address) as Hex;
    if (store === space) return true;
  }
  const { ContainerSpecs, StoredSize } = components;
  const storedSize = getComponentValue(StoredSize, store)?.value ?? 0n;
  const capacity = getEntitySpecs(components, ContainerSpecs, store)?.capacity;
  if (!capacity) return false;
  return capacity >= storedSize + increaseSize;
}

// generalized (including pool) canStoreERC20Amount
export const getRemainedERC20Amount = (
  components: ClientComponents,
  role: Hex,
  erc20Type: Hex
) => {
  const { StoredSize, ContainerSpecs, SizeSpecs } = components;
  const store = getERC20Store(role, erc20Type) as Entity;
  const storedSize = getComponentValue(StoredSize, store)?.value ?? 0n;
  const erc20TypeEntity = encodeTypeEntity(erc20Type) as Entity;
  const erc20Size = getComponentValue(SizeSpecs, erc20TypeEntity)?.size ?? 1n;
  const capacity =
    getEntitySpecs(components, ContainerSpecs, store)?.capacity ?? 0n;
  return (capacity - storedSize) / erc20Size;
};

// general usage for both pool & role
export const getERC20Capacity = (
  components: ClientComponents,
  role: Hex,
  erc20Type: Hex
): bigint => {
  const store = getERC20Store(role, erc20Type);
  const { ContainerSpecs } = components;
  return (
    getEntitySpecs(components, ContainerSpecs, store as Entity)?.capacity ?? 0n
  );
};

// general usage for both pool & role
export const hasERC20Balance = (
  components: ClientComponents,
  role: Hex,
  erc20Type: Hex,
  amount: bigint
) => {
  return getERC20Balance(components, role, erc20Type) >= amount;
};

// excluding pool types
export const getERC20Balances = (components: ClientComponents, host: Hex) => {
  return ERC20_TYPES.map((erc20Type) => {
    const balance = getERC20Balance(components, host, erc20Type);
    return {
      erc20Type,
      balance,
    };
  }).filter((erc20) => erc20.balance > 0n);
};

// general usage for both pool & role
export const getERC20Balance = (
  components: ClientComponents,
  role: Hex,
  erc20Type: Hex
) => {
  // const store = getERC20Store(role, erc20Type);
  return getBalance(components, role as Entity, erc20Type);
};

// general usage for both pool & role
export const getERC20Store = (role: Hex, erc20Type: Hex) => {
  return isPoolType(erc20Type) ? getPool(role, erc20Type) : role;
};

// note: this can be used for any erc20 balance?
export function getBalance(
  components: ClientComponents,
  store: Entity,
  erc20Type: Hex
) {
  const balanceEntity = getBalanceEntity(erc20Type, store as Hex);
  return getComponentValue(components.Balance, balanceEntity)?.value ?? 0n;
}

export function useBalance(
  components: ClientComponents,
  store: Entity,
  erc20Type: Hex
) {
  const balanceEntity = getBalanceEntity(erc20Type, store as Hex);
  const balance =
    useComponentValue(components.Balance, balanceEntity)?.value ?? 0n;
  return balance;
}

export function hasBalance(
  components: ClientComponents,
  store: Entity,
  erc20Type: Hex,
  amount: bigint
) {
  const balance = getBalance(components, store, erc20Type);
  return balance && balance >= amount;
}

export function getBalanceEntity(entityType: Hex, owner: Hex) {
  if (!entityType || !owner) return singletonEntity;
  const entity = encodeEntity(
    { entityType: "bytes16", owner: "bytes32" },
    {
      entityType,
      owner: pad(owner),
    }
  );
  return entity;
}

export function getERC721s(components: ClientComponents, store: Entity) {
  const { Owner } = components;
  return [...runQuery([HasValue(Owner, { value: store })])];
}

export const useERC721s = (components: ClientComponents, store: Entity) => {
  const { Owner } = components;
  const entities = useEntityQuery([HasValue(Owner, { value: store })]);
  return entities;
};
