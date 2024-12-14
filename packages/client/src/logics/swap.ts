import { Hex } from "viem";
import { ClientComponents } from "../mud/createClientComponents";
import {
  Entity,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from "@latticexyz/recs";
import { decodeEntity, encodeEntity } from "@latticexyz/store-sync/recs";
import { getERC20Balance } from "./container";

export const getHostSwaps = (components: ClientComponents, host: Hex) => {
  const { SwapRatio } = components;
  const swaps = [...runQuery([HasValue(SwapRatio, { hostCopy: host })])];
  return swaps.map((swap, i) => {
    const { fromType, toType, host } = splitSwapEntity(swap);
    return {
      fromType,
      toType,
      host,
      swapRatio: getComponentValue(SwapRatio, swap),
    };
  });
};

export const canSwap = (
  components: ClientComponents,
  fromType: Hex,
  toType: Hex,
  fromHost: Hex,
  toHost: Hex,
  fromAmount: number
): boolean => {
  const maxSwap = getMaxSwapAmount(
    components,
    fromType,
    toType,
    fromHost,
    toHost
  );
  const swapAmount = getSwapAmount(
    components,
    fromType,
    toType,
    toHost,
    fromAmount
  );
  if (!maxSwap || !swapAmount) return false;
  return swapAmount <= maxSwap;
};

export const getMaxSwapAmount = (
  components: ClientComponents,
  fromType: Hex,
  toType: Hex,
  fromHost: Hex,
  toHost: Hex
) => {
  const fromAmount = getERC20Balance(components, fromHost, fromType);
  const swapAmount = getSwapAmount(
    components,
    fromType,
    toType,
    toHost,
    Number(fromAmount)
  );
  if (!swapAmount) return;
  const toBalance = getERC20Balance(components, toHost, toType);
  return Math.min(swapAmount, Number(toBalance));
};

export const getSwapAmount = (
  components: ClientComponents,
  fromType: Hex,
  toType: Hex,
  host: Hex,
  fromAmount: number
) => {
  const swapRatio = getSwapRatio(components, fromType, toType, host);
  if (!swapRatio) return;
  const toAmount = Math.floor((fromAmount * swapRatio.num) / swapRatio.denom);
  return toAmount;
};

export const getSwapRatio = (
  components: ClientComponents,
  fromType: Hex,
  toType: Hex,
  host: Hex
) => {
  const { SwapRatio } = components;
  const swapEntity = getSwapEntity(fromType, toType, host);
  return getComponentValue(SwapRatio, swapEntity);
};

export const splitSwapEntity = (swapEntity: Entity) => {
  return decodeEntity(
    { fromType: "bytes16", toType: "bytes16", host: "bytes32" },
    swapEntity
  );
};

export const getSwapEntity = (fromType: Hex, toType: Hex, host: Hex) => {
  return encodeEntity(
    { fromType: "bytes16", toType: "bytes16", host: "bytes32" },
    { fromType, toType, host }
  );
};
