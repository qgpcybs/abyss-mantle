// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Owner } from "@/codegen/index.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";
import { PositionControl } from "@/extensions/PositionControl.sol";
import { CombatLogic } from "@/libraries/CombatLogic.sol";

contract ReviveSystem is System, AccessControl, PositionControl {
  using TypeCast for address;

  function revive(bytes32 role, bytes32 target) public onlyCommander(role) onlyAdjacentHosts(role, Owner.get(target)) {
    CombatLogic._revive(role, target);
  }
}
