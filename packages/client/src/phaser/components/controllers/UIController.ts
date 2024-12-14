import { GuiBase } from "../../ui/GuiBase";
import { UIBase } from "../ui/common/UIBase";
import { UIEvents } from "../ui/common/UIEvents";
import { SceneObjectController } from "./SceneObjectController";
import { UIScene } from "../../scenes/UIScene";
import { getTargetTerrainData } from "../../../logics/terrain";
import { terrainMapping } from "../../../constants";

/** UI control */
export class UIController {
  static scene: UIScene;
  static flagUp: boolean = true;
  private static _controllable: boolean = false;

  /** The UI that currently has the focus */
  private static _focus?: UIBase;

  static get focus(): UIBase | undefined {
    return this._focus;
  }

  static set focus(ui: UIBase | undefined) {
    if (this._focus === ui) return;
    if (this._focus) {
      this._focus.onBlur();
      this._focus.emit(UIEvents.FOCUS_OFF, this._focus);
    }
    this._focus = ui;
    if (this._focus) {
      this._focus.emit(UIEvents.FOCUS_ON, this._focus);
      this._focus.onFocus();
    }
  }

  static init(scene?: UIScene) {
    if (scene) this.scene = scene;
  }

  static getGui(name: string): GuiBase {
    return (this.scene as any)[name];
  }

  static openGui(name: string) {
    (this.scene as any)[name].show();
    return (this.scene as any)[name];
  }

  static get controllable(): boolean {
    return this._controllable;
  }

  static set controllable(value: boolean) {
    this._controllable = value;
  }
}
