// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Approval, Counter, Owner, TotalSupply, EntityType } from "@/codegen/index.sol";
import { Errors } from "@/Errors.sol";

library ERC721Logic {
  function _mint(bytes16 entityType, bytes32 to) internal returns (bytes32) {
    uint256 count = Counter.get(entityType);
    Counter.set(entityType, count + 1);
    bytes32 entity = bytes32(entityType) | bytes32(count + 1);
    _mint(entityType, to, entity);
    return entity;
  }

  function _mint(bytes16 entityType, bytes32 to, bytes32 entity) internal {
    if (to == 0) revert Errors.MintToNull();
    if (Owner.get(entity) != 0) revert Errors.Minted();

    EntityType.set(entity, entityType);
    // Balance.set(entityType, to, Balance.get(entityType, to) + 1);
    TotalSupply.set(entityType, TotalSupply.get(entityType) + 1);
    Owner.set(entity, to);
  }

  function _transfer(bytes32 from, bytes32 to, bytes32 entity) internal {
    bytes32 owner = Owner.get(entity);
    if (owner != from) revert Errors.TransferIncorrectOwner();
    // bytes16 entityType = EntityType.get(entity);

    Approval.deleteRecord(entity);
    // Balance.set(entityType, owner, Balance.get(entityType, owner) - 1);
    // Balance.set(entityType, to, Balance.get(entityType, to) + 1);
    Owner.set(entity, to);
  }

  function _burn(bytes32 entity) internal {
    bytes16 entityType = EntityType.get(entity);
    // bytes32 owner = Owner.get(entity);

    Approval.deleteRecord(entity);
    EntityType.deleteRecord(entity);
    // Balance.set(entityType, owner, Balance.get(entityType, owner) - 1);
    TotalSupply.set(entityType, TotalSupply.get(entityType) - 1);
    Owner.deleteRecord(entity);
  }

  function _approve(bytes32 to, bytes32 entity) internal {
    Approval.set(entity, to);
  }
}
