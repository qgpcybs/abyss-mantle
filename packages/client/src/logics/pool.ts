import { Hex } from "viem";
import { ClientComponents } from "../mud/createClientComponents";
import { getPool } from "../contract/hashes";
import { Entity, getComponentValue } from "@latticexyz/recs";
import { getBalance, getBalanceEntity, useBalance } from "./container";
import { getEntitySpecs } from "./entity";
import { encodeTypeEntity, fromEntity } from "../utils/encode";
import { useComponentValue } from "@latticexyz/react";

// note: pool amount is of number type although balance is not

/**
 * return an entity's all stats info, {type, capacity, balance}
 */
export const getEntityPoolsInfo = (
  components: ClientComponents,
  entity: Entity
) => {
  const pools = getEntityPools(components, entity);
  const poolsInfo = pools.map((pool) => {
    const { type, capacity } = pool;
    const balance = getPoolAmount(components, entity, type);
    return { type, capacity, balance };
  });
  return poolsInfo;
};

export const getEntityPools = (
  components: ClientComponents,
  entity: Entity
) => {
  const { StatsSpecs, EntityType } = components;
  const entityType = getComponentValue(EntityType, entity)?.value as Hex;
  if (!entityType) return [];
  const encodedType = encodeTypeEntity(entityType) as Entity;
  const maxPoolsHex = (getComponentValue(StatsSpecs, encodedType)?.maxPools ??
    []) as Hex[];
  const pools = maxPoolsHex.map((pool) => {
    const { type, id } = fromEntity(pool);
    return { type, capacity: Number(id) };
  });
  return pools;
};

export const useEntityPools = (
  components: ClientComponents,
  entity: Entity
) => {
  const { StatsSpecs, EntityType } = components;
  const entityType = useComponentValue(EntityType, entity)?.value as Hex;
  if (!entityType) return [];
  const encodedType = encodeTypeEntity(entityType) as Entity;
  const maxPoolsHex = (getComponentValue(StatsSpecs, encodedType)?.maxPools ??
    []) as Hex[];
  const pools = maxPoolsHex.map((pool) => {
    const { type, id } = fromEntity(pool);
    return { type, capacity: Number(id) };
  });
  return pools;
};

export const usePoolAmount = (
  components: ClientComponents,
  entity: Entity,
  poolType: Hex
) => {
  const balance = useBalance(components, entity, poolType);
  return Number(balance);
};

export const hasPoolAmount = (
  components: ClientComponents,
  entity: Entity,
  poolType: Hex,
  amount: number
) => {
  return getPoolAmount(components, entity, poolType) >= amount;
};

export const getPoolAmount = (
  components: ClientComponents,
  entity: Entity,
  poolType: Hex
) => {
  return Number(getBalance(components, entity, poolType));
};

// check if entity has pool in its StatsSpecs maxPools
export const hasPoolCapaicty = (
  components: ClientComponents,
  entity: Entity,
  poolType: Hex
) => {
  return getPoolCapacity(components, entity, poolType) !== 0;
};

export const getPoolCapacity = (
  components: ClientComponents,
  entity: Entity,
  poolType: Hex
) => {
  const { StatsSpecs } = components;
  const maxPoolsHex = (getEntitySpecs(components, StatsSpecs, entity)
    ?.maxPools ?? []) as Hex[];
  const maxPools = maxPoolsHex.map((pool) => fromEntity(pool));
  const maxPool = maxPools.find((pool) => pool.type === poolType)?.id ?? 0n;
  return Number(maxPool);
};
