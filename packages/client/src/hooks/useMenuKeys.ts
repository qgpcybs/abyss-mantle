import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import {
  Entity,
  Has,
  HasValue,
  getComponentValue,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { useEffect } from "react";
import { useMUD } from "../MUDContext";
import { MAIN_MENU, MENU, SOURCE } from "../constants";
import { Direction, updateMoves } from "../logics/move";

export type MenuKeysProps = {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onA?: (selected: number) => void;
  onB?: (selected: number) => void;
  selected?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selected2?: any;
  disabled?: boolean;
};

// Notes: there are in total two groups keyevent listeners: one here, another in GameScene
// the problem is conflict.
// useMenuKeys is supposed to function when menu is on, and GameScene is supposed to function when menu is off
// but, problem arises for onB() in ExploreMenu & MainMenu, where it removes the menu, but also triggers GameScene's keyevent listener
// some hacks are implemented in ExploreMenu & MainMenu to avoid this conflict: setTimeout to remove menu,
// so that GameScene's listener still checks if menu is on, and doesn't trigger the action
export default function useMenuKeys({
  onUp,
  onDown,
  onLeft,
  onRight,
  onA,
  onB,
  selected = 0,
  selected2 = null,
  disabled = false,
}: MenuKeysProps) {
  const {
    components,
    network: { playerEntity },
    systemCalls,
  } = useMUD();
  const { SelectedEntity, ConsoleMessage, Moves, SelectedHost } = components;
  const menu = useComponentValue(SelectedEntity, MENU)?.value;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key == "w") {
        return onUp?.();
      } else if (e.key == "s") {
        return onDown?.();
      } else if (e.key == "a") {
        return onLeft?.();
      } else if (e.key == "d") {
        return onRight?.();
      } else if (e.key == "j") {
        console.log("onA", selected);
        return onA?.(selected);
      } else if (e.key == "k") {
        removeComponent(ConsoleMessage, SOURCE);
        return onB?.(selected);
      }
    };
    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [menu, selected, selected2]);
}
