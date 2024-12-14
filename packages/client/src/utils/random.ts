import { Hex, encodeAbiParameters, keccak256 } from "viem";

export function random(seed: Hex | bigint | number, max: bigint | number) {
  return (
    BigInt(
      keccak256(
        encodeAbiParameters(
          [{ type: typeof seed == "bigint" ? "uint256" : "bytes32" }],
          [seed]
        )
      )
    ) % BigInt(max)
  );
}

export function randomInt(
  seed: Hex | bigint | number,
  max: number,
  min: number = 0
) {
  return Math.floor(Number(random(seed, max - min))) + min;
}
