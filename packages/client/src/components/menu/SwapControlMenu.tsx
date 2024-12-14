import { useComponentValue } from "@latticexyz/react";
import {
  ERC20_TYPES,
  MAIN_MENU,
  MENU,
  SOURCE,
  SWAP_CONTROL_MENU,
} from "../../constants";
import { Entity, setComponent } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { getHostSwaps } from "../../logics/swap";
import { Hex, hexToString } from "viem";
import { getERC20Balance } from "../../logics/container";
import { useEffect, useState } from "react";
import EntityName from "../EntityName";
import ItemContainer from "../ItemContainer";
import useMenuKeys from "../../hooks/useMenuKeys";
import { hexTypeToString } from "../../utils/encode";

export type SelectedSwapType = {
  fromType: Hex;
  toType: Hex;
  host: Hex;
  num: number;
  denom: number;
} | null;

export default function SwapControlMenu() {
  const { components } = useMUD();
  const { SelectedHost } = components;
  const host = useComponentValue(SelectedHost, SOURCE)?.value as Entity;

  const [selectedSwap, setSelectedSwap] = useState<SelectedSwapType>(null);
  return (
    <div className="flex flex-row text-white pointer-events-auto space-x-4 bg-gray-500">
      {selectedSwap !== null && (
        <SwapEdit
          host={host}
          selectedSwap={selectedSwap}
          setSelectedSwap={setSelectedSwap}
        />
      )}

      <SwapsList
        host={host}
        selectedSwap={selectedSwap}
        setSelectedSwap={setSelectedSwap}
        disabled={selectedSwap !== null}
      />
    </div>
  );
}

export function SwapsList({
  host,
  selectedSwap,
  setSelectedSwap,
  disabled,
}: {
  host: Entity;
  selectedSwap: SelectedSwapType;
  setSelectedSwap: (swap: SelectedSwapType) => void;
  disabled: boolean;
}) {
  const { components } = useMUD();
  const { SelectedEntity } = components;
  const swaps = getHostSwaps(components, host as Hex).map((swap) => ({
    fromType: swap.fromType,
    toType: swap.toType,
    host: swap.host,
    num: swap.swapRatio!.num,
    denom: swap.swapRatio!.denom,
  }));
  const availableToAmounts = swaps.map((swap) =>
    getERC20Balance(components, swap.host, swap.toType)
  );
  const [selected, setSelected] = useState(0);
  const selections = swaps.map((swap, index) => ({
    name: `${hexTypeToString(swap.fromType)} (${swap.denom}) -> ${hexTypeToString(swap.toType)} (${swap.num}) with ${availableToAmounts[index]} ${hexTypeToString(swap.toType)} available`,
    disabled: false,
    onClick: () => {
      setSelectedSwap(swap);
    },
  }));
  selections.push({
    name: "Create New Swap",
    disabled: false,
    onClick: () => {
      setSelectedSwap({
        fromType: ERC20_TYPES[0],
        toType: ERC20_TYPES[0],
        host: host as Hex,
        num: 1,
        denom: 1,
      });
    },
  });
  useMenuKeys({
    onUp: () => {
      setSelected(
        (selected) => (selected - 1 + selections.length) % selections.length
      );
    },
    onDown: () => {
      setSelected((selected) => (selected + 1) % selections.length);
    },
    onA: () => selections[selected].onClick(),
    onB: () => setComponent(SelectedEntity, MENU, { value: MAIN_MENU }),
    selected,
    disabled,
    selected2: selectedSwap,
  });

  return (
    <div
      className={`flex flex-col w-80 space-y-2 border p-1  ${disabled ? "" : "border-4 rounded"}`}
    >
      <EntityName entity={host} />
      {selections.map((selection, index) => (
        <ItemContainer
          key={index}
          className="btn btn-success border"
          selected={selected === index}
          onClick={selection.onClick}
        >
          {selection.name}
        </ItemContainer>
      ))}
    </div>
  );
}

export function SwapEdit({
  host,
  selectedSwap,
  setSelectedSwap,
}: {
  host: Entity;
  selectedSwap: SelectedSwapType;
  setSelectedSwap: (swap: SelectedSwapType) => void;
}) {
  const { components, systemCalls } = useMUD();
  const { SelectedEntity, ConsoleMessage } = components;
  const erc20Types = ERC20_TYPES;
  const [fromType, setFromType] = useState(selectedSwap!.fromType);
  const [toType, setToType] = useState(selectedSwap!.toType);
  const [num, setNum] = useState(selectedSwap!.num);
  const [denom, setDenom] = useState(selectedSwap!.denom);

  const message = `Set a swap: ${hexTypeToString(fromType)} (${denom}) -> ${hexTypeToString(toType)} (${num})`;
  useEffect(() => {
    setComponent(ConsoleMessage, SOURCE, { value: message });
  }, [message]);

  const [selected, setSelected] = useState(0);
  const selections = [
    {
      name: `from: <${hexTypeToString(fromType)}>`,
      onRight: () =>
        setFromType(() => {
          const index = erc20Types.indexOf(fromType);
          return erc20Types[(index + 1) % erc20Types.length];
        }),
      onLeft: () =>
        setFromType(() => {
          const index = erc20Types.indexOf(fromType);
          return erc20Types[
            (index - 1 + erc20Types.length) % erc20Types.length
          ];
        }),
    },
    {
      name: `${hexTypeToString(fromType)} amount: <${denom}>`,
      onRight: () => setDenom(denom + 1),
      onLeft: () =>
        setDenom(() => {
          if (denom === 0) return denom;
          return denom - 1;
        }),
    },
    {
      name: `to: <${hexTypeToString(toType)}>`,
      onRight: () =>
        setToType(() => {
          const index = erc20Types.indexOf(toType);
          return erc20Types[(index + 1) % erc20Types.length];
        }),
      onLeft: () =>
        setToType(() => {
          const index = erc20Types.indexOf(toType);
          return erc20Types[
            (index - 1 + erc20Types.length) % erc20Types.length
          ];
        }),
    },
    {
      name: `${hexTypeToString(toType)} amount:  <${num}>`,
      onRight: () => setNum(num + 1),
      onLeft: () => setNum(num - 1),
    },
    {
      name: "$Submit",
      onClick: async () => {
        await systemCalls.setSwapRatio(
          fromType,
          toType,
          host as Hex,
          num,
          denom
        );
        // console.log("$submit", denom, num, fromType, toType);
        setSelectedSwap(null);
      },
    },
  ];
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
    onRight: () => {
      selections[selected].onRight?.();
    },
    onLeft: () => {
      selections[selected].onLeft?.();
    },
    onA: () => {
      selections[selected].onClick?.();
    },
    onB: () => setSelectedSwap(null),
    selected,
    selected2: { fromType, toType, num, denom },
  });
  return (
    <div className="flex flex-col w-56 space-y-2 border p-1">
      {selections.map((selection, index) => (
        <ItemContainer
          key={index}
          className="btn btn-success border"
          selected={selected === index}
          onClick={selection.onClick}
        >
          {selection.name}
        </ItemContainer>
      ))}
    </div>
  );
}
