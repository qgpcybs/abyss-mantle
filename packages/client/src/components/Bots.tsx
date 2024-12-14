import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { SOURCE } from "../constants";
import { useMUD } from "../MUDContext";
import {
  Entity,
  getComponentValue,
  HasValue,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";

export function Bots() {
  const {
    components,
    network: { playerEntity },
  } = useMUD();
  const { BotState, Commander, SelectedHost, HostName } = components;

  const sourceHost = useComponentValue(SelectedHost, SOURCE)?.value;
  const hosts = useEntityQuery([HasValue(Commander, { value: playerEntity })]);
  console.log("hosts", hosts, sourceHost);
  const bots = hosts.filter((host) => host !== sourceHost);
  const sourceName = getComponentValue(HostName, sourceHost as Entity)
    ?.name as string;
  const botsName = bots.map(
    (bot) => getComponentValue(HostName, bot as Entity)?.name as string
  );

  return (
    <div className="hidden flex-col space-y-2 w-96 bg-white ">
      {/* <h2>{sourceName}</h2> */}
      <h1>Bots</h1>
      {bots.map((bot) => (
        <Bot key={bot} bot={bot} />
      ))}
    </div>
  );
}

export function Bot({ bot }: { bot: Entity }) {
  const {
    components,
    network: { playerEntity },
  } = useMUD();
  const { BotState, Commander, SelectedHost, HostName } = components;

  const sourceHost = useComponentValue(SelectedHost, SOURCE)?.value;
  const sourceName = getComponentValue(HostName, sourceHost as Entity)
    ?.name as string;
  const botName = getComponentValue(HostName, bot as Entity)?.name as string;
  const strategyState = useComponentValue(BotState, bot);
  const strategies = strategyState?.strategies ?? [];
  const violence = strategyState?.violence ?? false;

  const chooseStrategy = (strategy: string) => {
    setComponent(BotState, bot, {
      strategies: [strategy],
      target: sourceHost,
      targetX: undefined,
      targetY: undefined,
      violence: !violence,
    });
  };

  const removeStrategy = () => {
    removeComponent(BotState, bot);
  };

  return (
    <div className="flex flex-row">
      <h2>{botName}</h2>
      <div className="flex flex-col">
        <ul>
          {strategies.map((strategy) => (
            <li key={strategy}>{strategy}</li>
          ))}
        </ul>
      </div>
      <button
        className="btn-blue"
        onClick={() => chooseStrategy("exploration")}>
        set following {sourceName}
      </button>
      <button className="btn-blue" onClick={() => chooseStrategy("plunder")}>
        plunder
      </button>
      <button className="btn-blue" onClick={() => removeStrategy()}>
        remove
      </button>
    </div>
  );
}
