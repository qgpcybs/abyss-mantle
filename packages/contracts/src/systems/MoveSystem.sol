// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { MoveLogic } from "@/libraries/MoveLogic.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";

contract MoveSystem is System, AccessControl {
  using TypeCast for address;

  function move(bytes32 host, uint8[] memory moves) public onlyCommander(host) {
    MoveLogic._move(host, moves);
  }
}
