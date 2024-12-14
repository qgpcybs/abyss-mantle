// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { PathLogic } from "./PathLogic.sol";
import { MapLogic } from "./MapLogic.sol";
import { TileEntity } from "@/codegen/index.sol";

library PositionLogic {
  function withinRange(bytes32 host1, bytes32 host2, uint32 range) internal view returns (bool) {
    (uint32 x1, uint32 y1) = PathLogic.getPositionStrict(host1);
    (uint32 x2, uint32 y2) = PathLogic.getPositionStrict(host2);
    return withinRange(x1, y1, x2, y2, range);
  }

  function withinRange(bytes32 host, uint32 x, uint32 y, uint32 range) internal view returns (bool) {
    (uint32 x1, uint32 y1) = PathLogic.getPositionStrict(host);
    return withinRange(x1, y1, x, y, range);
  }

  function withinRange(uint32 x1, uint32 y1, uint32 x2, uint32 y2, uint32 range) internal pure returns (bool) {
    uint32 dX = getDelta(x1, x2);
    uint32 dY = getDelta(y1, y2);
    return dX <= range && dY <= range;
  }

  function adjacent(bytes32 host, uint32 x, uint32 y) internal view returns (bool) {
    return withinRange(host, x, y, 1);
  }

  function adjacent(bytes32 host1, bytes32 host2) internal view returns (bool) {
    return withinRange(host1, host2, 1);
  }

  function adjacent(uint32 x1, uint32 y1, uint32 x2, uint32 y2) internal pure returns (bool) {
    return withinRange(x1, y1, x2, y2, 1);
  }

  function getDelta(uint32 from, uint32 to) internal pure returns (uint32) {
    return from > to ? from - to : to - from;
  }
}
