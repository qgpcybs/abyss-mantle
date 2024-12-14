import { UIImage } from "./UIImage";
import { UIBase, UIBaseConfig } from "./UIBase";
import { GameObjects } from "phaser";
import { ALIGNMODES } from "../../../../constants";

export interface UISliderConfig extends UIBaseConfig {
  min?: number; // default 0
  max?: number; // default 100
  defaultValue?: number; // default same to max
  step?: number; // default 1
  vertical?: boolean; // default false
  trackNineSlice?: number | number[];
  trackWidth?: number;
  trackHeight?: number;
  filledTrackNineSlice?: number | number[];
  filledTrackWidth?: number;
  filledTrackHeight?: number;
  thumbAlignMode?: number; // 0: left, 1: middle, 2: right, default 1
  thumbWidth?: number;
  thumbHeight?: number;
  maskMode?: boolean;
  onChange?: () => void;
}

/**
 * Graphical display of numerical percentages such as blood bars, stamina slots
 */
export class UISlider extends UIBase {
  protected _min: number;
  protected _max: number;
  protected _value: number;

  track: UIImage; // The empty part of the slider
  trackTexture: string;

  filledTrack?: UIImage; // The filled part of the slider
  filledTrackTexture?: string;

  thumb?: UIImage; // The handle that's used to change the slider value.
  thumbTexture?: string;
  thumbAlignMode: number = 0; // 0: left, 1: middle, 2: right

  step: number;
  vertical: boolean = false;
  maskMode: boolean;
  filledMaskGraphics?: Phaser.GameObjects.Graphics;
  filledMask?: Phaser.Display.Masks.GeometryMask;
  onChange?: () => void;

  constructor(
    scene: Phaser.Scene,
    trackTexture: string = "ui-empty",
    filledTrackTexture: string = "ui-empty",
    thumbTexture?: string,
    config: UISliderConfig = {}
  ) {
    super(scene, { texture: trackTexture, ...config });
    this.vertical = config.vertical ?? false;

    config.alignModeName = undefined;
    config.scale = undefined;
    config.marginX = 0;
    config.marginY = 0;
    config.parent = this;

    // Init empty track
    this.trackTexture = trackTexture;
    this.track = this.initTrack(
      config,
      trackTexture,
      config.trackNineSlice,
      config.trackWidth,
      config.trackHeight
    );

    // Init filled track
    this.filledTrackTexture = filledTrackTexture;
    this.filledTrack = this.initTrack(
      config,
      filledTrackTexture,
      config.filledTrackNineSlice,
      config.filledTrackWidth,
      config.filledTrackHeight
    );

    // Init thumb
    this.thumbTexture = thumbTexture;
    if (thumbTexture) {
      this.thumb = this.initThumb(
        config,
        thumbTexture,
        config.thumbWidth,
        config.thumbHeight
      );
      this.thumbAlignMode = config.thumbAlignMode ?? 0;

      const offsetY =
        (this.thumb.displayHeight - this.track.displayHeight) /
        (2 * this.thumb.displayHeight);

      if (this.thumbAlignMode === 0) {
        if (this.vertical) {
          this.thumb.image.setOrigin(offsetY, 1);
        } else {
          this.thumb.image.setOrigin(0, offsetY);
        }
      } else if (this.thumbAlignMode === 1) {
        if (this.vertical) {
          this.thumb.image.setOrigin(offsetY, 0.5);
        } else {
          this.thumb.image.setOrigin(0.5, offsetY);
        }
      } else {
        if (this.vertical) {
          this.thumb.image.setOrigin(offsetY, 0);
        } else {
          this.thumb.image.setOrigin(1, offsetY);
        }
      }
    }

    // Init states
    this._min = config.min ?? 0;
    this._max = config.max ?? 100;
    this._value = config.defaultValue ?? this.max;
    this.step = config.step ?? 1;

    // Init the mask of filled track
    this.maskMode = config.maskMode ?? true;
    if (this.maskMode) {
      this.filledMaskGraphics = new GameObjects.Graphics(this.scene);
      this.filledMask = new Phaser.Display.Masks.GeometryMask(
        this.scene,
        this.filledMaskGraphics
      );
      this.filledTrack?.image.setMask(this.filledMask);
    }

    // Update the filled track & the thumb
    this.updateFilledTrack();
  }

  //==================================================================
  //    Init
  //==================================================================
  /** Init the track or the filled track */
  initTrack(
    config: UISliderConfig,
    texture: string,
    nineSlice?: number | number[],
    width?: number,
    height?: number
  ): UIImage {
    width = width ?? this.width;
    height = height ?? this.height;
    const track = new UIImage(this.scene, texture, {
      ...config,
      nineSlice,
      width: this.vertical ? height : width,
      height: this.vertical ? width : height,
      alignModeName: ALIGNMODES.LEFT_TOP,
    });
    if (this.vertical) {
      track.image.setRotation(Math.PI / 2);
      track.image.x += this.width;
    }
    return track;
  }

  /** Init the thumb */
  initThumb(
    config: UISliderConfig,
    texture: string,
    width?: number,
    height?: number
  ) {
    return new UIImage(this.scene, texture, {
      ...config,
      width,
      height,
      alignModeName: ALIGNMODES.LEFT_TOP,
    });
  }

  //==================================================================
  //    Update
  //==================================================================
  updateGlobalPosition() {
    super.updateGlobalPosition();
    this.updateFilledTrack();
  }

  updateFilledTrack() {
    if (!this.filledTrack) return;
    const fillRatio = (this.value - this.min) / (this.max - this.min);
    const filledWidth = this.track.displayWidth * fillRatio;
    if (this.filledMaskGraphics) {
      this.filledMaskGraphics.clear();
      this.filledMaskGraphics.fillRect(
        0,
        0,
        filledWidth * this.globalScaleX,
        this.track.displayHeight * this.globalScaleY
      );
      this.filledMaskGraphics.setPosition(this.globalX, this.globalY);
    } else {
      this.filledTrack.setDisplaySize(
        filledWidth,
        this.displayHeight / this.scale
      );
    }
    if (this.thumb) {
      if (this.vertical) this.thumb.setPosition(0, filledWidth);
      else this.thumb.setPosition(filledWidth, 0);
    }
  }

  //==================================================================
  //    Getter / Setter
  //==================================================================
  get value() {
    return this._value;
  }

  set value(newValue: number) {
    this._value = Phaser.Math.Clamp(newValue, this.min, this.max);
    if (this.onChange) this.onChange();
    this.updateFilledTrack();
  }

  get min() {
    return this._min;
  }

  set min(value: number) {
    this._min = value;
    this.updateFilledTrack();
  }

  get max() {
    return this._max;
  }

  set max(value: number) {
    this._max = value;
    this.updateFilledTrack();
  }
}
