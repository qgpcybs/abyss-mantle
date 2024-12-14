import { UIScene } from "../../scenes/UIScene";
import { GuiBase, GuiBaseConfig } from "../GuiBase";
import { Entity } from "@latticexyz/recs";
import { ListMenu } from "./ListMenu";
import { Role } from "../../objects/Role";

export class RolesListMenu extends ListMenu {
  role?: Role;
  constructor(scene: UIScene, config?: GuiBaseConfig) {
    super(scene, "Choose the role", config);
    this.name = "RolesListMenu";
  }

  show(
    prevGui?: GuiBase,
    datas?: {
      entity: Entity;
      type: string;
      id: number;
      name: string;
    }[],
    ...params: unknown[]
  ) {
    super.show(prevGui, datas);
  }

  spliceText(data: { type: string; id: number; name: string }) {
    return data.name + " #" + data.id.toString();
  }
}
