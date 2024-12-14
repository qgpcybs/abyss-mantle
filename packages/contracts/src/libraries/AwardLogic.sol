// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { BurnAwards, SizeSpecs, InteractAwards } from "@/codegen/index.sol";
import { LibUtils } from "@/utils/LibUtils.sol";
import { ContainerLogic } from "./ContainerLogic.sol";
import { EntityLogic } from "./EntityLogic.sol";
import { PoolLogic } from "./PoolLogic.sol";
import "@/hashes.sol";

library AwardLogic {
  function _mintInteractAwards(bytes16 interactType, bytes32 role) internal {
    bytes32[] memory awards = InteractAwards.getAwards(interactType);
    _mintAwards(awards, role);
  }

  function _mintBurnAwards(bytes16 burnType, bytes32 role) internal {
    bytes32[] memory awards = BurnAwards.getAwards(burnType);
    _mintAwards(awards, role);
  }

  // award is loosely minted to player role
  function _mintAwards(bytes32[] memory awards, bytes32 role) internal {
    for (uint256 i = 0; i < awards.length; i++) {
      bytes32 award = awards[i];
      (bytes16 awardType, bytes16 amount) = LibUtils.splitBytes32(award);

      if (PoolLogic.isPoolType(awardType)) {
        PoolLogic._increaseLoose(role, awardType, uint128(amount));
      } else if (amount == 0) {
        EntityLogic._mint(awardType, role);
      } else {
        ContainerLogic._mintLoose(awardType, role, uint128(amount));
      }
    }
  }
}
