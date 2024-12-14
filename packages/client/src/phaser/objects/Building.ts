import {
  Entity,
  getComponentValue,
  runQuery,
  HasValue,
} from "@latticexyz/recs";
import { ClientComponents } from "../../mud/createClientComponents";
import { GameScene } from "../scenes/GameScene";
import { SceneObject } from "./SceneObject";
import { Vector } from "../../utils/vector";
import { splitFromEntity } from "../../logics/move";
import { getEntitySpecs } from "../../logics/entity";
import { GameData } from "../components/GameData";
import { BuildingData } from "../../api/data";
import { Hex, hexToString } from "viem";
import { getStaking } from "../../contract/hashes";
import { SOURCE } from "../../constants";
import { encodeTypeEntity } from "../../utils/encode";
import { unixTimeSecond } from "../../utils/time";

export class Building extends SceneObject {
  tileId: Entity;
  data: BuildingData;
  buildingSprite: Phaser.GameObjects.Sprite;
  entity: Entity;
  tileCoord: Vector;

  fieldSi: number = 0;

  totalAttack: number = 0;

  constructor(
    scene: GameScene,
    {
      tileId,
      entity,
      texture,
      scale = 1,
    }: {
      tileId: Entity;
      entity: Entity;
      texture?: string;
      scale?: number;
    }
  ) {
    super(scene, entity);
    const { EntityType, BuildingSpecs } = this.components;
    this.entity = entity;
    this.tileId = tileId;
    this.tileCoord = splitFromEntity(tileId);

    const buildingType = getComponentValue(EntityType, entity)?.value as Hex;
    this.data = GameData.getDataByType(
      "buildings",
      hexToString(buildingType).replace(/\0/g, "") ?? "SAFE"
    ) as BuildingData;
    if (!texture) texture = this.data.sceneImg;

    const buildingSpecs = getEntitySpecs(
      this.components,
      BuildingSpecs,
      entity
    )!;

    const { width, height } = buildingSpecs;

    // const buildingNumber = BUILDING_TYPES.indexOf(buildingType as Hex);
    // // buildingMapping[buildingNumber];

    this.tileX = this.tileCoord.x;
    this.tileY = this.tileCoord.y;
    this.root.setDepth(13).setScale(scale);

    this.buildingSprite = new Phaser.GameObjects.Sprite(
      this.scene,
      0,
      0,
      texture
    );

    const dw = this.buildingSprite.displayWidth;
    const dh = this.buildingSprite.displayHeight;
    const offsetX = (dw + (1 - width) * this.tileSize) / (2 * dw);
    const offsetY = (dh + (height - 1) * this.tileSize) / (2 * dh);
    this.buildingSprite.setOrigin(offsetX, offsetY);
    this.root.add(this.buildingSprite);

    if (this.data.type === "FIELD") {
      this.fieldSi = setInterval(() => {
        this.updateField();
      }, 1200);
      this.updateField();
    }
  }

  updateField() {
    const { StakingInfo, SelectedHost, StakeSpecs } = this.components;
    const hasStaking =
      [...runQuery([HasValue(StakingInfo, { building: this.entity })])].length >
      0;
    if (hasStaking) {
      const role = getComponentValue(SelectedHost, SOURCE)?.value as Entity;
      if (!role) return;
      const stakingId = getStaking(role as Hex, this.entity as Hex) as Entity;
      if (!stakingId) return;
      const lastUp = getComponentValue(StakingInfo, stakingId)?.lastUpdated;
      if (!lastUp) return;
      const outputType = getComponentValue(StakingInfo, stakingId)!.outputType;
      const encodedType = encodeTypeEntity(outputType as Hex) as Entity;
      const timeCost = getComponentValue(StakeSpecs, encodedType)?.timeCost;
      if (!timeCost) return;
      const time = lastUp + timeCost - unixTimeSecond();
      const remained = time > 0 ? time : 0;
      if (remained === 0) {
        this.texture = this.data.sceneImg + "-berry-2";
      } else {
        this.texture = this.data.sceneImg + "-berry-1";
      }
    } else {
      this.texture = this.data.sceneImg;
    }
  }

  doDamageAnimation() {
    this.scene.tweens.add({
      targets: this,
      props: { ["tint"]: 0xff0000 },
      duration: 250,
      repeat: 0,
      yoyo: true,
      onComplete: () => {
        this.buildingSprite.clearTint();
      },
    });
    return this.buildingSprite;
  }

  destroy() {
    this.buildingSprite.destroy();
  }

  get texture(): string {
    return this.buildingSprite.texture.key;
  }

  set texture(value: string) {
    if (value !== this.texture) this.buildingSprite.setTexture(value);
  }

  get tint() {
    return this.buildingSprite.tint;
  }

  set tint(value: number) {
    this.buildingSprite.setTint(value);
  }
}
