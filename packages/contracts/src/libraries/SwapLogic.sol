// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { EntityType, Owner, StoredSize, ContainerSpecs, SizeSpecs, SwapRatio } from "@/codegen/index.sol";

import { ERC20Logic } from "@/libraries/ERC20Logic.sol";
import { ContainerLogic } from "@/libraries/ContainerLogic.sol";
import { EntityLogic } from "@/libraries/EntityLogic.sol";
import "@/constants.sol";
import { Errors } from "@/Errors.sol";

library SwapLogic {
  function _setSwapRatio(bytes16 fromType, bytes16 toType, bytes32 host, uint16 num, uint16 denom) internal {
    if (denom == 0) revert Errors.SwapRatioNotSet();

    SwapRatio.set(fromType, toType, host, host, num, denom);
  }

  function _swapERC20(bytes16 fromType, bytes16 toType, bytes32 from, bytes32 to, uint128 amount) internal {
    uint16 num = SwapRatio.getNum(fromType, toType, to);
    uint16 denom = SwapRatio.getDenom(fromType, toType, to);
    if (denom == 0) revert Errors.SwapRatioNotSet();

    uint128 toAmount = (amount * num) / denom;

    ContainerLogic._transfer(fromType, from, to, amount);
    ContainerLogic._transfer(toType, to, from, toAmount);
  }
}
