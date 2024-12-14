import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import {
  Entity,
  HasValue,
  getComponentValue,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { Hex } from "viem";
import {
  BAG_MENU,
  MENU,
  ROLE_MENU,
  SOURCE,
  SWAP_CONTROL_MENU,
} from "../../constants";
import { useCallback, useState } from "react";
import useMenuKeys from "../../hooks/useMenuKeys";
import ItemContainer from "../ItemContainer";

export default function MainMenu({ player }: { player: Entity }) {
  const {
    components,
    systemCalls: { move, spawnHero },
    network: { playerEntity },
  } = useMUD();
  const { Commander, Moves, SelectedHost, SelectedEntity } = components;
  const isPlayer = player === playerEntity;

  const hosts = useEntityQuery([
    HasValue(components.Commander, { value: player }),
  ]);
  const host = useComponentValue(SelectedHost, SOURCE)?.value as Hex;
  const hasSpawned =
    useEntityQuery([HasValue(Commander, { value: playerEntity })]).length > 0;

  const selections = [
    {
      name: "Role",
      disabled: false,
      onClick: () => {
        setComponent(SelectedEntity, MENU, { value: ROLE_MENU });
      },
    },
    {
      name: "Bag",
      onClick: () => {
        setComponent(SelectedEntity, MENU, { value: BAG_MENU });
      },
    },
    {
      name: "Swaps",
      onClick: () => {
        setComponent(SelectedEntity, MENU, { value: SWAP_CONTROL_MENU });
      },
    },
    {
      name: "Player",
      onClick: () => {
        console.log("player");
      },
    },
    {
      name: "Map",
      disabled: false,
      onClick: () => {
        console.log("map");
      },
    },
    {
      name: "Setting",
      onClick: () => {
        console.log("setting");
      },
    },
    {
      name: "Spawn Hero",
      disabled: hasSpawned,
      onClick: async () => {
        // if (hasSpawned) return;
        await spawnHero();
        removeComponent(SelectedEntity, MENU);
      },
    },
    {
      name: "Back",
      onClick: () => {
        setTimeout(() => {
          removeComponent(SelectedEntity, MENU);
        }, 100);
      },
    },
  ];

  const [selected, setSelected] = useState(0);

  useMenuKeys({
    onUp: () => {
      setSelected((selected) => {
        const next = selected - 1;
        return next < 0 ? 0 : next;
      });
    },
    onDown: () => {
      setSelected((selected) => {
        const next = selected + 1;
        return next >= selections.length ? selections.length - 1 : next;
      });
    },
    onA: () => selections[selected].onClick(),
    onB: () => {
      setTimeout(() => {
        removeComponent(SelectedEntity, MENU);
      }, 100);
    },
    selected,
  });

  return (
    <div className="flex flex-col w-32 space-y-4 border p-1 bg-grey-500 text-white pointer-events-auto">
      {selections.map(({ name, onClick, disabled }, index) => (
        <ItemContainer
          key={index}
          className="btn btn-success border"
          onClick={onClick}
          disabled={disabled}
          selected={selected === index}
        >
          {name}
        </ItemContainer>
      ))}
    </div>
  );
}

export function HostsMenu({ hosts }: { hosts: Entity[] }) {
  return <></>;
}
