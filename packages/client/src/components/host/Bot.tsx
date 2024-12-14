import {
  Entity,
  getComponentValue,
  HasValue,
  setComponent,
} from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { SOURCE } from "../../constants";

export function Bot({ bot }: { bot: Entity }) {
  const {
    components,
    network: { playerEntity },
  } = useMUD();
  const { BotState, Commander, SelectedHost, HostName } = components;

  // mock client is the first entity
  // const mockClient = useEntityQuery([
  //   HasValue(Commander, { value: playerEntity }),
  // ])[0];
  const sourceHost = useComponentValue(SelectedHost, SOURCE)?.value;
  const hostName = getComponentValue(HostName, sourceHost as Entity)
    ?.name as string;
  // check if entity is a bot

  const chooseStrategy = (strategy: string) => {
    setComponent(BotState, bot, {
      strategies: [strategy],
      target: sourceHost,
      targetX: undefined,
      targetY: undefined,
    });
  };

  return (
    <div className="">
      <button
        className="btn-blue mt-2"
        onClick={() => chooseStrategy("exploration")}>
        Follow {hostName}
      </button>
    </div>
  );
}
