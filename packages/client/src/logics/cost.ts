import { Hex } from "viem";
import { ClientComponents } from "../mud/createClientComponents";
import { encodeTypeEntity, splitBytes32 } from "../utils/encode";
import { getERC20Balance, hasBalance, hasERC20Balance } from "./container";
import { Entity, getComponentValue } from "@latticexyz/recs";

export const hasMintCosts = (
  components: ClientComponents,
  role: Hex,
  mintType: Hex
) => {
  const costs = getMintCosts(components, mintType);
  if (!costs) return false;
  return hasCosts(components, role, costs as Hex[]);
};

export const getMintCosts = (components: ClientComponents, mintType: Hex) => {
  const typeEntity = encodeTypeEntity(mintType) as Entity;
  return getComponentValue(components.MintCosts, typeEntity)?.costs ?? [];
};

export const hasInteractCosts = (
  components: ClientComponents,
  role: Hex,
  interactType: Hex
) => {
  const costs = getInteractCosts(components, interactType);
  if (!costs) return false;
  return hasCosts(components, role, costs as Hex[]);
};

export const getInteractCosts = (
  components: ClientComponents,
  interactType: Hex
) => {
  const typeEntity = encodeTypeEntity(interactType) as Entity;
  return getComponentValue(components.InteractCosts, typeEntity)?.costs ?? [];
};

export const hasUpgradeCosts = (
  components: ClientComponents,
  role: Hex,
  upgradeType: Hex
) => {
  const costs = getUpgradeCosts(components, upgradeType);
  if (!costs) return false;
  return hasCosts(components, role, costs as Hex[]);
};

export const getUpgradeCosts = (
  components: ClientComponents,
  upgradeType: Hex
) => {
  const typeEntity = encodeTypeEntity(upgradeType) as Entity;
  return getComponentValue(components.UpgradeCosts, typeEntity)?.costs ?? [];
};

export const hasBurnCosts = (
  components: ClientComponents,
  role: Hex,
  burnType: Hex
) => {
  const costs = getBurnCosts(components, burnType);
  if (!costs) return false;
  return hasCosts(components, role, costs as Hex[]);
};

export const getBurnCosts = (components: ClientComponents, burnType: Hex) => {
  const typeEntity = encodeTypeEntity(burnType) as Entity;
  return getComponentValue(components.BurnCosts, typeEntity)?.costs ?? [];
};

export const hasStakeCosts = (
  components: ClientComponents,
  role: Hex,
  stakeType: Hex
) => {
  const costs = getStakeCosts(components, stakeType);
  if (!costs) return false;
  return hasCosts(components, role, costs as Hex[]);
};

export const getStakeCosts = (components: ClientComponents, stakeType: Hex) => {
  const typeEntity = encodeTypeEntity(stakeType) as Entity;
  return getComponentValue(components.StakeSpecs, typeEntity)?.inputs ?? [];
};

export const hasCosts = (
  components: ClientComponents,
  role: Hex,
  costs: Hex[]
) => {
  const costsData = costs.map((cost) => splitBytes32(cost));
  return costsData.every(({ type, amount }) =>
    hasERC20Balance(components, role, type, BigInt(amount))
  );
};

export type CostInfoType = { type: Hex; amount: number; has: number };

export const getCostsInfo = (
  components: ClientComponents,
  role: Hex,
  costs: Hex[]
): CostInfoType[] => {
  const costsData = costs.map((cost) => splitBytes32(cost));
  return costsData.map(({ type, amount }) => ({
    type,
    amount,
    has: Number(getERC20Balance(components, role, type)),
  }));
};
