import { UIButtonConfig } from "./common/UIButton";
import { ButtonA } from "./ButtonA";
import { UIText } from "./common/UIText";

/**
 * The button of the main menu book's list
 */
export class BookListButton extends ButtonA {
  constructor(scene: Phaser.Scene, config: UIButtonConfig = {}) {
    super(scene, {
      fontSize: 24,
      height: 32,
      fontStyle: "400",
      ...config,
    });
  }

  /**
   * Avoid text to be too litte to watching
   */
  initContent(config: UIButtonConfig): UIText {
    return super.initContent({ ...config, antiZoom: true });
  }
}
