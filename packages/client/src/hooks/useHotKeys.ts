import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { getComponentValue, setComponent } from "@latticexyz/recs";
import { useEffect } from "react";
import { useMUD } from "../MUDContext";
import { OVERLAY } from "../constants";

export default function useHotkeys() {
  const {
    components,
    network: { playerEntity },
  } = useMUD();
  const { ToggledOn } = components;

  // const targets = [...useEntityQuery([Has(MarkedTarget)])];
  // const target = useComponentValue(SelectedHost, TARGET)?.value as Entity;
  // console.log("targets", targets);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key == "h" && document.activeElement?.tagName !== "TEXTAREA") {
        const overlayOn = getComponentValue(ToggledOn, OVERLAY)?.value ?? false;
        overlayOn
          ? setComponent(ToggledOn, OVERLAY, { value: false })
          : setComponent(ToggledOn, OVERLAY, { value: true });
      }
    };
    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, []);
}
