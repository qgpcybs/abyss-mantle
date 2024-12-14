// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Position, BuildingSpecs, EntityType, TerrainSpecs, RemovedCoord, UpgradeCosts, SizeSpecs, ConvertRatio, ConvertRatioData } from "@/codegen/index.sol";
import { LibUtils } from "@/utils/LibUtils.sol";
import { ContainerLogic } from "./ContainerLogic.sol";
import { AwardLogic } from "./AwardLogic.sol";
import { EntityLogic } from "./EntityLogic.sol";
import { CostLogic } from "./CostLogic.sol";
import { PoolLogic } from "./PoolLogic.sol";
import { HeroLogic } from "./HeroLogic.sol";
import { Errors } from "@/Errors.sol";
import "@/hashes.sol";
import "@/constants.sol";

uint16 constant ATTACK_STAMINA = 100;
uint16 constant ATTACK2_STAMINA = 100;

library ConvertLogic {
  // burn own staimina to burn enemy blood
  function _attack(bytes32 attacker, bytes32 target) internal {
    PoolLogic._decreaseStrict(attacker, STAMINA, ATTACK_STAMINA);
    uint128 damage = getConvertAmount(STAMINA, BLOOD, ATTACK_STAMINA);
    bool defeated = PoolLogic._decreaseLoose(target, BLOOD, damage);

    if (defeated) {
      // delete target
      HeroLogic._delete(target);
      // award attacker
      AwardLogic._mintBurnAwards(EntityType.get(target), attacker);
    }
  }

  // burn own staimina to burn enemy SOUL
  function _attack2(bytes32 role1, bytes32 role2) internal {
    PoolLogic._decreaseStrict(role1, STAMINA, ATTACK2_STAMINA);
    uint128 damage = getConvertAmount(STAMINA, SOUL, ATTACK2_STAMINA);
    bool insane = PoolLogic._decreaseLoose(role2, SOUL, damage);

    if (insane) {
      // deprive target
      HeroLogic._deprive(role2);
    }
  }

  function getConvertAmount(bytes16 fromType, bytes16 toType, uint128 amount) internal view returns (uint128) {
    ConvertRatioData memory convertRatio = ConvertRatio.get(fromType, toType);
    return (amount * convertRatio.num) / convertRatio.denom;
  }

  // burn erc20s, which mint erc721, an item
  function _craftERC721(bytes16 craftType, bytes32 role) internal {
    CostLogic._burnMintCosts(craftType, role);
    EntityLogic._mint(craftType, role);
  }

  // burn 1 erc20, which award erc20s
  function _consumeERC20(bytes16 consumeType, bytes32 role) internal {
    ContainerLogic._burn(consumeType, role, 1);
    AwardLogic._mintBurnAwards(consumeType, role);
  }

  function _upgrade(bytes32 entity, bytes32 role) internal {
    // TODO: check relation between entity and role
    bytes16 entityType = EntityType.get(entity);
    bytes16 toType = UpgradeCosts.getToType(entityType);
    if (toType == 0) revert Errors.NoAvailableUpgrade();

    CostLogic._burnUpgradeCosts(entityType, role);

    ContainerLogic.canIncreaseStoredSizeStrict(role, SizeSpecs.get(toType));
    EntityType.set(entity, toType);
  }
}
