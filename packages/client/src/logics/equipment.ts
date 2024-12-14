import { Hex } from "viem";
import { ClientComponents } from "../mud/createClientComponents";
import {
  Entity,
  getComponentValue,
  HasValue,
  runQuery,
} from "@latticexyz/recs";
import { decodeBalanceEntity, encodeBalanceEntity } from "../utils/encode";
import { getPoolAmount, usePoolAmount } from "./pool";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { WEAPON, ATTACK, RANGE, ARMOR, DEFENSE } from "../contract/constants";
import { useEntitiesInCustodian, useInCustodian } from "./custodian";

/**
 * check if entity is being equipped by host
 * OR, useEquipmentInfo().host === host
 */
export const useIsEquipped = (
  components: ClientComponents,
  host: Entity,
  entity: Entity
) => {
  return useInCustodian(components, host, entity);
};

export const useHostEquipments = (
  components: ClientComponents,
  host: Entity
) => {
  return useEntitiesInCustodian(components, host);
};

/**
 * @returns an equipment entity's equipType and owner; returns undefined if entity is NOT equipped
 */
export const getEquipmentInfo = (
  components: ClientComponents,
  entity: Entity
) => {
  const { Equipment } = components;
  const equipEntity = [
    ...runQuery([HasValue(Equipment, { equipment: entity })]),
  ][0];
  if (!equipEntity) return;
  const { type, owner } = decodeBalanceEntity(equipEntity);
  return { host: owner, equipType: type };
};

export const useEquipmentInfo = (
  components: ClientComponents,
  entity: Entity
) => {
  const { Equipment } = components;
  const equipEntity = useEntityQuery([
    HasValue(Equipment, { equipment: entity }),
  ])[0];
  if (!equipEntity) return;
  const { type, owner } = decodeBalanceEntity(equipEntity);
  return { host: owner, equipType: type };
};

/**
 * @returns the equip info of a host entity, including armor & weapon Ids and their stats
 */
export const getHostEquipInfo = (
  components: ClientComponents,
  host: Entity
) => {
  const armor = getEquipment(components, host, ARMOR);
  const defense = getEquipmentStats(components, host, ARMOR, DEFENSE);
  const weapon = getEquipment(components, host, WEAPON);
  const attack = getEquipmentStats(components, host, WEAPON, ATTACK);
  const range = getEquipmentStats(components, host, WEAPON, RANGE);
  return { armor, defense, weapon, attack, range };
};

export const useHostEquipInfo = (
  components: ClientComponents,
  host: Entity
) => {
  const armor = useEquipment(components, host, ARMOR);
  const defense = useEquipmentStats(components, host, ARMOR, DEFENSE);
  const weapon = useEquipment(components, host, WEAPON);
  const attack = useEquipmentStats(components, host, WEAPON, ATTACK);
  const range = useEquipmentStats(components, host, WEAPON, RANGE);
  return { armor, defense, weapon, attack, range };
};

/**
 * @returns equipmentId of host's equipType
 */
export const getEquipment = (
  components: ClientComponents,
  host: Entity,
  equipType: Hex
) => {
  const { Equipment } = components;
  const balanceEntity = encodeBalanceEntity(equipType, host as Hex);
  const equipment = getComponentValue(Equipment, balanceEntity)
    ?.equipment as Entity;
  return equipment;
};

export const useEquipment = (
  components: ClientComponents,
  host: Entity,
  equipType: Hex
) => {
  const { Equipment } = components;
  const balanceEntity = encodeBalanceEntity(equipType, host as Hex);
  const equipment = useComponentValue(Equipment, balanceEntity)
    ?.equipment as Entity;
  return equipment;
};

/**
 * mirror function in EquipmentLogic
 * @host entity such as role or building
 * @equipType such as WEAPON or ARMOR
 * @poolType stats such as ATTACK, DEFENSE, or RANGE
 * @returns one stats of host's equipType & poolType
 */
export const getEquipmentStats = (
  components: ClientComponents,
  host: Entity,
  equipType: Hex,
  poolType: Hex
): number => {
  const equipment = getEquipment(components, host, equipType);
  return getPoolAmount(components, equipment, poolType);
};

export const useEquipmentStats = (
  components: ClientComponents,
  host: Entity,
  equipType: Hex,
  poolType: Hex
): number => {
  const equipment = useEquipment(components, host, equipType);
  const balance = usePoolAmount(components, equipment, poolType);
  return balance;
};
