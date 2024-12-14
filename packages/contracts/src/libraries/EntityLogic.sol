// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Owner, BurnAwards, BuildingSpecs, EntityType } from "@/codegen/index.sol";
import { ContainerLogic } from "@/libraries/ContainerLogic.sol";
import { PoolLogic } from "@/libraries/PoolLogic.sol";
import { Errors } from "@/Errors.sol";
import "@/constants.sol";

library EntityLogic {
  /**
   * to mint entity with pools/stats; used to handle minting of all NFT
   */
  function _mint(bytes16 entityType, bytes32 to) internal returns (bytes32 entity) {
    entity = ContainerLogic._mint(entityType, to);
    PoolLogic._initPools(entity);
  }

  /**
   * to burn entity with pools/stats; used to handle burning of all NFT
   */
  function _burn(bytes32 entity) internal {
    PoolLogic._burnPools(entity);
    ContainerLogic._burn(entity);
  }

  function isOwner(bytes32 entity, bytes32 owner) internal view returns (bool) {
    bytes32 curr = entity;
    while (curr != owner) {
      curr = Owner.get(curr);
      if (curr == 0) return false;
    }
    return true;
  }

  // depreciated // hardcoded pool type; can consider putting them into table later
  // function isPoolType(bytes16 entityType) internal pure returns (bool) {
  //   return entityType == BLOOD || entityType == SOUL || entityType == STAMINA;
  // }

  function hasBurnAwards(bytes16 burnType) internal view returns (bool) {
    return BurnAwards.lengthAwards(burnType) != 0;
  }

  // function hasMin

  function isBuilding(bytes32 building) internal view returns (bool) {
    return isBuildingType(EntityType.get(building));
  }

  function isBuildingType(bytes16 buildingType) internal view returns (bool) {
    return BuildingSpecs.getTerrainType(buildingType) != 0;
  }

  function isRole(bytes32 role) internal view returns (bool) {
    // TODO: add role check
    return EntityType.get(role) == HOST;
  }

  // function isWeapon(bytes32 weapon) internal view returns (bool) {
  //   return isWeaponType(EntityType.get(weapon));
  // }

  // function isWeaponType(bytes16 weaponType) internal view returns (bool) {
  //   return WeaponSpecs.getAttack(weaponType) != 0;
  // }

  // function isArmor(bytes32 armor) internal view returns (bool) {
  //   return isArmorType(EntityType.get(armor));
  // }

  // function isArmorType(bytes16 armorType) internal view returns (bool) {
  //   return ArmorSpecs.getDefense(armorType) != 0;
  // }

  function getTopHost(bytes32 entity) internal view returns (bytes32) {
    bytes32 curr = entity;
    while (true) {
      bytes32 next = Owner.get(curr);
      if (next == space()) {
        return curr;
      } else if (next == 0) {
        return 0;
      }
      curr = next;
    }
  }
}
