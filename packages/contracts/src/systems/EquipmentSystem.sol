// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Owner } from "@/codegen/index.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";
import { EquipmentLogic } from "@/libraries/EquipmentLogic.sol";

contract EquipmentSystem is System, AccessControl {
  // TODO: consider using onlyController instead of onlyCommander so that building can equip role
  function equip(bytes32 equipment, bytes16 equipType) public onlyCommander(Owner.get(equipment)) {
    EquipmentLogic._equip(equipment, equipType);
  }

  function unequip(bytes32 host, bytes16 equipType) public onlyCommander(host) {
    EquipmentLogic._unequip(host, equipType);
  }
}
