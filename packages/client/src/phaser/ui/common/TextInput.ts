import { UIScene } from "../../scenes/UIScene";
import { GuiBase, GuiBaseConfig } from "../GuiBase";
import { ALIGNMODES } from "../../../constants";
import { UIBase, UIBaseConfig } from "../../components/ui/common/UIBase";
import { UIInput } from "../../components/ui/common/UIInput";
import { UIImage } from "../../components/ui/common/UIImage";
import { Box2 } from "../../components/ui/Box2";
import { Box3 } from "../../components/ui/Box3";
import { UIEvents } from "../../components/ui/common/UIEvents";
import { UIList } from "../../components/ui/common/UIList";
import { PlayerInput } from "../../components/controllers/PlayerInput";
import { Heading2 } from "../../components/ui/Heading2";
import { ButtonA } from "../../components/ui/ButtonA";
import { UIController } from "../../components/controllers/UIController";

export class TextInput extends GuiBase {
  input: UIInput;
  confirmBtn: ButtonA;
  cancelBtn: ButtonA;

  constructor(scene: UIScene, handle: () => void, config?: GuiBaseConfig) {
    super(
      scene,
      new UIImage(scene, "ui-box-title-in-side2", {
        width: 600,
        height: 200,
        nineSlice: 28,
        alignModeName: ALIGNMODES.MIDDLE_CENTER,
      }),
      config
    );
    this.name = "TextInput";
    this.rootUI.setDepth(100);

    const bg = new Box3(scene, {
      width: 420,
      height: 58,
      alignModeName: ALIGNMODES.MIDDLE_TOP,
      marginY: 32,
      parent: this.rootUI,
    });

    this.input = new UIInput(scene, {
      width: 400,
      height: 36,
      fontSize: 36,
      fontFamily: "'Roboto Mono'",
      marginX: 10,
      alignModeName: ALIGNMODES.LEFT_TOP,
      parent: bg,
    });

    this.confirmBtn = new ButtonA(scene, {
      width: 210,
      height: 48,
      text: "Confirm",
      parent: bg,
      alignModeName: ALIGNMODES.LEFT_BOTTOM,
      marginY: -72,
      marginX: -40,
      onConfirm: () => {
        handle();
        this.hidden();
      },
    });

    this.cancelBtn = new ButtonA(scene, {
      width: 210,
      height: 48,
      text: "Cancel",
      parent: bg,
      alignModeName: ALIGNMODES.RIGHT_BOTTOM,
      marginY: -72,
      onConfirm: () => {
        this.hidden();
      },
    });

    this.focusUI = this.input;

    this.input.on(
      UIEvents.DOWN,
      () => {
        if (this.input.input.visible) return;
        this.focusUI = this.confirmBtn;
        this.confirmBtn.onSelected();
      },
      this
    );
    this.confirmBtn.on(
      UIEvents.RIGHT,
      () => {
        this.confirmBtn.onUnSelected();
        this.focusUI = this.cancelBtn;
        this.cancelBtn.onSelected();
      },
      this
    );
    this.confirmBtn.on(
      UIEvents.UP,
      () => {
        this.confirmBtn.onUnSelected();
        this.focusUI = this.input;
      },
      this
    );
    this.cancelBtn.on(
      UIEvents.LEFT,
      () => {
        this.cancelBtn.onUnSelected();
        this.focusUI = this.confirmBtn;
        this.confirmBtn.onSelected();
      },
      this
    );
    this.cancelBtn.on(
      UIEvents.UP,
      () => {
        this.cancelBtn.onUnSelected();
        this.focusUI = this.input;
      },
      this
    );
  }

  show(prevGui?: GuiBase) {
    super.show();
    this.prevGui = prevGui;
  }

  hidden() {
    super.hidden();
    if (this.prevGui) UIController.focus = this.prevGui.focusUI;
  }
}
