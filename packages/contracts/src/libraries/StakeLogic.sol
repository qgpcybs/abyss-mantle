// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { StakeSpecs, StakeSpecsData, EntityType, StakingInfo } from "@/codegen/index.sol";
import { EntityLogic } from "@/libraries/EntityLogic.sol";
import { ContainerLogic } from "@/libraries/ContainerLogic.sol";
import { PoolLogic } from "@/libraries/PoolLogic.sol";
import { AwardLogic } from "@/libraries/AwardLogic.sol";
import { LibUtils } from "@/utils/LibUtils.sol";
import { Errors } from "@/Errors.sol";
import "@/hashes.sol";
import "@/constants.sol";

// _stake: transfer inputs to building -> record staking
// _claim: mint outputs to role when time is up
// _unstake: transfer inputs back to host -> delete staking record
// note: need to make sure building creator cannot access what's staked in building
library StakeLogic {
  function _stake(bytes32 host, bytes32 building, bytes16 outputType) internal {
    bytes16 buildingType = EntityType.get(building);
    if (StakeSpecs.getBuildingType(outputType) != buildingType) revert Errors.WrongBuildingTypeToStake();

    bytes32[] memory inputs = StakeSpecs.getInputs(outputType);
    bytes32 stakingId = getStaking(host, building);
    // fixed earning rate per player per building
    if (StakingInfo.getLastUpdated(stakingId) != 0) revert Errors.AlreadyHasStaking();
    _stakeInputs(inputs, host, building);

    StakingInfo.set(stakingId, host, building, outputType, uint40(block.timestamp));
  }

  function _unstake(bytes32 host, bytes32 building) internal {
    _claimAndUnstake(host, building);

    bytes32 stakingId = getStaking(host, building);
    if (StakingInfo.getBuilding(stakingId) != building) revert Errors.HasNoStakeInBuilding();

    bytes16 outputType = StakingInfo.getOutputType(stakingId);
    bytes32[] memory inputs = StakeSpecs.getInputs(outputType);
    _unstakeInputs(inputs, building, host);

    StakingInfo.deleteRecord(stakingId);
  }

  function _claim(bytes32 host, bytes32 building) internal {
    bytes32 stakingId = getStaking(host, building);
    if (StakingInfo.getBuilding(stakingId) != building) revert Errors.HasNoStakeInBuilding();

    bytes16 outputType = StakingInfo.getOutputType(stakingId);
    if (!canClaim(host, building)) return;
    bytes32[] memory outputs = StakeSpecs.getOutputs(outputType);

    AwardLogic._mintAwards(outputs, host);
    StakingInfo.setLastUpdated(stakingId, uint40(block.timestamp));
  }

  /**
   * claim (loose) & unstake (strict)
   */
  function _claimAndUnstake(bytes32 host, bytes32 building) internal {
    bytes32 stakingId = getStaking(host, building);
    if (StakingInfo.getBuilding(stakingId) != building) revert Errors.HasNoStakeInBuilding();

    bytes16 outputType = StakingInfo.getOutputType(stakingId);
    if (!canClaim(host, building)) {
      bytes32[] memory outputs = StakeSpecs.getOutputs(outputType);
      AwardLogic._mintAwards(outputs, host);
    }

    bytes32[] memory inputs = StakeSpecs.getInputs(outputType);
    _unstakeInputs(inputs, building, host);

    StakingInfo.deleteRecord(stakingId);
  }

  function canClaim(bytes32 host, bytes32 building) internal view returns (bool) {
    bytes32 stakingId = getStaking(host, building);
    uint40 lastUpdated = StakingInfo.getLastUpdated(stakingId);
    bytes16 outputType = StakingInfo.getOutputType(stakingId);
    return lastUpdated != 0 && lastUpdated + StakeSpecs.getTimeCost(outputType) <= block.timestamp;
  }

  /**
   * burn pool & transfer from host to stake into building
   */
  function _stakeInputs(bytes32[] memory inputs, bytes32 from, bytes32 to) internal {
    for (uint256 i = 0; i < inputs.length; i++) {
      bytes32 input = inputs[i];
      (bytes16 costType, bytes16 amount) = LibUtils.splitBytes32(input);

      if (PoolLogic.isPoolType(costType)) {
        PoolLogic._decreaseStrict(from, costType, uint128(amount));
      } else {
        ContainerLogic._transfer(costType, from, to, uint128(amount));
      }
    }
  }

  /**
   * skip pool & transfer from building to host
   */
  function _unstakeInputs(bytes32[] memory inputs, bytes32 from, bytes32 to) internal {
    for (uint256 i = 0; i < inputs.length; i++) {
      bytes32 input = inputs[i];
      (bytes16 costType, bytes16 amount) = LibUtils.splitBytes32(input);

      if (!PoolLogic.isPoolType(costType)) {
        ContainerLogic._transfer(costType, from, to, uint128(amount));
      }
    }
  }
}
