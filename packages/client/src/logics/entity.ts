import {
  Entity,
  getComponentValue,
  Component,
  setComponent,
  HasValue,
  runQuery,
} from "@latticexyz/recs";
import { Hex, pad } from "viem";
import { ClientComponents } from "../mud/createClientComponents";
import { encodeTypeEntity } from "../utils/encode";
import { BLOOD, HOST, MINER, STAMINA } from "../contract/constants";
import { POOL_TYPES, SOURCE } from "../constants";
import { SetupNetworkResult } from "../mud/setupNetwork";
import { useComponentValue } from "@latticexyz/react";

export function getEntitySpecs<
  S extends ClientComponents[keyof ClientComponents]["schema"],
>(components: ClientComponents, specsComponent: Component<S>, entity: Entity) {
  const entityType = getComponentValue(components.EntityType, entity)
    ?.value as Hex;
  const specs = getComponentValue(
    specsComponent,
    encodeTypeEntity(entityType ?? "") as Entity
  );

  return specs;
}

export function isPoolType(entityType: Hex) {
  return POOL_TYPES.includes(entityType);
}

export function isHost(components: ClientComponents, entity: Entity) {
  return (
    getEntitySpecs(components, components.ContainerSpecs, entity) !== undefined
  );
}

export function isBuildingMiner(
  components: ClientComponents,
  building: Entity
) {
  return getComponentValue(components.EntityType, building)?.value === MINER;
}

export function isBuildingStaker(
  components: ClientComponents,
  building: Entity
) {
  const { StakeSpecs, EntityType } = components;
  const entityType = getComponentValue(EntityType, building)?.value as Hex;
  const outputTypes = [
    ...runQuery([HasValue(StakeSpecs, { buildingType: entityType })]),
  ];
  return outputTypes.length > 0;
}

export function isBuilding(components: ClientComponents, entity: Entity) {
  return (
    getEntitySpecs(components, components.BuildingSpecs, entity) !== undefined
  );
}

export function isRole(components: ClientComponents, entity: Entity) {
  const entityType = getComponentValue(components.EntityType, entity)
    ?.value as Hex;
  return entityType === HOST;
}

export function getFirstHost(
  components: ClientComponents,
  playerEntity: Entity
) {
  const { Commander } = components;
  const hosts = [...runQuery([HasValue(Commander, { value: playerEntity })])];
  return hosts[0];
}

export function selectFirstHost(
  components: ClientComponents,
  playerEntity: Entity
) {
  const host = getFirstHost(components, playerEntity);
  if (!host) return;
  setComponent(components.SelectedHost, SOURCE, { value: host });
  return host;
}

export function selectNextHost(
  components: ClientComponents,
  playerEntity: Entity
) {
  const { SelectedHost, Commander } = components;
  const selectedHost = getComponentValue(SelectedHost, SOURCE)?.value;
  const hosts = [...runQuery([HasValue(Commander, { value: playerEntity })])];
  const index = hosts.findIndex((host) => host === selectedHost);
  const nextIndex = (index + 1) % hosts.length;
  setComponent(SelectedHost, SOURCE, { value: hosts[nextIndex] });
}

export function selectHost(components: ClientComponents, hostEntity: Entity) {
  const { SelectedHost, Commander } = components;
  setComponent(SelectedHost, SOURCE, { value: hostEntity });
}

export function getTopHost(
  components: ClientComponents,
  network: SetupNetworkResult,
  entity: Entity
) {
  let curr = entity as Hex;
  while (curr) {
    const next = getComponentValue(components.Owner, curr as Entity)
      ?.value as Hex;
    if (next === (pad(network.worldContract.address) as Hex)) {
      return curr;
    } else if (!next) {
      return undefined;
    }
    curr = next;
  }
}

export function getHostsEntity(
  components: ClientComponents,
  network: SetupNetworkResult
): Entity[] {
  return [
    ...runQuery([
      HasValue(components.Commander, { value: network.playerEntity }),
    ]),
  ];
}

export const getEntityOnTile = (
  components: ClientComponents,
  tileId: Entity
) => {
  const { TileEntity } = components;
  const entity = getComponentValue(TileEntity, tileId)?.value as Entity;
  return entity;
};

export const useEntityOnTile = (
  components: ClientComponents,
  tileId: Entity
) => {
  const { TileEntity } = components;
  const entity = useComponentValue(TileEntity, tileId)?.value as Entity;
  return entity;
};
