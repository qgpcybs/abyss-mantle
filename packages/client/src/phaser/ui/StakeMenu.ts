import { Entity, getComponentValue } from "@latticexyz/recs";
import { ALIGNMODES, SOURCE } from "../../constants";
import { Box } from "../components/ui/Box";
import { UIScene } from "../scenes/UIScene";
import { GuiBase } from "./GuiBase";
import {
  getRoleAndHostAdjacentCoord,
  roleAndHostWithinRange,
} from "../../logics/building";
import {
  getBuildingStakeOuputTypes,
  getStakeInfo,
  getStakeInputsInfo,
  StakeInfoType,
} from "../../logics/stake";
import { getTargetTerrainData } from "../../logics/terrain";
import { CostInfoType } from "../../logics/cost";
import { decodeTypeEntity } from "../../utils/encode";
import { Hex, hexToString } from "viem";
import { ButtonA } from "./buttons/ButtonA";

// display building's stake menu that lists all available stake outputTypes in said building
export class StakeMenu extends GuiBase {
  components: UIScene["components"];
  systemCalls: UIScene["systemCalls"];

  building?: Entity;
  source?: Entity;
  withinRange?: boolean;

  stakeTypes: Hex[] = [];
  // stakeType -> stakeInfo
  stakeInfos: Record<Hex, StakeInfoType> = {};

  constructor(scene: UIScene) {
    super(
      scene,
      new Box(scene, "ui-box", 500, 210, {
        alignModeName: ALIGNMODES.MIDDLE_CENTER,
        marginX: 220,
      })
    );

    this.components = scene.components;
    this.systemCalls = scene.systemCalls;
    this.name = "stakeMenu";
  }

  update() {
    const tileData = getTargetTerrainData(this.components, this.systemCalls);
    this.building = tileData?.coordEntity as Entity;
    const { SelectedHost } = this.components;
    this.source = getComponentValue(SelectedHost, SOURCE)?.value as Entity;
    if (!this.source) return;
    this.withinRange =
      this.building && this.source
        ? roleAndHostWithinRange(this.components, this.source, this.building)
        : false;
    const stakeTypes = getBuildingStakeOuputTypes(
      this.components,
      this.building
    );
    // update inputsInfo
    this.stakeInfos = {};
    stakeTypes.forEach((stakeType) => {
      const stakeInfo = getStakeInfo(
        this.components,
        stakeType,
        this.source as Hex
      );
      if (stakeInfo) {
        this.stakeInfos[stakeType] = stakeInfo;
      }
    });
    this.stakeTypes = Object.keys(this.stakeInfos) as Hex[];

    this.updateButtons();
  }

  updateButtons() {
    // TODO: remove buttons in baseUI
    this.buttons = [];
    this.stakeTypes.forEach((stakeType, index) => {
      this.addStakeButton(stakeType, index);
    });
    this.selectButton();
  }

  addStakeButton(stakeType: Hex, index: number) {
    const stakeInfo = this.stakeInfos[stakeType];
    const { inputs, outputs, timeCost } = stakeInfo;
    const inputString = inputs
      .map((input: CostInfoType) => {
        return `${hexToString(input.type)} x ${input.amount}`;
      })
      .join(", ");
    const button = new ButtonA(
      this.scene,
      `Stake ${inputString} to get ${hexToString(stakeType)}`,
      260,
      48,
      {
        alignModeName: ALIGNMODES.LEFT_TOP,
        marginY: 28 + index * 56,
        parent: this.rootUI,
        fontAlignMode: ALIGNMODES.LEFT_CENTER,
      }
    );
    if (!this.source || !this.building) return;
    const buildingCoord = getRoleAndHostAdjacentCoord(
      this.components,
      this.source,
      this.building
    );
    this.buttons.push({
      name: "Stake",
      button: button,
      onClick: () => {
        if (!buildingCoord || !this.source) return;
        console.log("stake", stakeType, buildingCoord);
        this.systemCalls.stake(this.source as Hex, stakeType, buildingCoord);
        this.backButton();
      },
    });
  }
}
