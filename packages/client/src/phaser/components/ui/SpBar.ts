import { UISlider, UISliderConfig } from "./common/UISlider";

export class SpBar extends UISlider {
  constructor(scene: Phaser.Scene, config: UISliderConfig = {}) {
    super(scene, "bar_empty", "bar_yellow", undefined, {
      trackNineSlice: 6,
      filledTrackNineSlice: 6,
      ...config,
    });
  }
}
