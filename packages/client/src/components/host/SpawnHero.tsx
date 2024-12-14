import { useState } from "react";
import { Hex } from "viem";
import { useMUD } from "../../MUDContext";
import { Entity } from "@latticexyz/recs";
import { useComponentValue } from "@latticexyz/react";
import { SOURCE } from "../../constants";
import { splitFromEntity } from "../../logics/move";
import { getPosition } from "../../logics/path";
import { adjacent } from "../../logics/position";

export function SpawnHero() {
  const { components, systemCalls } = useMUD();

  const [name, setName] = useState<string>("");

  return (
    <div className="flex flex-row space-x-">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter hero name"
      />
      <button className="btn-blue" onClick={() => systemCalls.spawnHero(name)}>
        Spawn New Hero
      </button>
    </div>
  );
}

// need to have a sourceHost, which needs to have position on map; the tile needs to be adjacent to the sourceHost
// besides, no entity on tile (as shown in Tile.tsx)
export function SpawnHeroOnCoord({ tile }: { tile: Entity }) {
  const tileCoord = splitFromEntity(tile);
  const { components, systemCalls } = useMUD();
  const { SelectedHost } = components;
  const sourceHost = useComponentValue(SelectedHost, SOURCE)?.value as Hex;

  const [name, setName] = useState<string>("");

  const hostCoord = getPosition(components, sourceHost as Entity);
  const isAdjacent = hostCoord && adjacent(hostCoord, tileCoord);

  if (!sourceHost) return null;
  if (!isAdjacent) return null;

  return (
    <div className="flex flex-row space-x-">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter hero name"
      />
      <button
        className="btn-blue"
        onClick={() =>
          systemCalls.spawnHeroOnCoord(sourceHost, tileCoord, name)
        }
      >
        Spawn Hero on {tileCoord.x}, {tileCoord.y}
      </button>
    </div>
  );
}
