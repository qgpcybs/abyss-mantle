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
  getRoleInBuildingStakingIds,
  getStakingInfo,
  StakingInfoType,
} from "../../logics/stake";
import { getTargetTerrainData } from "../../logics/terrain";
import { CostInfoType } from "../../logics/cost";
import { decodeTypeEntity } from "../../utils/encode";
import { Hex, hexToString } from "viem";
import { ButtonA } from "./buttons/ButtonA";

// display stakingIds in building
export class StakingMenu extends GuiBase {
  components: UIScene["components"];
  systemCalls: UIScene["systemCalls"];

  building?: Entity;
  source?: Entity;
  withinRange?: boolean;

  // player's staking in building; length is 1
  stakingIds: Hex[] = [];
  stakingInfos: Record<Hex, StakingInfoType> = {};

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
    this.name = "unstakeMenu";
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
    const stakingIds = getRoleInBuildingStakingIds(
      this.components,
      this.building as Hex,
      this.source as Hex
    );
    stakingIds.forEach((stakingId) => {
      const stakingInfo = getStakingInfo(this.components, stakingId);
      if (!stakingInfo) return;
      this.stakingInfos[stakingId] = stakingInfo;
    });
    this.stakingIds = Object.keys(this.stakingInfos) as Hex[];

    this.updateButtons();
  }

  updateButtons() {
    this.buttons = [];
    this.stakingIds.forEach((stakingId, index) => {
      this.addButtons(stakingId, index);
    });
    this.selectButton();
  }

  addButtons(stakingId: Hex, index: number) {
    const stakingInfo = this.stakingInfos[stakingId];
    const { stakeType, outputs, timeCost, ready } = stakingInfo;
    const outputString = hexToString(stakeType);
    const unstakeButton = new ButtonA(
      this.scene,
      `unStake ${outputString}`,
      260,
      48,
      {
        alignModeName: ALIGNMODES.LEFT_TOP,
        marginY: 28 + index * 2 * 56,
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
      name: "unstake",
      button: unstakeButton,
      onClick: () => {
        if (!buildingCoord || !this.source) return;
        console.log("unstake", this.source, buildingCoord);
        this.systemCalls.unstake(this.source as Hex, buildingCoord);
        this.backButton();
      },
    });
    const claimButton = new ButtonA(
      this.scene,
      `${ready ? `ready` : `unready`} to claim ${outputString}`,
      260,
      48,
      {
        alignModeName: ALIGNMODES.LEFT_TOP,
        marginY: 28 + index * 2 * 56 + 56,
        parent: this.rootUI,
        fontAlignMode: ALIGNMODES.LEFT_CENTER,
      }
    );
    this.buttons.push({
      name: "claim",
      button: claimButton,
      onClick: () => {
        if (!buildingCoord || !this.source) return;
        console.log("unstake", this.source, buildingCoord);
        if (!ready) return;
        this.systemCalls.claim(this.source as Hex, buildingCoord);
        this.backButton();
      },
    });
  }
}
