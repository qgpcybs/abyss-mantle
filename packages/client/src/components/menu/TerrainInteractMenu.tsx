import { removeComponent, setComponent } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { Hex, hexToString } from "viem";
import {
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
import { hasPendingMoves } from "../../logics/move";

export default function TerrainInteractMenu() {
  const {
    components,
    systemCalls: { interactTerrain },
  } = useMUD();
  const { SelectedEntity, ConsoleMessage } = components;

  const terrainData = getSelectedTerrainData(components);
  const { terrainTypeData, toPosition, terrainValue, host } = terrainData;
  const { interactData } = terrainTypeData;
  const { costs, hasCosts, awards, actualAwards } = interactData;
  const terrainType = terrainTypeMapping[terrainValue as TerrainType];

  const hasMoves = hasPendingMoves(components, host);

  const canTerrainInteract = interactData.costs.length > 0;
  const canHostInteract = canTerrainInteract && hasCosts && !hasMoves;

  const message = `Interact ${TerrainType[terrainValue]}.......${hasMoves ? "$Move First" : ""}....... Cost: ${costs.map((cost) => `(${hexToString(cost.type)}, ${cost.amount})`).join("\n")}........ Award: ${awards.map((award) => `(${hexToString(award.type)}, ${award.amount})`).join("\n")}........ Actual Award: ${actualAwards.actualAwards.map((award) => `(${hexToString(award.type)}, ${award.amount})`).join("\n")}........`;

  useEffect(() => {
    setComponent(ConsoleMessage, SOURCE, { value: message });
  }, []);

  const selections = [
    {
      name: "$Interact",
      disabled: !canHostInteract || !toPosition,
      onClick: async () => {
        if (!canHostInteract || !toPosition) return;
        await interactTerrain(host as Hex, toPosition);
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
