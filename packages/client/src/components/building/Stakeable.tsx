import { useEntityQuery, useComponentValue } from "@latticexyz/react";
import { Entity, getComponentValue, HasValue } from "@latticexyz/recs";
import { SOURCE } from "../../constants";
import { getBuildingStakeOuputTypes } from "../../logics/stake";
import { useMUD } from "../../MUDContext";
import { Hex, hexToString } from "viem";
import { getRoleAndHostAdjacentCoord } from "../../logics/building";
import { hasMintCosts } from "../../logics/cost";
import { encodeTypeEntity } from "../../utils/encode";
import { CostsDisplay } from "../Costs";
import { hexTypeToString } from "../../utils/encode";

/**
 * display all stakeable outputTypes of a staker building for role to stake
 */
export function Stakeables({ building }: { building: Entity }) {
  const { components, network } = useMUD();
  const { StakingInfo, SelectedHost, Commander } = components;
  const hasStaking =
    useEntityQuery([HasValue(StakingInfo, { building })]).length > 0;
  const role = useComponentValue(SelectedHost, SOURCE)?.value as Entity;
  const isPlayer =
    useComponentValue(Commander, role)?.value === network.playerEntity;
  // there are different levels of checks to be done;
  // for here, check if isPlayer & if hasStaking
  const canStake = isPlayer && !hasStaking;
  const outputTypes = getBuildingStakeOuputTypes(components, building);

  return (
    <div className="flex flex-col space-y-2 border border-black m-2">
      <span className="font-bold">Stakeable:</span>
      {outputTypes.map((outputType) => (
        <div key={outputType} className="flex flex-row space-x-2 text-sm">
          <StakeableInfo outputType={outputType} />
          {canStake && (
            <StakeButton
              role={role}
              building={building}
              outputType={outputType}
            />
          )}
          {/* <Staking role={role} building={building} outputType={outputType} /> */}
        </div>
      ))}
    </div>
  );
}

/**
 * child component of Stakeables, display stakeable info of a single outputType;
 * also used in Staking to display outputType
 */
export function StakeableInfo({ outputType }: { outputType: Hex }) {
  const { components } = useMUD();
  const { StakeSpecs } = components;

  const encodedType = encodeTypeEntity(outputType) as Entity;
  const stakeSpecs = getComponentValue(StakeSpecs, encodedType);
  if (!stakeSpecs) return null;
  const { timeCost, inputs, outputs } = stakeSpecs;
  return (
    <div className="flex flex-col">
      <span>output: {hexTypeToString(outputType)}</span>
      <span>timeCost: {timeCost}</span>
      <div className="flex flex-row">
        <span>inputs: </span>
        <CostsDisplay costs={inputs as Hex[]} />
      </div>
      <div className="flex flex-row">
        <span>outputs: </span>
        <CostsDisplay costs={outputs as Hex[]} />
      </div>
    </div>
  );
}

/**
 * stake button for role to stake inputs into building provided 1) role is adjacent to building, 2) role has enough inputs
 */
export function StakeButton({
  role,
  building,
  outputType,
}: {
  role: Entity;
  building: Entity;
  outputType: Hex;
}) {
  const { components, network, systemCalls } = useMUD();
  const { Path, StoredSize } = components;
  const { stake } = systemCalls;
  // check if role has enough inputs
  useComponentValue(StoredSize, role);
  const hasCosts = hasMintCosts(components, role as Hex, outputType);
  // check if adjacentCoord is null, meaning if role is adjacent to building
  useComponentValue(Path, role);
  const adjacentCoord = getRoleAndHostAdjacentCoord(components, role, building);

  return (
    <button
      className="btn-blue"
      disabled={!hasCosts || !adjacentCoord}
      onClick={() => {
        if (!hasCosts || !adjacentCoord) return;
        stake(role as Hex, outputType as Hex, adjacentCoord);
      }}
    >
      Stake
    </button>
  );
}
