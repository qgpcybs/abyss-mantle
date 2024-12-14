import { useComponentValue } from "@latticexyz/react";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { useMUD } from "../MUDContext";
import { SyncStep } from "@latticexyz/store-sync";

export function Loading() {
  const {
    components: { SyncProgress },
  } = useMUD();

  const syncProgress = useComponentValue(SyncProgress, singletonEntity) ?? {
    step: SyncStep.INITIALIZE,
    percentage: 0,
    message: "Connecting",
  };

  return (
    <div
      className="absolute w-screen h-screen flex items-center justify-center"
      style={{ fontFamily: "Joystix" }}
    >
      <div>
        {syncProgress.message} ({Math.floor(syncProgress.percentage)}%)
      </div>
    </div>
  );
}
