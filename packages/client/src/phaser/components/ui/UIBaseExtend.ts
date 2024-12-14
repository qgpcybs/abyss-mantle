import { UIBase } from "./common/UIBase";
import { Component, Entity, Schema } from "@latticexyz/recs";
import { listenComponentValue } from "../../../utils/pecs";
import { ClientComponents } from "../../../mud/createClientComponents";
import { SystemCalls } from "../../../mud/createSystemCalls";

declare module "./common/UIBase" {
  interface UIBase {
    /** [Readonly] The entity bound to this UI. */
    _entity?: Entity | undefined;
    get entity(): Entity | undefined;
    set entity(value: Entity | undefined);

    /** [Readonly] The components bound to this UI. Default to the components of scene. */
    _components: ClientComponents;
    get components(): ClientComponents;
    set components(value: ClientComponents);

    /** [Readonly] The systemCalls bound to this UI. Default to the systemCalls of scene. */
    _systemCalls: SystemCalls;
    get systemCalls(): SystemCalls;
    set systemCalls(value: SystemCalls);

    /** For the Subscriptions if the game need to use */
    unsubscribes?: (() => void)[];

    /** Listener for AWRPG */
    listenComponentValue<S extends Schema>(
      component: Component<S> | string,
      callback: (value: unknown) => void,
      entity?: Entity,
      index?: number
    ): void;
  }
}

Object.defineProperty(UIBase.prototype, "entity", {
  get: function (): Entity | undefined {
    return this._entity;
  },
  set: function (value: Entity | undefined) {
    this._entity = value;
  },
});

Object.defineProperty(UIBase.prototype, "components", {
  get: function (): ClientComponents {
    return this._components;
  },
  set: function (value: ClientComponents) {
    this._components = value;
  },
});

Object.defineProperty(UIBase.prototype, "systemCalls", {
  get: function (): SystemCalls {
    return this._systemCalls;
  },
  set: function (value: SystemCalls) {
    this._systemCalls = value;
  },
});

/**
 * Extend init
 */
const originalInit = UIBase.prototype.init;
UIBase.prototype.init = function () {
  originalInit.call(this);
  this.unsubscribes = [];
  this.components = (this.scene as any).components;
};

const originalDestroy = UIBase.prototype.destroy;
UIBase.prototype.destroy = function () {
  if (this.unsubscribes) {
    this.unsubscribes.forEach((unsubscribes) => unsubscribes());
  }
  originalDestroy.call(this);
};

/**
 * Listener for AWRPG
 * @callback
 * @index the index of the subscription to listen, default 0
 */
UIBase.prototype.listenComponentValue = function <S extends Schema>(
  component: Component<S> | string,
  callback: (value: unknown) => void,
  entity: Entity | undefined = undefined,
  index: number = 0
) {
  if (!this.unsubscribes) return;
  if (typeof component === "string")
    component = (this.components as any)[component] as Component<S>;
  if (this.unsubscribes[index]) this.unsubscribes[index]();
  this.unsubscribes[index] = listenComponentValue(
    component,
    entity ?? this.entity,
    callback
  );
};
