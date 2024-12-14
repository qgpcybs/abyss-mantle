// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

/// @notice Safe unsigned integer casting library that reverts on overflow.
/// @author Solmate (https://github.com/transmissions11/solmate/blob/main/src/utils/SafeCastLib.sol)
/// @author Modified from OpenZeppelin (https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/math/SafeCast.sol)
library SafeCastLib {
  function safeCastTo16(uint256 x) internal pure returns (uint16 y) {
    require(x < 1 << 16);

    y = uint16(x);
  }

  function safeCastTo32(uint256 x) internal pure returns (uint32 y) {
    require(x < 1 << 32);

    y = uint32(x);
  }

  function safeCastTo40(uint256 x) internal pure returns (uint40 y) {
    if (x > type(uint40).max) revert("OverflowUint40");

    y = uint40(x);
  }

  function safeCastToInt40(int256 x) internal pure returns (int40 y) {
    require(x >= type(int40).min && x <= type(int40).max, "OverflowInt40");

    y = int40(x);
  }

  function safeCastTo128(uint256 x) internal pure returns (uint128 y) {
    if (x > type(uint128).max) revert("OverflowUint128");

    y = uint128(x);
  }
}
