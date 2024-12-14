// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { BuildingLogic } from "@/libraries/BuildingLogic.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";
import { PositionControl } from "@/extensions/PositionControl.sol";

contract Building3System is System, AccessControl, PositionControl {
  using TypeCast for address;

  // TODO: uint32 x1, uint32 y1, uint32 x2, uint32 y2
  function burnBuilding(bytes32 role, uint32 x, uint32 y) public onlyCommander(role) onlyAdjacentCoord(role, x, y) {
    BuildingLogic._burnBuilding(x, y);
  }
}
