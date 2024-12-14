// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Owner, CookSpecs } from "@/codegen/index.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";
import { CostLogic } from "@/libraries/CostLogic.sol";
import { EntityLogic } from "@/libraries/EntityLogic.sol";

// to craft stuff inside a player host
// use cookSpecs to handle crafting, without buildingType & timeCost constraint
// also, no use for multiple outputs
contract CraftSystem is System, AccessControl {
  function craft(bytes32 host, bytes16 outputType) public onlyCommander(host) {
    bytes32[] memory inputs = CookSpecs.getInputs(outputType);
    CostLogic._burnCosts(inputs, host);

    // skip awardLogic & use EntityLogic to mint nft directly
    EntityLogic._mint(outputType, host);
  }
}
