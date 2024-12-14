import { Entity, setComponent } from "@latticexyz/recs";
import { ClientComponents } from "../mud/createClientComponents";
import { Vector } from "../utils/vector";
import { unixTimeSecond } from "../utils/time";

export const mockPath = (
  components: ClientComponents,
  role: Entity,
  coord: Vector
) => {
  setComponent(components.Path, role, {
    fromX: coord.x,
    fromY: coord.y,
    toX: coord.x,
    toY: coord.y,
    lastUpdated: unixTimeSecond(),
    duration: 0,
    __staticData: undefined,
    __encodedLengths: undefined,
    __dynamicData: undefined,
  });
};
