import { UIScene } from "../../scenes/UIScene";
import { GuiBase } from "../GuiBase";
import { DoublePage } from "./DoublePage";
import { ALIGNMODES } from "../../../constants";
import { UIBase, StandardGameSize } from "../../components/ui/common/UIBase";
import { UIEvents } from "../../components/ui/common/UIEvents";
import { UIImage } from "../../components/ui/common/UIImage";
import { UIText } from "../../components/ui/common/UIText";
import { UIList } from "../../components/ui/common/UIList";
import { PlayerInput } from "../../components/controllers/PlayerInput";
import { SceneObjectController } from "../../components/controllers/SceneObjectController";
import { Box } from "../../components/ui/Box";
import { BookListButton } from "../../components/ui/BookListButton";
import { Heading2 } from "../../components/ui/Heading2";
import { Heading3 } from "../../components/ui/Heading3";
import { MainMenuTitle } from "../../components/ui/MainMenuTitle";
import {
  runQuery,
  HasValue,
  Entity,
  getComponentValue,
} from "@latticexyz/recs";
import { fromEntity } from "../../../utils/encode";
import { Hex } from "viem";
import { hexTypeToString } from "../../../utils/encode";
import { UIItem } from "../../components/ui/UIItem";
import { getERC20Balances } from "../../../logics/container";
import { selectHost } from "../../../logics/entity";
import { getEntitiesInCustodian } from "../../../logics/custodian";
import { getHostPosition } from "../../../logics/path";
import { setNewTargetTile } from "../../../logics/move";
import { getHosts } from "../../../logics/sceneObject";
import { ItemUseMenu } from "../ListMenu/ItemUseMenu";
import { ItemData } from "../../../api/data";
import { TextInput } from "../common/TextInput";

export class Guide extends DoublePage {
  constructor(scene: UIScene, parent: GuiBase) {
    super(scene, parent, "Guide");
    this.name = "MainMenuGuide";
    this.focusUI = this.rootUI;

    new Heading2(
      scene,
      "The AWRPG is a freedom world.\nEven though it's just a demo now, you can still get a glimpse of what it is!",
      {
        parent: this.contentL,
        fontColor: "#ad735a",
        alignModeName: ALIGNMODES.MIDDLE_TOP,
        wordWrapWidth: 550,
        lineSpacing: 24,
      }
    );

    new UIImage(scene, "ui-demo-guide", {
      parent: this.contentL,
      marginY: 258,
      alignModeName: ALIGNMODES.MIDDLE_TOP,
    });

    new Heading2(scene, "Demo Walkthrough", {
      parent: this.contentR,
      fontColor: "#ad735a",
      alignModeName: ALIGNMODES.MIDDLE_TOP,
      wordWrapWidth: 550,
      lineSpacing: 24,
      marginY: 4,
    });

    new UIImage(scene, "ui-demo-guide2", {
      parent: this.contentR,
      marginX: -12,
      marginY: 60,
      alignModeName: ALIGNMODES.MIDDLE_TOP,
    });
  }

  show() {
    this.focusUI = this.rootUI;
    super.show();
    this.rootUI.on(UIEvents.TAB, this.onTab, this);
    this.rootUI.on(
      UIEvents.CANCEL,
      () => {
        this.parent?.hidden();
      },
      this
    );
  }

  hidden() {
    this.rootUI.off();
    super.hidden();
  }

  onTab() {
    const menu = this.scene.mainMenu;
    if (!menu) return;
    const nextPage = menu.roles;
    this.hidden();
    nextPage.show();
    menu.tab1.setTexture("ui-book-tab-selected");
    menu.tab2.setTexture("ui-book-tab");
  }
}
