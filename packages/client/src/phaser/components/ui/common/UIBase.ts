import { ALIGNMODES } from "../../../../constants";
import { UIEmitter, UIEmitterConfig } from "./UIEmitter";

export const StandardGameSize = {
  maxWidth: 2240,
  maxHeight: 1260,
  minWidth: 1600,
  minHeight: 900,
};

export interface UIBaseConfig extends UIEmitterConfig {
  texture?: string | Phaser.Textures.Texture;
  alignModeName?: string;
  width?: number;
  height?: number;
  marginX?: number;
  marginY?: number;
  scale?: number;
  parent?: UIBase | undefined;
  overflow?: string;
  antiZoom?: boolean;
}

/**
 * The second basic UI components
 * There is only one root node inherited, which can be used as a container.
 */
export class UIBase extends UIEmitter {
  /** parent UI of this UI  */
  protected _parent: UIBase | undefined;

  /** Scaling, different from scale, for UI adaptive features */
  protected _zoom: number = 1;

  /** The key, or instance of the Texture this Game Object will use to render with, as stored in the Texture Manager.*/
  texture: string | undefined;

  /** The alignments provided in “ALIGNMODES” include LEFT-MIDDLE-RIGHT, TOP-CENTER-BOTTOM. @readonly */
  alignModeName: string;

  /** The horizontal distance (px) to the align position @readonly */
  marginX: number;

  /** The vertical distance (px) to the align position @readonly */
  marginY: number;

  /** Counteracting the zoom adaptive scaling effect */
  antiZoom: boolean;

  /** What to do with the content excess */
  overflow: string;

  /** Component width to exclude zoom scaling */
  configWidth: number;

  /** Component height to exclude zoom scaling */
  configHeight: number;

  /** The global x position of root @readonly */
  globalX: number = 0;

  /** The global y position of root @readonly */
  globalY: number = 0;

  /** The global x scale of root @readonly */
  globalScaleX: number = 1;

  /** The global y scale of root @readonly */
  globalScaleY: number = 1;

  /** Children UIs of this UI  */
  children: UIBase[] = [];

  /** Display area */
  viewport?: Phaser.GameObjects.Graphics;

  /** Mask object for display area */
  mask?: Phaser.Display.Masks.GeometryMask;

  /** */
  constructor(scene: Phaser.Scene, config: UIBaseConfig = {}) {
    super(scene, config);
    this.texture =
      typeof config.texture === "object" ? config.texture.key : config.texture;
    this.alignModeName = config.alignModeName ?? ALIGNMODES.LEFT_TOP;
    this.marginX = config.marginX ?? 0;
    this.marginY = config.marginY ?? 0;
    this.antiZoom = config.antiZoom ?? false;
    this.overflow = config.overflow ?? "auto";
    // Init size and position
    this.parent = config.parent;
    this.configWidth = this.setConfigWidth(config);
    this.configHeight = this.setConfigHeight(config);
    this.setAutoScale(config);
    if (this.antiZoom) {
      this.resizeListener(scene.game.scale.gameSize);
      this.scene?.scale.on("resize", this.resizeListener, this);
    } else this.updatePosition();

    if (this.overflow === "hidden") {
      this.createViewport();
    }

    // Mounts the root on the specified object
    this.init();
  }

  //==================================================================
  //    Init & Display
  //==================================================================
  /**
   * Initialise the rest
   */
  init() {
    // Expand as needed
  }

  /**
   * Show the root container
   */
  show(): UIBase {
    this.visible = true;
    return this;
  }

  /**
   * Hide the root container
   */
  hidden(): UIBase {
    this.visible = false;
    return this;
  }

  /**
   * Init the view port of overflow
   */
  createViewport() {
    this.viewport = new Phaser.GameObjects.Graphics(this.scene);
    this.updateViewport();
    this.mask = new Phaser.Display.Masks.GeometryMask(
      this.scene,
      this.viewport
    );
    this.root.setMask(this.mask);
  }

  //==================================================================
  //    Update props
  //==================================================================
  /**
   * Set coordinates according to alignment
   */
  updatePosition() {
    const referObj = this.parent ?? this.scene.scale;
    const marginX = this.marginX;
    const marginY = this.marginY;
    switch (this.alignModeName) {
      case ALIGNMODES.LEFT_CENTER:
        this.x = marginX;
        this.y = referObj.height / 2 + marginY - this.displayHeight / 2;
        break;
      case ALIGNMODES.LEFT_BOTTOM:
        this.x = marginX;
        this.y = referObj.height - marginY - this.displayHeight;
        break;
      case ALIGNMODES.RIGHT_TOP:
        this.x = referObj.width - marginX - this.displayWidth;
        this.y = marginY;
        break;
      case ALIGNMODES.RIGHT_CENTER:
        this.x = referObj.width - marginX - this.displayWidth;
        this.y = referObj.height / 2 + marginY - this.displayHeight / 2;
        break;
      case ALIGNMODES.RIGHT_BOTTOM:
        this.x = referObj.width - marginX - this.displayWidth;
        this.y = referObj.height - marginY - this.displayHeight;
        break;
      case ALIGNMODES.MIDDLE_TOP:
        this.x = referObj.width / 2 + marginX - this.displayWidth / 2;
        this.y = marginY;
        break;
      case ALIGNMODES.MIDDLE_CENTER:
        this.x = referObj.width / 2 + marginX - this.displayWidth / 2;
        this.y = referObj.height / 2 + marginY - this.displayHeight / 2;
        break;
      case ALIGNMODES.MIDDLE_BOTTOM:
        this.x = referObj.width / 2 + marginX - this.displayWidth / 2;
        this.y = referObj.height - marginY - this.displayHeight;
        break;
      default:
        this.x = marginX;
        this.y = marginY;
        break;
    }
    this.updateGlobalPosition();
    for (let child in this.children) {
      this.children[child].updatePosition();
    }
  }

  /**
   * Update self and all children's global positions and scales
   */
  updateGlobalPosition() {
    this.globalScaleX = this.parent
      ? this.parent.globalScaleX * this.scaleX
      : this.scaleX;
    this.globalScaleY = this.parent
      ? this.parent.globalScaleY * this.scaleY
      : this.scaleY;
    this.globalX = this.parent
      ? this.parent.globalX + this.x * this.parent.globalScaleX
      : this.x;
    this.globalY = this.parent
      ? this.parent.globalY + this.y * this.parent.globalScaleX
      : this.y;
    this.updateViewport();
  }

  /**
   * Update the view port of overflow
   */
  updateViewport() {
    if (!this.viewport) return;
    this.viewport.setPosition(this.globalX, this.globalY);
    this.viewport.clear();
    this.viewport.fillRect(
      0,
      0,
      this.configWidth * this.globalScaleX,
      this.configHeight * this.globalScaleY
    );
  }

  //==================================================================
  //    Listeners
  //==================================================================
  resizeListener(gameSize: Phaser.Structs.Size) {
    this.zoom =
      1 /
      Phaser.Math.Clamp(
        gameSize.width / StandardGameSize.maxWidth,
        StandardGameSize.minWidth / StandardGameSize.maxWidth,
        1
      );
    if (this.configWidth !== -1 && this.configHeight !== -1) {
      this.updatePosition();
    }
  }

  //==================================================================
  //    Set props
  //==================================================================
  /**
   * Set the config width
   */
  setConfigWidth(config: Partial<UIBaseConfig>): number {
    let configWidth = config.width ?? this.configWidth;
    if (configWidth !== -1) {
      const textureObj = config.texture
        ? this.scene.textures.get(config.texture)
        : undefined;
      configWidth = configWidth ?? textureObj?.source[0]?.width ?? 576;
    }
    return configWidth;
  }

  /**
   * Set the config height
   */
  setConfigHeight(config: Partial<UIBaseConfig>): number {
    let configHeight = config.height ?? this.configHeight;
    if (configHeight !== -1) {
      const textureObj = config.texture
        ? this.scene.textures.get(config.texture)
        : undefined;
      configHeight = configHeight ?? textureObj?.source[0]?.height ?? 576;
    }
    return configHeight;
  }

  /**
   * Set the scale, size & display size of the root container
   */
  setAutoScale(config: Partial<UIBaseConfig>): UIBase {
    this.setSize(this.configWidth, this.configHeight);
    this.setDisplaySize(this.configWidth, this.configHeight);
    if (config.scale !== undefined) this.setScale(config.scale);
    return this;
  }

  /**
   * Change the position. Considered unchanged by default.
   * Considering alignment and such, it's not recommended to use it directly
   * unless you're pretty sure there's no problem with the location.
   * @param x new x
   * @param y new y
   */
  setPosition(x: number | undefined, y?: number): UIBase {
    if (x != undefined) this.x = x;
    if (y != undefined) this.y = y;
    this.updateGlobalPosition();
    return this;
  }

  /**
   * Change the margin and synchronize position changes. Considered unchanged by default.
   * @param x new marginX
   * @param y new marginY
   */
  setMargin(x?: number, y?: number): UIBase {
    if (x) this.marginX = x;
    if (y) this.marginY = y;
    this.updatePosition();
    return this;
  }

  /**
   * Modify alignment mode and synchronize position changes
   * @param name the name of alignMode you want to use
   */
  setAlignMode(name: string): UIBase {
    this.alignModeName = name;
    this.updatePosition();
    return this;
  }

  /**
   * Sets the internal size of this Game Object, as used for frame or physics body creation.
   * This will not change the size that the Game Object is rendered in-game. For that you need to call `setScale` or `setDisplaySize` method.
   * @param width The width of this Game Object.
   * @param height The height of this Game Object.
   */
  setSize(width: number, height: number): UIBase {
    if (width >= 0 && height >= 0) {
      this.root.setSize(width, height);
    }
    return this;
  }

  /**
   * Sets the display size of this Game Object. Calling this will adjust the scale.
   * @param width The width of this Game Object.
   * @param height The height of this Game Object.
   */
  setDisplaySize(width: number, height: number): UIBase {
    this.configWidth = width;
    this.configHeight = height;
    if (width >= 0 && height >= 0) {
      this.root.setDisplaySize(width * this.zoom, height * this.zoom);
    }
    this.updatePosition();
    return this;
  }

  /**
   * Sets the scale of this Game Object.
   * @param x The horizontal scale of this Game Object. Default 1.
   * @param y The vertical scale of this Game Object. If not set it will use the `x` value. Default x.
   */
  setScale(x?: number, y?: number): UIBase {
    this.root.setScale(x, y);
    this.configWidth = this.displayWidth / this.zoom;
    this.configHeight = this.displayHeight / this.zoom;
    this.updatePosition();
    return this;
  }

  /**
   * The depth of this Game Object within the Scene.
   * @param value — The depth of this Game Object. Ensure this value is only ever a number data-type.
   */
  setDepth(value: number): UIBase {
    this.root.setDepth(value);
    return this;
  }

  /**
   * Use for the child of Guibase who open the autoZoom
   */
  setZoom(value: number) {
    this._zoom = value;
    if (this.configWidth >= 0 && this.configHeight >= 0) {
      this.root.setDisplaySize(
        this.configWidth * value,
        this.configHeight * value
      );
      this.updatePosition();
    }
  }

  //==================================================================
  //    About the children
  //==================================================================
  /**
   * Mount several basic UI components on the root container
   */
  add(children: UIBase | UIBase[]): UIBase {
    if (Array.isArray(children)) {
      for (const i in children) this.root.add(children[i].root);
    } else {
      this.root.add(children.root);
    }
    return this;
  }

  /**
   * Remove the child on the root container
   */
  remove(children: UIBase | UIBase[], destroyChild?: boolean): UIBase {
    if (Array.isArray(children)) {
      for (const i in children)
        this.root.remove(children[i].root, destroyChild);
    } else {
      this.root.remove(children.root, destroyChild);
    }
    return this;
  }

  /**
   * Removes the UI at the given position on the root container
   */
  removeAt(index: number, destroyChild?: boolean): UIBase {
    this.root.removeAt(index, destroyChild);
    return this;
  }

  /**
   * Removes all childs from this Container.
   */
  removeAll(destroyChild?: boolean): UIBase {
    this.children = [];
    this.root.removeAll(destroyChild);
    return this;
  }

  /**
   * Remove and Destroy all childs in the Container.
   */
  destroyChildren(): UIBase {
    this.children.forEach((child) => {
      child.destroy();
    });
    this.children = [];
    this.root.removeAll(true);
    return this;
  }

  /**
   * Destroy all listeners and the root node
   */
  destroy() {
    this.scene?.scale.off("resize", this.resizeListener, this);
    this.off();
    this.root.destroy();
  }

  //==================================================================
  //    Getter / Setter for protected / private props
  //==================================================================
  get parent() {
    return this._parent;
  }

  set parent(value: UIBase | undefined) {
    if (this.parent) {
      this.parent.root.remove(this.root);
      this.parent.children.splice(this.parent.children.indexOf(this), 1);
    } else {
      this.scene.children.remove(this.root);
    }
    this._parent = value;
    if (value) {
      value.root.add(this.root);
      value.children.push(this);
    } else {
      this.scene.add.existing(this.root);
    }
  }

  get zoom(): number {
    return this._zoom;
  }

  set zoom(value: number) {
    this.setZoom(value);
  }

  //==================================================================
  //    Simplified writing for ease of use
  //==================================================================
  get scene() {
    return this.root.scene;
  }

  get x() {
    return this.root.x;
  }

  set x(value: number) {
    this.root.x = value;
  }

  get y() {
    return this.root.y;
  }

  set y(value: number) {
    this.root.y = value;
  }

  get width() {
    return this.root.width;
  }

  set width(value: number) {
    this.setSize(value, this.root.height);
  }

  get height() {
    return this.root.height;
  }

  set height(value: number) {
    this.setSize(this.root.width, value);
  }

  get displayWidth() {
    return this.root.displayWidth;
  }

  set displayWidth(value: number) {
    this.setDisplaySize(value, this.displayHeight);
  }

  get displayHeight() {
    return this.root.displayHeight;
  }

  set displayHeight(value: number) {
    this.setDisplaySize(this.displayWidth, value);
  }

  get scale() {
    return this.root.scale;
  }

  set scale(value: number) {
    this.setScale(value);
  }

  get scaleX() {
    return this.root.scaleX;
  }

  set scaleX(value: number) {
    this.setScale(value, this.scaleY);
  }

  get scaleY() {
    return this.root.scaleY;
  }

  set scaleY(value: number) {
    this.setScale(this.scaleX, value);
  }

  get alpha() {
    return this.root.alpha;
  }

  set alpha(value: number) {
    this.root.setAlpha(value);
  }

  get visible() {
    return this.root.visible;
  }

  set visible(value: boolean) {
    this.root.setVisible(value);
  }
}
