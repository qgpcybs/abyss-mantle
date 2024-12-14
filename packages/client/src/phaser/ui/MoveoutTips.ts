import { UIScene } from "../scenes/UIScene";
import { GuiBase } from "./GuiBase";
import { ALIGNMODES } from "../../constants";
import { Box2 } from "../components/ui/Box2";
import { Heading2 } from "../components/ui/Heading2";
import { UIText } from "../components/ui/common/UIText";
import { SceneObjectController } from "../components/controllers/SceneObjectController";
import { Role } from "../objects/Role";
import { UIBase } from "../components/ui/common/UIBase";
import {
  calculatePathMoves,
  calculatePathCoords,
  Direction,
  setNewTargetTile,
} from "../../logics/move";
import { Hex } from "viem";
import { Coord } from "../../utils/pathFinding";
import { PlayerInput } from "../components/controllers/PlayerInput";
import { MAX_MOVES } from "../../contract/constants";
import { getEntityOnCoord } from "../../logics/map";
import { isBuilding } from "../../logics/entity";
import { getRoleAndHostAdjacentCoord } from "../../logics/building";
import { canStoreERC721 } from "../../logics/container";
import { Entity } from "@latticexyz/recs";
import { HIGHLIGHT_MODE } from "../../constants";
import { getBuildingCoordToExit } from "../../logics/building";
import { Building } from "../objects/Building";
import { canMoveTo } from "../../logics/map";

export class MoveoutTips extends GuiBase {
  role?: Role;
  building?: Building;
  path?: Coord[] | null;

  constructor(scene: UIScene) {
    super(
      scene,
      new UIBase(scene, {
        width: 660,
        height: scene.game.scale.height,
        alignModeName: ALIGNMODES.MIDDLE_TOP,
      })
    );
    this.name = "MoveTips";
    this.focusUI = this.rootUI;

    const box2 = new Box2(scene, {
      width: 660,
      height: 90,
      marginY: 20,
      alignModeName: ALIGNMODES.MIDDLE_TOP,
      parent: this.rootUI,
    });

    new UIText(scene, "[WASD] / [Arrow] move\n [F] confirm   [X] cancel", {
      fontFamily: "ThaleahFat",
      fontSize: 32,
      fontColor: "#233",
      textAlign: "center",
      lineSpacing: 12,
      alignModeName: ALIGNMODES.MIDDLE_TOP,
      marginY: 16,
      fontStyle: "500",
      parent: box2,
    });
  }

  show(entity: Entity, building?: Building, prevGui?: GuiBase) {
    super.show();
    this.onMenuListen();
    this.building = building;
    this.prevGui = prevGui;
    this.role = SceneObjectController.cursor?.setAccessory(entity) as Role;
    this.role.setPosition(0, 0).alpha = 0.75;
    this.role.y -= 3;
    this.role.doWalkAnimation();
    SceneObjectController.openTileHighlight(
      entity,
      undefined,
      HIGHLIGHT_MODE.MOVEOUT
    );
  }

  hidden() {
    this.offMenuListen();
    if (this.role) {
      SceneObjectController.cursor?.clearAccessory(this.role.entity);
      SceneObjectController.closeTileHighlight(this.role.entity);
    }
    super.hidden();
  }

  onConfirm() {
    const cursor = SceneObjectController.cursor;
    if (!this.role || !this.building || !cursor) return;
    const tileCoord = { x: cursor.tileX, y: cursor.tileY };
    const buildingCoord = getBuildingCoordToExit(
      this.components,
      this.building.entity as Hex,
      tileCoord
    );
    const canMoveToCoord = tileCoord
      ? canMoveTo(this.components, this.systemCalls, tileCoord)
      : false;
    if (!buildingCoord || !canMoveToCoord) return;
    this.systemCalls.exitBuilding(
      this.role.entity as Hex,
      buildingCoord,
      tileCoord
    );

    // Close the GUI
    this.hidden();

    // Scene focus back to the observer
    SceneObjectController.resetFocus();
    PlayerInput.onlyListenSceneObject();
  }

  onCancel() {
    this.hidden();
    this.prevGui?.show();

    // Reset the target tile
    if (this.building)
      setNewTargetTile(this.components, this.building.tilePosition);
  }

  onUp() {
    SceneObjectController.setTargetTilePosition(Direction.UP);
  }
  onDown() {
    SceneObjectController.setTargetTilePosition(Direction.DOWN);
  }
  onLeft() {
    SceneObjectController.setTargetTilePosition(Direction.LEFT);
  }
  onRight() {
    SceneObjectController.setTargetTilePosition(Direction.RIGHT);
  }
}
