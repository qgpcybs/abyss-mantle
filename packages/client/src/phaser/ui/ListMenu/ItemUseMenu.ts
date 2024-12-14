import { UIScene } from "../../scenes/UIScene";
import { GuiBase, GuiBaseConfig } from "../GuiBase";
import { ALIGNMODES, SOURCE } from "../../../constants";
import { UIBase } from "../../components/ui/common/UIBase";
import { UIText } from "../../components/ui/common/UIText";
import { UIList } from "../../components/ui/common/UIList";
import { UIButton, UIButtonConfig } from "../../components/ui/common/UIButton";
import { ButtonA } from "../../components/ui/ButtonA";
import {
  Entity,
  getComponentValue,
  runQuery,
  HasValue,
} from "@latticexyz/recs";
import { ListMenu } from "../common/ListMenu";
import { Building } from "../../objects/Building";
import { Heading3 } from "../../components/ui/Heading3";
import { Hex } from "viem";
import {
  encodeTypeEntity,
  fromEntity,
  hexTypeToString,
} from "../../../utils/encode";
import { getBuildingStakeOuputTypes } from "../../../logics/stake";
import { getRoleAndHostAdjacentCoord } from "../../../logics/building";
import { hasMintCosts } from "../../../logics/cost";
import { getStaking } from "../../../contract/hashes";
import { unixTimeSecond } from "../../../utils/time";
import { UIController } from "../../components/controllers/UIController";
import {
  canStoreERC20Amount,
  canStoreOutputs,
} from "../../../logics/container";
import { ItemData } from "../../../api/data";
import { WEAPON } from "../../../contract/constants";
import { getEquipmentInfo } from "../../../logics/equipment";

export class ItemUseMenu extends ListMenu {
  data: ItemData;
  role: Entity;
  constructor(
    scene: UIScene,
    data: ItemData,
    role: Entity,
    config?: GuiBaseConfig
  ) {
    super(scene, "", config, {
      width: 268,
      height: 300,
    });
    this.name = "ItemUseMenu";
    this.data = data;
    this.role = role;
    this.rootUI.setDepth(20);
    this.list.marginY = 16;
  }

  show() {
    super.show();
    this.updateList();
  }

  updateList() {
    const items: ButtonA[] = [];
    const id = this.data.id;

    // Only some of NFTs can be equip
    if (id !== undefined) {
      if (this.data.state === "equipped") {
        const item_unequip = new ButtonA(this.scene, {
          width: this.list.displayWidth,
          text: "Unequip",
          fontStyle: "400",
          onConfirm: async () => {
            UIController.focus = this.focusUI;
            const info = getEquipmentInfo(this.components, this.data.entity);
            if (!info) return;
            this.data.state = "";
            this.hidden();
            await this.systemCalls.unequip(this.role as Hex, info.equipType);
            this.scene.mainMenu?.roles.onRolesListSelected();
          },
        });
        items.push(item_unequip);
      } else {
        const item_equip = new ButtonA(this.scene, {
          width: this.list.displayWidth,
          text: "Equip",
          fontStyle: "400",
          onConfirm: async () => {
            UIController.focus = this.focusUI;
            this.data.state = "equipped";
            this.hidden();
            await this.systemCalls.equip(this.data.entity as Hex, WEAPON);
            this.scene.mainMenu?.roles.onRolesListSelected();
          },
        });
        items.push(item_equip);
      }
    }

    // Only FTs can be consume
    if (id === undefined) {
      const item_consume = new ButtonA(this.scene, {
        width: this.list.displayWidth,
        text: "Consume",
        fontStyle: "400",
        onConfirm: async () => {
          UIController.focus = this.focusUI;
          await this.systemCalls.consumeERC20(
            this.role as Hex,
            this.data.entity as Hex
          );
          this.scene.mainMenu?.roles.onRolesListSelected();
        },
      });
      items.push(item_consume);
    }

    const item_drop = new ButtonA(this.scene, {
      width: this.list.displayWidth,
      text: "Drop",
      fontStyle: "400",
      onConfirm: async () => {
        UIController.focus = this.focusUI;
        if (id !== undefined) {
          this.hidden(); // Unique
          await this.systemCalls.dropERC721(this.data.entity as Hex);
        } else {
          const dropAmount = 1;
          this.data.amount -= dropAmount;
          if (this.data.amount < dropAmount) item_drop2.disable = true;
          if (this.data.amount === 0) this.hidden();
          await this.systemCalls.dropERC20(
            this.role as Hex,
            this.data.entity as Hex,
            BigInt(dropAmount)
          );
        }
        this.scene.mainMenu?.roles.onRolesListSelected();
      },
    });
    if (this.data.state === "equipped") item_drop.disable = true;
    items.push(item_drop);

    const item_drop2 = new ButtonA(this.scene, {
      width: this.list.displayWidth,
      text: "Drop x 10",
      fontStyle: "400",
      onConfirm: async () => {
        UIController.focus = this.focusUI;
        if (id !== undefined) {
          this.hidden(); // Unique
          await this.systemCalls.dropERC721(this.data.entity as Hex);
        } else {
          const dropAmount = 10;
          this.data.amount -= dropAmount;
          if (this.data.amount < dropAmount) item_drop2.disable = true;
          if (this.data.amount === 0) this.hidden();
          await this.systemCalls.dropERC20(
            this.role as Hex,
            this.data.entity as Hex,
            BigInt(dropAmount)
          );
        }
        this.scene.mainMenu?.roles.onRolesListSelected();
      },
    });
    if (this.data.amount < 10) {
      item_drop2.disable = true;
    }
    items.push(item_drop2);

    this.list.items = items;
    if (this.list.itemsCount > 0) this.list.itemIndex = 0;
  }

  hidden() {
    super.hidden();
    UIController.focus = this.scene.mainMenu?.roles.bag;
  }
}
