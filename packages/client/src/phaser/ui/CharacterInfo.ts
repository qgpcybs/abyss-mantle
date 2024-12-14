import { UIScene } from "../scenes/UIScene";
import { GuiBase } from "./GuiBase";
import { Box } from "../components/ui/Box";
import { Avatar } from "../components/ui/Avatar";
import { UIBase } from "../components/ui/common/UIBase";
import { UIImage } from "../components/ui/common/UIImage";
import { UIText } from "../components/ui/common/UIText";
import { ALIGNMODES, SOURCE } from "../../constants";
import { Heading2 } from "../components/ui/Heading2";
import { Heading3 } from "../components/ui/Heading3";
import { HpBar } from "../components/ui/HpBar";
import { SpBar } from "../components/ui/SpBar";
import { Role } from "../objects/Role";
import { Building } from "../objects/Building";
import {
  defineSystem,
  defineUpdateSystem,
  Entity,
  getComponentValue,
  Has,
  HasValue,
  runQuery,
  UpdateType,
} from "@latticexyz/recs";
import {
  ATTACK,
  BLOOD,
  DEFENSE,
  RANGE,
  SOUL,
  STAMINA,
  WEAPON,
} from "../../contract/constants";
import { Hex } from "viem";
import { decodeBalanceEntity } from "../../utils/encode";
import { getEntityPoolsInfo } from "../../logics/pool";
import { getEntitySpecs, isRole } from "../../logics/entity";
import { getERC20Balances } from "../../logics/container";
import { getEntitiesInCustodian } from "../../logics/custodian";
import { getEquipment } from "../../logics/equipment";
import { SceneObjectController } from "../components/controllers/SceneObjectController";

/**
 * note: this phaesr ui mirrors Pool.tsx; can be an example to construct other "pool" phaer ui
 */
export class CharacterInfo extends GuiBase {
  avatar: UIImage;
  role?: Entity;
  attacker?: Role;

  infoUI_bars: UIBase;
  characterName: UIText;
  hpBar: HpBar;
  hpBar2?: UIImage;
  hpName: UIText;
  hpNum: UIText;
  spBar: SpBar;
  spName: UIText;
  spNum: UIText;
  atkName: UIText;
  atkNum: UIText;
  defName: UIText;
  defNum: UIText;

  mode: number = 0; // 0: Self, 1: Enemy

  // --- class data ---
  // name
  hostName: string = "";
  // pools data
  blood: number = 0;
  maxBlood: number = 0;
  stamina: number = 0;
  maxStamina: number = 0;
  soul: number = 0;
  maxSoul: number = 0;
  attack: number = 0;
  maxAttack: number = 0;
  defense: number = 0;
  maxDefense: number = 0;
  range: number = 0;
  maxRange: number = 0;
  // weapon
  weaponAttack: number = 0;
  weaponRange: number = 0;
  // stored size, capacity, and size
  capacity: number = 0;
  storedSize: number = 0;
  size: number = 0;

  // ---- bag items data ----
  // erc721 entities
  erc721Entities: Entity[] = [];
  // erc20 entityType & amount;
  erc20Items: { type: Hex; amount: number }[] = [];
  // equipments
  equipments: Entity[] = [];

  constructor(scene: UIScene, mode: number = 0) {
    super(
      scene,
      new Box(scene, {
        alignModeName:
          mode === 0 ? ALIGNMODES.LEFT_BOTTOM : ALIGNMODES.RIGHT_BOTTOM,
        width: 680,
        height: 192,
        marginX: 8,
        marginY: 8,
      })
    );

    this.name = "CharacterInfo";
    this.mode = mode;

    this.avatar = new Avatar(this.scene, "avatar-farmer-1-1", {
      alignModeName:
        mode === 0 ? ALIGNMODES.LEFT_BOTTOM : ALIGNMODES.RIGHT_BOTTOM,
      width: 256,
      height: 256,
      marginX: 1,
      marginY: 1,
      parent: this.rootUI,
    });
    if (mode === 1) this.avatar.flipX = false;

    const infoUI = new UIBase(scene, {
      marginX: mode === 0 ? 268 : 24,
      parent: this.rootUI,
    });

    this.infoUI_bars = new UIBase(scene, {
      width: 248,
      parent: infoUI,
    });

    this.characterName = new Heading2(this.scene, this.hostName, {
      marginY: 12,
      parent: infoUI,
    });

    this.hpBar = new HpBar(this.scene, {
      width: 248,
      height: 24,
      marginY: 78,
      parent: this.infoUI_bars,
    });

    this.hpName = new Heading3(this.scene, "HP", {
      marginX: 4,
      marginY: -20,
      parent: this.hpBar,
    });

    this.hpNum = new Heading3(this.scene, "1 / 1", {
      alignModeName: ALIGNMODES.RIGHT_TOP,
      marginX: 4,
      marginY: -20,
      parent: this.hpBar,
    });

    this.spBar = new SpBar(this.scene, {
      width: 248,
      height: 24,
      marginY: 140,
      parent: this.infoUI_bars,
    });

    this.spName = new Heading3(this.scene, "SP", {
      marginX: 4,
      marginY: -20,
      parent: this.spBar,
    });

    this.spNum = new Heading3(this.scene, "1 / 1", {
      alignModeName: ALIGNMODES.RIGHT_TOP,
      marginX: 4,
      marginY: -20,
      parent: this.spBar,
    });

    const infoUI_props = new UIBase(scene, {
      width: 128,
      marginX: 264,
      marginY: 58,
      parent: infoUI,
    });

    this.atkName = new Heading3(this.scene, "ATK", {
      parent: infoUI_props,
    });
    this.atkNum = new Heading3(this.scene, "100", {
      alignModeName: ALIGNMODES.RIGHT_TOP,
      parent: infoUI_props,
    });
    this.defName = new Heading3(this.scene, "DEF", {
      marginY: 24,
      parent: infoUI_props,
    });
    this.defNum = new Heading3(this.scene, "100", {
      alignModeName: ALIGNMODES.RIGHT_TOP,
      marginY: 24,
      parent: infoUI_props,
    });

    this.createSystem();
    this.createBagSystem();
  }

  show(host: Role | Building, attacker?: Role) {
    // initialize data
    if (!host) {
      const selectedHost = getComponentValue(
        this.components.SelectedHost,
        SOURCE
      )?.value;
      if (!selectedHost) return;
      this.role = selectedHost;
    } else {
      this.role = host.entity;
    }
    this.attacker = attacker ?? undefined;

    if (isRole(this.components, this.role)) {
      //
    } else {
      const img = (host as Building).data.img;
      this.avatar.setTexture(img);
      this.avatar.image.setDisplaySize(256, 256);
    }

    this.updateData();
    this.updateEquipment();
    this.updateDisplay();

    // bag
    this.updateBagData();

    super.show();

    // this.hpBar.listenComponentValue(
    //   role.components.PoolOf,
    //   (value: any) => {
    //     this.hpName.text = value.toString();
    //   },
    //   role.entity
    // );
  }

  /**
   * update (all) data every time 1 data changes, so as to save dev time
   */
  updateData() {
    if (this.destroying) return;
    const components = this.scene.components;
    const { ContainerSpecs, SizeSpecs, StoredSize, HostName } = components;
    if (!this.role) return;
    this.hostName = getComponentValue(HostName, this.role)?.name ?? "";
    this.capacity = Number(
      getEntitySpecs(components, ContainerSpecs, this.role)?.capacity ?? 0n
    );
    this.size = Number(
      getEntitySpecs(components, SizeSpecs, this.role)?.size ?? 0n
    );
    this.storedSize = Number(
      getComponentValue(StoredSize, this.role)?.value ?? 0n
    );
    const poolsInfo = getEntityPoolsInfo(this.scene.components, this.role);
    poolsInfo.forEach((poolInfo) => {
      const { type, capacity, balance } = poolInfo;
      switch (type) {
        case BLOOD:
          this.blood = balance;
          this.maxBlood = capacity;
          break;
        case STAMINA:
          this.stamina = balance;
          this.maxStamina = capacity;
          break;
        case SOUL:
          this.soul = balance;
          this.maxSoul = capacity;
          break;
        case ATTACK:
          this.attack = balance;
          this.maxAttack = capacity;
          break;
        case DEFENSE:
          this.defense = balance;
          this.maxDefense = capacity;
          break;
        case RANGE:
          this.range = balance;
          this.maxRange = capacity;
          break;
        default:
          break;
      }
    });
  }

  updateBagData() {
    if (this.destroying) return;
    const components = this.scene.components;
    const { Owner } = components;
    if (!this.role) return;
    // erc721
    this.erc721Entities = [
      ...runQuery([HasValue(Owner, { value: this.role })]),
    ];
    // erc20
    this.erc20Items = getERC20Balances(components, this.role as Hex).map(
      (item) => {
        return { type: item.erc20Type, amount: Number(item.balance) };
      }
    );
    // equipment
    this.equipments = getEntitiesInCustodian(components, this.role);
    // console.log("erc721: ", this.erc721Entities);
    // console.log("erc20: ", this.erc20Items);
    // console.log("equipments: ", this.equipments);
  }

  updateEquipment() {
    if (!this.role) return;
    const weapon = getEquipment(this.components, this.role, WEAPON);
    if (!weapon) {
      this.weaponAttack = 0;
      this.weaponRange = 0;
      return;
    }
    const weaponPoolsInfo = getEntityPoolsInfo(this.components, weapon);
    weaponPoolsInfo.forEach((poolInfo) => {
      const { type, balance } = poolInfo;
      switch (type) {
        case ATTACK:
          this.weaponAttack = balance;
          break;
        case RANGE:
          this.weaponRange = balance;
          break;
        default:
          break;
      }
    });
  }

  /**
   * update display every time data changes
   */
  updateDisplay() {
    if (this.hpBar.filledTrack) this.hpBar.filledTrack.alpha = 1;
    if (this.destroying || !this.role) return;
    this.hpNum.text = this.blood + "/" + this.maxBlood;
    this.hpBar.max = this.maxBlood;
    this.hpBar.value = this.blood;
    this.spNum.text = this.stamina + "/" + this.maxStamina;
    this.spBar.max = this.maxStamina;
    this.spBar.value = this.stamina;
    this.characterName.text = this.hostName;

    if (this.attacker) {
      const attack = this.attacker.totalAttack;
      const defense = this.defense;
      const damage =
        attack >= defense ? attack * 2 - defense : (attack * attack) / defense;
      // this.hpBar.value = this.blood - damage;
      if (this.hpBar2) {
        this.hpBar2.destroy();
        delete this.hpBar2;
      }
      const hpBar2W =
        ((this.blood - damage) / this.hpBar.max) * this.hpBar.displayWidth;
      this.hpBar2 = new UIImage(this.scene, "bar_red", {
        nineSlice: 6,
        width: 248,
        height: 24,
        marginY: 78,
        parent: this.infoUI_bars,
        overflow: "hidden",
      });
      this.hpBar2.configWidth = hpBar2W;
      if (this.hpBar.filledTrack) {
        this.hpBar.filledTrack.alpha = 0.8;
        this.scene.tweens.add({
          targets: this.hpBar.filledTrack,
          alpha: 0.6,
          duration: 600,
          repeat: -1,
          yoyo: true,
        });
      }

      this.hpNum.text = this.blood + "(-" + damage + ")/" + this.maxBlood;
    }

    // attack & defense
    if (
      isRole(this.components, this.role) &&
      SceneObjectController.scene.roles[this.role]
    ) {
      SceneObjectController.scene.roles[this.role].totalAttack =
        this.attack + this.weaponAttack;
    } else if (SceneObjectController.scene.buildings[this.role]) {
      SceneObjectController.scene.buildings[this.role].totalAttack =
        this.attack + this.weaponAttack;
    }

    this.atkNum.text = (this.attack + this.weaponAttack).toString();
    this.defNum.text = this.defense.toString();
  }

  /**
   * created in constructor(), to update data according to the query
   */
  createSystem() {
    const { Balance, EntityType, StoredSize } = this.scene.components;
    const { world } = this.scene.network;

    // update pool as long as the role is the same as the decoded entity
    defineSystem(world, [Has(Balance)], ({ entity, type }) => {
      if (type === UpdateType.Exit) return;
      const { owner } = decodeBalanceEntity(entity);
      if (!this.role || this.role !== (owner as Entity)) return;
      this.updateData();
      this.updateDisplay();
    });

    // update max pool, capacity, & size when entitType changes
    defineUpdateSystem(world, [Has(EntityType)], ({ entity }) => {
      if (!this.role || this.role !== entity) return;
      this.updateData();
      this.updateDisplay();
    });

    // update entity stored size
    defineUpdateSystem(world, [Has(StoredSize)], ({ entity }) => {
      if (!this.role || this.role !== entity) return;
      this.updateData();
      this.updateDisplay();
    });
  }

  createBagSystem() {
    const { StoredSize, Equipment } = this.scene.components;
    const { world } = this.scene.network;

    // erc721 & erc20; different from pools, which do not change StoredSize
    defineSystem(world, [Has(StoredSize)], () => {
      this.updateBagData();
      this.updateDisplay();
    });

    // equipment
    defineSystem(world, [Has(Equipment)], ({ entity, type }) => {
      const { owner } = decodeBalanceEntity(entity);
      if (!this.role || this.role !== (owner as Entity)) return;
      this.updateBagData();
      this.updateEquipment();
      this.updateDisplay();
    });
  }
}
