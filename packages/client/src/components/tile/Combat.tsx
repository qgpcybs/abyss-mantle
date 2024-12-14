import { Entity } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import {
  getCombatRange,
  getCombatAttack,
  getCombatDefense,
  withinAttackRange,
  canDefeat,
  getDamage,
} from "../../logics/combat";
import { usePoolAmount } from "../../logics/pool";
import { BLOOD } from "../../contract/constants";
import { Hex } from "viem";

export function Combat({
  attacker,
  target,
}: {
  attacker: Entity;
  target: Entity;
}) {
  const { components, systemCalls } = useMUD();

  const targetHealth = usePoolAmount(components, target, BLOOD);
  if (attacker === target) return null;
  const attack = getCombatAttack(components, attacker);
  const defense = getCombatDefense(components, target);
  const range = getCombatRange(components, attacker);

  const withinRange = withinAttackRange(components, attacker, target);
  const damage = getDamage(attack, defense);
  const defeated = canDefeat(components, attacker, target);

  return (
    <div>
      <div>Attack: {attack}</div>
      <div>Defense: {defense}</div>
      <div>Range: {range}</div>
      <div>Health: {targetHealth}</div>
      <div>Within Range: {withinRange ? "Yes" : "No"}</div>
      <div>Damage: {damage}</div>
      <div>Defeated: {defeated ? "Yes" : "No"}</div>
      <button
        className="btn-blue"
        onClick={() => systemCalls.attack(attacker as Hex, target as Hex)}
      >
        Attack
      </button>
    </div>
  );
}
