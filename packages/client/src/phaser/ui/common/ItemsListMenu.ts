import { UIScene } from "../../scenes/UIScene";
import { GuiBase, GuiBaseConfig } from "../GuiBase";
import { Entity } from "@latticexyz/recs";
import { ListMenu } from "./ListMenu";
import { Role } from "../../objects/Role";
import { ItemData } from "../../../api/data";
import { ALIGNMODES } from "../../../constants";
import { ButtonA } from "../../components/ui/ButtonA";
import { Heading3 } from "../../components/ui/Heading3";
import { UIText } from "../../components/ui/common/UIText";
import { Hex } from "viem";
import { getDropContainer } from "../../../logics/drop";

export class ItemsListMenu extends ListMenu {
  role: Role;
  constructor(scene: UIScene, role: Role, config?: GuiBaseConfig) {
    super(scene, "Item List", config);
    this.name = "ItemsListMenu";
    this.role = role;

    new UIText(scene, "[F] Choose the item", {
      fontFamily: "ThaleahFat",
      fontSize: 32,
      fontColor: "#233",
      textAlign: "center",
      lineSpacing: 12,
      alignModeName: ALIGNMODES.MIDDLE_BOTTOM,
      marginY: 24,
      fontStyle: "500",
      parent: this.rootUI,
    });
  }

  show(prevGui?: GuiBase, datas?: ItemData[], ...params: unknown[]) {
    super.show(prevGui, datas);
  }

  spliceText(data: ItemData) {
    return data.type + (data.id ? " #" + data.id.toString() : "");
  }

  modifyItem(item: ButtonA) {
    item.text1 = new Heading3(this.scene, "", {
      marginX: 24,
      alignModeName: ALIGNMODES.RIGHT_CENTER,
      parent: item,
    });
    this.updateText(item);
  }

  updateText(item: ButtonA) {
    if (!item?.text1) return;
    item.text1.text = item.data.id ? "x 1" : "x " + item.data.amount;
  }

  onConfirm() {
    const item = this.list.item;
    if (!item || item.disable) return;
    const dropId = getDropContainer(this.role.tileX, this.role.tileY);
    if (item.data.id !== undefined) {
      this.systemCalls.pickupERC721(
        this.role.entity as Hex,
        dropId,
        item.data.entity as Hex,
        this.role.tileX,
        this.role.tileY
      );
      item.disable = true;
    } else {
      item.data.amount--;
      if (item.data.amount <= 0) {
        item.disable = true;
      }
      this.systemCalls.pickupERC20(
        this.role.entity as Hex,
        dropId,
        item.data.entity as Hex,
        1n,
        this.role.tileX,
        this.role.tileY
      );
    }
    this.updateText(item as ButtonA);
  }
}
