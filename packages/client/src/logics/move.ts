import {
  Entity,
  getComponentValue,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { Vector, getRectangleCoords } from "../utils/vector";
import { SOURCE, TARGET, TerrainType } from "../constants";
import { ClientComponents } from "../mud/createClientComponents";
import { canMoveTo, getEntityOnCoord } from "./map";
import {
  getGridTerrains,
  getTerrainFromTerrainValue,
  GRID_SIZE,
  TileTerrainMap,
} from "./terrain";
import { SystemCalls } from "../mud/createSystemCalls";
import { MAX_MOVES } from "../contract/constants";
import { getReadyPosition } from "./path";
import { dijkstraPathfinding } from "../utils/pathFinding";
import { isRole } from "./entity";
import { canMoveToBuilding } from "./building";
import { castToBytes32 } from "../utils/encode";

export enum Direction {
  NONE = 0,
  UP = 1,
  DOWN = 2,
  LEFT = 3,
  RIGHT = 4,
}

export const getFourCoords = (position: Vector) => {
  const { x, y } = position;
  return [
    { x, y: y > 0 ? y - 1 : y },
    { x, y: y + 1 },
    { x: x > 0 ? x - 1 : x, y },
    { x: x + 1, y },
  ];
};

// TODO: temp for fromPosition
export function getPositionFromPath(
  components: ClientComponents,
  role: Entity
) {
  const { Path } = components;
  const path = getComponentValue(Path, role);
  if (!path) return;
  return { x: path.toX, y: path.toY };
}

// check if tile has building that host can move accross
export const canMoveAcrossTile = (
  components: ClientComponents,
  tileId: Entity,
  host?: Entity
) => {
  // TODO: check if terrain type is passable
  const { TileEntity } = components;
  const tileEntity = getComponentValue(
    TileEntity,
    castToBytes32(BigInt(tileId)) as Entity
  )?.value as Entity;
  if (!tileEntity) return true;
  if (isRole(components, tileEntity)) return true;
  const canBuilding = canMoveToBuilding(components, tileEntity, host);
  // console.log("canMoveAcrossTile", tileId, tileEntity, canBuilding);
  return canBuilding;
};

// calc moves to move from role's curr position -> target tile coord
export const calculatePathMoves = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  role: Entity
) => {
  const pathCoords = calculatePathCoords(components, systemCalls, role);
  if (!pathCoords) return;
  const moves = coordsToMoves(pathCoords);
  if (!moves) return;
  return moves;
};

export const coordsToMoves = (coords: Vector[]) => {
  if (coords.length === 0) return;
  const moves = coords
    .slice(1)
    .map((coord, index) => pathToMove(coords[index], coord));
  if (moves.includes(Direction.NONE)) return;
  return moves;
};

// determine one path direction
export const pathToMove = (from: Vector, to: Vector): Direction => {
  if (from.x === to.x && from.y - 1 === to.y) return Direction.UP;
  if (from.x === to.x && from.y + 1 === to.y) return Direction.DOWN;
  if (from.x - 1 === to.x && from.y === to.y) return Direction.LEFT;
  if (from.x + 1 === to.x && from.y === to.y) return Direction.RIGHT;
  console.log("direction none", from, to);
  return Direction.NONE;
};

// calc coords to move from role's curr position -> target tile coord
export const calculatePathCoords = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  role: Entity
) => {
  const { TargetTile, Path } = components;
  const targetCoordId = getComponentValue(TargetTile, TARGET)?.value;
  if (!targetCoordId) return;
  const targetCoord = splitFromEntity(targetCoordId);
  return calculatePathToTargetCoord(components, systemCalls, role, targetCoord);
};

// calc coords to move from role -> target tile coord
export const calculatePathToTargetCoord = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  role: Entity,
  targetCoord: Vector
) => {
  const sourceCoord = getPositionFromPath(components, role);
  if (!sourceCoord) return;
  // available coords need to go through several grids' terrainValues
  const targetGridCoord = {
    x: Math.floor(targetCoord.x / GRID_SIZE),
    y: Math.floor(targetCoord.y / GRID_SIZE),
  };
  const sourceGridCoord = {
    x: Math.floor(sourceCoord.x / GRID_SIZE),
    y: Math.floor(sourceCoord.y / GRID_SIZE),
  };
  // if targetCoord cannot move to, return
  if (!canMoveTo(components, systemCalls, targetCoord)) return;
  // calculate gridCoords as any coords between source and target
  let extra = 0; // extra coords to check
  const extra_max = 4;
  let pathCoords = null;
  while (extra <= extra_max && !pathCoords) {
    const gridCoords = getRectangleCoords(
      sourceGridCoord,
      targetGridCoord,
      extra
    );
    let terrains: TileTerrainMap[] = [];
    gridCoords.forEach((coord) => {
      const gridId = combineToEntity(coord.x, coord.y);
      terrains = terrains.concat(getGridTerrains(components, gridId));
    });
    // check if terrain has a building to walk on
    const terrains_building = terrains.map((terrain) => {
      const tileId = combineToEntity(terrain.x, terrain.y);
      if (canMoveAcrossTile(components, tileId, role)) return terrain;
      return {
        ...terrain,
        terrainType: TerrainType.BUILDING,
      };
    });
    pathCoords = dijkstraPathfinding(
      sourceCoord,
      targetCoord,
      terrains_building
    );
    extra++;
  }
  return pathCoords;
};

export const calculateOtherHostPathCoords = (
  components: ClientComponents,
  targetCoord: {
    x: number;
    y: number;
  },
  sourceCoord: {
    x: number;
    y: number;
  },
  role: Entity
) => {
  // calculate gridCoords as any coords between source and target
  let extra = 0; // extra coords to check
  const extra_max = 4;
  let pathCoords = null;
  while (extra <= extra_max && !pathCoords) {
    const targetGridCoord = {
      x: Math.floor(targetCoord.x / GRID_SIZE),
      y: Math.floor(targetCoord.y / GRID_SIZE),
    };
    const sourceGridCoord = {
      x: Math.floor(sourceCoord.x / GRID_SIZE),
      y: Math.floor(sourceCoord.y / GRID_SIZE),
    };
    const gridCoords = getRectangleCoords(
      sourceGridCoord,
      targetGridCoord,
      extra
    );
    let terrains: TileTerrainMap[] = [];
    gridCoords.forEach((coord) => {
      const gridId = combineToEntity(coord.x, coord.y);
      terrains = terrains.concat(getGridTerrains(components, gridId));
    });
    // check if terrain has a building to walk on
    const terrains_building = terrains.map((terrain) => {
      const tileId = combineToEntity(terrain.x, terrain.y);
      if (canMoveAcrossTile(components, tileId, role)) return terrain;
      return {
        ...terrain,
        terrainType: TerrainType.BUILDING,
      };
    });

    pathCoords = dijkstraPathfinding(
      sourceCoord,
      targetCoord,
      terrains_building
    );
    extra++;
  }
  return pathCoords;
};

// set new target coord from direction
export const setNewTargetTilebyDirection = (
  components: ClientComponents,
  direction: Direction
) => {
  const coord = getNewTargetTile(components, direction);
  if (!coord) return;
  setComponent(components.TargetTile, TARGET, {
    value: combineToEntity(coord.x, coord.y),
  });
  return coord;
};

export const setNewTargetTile = (
  components: ClientComponents,
  coord: {
    x: number;
    y: number;
  }
) => {
  setComponent(components.TargetTile, TARGET, {
    value: combineToEntity(coord.x, coord.y),
  });
  return coord;
};

// get new target coord from direction
export const getNewTargetTile = (
  components: ClientComponents,
  direction: Direction
) => {
  const tileId = getComponentValue(components.TargetTile, TARGET)?.value;
  // TODO?: could check if any selected host, any player host, then return default?
  if (!tileId) return;
  const coord = splitFromEntity(tileId);
  // TODO: check if on map
  switch (direction) {
    case Direction.UP:
      return { x: coord.x, y: coord.y - 1 };
    case Direction.DOWN:
      return { x: coord.x, y: coord.y + 1 };
    case Direction.LEFT:
      return { x: coord.x - 1, y: coord.y };
    case Direction.RIGHT:
      return { x: coord.x + 1, y: coord.y };
  }
};

export function hasPendingMoves(components: ClientComponents, role: Entity) {
  // check if unresolved moves
  const unresolvedMoves =
    getComponentValue(components.Moves, role)?.value ?? [];
  const hasMoves = unresolvedMoves.length > 0;
  return hasMoves;
}

// rename it as getEntityOnDirection?
export function getEntityOnDirection(
  components: ClientComponents,
  role: Entity
) {
  const to = getDirectionCoord(components, role);
  if (!to) return undefined;
  return getEntityOnCoord(components, to);
}

export function getBuildingOnDirection(
  components: ClientComponents,
  role: Entity
) {
  const to = getDirectionCoord(components, role);
  if (!to) return undefined;
  return getEntityOnCoord(components, to);
}

export function getTerrainOnDirection(
  components: ClientComponents,
  role: Entity
) {
  const to = getDirectionCoord(components, role);
  if (!to) return undefined;
  return getTerrainFromTerrainValue(components, to);
}

export function getDirectionCoord(components: ClientComponents, role: Entity) {
  const { Moves, RoleDirection, Position } = components;
  const moves = getComponentValue(Moves, role)?.value ?? [];
  const position = getComponentValue(Position, role);
  const direction =
    getComponentValue(RoleDirection, role)?.value ?? Direction.DOWN;
  if (!position) return undefined;
  const positions = movesToPositions([...moves, direction], {
    x: position.x,
    y: position.y,
  });
  const toPosition = positions[positions.length - 1];
  return toPosition;
}

export const updateMoves = (
  components: ClientComponents,
  systemCalls: SystemCalls,
  direction: Direction
) => {
  const { Moves, SelectedHost } = components;
  // there must be a selected host for it to start moving
  const source = getComponentValue(SelectedHost, SOURCE)?.value;
  if (!source) return;
  const moves = getComponentValue(Moves, source)?.value ?? [];
  let newMoves = [...moves];
  // console.log("updateMoves", direction, moves);
  if (moves.length === 0) {
    newMoves = [direction as number];
  } else {
    const lastMove = moves[moves.length - 1];
    if (oppositeDirection(lastMove, direction)) {
      newMoves.pop();
    } else {
      newMoves.push(direction as number);
    }
  }
  const validMoves = validMovesForHost(
    components,
    systemCalls,
    source,
    newMoves
  );
  // console.log("validMoves", newMoves, validMoves);
  if (!validMoves || validMoves.length === 0)
    return removeComponent(Moves, source);
  setComponent(Moves, source, { value: validMoves });
};

export const oppositeDirection = (d1: Direction, d2: Direction) => {
  return d1 + d2 === 1 || d1 + d2 === 5;
};

// assuming moves are valid
export function movesToPositions(moves: Direction[], from: Vector): Vector[] {
  if (moves.length === 0) return [from];
  return moves.reduce(
    (acc, move) => {
      const last = acc[acc.length - 1];
      return [...acc, moveTo(move, last)];
    },
    [from]
  );
}

export function validMovesForHost(
  components: ClientComponents,
  systemCalls: SystemCalls,
  host: Entity,
  moves: Direction[]
) {
  const position = getReadyPosition(components, host);
  // console.log("position", position);

  if (!position) return;
  return validMovesFrom(components, systemCalls, host, position, moves);
}

export function validMovesFrom(
  components: ClientComponents,
  systemCalls: SystemCalls,
  host: Entity,
  from: Vector,
  moves: Direction[]
): Direction[] {
  if (moves.length > MAX_MOVES) return moves.slice(0, MAX_MOVES);
  let to = from;
  const toPositions: Vector[] = [to];
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    to = moveTo(move, to);
    // check loop
    const index = toPositions.findIndex((p) => p.x === to.x && p.y === to.y);
    if (index !== -1) return moves.slice(0, index);
    // check validity
    toPositions.push(to);
    if (!validMoveTo(components, systemCalls, host, to)) {
      return i === 0 ? [] : moves.slice(0, i);
    }
  }
  return moves;
}

export function validMoveTo(
  components: ClientComponents,
  systemCalls: SystemCalls,
  host: Entity,
  to: Vector
) {
  const onMap = isOnMap(to);
  const canMove = canMoveTo(components, systemCalls, host, to);
  return onMap && canMove;
}
// export function moveToPositionStrict(move: Direction, from: Vector): Vector {
//   const to = moveToPosition(move, from);
//   return isOnMap(to) ? to : from;
// }

export function moveTo(move: Direction, from: Vector): Vector {
  const { x, y } = from;
  if (move === Direction.UP) return { x, y: y - 1 };
  if (move === Direction.DOWN) return { x, y: y + 1 };
  if (move === Direction.LEFT) return { x: x - 1, y };
  return { x: x + 1, y };
}

export function isOnMap(position: Vector) {
  const { x, y } = position;
  if (x < 0 || y < 0) return false;
  if (x >= 2 ** 32 || y >= 2 ** 32) return false;
  return true;
}

// combine two number into one bigint
export function combine(x: number, y: number) {
  return ((BigInt(x) << 128n) | BigInt(y)).toString();
}

export function combineToEntity(x: number, y: number) {
  return castToBytes32(BigInt(combine(x, y))) as Entity;
}

// split one bigint into two number
export function split(xy: bigint) {
  const x = Number(xy >> 128n);
  const y = Number(xy & 0xffffffffn);
  return { x, y };
}

export function splitFromEntity(entity: Entity) {
  return split(BigInt(entity));
}
