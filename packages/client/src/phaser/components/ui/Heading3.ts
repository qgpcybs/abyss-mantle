import { UIText, UITextConfig } from "./common/UIText";

export class Heading3 extends UIText {
  constructor(scene: Phaser.Scene, text: string, config: UITextConfig = {}) {
    super(scene, text, {
      fontFamily: config.fontFamily ?? "'Roboto Mono'",
      fontSize: config.fontSize ?? 16,
      fontStyle: config.fontStyle ?? "600",
      fontColor: config.fontColor ?? "#2D3E51",
      ...config,
    });
  }
}
