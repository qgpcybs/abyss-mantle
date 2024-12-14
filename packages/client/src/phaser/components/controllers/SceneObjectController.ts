import { GameScene } from "../../scenes/GameScene";
import { UIScene } from "../../scenes/UIScene";
import { ClientComponents } from "../../../mud/createClientComponents";
import {
  Entity,
  getComponentValue,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import {
  OBSERVER,
  SOURCE,
  MENU,
  MAIN_MENU,
  EXPLORE_MENU,
  TARGET,
  terrainMapping,
  HIGHLIGHT_MODE,
  POOL_TYPES,
} from "../../../constants";
import {
  setNewTargetTilebyDirection,
  combineToEntity,
} from "../../../logics/move";
import { TileHighlight } from "../../objects/TileHighlight";
import {
  isBuilding,
  isRole,
  selectFirstHost,
  selectNextHost,
} from "../../../logics/entity";
import { getHostPosition } from "../../../logics/path";
import { getTargetTerrainData, TileData } from "../../../logics/terrain";
import { Role } from "../../objects/Role";
import { GuiBase } from "../../ui/GuiBase";
import { SceneObject } from "../../objects/SceneObject";
import { UIConfig } from "../ui/common/UIConfig";
import { Observer as ObserverObject } from "../../objects/Observer";
import { UIController } from "./UIController";
import { Cursor } from "../../objects/Cursor";

export class SceneObjectController {
  static scene: GameScene;
  static cursor?: Cursor;
  static cursorMoveInterval: number = 125;
  static cursorLastDate: number = 0;
  static observer?: ObserverObject;
  private static _focus?: SceneObject;

  /** Is sceneobject controller can use now */
  private static _controllable: boolean = true;

  static init(scene?: GameScene) {
    if (scene) this.scene = scene;
    this.cursor = this.scene.cursor;
    this.focus = this.observer = new ObserverObject(this.scene, OBSERVER);
  }

  static get focus(): SceneObject | undefined {
    return this._focus;
  }

  static set focus(obj: SceneObject | undefined) {
    if (this._focus === obj) return;
    if (this._focus) this._focus.onBlur();
    this._focus = obj;
    if (this._focus) this._focus.onFocus();
  }

  static resetFocus() {
    this.focus = this.observer;
  }

  static get controllable(): boolean {
    return this._controllable;
  }

  static set controllable(value: boolean) {
    this._controllable = value;
  }

  /** */
  static setTargetTilePosition(direction: number) {
    if (Date.now() - this.cursorLastDate < this.cursorMoveInterval) return; // check time interval
    this.cursorLastDate = Date.now();
    setNewTargetTilebyDirection(this.scene.components, direction);
  }

  /**
   * Open the tile highlight of a role
   */
  static openTileHighlight(
    target: Entity,
    alpha: number = 1,
    mode?: string,
    distance?: number,
    width?: number,
    height?: number
  ): TileHighlight {
    if (this.scene.tileHighlights[target]) {
      this.closeTileHighlight(target);
      delete this.scene.tileHighlights[target];
    }
    this.scene.tileHighlights[target] = new TileHighlight(
      target,
      this.scene.components,
      this.scene,
      mode
    );
    this.scene.tileHighlights[target].calcHighlight({
      distance,
      width,
      height,
    });

    this.scene.tileHighlights[target].show(alpha);
    return this.scene.tileHighlights[target];
  }

  /**
   * Close the tile highlight of a role
   */
  static closeTileHighlight(target: Entity | undefined) {
    if (target && this.scene.tileHighlights[target]) {
      this.scene.tileHighlights[target].hide();
    }
  }
}
