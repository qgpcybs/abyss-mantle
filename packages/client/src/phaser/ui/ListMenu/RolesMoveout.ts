import { Entity, getComponentValue } from "@latticexyz/recs";
import { RolesListMenu } from "../common/RolesListMenu";
import { MoveoutTips } from "../MoveoutTips";
import { Building } from "../../objects/Building";
import { GuiBase } from "../GuiBase";
import { ButtonA } from "../../components/ui/ButtonA";
import { Heading3 } from "../../components/ui/Heading3";
import { ALIGNMODES } from "../../../constants";

export class RolesMoveout extends RolesListMenu {
  moveoutTips?: MoveoutTips;
  building?: Building;

  show(
    prevGui?: GuiBase,
    datas?: {
      entity: Entity;
      type: string;
      id: number;
      state: string;
      name: string;
    }[],
    building?: Building
  ) {
    super.show(prevGui, datas);
    if (building) this.building = building;
  }

  onConfirm() {
    if (!this.item || this.item.disable) return;
    const entity = this.item!.data.entity as Entity;
    this.hidden(false);
    this.moveoutTips = new MoveoutTips(this.scene);
    this.moveoutTips.show(entity, this.building, this);
  }

  modifyItem(item: ButtonA) {
    const entity = item.data.entity;
    const isPlayer =
      getComponentValue(this.components.Commander, entity)?.value ===
      this.network.playerEntity;
    if (!isPlayer || item.data.state === "mining") item.disable = true;
    if (item.data.state === "mining") {
      new Heading3(this.scene, "Is mining", {
        marginX: 24,
        alignModeName: ALIGNMODES.RIGHT_CENTER,
        parent: item,
      });
    }
  }
}
