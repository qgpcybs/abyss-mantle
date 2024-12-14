import { ALIGNMODES } from "../../../constants";
import { UIText, UITextConfig } from "./common/UIText";

export class MenuTitle extends UIText {
  constructor(scene: Phaser.Scene, text: string, config: UITextConfig = {}) {
    super(scene, text, {
      alignModeName: ALIGNMODES.MIDDLE_CENTER,
      fontFamily: config.fontFamily ?? "Macondo",
      fontSize: config.fontSize ?? 32,
      fontStyle: config.fontStyle ?? "600",
      fontColor: config.fontColor ?? "#2D3E51",
      ...config,
    });
  }
}
