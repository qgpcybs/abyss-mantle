// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { ContainerLogic } from "./ContainerLogic.sol";

/**
 * StorageLogic is a wrapper around ContainerLogic with
 * additional checks for from and to?
 */
library StorageLogic {
  // erc20
  function _transfer(bytes16 entityType, bytes32 from, bytes32 to, uint256 amount) internal {
    // canTransferStrict(from, to);

    ContainerLogic._transfer(entityType, from, to, amount);
  }

  // erc721
  function _transfer(bytes32 from, bytes32 to, bytes32 entity) internal {
    // canTransferStrict(from, to);

    ContainerLogic._transfer(from, to, entity);
  }

  // erc20
  function _mint(bytes16 entityType, bytes32 to, uint128 amount) internal {
    // canMint(to);

    ContainerLogic._mint(entityType, to, amount);
  }

  // erc721 when entity is known
  function _mint(bytes16 entityType, bytes32 to, bytes32 entity) internal {
    // canMint(toModule);

    ContainerLogic._mint(entityType, to, entity);
  }

  // erc721
  function _mint(bytes16 entityType, bytes32 to) internal returns (bytes32) {
    // canMint(toModule);

    return ContainerLogic._mint(entityType, to);
  }

  function _burn(bytes16 entityType, bytes32 from, uint128 amount) internal {
    ContainerLogic._burn(entityType, from, amount);
  }

  // erc721
  function _burn(bytes32 module) internal {
    ContainerLogic._burn(module);
  }
}
