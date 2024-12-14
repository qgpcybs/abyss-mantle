import { ClientComponents } from "../../mud/createClientComponents";
import { Entity, getComponentValue, setComponent } from "@latticexyz/recs";
import { GameScene } from "../scenes/GameScene";
import { combineToEntity, Direction } from "../../logics/move";
import { getHostPosition } from "../../logics/path";
import { TARGET } from "../../constants";
import { SystemCalls } from "../../mud/createSystemCalls";
import { Role } from "./Role";
import { UIEmitter } from "../components/ui/common/UIEmitter";

/**
 * The object perpare to scene
 */
export class SceneObject extends UIEmitter {
  /**
   * [MUD] entity
   */
  entity: Entity;

  /**
   * [MUD] components
   */
  components: ClientComponents;

  /**
   * [MUD] systemCalls
   */
  systemCalls: SystemCalls;

  /**
   * Which scene is this object in
   */
  scene: GameScene;

  /**
   * Tile size of the scene
   */
  tileSize: number;

  /**
   * Width by tile
   */
  tileWidth: number = 1;

  /**
   * Height by tile
   */
  tileHeight: number = 1;

  /**
   * Capable of being moved
   */
  movable: boolean = false;

  /**
   * Whether other objects can pass through this object
   */
  passable: boolean = true;

  /**
   * Other scene objects can be added to the root of this object
   */
  accessories: Record<Entity, SceneObject> = {};

  /**
   * The tween of move to effect
   */
  moveTween: Phaser.Tweens.Tween | Phaser.Tweens.TweenChain | undefined;

  fake: boolean = false;

  /**
   * @param scene the scene belong
   * @param entity the scene object's entity
   */
  constructor(scene: GameScene, entity: Entity) {
    super(scene);
    this.scene = scene;
    this.entity = entity;
    this.components = scene.components;
    this.systemCalls = scene.systemCalls;
    this.tileSize = scene.tileSize;
    scene.add.existing(this.root);
  }

  /**
   * Move to the target coord with tween
   * @param toX target x coord
   * @param toY target y coord
   */
  moveTo(
    toX: number,
    toY: number,
    duration: number = 90,
    onComplete?: () => void
  ) {
    if (this.moveTween) this.moveTween.destroy();
    this.moveTween = this.scene.tweens.add({
      targets: this,
      x: toX,
      y: toY,
      duration: duration,
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });
  }

  follow() {
    this.scene.cameras.main.startFollow(this.root, true);
  }

  unfollow() {
    this.scene.cameras.main.startFollow(this.root, false);
  }

  setPosition(x: number, y: number): SceneObject {
    this.x = x;
    this.y = y;
    return this;
  }

  setTilePosition(x: number, y: number): SceneObject {
    this.tileX = x;
    this.tileY = y;
    return this;
  }

  setDepth(depth: number): SceneObject {
    this.root.setDepth(depth);
    return this;
  }

  /**
   * Mount several scene objects on the root container
   */
  add(children: SceneObject | SceneObject[]): SceneObject {
    if (Array.isArray(children)) {
      for (const i in children) this.root.add(children[i].root);
    } else {
      this.root.add(children.root);
    }
    return this;
  }

  /**
   * Remove the scene object on the root container
   */
  remove(child: SceneObject, destroyChild?: boolean): SceneObject {
    this.root.remove(child.root, destroyChild);
    return this;
  }

  /**
   * Removes the Game Object at the given position on the root container
   */
  removeAt(index: number, destroyChild?: boolean): SceneObject {
    this.root.removeAt(index, destroyChild);
    return this;
  }

  /**
   * Removes all Game Objects from this Container.
   */
  removeAll(destroyChild?: boolean): SceneObject {
    this.root.removeAll(destroyChild);
    return this;
  }

  destroy() {
    this.root.destroy();
  }

  /**
   * Removes and Destroy all Game Objects from this Container.
   */
  destroyChildren(): SceneObject {
    this.root.removeAll(true);
    return this;
  }

  /**
   * Add a scene object as accessory (Temp: Only for 'Role' now)
   * @param entity the entity of accessory
   * @returns the accesory object
   */
  setAccessory(entity: Entity): SceneObject {
    this.clearAccessory(entity);
    const fakeObj = new Role(this.scene, entity);
    fakeObj.fake = true;
    this.accessories[entity] = fakeObj;
    this.add(fakeObj);
    return fakeObj;
  }

  /**
   * Remove the accessory
   * @param entity the entity of accessory
   */
  clearAccessory(entity: Entity) {
    if (!this.accessories[entity]) return;
    this.remove(this.accessories[entity], true);
    this.accessories[entity].destroy();
    delete this.accessories[entity];
  }

  /**
   * Put the accessory from parent to the scene
   * @param entity the entity of accessory
   * @returns the accesory object or undefined if not exist
   */
  putAccessory(entity: Entity): SceneObject | undefined {
    const accessory = this.accessories[entity];
    if (!accessory) return undefined;
    this.remove(accessory);
    accessory.setPosition(this.x + accessory.x, this.y + accessory.y);
    this.scene.add.existing(accessory.root);
    return accessory;
  }

  get x() {
    return this.root.x;
  }

  set x(value: number) {
    this.root.x = value;
  }

  get y() {
    return this.root.y;
  }

  set y(value: number) {
    this.root.y = value;
  }

  get position(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  set position({ x, y }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
  }

  get tileX() {
    return Math.round(this.x / this.tileSize - 0.5);
  }

  set tileX(value: number) {
    this.x = (value + 0.5) * this.tileSize;
  }

  get tileY() {
    return Math.round(this.y / this.tileSize - 0.5);
  }

  set tileY(value: number) {
    this.y = (value + 0.5) * this.tileSize;
  }

  get tilePosition(): { x: number; y: number } {
    return { x: this.tileX, y: this.tileY };
  }

  set tilePosition({ x, y }: { x: number; y: number }) {
    this.tileX = x;
    this.tileY = y;
  }

  get alpha() {
    return this.root.alpha;
  }

  set alpha(value: number) {
    this.root.setAlpha(value);
  }

  get visible() {
    return this.root.visible;
  }

  set visible(value: boolean) {
    this.root.setVisible(value);
  }
}
