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
  decodeTypeEntity,
  encodeTypeEntity,
  fromEntity,
  hexTypeToString,
} from "../../utils/encode";
import { Hex, toHex } from "viem";
import { PlayerInput } from "../components/controllers/PlayerInput";
import { ListMenu } from "./common/ListMenu";
import { hasCosts } from "../../logics/cost";

interface Data {
  inputs: Hex[];
  outputType: Entity;
}

export class CraftMenu extends ListMenu {
  role: Role;
  datas?: Data[];
  crafting: boolean;
  constructor(scene: UIScene, role: Role) {
    super(scene, "Craft List");
    this.name = "CraftMenu";
    this.role = role;
    this.crafting = false;

    new UIText(scene, "[F] craft", {
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

  show(prevGui?: GuiBase, datas?: Data[]) {
    super.show(prevGui, datas);
    this.datas = datas;
    this.crafting = false;
  }

  spliceText(data: Data) {
    let text = hexTypeToString(data.outputType as Hex) + ": ";
    data.inputs.forEach((input) => {
      const { type, id } = fromEntity(input);
      text += hexTypeToString(type) + " x " + Number(id) + ", ";
    });
    if (data.inputs?.length > 0) text = text.slice(0, -2);

    return text;
  }

  itemConfigs(data: Data) {
    const hasInputs = hasCosts(
      this.components,
      this.role.entity as Hex,
      data.inputs
    );
    return {
      fontSize: 16,
      fontFamily: "'Roboto Mono'",
      fontStyle: "600",
      disable: !hasInputs,
    };
  }

  async onConfirm() {
    const item = this.list.item;
    if (!item || item.disable || this.crafting) return;
    this.crafting = true;
    await this.systemCalls.craft(
      this.role.entity as Hex,
      decodeTypeEntity(item.data.outputType as Hex) as Hex
    );
    this.crafting = false;
    if (this.datas) this.updateList(this.datas);
  }
}
