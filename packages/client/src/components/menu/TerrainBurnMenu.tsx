import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import {
  Entity,
  HasValue,
  getComponentValue,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { Hex, hexToString } from "viem";
import {
  TERRAIN_BURN_MENU,
  MENU,
  SOURCE,
  TerrainType,
  terrainTypeMapping,
  TERRAIN_MENU,
} from "../../constants";
import { useEffect, useState } from "react";
import useMenuKeys from "../../hooks/useMenuKeys";
import ItemContainer from "../ItemContainer";
import { getSelectedTerrainData } from "../../logics/terrain";
import { getBurnData } from "../../logics/convert";
import { hasPendingMoves } from "../../logics/move";

export default function TerrainBurnMenu() {
  const {
    components,
    systemCalls: { burnTerrain },
  } = useMUD();
  const { SelectedHost, SelectedEntity, ConsoleMessage } = components;

  const terrainData = getSelectedTerrainData(components);
  const { terrainTypeData, toPosition, terrainValue, host } = terrainData;
  const { canBurn, burnData } = terrainTypeData;
  const { costs, awards } = burnData;
  console.log("costs", costs);
  const terrainType = terrainTypeMapping[terrainValue as TerrainType];

  const hasMoves = hasPendingMoves(components, host);

  const canHostBurn = canBurn && burnData.hasCosts && !hasMoves;

  const message = `Burn ${TerrainType[terrainValue]}.......${hasMoves ? "$Move First" : ""}....... Cost: ${costs.map((cost) => `(${hexToString(cost.type)}, ${cost.amount})`).join("\n")}........ Award: ${awards.map((award) => `(${hexToString(award.type)}, ${award.amount})`).join("\n")}`;

  useEffect(() => {
    setComponent(ConsoleMessage, SOURCE, { value: message });
  }, []);

  const selections = [
    {
      name: "$Burn",
      disabled: !canHostBurn || !toPosition,
      onClick: async () => {
        if (!canHostBurn || !toPosition) return;
        await burnTerrain(host as Hex, toPosition);
        removeComponent(SelectedEntity, MENU);
        removeComponent(ConsoleMessage, SOURCE);
      },
    },
    {
      name: "Cancel",
      onClick: () => {
        setComponent(SelectedEntity, MENU, { value: TERRAIN_MENU });
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
    onB: () => setComponent(SelectedEntity, MENU, { value: TERRAIN_MENU }),
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
