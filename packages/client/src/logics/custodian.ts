import {
  Entity,
  getComponentValue,
  HasValue,
  runQuery,
} from "@latticexyz/recs";
import { ClientComponents } from "../mud/createClientComponents";
import { getCustodian } from "../contract/hashes";
import { Hex } from "viem";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";

/**
 * check if entity is in custodian of host; used in mining & equipment
 */
export const inCustodian = (
  components: ClientComponents,
  host: Entity,
  entity: Entity
) => {
  const { Owner } = components;
  const owner = getComponentValue(Owner, entity)?.value as Entity;
  if (!owner) return false;
  return owner === getCustodian(host as Hex);
};

export const useInCustodian = (
  components: ClientComponents,
  host: Entity,
  entity: Entity
) => {
  const { Owner } = components;
  const owner = useComponentValue(Owner, entity)?.value as Entity;
  if (!owner) return false;
  return owner === getCustodian(host as Hex);
};

export const useEntitiesInCustodian = (
  components: ClientComponents,
  host: Entity
) => {
  const { Owner } = components;
  const custodian = getCustodian(host as Hex) as Entity;
  const entities = useEntityQuery([HasValue(Owner, { value: custodian })]);
  return entities as Entity[];
};

export const getEntitiesInCustodian = (
  components: ClientComponents,
  host: Entity
) => {
  const { Owner } = components;
  const custodian = getCustodian(host as Hex) as Entity;
  const entities = [...runQuery([HasValue(Owner, { value: custodian })])];
  return entities as Entity[];
};
