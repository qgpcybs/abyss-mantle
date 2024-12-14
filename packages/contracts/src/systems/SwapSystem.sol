// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { ContainerLogic } from "@/libraries/ContainerLogic.sol";
import { SwapLogic } from "@/libraries/SwapLogic.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";
import { PositionControl } from "@/extensions/PositionControl.sol";

contract SwapSystem is System, AccessControl, PositionControl {
  using TypeCast for address;

  // host can be either a building or a role, as long as it has capacitiy
  // meaning, if it is a building, it is a store; if it is a role, it is a merchant
  function setSwapRatio(
    bytes16 fromType,
    bytes16 toType,
    bytes32 host,
    uint16 num,
    uint16 denom
  ) public onlyController(host) {
    SwapLogic._setSwapRatio(fromType, toType, host, num, denom);
  }

  // from can be a building or a role
  // providing fromType from "from" with "amount", to receive toType from "to"
  function swapERC20(
    bytes16 fromType,
    bytes16 toType,
    bytes32 from,
    bytes32 to,
    uint128 amount
  ) public onlyController(from) onlyAdjacentHosts(from, to) {
    SwapLogic._swapERC20(fromType, toType, from, to, amount);
  }
}
