// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { HostName, IsPlayer } from "@/codegen/index.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { HeroLogic } from "@/libraries/HeroLogic.sol";
import { AccessControl } from "@/extensions/AccessControl.sol";
import { PositionControl } from "@/extensions/PositionControl.sol";
import { Errors } from "@/Errors.sol";

contract PlayerSystem is System, AccessControl, PositionControl {
  using TypeCast for address;

  // spawn player's first hero
  function spawnHero(string memory name) public returns (uint32, uint32, bytes32) {
    bytes32 player = _msgSender().toBytes32();

    // note: for playtest, only enforce on clientside
    // if (IsPlayer.get(player)) revert Errors.PlayerExists();
    // IsPlayer.set(player, true);

    // randomly set a new hero's position
    (uint32 x, uint32 y, bytes32 hero) = HeroLogic._spawn(player);
    HostName.set(hero, name);
    return (x, y, hero);
  }

  // spawn a hero next to current hero
  function spawnHeroOnCoord(
    string memory name,
    bytes32 oldHero,
    uint32 x,
    uint32 y
  ) public onlyCommander(oldHero) onlyAdjacentCoord(oldHero, x, y) returns (bytes32) {
    bytes32 player = _msgSender().toBytes32();
    bytes32 hero = HeroLogic._spawnOnCoord(player, x, y);
    HostName.set(hero, name);
    return hero;
  }
}
