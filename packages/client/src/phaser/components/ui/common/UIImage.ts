import { UIBase, UIBaseConfig } from "./UIBase";

export interface UIImageConfig extends UIBaseConfig {
  nineSlice?: number | number[];
  frame?: any;
  maskMode?: boolean;
}

export class UIImage extends UIBase {
  image: Phaser.GameObjects.Sprite | Phaser.GameObjects.NineSlice;
  maskMode: boolean;
  imgMaskGraphics?: Phaser.GameObjects.Graphics;
  imgMask?: Phaser.Display.Masks.GeometryMask;

  constructor(
    scene: Phaser.Scene,
    texture: string,
    config: UIImageConfig = {}
  ) {
    super(scene, { texture, ...config });
    this.maskMode = config.maskMode ?? true;
    const { nineSlice = 0 } = config;
    const [leftWidth = 0, rightWidth = 0, topHeight = 0, bottomHeight = 0] =
      Array.isArray(nineSlice)
        ? nineSlice
        : [nineSlice, nineSlice, nineSlice, nineSlice];
    if (nineSlice) {
      this.image = new Phaser.GameObjects.NineSlice(
        scene,
        0,
        0,
        texture,
        undefined,
        this.displayWidth / this.scale,
        this.displayHeight / this.scale,
        leftWidth,
        rightWidth,
        topHeight,
        bottomHeight
      ).setOrigin(0, 0); // [TODO] Make new nine slice way can let the side loop like the tilemap
    } else {
      this.image = new Phaser.GameObjects.Sprite(scene, 0, 0, texture);
      this.image.setOrigin(0, 0);
      this.image.setDisplaySize(
        this.displayWidth / this.scale,
        this.displayHeight / this.scale
      );
    }

    // if (this.maskMode) {
    //   this.imgMaskGraphics = new Phaser.GameObjects.Graphics(scene);
    //   this.imgMask = new Phaser.Display.Masks.GeometryMask(
    //     scene,
    //     this.imgMaskGraphics
    //   );
    //   this.image.setMask(this.imgMask);
    // }

    this.root.add(this.image);
  }

  /**
   * Sets the horizontal and vertical flipped state of this image.
   * @param x The horizontal flipped state. `false` for no flip, or `true` to be flipped.
   * @param y The horizontal flipped state. `false` for no flip, or `true` to be flipped. If not set it will use the `x` value.
   */
  setFlip(x: boolean, y: boolean = x): UIImage {
    if (this.image instanceof Phaser.GameObjects.NineSlice) return this;
    this.image.setFlip(x, y);
    return this;
  }

  setTexture(texture: string): UIImage {
    this.texture = texture;
    this.image.setTexture(texture);
    this.updatePosition();
    return this;
  }

  setSlices(
    width?: number,
    height?: number,
    leftWidth?: number,
    rightWidth?: number,
    topHeight?: number,
    bottomHeight?: number,
    skipScale9?: boolean
  ) {
    if (this.image instanceof Phaser.GameObjects.NineSlice) {
      this.setSize(width ?? this.width, height ?? this.height);
      this.image.setSlices(
        width ?? this.image.width,
        height ?? this.image.height,
        leftWidth ?? this.image.leftWidth,
        rightWidth ?? this.image.rightWidth,
        topHeight ?? this.image.topHeight,
        bottomHeight ?? this.image.bottomHeight,
        skipScale9
      );
      this.updatePosition();
    }
  }

  play(
    key:
      | string
      | Phaser.Animations.Animation
      | Phaser.Types.Animations.PlayAnimationConfig,
    ignoreIfPlaying?: boolean
  ) {
    if (this.image instanceof Phaser.GameObjects.NineSlice) return;
    this.image.play(key, ignoreIfPlaying);
  }

  playAfterDelay(
    key:
      | string
      | Phaser.Animations.Animation
      | Phaser.Types.Animations.PlayAnimationConfig,
    delay: number
  ) {
    if (this.image instanceof Phaser.GameObjects.NineSlice) return;
    this.image.playAfterDelay(key, delay);
  }

  //===========================================
  //    Simplified writing for ease of use
  //===========================================
  get flipX() {
    if (this.image instanceof Phaser.GameObjects.NineSlice) return false;
    return this.image.flipX;
  }

  set flipX(value: boolean) {
    if (this.image instanceof Phaser.GameObjects.NineSlice) return;
    this.image.setFlipX(value);
  }

  get flipY() {
    if (this.image instanceof Phaser.GameObjects.NineSlice) return false;
    return this.image.flipY;
  }

  set flipY(value: boolean) {
    if (this.image instanceof Phaser.GameObjects.NineSlice) return;
    this.image.setFlipY(value);
  }

  get anims(): Phaser.Animations.AnimationState | undefined {
    if (this.image instanceof Phaser.GameObjects.NineSlice) return undefined;
    return this.image.anims;
  }
}
