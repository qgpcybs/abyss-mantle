import { useComponentValue } from "@latticexyz/react";
import { useMUD } from "../../MUDContext";
import {
  MAIN_MENU,
  MENU,
  POOL_COLORS_STRING,
  POOL_TYPES,
  ROLE_MENU,
  SOURCE,
} from "../../constants";
import {
  Entity,
  getComponentValue,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import ItemContainer from "../ItemContainer";
import { useState } from "react";
import useMenuKeys from "../../hooks/useMenuKeys";
import { Hex, hexToString } from "viem";
import { getPool } from "../../contract/hashes";
import { getEntitySpecs } from "../../logics/entity";
import {
  getPoolCapacity,
  getPoolAmount,
  getEntityPoolsInfo,
} from "../../logics/pool";
import HealthBar from "../HealthBar";
import EntityName from "../EntityName";
import { hexTypeToString } from "../../utils/encode";

export type SelectionType = {
  content: JSX.Element;
  onClick: () => void;
  disabled?: boolean;
};

export default function RoleMenu() {
  const { components } = useMUD();
  const {
    SelectedHost,
    SelectedEntity,
    ConsoleMessage,
    ContainerSpecs,
    StoredSize,
  } = components;

  const role = useComponentValue(SelectedHost, SOURCE)?.value as Entity;
  // TODO: targetHost?
  const poolsInfo = getEntityPoolsInfo(components, role) ?? [];
  const capacity =
    getEntitySpecs(components, ContainerSpecs, role)?.capacity ?? 0n;
  const storedSize = getComponentValue(StoredSize, role)?.value ?? 0n;

  const selections: SelectionType[] = [];
  const poolsSelections = poolsInfo.map(({ type, capacity, balance }) => {
    return {
      content: (
        <HealthBar
          value={Number(balance)}
          fillColor={POOL_COLORS_STRING[type] ?? "white"}
          maxValue={Number(capacity)}
          text={hexTypeToString(type)}
        />
      ),
      onClick: () => {},
    };
  });
  const bagSelection = {
    content: (
      <HealthBar
        value={Number(storedSize)}
        fillColor="white"
        maxValue={Number(capacity)}
        text="BAG CAPACITY"
      />
    ),
    onClick: () => {},
  };
  const roleInfoSelection = {
    content: (
      <div className="flex flex-row justify-between">
        <span>ROLE NAME: </span>
        <EntityName entity={role} />
      </div>
    ),
    onClick: () => {},
  };
  selections.push(roleInfoSelection);
  selections.push(bagSelection);
  selections.push(...poolsSelections);

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
    onB: () => setComponent(SelectedEntity, MENU, { value: MAIN_MENU }),
    selected,
  });

  return (
    <div className="flex flex-col w-auto space-y-4 border p-1 bg-gray-500 text-white pointer-events-auto">
      {selections.map(({ content, onClick, disabled }, index) => (
        <ItemContainer
          key={index}
          className="btn btn-success border"
          onClick={onClick}
          disabled={disabled}
          selected={selected === index}
        >
          {content}
        </ItemContainer>
      ))}
    </div>
  );
}
