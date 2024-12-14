// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { MiningInfo, TileEntity, EntityType, Owner, SizeSpecs } from "@/codegen/index.sol";
import { AwardLogic } from "./AwardLogic.sol";
import { MapLogic } from "./MapLogic.sol";
import { Perlin } from "../utils/Perlin.sol";
import { random } from "../utils/random.sol";
import { BuildingLogic } from "./BuildingLogic.sol";
import { ContainerLogic } from "./ContainerLogic.sol";
import { ERC721Logic } from "./ERC721Logic.sol";
import { CostLogic } from "./CostLogic.sol";
import { MapLogic } from "./MapLogic.sol";
import { LibUtils } from "../utils/LibUtils.sol";
import { SafeCastLib } from "../utils/SafeCastLib.sol";
import { Errors } from "@/Errors.sol";
import "@/hashes.sol";
import "@/constants.sol";

uint256 constant MINING_RATE = 10 ** 18; //divided by DECIMALS
uint256 constant DECIMALS = 18;

library MiningLogic {
  using SafeCastLib for uint256;

  function getPerlin(uint32 x, uint32 y) internal pure returns (uint8) {
    int128 noise = Perlin.noise2d(int40(uint40(x)), int40(uint40(y)), int8(PERLIN_DENOM_MINE), 64);

    uint8 precision = 2;
    uint256 denominator = 10 ** precision;

    uint256 noise1 = (uint256(uint128(noise)) * denominator) >> 64;
    return uint8(noise1);
  }

  function hasMine(uint32 tileX, uint32 tileY) internal pure returns (bool) {
    uint32 x = tileX / GRID_SIZE_MINE;
    uint32 y = tileY / GRID_SIZE_MINE;
    bytes32 coordId = MapLogic.getCoordId(x, y);
    uint8 perlin = getPerlin(x, y);
    return perlin >= DOWN_LIMIT_MINE && perlin <= UP_LIMIT_MINE && random(uint256(coordId), 100) <= PERCENTAGE_MINE;
  }

  // function _buildMiner(bytes32 player, bytes32 role, uint32 x1, uint32 y1, uint32 lowerX, uint32 lowerY) internal {
  //   if (!hasMine(lowerX, lowerY)) revert Errors.NoMine();
  //   BuildingLogic._buildBuilding(player, role, MINER, x1, y1, lowerX, lowerY);
  // }

  // TODO: add mining tools, transfer it to custodian,
  function _startMining(bytes32 role, uint32 x, uint32 y) internal {
    if (!hasMine(x, y)) revert Errors.NoMine();
    bytes32 tileId = MapLogic.getCoordId(x, y);
    bytes32 building = TileEntity.get(tileId);
    if (EntityType.get(building) != MINER) revert Errors.BuildingNotMiner();

    ERC721Logic._transfer(building, getCustodian(building), role);
    // add cooldown?
    MiningInfo.set(role, building, uint40(block.timestamp));
  }

  function _stopMining(bytes32 role) internal {
    bytes32 building = MiningInfo.getBuildingId(role);
    // no need to delete mining info because custodian ensures no re-enter mining

    // require mint amount to be within uint128
    uint128 amount = getAcutalMinedAmount(role).safeCastTo128();
    ContainerLogic._mint(IRON, role, amount);
    ERC721Logic._transfer(getCustodian(building), building, role);
    MiningInfo.deleteRecord(role);
  }

  function getMinedAmount(bytes32 role) internal view returns (uint256) {
    uint256 miningRate = MINING_RATE;
    uint256 decimals = DECIMALS;
    uint40 lastUpdated = MiningInfo.getLastUpdated(role);
    uint40 duration = uint40(block.timestamp) - lastUpdated;
    return (miningRate * duration) / 10 ** decimals;
  }

  // rn only mine IRON
  function getAcutalMinedAmount(bytes32 role) internal view returns (uint256) {
    bytes16 minedType = IRON;
    uint128 size = SizeSpecs.get(minedType);
    uint256 storeSize = ContainerLogic.getRemainedSize(role);
    uint256 storeAmount = storeSize / size;

    uint256 minedAmount = getMinedAmount(role);
    return LibUtils.min(storeAmount, minedAmount);
  }
}
