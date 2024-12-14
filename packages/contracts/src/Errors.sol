// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { System } from "@latticexyz/world/src/System.sol";

contract Errors is System {
  // access error
  error NotCommander();
  error NotApproved();
  error NotController();

  // path error
  error PathNotExist();

  // position error
  error NotAdjacent();

  // move error
  error NotOnGround();
  error NotArrived();
  error CannotMoveAcrossBuilding();
  error CannotMoveToTerrain();
  error CannotMoveOnEntity(bytes32 coordId);
  error ExceedMaxMoves();
  error NotIncrementalMoves();
  error NotFromHostPosition();
  error InvalidMove();

  // Token errors
  error MintToNull();
  error TransferFromNull();
  error TransferToNull();
  error TransferExceedsBalance();
  error TransferIncorrectOwner();
  error BurnFromNull();
  error BurnExceedsBalance();
  error Minted();
  error ApproveOwnerNull();
  error ApproveSpenderNull();
  error InsufficientAllowance();

  // Storage errors
  error InsufficientStorage();
  error StorageUnderflow();
  error NestedContainer();

  // miner errors
  error NoMine();
  error BuildingNotMiner();

  // building errors
  error BuildingNotOnCoord();
  error NotWithinRectangle();
  error HasNoEntityOnCoord();
  error HasEntityOnCoord();
  error WrongTerrainToBuildOn();
  error NoBuildingOnCoord();

  // terrain errors
  error NoTerrainToBurn();

  // upgrade errors
  error NoAvailableUpgrade();

  // entity errors
  error NotBuildingType();
  error NotWeaponType();
  error NotArmorType();
  error NotRoleType();

  // equipment errors
  error NotEquipped();
  error AlreadyEquipped();

  // swap errors
  error SwapRatioNotSet();

  // drop errors
  error NotInDropContainer();

  // staking
  error WrongBuildingTypeToStake();
  error HasNoStakeInBuilding();
  error AlreadyHasStaking();

  // cooking
  error WrongBuildingTypeToCook();
  error HasNoCookingInBuilding();
  error AlreadyHasCooking();

  // combat
  error NotInRange();

  // player
  error PlayerExists();
}
