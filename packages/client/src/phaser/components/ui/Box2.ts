import { UIImage, UIImageConfig } from "./common/UIImage";

export class Box2 extends UIImage {
  constructor(scene: Phaser.Scene, config: UIImageConfig = {}) {
    super(scene, "ui-box-title-out-side2", { nineSlice: 24, ...config });
  }
}
