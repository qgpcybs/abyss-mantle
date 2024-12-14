import { Hex } from "viem";
import { ClientComponents } from "../mud/createClientComponents";
import {
  getComponentValue,
  Entity,
  ComponentValue,
  runQuery,
  HasValue,
} from "@latticexyz/recs";
import { unixTime, unixTimeSecond } from "../utils/time";
import { splitFromEntity } from "./move";
import { SetupNetworkResult } from "../mud/setupNetwork";
import { getTopHost } from "./entity";
import { getNestedHostPosition } from "./building";
import { getMiningHostPosition } from "./mining";

export const getPosition = (components: ClientComponents, entity: Entity) => {
  const { Path } = components;
  const path = getComponentValue(components.Path, entity);
  if (!path) return;
  return { x: path.toX, y: path.toY };
};

export const getReadyPosition = (
  components: ClientComponents,
  host: Entity
) => {
  const path = getComponentValue(components.Path, host);
  // console.log("getReadyPosition", path);
  if (!path) return;
  if (path.lastUpdated + path.duration > unixTimeSecond()) return;
  // if (path!.lastUpdated ?? 0 > unixTimeSecond()) return;
  return { x: path?.toX, y: path?.toY };
};

export const arrived = (
  path: ComponentValue<ClientComponents["Path"]["schema"]>,
  time?: number
) => {
  time = time ?? unixTimeSecond();
  return getRemainingArrivalTime(path, time) === 0;
};

export const getRemainingArrivalTime = (
  path: ComponentValue<ClientComponents["Path"]["schema"]>,
  time?: number
) => {
  time = time ?? unixTimeSecond();
  const arrivalTime = path.lastUpdated + path.duration;
  return time >= arrivalTime ? 0 : arrivalTime - time;
};

// host to be on map, in building, is mining
export const getHostPosition = (
  components: ClientComponents,
  network: SetupNetworkResult,
  host: Entity
) => {
  const position = getNestedHostPosition(components, network, host);
  if (position) return position;
  const position2 = getMiningHostPosition(components, host);
  if (position2) return position2;
  return;
};

export const getPathEntityPosition = (
  components: ClientComponents,
  entity: Entity,
  time?: number
) => {
  const path = getComponentValue(components.Path, entity);
  if (!path) return;
  return getPositionFromPath(path, time);
};

export const getPositionFromPath = (
  path: ComponentValue<ClientComponents["Path"]["schema"]>,
  time?: number
) => {
  time = time ?? unixTime();
  const duration = time - path.lastUpdated;
  if (duration < 0) {
    // should console.error
    return { x: path.fromX, y: path.fromY };
  }
  const dt = path.duration;
  if (dt === 0) return { x: path.toX, y: path.toY };
  if (arrived(path, time)) return { x: path.toX, y: path.toY };

  const dx = path.toX - path.fromX;
  const dy = path.toY - path.fromY;
  // const x = uint32MaxBounds(path.fromX + (dx * duration) / dt);
  // const y = uint32MaxBounds(path.fromY + (dy * duration) / dt);
  // refactor for monocats because iso coord is not uint32
  const x = path.fromX + (dx * duration) / dt;
  const y = path.fromY + (dy * duration) / dt;
  return { x, y };
};

// -------------------------- TileEntity logic --------------------------
// tile entity like building has no path
export const getTileEntityPosition = (
  components: ClientComponents,
  tileEntity: Entity
) => {
  const tileId = [
    ...runQuery([HasValue(components.TileEntity, { value: tileEntity })]),
  ][0];
  if (!tileId) return;
  return splitFromEntity(tileId);
};

export const getTileEntityPositions = (
  components: ClientComponents,
  tileEntity: Entity
) => {
  const tileIds = [
    ...runQuery([HasValue(components.TileEntity, { value: tileEntity })]),
  ];
  if (!tileIds.length) return;
  return tileIds.map((tileId) => splitFromEntity(tileId));
};

// // only top host can be tile entity
// export const getTopTileEntity = (
//   components: ClientComponents,
//   network: SetupNetworkResult,
//   entity: Entity
// ) => {
//   const topHost = getTopHost(components, network, entity);
//   if (!topHost) return;
//   const tileId = [
//     ...runQuery([HasValue(components.TileEntity, { value: topHost })]),
//   ][0];
//   return tileId;
// };
