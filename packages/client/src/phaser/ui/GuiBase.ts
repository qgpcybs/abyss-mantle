import { UIBase } from "../components/ui/common/UIBase";
import { UIController } from "../components/controllers/UIController";
import { UIScene } from "../scenes/UIScene";
import { ClientComponents } from "../../mud/createClientComponents";
import { SystemCalls } from "../../mud/createSystemCalls";
import { SetupNetworkResult } from "../../mud/setupNetwork";
import { UIEvents } from "../components/ui/common/UIEvents";
import { StandardGameSize } from "../components/ui/common/UIBase";

export interface GuiBaseConfig {
  autoZoom?: boolean;
  visible?: boolean;
  onConfirm?: () => void;
}

/**
 * All the complex UI Components need to extend from this class.
 */
export class GuiBase {
  /**
   * the UIScene
   */
  scene: UIScene;

  components: ClientComponents;
  systemCalls: SystemCalls;
  network: SetupNetworkResult;

  /**
   * The name is used for controllers to determine the current UI object
   */
  name: string;

  /**
   * Each GuiBase must have a basic UI component as a root node
   */
  rootUI: UIBase;

  private _focusUI?: UIBase;

  prevGui?: GuiBase;

  autoZoom: boolean;

  config: GuiBaseConfig;

  destroying: boolean;

  parent?: GuiBase;

  /**
   * Data listener events that depend on Phaser: https://newdocs.phaser.io/docs/3.80.0/Phaser.Data.Events.CHANGE_DATA
   */
  onDataChanged(parent: unknown, key: string, data: unknown) {}

  /**
   * Input triggers
   */
  onUp() {}
  onDown() {}
  onLeft() {}
  onRight() {}
  onConfirm() {}
  onCancel() {}

  /**
   * @param scene
   * @param rootUI The base UI component that serves as the root node of the GuiBase
   */
  constructor(scene: UIScene, rootUI: UIBase, config: GuiBaseConfig = {}) {
    this.name = "GuiBase";
    this.scene = scene;
    this.components = scene.components;
    this.network = scene.network;
    this.systemCalls = scene.systemCalls;
    this.rootUI = rootUI;
    this.visible = config.visible ?? false;
    this.autoZoom = config.autoZoom ?? false;
    this.config = config;
    this.destroying = false;
    if (config.onConfirm) this.onConfirm = config.onConfirm;
  }

  /**
   * Show it
   */
  show(...params: unknown[]) {
    this.resizeListener(this.scene.game.scale.gameSize);
    this.scene.scale.on("resize", this.resizeListener, this);
    if (this.focusUI) UIController.focus = this.focusUI; // Set focus
    this.rootUI.root.on("changedata", this.onDataChanged, this);
    this.visible = true;
  }

  /**
   * Hide it
   */
  hidden(...params: unknown[]) {
    this.visible = false;
    if (UIController.focus === this.focusUI) UIController.focus = undefined;
    this.scene.scale.off("resize", this.resizeListener, this);
    this.rootUI.root.off("changedata", this.onDataChanged, this);
  }

  destroy() {
    this.destroying = true;
    this.rootUI.destroyChildren();
    this.rootUI.destroy();
  }

  resizeListener(gameSize: Phaser.Structs.Size) {
    if (this.destroying) return;
    if (this.autoZoom) {
      const zoom = Phaser.Math.Clamp(
        gameSize.width / StandardGameSize.maxWidth,
        StandardGameSize.minWidth / StandardGameSize.maxWidth,
        1
      );
      this.rootUI.setZoom(zoom);
    } else {
      this.rootUI.updatePosition();
    }
  }

  onMenuListen(ui: UIBase = this.rootUI) {
    if (this.destroying) return;
    ui.on(UIEvents.UP, this.onUp, this);
    ui.on(UIEvents.DOWN, this.onDown, this);
    ui.on(UIEvents.LEFT, this.onLeft, this);
    ui.on(UIEvents.RIGHT, this.onRight, this);
    ui.on(UIEvents.CONFIRM, this.onConfirm, this);
    ui.on(UIEvents.CANCEL, this.onCancel, this);
  }

  offMenuListen(ui: UIBase = this.rootUI) {
    ui.off(UIEvents.UP, this.onUp, this);
    ui.off(UIEvents.DOWN, this.onDown, this);
    ui.off(UIEvents.LEFT, this.onLeft, this);
    ui.off(UIEvents.RIGHT, this.onRight, this);
    ui.off(UIEvents.CONFIRM, this.onConfirm, this);
    ui.off(UIEvents.CANCEL, this.onCancel, this);
  }

  /**
   * Set data on the rootUI of it, you can call 'getData' to use the data.
   * @param key The key to set the value for. Or an object of key value pairs. If an object the data argument is ignored.
   * @param data The value to set for the given key. If an object is provided as the key this argument is ignored.
   */
  setData(key: string, data: unknown) {
    if (this.destroying) return;
    this.rootUI.root.setData(key, data);
  }

  /**
   * Retrieves the value for the given key in this Game Objects Data Manager, or undefined if it doesn't exist.
   * @param key The key of the value to retrieve, or an array of keys.
   */
  getData(key: string) {
    return this.rootUI.root.getData(key);
  }

  get focusUI(): UIBase | undefined {
    return this._focusUI;
  }

  set focusUI(value: UIBase) {
    if (UIController.focus === this._focusUI) UIController.focus = value;
    this._focusUI = value;
  }

  /**
   * Determine if the current object is displayed
   * If you want to change the visible state, best to use the show() and hidden() controls.
   */
  get visible(): boolean {
    return this.rootUI.root.visible;
  }

  set visible(value: boolean) {
    if (value === true) {
      this.rootUI.root.setVisible(true);
    } else {
      this.rootUI.root.setVisible(false);
    }
  }
}
