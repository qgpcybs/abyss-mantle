// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Path, PathData } from "@/codegen/index.sol";
import { MapLogic } from "./MapLogic.sol";
import { MoveLogic } from "./MoveLogic.sol";
import { Errors } from "@/Errors.sol";
import "@/constants.sol";

// uint32 constant TILE_SIZE = 2 ** 4;
// uint32 constant MAP_SIZE = 2 ** 20;

library PathLogic {
  function _initPath(bytes32 host, uint32 x, uint32 y) internal {
    Path.set(host, x, y, x, y, uint40(block.timestamp), 0);
    // MapLogic.setTileEntity(x, y, host);
  }

  function isPathExist(bytes32 entity) internal view returns (bool) {
    return Path.getLastUpdated(entity) != 0;
  }

  function arrived(bytes32 host) internal view returns (bool) {
    uint40 lastUpdated = Path.getLastUpdated(host);
    uint40 duration = Path.getDuration(host);
    return lastUpdated != 0 && lastUpdated + duration <= block.timestamp;
  }

  function _fly(bytes32 host, uint8[] memory moves) internal {}

  function getPositionStrict(bytes32 host) internal view returns (uint32 currX, uint32 currY) {
    PathData memory path = Path.get(host);
    if (path.lastUpdated == 0) revert Errors.PathNotExist();
    if (path.duration == 0 || arrived(host)) return (path.toX, path.toY);

    uint40 duration = uint40(block.timestamp) - path.lastUpdated;
    uint40 dt = path.duration;
    int40 dx = int40(uint40(path.toX)) - int40(uint40(path.fromX));
    int40 dy = int40(uint40(path.toY)) - int40(uint40(path.fromY));

    int256 x = int256(uint256(path.fromX)) + (dx * int256(uint256(duration))) / int256(uint256(dt));
    int256 y = int256(uint256(path.fromY)) + (dy * int256(uint256(duration))) / int256(uint256(dt));

    // not necessary, but for safety
    currX = uint32MaxBounds(x);
    currY = uint32MaxBounds(y);
  }

  function uint32MaxBounds(int256 x) internal pure returns (uint32) {
    return x < 0 ? 0 : x > int40(uint40(type(uint32).max)) ? type(uint32).max : uint32(uint256(x));
  }
}
