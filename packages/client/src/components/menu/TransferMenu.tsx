import { useComponentValue } from "@latticexyz/react";
import { useMUD } from "../../MUDContext";
import { EXPLORE_MENU, MENU, SOURCE } from "../../constants";
import { Entity, removeComponent, setComponent } from "@latticexyz/recs";
import {
  getBuildingOnDirection,
  getEntityOnDirection,
} from "../../logics/move";
import { isController, isCreator } from "../../logics/access";
import { getEntitySpecs } from "../../logics/entity";
import { useEffect, useState } from "react";
import useMenuKeys from "../../hooks/useMenuKeys";
import ItemContainer from "../ItemContainer";
import {
  getERC20Balance,
  getERC20Balances,
  getRemainedERC20Amount,
} from "../../logics/container";
import { Hex, hexToString } from "viem";
import { fromEntity } from "../../utils/encode";
import HealthBar from "../HealthBar";
import EntityName from "../EntityName";

export default function TransferMenu() {
  const {
    components,
    network: { playerEntity },
  } = useMUD();
  const { SelectedHost, StoredSize, ConsoleMessage, ContainerSpecs } =
    components;

  const selectedRole = useComponentValue(SelectedHost, SOURCE)?.value as Entity;
  const host = getEntityOnDirection(components, selectedRole) ?? ("" as Entity);
  const roleCapacity =
    getEntitySpecs(components, ContainerSpecs, selectedRole)?.capacity ?? 0n;
  const hostCapacity =
    getEntitySpecs(components, ContainerSpecs, host)?.capacity ?? 0n;

  const created = isCreator(components, playerEntity, host);
  const canTransferTo = hostCapacity > 0n && created;
  const canTransferFrom = roleCapacity > 0n;

  const [to, setTo] = useState(host as Hex);
  const [from, setFrom] = useState(selectedRole as Hex);
  const [tokenType, setTokenType] = useState("" as Hex);
  // 0: to, 1: from; 2: amount
  const [selectedMenu, setSelectedMenu] = useState(0);

  if (roleCapacity === 0n || hostCapacity === 0n)
    return (
      <div className="border text-white text-lg p-2 pointer-events-auto bg-gray-500">
        CANNOT TRANSFER
      </div>
    );

  return (
    <div className="flex flex-row text-white pointer-events-auto space-x-4">
      <TransferFrom
        host={host}
        setFromAndTo={() => {
          setFrom(host as Hex);
          setTo(selectedRole as Hex);
        }}
        setTokenType={setTokenType}
        selectedMenu={selectedMenu}
        setSelectedMenu={setSelectedMenu}
        disabled={selectedMenu !== 1}
      />
      {tokenType !== ("" as Hex) && (
        <Transfer
          erc20Type={tokenType}
          from={from}
          to={to}
          selectedMenu={selectedMenu}
          setSelectedMenu={setSelectedMenu}
          disabled={selectedMenu !== 2}
        />
      )}
      <TransferFrom
        host={selectedRole}
        setFromAndTo={() => {
          setFrom(selectedRole as Hex);
          setTo(host as Hex);
        }}
        setTokenType={setTokenType}
        selectedMenu={selectedMenu}
        setSelectedMenu={setSelectedMenu}
        disabled={selectedMenu !== 0}
      />
    </div>
  );
}

export function TransferFrom({
  host,
  setFromAndTo,
  setTokenType,
  selectedMenu,
  setSelectedMenu,
  disabled,
}: {
  host: Entity;
  setFromAndTo: () => void;
  setTokenType: (tokenType: Hex) => void;
  selectedMenu: number;
  setSelectedMenu: (menu: number) => void;
  disabled: boolean;
}) {
  const {
    components,
    network: { playerEntity },
  } = useMUD();
  const { SelectedEntity, ContainerSpecs, StoredSize } = components;
  const capacity =
    getEntitySpecs(components, ContainerSpecs, host)?.capacity ?? 0n;
  const storedSize = useComponentValue(StoredSize, host)?.value ?? 0n;
  const controlled = isController(components, playerEntity, host);
  const canTransferTo = capacity > storedSize;
  const canTransferFrom = capacity > 0n && controlled;

  const erc20sData = getERC20Balances(components, host as Hex);
  const [selected, setSelected] = useState(0);
  useMenuKeys({
    onUp: () =>
      setSelected((selected) => {
        const next = selected - 1;
        return next < 0 ? 0 : next;
      }),
    onDown: () =>
      setSelected((selected) => {
        const next = selected + 1;
        return next >= erc20sData.length ? erc20sData.length - 1 : next;
      }),
    onLeft: () => {
      if (selectedMenu === 0) setSelectedMenu(1);
    },
    onRight: () => {
      if (selectedMenu === 1) setSelectedMenu(0);
    },
    onA: () => {
      if (!canTransferFrom) return;
      setFromAndTo();
      setTokenType(erc20sData[selected].erc20Type);
      setSelectedMenu(2);
    },
    onB: () => setComponent(SelectedEntity, MENU, { value: EXPLORE_MENU }),
    disabled,
    selected,
    selected2: selectedMenu,
  });
  return (
    <div
      className={`flex flex-col w-48 space-y-4 border p-1 bg-gray-500 ${disabled ? "" : "border-4 rounded"}`}
    >
      <EntityName entity={host} />
      <HealthBar
        value={Number(storedSize)}
        maxValue={Number(capacity)}
        fillColor="white"
        text={hexToString(fromEntity(host as Hex).type)}
      />
      {erc20sData.map(({ erc20Type, balance }, index) => (
        <ItemContainer
          key={index}
          disabled={!canTransferFrom}
          className="btn btn-success border"
          selected={selected === index}
        >
          {`${hexToString(erc20Type)} x${Number(balance)}`}
        </ItemContainer>
      ))}
    </div>
  );
}

export function Transfer({
  erc20Type,
  from,
  to,
  selectedMenu,
  setSelectedMenu,
  disabled,
}: {
  erc20Type: Hex;
  from: Hex;
  to: Hex;
  selectedMenu: number;
  setSelectedMenu: (menu: number) => void;
  disabled: boolean;
}) {
  const { components, systemCalls } = useMUD();
  const { ConsoleMessage } = components;
  const balance = Number(getERC20Balance(components, from, erc20Type));
  const canStoreAmount = Number(
    getRemainedERC20Amount(components, to, erc20Type)
  );

  const [amount, setAmount] = useState(0);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    setComponent(ConsoleMessage, SOURCE, {
      value: `Transfer ${hexToString(erc20Type)} x ${amount} (max ${balance}) from ${hexToString(fromEntity(from).type)} to ${hexToString(fromEntity(to).type)} (max ${canStoreAmount}) `,
    });
  }, [erc20Type, amount, from, to, selectedMenu]);

  const selections = [
    {
      content: <span>&lt;Amount: {amount} &gt;</span>,
      onClick: () => {},
    },
    {
      content: <span>$Transfer</span>,
      onClick: async () => {
        await systemCalls.transferERC20(from, to, erc20Type, BigInt(amount));
        setAmount(0);
        setSelected(0);
        setSelectedMenu(0);
      },
    },
    {
      content: <span>Back</span>,
      onClick: () => {
        setAmount(0);
        setSelected(0);
        setSelectedMenu(0);
      },
    },
  ];
  useMenuKeys({
    onLeft: () => {
      if (selected === 0)
        return setAmount(() => {
          const next = amount - 1;
          return next < 0 ? 0 : next;
        });
    },
    onRight: () => {
      if (selected === 0) {
        return setAmount(() => {
          const next = amount + 1;
          return next > balance || next > canStoreAmount ? balance : next;
        });
      }
    },
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
      setAmount(0);
      setSelected(0);
      setSelectedMenu(0);
    },
    disabled,
    selected,
    selected2: { amount, selectedMenu, from, to, erc20Type },
  });
  return (
    <div
      className={`flex flex-col w-auto space-y-4 border p-1 bg-gray-500 ${disabled ? "" : "border-4 rounded"}`}
    >
      {selections.map(({ content, onClick }, index) => (
        <ItemContainer
          key={index}
          className="btn btn-success border"
          onClick={onClick}
          selected={selected === index}
        >
          {content}
        </ItemContainer>
      ))}
    </div>
  );
}
