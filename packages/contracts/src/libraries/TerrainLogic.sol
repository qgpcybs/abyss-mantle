// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { TerrainSpecs, RemovedCoord, Terrain } from "@/codegen/index.sol";
import { AwardLogic } from "./AwardLogic.sol";
import { MapLogic } from "./MapLogic.sol";
import { Perlin } from "../utils/Perlin.sol";
import { CostLogic } from "./CostLogic.sol";
import { Errors } from "@/Errors.sol";
import "@/hashes.sol";
import "@/constants.sol";

// larger PERLIN_DENOM means more sparsely distributed
uint8 constant PERLIN_DENOM = 30;

// because 8 * 8 * uint4 = uint256
uint32 constant GRID_SIZE = 8;

library TerrainLogic {
  enum TerrainType {
    NONE,
    OCEAN,
    FOREST,
    PLAIN,
    MOUNTAIN
  }

  function enumToEntityType(uint8 terrainType) internal pure returns (bytes16) {
    if (terrainType == uint8(TerrainType.OCEAN)) return OCEAN;
    if (terrainType == uint8(TerrainType.FOREST)) return FOREST;
    if (terrainType == uint8(TerrainType.PLAIN)) return PLAIN;
    if (terrainType == uint8(TerrainType.MOUNTAIN)) return MOUNTAIN;
    return 0;
  }

  function getTerrainEntityType(uint32 x, uint32 y) internal view returns (bytes16) {
    return enumToEntityType(getTerrainType(x, y));
  }

  function _burnTerrain(bytes32 role, uint32 x, uint32 y) internal {
    bytes32 coordId = MapLogic.getCoordId(x, y);
    bytes16 terrainType = getTerrainEntityType(x, y);
    if (!TerrainSpecs.getCanBurn(terrainType)) revert Errors.NoTerrainToBurn();

    CostLogic._burnBurnCosts(terrainType, role);

    AwardLogic._mintBurnAwards(terrainType, role);

    // RemovedCoord.set(coordId, true);
    _setTerrainValue(x, y, uint8(TerrainType.PLAIN));
  }

  function _interactTerrain(bytes32 role, uint32 x, uint32 y) internal {
    bytes16 terrainType = getTerrainEntityType(x, y);

    CostLogic._burnInteractCosts(terrainType, role);

    AwardLogic._mintInteractAwards(terrainType, role);
  }

  function getPerlin(uint32 x, uint32 y) internal pure returns (uint8) {
    int128 noise = Perlin.noise2d(int40(uint40(x)), int40(uint40(y)), int8(PERLIN_DENOM), 64);

    uint8 precision = 2;
    uint256 denominator = 10 ** precision;

    uint256 noise1 = (uint256(uint128(noise)) * denominator) >> 64;
    return uint8(noise1);
  }

  function noiseToTerrainType(uint8 noise) internal pure returns (TerrainType) {
    if (25 <= noise && noise < 30) return TerrainType.MOUNTAIN;
    if (44 <= noise && noise < 55) return TerrainType.OCEAN;
    if (65 <= noise && noise < 70) return TerrainType.FOREST;
    else return TerrainType.PLAIN;
  }

  function getTerrainType(uint32 tileX, uint32 tileY) internal view returns (uint8) {
    uint8 terrain = getTerrainFromTable(tileX, tileY);
    if (terrain != 0) return terrain;
    return getTerrainFromNoise(tileX, tileY);
  }

  function getTerrainFromNoise(uint32 tileX, uint32 tileY) internal pure returns (uint8) {
    return uint8(noiseToTerrainType(getPerlin(tileX, tileY)));
  }

  function getTerrainFromTable(uint32 tileX, uint32 tileY) internal view returns (uint8) {
    uint32 gridX = tileX / GRID_SIZE;
    uint32 gridY = tileY / GRID_SIZE;
    uint256 terrainValues = Terrain.get(MapLogic.getCoordId(gridX, gridY));

    uint32 offsetX = tileX % GRID_SIZE;
    uint32 offsetY = tileY % GRID_SIZE;
    uint32 shift = offsetY * GRID_SIZE + offsetX;
    return uint8((terrainValues >> (shift * 4)) & 0x0f);
  }

  function _setTerrainValues(uint32 gridX, uint32 gridY, uint256 terrainValues) internal {
    Terrain.set(MapLogic.getCoordId(gridX, gridY), terrainValues);
  }

  function _setTerrainValue(uint32 tileX, uint32 tileY, uint8 terrainType) internal {
    uint32 gridX = tileX / GRID_SIZE;
    uint32 gridY = tileY / GRID_SIZE;
    uint256 terrainValues = Terrain.get(MapLogic.getCoordId(gridX, gridY));

    uint32 offsetX = tileX % GRID_SIZE;
    uint32 offsetY = tileY % GRID_SIZE;
    uint32 shift = offsetY * GRID_SIZE + offsetX;
    uint256 mask = uint256(0x0f) << shift;
    terrainValues = (terrainValues & ~mask) | (uint256(terrainType) << (shift * 4));

    Terrain.set(MapLogic.getCoordId(gridX, gridY), terrainValues);
  }

  function canMoveToTerrain(bytes32 host, uint32 tileX, uint32 tileY) internal view returns (bool) {
    uint8 terrainType = getTerrainType(tileX, tileY);
    if (terrainType == uint8(TerrainType.PLAIN)) return true;
    // TODO: check if host can move on this terrain type
    return false;
  }
}
