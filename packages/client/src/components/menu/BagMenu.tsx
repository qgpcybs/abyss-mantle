import { useComponentValue } from "@latticexyz/react";
import { useMUD } from "../../MUDContext";
import { ERC20_TYPES, MAIN_MENU, MENU, SOURCE } from "../../constants";
import {
  getBalanceEntity,
  getERC20Balance,
  getERC721s,
} from "../../logics/container";
import { Hex, hexToString } from "viem";
import { Entity, removeComponent, setComponent } from "@latticexyz/recs";
import ItemContainer from "../ItemContainer";
import { useEffect, useState } from "react";
import useMenuKeys from "../../hooks/useMenuKeys";
import { canConsume } from "../../logics/convert";
import { getBurnAwards } from "../../logics/award";
import { splitBytes32, hexTypeToString } from "../../utils/encode";

// TODO: pretty wonky rn to display 2 menus on 1 menu, need to refactor
// also, this is erc20 stuff; erc721 will display on a different menu
export default function BagMenu() {
  const {
    components,
    systemCalls: { consumeERC20, dropERC20 },
  } = useMUD();
  const { SelectedHost, SelectedEntity, ConsoleMessage } = components;
  const sourceHost = useComponentValue(SelectedHost, SOURCE)?.value as Entity;

  const erc20sData = ERC20_TYPES.map((erc20Type) => {
    const balance = getERC20Balance(components, sourceHost as Hex, erc20Type);
    return {
      erc20Type,
      balance,
    };
  });

  const erc721s = getERC721s(components, sourceHost as Entity);
  const erc721Selections = erc721s.map((erc721) => {
    return {
      content: (
        <div className="flex flex-row justify-between">
          <span>{hexTypeToString(erc721 as Hex)}</span>
        </div>
      ),
    };
  });
  console.log("erc721s", erc721s);

  const selections = erc20sData.map(({ erc20Type, balance }) => {
    return {
      content: (
        <div className="flex flex-row justify-between">
          <span>{hexTypeToString(erc20Type)}</span>
          <span>x{Number(balance)}</span>
        </div>
      ),
      onClick: () => {
        setSelected2(selections2.findIndex((s) => !s.disabled));
      },
    };
  });
  const [selected, setSelected] = useState(0);
  const [selected2, setSelected2] = useState<number | null>(null);
  const selections2 = [
    {
      content: " $Drop 1",
      disabled: erc20sData[selected].balance === 0n,
      onClick: async () => {
        await dropERC20(sourceHost as Hex, ERC20_TYPES[selected], 1n);
        removeComponent(SelectedEntity, MENU);
        removeComponent(ConsoleMessage, SOURCE);
      },
    },
    {
      content: "$Consume",
      disabled:
        !canConsume(components, ERC20_TYPES[selected]) ||
        erc20sData[selected].balance === 0n,
      onClick: async () => {
        await consumeERC20(sourceHost as Hex, ERC20_TYPES[selected]);
        removeComponent(SelectedEntity, MENU);
        removeComponent(ConsoleMessage, SOURCE);
      },
    },
    {
      content: "Back",
      disabled: false,
      onClick: () => setSelected2(null),
    },
  ];
  console.log("selected", selected, selected2, selections2[0].disabled);

  const message = `Consume ${hexTypeToString(erc20sData[selected].erc20Type)}?...... Awards: ${getBurnAwards(
    components,
    erc20sData[selected].erc20Type
  )
    .map((awardHex) => {
      const { type, amount } = splitBytes32(awardHex);
      return `(${hexTypeToString(type)}, ${amount})`;
    })
    .join("\n")} `;

  useEffect(() => {
    if (selected2 === null) return removeComponent(ConsoleMessage, SOURCE);
    setComponent(ConsoleMessage, SOURCE, { value: message });
  }, [selected, selected2]);

  useMenuKeys({
    onUp: () => {
      if (selected2 !== null) {
        setSelected2(() => {
          let next = selected2 - 1;
          while (selections2[next]?.disabled) {
            next = next - 1;
          }
          return next < 0 ? selected2 : next;
        });
      } else {
        setSelected(() => {
          const next = selected - 1;
          return next < 0 ? 0 : next;
        });
      }
    },
    onDown: () => {
      if (selected2 !== null) {
        setSelected2(() => {
          let next = selected2 + 1;
          while (selections2[next]?.disabled) {
            next = next + 1;
          }
          return next >= selections2.length ? selected2 : next;
        });
      } else {
        setSelected(() => {
          const next = selected + 1;
          return next >= selections.length ? selections.length - 1 : next;
        });
      }
    },
    onA: () => {
      if (selected2 !== null) {
        selections2[selected2].onClick();
      } else {
        selections[selected].onClick();
      }
    },
    onB: () => {
      if (selected2 !== null) {
        setSelected2(null);
      } else {
        setComponent(SelectedEntity, MENU, { value: MAIN_MENU });
      }
    },
    selected,
    selected2,
  });

  return (
    <div className="flex flex-row text-white pointer-events-auto">
      <div className="bg-gray-500 h-32 mr-2">
        {selected2 !== null && (
          <div className="flex flex-col w-auto space-y-4 border p-1 bg-gray-500">
            {selections2.map(({ content, onClick, disabled }, index) => (
              <ItemContainer
                key={index}
                className="btn btn-success border"
                onClick={onClick}
                disabled={disabled}
                selected={selected2 === index}
              >
                {content}
              </ItemContainer>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col w-auto space-y-4 border p-1 bg-gray-500  ">
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
        {erc721Selections.map(({ content }, index) => (
          <ItemContainer key={index} className="btn btn-success border">
            {content}
          </ItemContainer>
        ))}
      </div>
    </div>
  );
}
