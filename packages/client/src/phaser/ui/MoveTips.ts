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

/**
 * Show the tips and tiles highlight when roles move
 */
export class MoveTips extends GuiBase {
  role?: Role;
  path?: Coord[] | null;
  tipsText: string;
  fakeObj?: Role;

  /** */
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

    this.tipsText =
      "Please move to the adjacent tile before entering a building!";

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

  show(role: Role, prevGui?: GuiBase) {
    super.show();
    this.onMenuListen();
    this.role = role;
    this.prevGui = prevGui;
    // Bundle a copy of role to cursor
    this.fakeObj = SceneObjectController.cursor?.setAccessory(
      this.role.entity
    ) as Role;
    this.fakeObj.setPosition(0, 0).alpha = 0.75;
    this.fakeObj.y -= 3;
    this.fakeObj.doWalkAnimation();
    this.fakeObj.faceDirection = this.role.faceDirection;
    SceneObjectController.openTileHighlight(role.entity);
    PlayerInput.onlyListenUI();
  }

  hidden() {
    this.offMenuListen();
    super.hidden();
  }

  showTips() {
    const enterTips = new Heading2(this.scene, this.tipsText, {
      alignModeName: ALIGNMODES.MIDDLE_CENTER,
      marginY: -100,
      parent: this.rootUI,
    });
    enterTips.alpha = 0;
    enterTips.alpha = 0;
    const y = enterTips.y;
    this.scene.tweens.add({
      targets: enterTips,
      alpha: 1,
      y: y - 100,
      duration: 300,
      completeDelay: 1000,
      onComplete: () => {
        this.scene.tweens.add({
          targets: enterTips,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            enterTips.destroy();
          },
        });
      },
    });
  }

  onUp() {
    SceneObjectController.setTargetTilePosition(Direction.UP);
    const cursor = SceneObjectController.scene.cursor;
    if (cursor) this.onArrow(cursor.tileX, cursor.tileY - 1);
  }
  onDown() {
    SceneObjectController.setTargetTilePosition(Direction.DOWN);
    const cursor = SceneObjectController.scene.cursor;
    if (cursor) this.onArrow(cursor.tileX, cursor.tileY + 1);
  }
  onLeft() {
    SceneObjectController.setTargetTilePosition(Direction.LEFT);
    const cursor = SceneObjectController.scene.cursor;
    if (cursor) this.onArrow(cursor.tileX - 1, cursor.tileY);
  }
  onRight() {
    SceneObjectController.setTargetTilePosition(Direction.RIGHT);
    const cursor = SceneObjectController.scene.cursor;
    if (cursor) this.onArrow(cursor.tileX + 1, cursor.tileY);
  }

  onArrow(tileX: number, tileY: number) {
    if (!this.role) return;

    // fakeObj face direction
    if (tileX < this.role.tileX) this.fakeObj?.turnFaceDirection("left");
    else if (tileX > this.role.tileX) this.fakeObj?.turnFaceDirection("right");

    // update highligt
    const highlights =
      SceneObjectController.scene.tileHighlights[this.role.entity];
    if (this.path) highlights.recoveryType(this.path);
    this.path = calculatePathCoords(
      this.components,
      this.systemCalls,
      this.role.entity
    );
    // path length limit = move length limit + 1
    if (!this.path || this.path.length > MAX_MOVES + 1) return;
    this.path.forEach((coord) => {
      coord.x -= this.role?.tileX ?? 0;
      coord.y -= this.role?.tileY ?? 0;
    });
    highlights.changeTypeByCoords("build", this.path);
  }

  onConfirm() {
    const cursor = SceneObjectController.cursor;
    if (!this.role || !cursor) return;

    // get the steps to move
    const moves = calculatePathMoves(
      this.components,
      this.systemCalls,
      this.role.entity
    );

    // only move
    if (moves && moves.length > 0 && moves.length <= MAX_MOVES) {
      // Post to chain
      this.systemCalls.move(this.role.entity as Hex, moves as number[]);

      // Flag the role state
      this.role.isMoving = true;

      // Play move animation
      this.role.movesAnimation(moves);
    } else {
      const something = getEntityOnCoord(this.components, cursor.tilePosition);
      if (isBuilding(this.components, something)) {
        // only build
        const canEnter = canStoreERC721(
          this.components,
          this.role.entity,
          something
        );
        if (canEnter) {
          const adjacentCoord = getRoleAndHostAdjacentCoord(
            this.components,
            this.role.entity,
            something
          );
          if (adjacentCoord) {
            this.systemCalls.enterBuilding(
              this.role.entity as Hex,
              adjacentCoord
            );
          } else {
            this.tipsText =
              "Please move to the adjacent tile before entering a building!";
            this.showTips();
            return;
          }
        } else {
          this.tipsText = "You can't enter this building!";
          this.showTips();
          return;
        }
      } else return;
    }

    // Clear the fake role
    cursor.clearAccessory(this.role.entity);

    // Update tile highlight
    const highlights =
      SceneObjectController.scene.tileHighlights[this.role.entity];
    if (this.path) highlights.clearPartHighlight(this.path);
    else SceneObjectController.closeTileHighlight(this.role.entity);

    // Close the GUI
    this.hidden();

    // Scene focus back to the observer
    SceneObjectController.resetFocus();
    PlayerInput.onlyListenSceneObject();
  }

  onCancel() {
    // Update GUI
    this.hidden();
    this.prevGui?.show();

    // Clear copy object
    if (!this.role) return;
    SceneObjectController.closeTileHighlight(this.role.entity);
    SceneObjectController.cursor?.clearAccessory(this.role.entity);

    // Reset the target tile
    setNewTargetTile(this.components, this.role.tilePosition);
  }
}
