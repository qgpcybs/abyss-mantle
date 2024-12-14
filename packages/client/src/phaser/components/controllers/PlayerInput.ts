import { GuiBase } from "../../ui/GuiBase";
import { UIBase } from "../ui/common/UIBase";
import { UIConfig } from "../ui/common/UIConfig";
import { UIEvents } from "../ui/common/UIEvents";
import { UIController } from "./UIController";
import { SceneObjectController } from "./SceneObjectController";
import { SceneObject } from "../../objects/SceneObject";

export class PlayerInput {
  static scene: Phaser.Scene;
  static flagUp: boolean = true;
  static monoFocus: boolean = true;

  static listenStart(scene?: Phaser.Scene) {
    if (scene) this.scene = scene;
    this.scene.input.keyboard?.on("keydown", this.onKeyDown, this);
    this.scene.input.keyboard?.on("keyup", this.onKeyUp, this);
  }

  static onlyListenUI() {
    SceneObjectController.controllable = false;
    UIController.controllable = true;
  }

  static onlyListenSceneObject() {
    UIController.controllable = false;
    SceneObjectController.controllable = true;
  }

  private static onKeyDown(event: KeyboardEvent) {
    if (!UIController.scene) return;
    if (document.activeElement?.tagName === "TEXTAREA") return;
    // if (!this.flagUp) return;
    this.flagUp = false;
    const focusUI = UIController.focus;
    const focusSceneObj = SceneObjectController.focus;
    if (focusUI && UIController.controllable) this.emitKeyDown(focusUI, event);
    if (focusSceneObj && SceneObjectController.controllable)
      this.emitKeyDown(focusSceneObj, event);
  }

  private static emitKeyDown(
    focus: UIBase | SceneObject,
    event: KeyboardEvent
  ) {
    const key: string = event.key;
    if (UIConfig.KEY_UP.includes(key)) focus.onUpPressed(event);
    if (UIConfig.KEY_DOWN.includes(key)) focus.onDownPressed(event);
    if (UIConfig.KEY_LEFT.includes(key)) focus.onLeftPressed(event);
    if (UIConfig.KEY_RIGHT.includes(key)) focus.onRightPressed(event);
    if (UIConfig.KEY_CONFIRM.includes(key)) focus.onConfirmPressed(event);
    if (UIConfig.KEY_CANCEL.includes(key)) focus.onCancelPressed(event);
    if (UIConfig.KEY_MENU.includes(key)) focus.onMenuPressed(event);
    if (UIConfig.KEY_SWITCH.includes(key)) focus.onTabPressed(event);
  }

  private static onKeyUp(event: KeyboardEvent) {
    this.flagUp = true;
  }
}
