import { UISlider, UISliderConfig } from "./common/UISlider";
import { Entity } from "@latticexyz/recs";
import { getPoolAmount, getPoolCapacity } from "../../../logics/pool";
import { POOL_TYPES } from "../../../constants";

export class HpBar extends UISlider {
  constructor(scene: Phaser.Scene, config: UISliderConfig = {}) {
    super(scene, "bar_empty", "bar_red", undefined, {
      trackNineSlice: 6,
      filledTrackNineSlice: 6,
      ...config,
    });
  }

  updateComponentValues(entity?: Entity) {
    if (!this.components || !this.entity) return;
    if (entity && entity !== this.entity) return;
    this.max = Number(
      getPoolCapacity(this.components, this.entity, POOL_TYPES[2])
    );
    this.value = Number(
      getPoolAmount(this.components, this.entity, POOL_TYPES[2])
    );
  }

  get entity() {
    return super.entity;
  }

  set entity(value: Entity | undefined) {
    super.entity = value;
    this.updateComponentValues();
  }
}
