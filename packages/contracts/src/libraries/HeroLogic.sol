// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Owner, Commander, Position, TileEntity, EntityType, StatsSpecs } from "@/codegen/index.sol";
import { ContainerLogic } from "@/libraries/ContainerLogic.sol";
import { MapLogic } from "@/libraries/MapLogic.sol";
import { Errors } from "@/Errors.sol";
import { EntityLogic } from "@/libraries/EntityLogic.sol";
import { EquipmentLogic } from "@/libraries/EquipmentLogic.sol";
import { PoolLogic } from "@/libraries/PoolLogic.sol";
import { SafeCastLib } from "@/utils/SafeCastLib.sol";
import { LibUtils } from "@/utils/LibUtils.sol";
import "@/constants.sol";
import "@/hashes.sol";

// TODO: change name to RoleLogic?
library HeroLogic {
  using SafeCastLib for uint256;

  // randomly spawn hero on the map
  function _spawn(bytes32 player) internal returns (uint32, uint32, bytes32) {
    bytes32 hero = EntityLogic._mint(HOST, space());
    Commander.set(hero, player);

    (uint32 x, uint32 y) = MapLogic.getRandomEmptyPosition(
      uint256(hero),
      2 ** 16 - 32,
      2 ** 16 - 32,
      2 ** 16 + 32,
      2 ** 16 + 32
    );
    MapLogic._initGroundPath(hero, x, y);

    ContainerLogic._mint(BERRY, hero, 10);
    return (x, y, hero);
  }

  function _spawnOnCoord(bytes32 player, uint32 x, uint32 y) internal returns (bytes32) {
    bytes32 hero = EntityLogic._mint(HOST, space());
    Commander.set(hero, player);

    MapLogic._initGroundPath(hero, x, y);
    return hero;
  }

  function _delete(bytes32 hero) internal {
    EntityLogic._burn(hero);
    Position.deleteRecord(hero);
  }

  function _deprive(bytes32 hero) internal {
    Commander.deleteRecord(hero);
  }

  /**
   * ad hoc function 2b used in combat, unless figure out a more generalized way to describe interaction
   */
  function getAttack(bytes32 host) internal view returns (uint32) {
    return PoolLogic.getPoolAmount(host, ATTACK).safeCastTo32();
  }

  function getRange(bytes32 host) internal view returns (uint32) {
    return PoolLogic.getPoolAmount(host, RANGE).safeCastTo32();
  }

  function getDefense(bytes32 host) internal view returns (uint32) {
    return PoolLogic.getPoolAmount(host, DEFENSE).safeCastTo32();
  }
}
