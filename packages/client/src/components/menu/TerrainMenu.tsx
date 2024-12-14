import { setComponent } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { Hex } from "viem";
import {
  TERRAIN_BURN_MENU,
  MENU,
  SOURCE,
  TerrainType,
  terrainTypeMapping,
  EXPLORE_MENU,
  TERRAIN_INTERACT_MENU,
  TERRAIN_BUILD_MENU,
} from "../../constants";
import { useEffect, useState } from "react";
import useMenuKeys from "../../hooks/useMenuKeys";
import ItemContainer from "../ItemContainer";
import { getSelectedTerrainData } from "../../logics/terrain";

export default function TerrainMenu() {
  const { components } = useMUD();
  const { SelectedHost, SelectedEntity, ConsoleMessage } = components;

  const terrainData = getSelectedTerrainData(components)!;
  const { terrainTypeData, toPosition, terrainValue } = terrainData;
  const { interactData, canBurn, burnData, buildableTypes, canMoveOn } =
    terrainTypeData;
  const terrainType = terrainTypeMapping[terrainValue as TerrainType];

  const canInteract = interactData.costs.length > 0;
  const canBuild = buildableTypes.length > 0;

  const message = `${TerrainType[terrainValue]}......${canInteract ? "Can Interact" : "NO interact"}...... ${canBurn ? "Can burn" : "NO burn"}...... ${canBuild ? `Can build (${buildableTypes.length})` : "NO build"}...... `;

  useEffect(() => {
    setComponent(ConsoleMessage, SOURCE, { value: message });
  }, []);

  const selections = [
    {
      name: "Interact",
      disabled: !canInteract,
      onClick: () => {
        console.log("interact");
        setComponent(SelectedEntity, MENU, { value: TERRAIN_INTERACT_MENU });
      },
    },
    {
      name: "Burn",
      disabled: !canBurn,
      onClick: async () => {
        if (!canBurn) return;
        setComponent(SelectedEntity, MENU, { value: TERRAIN_BURN_MENU });
      },
    },
    {
      name: "Build",
      disabled: !canBuild,
      onClick: () => {
        setComponent(SelectedEntity, MENU, { value: TERRAIN_BUILD_MENU });
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
