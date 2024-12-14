// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { EntityType, Owner, SizeSpecs, Equipment } from "@/codegen/index.sol";
import { EntityLogic } from "@/libraries/EntityLogic.sol";
import { ERC721Logic } from "@/libraries/ERC721Logic.sol";
import { PoolLogic } from "@/libraries/PoolLogic.sol";
import { Errors } from "@/Errors.sol";
import { SafeCastLib } from "@/utils/SafeCastLib.sol";
import "@/hashes.sol";
import "@/constants.sol";

library EquipmentLogic {
  using SafeCastLib for uint256;

  /**
   * to equip, 1) owner must be commander (check in system level), 2) equipType is not being used
   * note: reason to transfer to custodian is to preserve the storage pattern; also, no one except host can unequip or transfer
   * note2: equipment takes bag space, easier to unequip because no need to check bag space
   */
  function _equip(bytes32 equipment, bytes16 equipType) internal {
    bytes32 host = Owner.get(equipment);
    // no need to check roleType because custodian can NEVER be commander
    // if (!EntityLogic.isRole(host)) revert Errors.NotRoleType();
    if (Equipment.get(equipType, host) != 0) revert Errors.AlreadyEquipped();

    ERC721Logic._transfer(host, getCustodian(host), equipment);
    Equipment.set(equipType, host, equipment);
  }

  /**
   * to unequip, 1) owner must be custodian, 2) equipment must be equipped
   */
  function _unequip(bytes32 host, bytes16 equipType) internal {
    // no need to check roleType because custodian can NEVER be commander
    // if (!EntityLogic.isRole(host)) revert Errors.NotRoleType();
    bytes32 equipment = Equipment.get(equipType, host);
    if (equipment == 0) revert Errors.NotEquipped();

    ERC721Logic._transfer(getCustodian(host), host, equipment);
    Equipment.deleteRecord(equipType, host);
  }

  function getEquipmentStats(bytes32 host, bytes16 equipType, bytes16 poolType) internal view returns (uint256) {
    bytes32 equipment = Equipment.get(equipType, host);
    if (equipment == 0) return 0;
    return PoolLogic.getPoolAmount(equipment, poolType);
  }

  /**
   * ad hoc function 2b used in combat, unless figure out a more generalized way to describe interaction
   */
  function getAttack(bytes32 host) internal view returns (uint32) {
    return getEquipmentStats(host, WEAPON, ATTACK).safeCastTo32();
  }

  function getRange(bytes32 host) internal view returns (uint32) {
    return getEquipmentStats(host, WEAPON, RANGE).safeCastTo32();
  }

  function getDefense(bytes32 host) internal view returns (uint32) {
    return getEquipmentStats(host, ARMOR, DEFENSE).safeCastTo32();
  }
}
