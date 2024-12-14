import { Entity, getComponentValue } from "@latticexyz/recs";
import { ClientComponents } from "../../mud/createClientComponents";
import { GameScene } from "../scenes/GameScene";
import { SceneObject } from "./SceneObject";
import { Vector } from "../../utils/vector";
import { splitFromEntity } from "../../logics/move";
import { splitDropContainer } from "../../logics/drop";

export class Drop extends SceneObject {
  dropSprite: Phaser.GameObjects.TileSprite;
  entity: Entity;
  tileCoord: Vector;

  constructor(
    scene: GameScene,
    components: ClientComponents,
    {
      entity,
      onClick,
    }: {
      onClick?: () => void;
      entity: Entity;
    }
  ) {
    super(scene, entity);
    const { EntityType } = components;
    this.entity = entity;
    const { tileX, tileY } = splitDropContainer(BigInt(entity));
    this.tileCoord = { x: tileX, y: tileY };

    this.dropSprite = scene.add
      .tileSprite(
        (this.tileCoord.x + 0.5) * this.tileSize,
        (this.tileCoord.y + 0.3) * this.tileSize,
        0,
        0,
        "safe"
      )
      .setScale(0.4)
      .setDepth(12);
  }

  destroy() {
    this.dropSprite.destroy();
  }
}
