// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library LibUtils {
  function min(uint256 a, uint256 b) internal pure returns (uint256) {
    return a < b ? a : b;
  }

  function addressToEntityKey(address _address) internal pure returns (bytes32 key) {
    return bytes32(uint256(uint160(_address)));
  }

  function stringToBytes16(string memory str) internal pure returns (bytes16 result) {
    require(bytes(str).length <= 16, "String too long to convert to bytes16");
    assembly {
      result := mload(add(str, 16))
    }
  }

  function splitBytes32(bytes32 value) internal pure returns (bytes16 left, bytes16 right) {
    assembly {
      left := value
      right := shl(128, value)
    }
  }

  function combineBytes32(bytes16 left, bytes16 right) internal pure returns (bytes32 result) {
    result = bytes32(left) | (bytes32(right) >> 128);
  }

  function sortBytes16(bytes16[] memory arr) public pure returns (bytes16[] memory) {
    uint256 len = arr.length;
    for (uint256 i = 0; i < len; i++) {
      for (uint256 j = 0; j < len - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
          bytes16 temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
        }
      }
    }
    return arr;
  }

  function hashArray(bytes16[] memory arr) public pure returns (bytes32) {
    bytes memory buffer = new bytes(arr.length * 16);
    for (uint i = 0; i < arr.length; i++) {
      for (uint j = 0; j < 16; j++) {
        buffer[i * 16 + j] = arr[i][j];
      }
    }
    return keccak256(buffer);
  }

  function compileCosts(
    bytes16[] memory entityTypes,
    uint128[] memory amounts
  ) internal pure returns (bytes32[] memory costs) {
    if (entityTypes.length != amounts.length) revert("Invalid input");

    costs = new bytes32[](entityTypes.length);

    for (uint256 i = 0; i < entityTypes.length; i++) {
      // if (amounts[i] == 0) break;
      costs[i] = LibUtils.combineBytes32(entityTypes[i], bytes16(amounts[i]));
    }
  }

  /// @notice Calculates the square root of x, rounding down.
  /// @dev Uses the Babylonian method https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Babylonian_method.
  /// @param x The uint256 number for which to calculate the square root.
  /// @return result The result as an uint256.
  function sqrt(uint256 x) internal pure returns (uint256 result) {
    if (x == 0) {
      return 0;
    }

    // Calculate the square root of the perfect square of a power of two that is the closest to x.
    uint256 xAux = uint256(x);
    result = 1;
    if (xAux >= 0x100000000000000000000000000000000) {
      xAux >>= 128;
      result <<= 64;
    }
    if (xAux >= 0x10000000000000000) {
      xAux >>= 64;
      result <<= 32;
    }
    if (xAux >= 0x100000000) {
      xAux >>= 32;
      result <<= 16;
    }
    if (xAux >= 0x10000) {
      xAux >>= 16;
      result <<= 8;
    }
    if (xAux >= 0x100) {
      xAux >>= 8;
      result <<= 4;
    }
    if (xAux >= 0x10) {
      xAux >>= 4;
      result <<= 2;
    }
    if (xAux >= 0x8) {
      result <<= 1;
    }

    // The operations can never overflow because the result is max 2^127 when it enters this block.
    unchecked {
      result = (result + x / result) >> 1;
      result = (result + x / result) >> 1;
      result = (result + x / result) >> 1;
      result = (result + x / result) >> 1;
      result = (result + x / result) >> 1;
      result = (result + x / result) >> 1;
      result = (result + x / result) >> 1; // Seven iterations should be enough
      uint256 roundedDownResult = x / result;
      return result >= roundedDownResult ? roundedDownResult : result;
    }
  }
}
