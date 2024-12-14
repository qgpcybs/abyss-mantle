// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { TerrainLogic } from "@/libraries/TerrainLogic.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";
import { PositionControl } from "@/extensions/PositionControl.sol";

contract TerrainSystem is System, AccessControl, PositionControl {
  using TypeCast for address;

  // TODO: access control this function
  function setTerrainValues(uint32 gridX, uint32 gridY, uint256 terrainValues) public {
    TerrainLogic._setTerrainValues(gridX, gridY, terrainValues);
  }

  // TODO: access control this function
  function setTerrainValue(uint32 tileX, uint32 tileY, uint8 terrainValue) public {
    TerrainLogic._setTerrainValue(tileX, tileY, terrainValue);
  }

  function burnTerrain(bytes32 role, uint32 x, uint32 y) public onlyCommander(role) onlyAdjacentCoord(role, x, y) {
    TerrainLogic._burnTerrain(role, x, y);
  }

  function interactTerrain(bytes32 role, uint32 x, uint32 y) public onlyCommander(role) onlyAdjacentCoord(role, x, y) {
    TerrainLogic._interactTerrain(role, x, y);
  }
}
