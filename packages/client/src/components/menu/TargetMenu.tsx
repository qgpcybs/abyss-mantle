import { useComponentValue } from "@latticexyz/react";
import { useMUD } from "../../MUDContext";
import {
  EXPLORE_MENU,
  TRANSFER_MENU,
  SWAP_MENU,
  MENU,
  SOURCE,
} from "../../constants";
import { Entity, removeComponent, setComponent } from "@latticexyz/recs";
import { getEntityOnDirection } from "../../logics/move";
import { isController, isCreator } from "../../logics/access";
import { getEntitySpecs } from "../../logics/entity";
import { useState } from "react";
import useMenuKeys from "../../hooks/useMenuKeys";
import ItemContainer from "../ItemContainer";

// to transfer, to withdraw, to burn
export default function TargetMenu() {
  const {
    components,
    network: { playerEntity },
  } = useMUD();
  const { SelectedHost, SelectedEntity, ConsoleMessage, ContainerSpecs } =
    components;

  const selectedRole = useComponentValue(SelectedHost, SOURCE)?.value as Entity;
  const targetRole =
    getEntityOnDirection(components, selectedRole) ?? ("" as Entity);

  // const controller = isController(components, playerEntity, targetRole);
  // const hasCapacity =
  //   getEntitySpecs(components, ContainerSpecs, targetRole)?.capacity ?? 0n > 0n;
  // const canTransfer = hasCapacity; // && controller;

  const selections = [
    {
      name: "Transfer",
      disabled: false,
      onClick: () => {
        setComponent(SelectedEntity, MENU, { value: TRANSFER_MENU });
      },
    },
    {
      name: "Swap",
      disabled: false,
      onClick: () => {
        setComponent(SelectedEntity, MENU, { value: SWAP_MENU });
      },
    },
    {
      name: "Burn",
      disabled: false,
      onClick: () => {
        console.log("burn");
      },
    },
  ];

  const [selected, setSelected] = useState(
    selections.findIndex((s) => !s.disabled)
  );

  useMenuKeys({
    onUp: () => {
      setSelected((selected) => {
        let next = selected - 1;
        while (selections[next]?.disabled) {
          next = next - 1;
        }
        return next < 0 ? selected : next;
      });
    },
    onDown: () => {
      setSelected((selected) => {
        let next = selected + 1;
        while (selections[next]?.disabled) {
          next = next + 1;
        }
        return next >= selections.length ? selected : next;
      });
    },
    onA: () => selections[selected].onClick(),
    onB: () => setComponent(SelectedEntity, MENU, { value: EXPLORE_MENU }),
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
