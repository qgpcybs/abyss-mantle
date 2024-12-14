import { Entity } from "@latticexyz/recs";
import { ClientComponents } from "../mud/createClientComponents";
import { useComponentValue } from "@latticexyz/react";

// check if player is host's controller
export const useController = (
  components: ClientComponents,
  host: Entity,
  player: Entity
) => {
  const { Commander, Creator } = components;
  const commander = useComponentValue(Commander, host)?.value;
  const creator = useComponentValue(Creator, host)?.value;
  const isController = commander === player || creator === player;
  return isController;
};
