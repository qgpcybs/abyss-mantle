import { Entity } from "@latticexyz/recs";
import { ClientComponents } from "../mud/createClientComponents";
import { getPoolAmount } from "./pool";
import {
  ARMOR,
  ATTACK,
  BLOOD,
  DEFENSE,
  RANGE,
  WEAPON,
} from "../contract/constants";
import { getEquipmentStats } from "./equipment";
import { Hex } from "viem";
import { getPosition } from "./path";
import { withinRangeLimited } from "./position";

// ----- similar to combatLogic -----
export const getCombatRange = (
  components: ClientComponents,
  entity: Entity
) => {
  return getCombatStats(components, entity, RANGE, WEAPON);
};

export const getCombatAttack = (
  components: ClientComponents,
  entity: Entity
) => {
  return getCombatStats(components, entity, ATTACK, WEAPON);
};

export const getCombatDefense = (
  components: ClientComponents,
  entity: Entity
) => {
  return getCombatStats(components, entity, DEFENSE, ARMOR);
};

export const getCombatStats = (
  components: ClientComponents,
  entity: Entity,
  statsType: Hex,
  equipType: Hex
) => {
  const heroStats = getPoolAmount(components, entity, statsType);
  const equipmentStats = getEquipmentStats(
    components,
    entity,
    equipType,
    statsType
  );
  return Math.max(heroStats, equipmentStats);
};

// note: not using hook unless there is a locked-on target mechanism
export const withinAttackRange = (
  components: ClientComponents,
  attacker: Entity,
  defender: Entity
) => {
  const range = getCombatRange(components, attacker);
  const attackCoord = getPosition(components, attacker);
  const defendCoord = getPosition(components, defender);
  if (!attackCoord || !defendCoord) return false;
  return withinRangeLimited(attackCoord, defendCoord, range);
};

export const getDamage = (attack: number, defense: number) => {
  if (attack >= defense) return attack * 2 - defense;
  return Math.floor((attack * attack) / defense);
};

// note: health could be a hook... the other not quite changeable if no upgrade()
export const canDefeat = (
  components: ClientComponents,
  attacker: Entity,
  defender: Entity
) => {
  const health = getPoolAmount(components, defender, BLOOD);
  const attack = getCombatAttack(components, attacker);
  const defense = getCombatDefense(components, defender);
  const damage = getDamage(attack, defense);
  return damage >= health;
};
