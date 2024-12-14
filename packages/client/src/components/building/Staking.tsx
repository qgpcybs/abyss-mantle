import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { Entity, getComponentValue, HasValue } from "@latticexyz/recs";
import { Hex } from "viem";
import { useMUD } from "../../MUDContext";
import { useRemainedToClaim } from "../../logics/stake";
import { getRoleAndHostAdjacentCoord } from "../../logics/building";
import { SOURCE } from "../../constants";
import { getStaking } from "../../contract/hashes";
import { StakeableInfo } from "./Stakeable";
import { encodeTypeEntity } from "../../utils/encode";
import { canStoreOutputs } from "../../logics/container";

/**
 * display a staking instance, which includes stop & claim button, & staking info
 * may also include player name
 */
export function Staking({ building }: { building: Entity }) {
  const { components, network } = useMUD();
  const { Commander, StakingInfo, StakeSpecs, SelectedHost } = components;
  const role = useComponentValue(SelectedHost, SOURCE)?.value as Entity;
  const isPlayer =
    useComponentValue(Commander, role)?.value === network.playerEntity;
  const stakingId = getStaking(role as Hex, building as Hex) as Entity;
  // const stakingInfo = useComponentValue(StakingInfo, stakingId);
  const time = useRemainedToClaim(components, stakingId);
  if (!time) return null;
  const remained = time > 0 ? time : 0;
  // because time is not null, stakingInfo is not null
  const outputType = getComponentValue(StakingInfo, stakingId)!.outputType;

  return (
    <div className="flex flex-col space-y-2 border border-black m-2">
      <span className="font-bold">Staking Info:</span>
      <div className="flex flex-row space-x-2 text-sm">
        <StakeableInfo outputType={outputType as Hex} />
        {isPlayer && (
          <ClaimButton role={role} building={building} remained={remained} />
        )}
        {isPlayer && <UnstakeButton role={role} building={building} />}
      </div>
    </div>
  );
}

/**
 * claim button for role to claim outputs from building provided 1) role is adjacent to building, 2) remained time is zero, 3) there is enough capacity to store outputs
 */
export function ClaimButton({
  role,
  building,
  remained,
}: {
  role: Entity;
  building: Entity;
  remained: number;
}) {
  const { components, systemCalls } = useMUD();
  const { Path } = components;
  const { claim } = systemCalls;
  // check if adjacentCoord is null, meaning if role is adjacent to building
  useComponentValue(Path, role);
  const adjacentCoord = getRoleAndHostAdjacentCoord(components, role, building);
  // check if there is enough capacity to store outputs
  const { StoredSize, StakingInfo, StakeSpecs } = components;
  useComponentValue(StoredSize, role);
  const stakingId = getStaking(role as Hex, building as Hex) as Entity;
  const outputType = getComponentValue(StakingInfo, stakingId)!
    .outputType as Hex;
  const encodedType = encodeTypeEntity(outputType) as Entity;
  const outputs = getComponentValue(StakeSpecs, encodedType)?.outputs ?? [];
  const hasCapacity = canStoreOutputs(components, role, outputs as Hex[]);

  return (
    <button
      className="btn-blue"
      disabled={!adjacentCoord || remained > 0 || !hasCapacity}
      onClick={() => {
        if (!adjacentCoord) return;
        claim(role as Hex, adjacentCoord);
      }}
    >
      Claim {remained > 0 ? `(${remained}s)` : ""}
    </button>
  );
}

/**
 * unstake button for role to unstake inputs from building provided 1) role is adjacent to building, 2) there is enough capacity to store inputs
 */
export function UnstakeButton({
  role,
  building,
}: {
  role: Entity;
  building: Entity;
}) {
  const { components, systemCalls } = useMUD();
  const { unstake } = systemCalls;
  const { Path } = components;
  // check if adjacentCoord is null, meaning if role is adjacent to building
  useComponentValue(Path, role);
  const adjacentCoord = getRoleAndHostAdjacentCoord(components, role, building);
  // check if there is enough capacity to store inputs
  const { StoredSize, StakingInfo, StakeSpecs } = components;
  useComponentValue(StoredSize, role);
  const stakingId = getStaking(role as Hex, building as Hex) as Entity;
  const outputType = getComponentValue(StakingInfo, stakingId)!
    .outputType as Hex;
  const encodedType = encodeTypeEntity(outputType) as Entity;
  const inputs = getComponentValue(StakeSpecs, encodedType)?.inputs ?? [];
  const hasCapacity = canStoreOutputs(components, role, inputs as Hex[]);

  return (
    <button
      className="btn-blue"
      disabled={!adjacentCoord || !hasCapacity}
      onClick={() => {
        if (!adjacentCoord) return;
        unstake(role as Hex, adjacentCoord);
      }}
    >
      Unstake
    </button>
  );
}
