import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { useMUD } from "./MUDContext";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import useSyncComputedComponents from "./hooks/useSyncComputedComponents";
import { Entity, HasValue, getComponentValue } from "@latticexyz/recs";
import { SOURCE } from "./constants";
import { Hex } from "viem";
import Overlay from "./components/Overlay";
import { Loading } from "./components/Loading";

export const App = () => {
  const ready = useSyncComputedComponents();
  const {
    components: { Commander, Moves, SelectedHost },
    systemCalls: { move, spawnHero },
    network: { playerEntity },
  } = useMUD();

  const host = useComponentValue(SelectedHost, SOURCE)?.value as Hex;
  const hasSpawned =
    useEntityQuery([HasValue(Commander, { value: playerEntity })]).length > 0;

  return (
    <>
      {ready && <Overlay />}
      {!ready && <Loading />}
    </>
  );
};
