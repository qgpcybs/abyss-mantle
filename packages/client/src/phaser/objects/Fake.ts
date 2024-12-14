import { Entity } from "@latticexyz/recs";
import { GameScene } from "../scenes/GameScene";
import { SceneObject } from "./SceneObject";
import { GameObjects } from "phaser";

export interface FakeConfig {
  texture: string;
  width?: number;
  height?: number;
}

export class Fake extends SceneObject {
  sprite?: GameObjects.Sprite;
  constructor(scene: GameScene, entity: Entity, config: FakeConfig) {
    super(scene, entity);
    this.fake = true;
    this.sprite = new GameObjects.Sprite(scene, 0, 0, config.texture);
    let offsetX = 0;
    let offsetY = 0;
    if (config.width) {
      const dw = this.sprite.displayWidth;
      offsetX = (dw + (1 - config.width) * this.tileSize) / (2 * dw);
    }
    if (config.height) {
      const dh = this.sprite.displayHeight;
      offsetY = (dh + (1 - config.height) * this.tileSize) / (2 * dh);
    }
    this.sprite.setOrigin(offsetX, offsetY);
    this.root.add(this.sprite);
  }

  flickerEffect() {
    this.root.alpha = 0.85;
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0.7,
      duration: 800,
      repeat: -1,
      yoyo: true,
    });
  }
}
