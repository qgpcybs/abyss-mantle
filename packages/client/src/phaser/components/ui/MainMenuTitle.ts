import { UIText, UITextConfig } from "./common/UIText";
import { ALIGNMODES } from "../../../constants";

export class MainMenuTitle extends UIText {
  constructor(scene: Phaser.Scene, text: string, config: UITextConfig = {}) {
    super(scene, text, {
      fontFamily: "MedievalSharp",
      fontSizeResponsive: true,
      fontSize: 80,
      fontStyle: "600",
      fontColor: "#2D3E51",
      alignModeName: ALIGNMODES.MIDDLE_TOP,
      ...config,
    });
  }
}
