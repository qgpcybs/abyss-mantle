// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { BuildingLogic } from "@/libraries/BuildingLogic.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";
import { PositionControl } from "@/extensions/PositionControl.sol";

contract BuildingSystem is System, AccessControl, PositionControl {
  using TypeCast for address;

  function buildBuilding(
    bytes32 role,
    bytes16 buildingType,
    uint32 x1,
    uint32 y1,
    uint32 lowerX,
    uint32 lowerY
  ) public onlyCommander(role) onlyAdjacentCoord(role, x1, y1) {
    bytes32 player = _msgSender().toBytes32();
    BuildingLogic._buildBuilding(player, role, buildingType, x1, y1, lowerX, lowerY);
  }
}
