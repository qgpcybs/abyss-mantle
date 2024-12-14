// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { WorldContextConsumer } from "@latticexyz/world/src/WorldContext.sol";
import { Commander, Owner } from "@/codegen/index.sol";
import { space } from "@/constants.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { PositionLogic } from "@/libraries/PositionLogic.sol";
import { Errors } from "@/Errors.sol";

abstract contract PositionControl is WorldContextConsumer {
  using TypeCast for address;

  modifier onlyAdjacentHosts(bytes32 host1, bytes32 host2) {
    {
      if (!PositionLogic.adjacent(host1, host2)) revert Errors.NotAdjacent();
    }
    _;
  }

  modifier onlyAdjacentCoord(
    bytes32 host,
    uint32 x,
    uint32 y
  ) {
    {
      if (!PositionLogic.adjacent(host, x, y)) revert Errors.NotAdjacent();
    }
    _;
  }

  modifier onlyAdjacentCoords(
    uint32 x1,
    uint32 y1,
    uint32 x2,
    uint32 y2
  ) {
    {
      if (!PositionLogic.adjacent(x1, y1, x2, y2)) revert Errors.NotAdjacent();
    }
    _;
  }
}
