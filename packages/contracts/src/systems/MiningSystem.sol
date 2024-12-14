// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { MiningLogic } from "@/libraries/MiningLogic.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";

contract MiningSystem is System, AccessControl {
  using TypeCast for address;

  // note: reason to take x,y is we don't have buildingId -> coord mapping (since building can take multiple coords)
  function startMining(bytes32 role, uint32 x, uint32 y) public onlyCommander(role) {
    MiningLogic._startMining(role, x, y);
  }

  function stopMining(bytes32 role) public onlyCommander(role) {
    MiningLogic._stopMining(role);
  }
}
