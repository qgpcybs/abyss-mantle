import { Entity, getComponentValue } from "@latticexyz/recs";
import { ALIGNMODES, SOURCE } from "../../constants";
import { Box } from "../components/ui/Box";
import { UIList } from "../components/ui/common/UIList";
import { UIScene } from "../scenes/UIScene";
import { ButtonA } from "../components/ui/ButtonA";
import { GuiBase } from "./GuiBase";
import {
  canRoleEnter,
  roleAndHostWithinRange,
  getAllBuildingTileIds,
} from "../../logics/building";
import { getTargetTerrainData } from "../../logics/terrain";
import {
  getBuildingStakeOuputTypes,
  getBuildingStakingIds,
} from "../../logics/stake";
import { Hex } from "viem";
import { Box2 } from "../components/ui/Box2";
import { Building } from "../objects/Building";
import { UIController } from "../components/controllers/UIController";
import { SceneObjectController } from "../components/controllers/SceneObjectController";
import { MenuTitle } from "../components/ui/MenuTitle";
import { PlayerInput } from "../components/controllers/PlayerInput";
import { BuildingData } from "../../api/data";
import { RolesMoveout } from "./ListMenu/RolesMoveout";
import { Mine } from "./ListMenu/Mine";
import { ListMenu } from "./common/ListMenu";
import {
  getEntitySpecs,
  isBuildingMiner,
  isBuildingStaker,
} from "../../logics/entity";
import { getHostsInHost } from "../../logics/sceneObject";
import { Heading3 } from "../components/ui/Heading3";
import { splitFromEntity } from "../../logics/move";
import { hasMineFromTile } from "../../logics/mining";
import { FarmingMenu } from "./ListMenu/FarmingMenu";

export class BuildingMenu extends GuiBase {
  list: UIList;
  title: MenuTitle;
  titleBox: Box2;
  tips?: Heading3;

  subMenu?: ListMenu;

  building?: Building;

  source?: Entity;

  stakeTypes: Hex[] = [];
  stakingIds: Entity[] = [];

  constructor(scene: UIScene) {
    super(
      scene,
      new Box(scene, {
        width: 360,
        height: 210,
        alignModeName: ALIGNMODES.MIDDLE_CENTER,
        marginX: 220,
      })
    );
    this.name = "BuildingMenu";

    // Title
    this.titleBox = new Box2(scene, {
      width: 178,
      height: 58,
      alignModeName: ALIGNMODES.RIGHT_TOP,
      marginX: 8,
      marginY: -36,
      parent: this.rootUI,
    });
    this.title = new MenuTitle(scene, "BUILDING", { parent: this.titleBox });

    // stake -> systemCalls. ["stake", "store"]
    // cook -> systemCalls. ["cook", "store"]

    this.list = new UIList(scene, {
      marginY: 28,
      itemWidth: 328,
      itemHeight: 48,
      spacingY: 12,
      parent: this.rootUI,
      onCancel: () => {
        this.hidden();
        this.exit();
        SceneObjectController.resetFocus();
        PlayerInput.onlyListenSceneObject();
      },
    });
    this.focusUI = this.list;
  }

  show(building?: Building) {
    super.show();
    this.building = building ?? this.building;
    SceneObjectController.focus = this.building;
    PlayerInput.onlyListenUI();
    this.updateTitle();
    this.updateList();
  }

  hidden() {
    super.hidden();
  }

  exit() {
    this.subMenu?.destroy();
    delete this.subMenu;
    this.list.removeAllItems();
    this.tips?.destroy();
    delete this.tips;
  }

  updateTitle() {
    if (!this.building) return;
    const name = this.building.data.name.toUpperCase();
    this.titleBox.setSlices(48 + name.length * 18);
    this.title.text = name;
  }

  updateList() {
    this.exit();
    if (!this.building) return;
    const entity = this.building.entity;

    // [Button] Leave
    const canStore = getEntitySpecs(
      this.components,
      this.components.ContainerSpecs,
      entity
    )
      ? true
      : false;
    if (canStore) {
      const hosts = getHostsInHost(
        this.components,
        entity,
        this.network.playerEntity
      );
      if (hosts?.length > 0) {
        const item_leave = new ButtonA(this.scene, {
          text: "Move out",
          onConfirm: () => {
            this.hidden();
            this.subMenu?.hidden(false);
            this.subMenu = new RolesMoveout(this.scene);
            this.subMenu.show(this, hosts, this.building!);
          },
        });
        this.list.addItem(item_leave);
      }

      // [Button] Mine
      if (isBuildingMiner(this.components, entity)) {
        const tileIds = getAllBuildingTileIds(this.components, entity as Hex);
        const tileId = tileIds.filter((tileId) =>
          hasMineFromTile(this.systemCalls, splitFromEntity(tileId))
        )[0];
        // Have any tiles can mine
        if (tileId) {
          const item_mine = new ButtonA(this.scene, {
            text: "Mine",
            onConfirm: () => {
              this.hidden();
              this.subMenu?.hidden(false);
              this.subMenu = new Mine(this.scene);
              this.subMenu.show(this, hosts, this.building!, tileId);
            },
          });
          this.list.addItem(item_mine);
        }
      }

      // [Button] Farming
      if (this.building?.data.type === "FIELD") {
        const item_farming = new ButtonA(this.scene, {
          text: "Staking",
          onConfirm: () => {
            this.hidden();
            this.subMenu?.hidden(false);
            this.subMenu = new FarmingMenu(this.scene);
            this.subMenu.show(this, hosts, this.building!);
          },
        });
        this.list.addItem(item_farming);
      }
    }

    // Select the first item or show the tips
    if (this.list.itemsCount > 0) this.list.itemIndex = 0;
    else {
      this.tips = new Heading3(this.scene, "Nothing to interact with it.", {
        parent: this.rootUI,
        alignModeName: ALIGNMODES.MIDDLE_CENTER,
      });
    }
  }

  // updateButtons() {
  //   this.list.destroyChildren();
  //   let index = 0;
  //   if (this.stakeTypes.length > 0) {
  //     this.addStakeButton(index);
  //     index++;
  //   }
  //   if (this.stakingIds.length > 0) {
  //     // this.addStakingButton(index);
  //     index++;
  //   }
  //   // this.selectButton();
  // }

  // addStakeButton(index: number) {
  //   const button = new ButtonA(this.scene, {
  //     text: "Stake",
  //     onConfirm: () => {
  //       this.hidden();
  //       UIController.scene.stakeMenu?.show();
  //     },
  //   });
  //   this.list.addItem(button);
  // }

  // addStakingButton(index: number) {
  //   const button = new ButtonA(this.scene, "staking", 260, 48, {
  //     alignModeName: ALIGNMODES.LEFT_TOP,
  //     marginY: 28 + index * 56,
  //     parent: this.rootUI,
  //     fontAlignMode: ALIGNMODES.LEFT_CENTER,
  //   });
  //   this.buttons.push({
  //     name: "staking",
  //     button: button,
  //     onClick: () => {
  //       this.scene.scene.get("GameScene").playController.movable = false;
  //       this.scene.buildingMenu?.hidden();
  //       this.scene.stakingMenu?.show();
  //       this.scene.stakingMenu?.update();
  //     },
  //   });
  // }

  // selectButton() {
  //   const button = this.buttons[this.currentButtonIndex]?.button;
  //   if (button) {
  //     button.select();
  //   }
  // }
}
