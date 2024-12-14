// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Owner } from "@/codegen/index.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";
import { PositionControl } from "@/extensions/PositionControl.sol";
import { CookLogic } from "@/libraries/CookLogic.sol";
import { BuildingLogic } from "@/libraries/BuildingLogic.sol";

contract CookSystem is System, AccessControl, PositionControl {
  function cook(
    bytes32 role,
    bytes16 outputType,
    uint32 x,
    uint32 y
  ) public onlyCommander(role) onlyAdjacentCoord(role, x, y) {
    bytes32 building = BuildingLogic.getBuildingFromCoord(x, y);
    CookLogic._cook(role, building, outputType);
  }

  function serve(bytes32 role, uint32 x, uint32 y) public onlyCommander(role) onlyAdjacentCoord(role, x, y) {
    bytes32 building = BuildingLogic.getBuildingFromCoord(x, y);
    CookLogic._serve(role, building);
  }
}
