import { Entity, getComponentValue } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { SOURCE } from "../../constants";
import { useComponentValue } from "@latticexyz/react";
import { getBuildingStakeOuputTypes } from "../../logics/stake";
import { Staking } from "./Staking";
import { Stakeables } from "./Stakeable";

export function StakeBuilding({ building }: { building: Entity }) {
  return (
    <div>
      <Stakeables building={building} />
      <Staking building={building} />
    </div>
  );
}
