import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import {
  Entity,
  HasValue,
  getComponentValue,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { Hex, hexToString } from "viem";
import {
  BUILDING_MENU,
  MENU,
  SOURCE,
  TARGET_MENU,
  TERRAIN_MENU,
  TerrainType,
} from "../../constants";
import { useState } from "react";
import useMenuKeys from "../../hooks/useMenuKeys";
import ItemContainer from "../ItemContainer";
import {
  calculatePathMoves,
  getEntityOnDirection,
  getTerrainOnDirection,
  hasPendingMoves,
  splitFromEntity,
} from "../../logics/move";
import { getEntityOnCoord } from "../../logics/map";
import { isBuilding, isRole } from "../../logics/entity";
import { getReadyPosition } from "../../logics/path";
import { BRIDGE, SAFE, MINER } from "../../contract/constants";
import {
  convertTerrainTypesToValues,
  getTargetTerrainData,
  GRID_SIZE,
  TileTerrain,
} from "../../logics/terrain";
import {
  canBuildFromHost,
  canBuildOnTile,
  getAllBuildingTypes,
  getBuildingCoordToExit,
  getHasCostBuildingTypes,
} from "../../logics/building";
import {
  getDropContainer,
  getERC20Drops,
  getERC721Drops,
} from "../../logics/drop";
import { getERC20Balances } from "../../logics/container";

export default function ExploreMenu() {
  const {
    components,
    systemCalls,
    network: { playerEntity },
  } = useMUD();
  const { SelectedHost, SelectedEntity } = components;
  const { move, spawnHero } = systemCalls;

  const [selected, setSelected] = useState(0);

  useMenuKeys({
    onUp: () => {
      setSelected((selected) => {
        const next = selected - 1;
        return next < 0 ? 0 : next;
      });
    },
    onDown: () => {
      setSelected((selected) => {
        const next = selected + 1;
        return next >= selections.length ? selections.length - 1 : next;
      });
    },
    onA: () => selections[selected].onClick(),
    onB: () => {
      setTimeout(() => {
        removeComponent(SelectedEntity, MENU);
      }, 100);
    },
    selected,
  });

  // const hosts = useEntityQuery([
  //   HasValue(components.Commander, { value: playerEntity }),
  // ]);
  const host = useComponentValue(SelectedHost, SOURCE)?.value as Entity;

  const moves = calculatePathMoves(components, host);
  console.log("ExploreMenu, moves", moves);
  const terrainData = getTargetTerrainData(components, systemCalls);
  console.log("ExploreMenu, terrainData", terrainData);
  if (!terrainData) return null;
  const tileCoord = terrainData.targetCoord;
  const allBuildingTypes = getAllBuildingTypes(components);
  const canBuildTypes = getHasCostBuildingTypes(components, host as Hex);
  console.log("ExploreMenu, building types", allBuildingTypes, canBuildTypes);
  // take SAFE as an example
  const hostDirectionCoord = canBuildFromHost(
    components,
    systemCalls,
    host,
    tileCoord,
    SAFE
  );
  console.log("ExploreMenu, canBuild", hostDirectionCoord);

  const terrainType = terrainData.terrainType;
  const entity = terrainData.coordEntity;
  const isBuildingType = isBuilding(components, entity as Entity);
  const isRoleType = isRole(components, entity as Entity);
  const nameToCheck =
    isBuildingType || isRoleType ? hexToString(entity as Hex) : terrainType;
  const menuToGo = isBuildingType
    ? BUILDING_MENU
    : isRoleType
      ? TARGET_MENU
      : TERRAIN_MENU;

  // drops & container
  const dropContainer = getDropContainer(tileCoord.x, tileCoord.y);
  const erc721Drops = getERC721Drops(components, tileCoord.x, tileCoord.y);
  const erc20Drops = getERC20Drops(components, tileCoord.x, tileCoord.y);
  console.log("ExploreMenu, drops", erc721Drops, erc20Drops);

  const selections = [
    {
      name: "Attack",
      onClick: async () => {
        if (!isRoleType) return;
        console.log("Attack", host, entity);
        systemCalls.attack(host as Hex, entity as Hex);
      },
    },
    {
      name: "pick up ERC20",
      onClick: async () => {
        if (!erc20Drops) return;
        systemCalls.pickupERC20(
          host as Hex,
          dropContainer,
          erc20Drops[0].erc20Type,
          1n,
          tileCoord.x,
          tileCoord.y
        );
      },
    },
    {
      name: "loot",
      onClick: async () => {
        const body = erc721Drops[0] as Hex;
        if (!body) return;
        const erc20Data = getERC20Balances(components, body);
        if (!erc20Data) return;
        const { erc20Type, balance } = erc20Data[0];
        systemCalls.pickupERC20(
          host as Hex,
          body,
          erc20Type,
          1n,
          tileCoord.x,
          tileCoord.y
        );
      },
    },
    {
      name: `Check ${nameToCheck}`,
      onClick: () => {
        setComponent(SelectedEntity, MENU, { value: menuToGo });
      },
    },
    {
      name: "$Move To",
      disabled: !host || !moves,
      onClick: async () => {
        console.log("Move To", moves);
        if (!host || !moves) return;
        await move(host as Hex, moves);
        removeComponent(SelectedEntity, MENU);
      },
    },
    {
      name: "Build Miner",
      onClick: async () => {
        if (!host) return;
        if (!hostDirectionCoord) return;
        await systemCalls.buildBuilding(
          host as Hex,
          MINER,
          hostDirectionCoord,
          tileCoord
        );
      },
    },
    {
      name: "Enter Building",
      onClick: async () => {
        if (!host) return;
        console.log("enter building", host, tileCoord);
        await systemCalls.enterBuilding(host as Hex, tileCoord);
      },
    },
    {
      name: "Exit Building",
      onClick: async () => {
        if (!host) return;
        const building = getComponentValue(components.Owner, host)
          ?.value as Hex;
        if (!building) return;
        const buildingCoord = getBuildingCoordToExit(
          components,
          building,
          tileCoord
        );
        if (!buildingCoord) return;
        console.log("Exit Building", host, building, buildingCoord, tileCoord);
        await systemCalls.exitBuilding(host as Hex, buildingCoord, tileCoord);
      },
    },
    {
      name: "Start Mining",
      onClick: async () => {
        if (!host) return;
        return systemCalls.startMining(host as Hex, tileCoord);
      },
    },
    {
      name: "Stop Mining",
      onClick: async () => {
        if (!host) return;
        return systemCalls.stopMining(host as Hex);
      },
    },
    {
      name: "Change Terrain to PLAIN",
      onClick: async () => {
        await systemCalls.setTerrainValue(tileCoord, Number(TerrainType.PLAIN));
      },
    },
    {
      name: "Change Terrains to ALL PLAINs",
      onClick: async () => {
        const terrainMatrix = [
          [3, 3, 3, 3, 3, 3, 3, 3],
          [3, 3, 3, 3, 3, 3, 3, 3],
          [3, 3, 3, 3, 3, 3, 3, 3],
          [3, 3, 3, 3, 3, 3, 3, 3],
          [3, 3, 3, 3, 3, 3, 3, 3],
          [3, 3, 3, 3, 3, 3, 3, 3],
          [3, 3, 3, 3, 3, 3, 3, 3],
          [3, 3, 3, 3, 3, 3, 3, 3],
        ];
        const terrainTypes: TileTerrain[] = [];
        terrainMatrix.forEach((row, i) => {
          row.forEach((terrain, j) => {
            terrainTypes.push({
              i,
              j,
              terrainType: terrainMatrix[j][i],
            });
          });
        });
        const terrainValues = convertTerrainTypesToValues(terrainTypes);
        const gridCoord = {
          x: Math.floor(tileCoord.x / GRID_SIZE),
          y: Math.floor(tileCoord.y / GRID_SIZE),
        };
        await systemCalls.setTerrainValues(gridCoord, terrainValues);
      },
    },
    // {
    //   name: "Cancel Moves",
    //   disabled: false,
    //   onClick: () => {
    //     if (!host) return removeComponent(SelectedEntity, MENU);
    //     removeComponent(Moves, host as Entity);
    //     // to avoid conflict with keyboard listener in GameScene
    //     setTimeout(() => {
    //       removeComponent(SelectedEntity, MENU);
    //     }, 100);
    //   },
    // },
  ];

  return (
    <div className="flex flex-col w-32 space-y-4 border p-1 bg-grey-500 text-white pointer-events-auto">
      {selections.map(({ name, onClick, disabled }, index) => (
        <ItemContainer
          key={index}
          className="btn btn-success border"
          onClick={onClick}
          disabled={disabled}
          selected={selected === index}
        >
          {name}
        </ItemContainer>
      ))}
    </div>
  );
}
