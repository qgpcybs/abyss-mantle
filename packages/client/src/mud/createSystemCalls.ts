/*
 * Create the system calls that the client can use to ask
 * for changes in the World state (using the System contracts).
 */

import {
  Component,
  Entity,
  getComponentValue,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkResult } from "./setupNetwork";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { PERLIN_DENOM } from "../contract/constants";
import { Hex } from "viem";
import { SOURCE } from "../constants";
import { Vector } from "../utils/vector";
import { selectNextHost } from "../logics/entity";

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(
  /*
   * The parameter list informs TypeScript that:
   *
   * - The first parameter is expected to be a
   *   SetupNetworkResult, as defined in setupNetwork.ts
   *
   *   Out of this parameter, we only care about two fields:
   *   - worldContract (which comes from getContract, see
   *     https://github.com/latticexyz/mud/blob/main/templates/react/packages/client/src/mud/setupNetwork.ts#L63-L69).
   *
   *   - waitForTransaction (which comes from syncToRecs, see
   *     https://github.com/latticexyz/mud/blob/main/templates/react/packages/client/src/mud/setupNetwork.ts#L77-L83).
   *
   * - From the second parameter, which is a ClientComponent,
   *   we only care about Counter. This parameter comes to use
   *   through createClientComponents.ts, but it originates in
   *   syncToRecs
   *   (https://github.com/latticexyz/mud/blob/main/templates/react/packages/client/src/mud/setupNetwork.ts#L77-L83).
   */
  {
    worldContract,
    waitForTransaction,
    perlin,
    playerEntity,
  }: SetupNetworkResult,
  components: ClientComponents
) {
  const { Moves, TxSuccess, TxError, TxPending } = components;

  const getNoise = (x: number, y: number, perlin_denom?: number) => {
    perlin_denom = perlin_denom ?? PERLIN_DENOM;
    const noise = perlin(x, y, 0, perlin_denom);
    return Math.floor(noise * 100);
  };

  const handleTxMessage = (
    txComponent: Component,
    tx: Hex,
    message: string
  ) => {
    setComponent(txComponent, tx as Entity, { message });
    if (txComponent === TxSuccess) {
      removeComponent(TxPending, tx as Entity);
    }
    setTimeout(() => {
      removeComponent(txComponent, tx as Entity);
    }, 5000);
  };

  const handleTx = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $write: Promise<any>,
    pendingMessage: string,
    successMessage: string
  ) => {
    const tx = await $write.catch((e) => {
      handleTxMessage(TxError, singletonEntity as Hex, e.message);
      throw e;
    });
    handleTxMessage(TxPending, tx, pendingMessage);
    return await waitForTransaction(tx)
      .then(() => handleTxMessage(TxSuccess, tx, successMessage))
      .catch((e) => {
        handleTxMessage(TxError, tx, e.message);
        throw e;
      });
  };

  const spawnHero = async (name?: string) => {
    name = name ?? "Hero";
    const write = worldContract.write.spawnHero([name]);
    await handleTx(write, "Spawning...", "Spawned");
    selectNextHost(components, playerEntity);
  };

  const spawnHeroOnCoord = async (
    oldHero: Hex,
    coord: Vector,
    name?: string
  ) => {
    name = name ?? "Hero";
    const write = worldContract.write.spawnHeroOnCoord([
      name,
      oldHero,
      coord.x,
      coord.y,
    ]);
    return await handleTx(write, "Spawning on coord...", "Spawned");
  };

  const move = async (host: Hex, moves: number[]) => {
    const write = worldContract.write.move([host, moves]);
    await handleTx(write, "Moving...", "Moved");
    return removeComponent(Moves, host as Entity);
  };

  const burnTerrain = async (host: Hex, coord: Vector) => {
    const write = worldContract.write.burnTerrain([host, coord.x, coord.y]);
    await handleTx(write, "Burning...", "Burned");
  };

  const interactTerrain = async (host: Hex, coord: Vector) => {
    const tx = await worldContract.write.interactTerrain([
      host,
      coord.x,
      coord.y,
    ]);
    await waitForTransaction(tx);
  };

  /**
   *
   * @param host role entity to build building
   * @param buildingType building type to build
   * @param adjacentCoord coord that is adjacent to host & in building
   * @param lowerCoord building's lower coord
   */
  const buildBuilding = async (
    host: Hex,
    buildingType: Hex,
    adjacentCoord: Vector,
    lowerCoord: Vector
  ) => {
    const write = worldContract.write.buildBuilding([
      host,
      buildingType,
      adjacentCoord.x,
      adjacentCoord.y,
      lowerCoord.x,
      lowerCoord.y,
    ]);
    await handleTx(write, "Building...", "Built");
  };

  const consumeERC20 = async (host: Hex, itemType: Hex) => {
    const write = worldContract.write.consumeERC20([itemType, host]);
    await handleTx(write, "Consuming...", "Consumed");
  };

  const transferERC20 = async (
    from: Vector,
    to: Vector,
    itemType: Hex,
    amount: bigint
  ) => {
    const write = worldContract.write.transferERC20([
      itemType,
      from.x,
      from.y,
      to.x,
      to.y,
      amount,
    ]);
    await handleTx(write, "Transferring erc20...", "Transferred");
  };

  const transferERC721 = async (from: Vector, to: Vector, entity: Hex) => {
    const write = worldContract.write.transferERC721([
      from.x,
      from.y,
      to.x,
      to.y,
      entity,
    ]);
    await handleTx(write, "Transferring erc721...", "Transferred");
  };

  const setSwapRatio = async (
    fromType: Hex,
    toType: Hex,
    host: Hex,
    num: number,
    denom: number
  ) => {
    const write = worldContract.write.setSwapRatio([
      fromType,
      toType,
      host,
      num,
      denom,
    ]);
    await handleTx(write, "Setting swap ratio...", "Set swap ratio");
  };

  const swapERC20 = async (
    fromType: Hex,
    toType: Hex,
    from: Hex,
    to: Hex,
    amount: bigint
  ) => {
    const write = worldContract.write.swapERC20([
      fromType,
      toType,
      from,
      to,
      amount,
    ]);
    await handleTx(write, "Swapping erc20...", "Swapped");
  };

  const setTerrainValues = async (gridCoord: Vector, values: bigint) => {
    const write = worldContract.write.setTerrainValues([
      gridCoord.x,
      gridCoord.y,
      values,
    ]);
    await handleTx(write, "Setting terrain values...", "Set terrain values");
  };

  const setTerrainValue = async (tileCoord: Vector, value: number) => {
    const write = worldContract.write.setTerrainValue([
      tileCoord.x,
      tileCoord.y,
      value,
    ]);
    await handleTx(write, "Setting terrain value...", "Set terrain value");
  };

  const enterBuilding = async (role: Hex, enterCoord: Vector) => {
    const write = worldContract.write.enterBuilding([
      role,
      enterCoord.x,
      enterCoord.y,
    ]);
    await handleTx(write, "Entering building...", "Entered building");
  };

  const exitBuilding = async (
    role: Hex,
    buildingCoord: Vector,
    exitCoord: Vector
  ) => {
    const write = worldContract.write.exitBuilding([
      role,
      buildingCoord.x,
      buildingCoord.y,
      exitCoord.x,
      exitCoord.y,
    ]);
    await handleTx(write, "Exiting building...", "Exited building");
  };

  const startMining = async (role: Hex, buildingCoord: Vector) => {
    const write = worldContract.write.startMining([
      role,
      buildingCoord.x,
      buildingCoord.y,
    ]);
    await handleTx(write, "Starting mining...", "Started mining");
  };

  const stopMining = async (role: Hex) => {
    const write = worldContract.write.stopMining([role]);
    await handleTx(write, "Stopping mining...", "Stopped mining");
  };

  const attack = async (attacker: Hex, target: Hex) => {
    const write = worldContract.write.attack([attacker, target]);
    await handleTx(write, "Attacking...", "Attacked");
  };

  const revive = async (role: Hex, target: Hex) => {
    const write = worldContract.write.revive([role, target]);
    await handleTx(write, "Reviving...", "Revived");
  };

  const dropERC20 = async (role: Hex, itemType: Hex, amount: bigint) => {
    const write = worldContract.write.dropERC20([role, itemType, amount]);
    await handleTx(write, "Dropping erc20...", "Dropped");
  };

  const pickupERC20 = async (
    role: Hex,
    from: Hex,
    itemType: Hex,
    amount: bigint,
    tileX: number,
    tileY: number
  ) => {
    const write = worldContract.write.pickupERC20([
      role,
      from,
      itemType,
      amount,
      tileX,
      tileY,
    ]);
    await handleTx(write, "Picking up erc20...", "Picked up");
  };

  const dropERC721 = async (entity: Hex) => {
    const write = worldContract.write.dropERC721([entity]);
    await handleTx(write, "Dropping erc721...", "Dropped");
  };

  const pickupERC721 = async (
    role: Hex,
    from: Hex,
    entity: Hex,
    tileX: number,
    tileY: number
  ) => {
    const write = worldContract.write.pickupERC721([
      role,
      from,
      entity,
      tileX,
      tileY,
    ]);
    await handleTx(write, "Picking up erc721...", "Picked up");
  };

  const stake = async (role: Hex, stakeType: Hex, coord: Vector) => {
    const write = worldContract.write.stake([
      role,
      stakeType,
      coord.x,
      coord.y,
    ]);
    await handleTx(write, "Staking...", "Staked");
  };

  const unstake = async (role: Hex, coord: Vector) => {
    const write = worldContract.write.unstake([role, coord.x, coord.y]);
    await handleTx(write, "Unstaking...", "Unstaked");
  };

  const claim = async (role: Hex, coord: Vector) => {
    const write = worldContract.write.claim([role, coord.x, coord.y]);
    await handleTx(write, "Claiming...", "Claimed");
  };

  const equip = async (equipment: Hex, equipType: Hex) => {
    const write = worldContract.write.equip([equipment, equipType]);
    await handleTx(write, "Equipping...", "Equipped");
  };

  const unequip = async (host: Hex, equipType: Hex) => {
    const write = worldContract.write.unequip([host, equipType]);
    await handleTx(write, "Unequipping...", "Unequipped");
  };

  const craft = async (host: Hex, craftType: Hex) => {
    const write = worldContract.write.craft([host, craftType]);
    await handleTx(write, "Crafting...", "Crafted");
  };

  return {
    getNoise,
    spawnHero,
    spawnHeroOnCoord,
    move,
    burnTerrain,
    interactTerrain,
    buildBuilding,
    consumeERC20,
    transferERC20,
    transferERC721,
    setSwapRatio,
    swapERC20,
    setTerrainValues,
    setTerrainValue,
    enterBuilding,
    exitBuilding,
    startMining,
    stopMining,
    attack,
    revive,
    dropERC20,
    pickupERC20,
    dropERC721,
    pickupERC721,
    stake,
    unstake,
    claim,
    equip,
    unequip,
    craft,
  };
}
