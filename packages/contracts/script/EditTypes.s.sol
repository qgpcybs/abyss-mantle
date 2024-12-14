// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { initializeTypes } from "@/setup/initialize.sol";
import { IWorld } from "../src/codegen/world/IWorld.sol";
import { DefineTypes } from "../src/setup/DefineTypes.sol";
import "@/constants.sol";
import "@/codegen/index.sol";
import { LibUtils } from "@/utils/LibUtils.sol";

// forge script script/EditTypes.s.sol:EditTypes --broadcast --sig run() --rpc-url https://rpc.garnetchain.com -vvv
contract EditTypes is Script {
  function run() external {
    // specify world address
    address worldAddress = 0xBC5513B71240058e368585435F282F739fED037d;
    StoreSwitch.setStoreAddress(worldAddress);
    IWorld world = IWorld(worldAddress);

    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    bytes32[] memory empty = new bytes32[](0);
    bytes32[] memory burnAwards = compileOneType(WOOD, 20);
    BurnAwards.set(FOREST, burnAwards);

    vm.stopBroadcast();
  }
}

function compileOneType(bytes16 erc20Type, uint128 amount) returns (bytes32[] memory inputs) {
  bytes16[] memory types = new bytes16[](1);
  uint128[] memory amounts = new uint128[](1);
  types[0] = erc20Type;
  amounts[0] = amount;
  inputs = LibUtils.compileCosts(types, amounts);
}
