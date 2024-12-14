import { UIScene } from "../scenes/UIScene";
import { GuiBase } from "./GuiBase";
import { Box } from "../components/ui/Box";
import { Heading2 } from "../components/ui/Heading2";
import { Heading3 } from "../components/ui/Heading3";
import { UIText } from "../components/ui/common/UIText";
import { ALIGNMODES, HIGHLIGHT_MODE, TARGET } from "../../constants";
import { ButtonA } from "../components/ui/ButtonA";
import { UIImage } from "../components/ui/common/UIImage";
import { UIList } from "../components/ui/common/UIList";
import { SceneObjectController } from "../components/controllers/SceneObjectController";
import { Role } from "../objects/Role";
import { UIController } from "../components/controllers/UIController";
import { UIEvents } from "../components/ui/common/UIEvents";
import { GameData } from "../components/GameData";
import { BuildingData, BuildingSpecs } from "../../api/data";
import { Entity, getComponentValue, setComponent } from "@latticexyz/recs";
import {
  encodeTypeEntity,
  fromEntity,
  hexTypeToString,
} from "../../utils/encode";
import { Hex, toHex } from "viem";
import { PlayerInput } from "../components/controllers/PlayerInput";
import { getCraftData } from "../../logics/convert";

export class ConstructMenu extends GuiBase {
  list: UIList;
  img?: UIImage;
  text: Heading2;
  introduction: Heading3;
  costs: Heading3;
  role?: Role;
  data: BuildingData[];
  tipsText: string;

  constructor(scene: UIScene) {
    super(
      scene,
      new Box(scene, {
        width: 1180,
        height: 720,
        alignModeName: ALIGNMODES.MIDDLE_CENTER,
      })
    );
    this.name = "ConstructMenu";

    this.tipsText = "You don't have enough resourses to build it.";

    // Init the action button list
    this.list = new UIList(scene, {
      width: 378,
      height: this.rootUI.height * 0.92,
      marginY: 40,
      itemWidth: 268,
      itemHeight: 48,
      spacingY: 12,
      parent: this.rootUI,
      overflow: "scroll",
      onCancel: () => {
        this.hidden();
        this.prevGui?.show();
      },
    });
    this.focusUI = this.list;

    this.data = (GameData.getData("buildings") as BuildingData[]).filter(
      (building) => building.id >= 0
    );
    const items: ButtonA[] = [];
    this.data.forEach((building) => {
      items.push(new ButtonA(scene, { text: building.name }));
    });
    this.list.items = items;

    this.text = new Heading2(this.scene, "SAFE", {
      alignModeName: ALIGNMODES.MIDDLE_TOP,
      marginX: 188,
      marginY: 32,
      fontSize: 48,
      fontColor: "#2D3E51",
      parent: this.rootUI,
    });

    this.introduction = new Heading3(this.scene, "", {
      alignModeName: ALIGNMODES.MIDDLE_TOP,
      marginX: 188,
      marginY: 560,
      wordWrapWidth: 780,
      textAlign: "center",
      parent: this.rootUI,
    });

    this.costs = new Heading3(this.scene, "", {
      alignModeName: ALIGNMODES.MIDDLE_TOP,
      marginX: 188,
      marginY: 622,
      wordWrapWidth: 780,
      textAlign: "center",
      parent: this.rootUI,
    });

    new UIText(scene, "[F] Confirm   [X] Back", {
      marginX: 188,
      fontFamily: "ThaleahFat",
      fontSize: 32,
      fontColor: "#233",
      textAlign: "center",
      lineSpacing: 12,
      alignModeName: ALIGNMODES.MIDDLE_BOTTOM,
      marginY: 32,
      fontStyle: "500",
      parent: this.rootUI,
    });

    this.list.on(UIEvents.SELECT_CHANGE, this.onListSelected, this);
    this.list.on(UIEvents.CONFIRM, this.onListConfirm, this);
    this.list.itemIndex = 0;
  }

  show(role?: Role, prevGui?: GuiBase) {
    super.show();
    this.role = role ?? this.role;
    this.prevGui = prevGui ?? this.prevGui;
    SceneObjectController.focus = this.role;
    PlayerInput.onlyListenUI();
  }

  showTips() {
    const enterTips = new Heading2(this.scene, this.tipsText, {
      alignModeName: ALIGNMODES.MIDDLE_CENTER,
      marginY: -100,
      parent: this.rootUI,
    });
    enterTips.alpha = 0;
    enterTips.alpha = 0;
    const y = enterTips.y;
    this.scene.tweens.add({
      targets: enterTips,
      alpha: 1,
      y: y - 100,
      duration: 300,
      completeDelay: 1000,
      onComplete: () => {
        this.scene.tweens.add({
          targets: enterTips,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            enterTips.destroy();
          },
        });
      },
    });
  }

  onListSelected() {
    const index = this.list.itemIndex;
    if (index === undefined) return;
    this.img?.destroy();
    this.img = new UIImage(this.scene, this.data[index].img, {
      width: 480,
      height: 480,
      alignModeName: ALIGNMODES.MIDDLE_TOP,
      marginX: 0,
      marginY: 48,
      parent: this.text,
    });
    this.img.root.setAlpha(0.85);
    this.text.text = this.data[index].name.toUpperCase();
    this.introduction.text = this.data[index].introduction;

    const type = toHex(this.data[index].type, { size: 16 });
    const costs = getComponentValue(
      this.components.MintCosts,
      encodeTypeEntity(type) as Entity
    )?.costs as Hex[];
    let costsText = "Construct costs: ";
    if (!costs) costsText += "free";
    else {
      costs.forEach((costEntity) => {
        const cost = fromEntity(costEntity);
        costsText +=
          hexTypeToString(cost.type) + " x " + Number(cost.id) + ", ";
      });
      costsText = costsText.slice(0, -2);
    }
    this.costs.text = costsText;
  }

  onListConfirm() {
    const index = this.list.itemIndex;
    if (index === undefined || !this.role || !this.data) return;

    const type = toHex(this.data[index].type, { size: 16 });
    const buildingSpecs = this.getBuildingSpecs(type);
    if (!buildingSpecs) return;

    const craftData = getCraftData(
      this.components,
      this.role.entity as Hex,
      type
    );
    const hasCosts = craftData.hasCosts;

    if (!hasCosts) {
      this.showTips();
      return;
    }

    this.hidden();
    UIController.scene.constructTips?.show(this.role, this.data[index], this);
  }

  getBuildingSpecs(type: Hex): BuildingSpecs | undefined {
    return getComponentValue(
      this.components.BuildingSpecs,
      encodeTypeEntity(type) as Entity
    );
  }
}
