// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Allowance, Balance, TotalSupply } from "@/codegen/index.sol";
import { Errors } from "@/Errors.sol";

library ERC20Logic {
  function _mint(bytes16 entityType, bytes32 to, uint256 amount) internal {
    if (to == 0) revert Errors.MintToNull();

    Balance.set(entityType, to, Balance.get(entityType, to) + amount);
    TotalSupply.set(entityType, TotalSupply.get(entityType) + amount);
  }

  function _transferFrom(
    bytes32 spender,
    bytes16 entityType,
    bytes32 from,
    bytes32 to,
    uint256 value
  ) internal returns (bool) {
    _spendAllowance(entityType, from, spender, value);
    _transfer(entityType, from, to, value);
    return true;
  }

  function _transfer(bytes16 entityType, bytes32 from, bytes32 to, uint256 amount) internal {
    if (from == 0) revert Errors.TransferFromNull();
    if (to == 0) revert Errors.TransferToNull();

    uint256 fromBalance = Balance.get(entityType, from);
    if (fromBalance < amount) revert Errors.TransferExceedsBalance();
    uint256 toBalance = Balance.get(entityType, to);

    Balance.set(entityType, from, fromBalance - amount);
    Balance.set(entityType, to, toBalance + amount);
  }

  function _burn(bytes16 entityType, bytes32 from, uint256 amount) internal {
    if (from == 0) revert Errors.BurnFromNull();

    uint256 entityBalance = Balance.get(entityType, from);
    if (entityBalance < amount) revert Errors.BurnExceedsBalance();

    entityBalance == amount
      ? Balance.deleteRecord(entityType, from)
      : Balance.set(entityType, from, entityBalance - amount);
    TotalSupply.set(entityType, TotalSupply.get(entityType) - amount);
  }

  function _increaseAllowance(bytes16 entityType, bytes32 owner, bytes32 spender, uint256 addedValue) internal {
    Allowance.set(entityType, owner, spender, Allowance.get(entityType, owner, spender) + addedValue);
  }

  function _approve(bytes16 entityType, bytes32 owner, bytes32 spender, uint256 value) internal {
    if (owner == 0) revert Errors.ApproveOwnerNull();
    if (spender == 0) revert Errors.ApproveSpenderNull();

    Allowance.set(entityType, owner, spender, value);
  }

  function _spendAllowance(bytes16 entityType, bytes32 owner, bytes32 spender, uint256 value) internal {
    uint256 currentAllowance = Allowance.get(entityType, owner, spender);
    if (currentAllowance != type(uint256).max) {
      if (currentAllowance < value) {
        revert Errors.InsufficientAllowance();
      }
      unchecked {
        _approve(entityType, owner, spender, currentAllowance - value);
      }
    }
  }
}
