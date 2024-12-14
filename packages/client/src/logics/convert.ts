import { Hex } from "viem";
import { ClientComponents } from "../mud/createClientComponents";
import {
  hasInteractCosts,
  hasMintCosts,
  getMintCosts,
  getInteractCosts,
  getBurnCosts,
  hasBurnCosts,
} from "./cost";
import { splitBytes32, toEntity } from "../utils/encode";
import {
  ActualAwards,
  getActualAwards,
  getBurnAwards,
  getInteractAwards,
} from "./award";

export type CostObj = { type: Hex; amount: number };

export type ConvertData = {
  costs: CostObj[];
  hasCosts: boolean;
  awards: CostObj[];
  actualAwards: ActualAwards;
};

export const getConsumeData = (
  components: ClientComponents,
  role: Hex,
  consumeType: Hex
): ConvertData => {
  const costs = [{ type: consumeType, amount: 1 }];
  const hasCosts = hasMintCosts(components, role, consumeType);
  const awardsHex = getBurnAwards(components, consumeType);
  const actualAwards = getActualAwards(components, role, awardsHex);
  const awards = awardsHex.map((award) => splitBytes32(award));
  return { costs, hasCosts, awards, actualAwards };
};

// canConsume = has burn awards
export const canConsume = (
  components: ClientComponents,
  consumeType: Hex
): boolean => {
  const awards = getBurnAwards(components, consumeType) as Hex[];
  return awards.length > 0;
};

export const getCraftData = (
  components: ClientComponents,
  role: Hex,
  craftType: Hex
): ConvertData => {
  const costsHex = getMintCosts(components, craftType) as Hex[];
  const costs = costsHex.map((cost) => splitBytes32(cost));
  const hasCosts = hasMintCosts(components, role, craftType);
  const awards = [{ type: craftType, amount: 1 }];
  const awardsHex = [toEntity(craftType, 1)];
  const actualAwards = getActualAwards(components, role, awardsHex);
  return { costs, hasCosts, awards, actualAwards };
};

export const getInteractData = (
  components: ClientComponents,
  role: Hex,
  interactType: Hex
): ConvertData => {
  const costsHex = getInteractCosts(components, interactType) as Hex[];
  const costs = costsHex.map((cost) => splitBytes32(cost));
  const hasCosts = hasInteractCosts(components, role, interactType);
  const awardsHex = getInteractAwards(components, interactType);
  const awards = awardsHex.map((award) => splitBytes32(award));
  const actualAwards = getActualAwards(components, role, awardsHex);
  return { costs, hasCosts, awards, actualAwards };
};

export const getUpgradeData = () => {};

export const getBuildBuildingData = (
  components: ClientComponents,
  role: Hex,
  buildingType: Hex
): ConvertData => {
  const costsHex = getMintCosts(components, buildingType) as Hex[];
  const costs = costsHex.map((cost) => splitBytes32(cost));
  const hasCosts = hasMintCosts(components, role, buildingType);
  const awards = [{ type: buildingType, amount: 1 }];
  const awardsHex = [toEntity(buildingType, 1)];
  const actualAwards = getActualAwards(components, role, awardsHex);
  return { costs, hasCosts, awards, actualAwards };
};

// to burn building, terrrain, etc.
export const getBurnData = (
  components: ClientComponents,
  role: Hex,
  burnType: Hex
): ConvertData => {
  const costsHex = getBurnCosts(components, burnType) as Hex[];
  const costs = costsHex.map((cost) => splitBytes32(cost));
  const hasCosts = hasBurnCosts(components, role, burnType);
  const awardsHex = getBurnAwards(components, burnType);
  const awards = awardsHex.map((award) => splitBytes32(award));
  const actualAwards = getActualAwards(components, role, awardsHex);
  return { costs, hasCosts, awards, actualAwards };
};

export const getAttackData = () => {};

export const getAttack2Data = () => {};
