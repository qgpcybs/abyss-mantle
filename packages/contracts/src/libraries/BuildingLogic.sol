// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Path, BuildingSpecs, TileEntity, EntityType, TerrainSpecs, RemovedCoord, UpgradeCosts, SizeSpecs, Creator } from "@/codegen/index.sol";
import { LibUtils } from "@/utils/LibUtils.sol";
import { ContainerLogic } from "./ContainerLogic.sol";
import { AwardLogic } from "./AwardLogic.sol";
import { MapLogic } from "./MapLogic.sol";
import { TileLogic } from "./TileLogic.sol";
import { PathLogic } from "./PathLogic.sol";
import { MoveLogic } from "./MoveLogic.sol";
import { TerrainLogic } from "./TerrainLogic.sol";
import { CostLogic } from "./CostLogic.sol";
import { EntityLogic } from "./EntityLogic.sol";
import { Errors } from "@/Errors.sol";
import "@/hashes.sol";
import "@/constants.sol";

library BuildingLogic {
  // burn erc20s, which mint erc721, a building
  function _buildBuilding(
    bytes32 player,
    bytes32 role,
    bytes16 buildingType,
    uint32 x1,
    uint32 y1,
    uint32 lowerX,
    uint32 lowerY
  ) internal {
    bytes32[] memory tileIds = getRectangleCoordIdsStrict(
      x1,
      y1,
      lowerX,
      lowerY,
      BuildingSpecs.getWidth(buildingType),
      BuildingSpecs.getHeight(buildingType)
    );
    // check terrainType to build on
    canBuildOnTilesStrict(buildingType, tileIds);

    // burn costs
    CostLogic._burnMintCosts(buildingType, role);

    // mint building
    bytes32 building = EntityLogic._mint(buildingType, space());
    TileLogic._setTileEntitiesStrict(building, tileIds);
    // TODO?: set building path on lowerX, lowerY?
    PathLogic._initPath(building, lowerX, lowerY);
    // Position.set(building, x, y);
    Creator.set(building, player);
  }

  // because building has no path since building can be 2x2
  function _enterBuilding(bytes32 role, uint32 x, uint32 y) internal {
    bytes32 building = getBuildingFromCoord(x, y);
    ContainerLogic._transfer(space(), building, role);

    (uint32 roleX, uint32 roleY) = PathLogic.getPositionStrict(role);
    TileEntity.deleteRecord(MapLogic.getCoordId(roleX, roleY));
    Path.deleteRecord(role);

    // bytes16 buildingType = EntityType.get(building);
    // CostLogic._burnEnterCosts(buildingType, role);
    // AwardLogic._mintEnterAwards(buildingType, role);
  }

  // x, y is building's coord, newX, newY is exit coord
  function _exitBuilding(bytes32 role, uint32 x, uint32 y, uint32 newX, uint32 newY) internal {
    bytes32 newTildId = MapLogic.getCoordId(newX, newY);
    bytes32 building = getBuildingFromCoord(x, y);
    ContainerLogic._transfer(building, space(), role);
    MoveLogic.canMoveToTileStrict(role, newX, newY);
    PathLogic._initPath(role, newX, newY);
    TileLogic._setTileEntityStrict(role, newTildId);
  }

  // note: buildingId could be zero, or not a building type
  function getBuildingFromCoord(uint32 x, uint32 y) internal view returns (bytes32) {
    bytes32 tileId = MapLogic.getCoordId(x, y);
    return TileEntity.get(tileId);
  }

  function canBuildOnTilesStrict(bytes16 buildingType, bytes32[] memory coordIds) internal view {
    bytes16 buildOnTerrainType = BuildingSpecs.getTerrainType(buildingType);
    for (uint256 i = 0; i < coordIds.length; i++) {
      canBuildOnTileStrict(buildOnTerrainType, coordIds[i]);
    }
  }

  function canBuildOnTileStrict(bytes16 buildOnTerrainType, bytes32 tileId) internal view {
    (uint32 x, uint32 y) = MapLogic.splitCoordId(tileId);
    bytes16 terrainType = TerrainLogic.getTerrainEntityType(x, y);
    if (terrainType != buildOnTerrainType) revert Errors.WrongTerrainToBuildOn();
  }

  // 1) get all coordIds in the rectangle, 2) check if x1, y1 is within the rectangle
  function getRectangleCoordIdsStrict(
    uint32 x1,
    uint32 y1,
    uint32 lowerX,
    uint32 lowerY,
    uint8 width,
    uint8 height
  ) internal pure returns (bytes32[] memory) {
    uint32 upperX = lowerX + width - 1;
    uint32 upperY = lowerY + height - 1;
    bytes32[] memory coords = new bytes32[](width * height);
    uint32 index = 0;
    bool isWithin = false;
    for (uint32 x = lowerX; x <= upperX; x++) {
      for (uint32 y = lowerY; y <= upperY; y++) {
        if (x == x1 && y == y1) isWithin = true;
        coords[index] = MapLogic.getCoordId(x, y);
        index++;
      }
    }
    if (!isWithin) revert Errors.NotWithinRectangle();
    return coords;
  }

  // burn erc721 (building), which burn erc20s & award erc20s
  function _burnBuilding(uint32 x, uint32 y) internal {
    bytes32 coordId = MapLogic.getCoordId(x, y);
    bytes32 entity = TileEntity.get(coordId);
    // if (entity == 0) revert Errors.HasNoEntityOnCoord();

    bytes16 entityType = EntityType.get(entity);
    if (!EntityLogic.isBuildingType(entityType)) revert Errors.NotBuildingType();
    // CostLogic._burnBurnCosts(entityType, role);
    // AwardLogic._mintBurnAwards(entityType, role);

    (uint32 lowerX, uint32 lowerY) = PathLogic.getPositionStrict(entity);
    bytes32[] memory tilIds = getRectangleCoordIdsStrict(
      x,
      y,
      lowerX,
      lowerY,
      BuildingSpecs.getWidth(entityType),
      BuildingSpecs.getHeight(entityType)
    );
    Path.deleteRecord(entity);
    TileLogic._deleteTileEntities(entity, tilIds);
    EntityLogic._burn(entity);
    Creator.deleteRecord(entity);
  }

  // ------- individual buildingType has its own active functionalities -------
  function _storeERC721(bytes32 role, bytes32 building, bytes32 item) internal {}

  function _storeERC20(bytes32 role, bytes32 building, bytes16 erc20Type, uint128 amount) internal {}

  function _exportERC20(bytes32 role, bytes32 building, bytes16 erc20Type, uint128 amount) internal {}

  function _upgradeBuilding(bytes32 role, bytes32 building) internal {}

  function _produceERC20(bytes32 role, bytes32 building, bytes16 erc20Type, uint128 amount) internal {}

  function _produceERC721(bytes32 role, bytes32 building, bytes16 erc721Type) internal {}

  // ------- check if the building can moved to/across -------
  function canMoveTo(bytes32 building) internal view returns (bool) {
    bytes16 buildingType = EntityType.get(building);
    return BuildingSpecs.getCanMove(buildingType);
  }
}
