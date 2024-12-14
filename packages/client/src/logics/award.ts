import { Hex } from "viem";
import { ClientComponents } from "../mud/createClientComponents";
import { Entity, getComponentValue } from "@latticexyz/recs";
import { encodeTypeEntity, splitBytes32 } from "../utils/encode";
import { getEntitySpecs } from "./entity";
import { getRemainedERC20Amount } from "./container";
import { CostObj } from "./convert";

export type ActualAwards = { actualAwards: CostObj[]; fullAwards: boolean };

export const getActualInteractAwards = (
  components: ClientComponents,
  interactType: Hex,
  role: Hex
): ActualAwards => {
  const awards = getInteractAwards(components, interactType);
  return getActualAwards(components, role, awards);
};

export const getActualBurnAwards = (
  components: ClientComponents,
  burnType: Hex,
  role: Hex
): ActualAwards => {
  const awards = getBurnAwards(components, burnType);
  return getActualAwards(components, role, awards);
};

// use toEntity to combine
export const getActualAwards = (
  components: ClientComponents,
  role: Hex,
  awards: Hex[]
): ActualAwards => {
  const actualAwards: CostObj[] = [];
  for (const award of awards) {
    const { type, amount } = splitBytes32(award);
    const remainedAmount = getRemainedERC20Amount(components, role, type);
    if (remainedAmount >= BigInt(amount)) {
      actualAwards.push({ type, amount });
    } else {
      actualAwards.push({ type, amount: Number(remainedAmount) });
      return { actualAwards, fullAwards: false };
    }
  }
  return { actualAwards, fullAwards: true };
};

export const getInteractAwards = (
  components: ClientComponents,
  interactType: Hex
) => {
  const typeEntity = encodeTypeEntity(interactType) as Entity;
  return (
    (getComponentValue(components.InteractAwards, typeEntity)
      ?.awards as Hex[]) ?? []
  );
};

export const getBurnAwards = (components: ClientComponents, burnType: Hex) => {
  const typeEntity = encodeTypeEntity(burnType) as Entity;
  return (
    (getComponentValue(components.BurnAwards, typeEntity)?.awards as Hex[]) ??
    []
  );
};
