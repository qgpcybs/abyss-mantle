import { ALIGNMODES } from "../../../../constants";
import { UIText, UITextConfig } from "./UIText";
import { UIImage } from "./UIImage";
import { UIConfig } from "./UIConfig";
import { UIEvents } from "./UIEvents";
import { StandardGameSize } from "./UIBase";

export class UIInput extends UIText {
  input: Phaser.GameObjects.DOMElement;
  inputHTML: HTMLInputElement;
  arrowLeft: UIImage;
  arrowRight: UIImage;
  constructor(scene: Phaser.Scene, config: UITextConfig = {}) {
    super(scene, "", config);

    let fontSize = config.fontSize ?? 24;
    this.fontSizeResponsive = config.fontSizeResponsive ?? false;
    if (this.fontSizeResponsive) {
      fontSize =
        (config.fontSize ?? 24) /
        Math.min(1, StandardGameSize.maxWidth / scene.game.scale.width);
    }
    this.textObj.visible = false;

    this.input = new Phaser.GameObjects.DOMElement(
      this.scene,
      0,
      0,
      "input",
      `font-size:${fontSize + (config.fontSizeUnit ?? "px")};width:${config.width ?? 200}px;height:unset;autofocus;border:none;outline:none;caret-color:transparent;background:none;`,
      "Phaser"
    ).setOrigin(0, 0);
    this.root.add(this.input);

    this.arrowLeft = new UIImage(scene, "btn_decor4", {
      width: 32,
      height: 32,
      alignModeName: ALIGNMODES.LEFT_CENTER,
      marginX: -42,
      marginY: 10 + (config.height ?? 0) / 2,
      parent: this,
    });

    this.arrowRight = new UIImage(scene, "btn_decor4", {
      width: 32,
      height: 32,
      alignModeName: ALIGNMODES.RIGHT_CENTER,
      marginX: -(config.width ?? 0) - 42,
      marginY: 10 + (config.height ?? 0) / 2,
      parent: this,
    });
    this.arrowRight.flipX = true;

    scene.tweens.add({
      targets: this.arrowLeft,
      x: this.arrowLeft.x - 6,
      duration: 600,
      repeat: -1,
      yoyo: true,
    });
    scene.tweens.add({
      targets: this.arrowRight,
      x: this.arrowRight.x + 6,
      duration: 600,
      repeat: -1,
      yoyo: true,
    });

    this.input.addListener("keydown");
    this.input.addListener("input");
    this.input.addListener("blur");
    this.input.addListener("focus");

    this.inputHTML = this.input.node as HTMLInputElement;

    this.input.on(
      "keydown",
      (event: KeyboardEvent) => {
        if (["Escape"].includes(event.key)) this.onInputBlur();
      },
      this
    );

    this.on(
      UIEvents.CONFIRM,
      (_target: any, _event: KeyboardEvent) => {
        if (this.textObj.visible) this.onInputFocus();
        else if (["Enter"].includes(_event.key)) {
          this.onInputBlur();
        }
      },
      this
    );

    this.input.on(
      "input",
      (event: InputEvent) => {
        const target = event.target as HTMLInputElement;
        target.value = target.value.replace(
          /([^\w\u0401\u0451\u0410-\u044f\u4e00-\u9fa5\u30a1-\u30f6\u3041-\u3093\u3131-\u3163\u3165-\u318e\uac00-\ud7a3])/g,
          ""
        );
        target.value = target.value.slice(0, 18);
        if (target) this.textObj.text = target.value ?? "";
      },
      this
    );

    this.onInputFocus();
  }

  onInputFocus() {
    this.input.off("focus");
    this.textObj.visible = false;
    this.input.visible = true;
    this.input.on("blur", (event: FocusEvent) => {
      const target = event.target as HTMLInputElement;
      target.focus();
    });
    setTimeout(() => {
      this.inputHTML.focus();
    }, 10); // Avoid to input the wrong key such as open UI's [F]
    this.arrowLeft.alpha = 1;
    this.arrowRight.alpha = 1;
  }

  onInputBlur() {
    this.input.off("blur");
    this.input.visible = false;
    this.textObj.visible = true;
    this.input.on("focus", (event: FocusEvent) => {
      const target = event.target as HTMLInputElement;
      target.blur();
    });
    this.inputHTML.blur();
    this.arrowLeft.alpha = 0.5;
    this.arrowRight.alpha = 0.5;
  }

  onFocus() {
    this.arrowLeft.visible = true;
    this.arrowRight.visible = true;
  }

  onBlur() {
    this.arrowLeft.visible = false;
    this.arrowRight.visible = false;
    this.onInputBlur();
  }
}
