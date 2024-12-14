import {
  defineSystem,
  defineUpdateSystem,
  Entity,
  getComponentValue,
  Has,
  HasValue,
  runQuery,
  UpdateType,
} from "@latticexyz/recs";
import { random, randomInt } from "../utils/random";
import { Hex } from "viem";
import { SystemCalls } from "../mud/createSystemCalls";
import { SetupResult } from "../mud/setup";
import { encodeAddress } from "../utils/encode";
import { ClientComponents } from "../mud/createClientComponents";
import { getPosition } from "../logics/path";
import { Vector } from "../utils/vector";
import { calculatePathToTargetCoord, coordsToMoves } from "../logics/move";
import { unixTimeSecond } from "../utils/time";
import { RandomWalkSubStrategy } from "./moveSubStrategy";
import {
  ExplorationStrategy,
  Strategy,
  StrategyParams,
  StrategyState,
  stringToStrategy,
} from "./strategy";
import { CombatSubStrategy } from "./combatSubStrategy";
import { withinAttackRange } from "../logics/combat";
import { getRoleAndHostAdjacentCoord } from "../logics/building";

export interface BotState {
  bot: Bot;
  strategyState: StrategyState;
  health?: number;
  mana?: number;
  position?: Vector;
  // isUnderAttack: boolean;
}

export class Bot {
  components: SetupResult["components"];
  systemCalls: SystemCalls;
  targetCommander: Entity;
  address: Hex;
  commander: Entity;
  entity: Entity;

  random: number;
  lastUpdated: number;
  waitingTx = false;

  strategyState: StrategyState = {};

  constructor(result: SetupResult, bot: Entity) {
    const { components, network, systemCalls } = result;
    const world = network.world;
    this.components = components;
    this.systemCalls = systemCalls;
    this.targetCommander = network.playerEntity;

    this.address = network.worldContract.address as Hex;
    this.commander = encodeAddress(this.address.toLowerCase() as Hex) as Entity;
    this.entity = bot;
    this.random = Number(random(this.entity as Hex, 100));

    const { Path, Commander, BotState } = components;

    // // Initialize strategy
    // this.initStrategies();
    // this.initState();

    // Set default strategies
    this.lastUpdated = unixTimeSecond();

    setInterval(() => {
      this.executeStrategies();
    }, 1000);

    // defineSystem(world, [Has(Path), Has(Commander)], ({ entity }) => {
    //   // const currTime = unixTimeSecond();
    //   // if (currTime - this.lastUpdated <= 3) return;
    //   if (entity !== this.entity) return;
    //   // this.lastUpdated = unixTimeSecond();
    //   this.updateStrategies();
    //   this.executeStrategies();
    // });

    defineSystem(world, [Has(BotState)], ({ entity, type }) => {
      if (entity !== this.entity) return;
      if (type === UpdateType.Exit) {
        this.removeStrategy();
        return;
      }
      const state = getComponentValue(BotState, entity)!;
      const strategies = state.strategies || [];
      const strategyClasses = strategies
        .map((strategy) => stringToStrategy(strategy))
        .filter((strategy) => strategy !== undefined);
      this.updateStrategies(strategyClasses);
      this.updateState({
        ...this.strategyState,
        target: state.target ?? undefined,
        targetCoord:
          state.targetX && state.targetY
            ? { x: state.targetX, y: state.targetY }
            : undefined,
        violence: state.violence ?? false,
      });
      this.executeStrategies();
    });
  }

  // for now, init strategy with ExplorationStrategy
  initStrategies() {
    this.strategyState = {
      ...this.strategyState,
      strategies: [new ExplorationStrategy()],
    };
  }

  // for now
  initState() {
    const offset = 0;
    // const offset = this.random % 2 === 0 ? this.random : -this.random;
    this.strategyState = {
      ...this.strategyState,
      targetCoord: { x: 2 ** 16 + offset, y: 2 ** 16 + offset },
    };
  }

  removeStrategy() {
    this.strategyState = {
      ...this.strategyState,
      strategies: [],
    };
  }

  addStrategy(strategy: Strategy) {
    this.strategyState = {
      ...this.strategyState,
      strategies: [...(this.strategyState.strategies || []), strategy],
    };
  }

  updateState(state: StrategyState) {
    this.strategyState = state;
  }

  updateStrategies(strategies: Strategy[]) {
    this.strategyState = {
      ...this.strategyState,
      strategies,
    };
  }

  async executeStrategies() {
    if (this.waitingTx) return;
    this.waitingTx = true;
    console.log("executing strategies", this.strategyState);
    for (const strategy of this.strategyState.strategies || []) {
      await this.executeStrategy(strategy);
    }
    this.waitingTx = false;
  }

  async executeStrategy(strategy: Strategy) {
    this.strategyState = await strategy.execute({
      components: this.components,
      systemCalls: this.systemCalls,
      bot: this,
      state: this.strategyState,
    });
  }

  // assume pathCoords within MAX_MOVES??
  async move(toCoord: Vector) {
    const { move } = this.systemCalls;
    const pathCoords = calculatePathToTargetCoord(
      this.components,
      this.systemCalls,
      this.entity,
      toCoord
    );
    if (!pathCoords) return;
    const moves = coordsToMoves(pathCoords);
    if (!moves) return;
    await move(this.entity as Hex, moves);
  }

  async claim(staker: Entity) {
    const adjacentCoord = getRoleAndHostAdjacentCoord(
      this.components,
      this.entity,
      staker
    );
    if (!adjacentCoord) return;
    await this.systemCalls.claim(this.entity as Hex, adjacentCoord);
  }

  async attack(target: Entity) {
    const { attack } = this.systemCalls;
    // TODO: check stamina
    const withinRange = withinAttackRange(this.components, this.entity, target);
    if (!withinRange) return;
    await attack(this.entity as Hex, target as Hex);
  }

  async respawn() {}

  getSource() {
    const source = [
      ...runQuery([
        HasValue(this.components.Commander, { value: this.commander }),
      ]),
    ][0];
    if (!source) return;
    return source;
  }

  getTarget() {
    const target = [
      ...runQuery([
        HasValue(this.components.Commander, { value: this.targetCommander }),
      ]),
    ][0];
    return target;
  }

  //   findNextPathToTarget(position: Vector) {
  //     const
  //   }
}
