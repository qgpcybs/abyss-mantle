import { UIImage } from "./UIImage";
import { UIBase } from "./UIBase";
import { UIText, UITextConfig } from "./UIText";
import { ALIGNMODES } from "../../../../constants";

/** The config for UIButton */
export interface UIButtonConfig extends UITextConfig {
  text?: string;
  skinTexture?: string;
  nineSlice?: number | number[];
  hoverSkinTexture?: string;
  hoverSkinNineSlice?: number | number[];
  clickedSkinTexture?: string;
  clickedSkinNineSlice?: number | number[];
}

/** The basic component of the button in UI */
export class UIButton extends UIBase {
  /** The skin of the button on unselected */
  skin: UIImage;
  /** The skin of the button on hoving */
  hoverSkin: UIImage;
  /** The skin of the button on selected */
  clickedSkin: UIImage;
  /** The text content of the button */
  content: UIText;

  /** */
  constructor(scene: Phaser.Scene, config: UIButtonConfig = {}) {
    config.skinTexture = config.skinTexture ?? "ui-empty";
    super(scene, { texture: config.skinTexture, ...config });

    // Clear the config just for the root
    config.alignModeName = undefined;
    config.scale = undefined;
    config.marginX = 0;
    config.marginY = 0;

    // Update the parent to this
    config.parent = this;

    // Init the skins and text
    this.skin = this.initSkin(config);
    this.hoverSkin = this.initHoverSkin(config);
    this.hoverSkin.hidden();
    this.clickedSkin = this.initClickedSkin(config);
    this.clickedSkin.hidden();
    this.content = this.initContent(config);
  }

  //==================================================================
  //    Init
  //==================================================================
  init() {
    super.init();
  }

  initSkin(config: UIButtonConfig): UIImage {
    const texture = config.skinTexture!;
    return new UIImage(this.scene, texture, config);
  }

  initHoverSkin(config: UIButtonConfig): UIImage {
    const texture = config.hoverSkinTexture ?? config.skinTexture!;
    const nineSlice = config.hoverSkinNineSlice ?? config.nineSlice;
    return new UIImage(this.scene, texture, { ...config, nineSlice });
  }

  initClickedSkin(config: UIButtonConfig): UIImage {
    const texture = config.clickedSkinTexture ?? config.skinTexture!;
    const nineSlice = config.clickedSkinNineSlice ?? config.nineSlice;
    return new UIImage(this.scene, texture, { ...config, nineSlice });
  }

  initContent(config: UIButtonConfig): UIText {
    config.alignModeName = ALIGNMODES.LEFT_CENTER;
    return new UIText(this.scene, config.text ?? "", config);
  }

  //==================================================================
  //    Triggers
  //==================================================================
  /** When the button is selected */
  onSelected() {
    super.onSelected();
    this.clickedSkin.show();
    this.skin.hidden();
    this.hoverSkin.hidden();
  }

  /** When the button is unselected */
  onUnSelected() {
    super.onUnSelected();
    if (this.hovering) {
      this.hoverSkin.show();
      this.skin.hidden();
    } else {
      this.skin.show();
      this.hoverSkin.hidden();
    }
    this.clickedSkin.hidden();
  }

  //==================================================================
  //    Getter / Setter
  //==================================================================
  get skinTexture() {
    return this.skin.texture ?? "";
  }

  set skinTexture(value: string) {
    this.skin.setTexture(value);
  }

  get hoverSkinTexture() {
    return this.hoverSkin?.texture ?? "";
  }

  set hoverSkinTexture(value: string) {
    this.hoverSkin?.setTexture(value);
  }

  get clickedSkinTexture() {
    return this.clickedSkin?.texture ?? "";
  }

  set clickedSkinTexture(value: string) {
    this.clickedSkin?.setTexture(value);
  }
}
