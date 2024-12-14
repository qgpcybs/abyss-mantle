import { ClientComponents } from "../../mud/createClientComponents";
import {
  calculatePathMoves,
  Direction,
  movesToPositions,
} from "../../logics/move";
import { Entity, ComponentValue, getComponentValue } from "@latticexyz/recs";
import { Hex, hexToString, toHex } from "viem";
import { getPool } from "../../contract/hashes";
import { getPoolAmount, getPoolCapacity } from "../../logics/pool";
import { POOL_COLORS, POOL_TYPES, SOURCE } from "../../constants";
import { GameScene } from "../scenes/GameScene";
import { SceneObject } from "./SceneObject";
import { fromEntity, hexTypeToString } from "../../utils/encode";
import { UIScene } from "../scenes/UIScene";
import { Vector } from "../../utils/vector";
import { UIController } from "../components/controllers/UIController";
import { SceneObjectController } from "../components/controllers/SceneObjectController";
import { BuildingData, BuildingSpecs } from "../../api/data";
import {
  canBuildFromHost,
  getBuildableCoordsInfo,
} from "../../logics/building";
import { getEntitiesInCustodian } from "../../logics/custodian";
import { getEquipment, getEquipmentInfo } from "../../logics/equipment";
import { WEAPON } from "../../contract/constants";
import { UIText } from "../components/ui/common/UIText";

/**
 * About the scene object with avatar such as character or building
 */
export class Role extends SceneObject {
  /**
   * is the main character of player
   */
  isPlayer: boolean;

  /**
   * Is moving on client
   */
  isMoving: boolean;

  /**
   * The display object for host
   */
  avatar: Phaser.GameObjects.Sprite;

  /**
   * the texture without action
   */
  textureKey: string;

  /**
   * The shadow under the host [TODO]
   */
  shadow: Phaser.GameObjects.Shape | undefined = undefined;

  /**
   * the value of properties such as HP
   */
  properties: Map<string, number>;

  /**
   * tilesToMove
   */
  tilesToMove: { x: number; y: number }[] = [];

  /**
   * the side face to
   */
  direction: Direction;

  prevCoord?: Vector;

  totalAttack: number = 0;

  hostName: string;

  /**
   * @param scene the scene belong
   * @param params others
   */
  constructor(
    scene: GameScene,
    entity: Entity,
    {
      isPlayer = false,
      textureKey = "host-farmer1",
      onClick,
    }: {
      isPlayer?: boolean;
      textureKey?: string;
      onClick?: () => void;
    } = {}
  ) {
    super(scene, entity);
    this.isPlayer = isPlayer;
    this.isMoving = false;
    this.properties = new Map();
    this.updateProperties();

    // TODO: different obj has different position calc
    const path = getComponentValue(this.components.Path, entity) ?? {
      toX: 0,
      toY: 0,
    };
    this.setTilePosition(path.toX, path.toY);
    this.root.setDepth(13);

    // draw avatar & set animation
    this.direction = Direction.DOWN;
    this.textureKey = textureKey;
    this.avatar = new Phaser.GameObjects.Sprite(scene, 0, 0, this.textureKey);
    this.avatar.setOrigin(0.46, 0.7);
    this.root.add(this.avatar);

    // name
    this.hostName =
      getComponentValue(this.components.HostName, entity)?.name ?? "";
    const textObj = new Phaser.GameObjects.Text(scene, 0, -28, this.hostName, {
      fontFamily: "ThaleahFat",
      fontSize: 24 + "px",
      color: "#eee",
    });
    textObj.setScale(0.25);
    this.root.add(textObj);
    this.root.bringToTop(textObj);
    textObj.x -= textObj.width / 8;

    this.initState();
  }

  initState() {
    this.moveTween?.destroy();
    delete this.moveTween;
    this.doIdleAnimation();
    this.avatar.clearTint();
    this.scene.sortFlag = true; // sort rendering order
  }

  onFocus() {
    super.onFocus();
  }

  onBlur() {
    super.onBlur();
    // UIController.scene.characterInfo?.hidden();
  }

  onCancelPressed(event: KeyboardEvent) {
    super.onCancelPressed(event);
    if (UIController.scene.constructTips?.visible) {
      UIController.scene.constructTips.hidden();
      UIController.scene.constructMenu?.show(this);
    }
  }

  turnFaceDirection(direction: string) {
    if (direction === "right") {
      this.avatar.flipX = false;
      this.avatar.setOrigin(0.46, 0.7);
    } else {
      this.avatar.flipX = true;
      this.avatar.setOrigin(0.54, 0.7);
    }
  }

  faceTo(target: SceneObject) {
    const dx = this.tileX - target.tileX;
    if (dx < 0) this.turnFaceDirection("right");
    else if (dx > 0) this.turnFaceDirection("left");
  }

  get faceDirection(): string {
    return this.avatar.flipX ? "left" : "right";
  }

  set faceDirection(value: string) {
    this.turnFaceDirection(value);
  }

  /**
   * Handles a series of movement animations with direction changes for
   * the Host object until the movement is confirmed by the chain.
   * @param moves A series of arrays representing directions
   */
  movesAnimation(moves: number[]) {
    this.doWalkAnimation();
    const tweenConfig: unknown[] = [];
    let tileX = this.tileX;
    let tileY = this.tileY;
    moves.forEach((move: number) => {
      switch (move) {
        case Direction.UP:
          tileY -= 1;
          break;
        case Direction.DOWN:
          tileY += 1;
          break;
        case Direction.LEFT:
          this.turnFaceDirection("left");
          tileX -= 1;
          break;
        case Direction.RIGHT:
          this.turnFaceDirection("right");
          tileX += 1;
          break;
      }
      tweenConfig.push({
        tileX,
        tileY,
        duration: 175,
        onStart: () => {
          this.scene.sortFlag = true; // sort rendering order
        },
      });
    });
    this.moveTween = this.scene.tweens.chain({
      targets: this,
      tweens: tweenConfig,
      onComplete: () => {
        if (this.isMoving) {
          this.avatar.setTint(0x808080);
          this.scene.sortFlag = true; // sort rendering order
          delete this.moveTween;
        } else {
          this.initState();
        }
      },
    });
  }

  /**
   * Construct a building
   * If action success return true, else return false
   */
  construct(buildingType: Hex): boolean {
    const cursor = this.scene.cursor;
    if (!cursor) return false;
    const lowerCoord = { x: cursor.tileX, y: cursor.tileY };
    const adjacentCoord = canBuildFromHost(
      this.components,
      this.systemCalls,
      this.entity,
      lowerCoord,
      buildingType
    );
    if (!adjacentCoord) return false;
    this.systemCalls.buildBuilding(
      this.entity as Hex,
      buildingType,
      adjacentCoord,
      lowerCoord
    );
    // [TODO] Need to add animation about construct here.
    return true;
  }

  directionUpdate() {
    this.doIdleAnimation();
  }

  doWalkAnimation() {
    return this.avatar.play(this.textureKey + "-walk-right");
  }

  doIdleAnimation() {
    // this.direction =
    //   getComponentValue(this.components.RoleDirection, this.entity)?.value ??
    //   Direction.DOWN;
    // if (this.direction === Direction.LEFT) this.avatar.flipX = true;
    // if (this.direction === Direction.RIGHT) this.avatar.flipX = false;
    return this.avatar.play(this.textureKey + "-idle-right");
  }

  doAttackAnimation(
    callback?: () => void,
    times: number = 1,
    weaponType?: string
  ) {
    if (!weaponType) {
      const weapon = getEquipment(this.components, this.entity, WEAPON);
      if (!weapon) weaponType = "attack";
      else {
        // const info = getEquipmentInfo(this.components, weapon);
        const { type, id } = fromEntity(weapon as Hex);
        weaponType = hexTypeToString(type);
      }
    }
    this.avatar.once("animationcomplete", () => {
      if (callback) callback();
      this.doIdleAnimation();
    });
    return this.avatar.play({
      key: this.textureKey + "-" + weaponType + "-right",
      repeat: times - 1,
    });
  }

  doDamageAnimation() {
    this.scene.tweens.add({
      targets: this,
      props: { ["tint"]: 0xff0000 },
      duration: 250,
      repeat: 0,
      yoyo: true,
      onComplete: () => {
        this.avatar.clearTint();
      },
    });
    return this.avatar;
  }

  doFarmingAnimation(callback?: () => void) {
    this.avatar.once("animationcomplete", () => {
      if (callback) callback();
      this.doIdleAnimation();
    });
    return this.avatar.play({
      key: this.textureKey + "-farming-right",
      repeat: 0,
    });
  }

  destroy() {
    if (!this.fake) {
      this.scene.tileHighlights[this.entity]?.hide();
      delete this.scene.tileHighlights[this.entity];
    }
    this.moveTween?.destroy();
    this.avatar.destroy();
  }

  setPropertyValue(type: Hex, entityId: number) {
    const amount = getPoolAmount(this.components, this.entity, type);
    const capacity = getPoolCapacity(this.components, this.entity, type);
    const typeName = hexToString(type, { size: 32 });
    this.properties.set(typeName, Number(amount));
    this.properties.set("max" + typeName, Number(capacity));
  }

  /**
   * update the properties
   */
  updateProperties() {
    const entityId = Number(fromEntity(this.entity as Hex).id);
    POOL_TYPES.forEach((type, index) => {
      this.setPropertyValue(type, entityId);
    });
  }

  get tint() {
    return this.avatar.tint;
  }

  set tint(value: number) {
    this.avatar.setTint(value);
  }
}
