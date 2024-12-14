import { Entity } from "@latticexyz/recs";
import { SceneObject } from "./SceneObject";
import { Vector } from "../../utils/vector";
import { splitFromEntity } from "../../logics/move";
import { ClientComponents } from "../../mud/createClientComponents";
import { GameScene } from "../scenes/GameScene";
import { GRID_SIZE_MINE } from "../../contract/constants";

export class Mine extends SceneObject {
  entity: Entity;
  mineSprite: Phaser.GameObjects.TileSprite;
  gridCoord: Vector;

  constructor(
    scene: GameScene,
    components: ClientComponents,
    {
      entity,
      onClick,
    }: {
      entity: Entity;
      onClick: () => void;
    }
  ) {
    super(scene, entity);
    this.entity = entity;

    this.gridCoord = splitFromEntity(entity);
    const position = {
      x: (this.gridCoord.x + 0.5) * GRID_SIZE_MINE * this.tileSize,
      y: (this.gridCoord.y + 0.5) * GRID_SIZE_MINE * this.tileSize,
    };

    this.mineSprite = scene.add
      .tileSprite(position.x, position.y, 0, 0, "mine")
      .setDepth(5);
  }

  destroy() {
    this.mineSprite.destroy();
  }
}
