import { UIScene } from "../../scenes/UIScene";
import { GuiBase } from "../GuiBase";
import { ALIGNMODES } from "../../../constants";
import { UIBase } from "../../components/ui/common/UIBase";
import { MainMenuTitle } from "../../components/ui/MainMenuTitle";
import { Box } from "../../components/ui/Box";

export class DoublePage extends GuiBase {
  left: UIBase;
  right: UIBase;
  titleL: MainMenuTitle;
  titleR: MainMenuTitle;
  contentL: UIBase;
  contentR: UIBase;

  pageW: number;
  pageH: number;
  contentW: number;

  constructor(
    scene: UIScene,
    parent?: GuiBase,
    titleNameLeft?: string,
    titleNameRight?: string
  ) {
    super(
      scene,
      new UIBase(scene, {
        width: 1240,
        height: 720,
        alignModeName: ALIGNMODES.MIDDLE_CENTER,
        marginY: 36,
        parent: parent?.rootUI,
      })
    );
    this.name = "DoublePage";
    this.parent = parent;
    this.rootUI.setDepth(11);

    // Page
    this.pageW = 580;
    this.pageH = 720;
    this.left = new UIBase(scene, {
      width: this.pageW,
      height: this.pageH,
      parent: this.rootUI,
    });
    this.right = new UIBase(scene, {
      width: this.pageW,
      height: this.pageH,
      parent: this.rootUI,
      alignModeName: ALIGNMODES.RIGHT_TOP,
    });

    // Title
    this.titleL = new MainMenuTitle(scene, titleNameLeft ?? "", {
      parent: this.left,
    });
    this.titleR = new MainMenuTitle(scene, titleNameRight ?? "", {
      parent: this.right,
    });
    if (!titleNameLeft) this.titleL.visible = false;
    if (!titleNameRight) this.titleR.visible = false;

    // Content
    this.contentW = Math.ceil(this.pageW * 1);
    this.contentL = new UIBase(scene, {
      width: this.contentW,
      height: titleNameLeft ? Math.ceil(this.pageH * 0.8) : this.pageH,
      marginY: titleNameLeft ? this.pageH * 0.2 : 0,
      alignModeName: ALIGNMODES.MIDDLE_TOP,
      parent: this.left,
    });
    this.contentR = new UIBase(scene, {
      width: this.contentW,
      height: titleNameRight ? Math.ceil(this.pageH * 0.8) : this.pageH,
      marginY: titleNameRight ? this.pageH * 0.2 : 0,
      alignModeName: ALIGNMODES.MIDDLE_TOP,
      parent: this.right,
    });
  }
}
