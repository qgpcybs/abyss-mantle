import { useState, useEffect } from "react";
import { useMUD } from "../../MUDContext";
import { SelectedSwapType, SwapsList } from "./SwapControlMenu";
import { useComponentValue } from "@latticexyz/react";
import { Entity, setComponent } from "@latticexyz/recs";
import { SOURCE } from "../../constants";
import { getEntityOnDirection } from "../../logics/move";
import { Hex, hexToString } from "viem";
import useMenuKeys from "../../hooks/useMenuKeys";
import ItemContainer from "../ItemContainer";
import { getERC20Balance } from "../../logics/container";

export default function SwapMenu() {
  const {
    components,
    systemCalls: { buildBuilding },
  } = useMUD();
  const { SelectedEntity, SelectedHost, ConsoleMessage } = components;
  const sourceHost = useComponentValue(SelectedHost, SOURCE)?.value as Entity;
  const targetHost = getEntityOnDirection(components, sourceHost) as Entity;

  const [selectedSwap, setSelectedSwap] = useState<SelectedSwapType>(null);

  return (
    <div className="flex flex-row text-white pointer-events-auto space-x-4 bg-gray-500">
      {selectedSwap !== null && (
        <Swap
          from={sourceHost}
          to={targetHost}
          selectedSwap={selectedSwap}
          setSelectedSwap={setSelectedSwap}
        />
      )}

      <SwapsList
        host={targetHost}
        selectedSwap={selectedSwap}
        setSelectedSwap={setSelectedSwap}
        disabled={selectedSwap !== null}
      />
    </div>
  );
}

function Swap({
  from,
  to,
  selectedSwap,
  setSelectedSwap,
}: {
  from: Entity;
  to: Entity;
  selectedSwap: SelectedSwapType;
  setSelectedSwap: (swap: SelectedSwapType) => void;
}) {
  const { components, systemCalls } = useMUD();
  const { ConsoleMessage } = components;
  const { fromType, toType, num, denom } = selectedSwap!;
  // amount is fromAmount
  const [amount, setAmount] = useState(0);
  const toAmount = Math.floor((amount * num) / denom);
  // TODO: use hook instead of get
  const fromBalance = Number(
    getERC20Balance(components, from as Hex, fromType)
  );
  const toBalance = Number(getERC20Balance(components, to as Hex, toType));
  const message = `Swap ${amount} ${hexToString(fromType)} (max ${fromBalance})for ${toAmount} ${hexToString(toType)} (max ${toBalance})`;
  useEffect(() => {
    setComponent(ConsoleMessage, SOURCE, { value: message });
  }, [amount, selectedSwap, from, to]);

  const [selected, setSelected] = useState(0);
  const selections = [
    {
      name: `${hexToString(fromType)} Amount: <${amount}>`,
      disabled: fromBalance === 0,
      onRight: () => {
        setAmount(() => {
          const next = amount + 1;
          const nextToAmount = Math.floor((next * num) / denom);
          return next > fromBalance || nextToAmount > toBalance ? amount : next;
        });
      },
      onLeft: () => {
        setAmount(Math.max(0, amount - 1));
      },
    },
    {
      name: "$Swap",
      disabled: amount === 0 || fromBalance === 0,
      onClick: async () => {
        if (amount === 0 || fromBalance === 0) return;
        await systemCalls.swapERC20(
          fromType,
          toType,
          from as Hex,
          to as Hex,
          BigInt(amount)
        );
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
    selected2: { selectedSwap, amount },
  });

  return (
    <div className="flex flex-col w-56 space-y-2 border p-1">
      <span>
        Swap {hexToString(fromType)} for {hexToString(toType)}
      </span>
      {selections.map((selection, index) => (
        <ItemContainer
          key={index}
          className="btn btn-success border"
          disabled={selection.disabled}
          selected={selected === index}
          onClick={selection.onClick}
        >
          {selection.name}
        </ItemContainer>
      ))}
    </div>
  );
}
