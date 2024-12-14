// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { MintCosts, BurnCosts, UpgradeCosts, InteractCosts } from "@/codegen/index.sol";
import { LibUtils } from "@/utils/LibUtils.sol";
import { ContainerLogic } from "./ContainerLogic.sol";
import { EntityLogic } from "./EntityLogic.sol";
import { PoolLogic } from "./PoolLogic.sol";
import "@/hashes.sol";

library CostLogic {
  function _burnInteractCosts(bytes16 interactType, bytes32 role) internal {
    bytes32[] memory costs = InteractCosts.getCosts(interactType);
    _burnCosts(costs, role);
  }

  // burn cost from MintCosts
  function _burnMintCosts(bytes16 mintType, bytes32 role) internal {
    bytes32[] memory costs = MintCosts.getCosts(mintType);
    _burnCosts(costs, role);
  }

  // burn cost from BurnCosts
  function _burnBurnCosts(bytes16 breakType, bytes32 role) internal {
    bytes32[] memory costs = BurnCosts.getCosts(breakType);
    _burnCosts(costs, role);
  }

  // burn cost from UpgradeCosts
  function _burnUpgradeCosts(bytes16 fromType, bytes32 role) internal {
    bytes32[] memory costs = UpgradeCosts.getCosts(fromType);
    _burnCosts(costs, role);
  }

  function _burnCosts(bytes32[] memory costs, bytes32 role) internal {
    for (uint256 i = 0; i < costs.length; i++) {
      bytes32 cost = costs[i];
      (bytes16 costType, bytes16 amount) = LibUtils.splitBytes32(cost);

      if (PoolLogic.isPoolType(costType)) {
        PoolLogic._decreaseStrict(role, costType, uint128(amount));
      } else {
        ContainerLogic._burn(costType, role, uint128(amount));
      }
    }
  }
}
