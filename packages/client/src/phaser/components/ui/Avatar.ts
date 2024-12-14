import { UIImage, UIImageConfig } from "./common/UIImage";

export class Avatar extends UIImage {
  constructor(
    scene: Phaser.Scene,
    texture: string,
    config: UIImageConfig = {}
  ) {
    super(scene, texture, config);
    this.flipX = true;
  }
}
