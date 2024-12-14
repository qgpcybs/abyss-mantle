// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Owner } from "@/codegen/index.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { ConvertLogic } from "@/libraries/ConvertLogic.sol";
import { CombatLogic } from "@/libraries/CombatLogic.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";
import { PositionControl } from "@/extensions/PositionControl.sol";

contract CombatSystem is System, AccessControl, PositionControl {
  using TypeCast for address;

  function attack(bytes32 attacker, bytes32 target) public onlyCommander(attacker) {
    CombatLogic._attack(attacker, target);
    // CombatLogic._defeatRole(target);
  }

  // function attack2(
  //   bytes32 attacker,
  //   bytes32 target
  // ) public onlyCommander(attacker) onlyAdjacentHosts(attacker, target) {
  //   // ConvertLogic._attack2(attacker, target);
  // }
}
