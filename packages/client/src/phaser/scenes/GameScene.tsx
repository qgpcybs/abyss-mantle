import {
  Entity,
  Has,
  HasValue,
  Not,
  UpdateType,
  defineExitSystem,
  defineSystem,
  defineUpdateSystem,
  getComponentValue,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { setup, SetupResult } from "../../mud/setup";
import Phaser from "phaser";
import {
  Direction,
  calculatePathCoords,
  combine,
  movesToPositions,
  getNewTargetTile,
  split,
  splitFromEntity,
  updateMoves,
  combineToEntity,
  calculatePathMoves,
  calculateOtherHostPathCoords,
  coordsToMoves,
} from "../../logics/move";
import {
  BUILDING_TYPES,
  EXPLORE_MENU,
  MAIN_MENU,
  MENU,
  SOURCE,
  TerrainType,
  buildingMapping,
  terrainMapping,
  POOL_TYPES,
  TARGET,
} from "../../constants";
import { Role } from "../objects/Role";
import {
  isBuilding,
  selectFirstHost,
  selectNextHost,
} from "../../logics/entity";
import { POOL, STAMINA, BLOOD } from "../../contract/constants";
import { Hex, toHex, hexToString } from "viem";
import {
  compileGridTerrainValues,
  getTerrainFromTerrainValue,
  GRID_SIZE,
} from "../../logics/terrain";
import { Tile } from "../objects/Tile";
import grass_png from "../../assets/tiles/Grass.png";
import rock_png from "../../assets/tiles/Rock.png";
import tree_png from "../../assets/tiles/Tree.png";
import grass_0_png from "../../assets/tiles/terrains/grass_0.png";
import grass_2_png from "../../assets/tiles/terrains/grass_2.png";
import mud_1_png from "../../assets/tiles/terrains/mud_1.png";
import ocean_wall_0_png from "../../assets/tiles/terrains/ocean_wall_0.png";
import mountain_0_png from "../../assets/tiles/terrains/mountain_0.png";
import cliff_0_png from "../../assets/tiles/terrains/cliff_0.png";
import gravel_0_png from "../../assets/tiles/terrains/gravel_0.png";
import boundary_json from "../../assets/tiles/terrains/boundary.json";
import boundary_reverse_json from "../../assets/tiles/terrains/boundary_reverse.json";
import ocean_png from "../../assets/tiles/terrains/ocean.png";
import pine_12_png from "../../assets/tiles/props/trees/pine_12.png";
import mine_png from "../../assets/tiles/mine.png";

import safe_png from "../../assets/hosts/safe.png";
import repository_png from "../../assets/hosts/repository.png";
import mine_shaft_png from "../../assets/hosts/mine-shaft.png";
import field_png from "../../assets/hosts/field.png";
import field_berry_1_png from "../../assets/hosts/field-berry-1.png";
import field_berry_2_png from "../../assets/hosts/field-berry-2.png";
import bridge_png from "../../assets/hosts/bridge.png";

import farmer_1_1_png from "../../assets/hosts/sprites/farmer_1_1.png";
import farmer_1_2_png from "../../assets/hosts/sprites/farmer_1_2.png";
import farmer_1_3_png from "../../assets/hosts/sprites/farmer_1_3.png";
import farmer_1_4_png from "../../assets/hosts/sprites/farmer_1_4.png";
import farmer_1_5_png from "../../assets/hosts/sprites/farmer_1_5.png";

import cursor_png from "../../assets/ui/cursor.png";

import highlight_move_png from "../../assets/ui/highlight_move.png";
import highlight_attack_png from "../../assets/ui/highlight_attack.png";
import hightlight_attackx_png from "../../assets/ui/highlight_attackx.png";
import hightlight_build_png from "../../assets/ui/highlight_build.png";
import hightlight_error_png from "../../assets/ui/highlight_error.png";
import hightlight_enter_png from "../../assets/ui/highlight_enter.png";
import hightlight_png from "../../assets/ui/highlight.png";

import { castToBytes32 } from "../../utils/encode";
import { TileHighlight } from "../objects/TileHighlight";
import { updateNeighborGrids } from "../../mud/setupTiles";
import { syncComputedComponents } from "../../mud/syncComputedComponents";
import { Building } from "../objects/Building";
import { Mine } from "../objects/Mine";
import { UIScene } from "./UIScene";
import { getHostPosition } from "../../logics/path";
import { isDropContainer, splitDropContainer } from "../../logics/drop";
import { Drop } from "../objects/Drop";
import { Cursor } from "../objects/Cursor";
import { UIController } from "../components/controllers/UIController";
import { SceneObjectController } from "../components/controllers/SceneObjectController";
import { PlayerInput } from "../components/controllers/PlayerInput";
import { GameData } from "../components/GameData";

export class GameScene extends Phaser.Scene {
  network: SetupResult["network"];
  components: SetupResult["components"];
  systemCalls: SetupResult["systemCalls"];

  tileSize = 16;
  minZoomLevel = 1.5;
  maxZoomLevel = 4;

  sortLastDate: number = 0;
  sortFlag: boolean = false;

  tilesLayer0: Record<Entity, Phaser.GameObjects.Sprite> = {};
  tiles: Record<Entity, Tile> = {};
  // source entityId -> tileCoordId
  selectedTiles: Record<Entity, Entity> = {};
  tileHighlights: Record<Entity, TileHighlight> = {};
  // tileId -> Building class
  buildings: Record<Entity, Building> = {};
  // gridId -> Mine class
  mines: Record<Entity, Mine> = {};
  // tileId -> drop
  drops: Record<Entity, Drop> = {};

  roles: Record<Entity, Role> = {};

  hostTextures: {
    key: string;
    url: string;
    frameWidth?: number;
    frameHeight?: number;
  }[] = [];

  cursor?: Cursor;

  constructor(
    setupResult: SetupResult,
    config?: Phaser.Types.Scenes.SettingsConfig
  ) {
    super({ ...config, key: "GameScene", active: true });
    this.network = setupResult.network;
    this.components = setupResult.components;
    this.systemCalls = setupResult.systemCalls;
  }

  preload() {
    GameData.preload(this);
    // tiles texture
    this.load.image("plain", grass_png);
    this.load.image("mountain", rock_png);
    this.load.image("forest", tree_png);
    this.load.atlas("grass_boundary", grass_0_png, boundary_json);
    this.load.atlas("grass_2", grass_2_png, boundary_reverse_json);
    this.load.atlas("mud_1", mud_1_png, boundary_reverse_json);
    this.load.atlas("ocean_boundary", ocean_wall_0_png, boundary_json);
    this.load.atlas("mountain_boundary", mountain_0_png, boundary_json);
    this.load.atlas("gravel_0", gravel_0_png, boundary_json);
    this.load.image("ocean", ocean_png);
    this.load.image("pine_12", pine_12_png);
    this.load.image("mine", mine_png);
    this.load.image("safe", safe_png);
    this.load.image("repository", repository_png);
    this.load.image("mine-shaft", mine_shaft_png);
    this.load.image("field", field_png);
    this.load.image("field-berry-1", field_berry_1_png);
    this.load.image("field-berry-2", field_berry_2_png);
    this.load.image("bridge", bridge_png);

    // player texture
    this.hostTextures = [
      { key: "host-farmer1", url: farmer_1_1_png },
      { key: "host-farmer2", url: farmer_1_2_png },
      { key: "host-farmer3", url: farmer_1_3_png },
      { key: "host-farmer4", url: farmer_1_4_png },
      { key: "host-farmer5", url: farmer_1_5_png },
    ];
    for (let i = 0; i < this.hostTextures.length; i++) {
      this.load.spritesheet(
        this.hostTextures[i].key,
        this.hostTextures[i].url,
        {
          frameWidth: this.hostTextures[i]?.frameWidth ?? 64,
          frameHeight: this.hostTextures[i]?.frameHeight ?? 64,
        }
      );
    }

    // cursor
    this.load.spritesheet("ui-cursor", cursor_png, {
      frameWidth: 32,
      frameHeight: 32,
    });

    // tile highlight
    this.load.image("highlight-move", highlight_move_png);
    this.load.image("highlight-attack", highlight_move_png);
    this.load.image("highlight-attack2", highlight_attack_png);
    this.load.image("highlight-attack3", hightlight_attackx_png);
    this.load.image("highlight-build", hightlight_build_png);
    this.load.image("highlight-error", hightlight_error_png);
    this.load.image("highlight-enter", hightlight_enter_png);
    this.load.spritesheet("highlight", hightlight_png, {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    const {
      TileValue,
      MineValue,
      Terrain,
      TerrainValues,
      TargetTile,
      Path,
      TileEntity,
      EntityType,
      StoredSize,
      Owner,
      SelectedHost,
      SelectedEntity,
      Commander,
      RoleDirection,
      ConsoleMessage,
    } = this.components;
    const world = this.network.world;
    const camera = this.cameras.main;
    camera.setZoom(3);
    this.createAnimations();
    this.cursor = new Cursor(this, TARGET);
    SceneObjectController.init(this);
    PlayerInput.listenStart(this);
    this.scale.on("resize", this.resizeListener, this);

    /**
     * load/unload tile sprites on map; TileValue is a client component that is updated when character moves, which is handled by useSyncComputedComponents
     */
    defineSystem(world, [Has(TileValue)], ({ entity, type }) => {
      if (type === UpdateType.Exit) {
        return this.unloadTile(entity);
      } else {
        // (type === UpdateType.Enter)
        const value = getComponentValue(TileValue, entity)!.value;
        this.loadTile(entity, value);
        // sort
        this.sortFlag = true;
      }
    });

    /**
     * update curr grid's TerrainValues & tile values on curr & neighbor grids, which will recalc TileValue and trigger loadTile.
     * call it in phaser scene so as to only render worldView.contains
     */
    defineSystem(world, [Has(Terrain)], ({ entity }) => {
      const gridCoord = splitFromEntity(entity);
      const worldView = this.cameras.main.worldView;
      const position = {
        x: gridCoord.x * GRID_SIZE * this.tileSize,
        y: gridCoord.y * GRID_SIZE * this.tileSize,
      };
      if (!worldView.contains(position.x, position.y)) return;
      // const prevValues = getComponentValue(TerrainValues, entity)?.value;
      const terrainValues = compileGridTerrainValues(
        this.components,
        this.systemCalls,
        entity
      );
      setComponent(TerrainValues, entity, { value: terrainValues });
      updateNeighborGrids(this.components, entity);
    });

    defineSystem(world, [Has(TargetTile)], ({ entity, type }) => {
      const prevTileId = this.selectedTiles[entity];
      this.tiles[prevTileId]?.unselect();
      if (type === UpdateType.Exit) {
        return delete this.selectedTiles[entity];
      }
      const currTileId = getComponentValue(TargetTile, entity)?.value;
      if (!currTileId) return;
      this.selectedTiles[entity] = currTileId;
      const tile = this.tiles[currTileId];
      this.cursor?.moveTo(tile.x, tile.y);
      // this.tiles[currTileId]?.select();
      // const pathCoords = calculatePathCoords(this.components, entity);
    });

    defineSystem(world, [Has(MineValue)], ({ entity, type }) => {
      if (type === UpdateType.Exit) {
        this.mines[entity]?.destroy();
        return delete this.mines[entity];
      }
      this.mines[entity]?.destroy();
      this.mines[entity] = new Mine(this, this.components, {
        entity,
        onClick: () => this.sourceSelectHandler(entity),
      });
    });

    // defineSystem(world, [Has(TerrainValue)], ({ entity, type }) => {
    //   const { x, y } = split(BigInt(entity));
    //   if (type === UpdateType.Exit) {
    //     return this.unloadTile(x, y);
    //   }
    //   const value = getComponentValue(TerrainValue, entity)!.value;
    //   this.loadTile(x, y, value);
    //   console.log("terrain", x, y, value);
    // });

    // render roles ~ hosts
    // TODO: add loadRole & unloadRole to handle role's enter & exit; therefore, when tile is loaded/unloaded, call loadRole/unloadRole on it

    // drop container
    defineSystem(
      world,
      [Has(Path), Has(StoredSize), Not(Commander)],
      ({ entity, type }) => {
        // TODO: add withinView check to render sprite
        if (!isDropContainer(entity)) return;
        this.drops[entity]?.destroy();
        const size = getComponentValue(StoredSize, entity)?.value ?? 0n;
        if (size === 0n) return;
        if (type === UpdateType.Exit) {
          return delete this.drops[entity];
        }
        this.drops[entity] = new Drop(this, this.components, {
          entity,
        });
      }
    );

    defineSystem(world, [Has(this.components.MockPath)], ({ entity, type }) => {
      if (type === UpdateType.Exit) {
        // const path = getComponentValue(Path, entity);
        // if (!path) return;
        // return this.roles[entity]?.updatePath()
      }
      const path = getComponentValue(this.components.MockPath, entity);
      // return this.roles[entity]?.updatePath(path)
    });

    // role on map
    defineSystem(world, [Has(Path), Has(Commander)], ({ entity, type }) => {
      if (type === UpdateType.Exit) {
        this.roles[entity]?.destroy();
        return delete this.roles[entity];
      } else if (!this.roles[entity]) {
        this.roles[entity] = new Role(this, entity, {
          isPlayer:
            getComponentValue(Commander, entity)?.value ===
            this.network.playerEntity,
          onClick: () => this.sourceSelectHandler(entity),
        });
      } else {
        // Non-self role originally displayed on the scene needs movement animation
        const role = this.roles[entity];
        role.isMoving = false;
        if (role.moveTween) {
          role.moveTween.timeScale = 1.25; // speed up since blockchain has confrimed
        } else {
          const path = getComponentValue(Path, entity);
          if (!path) return;
          if (path && path.toX === role.tileX && path.toY === role.tileY) {
            role.initState();
          } else {
            const path2 = calculateOtherHostPathCoords(
              this.components,
              { x: path.toX, y: path.toY },
              role.tilePosition,
              role.entity
            );
            if (path2) {
              const moves = coordsToMoves(path2);
              if (moves && moves.length > 0) {
                role.movesAnimation(moves);
                role.moveTween!.timeScale = 2;
              }
            } else role.setTilePosition(path.toX, path.toY);
          }
        }
      }
      // update tile highlight
      if (this.tileHighlights[entity]) {
        this.tileHighlights[entity].clearHighlight();
        delete this.tileHighlights[entity];
      }
    });

    // // building on map
    defineExitSystem(
      world,
      [Has(Path), Has(this.components.Creator)],
      ({ entity }) => {
        return this.unloadBuilding(entity);
      }
    );

    /**
     * rn, load/unload building because role is handled by Path
     * note: entity is tileId
     */
    defineSystem(world, [Has(TileEntity)], ({ entity, type }) => {
      if (type === UpdateType.Exit) {
        return this.unloadTileEntity(entity);
      }
      this.loadTileEntity(entity);
      // sort
      this.sortFlag = true;
    });

    defineSystem(
      world,
      [HasValue(EntityType, { value: POOL }), Has(StoredSize)],
      ({ entity, type }) => {
        const role = getComponentValue(Owner, entity)?.value as Entity;
        if (!role) return;
        this.roles[role]?.updateProperties();
      }
    );

    // // render moves assuming they are all valid
    // defineSystem(world, [Has(Moves)], ({ entity, type }) => {
    //   this.hosts[entity]?.movesUpdate();
    // });

    // defineSystem(world, [Has(RoleDirection)], ({ entity, type }) => {
    //   this.hosts[entity]?.directionUpdate();
    // });

    // defineSystem(world, [Has(SelectedHost)], ({ entity, type }) => {
    //   const role = getComponentValue(SelectedHost, SOURCE)?.value as Entity;
    //   if (!role) return;
    //   if (type === UpdateType.Exit) {
    //     return this.hosts[role]?.unfollow();
    //   }
    //   return this.hosts[role]?.follow();
    // });

    // panning
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.buttons) {
        camera.scrollX -=
          (pointer.position.x - pointer.prevPosition.x) / camera.zoom;
        camera.scrollY -=
          (pointer.position.y - pointer.prevPosition.y) / camera.zoom;
      }
    });

    // zooming
    let lastPointerPosition = { x: 0, y: 0, worldX: 0, worldY: 0 };
    this.input.on("wheel", (pointer: Phaser.Input.Pointer) => {
      if (
        Phaser.Math.Distance.BetweenPoints(pointer, lastPointerPosition) > 2
      ) {
        lastPointerPosition = {
          x: pointer.x,
          y: pointer.y,
          worldX: pointer.worldX,
          worldY: pointer.worldY,
        };
      }
      const deltaZoom = 1 + 0.05 * (pointer.deltaY < 0 ? 1 : -1);
      // console.log(camera.zoom, deltaZoom);
      // const newZoom = this.maxZoomLevel;
      const newZoom = Phaser.Math.Clamp(
        camera.zoom * deltaZoom,
        this.minZoomLevel,
        this.maxZoomLevel
      );
      const deltaScrollX =
        (lastPointerPosition.worldX - camera.scrollX) * (camera.zoom / newZoom);
      const deltaScrollY =
        (lastPointerPosition.worldY - camera.scrollY) * (camera.zoom / newZoom);
      camera.scrollX = lastPointerPosition.worldX - deltaScrollX;
      camera.scrollY = lastPointerPosition.worldY - deltaScrollY;
      camera.zoom = newZoom;
    });
  }

  // rn, used to render building because role is handled by Path
  loadTileEntity(tileId: Entity) {
    const building = getComponentValue(this.components.TileEntity, tileId)
      ?.value as Entity;
    if (!isBuilding(this.components, building)) return;
    this.loadBuilding(tileId, building);
  }

  unloadTileEntity(tileId: Entity) {
    const building = getComponentValue(this.components.TileEntity, tileId)
      ?.value as Entity;
    // if (!isBuilding(this.components, building)) return;
    this.unloadBuilding(building);
  }

  loadBuilding(tileId: Entity, building: Entity) {
    if (!this.buildings[building]) {
      this.buildings[building] = new Building(this, {
        tileId,
        entity: building,
      });
    } else {
      const newTileCoord = splitFromEntity(tileId);
      if (
        newTileCoord.x < this.buildings[building].tileCoord.x ||
        newTileCoord.y > this.buildings[building].tileCoord.y
      ) {
        this.buildings[building].tileId = tileId;
        this.buildings[building].tileCoord = newTileCoord;
        this.buildings[building].tileX = newTileCoord.x;
        this.buildings[building].tileY = newTileCoord.y;
      }
    }
  }

  unloadBuilding(building: Entity) {
    this.buildings[building]?.destroy();
    delete this.buildings[building];
  }

  loadTile(entity: Entity, tileValue: string[]) {
    this.tiles[entity]?.destroy();
    // console.log("loadTile", entity, tileValue);
    this.tiles[entity] = new Tile(this, this.components, {
      entity,
      tileValue,
      onClick: () => this.sourceSelectHandler(entity),
    });
    this.loadTileEntity(entity);
  }

  unloadTile(entity: Entity) {
    this.tiles[entity]?.destroy();
    delete this.tiles[entity];
    this.unloadTileEntity(entity);
  }

  update() {
    if (this.sortFlag) {
      const date = Date.now();
      if (date > this.sortLastDate + 150) {
        this.sortLastDate = date;
        this.sortFlag = false;
        this.sortDepth();
      }
    }
  }

  sortDepth() {
    const sceneObjects: {
      entity: Entity;
      id: number;
      x: number;
      y: number;
      type: "building" | "role" | "tile";
    }[] = [];

    for (const entity in this.tiles) {
      const tile = this.tiles[entity as Entity];
      const tileSprites = tile.tileSprites;
      for (const index in tileSprites) {
        if (tileSprites[index].texture.key === "pine_12")
          sceneObjects.push({
            entity: entity as Entity,
            id: Number(index),
            x: tile.tileX,
            y: tile.tileY,
            type: "tile",
          });
      }
    }
    for (const entity in this.roles) {
      sceneObjects.push({
        entity: entity as Entity,
        id: 0,
        x: this.roles[entity as Entity].tileX,
        y: this.roles[entity as Entity].tileY,
        type: "role",
      });
    }
    for (const entity in this.buildings) {
      sceneObjects.push({
        entity: entity as Entity,
        id: 0,
        x: this.buildings[entity as Entity].tileX,
        y: this.buildings[entity as Entity].tileY,
        type: "building",
      });
    }

    sceneObjects.sort((a, b) => a.y - b.y);
    let depth = 11;
    sceneObjects.forEach((entityInfo, index) => {
      const { entity, id, y, type } = entityInfo;
      if (index > 0 && sceneObjects[index - 1].y < y) depth++;
      if (type === "building") {
        this.buildings[entity as Entity].setDepth(depth);
      } else if (type === "role") {
        this.roles[entity as Entity].setDepth(depth);
      } else if (type === "tile") {
        const tileSprites = this.tiles[entity as Entity].tileSprites;
        tileSprites[id].setDepth(depth);
        tileSprites[id].setAlpha(1);
      }
    });
    this.cursor?.setDepth(Math.max(5001, depth++));

    sceneObjects.sort((a, b) => Math.round(a.x) - Math.round(b.x));
    sceneObjects.forEach((entityInfo, index) => {
      const { x, y, type } = entityInfo;
      if (type === "role") {
        for (let i = index + 1; sceneObjects[i]; i++) {
          if (Math.round(sceneObjects[i].x) === Math.round(x)) {
            if (sceneObjects[i].type === "tile" && sceneObjects[i].y <= y + 4) {
              const tileSprites =
                this.tiles[sceneObjects[i].entity as Entity].tileSprites;
              tileSprites[sceneObjects[i].id].setAlpha(0.25);
            }
          } else {
            break;
          }
        }
      }
    });
  }

  createAnimations() {
    // host
    for (let i = 0; i < this.hostTextures.length; i++) {
      this.anims.create({
        key: this.hostTextures[i].key + "-idle-right",
        frames: this.anims.generateFrameNumbers(this.hostTextures[i].key, {
          start: 0,
          end: 5,
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: this.hostTextures[i].key + "-walk-right",
        frames: this.anims.generateFrameNumbers(this.hostTextures[i].key, {
          start: 6,
          end: 11,
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: this.hostTextures[i].key + "-dead-right",
        frames: this.anims.generateFrameNumbers(this.hostTextures[i].key, {
          start: 12,
          end: 17,
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: this.hostTextures[i].key + "-sword-right",
        frames: this.anims.generateFrameNumbers(this.hostTextures[i].key, {
          start: 18,
          end: 23,
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: this.hostTextures[i].key + "-bow-right",
        frames: this.anims.generateFrameNumbers(this.hostTextures[i].key, {
          start: 24,
          end: 29,
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: this.hostTextures[i].key + "-attack-right",
        frames: this.anims.generateFrameNumbers(this.hostTextures[i].key, {
          start: 36,
          end: 41,
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: this.hostTextures[i].key + "-farming-right",
        frames: this.anims.generateFrameNumbers(this.hostTextures[i].key, {
          start: 60,
          end: 65,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // cursor
    this.anims.create({
      key: "ui-cursor-active",
      frames: this.anims.generateFrameNumbers("ui-cursor", {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: -1,
    });

    // highlight
    this.anims.create({
      key: "highlight-active",
      frames: [{ key: "highlight", frame: 5 }],
    });
  }

  sourceSelectHandler(entity: Entity) {
    const { SelectedHost } = this.components;
    if (getComponentValue(SelectedHost, SOURCE)?.value === entity) {
      removeComponent(SelectedHost, SOURCE);
    } else {
      setComponent(SelectedHost, SOURCE, {
        value: entity,
      });
    }
  }

  // targetSelectHandler(entity: Entity) {
  //   const { SelectedHost } = this.components;
  //   if (getComponentValue(SelectedHost, TARGET)?.value === entity) {
  //     removeComponent(SelectedHost, TARGET);
  //   } else {
  //     setComponent(SelectedHost, TARGET, {
  //       value: entity,
  //     });
  //   }
  // }

  resizeListener(gameSize: Phaser.Structs.Size) {
    this.cameras.resize(gameSize.width, gameSize.height);
  }
}
