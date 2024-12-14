import { SetupResult } from "../../mud/setup";
import { CharacterInfo } from "../ui/CharacterInfo";
import { TerrainUI } from "../ui/TerrainUI";
import { ActionMenu } from "../ui/ActionMenu";
import { MoveTips } from "../ui/MoveTips";
import { AttackTips } from "../ui/AttackTips";
import { ConstructTips } from "../ui/ConstructTips";
import { GuiBase } from "../ui/GuiBase";
import { ConstructMenu } from "../ui/ConstructMenu";
import { BuildingMenu } from "../ui/BuildingMenu";
import { StakeMenu } from "../ui/StakeMenu";
import { StakingMenu } from "../ui/StakingMenu";
import "../components/ui/UIBaseExtend";
import { UIController } from "../components/controllers/UIController";
import { MainMenu } from "../ui/mainMenu/MainMenu";
import book_png from "../../assets/icons/items/book.png";

import empty_png from "../../assets/ui/empty.png";
import box_1_png from "../../assets/ui/box_1.png";
import box_title_out_side2_png from "../../assets/ui/box_title_out_side2.png";
import box_title_in_side2_png from "../../assets/ui/box_title_in_side2.png";
import box3_png from "../../assets/ui/box3.png";
import list_slider_track_png from "../../assets/ui/list-slider-track.png";
import list_slider_thumb_png from "../../assets/ui/list-slider-thumb.png";
import btn_decor1_png from "../../assets/ui/btn_decor1.png";
import btn_decor2_png from "../../assets/ui/btn_decor2.png";
import btn_decor3_png from "../../assets/ui/btn_decor3.png";
import btn_decor4_png from "../../assets/ui/btn_decor4.png";
import btn_select_skin_png from "../../assets/ui/btn_select_skin.png";
import btn_2_png from "../../assets/ui/btn_2.png";
import btn_2_selected_png from "../../assets/ui/btn_2_selected.png";
import open_1_png from "../../assets/ui/main-menu/open/1.png";
import open_2_png from "../../assets/ui/main-menu/open/2.png";
import open_3_png from "../../assets/ui/main-menu/open/3.png";
import open_4_png from "../../assets/ui/main-menu/open/4.png";
import open_5_png from "../../assets/ui/main-menu/open/5.png";
import close_1_png from "../../assets/ui/main-menu/close/1.png";
import close_2_png from "../../assets/ui/main-menu/close/2.png";
import close_3_png from "../../assets/ui/main-menu/close/3.png";
import close_4_png from "../../assets/ui/main-menu/close/4.png";
import close_5_png from "../../assets/ui/main-menu/close/5.png";
import tabs_2_png from "../../assets/ui/main-menu/tabs/2.png";
import tabs_3_png from "../../assets/ui/main-menu/tabs/3.png";
import tabs_role_png from "../../assets/ui/main-menu/tabs/role.png";
import bar_empty_png from "../../assets/ui/bar_empty.png";
import bar_red_png from "../../assets/ui/bar_red.png";
import bar_blue_png from "../../assets/ui/bar_blue.png";
import bar_yellow_png from "../../assets/ui/bar_yellow.png";
import icon_bg_png from "../../assets/ui/bag/icon-bg.png";
import icon_cursor1_png from "../../assets/ui/bag/icon-cursor1.png";
import icon_cursor2_png from "../../assets/ui/bag/icon-cursor2.png";
import icon_cursor3_png from "../../assets/ui/bag/icon-cursor3.png";
import icon_cursor4_png from "../../assets/ui/bag/icon-cursor4.png";
import sword_png from "../../assets/icons/items/sword.png";
import wood_png from "../../assets/icons/items/wood.png";
import berry_png from "../../assets/icons/items/berry.png";
import farmer_1_1_png from "../../assets/avatars/farmer_1_1.png";
import safe_png from "../../assets/imgs/buildings/safe.png";
import repository_png from "../../assets/imgs/buildings/repository.png";
import mine_shaft_png from "../../assets/imgs/buildings/mine-shaft.png";
import field_png from "../../assets/imgs/buildings/field.png";
import guide_png from "../../assets/ui/main-menu/tabs/guide.png";
import demo_guide_png from "../../assets/ui/demo_guide.png";
import demo_guide2_png from "../../assets/ui/demo_guide2.png";
import iron_png from "../../assets/icons/items/iron.png";
import water_png from "../../assets/icons/items/water.png";
import meat_png from "../../assets/icons/items/meat.png";
import rock_png from "../../assets/icons/items/rock.png";

export class UIScene extends Phaser.Scene {
  /**
   * components
   */
  components: SetupResult["components"];
  systemCalls: SetupResult["systemCalls"];
  network: SetupResult["network"];

  /**
   * the UI Components which is focused on
   */
  focusUI: GuiBase[] = [];

  mainMenu?: MainMenu;

  /**
   * show the information of current host
   */
  characterInfo?: CharacterInfo;

  /**
   * show the information of current terrain
   */
  terrainUI?: TerrainUI;

  /**
   * show the action buttons player can do
   */
  actionMenu?: ActionMenu;

  buildingMenu?: BuildingMenu;

  stakeMenu: StakeMenu | undefined;

  stakingMenu: StakingMenu | undefined;

  moveTips?: MoveTips;

  constructTips?: ConstructTips;

  constructMenu?: ConstructMenu;

  /**
   * @param setupResult
   * @param config
   */
  constructor(setupResult: SetupResult, config: Phaser.Types.Core.GameConfig) {
    super({ ...config, key: "UIScene", active: true });
    this.components = setupResult.components;
    this.systemCalls = setupResult.systemCalls;
    this.network = setupResult.network;
  }

  preload() {
    // Common
    this.load.image("ui-empty", empty_png);
    this.load.image("ui-box", box_1_png);
    this.load.image("ui-box-title-out-side2", box_title_out_side2_png);
    this.load.image("ui-box-title-in-side2", box_title_in_side2_png);
    this.load.image("ui-box3", box3_png);
    this.load.image("list-slider-track", list_slider_track_png);
    this.load.image("list-slider-thumb", list_slider_thumb_png);
    this.load.image("btn_decor1", btn_decor1_png);
    this.load.image("btn_decor2", btn_decor2_png);
    this.load.image("btn_decor3", btn_decor3_png);
    this.load.image("btn_decor4", btn_decor4_png);
    this.load.image("btn_select_skin", btn_select_skin_png);
    this.load.image("btn2_skin", btn_2_png);
    this.load.image("btn2_select_skin", btn_2_selected_png);

    // Dom
    // this.load.html("dom-input", "src/assets/dom/input.html");

    // Main menu
    this.load.image(`ui-book-open1`, open_1_png);
    this.load.image(`ui-book-open2`, open_2_png);
    this.load.image(`ui-book-open3`, open_3_png);
    this.load.image(`ui-book-open4`, open_4_png);
    this.load.image(`ui-book-open5`, open_5_png);

    this.load.image(`ui-book-close1`, close_1_png);
    this.load.image(`ui-book-close2`, close_2_png);
    this.load.image(`ui-book-close3`, close_3_png);
    this.load.image(`ui-book-close4`, close_4_png);
    this.load.image(`ui-book-close5`, close_5_png);

    this.load.image("ui-book-tab", tabs_2_png);
    this.load.image("ui-book-tab-selected", tabs_3_png);
    this.load.image("ui-book-tab-role", tabs_role_png);

    // States
    this.load.image("bar_empty", bar_empty_png);
    this.load.image("bar_red", bar_red_png);
    this.load.image("bar_blue", bar_blue_png);
    this.load.image("bar_yellow", bar_yellow_png);

    // Bag
    this.load.image("bag-icon-bg", icon_bg_png);
    this.load.image("bag-icon-cursor1", icon_cursor1_png);
    this.load.image("bag-icon-cursor2", icon_cursor2_png);
    this.load.image("bag-icon-cursor3", icon_cursor3_png);
    this.load.image("bag-icon-cursor4", icon_cursor4_png);

    // Items
    this.load.image("icon-item-iron", iron_png);
    this.load.image("icon-item-water", water_png);
    this.load.image("icon-item-meat", meat_png);
    this.load.image("icon-item-rock", rock_png);

    this.load.image("ui-book-tab-guide", guide_png);
    this.load.image("ui-demo-guide", demo_guide_png);
    this.load.image("ui-demo-guide2", demo_guide2_png);

    // Avatars
    this.load.image("avatar-farmer-1-1", farmer_1_1_png);

    // Buildings big image
    this.load.image("img-building-safe", safe_png);
    this.load.image("img-building-repository", repository_png);
    this.load.image("img-building-mine-shaft", mine_shaft_png);
    this.load.image("img-building-field", field_png);

    this.load.image("icon-item-sword", sword_png);
    this.load.image("icon-item-wood", wood_png);
    this.load.image("icon-item-berry", berry_png);
    this.load.image("icon-item-book", book_png);
  }

  create() {
    this.mainMenu = new MainMenu(this);
    this.characterInfo = new CharacterInfo(this);
    this.terrainUI = new TerrainUI(this);
    this.actionMenu = new ActionMenu(this);
    this.moveTips = new MoveTips(this);
    this.constructMenu = new ConstructMenu(this);
    this.constructTips = new ConstructTips(this);
    this.buildingMenu = new BuildingMenu(this);
    // this.stakeMenu = new StakeMenu(this);
    // this.stakingMenu = new StakingMenu(this);
    UIController.init(this);

    // Demo
    this.mainMenu.show();
  }
}
