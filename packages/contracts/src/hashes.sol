// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./constants.sol";

function getPool(bytes32 host, bytes16 poolType) pure returns (bytes32) {
  return keccak256(abi.encode(host, poolType));
}

// for mining & ?staking
// mining because role itself needs to staked in order to mine
// staking because building creator cannot trasnfer player's staked stuff
function getCustodian(bytes32 building) pure returns (bytes32) {
  return keccak256(abi.encode(building, CUSTODIAN));
}

function getStaking(bytes32 host, bytes32 building) pure returns (bytes32) {
  return building;
  // return keccak256(abi.encode(host, building, STAKING));
}

function getCooking(bytes32 host, bytes32 building) pure returns (bytes32) {
  return keccak256(abi.encode(host, building, COOKING));
}

// // food, material, pool stuff
// function getStorage(bytes32 host, bytes16 erc20Type) pure returns (bytes32) {
// 	return keccak256(abi.encode(host, erc20Type));
// }

// function getBag(bytes32 host) pure returns (bytes32) {
//   return keccak256(abi.encode(host, BAG));
// }
