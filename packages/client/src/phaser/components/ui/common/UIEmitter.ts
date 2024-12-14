import { UIEvents } from "./UIEvents";

export interface UIEmitterConfig {
  data?: unknown;
  disable?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  onSelect?: () => void;
  onUnSelect?: () => void;
}

/**
 * The most basic UI components, about the lisenters & triggers.
 * In AWRPG, it's also the parent class of SceneObject.
 */
export class UIEmitter {
  /** A empty gameObject as the root node */
  root: Phaser.GameObjects.Container;

  /** Anything you want to save */
  data: any;

  /** Record mouse hover or not */
  hovering: boolean = false;

  /** Indicates that the UI is currently in an unusable state, such as the button */
  _disable: boolean = false;

  /** Save the function that will be executed when the confirm key is pressed */
  onConfirm?: () => void;

  /** Save the function that will be executed when the cancel key is pressed */
  onCancel?: () => void;

  /** Save the function that will be executed when it's selected in list */
  onSelect?: () => void;

  /** Save the function that will be executed when it's is unselected in list */
  onUnSelect?: () => void;

  constructor(scene: Phaser.Scene, config: UIEmitterConfig = {}) {
    // Create the root container
    this.root = new Phaser.GameObjects.Container(scene, 0, 0);
    this.data = config.data;
    this.disable = config.disable ?? false;
    this.onConfirm = config.onConfirm;
    this.onCancel = config.onCancel;
    this.onSelect = config.onSelect;
    this.onUnSelect = config.onUnSelect;
  }

  //==================================================================
  //    About the listeners
  //==================================================================
  /**
   * Add a listener for a given event.
   * @param event The event name.
   * @param fn The listener function.
   * @param context The context to invoke the listener with. Default this.
   */
  on(event: string | symbol, fn: Function, context?: any): UIEmitter {
    this.root.on(event, fn, context);
    return this;
  }

  /**
   * Add a one-time listener for a given event.
   * @param event The event name.
   * @param fn The listener function.
   * @param context The context to invoke the listener with. Default this.
   */
  once(event: string | symbol, fn: Function, context?: any): UIEmitter {
    this.root.once(event, fn, context);
    return this;
  }

  /**
   * Remove the listeners of a given event or all listeners
   * @param event The event name.
   * @param fn Only remove the listeners that match this function.
   * @param context Only remove the listeners that have this context.
   * @param once Only remove one-time listeners.
   */
  off(
    event?: string | symbol,
    fn?: Function,
    context?: any,
    once?: boolean
  ): UIEmitter {
    if (event) {
      this.root.off(event, fn, context, once);
    } else {
      this.root.removeAllListeners();
    }
    return this;
  }

  /**
   * Return the listeners registered for a given event.
   * @param event The event name.
   */
  listeners(event: string | symbol): Function[] {
    return this.root.listeners(event);
  }

  /**
   * Return the number of listeners listening to a given event.
   * @param event The event name.
   */
  listenerCount(event: string | symbol): number {
    return this.root.listenerCount(event);
  }

  /**
   * Calls each of the listeners registered for a given event.
   * @param event The event name.
   * @param args Additional arguments that will be passed to the event handler.
   */
  emit(event: string | symbol, ...args: any[]): boolean {
    if (!this.disable) return this.root.emit(event, ...args);
    else return false;
  }

  //==================================================================
  //    About the triggers
  //    The config of keys is in the UIConfig.ts file
  //==================================================================
  /**
   * When focus is gained
   */
  onFocus() {}

  /**
   * When focus is lost
   */
  onBlur() {}

  /**
   * When pressing the up key
   */
  onUpPressed(event: KeyboardEvent) {
    if (!this.disable) this.emit(UIEvents.ARROW, this, event);
    if (!this.disable) this.emit(UIEvents.UP, this, event);
  }

  /**
   * When pressing the down key
   */
  onDownPressed(event: KeyboardEvent) {
    if (!this.disable) this.emit(UIEvents.ARROW, this, event);
    if (!this.disable) this.emit(UIEvents.DOWN, this, event);
  }

  /**
   * When pressing the left key
   */
  onLeftPressed(event: KeyboardEvent) {
    if (!this.disable) this.emit(UIEvents.ARROW, this, event);
    if (!this.disable) this.emit(UIEvents.LEFT, this, event);
  }

  /**
   * When pressing the right key
   */
  onRightPressed(event: KeyboardEvent) {
    if (!this.disable) this.emit(UIEvents.ARROW, this, event);
    if (!this.disable) this.emit(UIEvents.RIGHT, this, event);
  }

  /**
   * When confirm key is pressed
   */
  onConfirmPressed(event: KeyboardEvent) {
    if (this.disable) return;
    this.emit(UIEvents.CONFIRM, this, event);
    if (this.onConfirm) this.onConfirm();
  }

  /**
   * When cancel key is pressed
   */
  onCancelPressed(event: KeyboardEvent) {
    if (this.disable) return;
    this.emit(UIEvents.CANCEL, this, event);
    if (this.onCancel) this.onCancel();
  }

  /**
   * When the menu key is pressed
   */
  onMenuPressed(event: KeyboardEvent) {
    if (this.disable) return;
    this.emit(UIEvents.MENU, this, event);
  }

  onTabPressed(event: KeyboardEvent) {
    if (this.disable) return;
    this.emit(UIEvents.TAB, this, event);
  }

  /**
   * When item has been selected (UIList)
   */
  onSelected() {
    if (this.disable) return;
    if (this.onSelect) this.onSelect();
  }

  /**
   * When item has been unselected (UIList)
   */
  onUnSelected() {
    if (this.disable) return;
    if (this.onUnSelect) this.onUnSelect();
  }

  /**
   * When hovering the mouse
   */
  onHover() {
    this.hovering = true;
  }

  /**
   * When the mouse over
   */
  onUnHover() {
    this.hovering = false;
  }

  get disable() {
    return this._disable;
  }

  set disable(value: boolean) {
    this.setDisable(value);
  }

  setDisable(value: boolean) {
    this._disable = value;
  }
}
