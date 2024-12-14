import { Entity } from "@latticexyz/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import {
  Hex,
  decodeAbiParameters,
  encodePacked,
  hexToString,
  pad,
  toHex,
  trim,
} from "viem";

export function hexTypeToString(hex: Hex) {
  return hexToString(hex).toLowerCase().replace(/\0/g, "");
}

export function toEntity(type: Hex, id: number | bigint) {
  return encodePacked(["bytes16", "uint128"], [type, BigInt(id)]);
}

export function fromEntity(entity: Hex) {
  return {
    type: toHex(BigInt(entity) >> 128n, { size: 16 }),
    id: BigInt(entity) & 0xffffffffffffffffffffffffffffffffn,
  };
}

export function castToBytes32(value: bigint) {
  const hexValue = toHex(value);
  return pad(hexValue, { dir: "left" });
}

export function encodeTypeEntity(type: Hex) {
  return pad(type, { dir: "right" });
}

export function decodeTypeEntity(type: Hex) {
  // remove rightmost 16 bytes of padding
  return type.slice(0, 34);
}

export function encodeAddress(address: Hex) {
  return pad(address, { dir: "left" });
}

export function decodeAddress(address: Hex) {
  return trim(address, { dir: "left" });
}

export function splitBytes32(value: Hex) {
  return {
    type: value.slice(0, 34) as Hex,
    amount: parseInt(value.slice(34), 16),
  };
}

export function encodeBalanceEntity(type: Hex, owner: Hex) {
  return encodeEntity(
    { entityType: "bytes16", owner: "bytes32" },
    { entityType: type, owner }
  );
}

export function decodeBalanceEntity(entity: Entity) {
  const values = decodeAbiParameters(
    [{ type: "bytes16" }, { type: "bytes32" }],
    entity as Hex
  );
  return {
    type: values[0],
    owner: values[1],
  };
}
