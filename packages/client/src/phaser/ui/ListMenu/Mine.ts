import { UIScene } from "../../scenes/UIScene";
import { GuiBase, GuiBaseConfig } from "../GuiBase";
import { Entity, getComponentValue } from "@latticexyz/recs";
import { ListMenu } from "../common/ListMenu";
import { MoveoutTips } from "../MoveoutTips";
import { Building } from "../../objects/Building";
import { Box } from "../../components/ui/Box";
import { UIText } from "../../components/ui/common/UIText";
import { ButtonA } from "../../components/ui/ButtonA";
import { Heading3 } from "../../components/ui/Heading3";
import { ALIGNMODES } from "../../../constants";
import { IRON } from "../../../contract/constants";
import { canStoreERC20Amount } from "../../../logics/container";
import { getMinedAmount } from "../../../logics/mining";
import { Hex } from "viem";
import { splitFromEntity } from "../../../logics/move";
import { hexTypeToString } from "../../../utils/encode";

interface Data {
  entity: Entity;
  type: string;
  id: number;
  state: string;
  name: string;
}

export class Mine extends ListMenu {
  moveoutTips?: MoveoutTips;
  building?: Building;
  tileId?: Entity;
  declare rootUI: Box;

  si: number = 0;

  constructor(scene: UIScene, config?: GuiBaseConfig) {
    super(scene, "Mining Situation", config, {
      width: 760,
    });
    this.name = "MineListMenu";

    new UIText(scene, "[F] start / stop mining", {
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

  show(
    prevGui?: GuiBase,
    datas?: Data[],
    building?: Building,
    tileId?: Entity
  ) {
    super.show(prevGui, datas);
    if (building) this.building = building;
    if (tileId) this.tileId = tileId;

    // List Tips
    if (this.list.itemsCount === 0) {
      new Heading3(
        this.scene,
        "You havn to move at least one hero to this building first!",
        {
          parent: this.rootUI,
          alignModeName: ALIGNMODES.MIDDLE_CENTER,
        }
      );
    }

    // Update
    clearInterval(this.si);
    this.si = setInterval(() => {
      this.items.forEach((item) => {
        this.updateText(item as ButtonA);
      });
    }, 500);
  }

  hidden() {
    super.hidden();
    clearInterval(this.si);
  }

  spliceText(data: Data) {
    return data.name + " #" + data.id.toString();
  }

  modifyItem(item: ButtonA) {
    const { Commander, StoredSize } = this.components;
    const entity = (item.entity = item.data.entity);
    const isPlayer =
      getComponentValue(Commander, entity)?.value === this.network.playerEntity;
    if (!isPlayer) item.disable = true;

    // Type
    const resourceType = IRON;

    // Amount
    item.data["amount"] = 0;

    // Max
    item.data["maxAmount"] = 0;
    item.listenComponentValue(StoredSize, (value) => {
      item.data["maxAmount"] = Number(
        canStoreERC20Amount(this.components, resourceType, entity)
      );
      this.updateText(item);
    });

    // UIText
    item.text1 = new Heading3(this.scene, "", {
      marginX: 24,
      alignModeName: ALIGNMODES.RIGHT_CENTER,
      parent: item,
    });
    this.updateText(item);
  }

  updateText(item: ButtonA) {
    if (!item?.text1 || !item.entity) return;
    const amount = getMinedAmount(this.components, item.entity) ?? 0;
    item.data["amount"] =
      amount < item.data["maxAmount"] ? amount : item.data["maxAmount"];

    item.text1.text =
      (item.data.state === "mining"
        ? "Mined: " + item.data["amount"] + "/"
        : "Can mine: ") +
      item.data["maxAmount"] +
      " " +
      hexTypeToString(IRON);
  }

  async startMining() {
    if (!this.item || this.item.disable) return;
    const entity = this.item.entity;
    if (!entity || !this.tileId) return;
    this.item.data.state = "mining";
    const tileCoord = splitFromEntity(this.tileId);
    await this.systemCalls.startMining(entity as Hex, tileCoord);
    this.updateText(this.item as ButtonA);
  }

  async stopMining() {
    if (!this.item || this.item.disable || !this.item.entity) return;
    this.item.data.state = "";
    await this.systemCalls.stopMining(this.item.entity as Hex);
    this.updateText(this.item as ButtonA);
  }

  onConfirm() {
    if (this.item?.data?.state !== "mining") {
      this.startMining();
    } else {
      this.stopMining();
    }
  }
}
