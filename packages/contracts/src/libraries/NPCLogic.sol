// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { MiningInfo, TileEntity, EntityType, Owner, SizeSpecs, Path, PathData } from "@/codegen/index.sol";
import { AwardLogic } from "./AwardLogic.sol";
import { MapLogic } from "./MapLogic.sol";
import { Perlin } from "../utils/Perlin.sol";
import { random } from "../utils/random.sol";
import { BuildingLogic } from "./BuildingLogic.sol";
import { EntityLogic } from "./EntityLogic.sol";
import { ERC721Logic } from "./ERC721Logic.sol";
import { CostLogic } from "./CostLogic.sol";
import { MapLogic } from "./MapLogic.sol";
import { LibUtils } from "../utils/LibUtils.sol";
import { SafeCastLib } from "../utils/SafeCastLib.sol";
import { Errors } from "@/Errors.sol";
import "@/hashes.sol";
import "@/constants.sol";

// range for NPC to auto-attack
uint8 constant GRID_SIZE_NPC = 30;
uint8 constant PERCENTAGE_NPC = 10;

library NPCLogic {
  // TODO: add npc cd; return npc level or type
  function hasNPC(uint32 tileX, uint32 tileY) internal pure returns (bool) {
    uint32 x = tileX / GRID_SIZE_NPC;
    uint32 y = tileY / GRID_SIZE_NPC;
    bytes32 coordId = MapLogic.getCoordId(x, y);
    return random(uint256(coordId), 100) <= PERCENTAGE_NPC;
  }

  // auto-attack NPC spawned on top of player path to
  function _spawnNPC(bytes32 role, uint32 tileX, uint32 tileY) internal {
    if (!hasNPC(tileX, tileY)) return;
    bytes32 npc = EntityLogic._mint(NPC, space());
    Path.set(npc, PathData(tileX, tileY, tileX, tileY, uint40(block.timestamp), 0));
    // _autoAttack(role, npc);
    // Sieged.set(role, npc);
  }

  // auto-attack when role  moves, or attacks, or npc get attacked
  function _autoAttack(bytes32 role, bytes32 npc) internal {
    // CombatLogic._attack(npc, role);
  }
}
