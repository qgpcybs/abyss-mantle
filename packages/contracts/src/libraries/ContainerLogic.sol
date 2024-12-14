// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { EntityType, Owner, StoredSize, ContainerSpecs, SizeSpecs } from "@/codegen/index.sol";

import { ERC20Logic } from "@/libraries/ERC20Logic.sol";
import { ERC721Logic } from "@/libraries/ERC721Logic.sol";
import { EntityLogic } from "@/libraries/EntityLogic.sol";
import { space } from "@/constants.sol";
import { Errors } from "@/Errors.sol";

/**
 * a subsystem that can be accessed by other systems
 * with IWorld(_world).transfer(...)
 */

library ContainerLogic {
  /**
   * @dev transfer ERC20 token from one module to another
   * @param spender spender of entity being transferred
   * @param entityType type of entity being transferred
   * @param fromModule sender storage module
   * @param toModule receiver storage module
   * @param amount amount of entity being transferred
   */
  function _transferFrom(
    bytes32 spender,
    bytes16 entityType,
    bytes32 fromModule,
    bytes32 toModule,
    uint256 amount
  ) internal {
    uint256 size = SizeSpecs.get(entityType) * amount;

    ERC20Logic._transferFrom(spender, entityType, fromModule, toModule, amount);
    _decreaseStoredSize(fromModule, size);
    _increaseStoredSize(toModule, size);
  }

  /**
   * @dev transfer ERC20 token from one module to another
   * @param entityType type of entity being transferred
   * @param fromModule sender storage module
   * @param toModule receiver storage module
   * @param amount amount of entity being transferred
   */
  function _transfer(bytes16 entityType, bytes32 fromModule, bytes32 toModule, uint256 amount) internal {
    uint256 size = SizeSpecs.get(entityType) * amount;

    ERC20Logic._transfer(entityType, fromModule, toModule, amount);
    _decreaseStoredSize(fromModule, size);
    _increaseStoredSize(toModule, size);
  }

  /**
   * @dev burn ERC20 token from a module
   * @param entityType type of entity being burned
   * @param fromModule from storage module
   * @param amount amount of entity being burned
   */
  function _burn(bytes16 entityType, bytes32 fromModule, uint128 amount) internal {
    uint256 size = SizeSpecs.get(entityType) * amount;

    ERC20Logic._burn(entityType, fromModule, amount);
    _decreaseStoredSize(fromModule, size);
  }

  /**
   * @dev mint ERC20 token to a module
   * @param entityType type of entity being minted
   * @param toModule storage module minted to
   * @param amount amount of entity being minted
   */
  function _mint(bytes16 entityType, bytes32 toModule, uint128 amount) internal {
    uint256 size = SizeSpecs.get(entityType) * amount;

    ERC20Logic._mint(entityType, toModule, amount);
    _increaseStoredSize(toModule, size);
  }

  /**
   * @dev transfer ERC721 token from one module to another
   * @param fromModule sender storage module
   * @param toModule receiver storage module
   * @param entity entity being transferred
   */
  function _transfer(bytes32 fromModule, bytes32 toModule, bytes32 entity) internal {
    if (EntityLogic.isOwner(toModule, entity)) revert Errors.NestedContainer();

    uint256 size = SizeSpecs.get(EntityType.get(entity));

    ERC721Logic._transfer(fromModule, toModule, entity);
    _decreaseStoredSize(fromModule, size);
    _increaseStoredSize(toModule, size);

    // LastUpdated.set(entity, uint40(block.timestamp));
  }

  /**
   * @dev burn ERC721 token from a module
   * @param entity entity being burned
   */
  function _burn(bytes32 entity) internal {
    uint256 size = SizeSpecs.get(EntityType.get(entity));

    // Health.deleteRecord(entity);
    _decreaseStoredSize(Owner.get(entity), size);
    ERC721Logic._burn(entity);
  }

  /**
   * @dev mint ERC721 token to a module
   * @param entityType type of entity being minted
   * @param toModule storage module minted to
   */
  function _mint(bytes16 entityType, bytes32 toModule) internal returns (bytes32) {
    uint256 size = SizeSpecs.get(entityType);

    bytes32 entity = ERC721Logic._mint(entityType, toModule);
    _increaseStoredSize(toModule, size);

    // if (sharedSpecs.maxHealth > 0) Health.set(entity, sharedSpecs.maxHealth);

    // LastUpdated.set(entity, uint40(block.timestamp));

    return entity;
  }

  // used when entity is known
  function _mint(bytes16 entityType, bytes32 toModule, bytes32 entity) internal returns (bytes32) {
    uint256 size = SizeSpecs.get(entityType);

    ERC721Logic._mint(entityType, toModule, entity);
    _increaseStoredSize(toModule, size);

    // if (sharedSpecs.maxHealth > 0) Health.set(entity, sharedSpecs.maxHealth);

    // LastUpdated.set(entity, uint40(block.timestamp));

    return entity;
  }

  function _mintLoose(bytes16 entityType, bytes32 to, uint128 amount) internal {
    uint256 remainedSize = getRemainedSize(to);

    if (remainedSize == 0) return;
    uint128 size = SizeSpecs.get(entityType);
    uint128 actualAmount = remainedSize / size < uint128(amount) ? uint128(remainedSize / size) : uint128(amount);

    _mint(entityType, to, actualAmount);
  }

  function getRemainedSize(bytes32 module) internal view returns (uint256) {
    return ContainerSpecs.get(EntityType.get(module)) - StoredSize.get(module);
  }

  function canIncreaseStoredSizeStrict(bytes32 module, uint256 size) internal view {
    if (module == space()) return;
    if (ContainerSpecs.get(EntityType.get(module)) < StoredSize.get(module) + size) {
      revert Errors.InsufficientStorage();
    }
  }

  /**
   * @dev increase the stored size of a module
   * @param module module to increase stored size of
   * @param size size to increase by
   */
  function _increaseStoredSize(bytes32 module, uint256 size) internal {
    canIncreaseStoredSizeStrict(module, size);

    StoredSize.set(module, StoredSize.get(module) + size);
  }

  /**
   * @dev decrease the stored size of a module
   * @param module module to decrease stored size of
   * @param size size to decrease by
   */
  function _decreaseStoredSize(bytes32 module, uint256 size) internal {
    if (module == space()) return;
    if (StoredSize.get(module) < size) revert Errors.StorageUnderflow();

    StoredSize.set(module, StoredSize.get(module) - size);
  }
}
