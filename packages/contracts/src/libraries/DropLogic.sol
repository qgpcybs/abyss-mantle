// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Path, Counter, Owner, TotalSupply, EntityType } from "@/codegen/index.sol";
import { ContainerLogic } from "@/libraries/ContainerLogic.sol";
import { PathLogic } from "@/libraries/PathLogic.sol";
import { EntityLogic } from "@/libraries/EntityLogic.sol";
import { Errors } from "@/Errors.sol";
import "@/constants.sol";

// DropLogic is a wrapper around ContainerLogic with extra checks & mint drop
// container. For example, dropERC20 is to transfer erc20 to drop container.
library DropLogic {
  function _pickupERC20(
    bytes32 role,
    bytes32 from,
    bytes16 entityType,
    uint256 amount,
    uint32 tileX,
    uint32 tileY
  ) internal {
    bytes32 dropContainer = getDropContainer(tileX, tileY);
    // from can be nested within drop container; thus need to check topHost
    inDropContainerStrict(dropContainer, from);
    ContainerLogic._transfer(entityType, from, role, amount);
  }

  function _dropERC20(bytes32 role, bytes16 entityType, uint256 amount) internal {
    (uint32 currX, uint32 currY) = PathLogic.getPositionStrict(role);
    bytes32 dropContainer = _mintDropContainer(currX, currY);
    ContainerLogic._transfer(entityType, role, dropContainer, amount);
  }

  function _pickupERC721(bytes32 role, bytes32 from, bytes32 entity, uint32 tileX, uint32 tileY) internal {
    bytes32 dropContainer = getDropContainer(tileX, tileY);
    inDropContainerStrict(dropContainer, from);
    ContainerLogic._transfer(from, role, entity);
  }

  // path init & health increase will be handled elsewhere
  function _reviveRole(bytes32 role) internal returns (uint32, uint32) {
    if (!EntityLogic.isRole(role)) revert Errors.NotRoleType();
    bytes32 owner = Owner.get(role);
    if (!isDropContainer(owner)) revert Errors.NotInDropContainer();

    ContainerLogic._transfer(owner, space(), role);
    (uint32 currX, uint32 currY) = PathLogic.getPositionStrict(owner);
    return (currX, currY);
  }

  // also used for defeated role?
  // get topHost because entity could be role or nft inside role
  function _dropERC721(bytes32 entity) internal {
    bytes32 topHost = EntityLogic.getTopHost(entity);
    (uint32 currX, uint32 currY) = PathLogic.getPositionStrict(topHost);
    bytes32 dropContainer = _mintDropContainer(currX, currY);
    ContainerLogic._transfer(Owner.get(entity), dropContainer, entity);
  }

  function inDropContainerStrict(bytes32 dropContainer, bytes32 from) internal view {
    bytes32 topHost = EntityLogic.getTopHost(from);
    if (topHost != dropContainer) revert Errors.NotInDropContainer();
  }

  function _mintDropContainer(uint32 tileX, uint32 tileY) internal returns (bytes32) {
    bytes32 dropContainer = getDropContainer(tileX, tileY);
    if (dropContainerExist(tileX, tileY)) return dropContainer;
    ContainerLogic._mint(DROP, space(), dropContainer);
    PathLogic._initPath(dropContainer, tileX, tileY);
    return dropContainer;
  }

  function getDropContainer(uint32 tileX, uint32 tileY) internal pure returns (bytes32) {
    bytes32 tileXBytes = bytes32(uint256(tileX));
    bytes32 tileYBytes = bytes32(uint256(tileY));

    bytes32 result = bytes32(DROP) | (tileXBytes << 64) | tileYBytes;
    return result;
  }

  function splitDropContainer(bytes32 container) internal pure returns (bytes16, uint32, uint32) {
    bytes16 drop = bytes16(container);
    uint32 tileX = uint32(uint256(container >> 64));
    uint32 tileY = uint32(uint256(container));
    return (drop, tileX, tileY);
  }

  function dropContainerExist(uint32 tileX, uint32 tileY) internal view returns (bool) {
    bytes32 container = getDropContainer(tileX, tileY);
    return Owner.get(container) != 0;
  }

  function isDropContainer(bytes32 container) internal pure returns (bool) {
    (bytes16 drop, , ) = splitDropContainer(container);
    return drop == DROP;
  }
}
