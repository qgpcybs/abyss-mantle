import { TerrainType } from "../constants";

export interface TileTerrain {
  x: number;
  y: number;
  terrainType: number;
}

export interface Coord {
  x: number;
  y: number;
}

interface Node {
  coord: Coord;
  cost: number;
  previous: Coord | null;
}

// Define terrain costs
const terrainCosts: { [key: number]: number } = {
  [TerrainType.NONE]: Infinity, // Cost of moving through terrainType 0
  [TerrainType.OCEAN]: Infinity, // TerrainType 1 is impassable
  [TerrainType.FOREST]: Infinity,
  [TerrainType.PLAIN]: 1,
  [TerrainType.MUD]: 1,
  [TerrainType.MOUNTAIN]: Infinity,
  [TerrainType.BUILDING]: Infinity,
};

// Get neighboring coordinates that are within bounds
const getNeighbors = (coord: Coord, map: TileTerrain[]): Coord[] => {
  const directions = [
    { x: 0, y: -1 }, // Up
    { x: 0, y: 1 }, // Down
    { x: -1, y: 0 }, // Left
    { x: 1, y: 0 }, // Right
  ];

  return directions
    .map((dir) => ({ x: coord.x + dir.x, y: coord.y + dir.y }))
    .filter((neighbor) =>
      map.some((tile) => tile.x === neighbor.x && tile.y === neighbor.y)
    );
};

// Find tile based on coordinates
const findTile = (
  coord: Coord,
  map: TileTerrain[]
): TileTerrain | undefined => {
  return map.find((tile) => tile.x === coord.x && tile.y === coord.y);
};

export const dijkstraPathfinding = (
  startCoord: Coord,
  endCoord: Coord,
  map: TileTerrain[]
): Coord[] | null => {
  // Initialize nodes
  const unvisitedNodes: Node[] = map.map((tile) => ({
    coord: { x: tile.x, y: tile.y },
    cost: Infinity,
    previous: null,
  }));

  // Set the start node
  const startNode = unvisitedNodes.find(
    (node) => node.coord.x === startCoord.x && node.coord.y === startCoord.y
  )!;
  startNode.cost = 0;

  // Priority queue and visited nodes
  const priorityQueue = [startNode];
  const visitedNodes = new Set<Node>();

  while (priorityQueue.length > 0) {
    // Sort the queue by cost and get the node with the smallest cost
    priorityQueue.sort((a, b) => a.cost - b.cost);
    const currentNode = priorityQueue.shift()!;
    visitedNodes.add(currentNode);

    // Check if we've reached the end
    if (
      currentNode.coord.x === endCoord.x &&
      currentNode.coord.y === endCoord.y
    ) {
      // Reconstruct the path
      const path: Coord[] = [];
      let node: Node | null = currentNode;

      while (node) {
        path.push(node.coord);
        node =
          unvisitedNodes.find(
            (n) =>
              n.coord.x === node?.previous?.x && n.coord.y === node?.previous?.y
          ) || null;
      }

      return path.reverse();
    }

    // Process neighbors
    const neighbors = getNeighbors(currentNode.coord, map);

    for (const neighborCoord of neighbors) {
      const neighborTile = findTile(neighborCoord, map);
      if (!neighborTile) continue;

      const neighborCost = terrainCosts[neighborTile.terrainType];
      if (neighborCost === Infinity) continue; // Skip impassable tiles

      const neighborNode = unvisitedNodes.find(
        (node) =>
          node.coord.x === neighborCoord.x && node.coord.y === neighborCoord.y
      )!;

      if (!visitedNodes.has(neighborNode)) {
        const newCost = currentNode.cost + neighborCost;
        if (newCost < neighborNode.cost) {
          neighborNode.cost = newCost;
          neighborNode.previous = currentNode.coord;
          priorityQueue.push(neighborNode);
        }
      }
    }
  }

  return null; // No path found
};

// // Example usage
// const startCoord: Coord = { x: 0, y: 0 };
// const endCoord: Coord = { x: 1, y: 0 };
// const map: TileTerrain[] = [
//   { x: 0, y: 0, terrainType: 1 },
//   { x: 1, y: 0, terrainType: 1 },
//   { x: 2, y: 0, terrainType: 1 },
//   { x: 3, y: 0, terrainType: 1 },
//   { x: 0, y: 1, terrainType: 1 },
//   { x: 1, y: 1, terrainType: 0 },
//   { x: 2, y: 1, terrainType: 1 },
//   { x: 3, y: 1, terrainType: 1 },
//   { x: 0, y: 2, terrainType: 1 },
//   { x: 1, y: 2, terrainType: 1 },
//   { x: 2, y: 2, terrainType: 1 },
//   { x: 3, y: 2, terrainType: 1 },
//   { x: 0, y: 3, terrainType: 1 },
//   { x: 1, y: 3, terrainType: 1 },
//   { x: 2, y: 3, terrainType: 1 },
//   { x: 3, y: 3, terrainType: 1 },
// ];

// const path = dijkstraPathfinding(startCoord, endCoord, map);
// console.log(path); // Output the path or null if no path exists
