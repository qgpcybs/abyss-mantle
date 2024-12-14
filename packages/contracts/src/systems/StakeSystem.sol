// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Owner } from "@/codegen/index.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";
import { PositionControl } from "@/extensions/PositionControl.sol";
import { StakeLogic } from "@/libraries/StakeLogic.sol";
import { BuildingLogic } from "@/libraries/BuildingLogic.sol";

contract StakeSystem is System, AccessControl, PositionControl {
  // remove onlyCommander(role) modifier
  function stake(bytes32 role, bytes16 outputType, uint32 x, uint32 y) public onlyAdjacentCoord(role, x, y) {
    bytes32 building = BuildingLogic.getBuildingFromCoord(x, y);
    StakeLogic._stake(role, building, outputType);
  }

  function unstake(bytes32 role, uint32 x, uint32 y) public onlyAdjacentCoord(role, x, y) {
    bytes32 building = BuildingLogic.getBuildingFromCoord(x, y);
    StakeLogic._unstake(role, building);
  }

  function claim(bytes32 role, uint32 x, uint32 y) public onlyAdjacentCoord(role, x, y) {
    bytes32 building = BuildingLogic.getBuildingFromCoord(x, y);
    StakeLogic._claim(role, building);
  }
}
