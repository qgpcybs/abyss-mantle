// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { BuildingLogic } from "@/libraries/BuildingLogic.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";
import { PositionControl } from "@/extensions/PositionControl.sol";

contract Building2System is System, AccessControl, PositionControl {
  function enterBuilding(bytes32 role, uint32 x, uint32 y) public onlyCommander(role) onlyAdjacentCoord(role, x, y) {
    BuildingLogic._enterBuilding(role, x, y);
  }

  function exitBuilding(
    bytes32 role,
    uint32 x,
    uint32 y,
    uint32 newX,
    uint32 newY
  ) public onlyCommander(role) onlyAdjacentCoords(x, y, newX, newY) {
    BuildingLogic._exitBuilding(role, x, y, newX, newY);
  }
}
