import { UIButton, UIButtonConfig } from "./common/UIButton";
import { UIImage } from "./common/UIImage";
import { UIText } from "./common/UIText";
import { ALIGNMODES } from "../../../constants";

/**
 * For the normal menu such as ActionMenu
 */
export class ButtonA extends UIButton {
  text1?: UIText;

  constructor(scene: Phaser.Scene, config: UIButtonConfig = {}) {
    super(scene, {
      width: 356,
      height: 48,
      fontFamily: "ThaleahFat",
      fontSize: 36,
      fontStyle: "600",
      fontColor: "#2D3E51",
      hoverSkinTexture: "btn_select_skin",
      clickedSkinTexture: "btn_select_skin",
      nineSlice: 16,
      ...config,
    });

    // Underline
    new UIImage(scene, "btn_decor1", {
      width: this.content.textObj.width / 4,
      height: 2,
      alignModeName: ALIGNMODES.LEFT_BOTTOM,
      marginX: 82,
      nineSlice: [16, 16, 0, 0],
      parent: this,
    });

    // Circle
    new UIImage(scene, "btn_decor3", {
      width: 24,
      height: 24,
      alignModeName: ALIGNMODES.LEFT_CENTER,
      marginX: 40,
      parent: this,
    });

    // Circle naka
    new UIImage(scene, "btn_decor2", {
      width: 12,
      height: 12,
      alignModeName: ALIGNMODES.LEFT_CENTER,
      marginX: -22,
      parent: this.clickedSkin,
    });

    // Arrow
    const arrow = new UIImage(scene, "btn_decor4", {
      width: 32,
      height: 32,
      alignModeName: ALIGNMODES.LEFT_CENTER,
      marginX: -58,
      parent: this.clickedSkin,
    });
    scene.tweens.add({
      targets: arrow.root,
      x: arrow.x - 6,
      duration: 600,
      repeat: -1,
      yoyo: true,
    });

    this.root.bringToTop(this.content.root);
  }

  initSkin(config: UIButtonConfig): UIImage {
    const width = config.width ? config.width - 68 : 192;
    return super.initSkin({ ...config, marginX: 68, width });
  }

  initHoverSkin(config: UIButtonConfig): UIImage {
    const width = config.width ? config.width - 68 : 192;
    return super.initHoverSkin({ ...config, marginX: 68, width });
  }

  initClickedSkin(config: UIButtonConfig): UIImage {
    const width = config.width ? config.width - 68 : 192;
    return super.initClickedSkin({ ...config, marginX: 68, width });
  }

  initContent(config: UIButtonConfig): UIText {
    return super.initContent({ ...config, marginX: 82 });
  }

  setDisable(value: boolean) {
    super.setDisable(value);
    if (value) this.alpha = 0.5;
    else this.alpha = 1;
  }
}
