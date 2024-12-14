// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { IWorld } from "@/codegen/world/IWorld.sol";
import "@/codegen/index.sol";

library DefineTypes {
  function definePoolStats(bytes16 entityType, bytes32[] memory maxPools) internal {
    StatsSpecs.set(entityType, maxPools);
  }

  function defineHost(bytes16 hostType, uint256 capacity, uint128 size) internal {
    ContainerSpecs.set(hostType, capacity);
    SizeSpecs.set(hostType, size);
  }

  // function definePool(bytes16 poolType, uint256 capacity) internal {
  //   ContainerSpecs.set(poolType, capacity);
  // }

  function defineTerrain(
    bytes16 terrainType,
    TerrainSpecsData memory terrainSpecs,
    bytes32[] memory interactCosts,
    bytes32[] memory interactAwards,
    bytes32[] memory burnCosts,
    bytes32[] memory burnAwards
  ) internal {
    TerrainSpecs.set(terrainType, terrainSpecs);
    if (interactCosts.length != 0) InteractCosts.set(terrainType, interactCosts);
    if (interactAwards.length != 0) InteractAwards.set(terrainType, interactAwards);
    if (burnCosts.length != 0) BurnCosts.set(terrainType, burnCosts);
    if (burnAwards.length != 0) BurnAwards.set(terrainType, burnAwards);
  }

  // TODO: add upgradeCosts
  function defineBuilding(
    bytes16 buildingType,
    BuildingSpecsData memory buildingSpecs,
    bytes32[] memory mintCosts,
    bytes32[] memory burnCosts,
    bytes32[] memory burnAwards
  ) internal {
    BuildingSpecs.set(buildingType, buildingSpecs);
    MintCosts.set(buildingType, mintCosts);
    BurnCosts.set(buildingType, burnCosts);
    BurnAwards.set(buildingType, burnAwards);
  }

  // defineStake with defineBuilding
  function defineStake(bytes16 buildingType, StakeSpecsData memory stakeSpecs) internal {
    StakeSpecs.set(buildingType, stakeSpecs);
  }

  function defineCook(bytes16 buildingType, CookSpecsData memory cookSpecs) internal {
    CookSpecs.set(buildingType, cookSpecs);
  }

  function defineConvertRatio(bytes16 fromType, bytes16 toType, uint8 num, uint8 denom) internal {
    ConvertRatio.set(fromType, toType, num, denom);
  }

  function defineERC20Item(
    bytes16 itemType,
    uint128 size,
    bytes32[] memory mintCosts,
    bytes32[] memory burnAwards
  ) internal {
    SizeSpecs.set(itemType, size);
    MintCosts.set(itemType, mintCosts);
    BurnAwards.set(itemType, burnAwards);
  }

  function defineEntitySize(bytes16 entityType, uint128 size) internal {
    SizeSpecs.set(entityType, size);
  }

  // function defineERC721Item(
  //   bytes16 itemType,
  //   SizeSpecsData memory sizeSpecs,
  //   bytes32[] memory mintCosts,
  //   bytes32[] memory burnAwards
  // ) internal {
  //   SizeSpecs.set(itemType, sizeSpecs);
  //   MintCosts.set(itemType, mintCosts);
  //   BurnAwards.set(itemType, burnAwards);
  // }
}
