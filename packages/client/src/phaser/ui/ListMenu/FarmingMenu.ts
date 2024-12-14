import { UIScene } from "../../scenes/UIScene";
import { GuiBase, GuiBaseConfig } from "../GuiBase";
import { ALIGNMODES, SOURCE } from "../../../constants";
import { UIBase } from "../../components/ui/common/UIBase";
import { UIText } from "../../components/ui/common/UIText";
import { UIList } from "../../components/ui/common/UIList";
import { UIButton, UIButtonConfig } from "../../components/ui/common/UIButton";
import { ButtonA } from "../../components/ui/ButtonA";
import {
  Entity,
  getComponentValue,
  runQuery,
  HasValue,
} from "@latticexyz/recs";
import { ListMenu } from "../common/ListMenu";
import { Building } from "../../objects/Building";
import { Heading3 } from "../../components/ui/Heading3";
import { Hex } from "viem";
import {
  encodeTypeEntity,
  fromEntity,
  hexTypeToString,
} from "../../../utils/encode";
import {
  getBuildingStakeOuputTypes,
  getBuildingStakingIds,
} from "../../../logics/stake";
import { getRoleAndHostAdjacentCoord } from "../../../logics/building";
import { hasMintCosts } from "../../../logics/cost";
import { getStaking } from "../../../contract/hashes";
import { unixTimeSecond } from "../../../utils/time";
import { UIController } from "../../components/controllers/UIController";
import {
  canStoreERC20Amount,
  canStoreOutputs,
} from "../../../logics/container";
import { SceneObjectController } from "../../components/controllers/SceneObjectController";

interface Data {
  entity: Entity;
  type: string;
  id: number;
  state: string;
  name: string;
}

export class FarmingButton extends UIButton {
  inputs: Heading3;
  outputs: Heading3;
  cost: Heading3;
  harvestCycle: Heading3;
  constructor(scene: Phaser.Scene, config: UIButtonConfig = {}) {
    super(scene, {
      height: 48,
      fontFamily: "ThaleahFat",
      fontSize: 36,
      marginX: 24,
      fontStyle: "600",
      fontColor: "#2D3E51",
      hoverSkinTexture: "btn_select_skin",
      clickedSkinTexture: "btn_select_skin",
      nineSlice: 16,
      ...config,
      width: config.width ? config.width - 24 : 328,
    });

    const box = new UIBase(scene, {
      width: this.width,
      height: this.height,
      parent: this,
      marginX: 24,
      marginY: 24,
    });

    this.inputs = new Heading3(scene, "Input: ", {
      parent: box,
    });
    this.outputs = new Heading3(scene, "Outputs: ", {
      parent: box,
      marginY: 24,
    });
    this.cost = new Heading3(scene, "Cost: ", {
      parent: box,
      marginY: 48,
    });
    this.harvestCycle = new Heading3(scene, "Harvest cycle: ", {
      parent: box,
      alignModeName: ALIGNMODES.RIGHT_TOP,
      marginX: 48,
      marginY: 48,
    });
  }
}

export class FarmingMenu extends ListMenu {
  list2?: UIList;
  claim?: ButtonA;
  unstake?: ButtonA;

  building?: Building;
  hasStaking: boolean = false;
  isPlayer: boolean = false;
  si: number = 0;

  stakingId?: Entity;
  remained: number = 999;
  inputsType?: Hex[];

  constructor(scene: UIScene, config?: GuiBaseConfig) {
    super(scene, "Select a crop to stake", config, {
      width: 760,
    });
    this.name = "FarmingMenu";

    new UIText(scene, "[F] start / stop staking", {
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

  show(prevGui?: GuiBase, datas?: Data[], building?: Building) {
    this.list.itemHeight = 112;
    if (building) {
      this.building = building;
      const entity = this.building.entity;
      const { StakingInfo, SelectedHost, Commander } = this.components;
      this.hasStaking =
        [...runQuery([HasValue(StakingInfo, { building: entity })])].length > 0;
      const role = getComponentValue(SelectedHost, SOURCE)?.value as Entity;
      this.isPlayer =
        getComponentValue(Commander, role)?.value === this.network.playerEntity;
      // SceneObjectController.scene.roles[role].doFarmingAnimation(() => {});
    }

    super.show(prevGui, datas);

    // Update
    clearInterval(this.si);
    this.si = setInterval(() => {
      this.updateTime();
    }, 1000);
    this.updateTime();
  }

  hidden() {
    super.hidden();
    clearInterval(this.si);
  }

  updateTime() {
    if (this.claim?.disable) return;
    if (!this.stakingId) return;
    const { StakingInfo, StakeSpecs } = this.components;
    const lastUpdated = getComponentValue(
      StakingInfo,
      this.stakingId
    )?.lastUpdated;
    if (!lastUpdated) return;
    const outputType = getComponentValue(
      StakingInfo,
      this.stakingId
    )!.outputType;
    const encodedType = encodeTypeEntity(outputType as Hex) as Entity;
    const timeCost = getComponentValue(StakeSpecs, encodedType)?.timeCost;
    if (!timeCost) return;
    const time = lastUpdated + timeCost - unixTimeSecond();
    this.remained = time > 0 ? time : 0;
    if (this.claim?.text1?.text) {
      this.claim.text1.text =
        "Remained " + this.remained + " second to harvest";
    }
  }

  updateList(datas: unknown[] = []) {
    if (!this.isPlayer) {
      new Heading3(this.scene, "You have to choose your hero nearby first!", {
        parent: this.rootUI,
        alignModeName: ALIGNMODES.MIDDLE_CENTER,
      });
      return;
    }
    if (!this.building) return;
    const entity = this.building.entity;
    const { StakeSpecs, SelectedHost, StakingInfo, Commander } =
      this.components;
    const { playerEntity } = this.network;
    const role = getComponentValue(SelectedHost, SOURCE)?.value as Entity;
    const isPlayer =
      getComponentValue(Commander, entity)?.value === playerEntity;
    const items: UIBase[] = [];
    const stakingIds = getBuildingStakingIds(this.components, entity as Hex);
    this.stakingId = stakingIds[0];

    if (this.hasStaking) {
      const idToOut = getComponentValue(StakingInfo, this.stakingId);
      if (!idToOut) {
        new Heading3(this.scene, "It's already being used by other heros!", {
          parent: this.rootUI,
          alignModeName: ALIGNMODES.MIDDLE_CENTER,
        });
        return;
      }
      const outputType = idToOut.outputType;
      const encodedType = encodeTypeEntity(outputType as Hex) as Entity;
      const stakeSpecs = getComponentValue(StakeSpecs, encodedType);
      if (stakeSpecs) {
        const item = new FarmingButton(this.scene, {
          width: this.list.displayWidth,
          height: 112,
          text: "",
          data: outputType,
        });
        this.updateText(item, stakeSpecs);
        items.push(item);
      }
      // if player, display buttons
      this.setClaimUnstakeButtons(role, entity, encodedType);
    } else {
      if (this.list2) this.list2.hidden();

      this.focusUI = this.list;
      const outputTypes = getBuildingStakeOuputTypes(this.components, entity);
      outputTypes.map((outputType) => {
        const encodedType = encodeTypeEntity(outputType) as Entity;
        const stakeSpecs = getComponentValue(StakeSpecs, encodedType);
        if (stakeSpecs) {
          const item = new FarmingButton(this.scene, {
            width: this.list.displayWidth,
            height: 112,
            text: "",
            data: outputType,
          });
          this.updateText(item, stakeSpecs);

          items.push(item);
        }
      });
    }
    this.items = items;
    if (this.list.itemsCount > 0) this.list.itemIndex = 0;
  }

  // claim & stake buttons
  setClaimUnstakeButtons(role: Entity, entity: Entity, encodedType: Entity) {
    const { StakeSpecs } = this.components;
    if (this.list2) {
      this.list2.destroy();
      delete this.list2;
    }
    this.list2 = new UIList(this.scene, {
      width: this.rootUI.displayWidth - 48,
      itemWidth: this.rootUI.displayWidth - 48,
      itemHeight: 48,
      marginX: 24,
      marginY: 96 + 112 + 24,
      spacingY: 12,
      parent: this.rootUI,
      onCancel: () => this.hidden(),
    });
    this.list2.show();
    this.focusUI = this.list2;
    const items2: ButtonA[] = [];

    const adjacentCoord = getRoleAndHostAdjacentCoord(
      this.components,
      role,
      entity
    );
    this.claim = new ButtonA(this.scene, {
      width: this.list2.displayWidth,
      text: "Claim",
      fontStyle: "400",
      disable: adjacentCoord ? false : true,
      onConfirm: () => {
        const outputs =
          getComponentValue(StakeSpecs, encodedType)?.outputs ?? [];
        const hasCapacity = canStoreOutputs(
          this.components,
          role,
          outputs as Hex[]
        );
        if (adjacentCoord && this.remained === 0 && hasCapacity) {
          this.toClaim(role, adjacentCoord);
        }
        UIController.focus = this.focusUI;
      },
    });
    this.claim.text1 = new Heading3(
      this.scene,
      adjacentCoord
        ? "Remained ? second to harvest"
        : "Please choose the role nearby",
      {
        marginX: 24,
        alignModeName: ALIGNMODES.RIGHT_CENTER,
        parent: this.claim,
      }
    );
    items2.push(this.claim);

    this.unstake = new ButtonA(this.scene, {
      width: this.list2.displayWidth,
      text: "Unstake",
      fontStyle: "400",
      disable: adjacentCoord ? false : true,
      onConfirm: () => {
        const inputs = getComponentValue(StakeSpecs, encodedType)?.inputs ?? [];
        const hasCapacity = canStoreOutputs(
          this.components,
          role,
          inputs as Hex[]
        );
        if (adjacentCoord && hasCapacity) {
          this.toUnstake(role, adjacentCoord);
        }
        UIController.focus = this.focusUI;
      },
    });
    this.unstake.text1 = new Heading3(
      this.scene,
      adjacentCoord
        ? "Get the input items back"
        : "Please choose the role nearby",
      {
        marginX: 24,
        alignModeName: ALIGNMODES.RIGHT_CENTER,
        parent: this.unstake,
      }
    );
    items2.push(this.unstake);

    this.list2.items = items2;
    this.list2.itemIndex = 0;
  }

  updateText(
    item: FarmingButton,
    stakeSpecs: {
      buildingType: string;
      timeCost: number;
      inputs: string[];
      outputs: string[];
    }
  ) {
    const inputsInfo = stakeSpecs.inputs.map((input) => {
      const inputInfo = fromEntity(input as Hex);
      return {
        type: hexTypeToString(inputInfo.type),
        num: Number(inputInfo.id),
      };
    });
    let textIn = "Input: ";
    let textCost = "Cost: ";
    inputsInfo.forEach((input) => {
      if (input.type === "stamina")
        textCost += "stamina x " + input.num.toString();
      else textIn += input.type + " x " + input.num.toString() + "   ";
    });
    item.inputs.text = textIn;
    item.cost.text = textCost;

    const outputsInfo = stakeSpecs.outputs.map((output) => {
      const outputInfo = fromEntity(output as Hex);
      return {
        type: hexTypeToString(outputInfo.type),
        num: Number(outputInfo.id),
      };
    });
    let textOut = "Outputs: ";
    outputsInfo.forEach((output) => {
      textOut += output.type + " x " + output.num.toString() + "   ";
    });
    item.outputs.text = textOut;

    item.harvestCycle.text = "Harvest cycle: " + stakeSpecs.timeCost;
  }

  async toClaim(role: Entity, adjacentCoord: { x: number; y: number }) {
    await this.systemCalls.claim(role as Hex, adjacentCoord);
    if (this.visible) this.updateList();
  }

  async toUnstake(role: Entity, adjacentCoord: { x: number; y: number }) {
    this.hasStaking = false;
    await this.systemCalls.unstake(role as Hex, adjacentCoord);
    if (this.visible) this.updateList();
  }

  async startStaking() {
    if (!this.building || !this.item) return;
    const entity = this.building.entity;
    const outputType = this.item.data;
    if (!outputType) return;
    const role = getComponentValue(this.components.SelectedHost, SOURCE)
      ?.value as Entity;
    const hasCosts = hasMintCosts(this.components, role as Hex, outputType);
    const adjacentCoord = getRoleAndHostAdjacentCoord(
      this.components,
      role,
      entity
    );
    if (!hasCosts || !adjacentCoord) return;
    await this.systemCalls.stake(role as Hex, outputType as Hex, adjacentCoord);
    this.hasStaking = true;
    if (this.visible) {
      this.title.text = "Claim or unstake the crop";
      this.updateList();
    }
  }

  onConfirm() {
    if (this.hasStaking) {
    } else {
      this.startStaking();
    }
  }
}
