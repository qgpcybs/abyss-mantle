// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { CookSpecs, CookSpecsData, CookingInfo, EntityType } from "@/codegen/index.sol";
import { EntityLogic } from "@/libraries/EntityLogic.sol";
import { ContainerLogic } from "@/libraries/ContainerLogic.sol";
import { PoolLogic } from "@/libraries/PoolLogic.sol";
import { AwardLogic } from "@/libraries/AwardLogic.sol";
import { CostLogic } from "@/libraries/CostLogic.sol";
import { LibUtils } from "@/utils/LibUtils.sol";
import { Errors } from "@/Errors.sol";
import "@/hashes.sol";
import "@/constants.sol";

// _cook: burn inputs from host -> record cooking
// _serve: mint outputs to role when time is up
library CookLogic {
  function _cook(bytes32 host, bytes32 building, bytes16 outputType) internal {
    bytes16 buildingType = EntityType.get(building);
    if (CookSpecs.getBuildingType(outputType) != buildingType) revert Errors.WrongBuildingTypeToCook();

    bytes32[] memory inputs = CookSpecs.getInputs(outputType);
    bytes32 cookingId = getCooking(host, building);
    if (CookingInfo.getLastUpdated(cookingId) != 0) revert Errors.AlreadyHasCooking();
    CostLogic._burnCosts(inputs, host);

    CookingInfo.set(cookingId, host, building, outputType, uint40(block.timestamp));
  }

  function _serve(bytes32 host, bytes32 building) internal {
    bytes32 cookingId = getCooking(host, building);
    if (CookingInfo.getBuilding(cookingId) != building) revert Errors.HasNoCookingInBuilding();

    bytes16 outputType = CookingInfo.getOutputType(cookingId);
    if (!canServe(host, building)) return;
    bytes32[] memory outputs = CookSpecs.getOutputs(outputType);

    AwardLogic._mintAwards(outputs, host);
    CookingInfo.deleteRecord(cookingId);
  }

  function canServe(bytes32 host, bytes32 building) internal view returns (bool) {
    bytes32 cookingId = getCooking(host, building);
    uint40 lastUpdated = CookingInfo.getLastUpdated(cookingId);
    bytes16 outputType = CookingInfo.getOutputType(cookingId);
    return lastUpdated != 0 && lastUpdated + CookSpecs.getTimeCost(outputType) <= block.timestamp;
  }
}
