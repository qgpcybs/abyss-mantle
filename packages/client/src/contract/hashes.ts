import { Hex, encodeAbiParameters, keccak256 } from "viem";
import { CUSTODIAN, STAKING } from "./constants";

export function getPool(role: Hex, poolType: Hex) {
  return keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "bytes16" }],
      [role, poolType]
    )
  ) as Hex;
}

export function getCustodian(building: Hex) {
  // pad(building, { dir: "left" });
  return keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "bytes16" }],
      [building, CUSTODIAN]
    )
  ) as Hex;
}

export function getStaking(role: Hex, building: Hex) {
  return building;
  // return keccak256(
  //   encodeAbiParameters(
  //     [{ type: "bytes32" }, { type: "bytes32" }, { type: "bytes16" }],
  //     [role, building, STAKING]
  //   )
  // ) as Hex;
}
