import { Entity, getComponentValue } from "@latticexyz/recs";
import { ClientComponents } from "../mud/createClientComponents";

export const isCommander = (
  components: ClientComponents,
  playerEntity: Entity,
  role: Entity
) => {
  return getComponentValue(components.Commander, role)?.value === playerEntity;
};

export const isCreator = (
  components: ClientComponents,
  playerEntity: Entity,
  role: Entity
) => {
  return getComponentValue(components.Creator, role)?.value === playerEntity;
};

export const isController = (
  components: ClientComponents,
  playerEntity: Entity,
  role: Entity
) => {
  return (
    isCommander(components, playerEntity, role) ||
    isCreator(components, playerEntity, role)
  );
};
