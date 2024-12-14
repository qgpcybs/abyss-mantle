// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { ContainerLogic } from "@/libraries/ContainerLogic.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";
import { PositionControl } from "@/extensions/PositionControl.sol";
import { BuildingLogic } from "@/libraries/BuildingLogic.sol";

contract StorageSystem is System, AccessControl, PositionControl {
  using TypeCast for address;

  // role <-> building; role <-> role
  function transferERC20(
    bytes16 itemType,
    uint32 fromX,
    uint32 fromY,
    uint32 toX,
    uint32 toY,
    uint128 amount
  ) public onlyAdjacentCoords(fromX, fromY, toX, toY) {
    bytes32 from = BuildingLogic.getBuildingFromCoord(fromX, fromY);
    bytes32 to = BuildingLogic.getBuildingFromCoord(toX, toY);
    transferERC20(itemType, from, to, amount);
  }

  function transferERC20(bytes16 itemType, bytes32 from, bytes32 to, uint128 amount) private onlyController(from) {
    ContainerLogic._transfer(itemType, from, to, amount);
  }

  function transferERC721(
    uint32 fromX,
    uint32 fromY,
    uint32 toX,
    uint32 toY,
    bytes32 erc721
  ) public onlyAdjacentCoords(fromX, fromY, toX, toY) {
    bytes32 from = BuildingLogic.getBuildingFromCoord(fromX, fromY);
    bytes32 to = BuildingLogic.getBuildingFromCoord(toX, toY);
    transferERC721(from, to, erc721);
  }

  function transferERC721(bytes32 from, bytes32 to, bytes32 erc721) private onlyController(from) {
    ContainerLogic._transfer(from, to, erc721);
  }
}
