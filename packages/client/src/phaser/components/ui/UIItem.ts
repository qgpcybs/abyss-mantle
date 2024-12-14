import { UIBase } from "./common/UIBase";
import { UIButton, UIButtonConfig } from "./common/UIButton";
import { UIImage, UIImageConfig } from "./common/UIImage";
import { UIText } from "./common/UIText";
import { Heading3 } from "./Heading3";
import { ALIGNMODES } from "../../../constants";
import { Entity } from "@latticexyz/recs";

export interface UIItemConfig extends UIButtonConfig {
  amount?: number;
  id?: number;
  entity?: Entity;
  state?: string;
}

export class UIItem extends UIButton {
  bg: UIImage;
  itemType?: string;
  icon?: UIImage;
  amountText: UIText;
  amount: number;
  id?: number;
  nameText: UIText;
  state: string;
  constructor(
    scene: Phaser.Scene,
    itemType?: string,
    config: UIItemConfig = {}
  ) {
    super(scene, {
      width: 328,
      height: 48,
      hoverSkinTexture: "btn_select_skin",
      clickedSkinTexture: "btn_select_skin",
      nineSlice: 16,
      ...config,
    });
    this.bg = new UIImage(scene, "bag-icon-bg", {
      width: 48,
      height: 48,
      parent: this,
    });

    this.itemType = itemType;
    this.id = config.id;
    this.amount = config.amount ?? 0;
    this.state = config.state ?? "";
    this.entity = config.entity;
    this.nameText = new Heading3(
      scene,
      (this.itemType ?? "") + (this.id ? " #" + this.id : ""),
      {
        parent: this,
        marginX: 68,
        fontSize: 24,
        alignModeName: ALIGNMODES.LEFT_CENTER,
      }
    );
    this.amountText = new Heading3(scene, this.amount.toString(), {
      parent: this,
      marginX: 12,
      fontSize: 24,
      alignModeName: ALIGNMODES.RIGHT_CENTER,
    });
    const textX = new Heading3(scene, "X", {
      parent: this,
      fontSize: 14,
      marginX: this.amountText.textObj.width / 4 + 16,
      alignModeName: ALIGNMODES.RIGHT_CENTER,
    });
    if (itemType) {
      this.initIcon("icon-item-" + itemType);
    } else {
      this.amountText.visible = false;
    }

    this.root.bringToTop(this.hoverSkin.root);
    this.root.bringToTop(this.clickedSkin.root);
  }

  initIcon(texture: string) {
    this.icon = new UIImage(this.scene, texture, {
      width: 32,
      height: 32,
      alignModeName: ALIGNMODES.MIDDLE_CENTER,
      parent: this.bg,
    });
    this.amountText.visible = true;
  }

  get iconTexture(): string | undefined {
    return this.icon?.texture;
  }

  set iconTexture(value: string) {
    if (!this.icon) this.initIcon(value);
    else this.icon.setTexture(value);
  }

  initHoverSkin(config: UIButtonConfig): UIImage {
    const width = config.width ? config.width - 56 : 192;
    return super.initHoverSkin({ ...config, marginX: 56, width });
  }

  initClickedSkin(config: UIButtonConfig): UIImage {
    const width = config.width ? config.width - 56 : 192;
    return super.initClickedSkin({ ...config, marginX: 56, width });
  }
}
