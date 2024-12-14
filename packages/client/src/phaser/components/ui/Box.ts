import { UIImage, UIImageConfig } from "./common/UIImage";

export class Box extends UIImage {
  constructor(scene: Phaser.Scene, config: UIImageConfig = {}) {
    super(scene, "ui-box", { nineSlice: 32, ...config });
  }
}
