// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { ConvertLogic } from "@/libraries/ConvertLogic.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";

contract ItemSystem is System, AccessControl {
  function craftERC721(bytes16 itemType, bytes32 role) public onlyCommander(role) {
    ConvertLogic._craftERC721(itemType, role);
  }

  function consumeERC20(bytes16 itemType, bytes32 role) public onlyCommander(role) {
    ConvertLogic._consumeERC20(itemType, role);
  }

  // burn erc20
  function burnERC20(bytes16 itemType, uint128 amount, bytes32 role) public onlyCommander(role) {}

  // burn erc721
}
