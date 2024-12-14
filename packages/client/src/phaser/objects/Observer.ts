import { Entity, setComponent } from "@latticexyz/recs";
import { isBuilding, isRole, selectHost } from "../../logics/entity";
import { Direction } from "../../logics/move";
import { getTargetTerrainData } from "../../logics/terrain";
import { SceneObjectController } from "../components/controllers/SceneObjectController";
import { UIController } from "../components/controllers/UIController";
import { Building } from "./Building";
import { Role } from "./Role";
import { SceneObject } from "./SceneObject";
import { TARGET } from "../../constants";

export class Observer extends SceneObject {
  onMenuPressed(event: KeyboardEvent) {
    super.onMenuPressed(event);
    const menu = UIController.scene.mainMenu;
    if (!menu) return;
    menu.show();
  }

  onUpPressed(event: KeyboardEvent) {
    super.onUpPressed(event);
    SceneObjectController.setTargetTilePosition(Direction.UP);
  }
  onDownPressed(event: KeyboardEvent) {
    super.onDownPressed(event);
    SceneObjectController.setTargetTilePosition(Direction.DOWN);
  }
  onLeftPressed(event: KeyboardEvent) {
    super.onLeftPressed(event);
    SceneObjectController.setTargetTilePosition(Direction.LEFT);
  }
  onRightPressed(event: KeyboardEvent) {
    super.onRightPressed(event);
    SceneObjectController.setTargetTilePosition(Direction.RIGHT);
  }

  onConfirmPressed(event: KeyboardEvent) {
    super.onConfirmPressed(event);
    const tileData = getTargetTerrainData(
      this.components,
      this.scene.systemCalls
    );
    const entity = tileData?.coordEntity;
    if (!entity) return;
    const type = entity
      ? isRole(this.components, entity)
        ? "role"
        : isBuilding(this.components, entity)
          ? "building"
          : undefined
      : undefined;
    if (type === "role") {
      const entityObj: Role = this.scene.roles[entity];
      if (entityObj.isMoving) return;
      if (entityObj.isPlayer) {
        SceneObjectController.focus = entityObj;
        UIController.scene.actionMenu?.show(entityObj);
      } else {
      }
      this.updateSelectedHost(entityObj.entity);
      UIController.scene.characterInfo?.show(entityObj);
    } else if (type === "building") {
      const building: Building = this.scene.buildings[entity];
      SceneObjectController.focus = building;
      UIController.scene.buildingMenu?.show(building);
      // this.updateSelectedHost(building.entity);
      setComponent(this.components.SelectedHost, TARGET, {
        value: building.entity,
      });
    }
  }

  updateSelectedHost(entity: Entity) {
    selectHost(this.components, entity);
  }
}
