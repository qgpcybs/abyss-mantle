import { removeComponent, setComponent } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { Hex, hexToString } from "viem";
import {
  MENU,
  SOURCE,
  TerrainType,
  terrainTypeMapping,
  TERRAIN_MENU,
  BUILDING_TYPES,
} from "../../constants";
import { useEffect, useState } from "react";
import useMenuKeys from "../../hooks/useMenuKeys";
import ItemContainer from "../ItemContainer";
import { getSelectedTerrainData } from "../../logics/terrain";
import { hasPendingMoves } from "../../logics/move";
import { getCraftData } from "../../logics/convert";

export default function TerrainBuildMenu() {
  const {
    components,
    systemCalls: { buildBuilding },
  } = useMUD();
  const { SelectedEntity, ConsoleMessage } = components;

  const terrainData = getSelectedTerrainData(components);
  const { terrainTypeData, toPosition, terrainValue, host } = terrainData;
  const { interactData, buildableTypes } = terrainTypeData;
  // const { costs, hasCosts, awards, actualAwards } = interactData;
  const terrainType = terrainTypeMapping[terrainValue as TerrainType];

  const hasMoves = hasPendingMoves(components, host);

  const buildableData = buildableTypes.map((buildingType) => {
    const craftData = getCraftData(components, host as Hex, buildingType);
    return {
      buildingType,
      craftData,
    };
  });
  const selections = buildableData.map(({ buildingType, craftData }) => {
    const { costs, hasCosts, awards, actualAwards } = craftData;
    return {
      content: <span>$Build {hexToString(buildingType)}</span>,
      disabled: !hasCosts,
      onClick: async () => {
        if (!toPosition || !hasCosts) return;
        await buildBuilding(host as Hex, buildingType, toPosition);
        removeComponent(SelectedEntity, MENU);
      },
      message: `Build ${hexToString(buildingType)} on ${hexToString(terrainType)}.......${hasMoves ? "$Move First" : ""}....... Cost: ${costs.map((cost) => `(${hexToString(cost.type)}, ${cost.amount})`).join("\n")}........ `,
    };
  });

  const [selected, setSelected] = useState(0);

  useMenuKeys({
    onUp: () => {
      setSelected((selected) => {
        const next = selected - 1;
        return next < 0 ? selected : next;
      });
    },
    onDown: () => {
      setSelected((selected) => {
        const next = selected + 1;
        return next >= selections.length ? selected : next;
      });
    },
    onA: () => selections[selected].onClick(),
    onB: () => setComponent(SelectedEntity, MENU, { value: TERRAIN_MENU }),
    selected,
  });

  useEffect(() => {
    setComponent(ConsoleMessage, SOURCE, {
      value: selections[selected]?.message,
    });
  }, [selected]);

  return (
    <div className="flex flex-col w-32 space-y-4 border p-1 bg-grey-500 text-white pointer-events-auto">
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
