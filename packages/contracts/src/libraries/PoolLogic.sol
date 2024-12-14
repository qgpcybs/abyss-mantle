// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Owner, Balance, EntityType, StatsSpecs, SizeSpecs } from "@/codegen/index.sol";
import { ContainerLogic } from "@/libraries/ContainerLogic.sol";
import { ERC20Logic } from "@/libraries/ERC20Logic.sol";
import { Errors } from "@/Errors.sol";
import { LibUtils } from "@/utils/LibUtils.sol";
import "@/constants.sol";
import "@/hashes.sol";

library PoolLogic {
  // called after ContainerLogic._mint(...)
  function _initPools(bytes32 entity) internal {
    bytes16 entityType = EntityType.get(entity);
    bytes32[] memory maxPools = StatsSpecs.getMaxPools(entityType);
    for (uint256 i = 0; i < maxPools.length; i++) {
      (bytes16 poolType, bytes16 amount) = LibUtils.splitBytes32(maxPools[i]);
      ERC20Logic._mint(poolType, entity, uint128(amount));
    }
  }

  // called before ContainerLogic._burn(...)
  function _burnPools(bytes32 entity) internal {
    bytes16 entityType = EntityType.get(entity);
    bytes32[] memory maxPools = StatsSpecs.getMaxPools(entityType);
    for (uint256 i = 0; i < maxPools.length; i++) {
      (bytes16 poolType, ) = LibUtils.splitBytes32(maxPools[i]);
      ERC20Logic._burn(poolType, entity, getPoolAmount(entity, poolType));
    }
  }

  function _decreaseStrict(bytes32 entity, bytes16 poolType, uint128 amount) internal {
    ERC20Logic._burn(poolType, entity, amount);
  }

  // used in combat
  function _decreaseLoose(bytes32 entity, bytes16 poolType, uint128 amount) internal returns (bool empty) {
    uint256 poolAmount = getPoolAmount(entity, poolType);
    if (poolAmount <= amount) {
      _decreaseStrict(entity, poolType, uint128(poolAmount));
      return empty = true;
    } else {
      _decreaseStrict(entity, poolType, amount);
      return empty = false;
    }
  }

  /**
   * increase cannot exceed max pool amount
   */
  function _increaseLoose(bytes32 entity, bytes16 poolType, uint128 amount) internal {
    uint128 maxAmount = getMaxPoolAmount(entity, poolType);
    uint256 poolAmount = getPoolAmount(entity, poolType);
    uint256 mintAmount = poolAmount + amount > maxAmount ? maxAmount - poolAmount : amount;
    ERC20Logic._mint(poolType, entity, mintAmount);
  }

  function _restorePool(bytes32 entity, bytes16 poolType) internal {
    uint128 maxAmount = getMaxPoolAmount(entity, poolType);
    uint256 poolAmount = getPoolAmount(entity, poolType);
    if (poolAmount < maxAmount) {
      ERC20Logic._mint(poolType, entity, maxAmount - poolAmount);
    }
  }

  function getMaxPoolAmount(bytes32 entity, bytes16 poolType) internal view returns (uint128) {
    bytes16 entityType = EntityType.get(entity);
    bytes32[] memory maxPools = StatsSpecs.getMaxPools(entityType);
    for (uint256 i = 0; i < maxPools.length; i++) {
      (bytes16 poolType_, bytes16 amount) = LibUtils.splitBytes32(maxPools[i]);
      if (poolType == poolType_) {
        return uint128(amount);
      }
    }
    return 0;
  }

  function getPoolAmount(bytes32 entity, bytes16 poolType) internal view returns (uint256) {
    return Balance.get(poolType, entity);
  }

  function isPoolType(bytes16 poolType) internal view returns (bool) {
    return SizeSpecs.get(poolType) == 0;
  }

  /**
   * to check if (exist) entity has pool type
   */
  function hasPoolType(bytes32 entity, bytes16 poolType) internal view returns (bool) {
    return getPoolAmount(entity, poolType) != 0;
  }

  // function _extract(bytes32 entity, bytes16 poolType, uint128 amount) internal {
  //   bytes32 pool = getPool(entity, poolType);
  //   ContainerLogic._transfer(poolType, pool, entity, amount);
  // }

  // function _inject(bytes32 entity, bytes16 poolType, uint128 amount) internal {
  //   bytes32 pool = getPool(entity, poolType);
  //   ContainerLogic._transfer(poolType, entity, pool, amount);
  // }
}
