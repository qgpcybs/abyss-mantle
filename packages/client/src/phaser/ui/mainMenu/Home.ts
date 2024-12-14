import { UIScene } from "../../scenes/UIScene";
import { GuiBase } from "../GuiBase";
import { DoublePage } from "./DoublePage";
import { ALIGNMODES } from "../../../constants";
import { UIBase } from "../../components/ui/common/UIBase";
import { UIEvents } from "../../components/ui/common/UIEvents";
import { UIImage } from "../../components/ui/common/UIImage";
import { PlayerInput } from "../../components/controllers/PlayerInput";
import { SceneObjectController } from "../../components/controllers/SceneObjectController";
import { Box } from "../../components/ui/Box";
import { Heading2 } from "../../components/ui/Heading2";
import { Heading3 } from "../../components/ui/Heading3";
import { MainMenuTitle } from "../../components/ui/MainMenuTitle";

export class Home extends DoublePage {
  address: Heading3;
  constructor(scene: UIScene, parent: GuiBase) {
    super(scene, parent, "Front");
    this.name = "MainMenuHome";

    this.contentL.setAlignMode(ALIGNMODES.MIDDLE_CENTER);

    // Wallet Address
    const addressTitle = new Heading2(this.scene, "Soul", {
      parent: this.contentL,
      width: this.contentW,
      textAlign: "center",
      alignModeName: ALIGNMODES.MIDDLE_TOP,
    });
    this.address = new Heading3(
      this.scene,
      "0x625663645755683647586937457683940567834534",
      {
        parent: addressTitle,
        width: this.contentW,
        textAlign: "center",
        alignModeName: ALIGNMODES.MIDDLE_TOP,
        marginY: addressTitle.fontSize * 1.4,
      }
    );
    this.address.setWordWrapWidth(this.contentW, true);
  }
}
