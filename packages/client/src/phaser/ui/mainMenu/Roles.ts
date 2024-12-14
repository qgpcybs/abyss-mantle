import { UIScene } from "../../scenes/UIScene";
import { GuiBase } from "../GuiBase";
import { DoublePage } from "./DoublePage";
import { ALIGNMODES, SOURCE } from "../../../constants";
import { UIBase, StandardGameSize } from "../../components/ui/common/UIBase";
import { UIEvents } from "../../components/ui/common/UIEvents";
import { UIImage } from "../../components/ui/common/UIImage";
import { UIText } from "../../components/ui/common/UIText";
import { UIList } from "../../components/ui/common/UIList";
import { PlayerInput } from "../../components/controllers/PlayerInput";
import { SceneObjectController } from "../../components/controllers/SceneObjectController";
import { Box } from "../../components/ui/Box";
import { BookListButton } from "../../components/ui/BookListButton";
import { Heading2 } from "../../components/ui/Heading2";
import { Heading3 } from "../../components/ui/Heading3";
import { MainMenuTitle } from "../../components/ui/MainMenuTitle";
import {
  runQuery,
  HasValue,
  Entity,
  getComponentValue,
} from "@latticexyz/recs";
import { fromEntity } from "../../../utils/encode";
import { Hex } from "viem";
import { hexTypeToString } from "../../../utils/encode";
import { UIItem } from "../../components/ui/UIItem";
import { getERC20Balances } from "../../../logics/container";
import { selectHost } from "../../../logics/entity";
import { getEntitiesInCustodian } from "../../../logics/custodian";
import { getHostPosition } from "../../../logics/path";
import { setNewTargetTile } from "../../../logics/move";
import { getHosts } from "../../../logics/sceneObject";
import { ItemUseMenu } from "../ListMenu/ItemUseMenu";
import { ItemData } from "../../../api/data";
import { TextInput } from "../common/TextInput";

export class Roles extends DoublePage {
  rolesList: UIList;
  bag: UIList;
  itemUseMenu?: ItemUseMenu;
  nameInput?: TextInput;
  currentRoleIndex: number;
  constructor(scene: UIScene, parent: GuiBase) {
    super(scene, parent, "Roles", "Bag");
    this.name = "MainMenuRoles";

    this.rolesList = new UIList(scene, {
      width: this.contentW - 8,
      height: 512,
      itemWidth: this.contentW - 48,
      itemHeight: 32,
      spacingY: 12,
      parent: this.contentL,
      overflow: "scroll",
      onCancel: () => {
        parent.hidden();
      },
    });
    this.focusUI = this.rolesList;
    this.currentRoleIndex = -1;

    this.bag = new UIList(scene, {
      width: this.contentW - 16,
      height: 320,
      alignModeName: ALIGNMODES.MIDDLE_TOP,
      itemWidth: 48,
      itemHeight: 48,
      spacingX: 12,
      spacingY: 12,
      parent: this.contentR,
      overflow: "scroll",
      onCancel: () => {
        parent.hidden();
      },
    });

    new UIText(scene, "[F] move camera to the role", {
      fontFamily: "ThaleahFat",
      fontSize: 32,
      fontColor: "#c58c61",
      textAlign: "center",
      lineSpacing: 12,
      alignModeName: ALIGNMODES.MIDDLE_BOTTOM,
      marginY: 24,
      fontStyle: "500",
      parent: this.left,
    });

    new UIText(scene, "[A/D] change the focus list", {
      fontFamily: "ThaleahFat",
      fontSize: 32,
      fontColor: "#c58c61",
      textAlign: "center",
      lineSpacing: 12,
      alignModeName: ALIGNMODES.MIDDLE_BOTTOM,
      marginY: 24,
      fontStyle: "500",
      parent: this.right,
    });
  }

  show() {
    this.focusUI = this.rolesList;
    super.show();
    this.updateRoles();

    if (this.nameInput) {
      this.nameInput.destroy();
      delete this.nameInput;
    }

    this.rolesList.on(UIEvents.CONFIRM, this.onRolesListConfirm, this);
    this.rolesList.on(UIEvents.SELECT_CHANGE, this.onRolesListSelected, this);
    this.rolesList.on(UIEvents.RIGHT, this.onRight, this);
    this.rolesList.on(UIEvents.TAB, this.onTab, this);
    this.bag.on(UIEvents.CONFIRM, this.onBagConfirm, this);
    this.bag.on(UIEvents.LEFT, this.onLeft, this);
    this.bag.on(UIEvents.TAB, this.onTab, this);

    if (this.currentRoleIndex >= 0) {
      // Default selecet the current role
      this.rolesList.itemIndex = this.currentRoleIndex;
    } else if (this.rolesList.itemsCount > 0) {
      this.rolesList.itemIndex = 0;
    }
  }

  updateRoles() {
    const roles = getHosts(this.components, this.network);
    const items: UIBase[] = [];
    this.currentRoleIndex = -1;
    roles.forEach((role, index) => {
      const item = new BookListButton(this.scene, {
        width: this.rolesList.itemWidth,
        text: role.name + " #" + role.id.toString(),
        data: role,
      });
      items.push(item);
      const selectedHost = getComponentValue(
        this.components.SelectedHost,
        SOURCE
      )?.value;
      if (role.entity === selectedHost) this.currentRoleIndex = index;
    });
    const item = new BookListButton(this.scene, {
      width: this.rolesList.itemWidth,
      text: " + Press [F] to spawn a new hero",
    });
    items.push(item);
    this.rolesList.items = items;
  }

  hidden() {
    this.offMenuListen(this.rolesList);
    this.rolesList.off();
    this.bag.off();
    super.hidden();
  }

  /** Camera to the position of selected role */
  onRolesListConfirm() {
    const item = this.rolesList.item;
    if (!item) return;
    // Create new role
    if (!item.data) {
      this.nameInput = new TextInput(this.scene, async () => {
        const text = this.nameInput?.input.text;
        if (text) {
          await this.systemCalls.spawnHero(text);
          this.updateRoles();
          this.rolesList.itemIndex = this.rolesList.itemsCount - 2;
        }
      });
      this.nameInput.show(this);
    }
    // Set the camera & cursor position
    if (item.data) {
      const role = item.data.entity as Entity;
      selectHost(this.components, role);
      const rolePosition = getHostPosition(this.components, this.network, role);
      if (rolePosition) {
        setNewTargetTile(this.components, rolePosition);
        this.scene.characterInfo?.show(SceneObjectController.scene.roles[role]);
      }
    }
  }

  onBagConfirm() {
    const item = this.bag.item as UIItem;
    const role = this.rolesList.item?.data.entity as Entity;
    if (!item || !role || !item.itemType) return;
    // Show item using menu
    const itemData: ItemData = {
      type: item.itemType,
      entity: item.entity,
      id: item.id,
      amount: item.amount,
      state: item.state,
    };
    if (this.itemUseMenu) {
      this.itemUseMenu.destroy();
      delete this.itemUseMenu;
    }
    this.itemUseMenu = new ItemUseMenu(this.scene, itemData, role);
    this.itemUseMenu.show();
    this.itemUseMenu.rootUI.setPosition(item.globalX, item.globalY + 48);
  }

  /** Choose the role to watch details */
  onRolesListSelected() {
    // Clear
    const oldBagIndex = this.bag.itemIndex;
    this.bag.removeAllItems();

    // Add
    const item = this.rolesList.item;
    if (!item || !item.data) return;
    const role = item.data.entity as Entity;

    let itemsCount = 0;
    const erc721Entities = [
      ...runQuery([HasValue(this.components.Owner, { value: role })]),
    ];
    erc721Entities.forEach((entity, index) => {
      const { type, id } = fromEntity(entity as Hex);
      const itemType = hexTypeToString(type);
      const item = new UIItem(this.scene, itemType, {
        width: this.contentW - 48,
        amount: 1,
        id: Number(id),
        entity: entity,
      });
      this.bag.addItem(item);
    });
    itemsCount += erc721Entities.length;

    const erc20Items = getERC20Balances(this.components, role as Hex).map(
      (erc20Item) => {
        return { type: erc20Item.erc20Type, amount: Number(erc20Item.balance) };
      }
    );
    erc20Items.forEach((erc20Item) => {
      const itemType = hexTypeToString(erc20Item.type);
      const item = new UIItem(this.scene, itemType, {
        width: this.contentW - 48,
        amount: erc20Item.amount,
        entity: erc20Item.type as Entity,
      });
      this.bag.addItem(item);
    });
    itemsCount += erc20Items.length;

    const equipments = getEntitiesInCustodian(this.components, role);
    equipments.forEach((equipment) => {
      const { type, id } = fromEntity(equipment as Hex);
      const itemType = hexTypeToString(type);
      const item = new UIItem(this.scene, itemType, {
        width: this.contentW - 48,
        amount: 1,
        id: Number(id),
        entity: equipment,
        state: "equipped",
      });
      new Heading2(this.scene, "E", {
        fontColor: "#5c7a29",
        parent: item.bg,
        alignModeName: ALIGNMODES.LEFT_BOTTOM,
        fontStyle: "800",
        fontSize: 24,
        marginX: 4,
        marginY: -2,
      });
      this.bag.addItem(item);
    });
    itemsCount += equipments.length;

    if (this.focusUI === this.bag) {
      if (oldBagIndex >= 0) {
        if (itemsCount >= oldBagIndex) this.bag.itemIndex = oldBagIndex;
        else this.bag.itemIndex = itemsCount;
      } else if (itemsCount > 0) this.bag.itemIndex = 0;
      else this.bag.itemIndex = -1;
    }
  }

  onLeft() {
    super.onLeft();
    this.bag.onItemUnSelected(this.bag.item);
    this.focusUI = this.rolesList;
    if (this.rolesList.item) this.rolesList.onItemSelected(this.rolesList.item);
    else this.rolesList.itemIndex = 0;
  }

  onRight() {
    super.onRight();
    if (!this.rolesList.item?.data) return;
    this.rolesList.onItemUnSelected(this.rolesList.item);
    this.focusUI = this.bag;
    if (this.bag.item) this.bag.itemIndex = this.bag.itemIndex;
    else this.bag.itemIndex = 0;
  }

  onTab() {
    const menu = this.scene.mainMenu;
    if (!menu) return;
    const nextPage = menu.guide;
    this.hidden();
    nextPage.show();
    menu.tab1.setTexture("ui-book-tab");
    menu.tab2.setTexture("ui-book-tab-selected");
  }
}
