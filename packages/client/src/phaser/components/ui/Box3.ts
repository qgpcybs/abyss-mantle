import { UIImage, UIImageConfig } from "./common/UIImage";

export class Box3 extends UIImage {
  constructor(scene: Phaser.Scene, config: UIImageConfig = {}) {
    super(scene, "ui-box3", { nineSlice: 9, ...config });
  }
}
